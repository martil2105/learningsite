/*
  The market, the shock mix, the identification problem, and the 1/R² bracket.

  Linear demand and supply with additive shocks:
      demand:  q = A − B·p + u,   u ~ N(0, τd²)
      supply:  q = C + S·p + v,   v ~ N(0, τs²)

  Base parameters:
      A = 120, B = 3, C = 20, S = 2  →  p₀ = 20, q₀ = 60.

  The market clears where excess demand is zero.
  The solver bisects excess demand reading BOTH curves and BOTH shocks,
  returning the average of the two quantities so neither equation is privileged:
      (A − B·p + u) − (C + S·p + v) = 0.

  Population moments, where D = B + S and w = τd² / (τd² + τs²):
      Var(p)    = (τd² + τs²) / D²
      Var(q)    = (S²·τd² + B²·τs²) / D²
      Cov(p, q) = (S·τd² − B·τs²) / D²
      slope     = Cov / Var(p) = w·S − (1 − w)·B
      R²        = Cov² / (Var(p)·Var(q))

  The identification bracket (Klepper & Leamer 1984):
      B_lo = −Cov / Var(p)     (forward OLS regression)
      B_hi = −Var(q) / Cov     (reverse OLS regression)
      B_hi / B_lo === 1 / R²   (exact identity)
*/

export const A = 120;
export const B = 3;
export const C = 20;
export const S = 2;

export const p0 = (A - C) / (B + S);
export const q0 = C + S * p0;

/* Demand and supply functions */
export const demandQ = (p, a = A, b = B) => a - b * p;
export const supplyQ = (p, c = C, s = S) => c + s * p;
export const invDemandP = (q, a = A, b = B) => (a - q) / b;
export const invSupplyP = (q, c = C, s = S) => (q - c) / s;

/*
  The clearing route that reads BOTH curves and BOTH shocks symmetrically.
  Guarantees that when τs = 0 observations lie on supply,
  and when τd = 0 observations lie on demand.
*/
export function clearMarket(u = 0, v = 0, mkt = { A, B, C, S }) {
  const { A: a, B: b, C: c, S: s } = mkt;
  const ed = (p) => (a - b * p + u) - (c + s * p + v);
  let lo = -1e4, hi = 1e4;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (ed(mid) > 0) lo = mid;
    else hi = mid;
  }
  const p = (lo + hi) / 2;
  const qD = a - b * p + u;
  const qS = c + s * p + v;
  return { p, q: (qD + qS) / 2 };
}

/* Closed-form equilibrium for cross-checking */
export function closedEquilibrium(u = 0, v = 0, mkt = { A, B, C, S }) {
  const { A: a, B: b, C: c, S: s } = mkt;
  const D = b + s;
  const p = (a - c + u - v) / D;
  const q = (s * (a + u) + b * (c + v)) / D;
  return { p, q };
}

/* Population second moments given shock variances */
export function populationMoments(td2, ts2, mkt = { A, B, C, S }) {
  const { B: b, S: s } = mkt;
  const D = b + s;
  const vp = (td2 + ts2) / (D * D);
  const vq = (s * s * td2 + b * b * ts2) / (D * D);
  const cov = (s * td2 - b * ts2) / (D * D);
  const w = td2 + ts2 > 0 ? td2 / (td2 + ts2) : 0;
  const slope = w * s - (1 - w) * b;
  const r2 = vp > 0 && vq > 0 ? (cov * cov) / (vp * vq) : 0;
  return { vp, vq, cov, w, slope, r2 };
}

/* The critical shock share where the cloud is flat */
export const flatShare = (mkt = { A, B, C, S }) => mkt.B / (mkt.B + mkt.S);

/*
  The Klepper-Leamer identified bracket for the demand slope magnitude |b_demand| = B.
  Valid when Cov < 0 (downward-sloping cloud).
*/
export function demandBracket(vp, vq, cov) {
  if (cov >= 0) return null; // Cloud does not slope downward
  const Blo = -cov / vp;      // forward regression: q on p
  const Bhi = -vq / cov;      // reverse regression: p on q, inverted
  const r2 = (cov * cov) / (vp * vq);
  const ratio = Bhi / Blo;
  return { Blo, Bhi, ratio, invR2: 1 / r2, r2 };
}

/*
  Family of admissible markets (b, s, td2, ts2) reproducing given moments.
*/
export function solveAdmissibleMarket(b, targetMoments) {
  const { vp, vq, cov } = targetMoments;
  const s = (vq + b * cov) / (cov + b * vp);
  const D = b + s;
  const td2 = ((cov + b * vp) / (s + b)) * D * D;
  const ts2 = ((s * vp - cov) / (s + b)) * D * D;
  return { b, s, td2, ts2 };
}

/*
  Calculate sample moments from an array of (p, q) points.
*/
export function sampleMoments(points) {
  const n = points.length;
  if (n === 0) return { meanP: 0, meanQ: 0, vp: 0, vq: 0, cov: 0, slope: 0, r2: 0, intercept: 0 };
  let sumP = 0, sumQ = 0;
  for (const pt of points) { sumP += pt.p; sumQ += pt.q; }
  const meanP = sumP / n;
  const meanQ = sumQ / n;
  let sPP = 0, sQQ = 0, sPQ = 0;
  for (const pt of points) {
    const dp = pt.p - meanP;
    const dq = pt.q - meanQ;
    sPP += dp * dp;
    sQQ += dq * dq;
    sPQ += dp * dq;
  }
  const vp = sPP / n;
  const vq = sQQ / n;
  const cov = sPQ / n;
  const slope = sPP > 0 ? sPQ / sPP : 0;
  const intercept = meanQ - slope * meanP;
  const r2 = (sPP * sQQ > 0) ? (sPQ * sPQ) / (sPP * sQQ) : 0;
  return { meanP, meanQ, vp, vq, cov, slope, intercept, r2 };
}
