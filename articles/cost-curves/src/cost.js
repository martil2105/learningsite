/*
  src/cost.js
  Cost curves and envelope model for slate row 7 (Mi7).
  Exported for cost-curves and imported by perfect-competition.
*/

export const f = 100;
export const r = 1;
export const w = 1;

// Total cost: fixed licence f, capital r*k, variable w*q^3/k
export function C(q, k) {
  if (q <= 0) return f + r * k;
  return f + r * k + (w * q * q * q) / k;
}

// Short-run average cost
export function SRAC(q, k) {
  if (q <= 0) return Infinity;
  return C(q, k) / q;
}

// Short-run marginal cost
export function SRMC(q, k) {
  if (q < 0) return 0;
  return (3 * w * q * q) / k;
}

// Optimal capital plant size for given output q
export function kStar(q) {
  if (q <= 0) return 0;
  return Math.sqrt(w / r) * Math.pow(q, 1.5);
}

// Long-run average cost (lower envelope)
export function LRAC(q) {
  if (q <= 0) return Infinity;
  return f / q + 2 * Math.sqrt(w * r) * Math.sqrt(q);
}

// Long-run marginal cost
export function LRMC(q) {
  if (q <= 0) return 0;
  return 3 * Math.sqrt(w * r) * Math.sqrt(q);
}

// Long-run minimum scale
export const qMin = Math.pow(f / Math.sqrt(w * r), 2 / 3); // 21.5443469...
export const minLRAC = LRAC(qMin); // 13.9247665...

// Tangency output for a given plant k
export function qTangency(k) {
  return Math.pow(k / Math.sqrt(w / r), 2 / 3);
}

// Minimum SRAC output for a given plant k (closed form)
export function qCheapest(k) {
  return Math.pow((k * (f + k)) / 2, 1 / 3);
}

// Ratio of tangency output to plant's cheapest scale
export function tangencyRatio(k) {
  return Math.pow((2 * k) / (f + k), 1 / 3);
}

// Flat marginal cost benchmark (no U-shape)
export function CFlat(q, c = 5) {
  return f + c * q;
}
export function ACFlat(q, c = 5) {
  if (q <= 0) return Infinity;
  return f / q + c;
}

// Relative cost penalty for building plant k * (1 + e) instead of optimal k
export function plantPenalty(e, q = 50) {
  const kOpt = kStar(q);
  const cOpt = C(q, kOpt);
  const cSub = C(q, kOpt * (1 + e));
  return (cSub - cOpt) / cOpt;
}

// Golden-section search for 1D minimisation (used for independent verification)
export function gmin(fn, lo, hi, it = 400) {
  const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < it; i++) {
    const x = hi - g * (hi - lo);
    const y = lo + g * (hi - lo);
    if (fn(x) < fn(y)) hi = y;
    else lo = x;
  }
  return (lo + hi) / 2;
}
