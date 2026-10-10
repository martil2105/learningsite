/*
  What the real US data says: lag-1 autocorrelation by five-year window, the
  variance ratio of a window, and the rule (hold the market tomorrow after a
  day it rose, sit in bills after a day it fell) on paper, compounding French's
  daily returns. Autocorrelations and variance ratios use log returns; the
  rule compounds simple ones.
*/
import { RET, RF, LOGRET, span } from "./market.js";
import { acf, vr, seVR, mean } from "./vr.js";

export const WINDOWS = Array.from({ length: 20 }, (_, i) => [1927 + 5 * i, 1931 + 5 * i]);
export const label = ([a, b]) => `${a}–${String(b).slice(2)}`;

export function rule(a, b) {
  const [i0, i1] = span(a, b);
  let wRule = 1, wMkt = 1, inDays = 0;
  for (let i = i0 + 1; i < i1; i++) {
    wMkt *= 1 + RET[i];
    if (RET[i - 1] > 0) { wRule *= 1 + RET[i]; inDays++; } else wRule *= 1 + RF[i];
  }
  const yrs = (i1 - i0 - 1) / 252;
  return { rule: Math.pow(wRule, 1 / yrs) - 1, market: Math.pow(wMkt, 1 / yrs) - 1, inShare: inDays / (i1 - i0 - 1) };
}

export function windowStats([a, b]) {
  const [i0, i1] = span(a, b), T = i1 - i0;
  return { a, b, T, rho1: acf(LOGRET, 1, i0, i1), se: 1 / Math.sqrt(T), ...rule(a, b) };
}
export const WINDOW_STATS = WINDOWS.map(windowStats);

export function vrCurve(a, b, qmax = 21) {
  const [i0, i1] = span(a, b), T = i1 - i0;
  return Array.from({ length: qmax }, (_, j) => ({ q: j + 1, vr: j === 0 ? 1 : vr(LOGRET, j + 1, i0, i1), se: seVR(j + 1, T) }));
}

// Lo and MacKinlay's test statistic allowing for volatility that changes from day to day
export function robustSE(q, a, b) {
  const [i0, i1] = span(a, b), m = mean(LOGRET, i0, i1);
  let S = 0; for (let i = i0; i < i1; i++) S += (LOGRET[i] - m) ** 2;
  let v = 0;
  for (let k = 1; k < q; k++) {
    let d = 0; for (let i = i0 + k; i < i1; i++) d += (LOGRET[i] - m) ** 2 * (LOGRET[i - k] - m) ** 2;
    v += (2 * (1 - k / q)) ** 2 * (d / (S * S));
  }
  return Math.sqrt(v);
}
export function zScores(q, a, b) {
  const [i0, i1] = span(a, b), v = vr(LOGRET, q, i0, i1);
  return { vr: v, z: (v - 1) / seVR(q, i1 - i0), zRobust: (v - 1) / robustSE(q, a, b) };
}
