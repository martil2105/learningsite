/*
  Other ways to score the same customers: six distances on a fixed clustering,
  the benchmarks k-means has to beat, and k-means-- (Chawla & Gionis 2013),
  which leaves the farthest points out of every centroid update.
*/
import { mulberry32 } from "./rng.js";
import { col, mean } from "./prep.js";
import { d2, seedPP, assignTo } from "./cluster.js";

export function invert(S) {
  const n = S.length, A = S.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    if (Math.abs(A[piv][c]) < 1e-12) return null; // singular
    [A[c], A[piv]] = [A[piv], A[c]];
    const d = A[c][c]; for (let j = 0; j < 2 * n; j++) A[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const m = A[r][c]; for (let j = 0; j < 2 * n; j++) A[r][j] -= m * A[c][j]; }
  }
  return A.map((r) => r.slice(n));
}

export const DISTANCES = ["euclid", "manhattan", "chebyshev", "cosine", "mahalGlobal", "mahalCluster"];

/* Distance of each customer to their own centroid. NaN where it's undefined. */
export function distScores(X, f, kind, raw) {
  const { C, lab } = f, p = X[0].length, k = C.length;
  if (kind === "euclid") return X.map((x, i) => Math.sqrt(d2(x, C[lab[i]])));
  if (kind === "manhattan") return X.map((x, i) => x.reduce((s, v, j) => s + Math.abs(v - C[lab[i]][j]), 0));
  if (kind === "chebyshev") return X.map((x, i) => Math.max(...x.map((v, j) => Math.abs(v - C[lab[i]][j]))));
  if (kind === "cosine") {
    // On the uncentred log1p profile: the shape of a customer's activity.
    const Y = raw.map((r) => r.map((v) => Math.log1p(v)));
    const Cc = Array.from({ length: k }, () => new Array(p).fill(0)), n = new Array(k).fill(0);
    Y.forEach((y, i) => { n[lab[i]]++; y.forEach((v, j) => (Cc[lab[i]][j] += v)); });
    Cc.forEach((c, j) => c.forEach((_, q) => (c[q] /= Math.max(1, n[j]))));
    return Y.map((y, i) => { const c = Cc[lab[i]]; let d = 0, a = 0, b = 0; y.forEach((v, q) => { d += v * c[q]; a += v * v; b += c[q] * c[q]; }); return 1 - d / Math.sqrt(a * b || 1); });
  }
  if (kind === "mahalGlobal" || kind === "mahalCluster") {
    const inv = [];
    for (let c = 0; c < k; c++) {
      const ids = kind === "mahalGlobal" ? X.map((_, i) => i) : lab.map((l, i) => (l === c ? i : -1)).filter((i) => i >= 0);
      const mu = kind === "mahalGlobal" ? Array.from({ length: p }, (_, j) => mean(col(X, j))) : C[c];
      const S = Array.from({ length: p }, () => new Array(p).fill(0));
      ids.forEach((i) => { for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] += (X[i][a] - mu[a]) * (X[i][b] - mu[b]) / ids.length; });
      inv.push(invert(S));
      if (kind === "mahalGlobal") { for (let t = 1; t < k; t++) inv.push(inv[0]); break; }
    }
    return X.map((x, i) => {
      const c = C[lab[i]], Si = inv[lab[i]]; if (!Si) return NaN;
      const dv = x.map((v, j) => v - c[j]); let s = 0;
      for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) s += dv[a] * Si[a][b] * dv[b];
      return Math.sqrt(Math.max(0, s));
    });
  }
  throw new Error(kind);
}
/* Undefined scores go to the bottom of the ranking. */
export const defined = (s) => s.map((v) => (Number.isNaN(v) ? -Infinity : v));

export function knnScore(X, kn) {
  return X.map((x, i) => { const d = []; for (let t = 0; t < X.length; t++) if (t !== i) d.push(d2(x, X[t])); d.sort((a, b) => a - b); return Math.sqrt(d[kn - 1]); });
}
export const maxAbsZ = (X) => X.map((x) => Math.max(...x.map(Math.abs)));

// Isolation forest (Liu, Ting & Zhou 2008): 100 trees on subsamples of 256.
export function iforest(X, seed, trees = 100, psi = 256) {
  const r = mulberry32(seed), n = X.length, p = X[0].length, hmax = Math.ceil(Math.log2(psi));
  const cfun = (m) => (m <= 1 ? 0 : 2 * (Math.log(m - 1) + 0.5772156649) - (2 * (m - 1)) / m);
  const build = (ids, h) => {
    if (h >= hmax || ids.length <= 1) return { size: ids.length };
    const q = Math.floor(r() * p); let mn = Infinity, mx = -Infinity; ids.forEach((i) => { mn = Math.min(mn, X[i][q]); mx = Math.max(mx, X[i][q]); });
    if (mn === mx) return { size: ids.length };
    const s = mn + (mx - mn) * r();
    return { q, s, l: build(ids.filter((i) => X[i][q] < s), h + 1), r: build(ids.filter((i) => X[i][q] >= s), h + 1) };
  };
  const forest = Array.from({ length: trees }, () => build(Array.from({ length: psi }, () => Math.floor(r() * n)), 0));
  const path = (x, t, h) => (t.size !== undefined ? h + cfun(t.size) : path(x, x[t.q] < t.s ? t.l : t.r, h + 1));
  return X.map((x) => Math.pow(2, -mean(forest.map((t) => path(x, t, 0))) / cfun(psi)));
}

export function kmeansMinus(X, k, l, seed, nInit = 5) {
  const r = mulberry32(seed); let best = null;
  for (let t = 0; t < nInit; t++) {
    let C = seedPP(X, k, r), lab;
    for (let it = 0; it < 100; it++) {
      lab = assignTo(X, C);
      const d = X.map((x, i) => d2(x, C[lab[i]]));
      const cut = [...d].sort((a, b) => b - a)[l - 1];
      const p = X[0].length, S = Array.from({ length: k }, () => new Array(p).fill(0)), n = new Array(k).fill(0);
      X.forEach((x, i) => { if (d[i] >= cut) return; n[lab[i]]++; x.forEach((v, q) => (S[lab[i]][q] += v)); });
      const Cn = S.map((s, j) => (n[j] ? s.map((v) => v / n[j]) : C[j]));
      const moved = Cn.some((c, j) => d2(c, C[j]) > 1e-12); C = Cn; if (!moved) break;
    }
    lab = assignTo(X, C);
    const d = X.map((x, i) => d2(x, C[lab[i]])), cut = [...d].sort((a, b) => b - a)[l - 1];
    const inertia = d.reduce((s, v) => s + (v < cut ? v : 0), 0);
    if (!best || inertia < best.inertia) best = { C, lab, inertia };
  }
  return best;
}
