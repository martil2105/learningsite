// Extensions for the rewritten plan: data scenarios, a configurable
// preprocessing pipeline, distances, validity indices, stability tools,
// benchmark detectors and a surrogate tree. Builds on lib.mjs, which is left
// unchanged so the original assertions still hold.
import * as L from "./lib.mjs";
export { L };

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const sdev = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
export const colOf = (M, j) => M.map((r) => r[j]);
export { mean, sdev };

// ---------------------------------------------------------------------------
// Data scenarios. Each returns a new month array (rows {kind, seg, x, ...}).
export function addDormant(month, n, seed) {
  const r = L.mulberry32(seed);
  const extra = Array.from({ length: n }, () => {
    const inflow = r() < 0.5 ? 0 : 20 + 200 * r(); // interest, a stray refund
    return { kind: "dormant", seg: "dormant", x: [inflow, 0, L.poisson(r, 0.3), 0, 0, inflow > 0 ? 1 : 0] };
  });
  return [...month, ...extra];
}
// Own-account transfers: a share of ordinary customers move savings through the
// account, which inflates inflow and outflow together (pass-through ~ 1).
export function addInternal(month, share, seed) {
  const r = L.mulberry32(seed);
  return month.map((c) => {
    if (c.kind !== "normal" || r() >= share) return c;
    const t = 60000 * Math.exp(0.5 * L.gaussian(r));
    const x = c.x.slice(); x[0] += t; x[1] += t; x[2] += 2; x[5] += 1;
    return { ...c, internal: true, x };
  });
}
// A binary attribute unrelated to risk, e.g. "has a foreign address".
export function binaryColumn(month, prevalence, seed) {
  const r = L.mulberry32(seed);
  return month.map(() => (r() < prevalence ? 1 : 0));
}
// Missingness mask for column j. mech: "mcar" | "legacy" (a system that also
// holds the ring's accounts) ; returns boolean array.
export function missingMask(month, rate, seed, mech = "mcar") {
  const r = L.mulberry32(seed);
  return month.map((c) => (mech === "ring" && c.kind === "mule" ? r() < 0.5 : r() < rate));
}

// ---------------------------------------------------------------------------
// Preprocessing pipeline. cfg = {
//   impute: "median"|"mean"|"zero"|"indicator", missing: {j, mask},
//   capQ: null|0.95|..., capOrder: "before"|"after" (relative to transform),
//   transform: "none"|"log1p"|"logc", c: offset for logc,
//   scaler: "z"|"robust"|"robust0"|"minmax"|"rank"|"none",
//   drop: [cols], dup: [cols to duplicate], extraCols: [[...col], ...] }
// Fitted on `fit`, applied to `apply` (same column layout).
export function quantile(a, q) { return L.quantile(a, q); }
function invPhi(p) { // Acklam, repeated here to keep lib untouched
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628274631];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  if (p > 1 - pl) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  const q = p - 0.5, rr = q * q;
  return (((((a[0]*rr+a[1])*rr+a[2])*rr+a[3])*rr+a[4])*rr+a[5])*q / (((((b[0]*rr+b[1])*rr+b[2])*rr+b[3])*rr+b[4])*rr+1);
}
export function pipeline(cfg, fit, apply = fit) {
  let F = fit.map((r) => r.slice()), A = apply.map((r) => r.slice());
  // imputation
  if (cfg.missing) {
    const { j, maskFit, maskApply } = cfg.missing;
    const obs = F.filter((_, i) => !maskFit[i]).map((r) => r[j]);
    const fillv = cfg.impute === "mean" ? mean(obs) : cfg.impute === "zero" ? 0 : L.quantile(obs, 0.5);
    const fill = (M, mask) => M.forEach((r, i) => { if (mask[i]) r[j] = fillv; });
    fill(F, maskFit); fill(A, maskApply);
    if (cfg.impute === "indicator") { F.forEach((r, i) => r.push(maskFit[i] ? 1 : 0)); A.forEach((r, i) => r.push(maskApply[i] ? 1 : 0)); }
  }
  if (cfg.extraCols) { cfg.extraCols.forEach((c) => { F.forEach((r, i) => r.push(c.fit[i])); A.forEach((r, i) => r.push(c.apply[i])); }); }
  if (cfg.dup) cfg.dup.forEach((j) => { F.forEach((r) => r.push(r[j])); A.forEach((r) => r.push(r[j])); });
  if (cfg.drop) { const keep = (r) => r.filter((_, j) => !cfg.drop.includes(j)); F = F.map(keep); A = A.map(keep); }
  const p = F[0].length;
  const skip = cfg.noTransformCols || [];
  const tf = (v, j) => skip.includes(j) ? v : cfg.transform === "log1p" ? Math.log1p(v) : cfg.transform === "logc" ? Math.log(v + cfg.c) : v;
  const cap = (M, caps) => M.map((r) => r.map((v, j) => (caps[j] === undefined ? v : Math.min(v, caps[j]))));
  if (cfg.capQ && cfg.capOrder !== "after") { const caps = Array.from({ length: p }, (_, j) => L.quantile(colOf(F, j), cfg.capQ)); F = cap(F, caps); A = cap(A, caps); }
  F = F.map((r) => r.map(tf)); A = A.map((r) => r.map(tf));
  if (cfg.capQ && cfg.capOrder === "after") { const caps = Array.from({ length: p }, (_, j) => L.quantile(colOf(F, j), cfg.capQ)); F = cap(F, caps); A = cap(A, caps); }
  return scale(cfg.scaler || "z", F, A);
}
export function scale(kind, F, A) {
  const p = F[0].length;
  if (kind === "none") return A;
  if (kind === "rank") {
    const sorted = Array.from({ length: p }, (_, j) => colOf(F, j).sort((a, b) => a - b)), n = F.length;
    return A.map((r) => r.map((v, j) => {
      const s = sorted[j]; let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (s[m] < v) lo = m + 1; else hi = m; }
      let lo2 = lo, hi2 = n; while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (s[m] <= v) lo2 = m + 1; else hi2 = m; }
      return invPhi(Math.min(1 - 0.5 / n, Math.max(0.5 / n, ((lo + lo2) / 2 + 0.5) / (n + 1))));
    }));
  }
  const loc = [], sc = [];
  for (let j = 0; j < p; j++) {
    const c = colOf(F, j);
    if (kind === "z") { loc.push(mean(c)); sc.push(sdev(c) || 1); }
    else if (kind === "minmax") { const mn = Math.min(...c), mx = Math.max(...c); loc.push(mn); sc.push(mx - mn || 1); }
    else if (kind === "robust" || kind === "robust0") {
      const iqr = L.quantile(c, 0.75) - L.quantile(c, 0.25);
      loc.push(L.quantile(c, 0.5));
      // scikit-learn's RobustScaler replaces a zero scale by 1 (robust); robust0 records the zero
      sc.push(iqr === 0 ? (kind === "robust" ? 1 : 0) : iqr);
    }
  }
  scale.last = { loc, sc };
  return A.map((r) => r.map((v, j) => (v - loc[j]) / sc[j]));
}

// ---------------------------------------------------------------------------
// Fit helpers
export function fitScore(X, k, seed = 7, nInit = 10) { const f = L.kmeans(X, k, seed, nInit); return { f, sc: L.scores(X, f) }; }
export const top = (score, frac = 0.01) => L.topK(score, Math.round(frac * score.length));
export const idxOf = (month, kind) => month.map((c, i) => (c.kind === kind ? i : -1)).filter((i) => i >= 0);
export const caught = (month, set, kind) => idxOf(month, kind).filter((i) => set.has(i)).length;

// Inertia decomposition: total = within + between, per feature.
export function decomposition(X, f) {
  const p = X[0].length, n = X.length, k = f.C.length;
  const mu = Array.from({ length: p }, (_, j) => mean(colOf(X, j)));
  const tot = new Array(p).fill(0), within = new Array(p).fill(0), between = new Array(p).fill(0);
  const cnt = new Array(k).fill(0); f.lab.forEach((l) => cnt[l]++);
  for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) { tot[j] += (X[i][j] - mu[j]) ** 2; within[j] += (X[i][j] - f.C[f.lab[i]][j]) ** 2; }
  for (let c = 0; c < k; c++) for (let j = 0; j < p; j++) between[j] += cnt[c] * (f.C[c][j] - mu[j]) ** 2;
  return { tot, within, between, r2: tot.map((t, j) => between[j] / t) };
}
// Calinski-Harabasz and Davies-Bouldin
export function chIndex(X, f) {
  const d = decomposition(X, f), n = X.length, k = f.C.length;
  const B = d.between.reduce((s, v) => s + v, 0), W = d.within.reduce((s, v) => s + v, 0);
  return (B / (k - 1)) / (W / (n - k));
}
export function dbIndex(X, f) {
  const k = f.C.length, s = new Array(k).fill(0), n = new Array(k).fill(0);
  X.forEach((x, i) => { s[f.lab[i]] += Math.sqrt(L.d2(x, f.C[f.lab[i]])); n[f.lab[i]]++; });
  const S = s.map((v, j) => v / Math.max(1, n[j]));
  let tot = 0;
  for (let i = 0; i < k; i++) { let mx = 0; for (let j = 0; j < k; j++) if (i !== j) mx = Math.max(mx, (S[i] + S[j]) / Math.sqrt(L.d2(f.C[i], f.C[j]))); tot += mx; }
  return tot / k;
}
// Gap statistic (Tibshirani et al. 2001), uniform reference over the bounding box.
export function gapStat(X, ks, B, seed) {
  const r = L.mulberry32(seed), p = X[0].length;
  const lo = Array.from({ length: p }, (_, j) => Math.min(...colOf(X, j))), hi = Array.from({ length: p }, (_, j) => Math.max(...colOf(X, j)));
  const refs = Array.from({ length: B }, () => X.map(() => lo.map((l, j) => l + (hi[j] - l) * r())));
  return ks.map((k) => {
    const w = Math.log(L.kmeans(X, k, 11, 3).inertia);
    const wr = refs.map((R, b) => Math.log(L.kmeans(R, k, 100 + b, 1).inertia));
    const m = mean(wr), s = sdev(wr) * Math.sqrt(1 + 1 / B);
    return { k, gap: m - w, s };
  });
}
export function nmi(a, b) {
  const n = a.length, ka = Math.max(...a) + 1, kb = Math.max(...b) + 1;
  const M = Array.from({ length: ka }, () => new Array(kb).fill(0)); a.forEach((x, i) => M[x][b[i]]++);
  const pa = M.map((r) => r.reduce((s, v) => s + v, 0) / n), pb = M[0].map((_, j) => M.reduce((s, r) => s + r[j], 0) / n);
  let I = 0; M.forEach((r, i) => r.forEach((v, j) => { if (v) I += (v / n) * Math.log((v / n) / (pa[i] * pb[j])); }));
  const H = (p) => -p.reduce((s, v) => s + (v > 0 ? v * Math.log(v) : 0), 0);
  return I / Math.sqrt(H(pa) * H(pb));
}
// Hungarian algorithm on a square cost matrix; returns assignment row -> col.
export function hungarian(cost) {
  const n = cost.length, INF = 1e18, u = new Array(n + 1).fill(0), v = new Array(n + 1).fill(0), p = new Array(n + 1).fill(0), way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i; let j0 = 0; const minv = new Array(n + 1).fill(INF), used = new Array(n + 1).fill(false);
    do {
      used[j0] = true; const i0 = p[j0]; let delta = INF, j1 = 0;
      for (let j = 1; j <= n; j++) if (!used[j]) { const cur = cost[i0 - 1][j - 1] - u[i0] - v[j]; if (cur < minv[j]) { minv[j] = cur; way[j] = j0; } if (minv[j] < delta) { delta = minv[j]; j1 = j; } }
      for (let j = 0; j <= n; j++) { if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const ans = new Array(n); for (let j = 1; j <= n; j++) ans[p[j] - 1] = j - 1; return ans;
}
// Map labels b onto labels a by maximum overlap. Returns relabelled b.
export function matchLabels(a, b, k) {
  const M = Array.from({ length: k }, () => new Array(k).fill(0)); a.forEach((x, i) => M[x][b[i]]++);
  const as = hungarian(M.map((r) => r.map((v) => -v))); // row a -> col b
  const inv = new Array(k); as.forEach((cb, ra) => (inv[cb] = ra));
  return b.map((l) => inv[l]);
}
// Hennig (2007) clusterwise bootstrap Jaccard.
export function clusterwiseJaccard(X, k, B, seed, nInit = 5) {
  const base = L.kmeans(X, k, seed, nInit), r = L.mulberry32(seed + 1), n = X.length;
  const acc = new Array(k).fill(0);
  for (let b = 0; b < B; b++) {
    const idx = Array.from({ length: n }, () => Math.floor(r() * n)), uniq = [...new Set(idx)];
    const fb = L.kmeans(idx.map((i) => X[i]), k, seed + 10 + b, nInit);
    const labB = L.assignTo(uniq.map((i) => X[i]), fb.C); // bootstrap clustering of the distinct points
    for (let c = 0; c < k; c++) {
      const A = new Set(uniq.filter((i) => base.lab[i] === c)); let best = 0;
      for (let d = 0; d < k; d++) { const Bset = new Set(uniq.filter((_, t) => labB[t] === d)); const j = L.jaccard(A, Bset); if (j > best) best = j; }
      acc[c] += best / B;
    }
  }
  const sizes = new Array(k).fill(0); base.lab.forEach((l) => sizes[l]++);
  return { jac: acc, sizes, base };
}
export function spearman(a, b) {
  const rank = (v) => { const o = v.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]), r = new Array(v.length); o.forEach(([, i], t) => (r[i] = t)); return r; };
  const ra = rank(a), rb = rank(b), n = a.length, ma = (n - 1) / 2;
  let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { s += (ra[i] - ma) * (rb[i] - ma); sa += (ra[i] - ma) ** 2; sb += (rb[i] - ma) ** 2; }
  return s / Math.sqrt(sa * sb);
}
// Assignment margin: second-nearest minus nearest centroid distance.
export function margins(X, C) {
  return X.map((x) => { const d = C.map((c) => Math.sqrt(L.d2(x, c))).sort((a, b) => a - b); return d[1] - d[0]; });
}

// ---------------------------------------------------------------------------
// Distances for scoring a fixed clustering.
export function distScores(X, f, kind, raw) {
  const { C, lab } = f, p = X[0].length, k = C.length;
  if (kind === "euclid") return X.map((x, i) => Math.sqrt(L.d2(x, C[lab[i]])));
  if (kind === "manhattan") return X.map((x, i) => x.reduce((s, v, j) => s + Math.abs(v - C[lab[i]][j]), 0));
  if (kind === "chebyshev") return X.map((x, i) => Math.max(...x.map((v, j) => Math.abs(v - C[lab[i]][j]))));
  if (kind === "cosine") { // on the raw log1p profile, not centred: "shape" of activity
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
      const mu = kind === "mahalGlobal" ? Array.from({ length: p }, (_, j) => mean(colOf(X, j))) : C[c];
      const S = Array.from({ length: p }, () => new Array(p).fill(0));
      ids.forEach((i) => { for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] += (X[i][a] - mu[a]) * (X[i][b] - mu[b]) / ids.length; });
      inv.push(invert(S));
      if (kind === "mahalGlobal") { for (let t = 1; t < k; t++) inv.push(inv[0]); break; }
    }
    return X.map((x, i) => { const c = C[lab[i]], Si = inv[lab[i]]; if (!Si) return NaN; const dvec = x.map((v, j) => v - c[j]); let s = 0; for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) s += dvec[a] * Si[a][b] * dvec[b]; return Math.sqrt(Math.max(0, s)); });
  }
  throw new Error(kind);
}
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

// ---------------------------------------------------------------------------
// Benchmark detectors
export function knnScore(X, kn) {
  return X.map((x, i) => { const d = []; for (let t = 0; t < X.length; t++) if (t !== i) d.push(L.d2(x, X[t])); d.sort((a, b) => a - b); return Math.sqrt(d[kn - 1]); });
}
export function maxAbsZ(X) { return X.map((x) => Math.max(...x.map(Math.abs))); }
export function iforest(X, seed, trees = 100, psi = 256) {
  const r = L.mulberry32(seed), n = X.length, p = X[0].length, hmax = Math.ceil(Math.log2(psi));
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
// k-means-- (Chawla & Gionis 2013): exclude the l farthest points from each update.
export function kmeansMinus(X, k, l, seed, nInit = 5) {
  const r = L.mulberry32(seed); let best = null;
  for (let t = 0; t < nInit; t++) {
    let C = L.seedPP(X, k, r), lab;
    for (let it = 0; it < 100; it++) {
      lab = L.assignTo(X, C);
      const d = X.map((x, i) => L.d2(x, C[lab[i]]));
      const cut = [...d].sort((a, b) => b - a)[l - 1];
      const p = X[0].length, S = Array.from({ length: k }, () => new Array(p).fill(0)), n = new Array(k).fill(0);
      X.forEach((x, i) => { if (d[i] >= cut) return; n[lab[i]]++; x.forEach((v, q) => (S[lab[i]][q] += v)); });
      const Cn = S.map((s, j) => (n[j] ? s.map((v) => v / n[j]) : C[j]));
      const moved = Cn.some((c, j) => L.d2(c, C[j]) > 1e-12); C = Cn; if (!moved) break;
    }
    lab = L.assignTo(X, C);
    const d = X.map((x, i) => L.d2(x, C[lab[i]])), cut = [...d].sort((a, b) => b - a)[l - 1];
    const inertia = d.reduce((s, v) => s + (v < cut ? v : 0), 0);
    if (!best || inertia < best.inertia) best = { C, lab, inertia };
  }
  return best;
}

// ---------------------------------------------------------------------------
// Surrogate CART (Gini) predicting cluster labels from original-unit features.
export function tree(X, y, depth, minLeaf = 20) {
  const k = Math.max(...y) + 1;
  const gini = (ids) => { const c = new Array(k).fill(0); ids.forEach((i) => c[y[i]]++); return 1 - c.reduce((s, v) => s + (v / ids.length) ** 2, 0); };
  const major = (ids) => { const c = new Array(k).fill(0); ids.forEach((i) => c[y[i]]++); return c.indexOf(Math.max(...c)); };
  const grow = (ids, d) => {
    if (d === 0 || ids.length < 2 * minLeaf) return { leaf: major(ids) };
    let best = null; const p = X[0].length;
    for (let q = 0; q < p; q++) {
      const vals = [...new Set(ids.map((i) => X[i][q]))].sort((a, b) => a - b);
      const cands = vals.length > 64 ? Array.from({ length: 63 }, (_, t) => vals[Math.floor(((t + 1) * vals.length) / 64)]) : vals.slice(1);
      for (const s of cands) {
        const Lf = ids.filter((i) => X[i][q] < s), R = ids.filter((i) => X[i][q] >= s);
        if (Lf.length < minLeaf || R.length < minLeaf) continue;
        const g = (Lf.length * gini(Lf) + R.length * gini(R)) / ids.length;
        if (!best || g < best.g) best = { g, q, s, Lf, R };
      }
    }
    if (!best) return { leaf: major(ids) };
    return { q: best.q, s: best.s, l: grow(best.Lf, d - 1), r: grow(best.R, d - 1) };
  };
  const root = grow(X.map((_, i) => i), depth);
  const predict = (x, t = root) => (t.leaf !== undefined ? t.leaf : predict(x, x[t.q] < t.s ? t.l : t.r));
  return { root, predict };
}
