/*
  k-means and everything we measure about a clustering: scores, alert sets,
  validity indices, similarity between two clusterings, and stability.
*/
import { mulberry32 } from "./rng.js";
import { col, mean, sdev } from "./prep.js";

export const d2 = (a, b) => { let s = 0; for (let j = 0; j < a.length; j++) s += (a[j] - b[j]) ** 2; return s; };

// k-means++ seeding: each new seed drawn with probability proportional to D².
export function seedPP(X, k, r) {
  const C = [X[Math.floor(r() * X.length)]];
  const D = X.map((x) => d2(x, C[0]));
  while (C.length < k) {
    const tot = D.reduce((s, v) => s + v, 0);
    let u = r() * tot, i = 0;
    for (; i < X.length - 1; i++) { u -= D[i]; if (u <= 0) break; }
    C.push(X[i]);
    for (let t = 0; t < X.length; t++) D[t] = Math.min(D[t], d2(X[t], X[i]));
  }
  return C.map((c) => c.slice());
}

// Lloyd's algorithm to a fixed point. An empty cluster keeps its centroid.
export function lloyd(X, C0, maxIter = 300) {
  let C = C0.map((c) => c.slice()), lab = new Int32Array(X.length).fill(-1);
  const k = C.length, p = X[0].length;
  for (let it = 0; it < maxIter; it++) {
    let changed = false;
    for (let i = 0; i < X.length; i++) {
      let b = 0, bd = Infinity;
      for (let j = 0; j < k; j++) { const d = d2(X[i], C[j]); if (d < bd) { bd = d; b = j; } }
      if (lab[i] !== b) { lab[i] = b; changed = true; }
    }
    if (!changed) break;
    const S = Array.from({ length: k }, () => new Array(p).fill(0)), n = new Array(k).fill(0);
    for (let i = 0; i < X.length; i++) { n[lab[i]]++; for (let q = 0; q < p; q++) S[lab[i]][q] += X[i][q]; }
    for (let j = 0; j < k; j++) if (n[j]) C[j] = S[j].map((v) => v / n[j]);
  }
  let inertia = 0; for (let i = 0; i < X.length; i++) inertia += d2(X[i], C[lab[i]]);
  return { C, lab: Array.from(lab), inertia };
}

// Best of nInit k-means++ starts, all drawn from one seeded stream.
export function kmeans(X, k, seed, nInit = 10) {
  const r = mulberry32(seed);
  let best = null;
  for (let t = 0; t < nInit; t++) {
    const res = lloyd(X, seedPP(X, k, r));
    if (!best || res.inertia < best.inertia) best = res;
  }
  return best;
}
export const FIT_SEED = 7;

export function assignTo(X, C) {
  return X.map((x) => { let b = 0, bd = Infinity; C.forEach((c, j) => { const d = d2(x, c); if (d < bd) { bd = d; b = j; } }); return b; });
}

// dist: distance to own centroid; norm: that over the cluster's RMS radius.
export function scores(X, fit) {
  const { C, lab } = fit, k = C.length;
  const dist = X.map((x, i) => Math.sqrt(d2(x, C[lab[i]])));
  const n = new Array(k).fill(0), ss = new Array(k).fill(0);
  lab.forEach((l, i) => { n[l]++; ss[l] += dist[i] ** 2; });
  const rms = ss.map((s, j) => Math.sqrt(s / Math.max(1, n[j])) || 1);
  return { dist, norm: dist.map((d, i) => d / rms[lab[i]]), n, rms };
}
export function fitScore(X, k, seed = FIT_SEED, nInit = 10) { const f = kmeans(X, k, seed, nInit); return { f, sc: scores(X, f) }; }

// The top `budget` customers by a score. Ties broken by index, so it's stable.
export function topK(score, budget) {
  return new Set(score.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, budget).map((t) => t[1]));
}
export const top = (score, frac = 0.01) => topK(score, Math.round(frac * score.length));

// The top fraction p inside every cluster.
export function perCluster(score, lab, p) {
  const by = {}; lab.forEach((l, i) => (by[l] ||= []).push(i));
  const out = new Set();
  for (const ids of Object.values(by)) {
    const m = Math.ceil(p * ids.length);
    ids.sort((a, b) => score[b] - score[a]).slice(0, m).forEach((i) => out.add(i));
  }
  return out;
}
export const jaccard = (A, B) => { let i = 0; for (const a of A) if (B.has(a)) i++; return i / (A.size + B.size - i); };

// ------------------------------------------------------------ inertia
export function decomposition(X, f) {
  const p = X[0].length, n = X.length, k = f.C.length;
  const mu = Array.from({ length: p }, (_, j) => mean(col(X, j)));
  const tot = new Array(p).fill(0), within = new Array(p).fill(0), between = new Array(p).fill(0);
  const cnt = new Array(k).fill(0); f.lab.forEach((l) => cnt[l]++);
  for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) { tot[j] += (X[i][j] - mu[j]) ** 2; within[j] += (X[i][j] - f.C[f.lab[i]][j]) ** 2; }
  for (let c = 0; c < k; c++) for (let j = 0; j < p; j++) between[j] += cnt[c] * (f.C[c][j] - mu[j]) ** 2;
  return { tot, within, between, r2: tot.map((t, j) => between[j] / t) };
}

// ------------------------------------------------------------ choosing k
export function silhouette(X, lab, sampleIdx) {
  const k = Math.max(...lab) + 1; let tot = 0;
  for (const i of sampleIdx) {
    const s = new Array(k).fill(0), n = new Array(k).fill(0);
    for (let t = 0; t < X.length; t++) { if (t === i) continue; s[lab[t]] += Math.sqrt(d2(X[i], X[t])); n[lab[t]]++; }
    const a = n[lab[i]] ? s[lab[i]] / n[lab[i]] : 0;
    let b = Infinity; for (let j = 0; j < k; j++) if (j !== lab[i] && n[j]) b = Math.min(b, s[j] / n[j]);
    tot += n[lab[i]] ? (b - a) / Math.max(a, b) : 0;
  }
  return tot / sampleIdx.length;
}
export function chIndex(X, f) {
  const d = decomposition(X, f), n = X.length, k = f.C.length;
  const B = d.between.reduce((s, v) => s + v, 0), W = d.within.reduce((s, v) => s + v, 0);
  return (B / (k - 1)) / (W / (n - k));
}
export function dbIndex(X, f) {
  const k = f.C.length, s = new Array(k).fill(0), n = new Array(k).fill(0);
  X.forEach((x, i) => { s[f.lab[i]] += Math.sqrt(d2(x, f.C[f.lab[i]])); n[f.lab[i]]++; });
  const S = s.map((v, j) => v / Math.max(1, n[j]));
  let tot = 0;
  for (let i = 0; i < k; i++) { let mx = 0; for (let j = 0; j < k; j++) if (i !== j) mx = Math.max(mx, (S[i] + S[j]) / Math.sqrt(d2(f.C[i], f.C[j]))); tot += mx; }
  return tot / k;
}
// Gap statistic (Tibshirani, Walther & Hastie 2001), uniform reference box.
export function gapStat(X, ks, B, seed) {
  const r = mulberry32(seed), p = X[0].length;
  const lo = Array.from({ length: p }, (_, j) => Math.min(...col(X, j))), hi = Array.from({ length: p }, (_, j) => Math.max(...col(X, j)));
  const refs = Array.from({ length: B }, () => X.map(() => lo.map((l, j) => l + (hi[j] - l) * r())));
  return ks.map((k) => {
    const w = Math.log(kmeans(X, k, 11, 3).inertia);
    const wr = refs.map((R, b) => Math.log(kmeans(R, k, 100 + b, 1).inertia));
    const m = mean(wr), s = sdev(wr) * Math.sqrt(1 + 1 / B);
    return { k, gap: m - w, s };
  });
}

// ------------------------------------------------------------ similarity and stability
export function ari(a, b) {
  const ka = Math.max(...a) + 1, kb = Math.max(...b) + 1, n = a.length;
  const M = Array.from({ length: ka }, () => new Array(kb).fill(0));
  a.forEach((x, i) => M[x][b[i]]++);
  const c2 = (x) => (x * (x - 1)) / 2;
  let sij = 0; M.forEach((r) => r.forEach((v) => (sij += c2(v))));
  const ai = M.map((r) => r.reduce((s, v) => s + v, 0)).reduce((s, v) => s + c2(v), 0);
  const bj = M[0].map((_, j) => M.reduce((s, r) => s + r[j], 0)).reduce((s, v) => s + c2(v), 0);
  const exp = (ai * bj) / c2(n);
  return (sij - exp) / ((ai + bj) / 2 - exp);
}
export function nmi(a, b) {
  const n = a.length, ka = Math.max(...a) + 1, kb = Math.max(...b) + 1;
  const M = Array.from({ length: ka }, () => new Array(kb).fill(0)); a.forEach((x, i) => M[x][b[i]]++);
  const pa = M.map((r) => r.reduce((s, v) => s + v, 0) / n), pb = M[0].map((_, j) => M.reduce((s, r) => s + r[j], 0) / n);
  let I = 0; M.forEach((r, i) => r.forEach((v, j) => { if (v) I += (v / n) * Math.log((v / n) / (pa[i] * pb[j])); }));
  const H = (p) => -p.reduce((s, v) => s + (v > 0 ? v * Math.log(v) : 0), 0);
  return I / Math.sqrt(H(pa) * H(pb));
}
// Hungarian algorithm on a square cost matrix; returns row -> column.
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
// Relabel b onto a by maximum overlap.
export function matchLabels(a, b, k) {
  const M = Array.from({ length: k }, () => new Array(k).fill(0)); a.forEach((x, i) => M[x][b[i]]++);
  const as = hungarian(M.map((r) => r.map((v) => -v)));
  const inv = new Array(k); as.forEach((cb, ra) => (inv[cb] = ra));
  return b.map((l) => inv[l]);
}
// Hennig (2007): for each original cluster, the mean over bootstraps of its best Jaccard match.
export function clusterwiseJaccard(X, k, B, seed, nInit = 5) {
  const base = kmeans(X, k, seed, nInit), r = mulberry32(seed + 1), n = X.length;
  const acc = new Array(k).fill(0);
  for (let b = 0; b < B; b++) {
    const idx = Array.from({ length: n }, () => Math.floor(r() * n)), uniq = [...new Set(idx)];
    const fb = kmeans(idx.map((i) => X[i]), k, seed + 10 + b, nInit);
    const labB = assignTo(uniq.map((i) => X[i]), fb.C);
    for (let c = 0; c < k; c++) {
      const A = new Set(uniq.filter((i) => base.lab[i] === c)); let best = 0;
      for (let d = 0; d < k; d++) { const Bs = new Set(uniq.filter((_, t) => labB[t] === d)); const j = jaccard(A, Bs); if (j > best) best = j; }
      acc[c] += best / B;
    }
  }
  const sizes = new Array(k).fill(0); base.lab.forEach((l) => sizes[l]++);
  return { jac: acc, sizes };
}
export function spearman(a, b) {
  const rank = (v) => { const o = v.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]), r = new Array(v.length); o.forEach(([, i], t) => (r[i] = t)); return r; };
  const ra = rank(a), rb = rank(b), n = a.length, ma = (n - 1) / 2;
  let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { s += (ra[i] - ma) * (rb[i] - ma); sa += (ra[i] - ma) ** 2; sb += (rb[i] - ma) ** 2; }
  return s / Math.sqrt(sa * sb);
}
// Second-nearest minus nearest centroid distance.
export function margins(X, C) {
  return X.map((x) => { const d = C.map((c) => Math.sqrt(d2(x, c))).sort((a, b) => a - b); return d[1] - d[0]; });
}
