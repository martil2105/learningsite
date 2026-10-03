/*
  The fundamental law of active management, and what happens to it when the
  signal's skill moves from month to month.

  Each month a manager has a standardised forecast z_i for each of N stocks
  and holds weights in proportion to it. The stocks' standardised residual
  returns are r_i = c z_i + sqrt(1 - c^2) e_i, so c is that month's
  information coefficient: the correlation between forecasts and outcomes.
  The month's active return, per unit of position, is R = (1/N) sum z_i r_i.

  If c is the same every month (Grinold's world), E[R] = IC and
  Var[R] = (1 + IC^2) / N, so the monthly information ratio is
  IC sqrt(N) / sqrt(1 + IC^2), close to IC sqrt(N).

  If c moves from month to month with mean IC and standard deviation s, the
  conditional mean moves with it and

      Var[R] = s^2 + (1 + IC^2 + s^2) / N,

  so the information ratio stops rising at IC / s however large N gets.
  A year is twelve independent months, so the annual ratio is sqrt(12) times
  the monthly one.
*/
import { normals, mulberry32 } from "./random.js";

export const ROOT12 = Math.sqrt(12);
export const irMonthly = (ic, n, s = 0) => ic / Math.sqrt(s * s + (1 + ic * ic + s * s) / n);
export const irAnnual = (ic, n, s = 0) => ROOT12 * irMonthly(ic, n, s);
export const ceiling = (ic, s) => (s > 0 ? (ROOT12 * ic) / s : Infinity);
// The number of independent bets a month that would give the same ratio in Grinold's world.
export const bets = (ic, n, s = 0) => (1 + ic * ic) / (s * s + (1 + ic * ic + s * s) / n);
export const betsCap = (ic, s) => (s > 0 ? (1 + ic * ic) / (s * s) : Infinity);
// The chance a forecast gets the sign of the outcome right, for normal z and r.
export const hitRate = (ic) => 0.5 + Math.asin(ic) / Math.PI;

export const MANAGERS = {
  A: { id: "A", ic: 0.06, n: 50 },
  B: { id: "B", ic: 0.02, n: 1000 },
};

export const phi = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
export function Phi(x) {
  // Abramowitz and Stegun 7.1.26 through erf, accurate to about 1e-7
  const t = 1 / (1 + 0.3275911 * Math.abs(x / Math.SQRT2));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

// The long-run share of months with a positive active return: average the
// conditional chance over the month's IC, by Simpson's rule on +-8 s.
export function positiveShare(ic, n, s = 0) {
  const p = (c) => Phi(c / Math.sqrt((1 + c * c) / n));
  if (s === 0) return p(ic);
  const K = 800, a = ic - 8 * s, h = (16 * s) / K;
  let sum = 0;
  for (let k = 0; k <= K; k++) {
    const c = a + k * h, w = k === 0 || k === K ? 1 : k % 2 ? 4 : 2;
    sum += w * p(c) * phi((c - ic) / s) / s;
  }
  return (sum * h) / 3;
}

// One manager's months: each month's IC is drawn around the mean, then the
// month's return is drawn given it. The draws of the two normals are shared
// across settings so a slider moves the same months rather than new ones.
export function months(ic, n, s, count = 120, seed = 1) {
  const g = normals(seed), out = [];
  for (let t = 0; t < count; t++) {
    const u = g(), v = g();
    const c = Math.max(-0.99, Math.min(0.99, ic + s * u));
    out.push(c + Math.sqrt((1 + c * c) / n) * v);
  }
  return out;
}

// The stock-level world, for the checks: N forecasts and N outcomes a month.
export function simulate(ic, n, s, count, seed) {
  const g = normals(seed), R = [];
  for (let t = 0; t < count; t++) {
    const c = Math.max(-0.99, Math.min(0.99, ic + s * g())), k = Math.sqrt(1 - c * c);
    let sum = 0;
    for (let i = 0; i < n; i++) { const z = g(); sum += z * (c * z + k * g()); }
    R.push(sum / n);
  }
  return R;
}

// A month of forecasts and outcomes for the scatter: fixed draws, any IC.
export function scatter(n = 500, seed = 5) {
  const g = normals(seed), z = [], e = [];
  for (let i = 0; i < n; i++) { z.push(g()); e.push(g()); }
  return { z, e, at: (ic) => z.map((zi, i) => [zi, ic * zi + Math.sqrt(1 - ic * ic) * e[i]]) };
}
export { mulberry32 };

// The month-to-month standard deviation of the realised IC, as a multiple of
// the sampling noise alone (Qian and Hua's kappa is this times sqrt(1 + IC^2)).
export const kappa = (ic, n, s) => Math.sqrt(s * s + (1 + ic * ic + s * s) / n) / Math.sqrt((1 + ic * ic) / n);

// The swing at which the two managers' ratios are equal, by bisection.
export function crossing(a = MANAGERS.A, b = MANAGERS.B) {
  let lo = 0, hi = 0.3;
  for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; if (irMonthly(a.ic, a.n, m) > irMonthly(b.ic, b.n, m)) hi = m; else lo = m; }
  return (lo + hi) / 2;
}

// Ten years of a manager's months, sized so her risk model, which only sees
// the noise from stock to stock, predicts a tracking error of TE a year.
export const TE = 4;
export const SEEDS = { A: 2, B: 28 };
export function riskRun(id, s) {
  const g = MANAGERS[id], p = Math.sqrt((1 + g.ic * g.ic) / g.n);
  return months(g.ic, g.n, s, 120, SEEDS[id]).map((r) => (r / p) * (TE / ROOT12));
}
export const sdOf = (v) => { const m = v.reduce((a, b) => a + b, 0) / v.length; return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)); };
// The expected monthly active return in riskRun's units: the same with or without the swing.
export function expectedMonth(id) {
  const g = MANAGERS[id];
  return (g.ic / Math.sqrt((1 + g.ic * g.ic) / g.n)) * (TE / ROOT12);
}
