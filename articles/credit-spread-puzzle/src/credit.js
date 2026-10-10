/*
  The credit spread puzzle: Moody's Baa and Aaa yields since 1919 against what
  defaults cost, with the default model from the article on Merton's model.

  Default rates and recovery are quoted, not data: Moody's averages for
  1970-2001 as Chen, Collin-Dufresne and Goldstein (2009) use them. A spread is
  a yearly, continuously compounded rate; P is the chance of default within T
  years and R the recovery per dollar owed.
*/
import { START, BAA, AAA } from "./data.js";

export const DEFAULTS = { Baa: { 4: 0.0155, 10: 0.0489 }, Aaa: { 4: 0.0004, 10: 0.0063 } };
export const RECOVERY = 0.449;
export const SHARPE = 0.43;   // the market's Sharpe ratio, as Chen, Collin-Dufresne and Goldstein choose it
export const CORR = 0.5;      // a firm's correlation with the market, the same
export const PERIODS = [
  { key: "all", label: "1919 to 2026", from: "1919-01", to: "2026-09" },
  { key: "ccdg", label: "1970 to 2001", from: "1970-01", to: "2001-12" },
  { key: "late", label: "2002 to 2026", from: "2002-01", to: "2026-09" },
];

// ---------------------------------------------------------------- the data
const [Y0, M0] = START.split("-").map(Number);
export const N = BAA.length;
export const label = (i) => { const k = Y0 * 12 + M0 - 1 + i; return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`; };
export const yearOf = (i) => Y0 + (M0 - 1 + i) / 12;  // fractional year at the start of month i
export const SPREAD = BAA.map((b, i) => (b - AAA[i]) / 100); // Baa over Aaa, points
export const indexOf = (ym) => { const [y, m] = ym.split("-").map(Number); return y * 12 + m - 1 - (Y0 * 12 + M0 - 1); };
export function stretch(from, to) {
  const a = indexOf(from), b = indexOf(to);
  let sum = 0, max = -Infinity, at = a, min = Infinity, minAt = a;
  for (let i = a; i <= b; i++) {
    sum += SPREAD[i];
    if (SPREAD[i] > max) { max = SPREAD[i]; at = i; }
    if (SPREAD[i] < min) { min = SPREAD[i]; minAt = i; }
  }
  return { a, b, n: b - a + 1, mean: sum / (b - a + 1), max, maxAt: label(at), min, minAt: label(minAt) };
}
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const monthName = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; };

// ------------------------------------------------- the normal distribution
// Phi to about 1e-15 (a series for small |x|, a continued fraction beyond).
export function Phi(x) {
  return 0.5 * erfc(-x / Math.SQRT2);
}
function erfc(x) {
  const z = Math.abs(x);
  let r;
  if (z < 0.5) {
    let sum = z, term = z, n = 0;
    while (Math.abs(term) > 1e-17 * Math.abs(sum)) { n++; term *= (-z * z) / n; sum += term / (2 * n + 1); }
    r = 1 - (2 / Math.sqrt(Math.PI)) * sum;
  } else {
    const tiny = 1e-300;
    let f = z, C = z, D = 0;
    for (let i = 1; i < 300; i++) {
      const a = i / 2;
      D = z + a * D; D = Math.abs(D) < tiny ? tiny : D; D = 1 / D;
      C = z + a / C; C = Math.abs(C) < tiny ? tiny : C;
      const delta = C * D; f *= delta;
      if (Math.abs(delta - 1) < 1e-16) break;
    }
    r = Math.exp(-z * z) / Math.sqrt(Math.PI) / f;
  }
  return x >= 0 ? r : 2 - r;
}
export function PhiInv(p) {
  let lo = -40, hi = 40;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// ------------------------------------------------------ spreads from defaults
// The yearly spread that just pays for losing a share P(1 - R) of the money by T.
export const lossSpread = (P, T = 10, R = RECOVERY) => -Math.log(1 - P * (1 - R)) / T;
// The market's chance of default, a distance theta * sqrt(T) from the real one.
export const marketChance = (P, theta, T = 10) => Phi(PhiInv(P) + theta * Math.sqrt(T));
// The spread when lenders are paid at the market's chance.
export const modelSpread = (P, theta, T = 10, R = RECOVERY) => lossSpread(marketChance(P, theta, T), T, R);
export const multiple = (P, theta, T = 10) => modelSpread(P, theta, T) / lossSpread(P, T);

// Everything about Aaa and Baa at one theta.
export function ratings(theta, T = 10) {
  const out = {};
  for (const k of ["Aaa", "Baa"]) {
    const P = DEFAULTS[k][T];
    out[k] = { P, Q: marketChance(P, theta, T), loss: lossSpread(P, T), spread: modelSpread(P, theta, T) };
    out[k].premium = out[k].spread - out[k].loss;
    out[k].multiple = out[k].spread / out[k].loss;
  }
  out.gap = out.Baa.spread - out.Aaa.spread;
  out.lossGap = out.Baa.loss - out.Aaa.loss;
  return out;
}
// The theta at which the model's Baa-over-Aaa gap equals `gap`. The gap rises
// with theta and then falls again once both bonds are nearly sure to default
// in the market's eyes, so the search stays below 0.6, where it still rises.
export function impliedTheta(gap, T = 10) {
  let lo = 0, hi = 0.6;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (ratings(m, T).gap < gap) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// ----------------------------------------------- how sure is a default rate?
// A one-factor world (Vasicek): each year a common shock Z_t hits every firm,
// and a firm's assets over ten years load sqrt(rho) on the decade's average
// shock. A large cohort formed in year c then loses the share
//   Phi((PhiInv(P) - sqrt(rho) * sum(Z_c..Z_c+9)/sqrt(10)) / sqrt(1 - rho))
// within ten years. A record of `years` years has years - 9 such cohorts,
// overlapping, and its estimate of P is their average.
export function records(rho, { P = DEFAULTS.Baa[10], years = 32, horizon = 10, n = 2000, draws }) {
  const zP = PhiInv(P), a = Math.sqrt(rho), b = Math.sqrt(1 - rho), k = years - horizon + 1;
  const out = new Float64Array(n);
  const Z = new Float64Array(years), S = new Float64Array(years + 1);
  for (let r = 0; r < n; r++) {
    for (let t = 0; t < years; t++) { Z[t] = draws(); S[t + 1] = S[t] + Z[t]; }
    let sum = 0;
    for (let c = 0; c < k; c++) sum += Phi((zP - (a * (S[c + horizon] - S[c])) / Math.sqrt(horizon)) / b);
    out[r] = sum / k;
  }
  return out;
}
export function quantile(sorted, q) {
  const h = (sorted.length - 1) * q, i = Math.floor(h);
  return sorted[i] + (h - i) * ((sorted[Math.min(i + 1, sorted.length - 1)] ?? sorted[i]) - sorted[i]);
}
export function summary(est, P = DEFAULTS.Baa[10]) {
  const s = Array.from(est).sort((x, y) => x - y);
  return { sorted: s, lo: quantile(s, 0.05), hi: quantile(s, 0.95), median: quantile(s, 0.5), below: s.filter((v) => v < P).length / s.length };
}
