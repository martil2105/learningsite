/*
  A fund whose true monthly excess returns are independent, with mean MU and
  standard deviation SD, but whose reported returns are smoothed: each month's
  reported return is a share (1 - a) of the true return and a share a of last
  month's reported return,

      Ro_t = (1 - a) R_t + a Ro_{t-1}.

  That's what happens when prices are appraisals that lean on last month's
  value. The mean is untouched; the reported volatility is SD sqrt((1-a)/(1+a));
  reported returns are correlated with their own past at lag k by a^k.

  Every function takes plain numbers; nothing here reads component state.
*/
import { normals } from "./random.js";

export const MU = 0.005;          // 0.5% a month, 6% a year
export const SD = 0.15 / Math.sqrt(12); // 15% a year
export const TRUE_SR = (Math.sqrt(12) * MU) / SD; // 0.40

// The history the lab draws: fifteen years from a seed whose own Sharpe ratio
// is close to the true 0.40 and which has a fall and a recovery in it.
export const SEED = 10;
export const YEARS = 15;

// Sharpe ratio of a q-month sum when monthly returns have autocorrelations rho(k)
// (Lo, 2002): q mu / (sd sqrt(q + 2 sum_{k=1}^{q-1} (q - k) rho_k)).
export function qVarianceFactor(q, rho) {
  let v = q;
  for (let k = 1; k < q; k++) v += 2 * (q - k) * rho(k);
  return v;
}
export const loSharpe = (srMonthly, q, rho) => (q * srMonthly) / Math.sqrt(qVarianceFactor(q, rho));

// The smoothed fund, in closed form.
export function smoothed(a, { mu = MU, sd = SD, q = 12 } = {}) {
  const sdRep = sd * Math.sqrt((1 - a) / (1 + a));
  const srMonthRep = mu / sdRep;
  const naive = Math.sqrt(q) * srMonthRep;                 // the sqrt(12) rule on reported returns
  const lo = loSharpe(srMonthRep, q, (k) => Math.pow(a, k)); // Lo's correction with the true autocorrelations
  const truth = (Math.sqrt(q) * mu) / sd;
  return {
    a, sdRep, sdTrue: sd, naive, lo, truth,
    inflation: naive / truth,            // = sqrt((1+a)/(1-a))
    loInflation: lo / truth,
    hidden: hiddenMonths(a, q),          // months of variance the q-month sum still hides
  };
}

// The variance of a q-month sum of reported returns is SD^2 (q - h), with
// h = 2a(1 - a^q)/(1 - a^2): a fixed number of months, whatever the horizon.
export const hiddenMonths = (a, q = 12) => (2 * a * (1 - Math.pow(a, q))) / (1 - a * a);
export const loInflationAt = (a, q) => Math.sqrt(q / (q - hiddenMonths(a, q)));

// An AR(1) market (no smoothing): how far the sqrt(12) rule is off, as a
// multiplier on the true yearly Sharpe ratio.
export const ar1Factor = (rho, q = 12) => Math.sqrt(qVarianceFactor(q, (k) => Math.pow(rho, k)) / q);

// Paths. True returns from a seed, then the reported ones, then reported ones
// unsmoothed again with a known a.
export function truePath(n, seed = 7, { mu = MU, sd = SD } = {}) {
  const z = normals(seed);
  return Array.from({ length: n }, () => mu + sd * z());
}
export function smooth(R, a, start = null) {
  const out = [];
  let prev = start ?? R[0];
  for (const r of R) { prev = (1 - a) * r + a * prev; out.push(prev); }
  return out;
}
export function unsmooth(Ro, a, before) {
  // before: the reported return of the month before the first one
  const out = [];
  let prev = before;
  for (const ro of Ro) { out.push((ro - a * prev) / (1 - a)); prev = ro; }
  return out;
}
// What $1 is worth, treating each return as a change in the log of the value
// (so smoothing the returns is the same as smoothing the log of the value,
// which is what an appraiser who moves part of the way does).
export const growth = (R) => { let s = 0; return [1, ...R.map((r) => Math.exp((s += r)))]; };

// Sample statistics, for estimates from a finite history.
export function sampleStats(x) {
  const n = x.length, m = x.reduce((s, v) => s + v, 0) / n;
  const v = x.reduce((s, y) => s + (y - m) * (y - m), 0) / (n - 1);
  const ac = (k) => { let c = 0; for (let t = k; t < n; t++) c += (x[t] - m) * (x[t - k] - m); return c / ((n - 1) * v); };
  return { mean: m, sd: Math.sqrt(v), ac };
}
