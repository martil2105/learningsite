// Plan-time probe library for the k-means peer-group outlier article.
// Seeded, dependency-free. Throwaway: pass 2 rewrites this as src/*.js.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function gaussian(r) {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}
export function poisson(r, lam) {
  if (lam > 40) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gaussian(r)));
  const L = Math.exp(-lam);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L);
  return k - 1;
}
const logn = (r, med, s) => med * Math.exp(s * gaussian(r));

// ---------------------------------------------------------------------------
// Population. Each customer has a persistent profile (drawn once) and a month
// is a noisy draw around it, so two months are the same people behaving the
// same way with fresh noise.
export const FEATURES = ["inflow", "outflow", "txns", "cashIn", "intlOut", "senders"];

const SEGMENTS = [
  // name, share, median inflow, sd log, senders extra, txns, pCash, cash med, pIntl, intl med
  { name: "student", w: 0.15, inc: 14000, s: 0.45, snd: 2.0, tx: 55, pc: 0.06, cm: 2000, pi: 0.10, im: 3000 },
  { name: "salaried", w: 0.50, inc: 45000, s: 0.35, snd: 0.6, tx: 80, pc: 0.08, cm: 3000, pi: 0.15, im: 5000 },
  { name: "pensioner", w: 0.20, inc: 26000, s: 0.25, snd: 0.3, tx: 35, pc: 0.20, cm: 4000, pi: 0.05, im: 3000 },
  { name: "high", w: 0.10, inc: 110000, s: 0.50, snd: 1.5, tx: 110, pc: 0.05, cm: 8000, pi: 0.40, im: 20000 },
  { name: "selfemp", w: 0.05, inc: 40000, s: 0.70, snd: 8.0, tx: 120, pc: 0.30, cm: 8000, pi: 0.20, im: 8000 },
];

export function makeProfiles(n, seed, planted = { mules: 20, struct: 10, extreme: 5 }) {
  const r = mulberry32(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    let u = r(), seg = SEGMENTS[0];
    for (const s of SEGMENTS) { if (u < s.w) { seg = s; break; } u -= s.w; }
    out.push({
      kind: "normal", seg: seg.name,
      inc: logn(r, seg.inc, seg.s),
      ratio: Math.min(1.2, Math.max(0.6, 0.93 + 0.08 * gaussian(r))),
      snd: 1 + poisson(r, seg.snd),
      tx: seg.tx * Math.exp(0.3 * gaussian(r)),
      cash: r() < seg.pc ? logn(r, seg.cm, 0.6) : 0,
      intl: r() < seg.pi ? logn(r, seg.im, 0.7) : 0,
    });
  }
  // Planted typologies.
  for (let i = 0; i < planted.mules; i++) // a mule ring: many senders, straight through, abroad
    out.push({ kind: "mule", seg: "mule", inc: logn(r, 60000, 0.12), ratio: 0.99, snd: 22 + poisson(r, 4),
      tx: 70 * Math.exp(0.1 * gaussian(r)), cash: 0, intl: -1 /* 60% of inflow */ });
  for (let i = 0; i < planted.struct; i++) // structuring: salaried-looking, steady cash in
    out.push({ kind: "struct", seg: "struct", inc: logn(r, 42000, 0.3), ratio: 0.95, snd: 1 + poisson(r, 0.6),
      tx: 80 * Math.exp(0.3 * gaussian(r)), cash: logn(r, 38000, 0.12), intl: 0 });
  for (let i = 0; i < planted.extreme; i++) // legitimate extremes: a house sale lands this month
    out.push({ kind: "extreme", seg: "extreme", inc: 45000 + logn(r, 3500000, 0.3), ratio: 0.3, snd: 2,
      tx: 85, cash: 0, intl: 0 });
  return out;
}

export function drawMonth(profiles, seed) {
  const r = mulberry32(seed);
  return profiles.map((p) => {
    const inflow = p.inc * Math.exp(0.10 * gaussian(r));
    const cashIn = p.cash > 0 ? p.cash * Math.exp(0.25 * gaussian(r)) : 0;
    return {
      kind: p.kind, seg: p.seg,
      x: [
        inflow + cashIn,
        (inflow + cashIn) * p.ratio * Math.exp(0.05 * gaussian(r)),
        poisson(r, p.tx),
        cashIn,
        p.intl < 0 ? 0.6 * inflow : p.intl > 0 ? p.intl * Math.exp(0.3 * gaussian(r)) : 0,
        Math.max(1, poisson(r, p.snd)),
      ],
    };
  });
}

// ---------------------------------------------------------------------------
// Transforms. Each returns a matrix (array of arrays), fitted on `fit` rows and
// applied to `apply` rows (so a model can be frozen and reapplied next month).
const col = (M, j) => M.map((r) => r[j]);
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
export function quantile(a, q) {
  const s = [...a].sort((x, y) => x - y);
  const h = (s.length - 1) * q, lo = Math.floor(h);
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (h - lo);
}
function invPhi(p) { // Acklam
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

export const TRANSFORMS = {
  rawZ: (fit, apply) => zscore(fit, apply),
  winsorZ: (fit, apply) => {
    const caps = FEATURES.map((_, j) => quantile(col(fit, j), 0.99));
    const clip = (M) => M.map((r) => r.map((v, j) => Math.min(v, caps[j])));
    return zscore(clip(fit), clip(apply));
  },
  logZ: (fit, apply) => { const L = (M) => M.map((r) => r.map((v) => Math.log1p(v))); return zscore(L(fit), L(apply)); },
  rank: (fit, apply) => {
    const sorted = FEATURES.map((_, j) => col(fit, j).sort((a, b) => a - b));
    const n = fit.length;
    return apply.map((r) => r.map((v, j) => {
      const s = sorted[j];
      let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (s[m] < v) lo = m + 1; else hi = m; }
      let lo2 = lo, hi2 = n; while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (s[m] <= v) lo2 = m + 1; else hi2 = m; }
      const rank = (lo + lo2) / 2; // mid-rank handles the zeros
      return invPhi(Math.min(1 - 0.5 / n, Math.max(0.5 / n, (rank + 0.5) / (n + 1))));
    }));
  },
};
function zscore(fit, apply) {
  const mu = FEATURES.map((_, j) => mean(col(fit, j)));
  const sg = FEATURES.map((_, j) => sd(col(fit, j)) || 1);
  return apply.map((r) => r.map((v, j) => (v - mu[j]) / sg[j]));
}

// ---------------------------------------------------------------------------
// k-means: k-means++ seeding, Lloyd, best of nInit.
export const d2 = (a, b) => { let s = 0; for (let j = 0; j < a.length; j++) s += (a[j] - b[j]) ** 2; return s; };

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

export function kmeans(X, k, seed, nInit = 10) {
  const r = mulberry32(seed);
  let best = null;
  for (let t = 0; t < nInit; t++) {
    const res = lloyd(X, seedPP(X, k, r));
    if (!best || res.inertia < best.inertia) best = res;
  }
  return best;
}
export function assignTo(X, C) {
  return X.map((x) => { let b = 0, bd = Infinity; C.forEach((c, j) => { const d = d2(x, c); if (d < bd) { bd = d; b = j; } }); return b; });
}

// ---------------------------------------------------------------------------
// Scores. All return a number per customer, higher = more unusual.
export function scores(X, fit) {
  const { C, lab } = fit, k = C.length;
  const dist = X.map((x, i) => Math.sqrt(d2(x, C[lab[i]])));
  const n = new Array(k).fill(0), ss = new Array(k).fill(0);
  lab.forEach((l, i) => { n[l]++; ss[l] += dist[i] ** 2; });
  const rms = ss.map((s, j) => Math.sqrt(s / Math.max(1, n[j])) || 1);
  return { dist, norm: dist.map((d, i) => d / rms[lab[i]]), size: lab.map((l) => n[l]), n, rms };
}
// Flag the top `budget` customers by a score (global threshold).
export function topK(score, budget) {
  return new Set(score.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, budget).map((t) => t[1]));
}
// Flag the top fraction p within every cluster.
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
export const kindsOf = (month, set) => {
  const c = { mule: 0, struct: 0, extreme: 0, normal: 0 };
  for (const i of set) c[month[i].kind]++;
  return c;
};
