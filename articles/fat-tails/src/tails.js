/*
  The tails of the US market's daily returns. A day's size is measured in
  standard deviations of the whole sample, z = (r − mean)/sd, using simple
  returns, and everything is compared with the normal distribution that has
  the same mean and standard deviation.
*/
import { RET, DATES, N } from "./market.js";
import { Phi } from "./stats.js";

export const DAYS_A_YEAR = 252;
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
export const MEAN = mean(RET);
export const SD = Math.sqrt(RET.reduce((s, x) => s + (x - MEAN) ** 2, 0) / (N - 1));
export const Z = RET.map((r) => (r - MEAN) / SD);
export const YEARS = N / DAYS_A_YEAR;

// days beyond k standard deviations, each side and both
export const below = (k) => Z.filter((z) => z <= -k).length;
export const above = (k) => Z.filter((z) => z >= k).length;
export const beyond = (k) => below(k) + above(k);
// what the normal expects over the same number of days, both sides together
export const normalExpects = (k, days = N) => 2 * days * Phi(-k);
// how many years apart such days come: in the data, and under the normal
export const yearsApart = (k) => YEARS / beyond(k);
export const normalYearsApart = (k) => 1 / (2 * Phi(-k) * DAYS_A_YEAR);

// sample kurtosis (3 for a normal) of a slice
export function kurtosis(a, i0 = 0, i1 = a.length) {
  let m = 0; for (let i = i0; i < i1; i++) m += a[i]; m /= i1 - i0;
  let v = 0, f = 0; for (let i = i0; i < i1; i++) { const d = (a[i] - m) ** 2; v += d; f += d * d; }
  v /= i1 - i0; f /= i1 - i0;
  return f / (v * v);
}
// the running kurtosis of a series, at every step (one pass, from power sums)
export function runningKurtosis(a, every = 1) {
  let s1 = 0, s2 = 0, s3 = 0, s4 = 0; const out = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i]; s1 += x; s2 += x * x; s3 += x * x * x; s4 += x * x * x * x;
    const n = i + 1;
    if (n >= 20 && (n % every === 0 || n === a.length)) {
      const m = s1 / n, v = s2 / n - m * m;
      const m4 = s4 / n - 4 * m * (s3 / n) + 6 * m * m * (s2 / n) - 3 * m ** 4;
      out.push([n, m4 / (v * v)]);
    }
  }
  return out;
}
// the share of the sum of fourth powers that comes from the single largest day
export function maxShare(a, i0 = 0, i1 = a.length) {
  let m = 0; for (let i = i0; i < i1; i++) m += a[i]; m /= i1 - i0;
  let s = 0, mx = 0, at = i0;
  for (let i = i0; i < i1; i++) { const q = (a[i] - m) ** 4; s += q; if (q > mx) { mx = q; at = i; } }
  return { share: mx / s, at };
}
// Hill's estimate of the tail exponent from the k largest losses (side −1) or gains (+1)
export function hill(k, side = -1) {
  const xs = Z.map((z) => side * z).filter((x) => x > 0).sort((a, b) => b - a);
  let h = 0; for (let i = 0; i < k; i++) h += Math.log(xs[i] / xs[k]);
  return { alpha: k / h, xk: xs[k] };
}
// the empirical survival function of one tail: share of days beyond each size
export function survival(side = -1) {
  const xs = Z.map((z) => side * z).filter((x) => x > 0).sort((a, b) => b - a);
  return xs.map((x, i) => [x, (i + 1) / N]);
}
export { DATES, N, RET };

// Student t draws with ν degrees of freedom, scaled to unit variance (ν > 2):
// a normal over the root of an independent chi-square over ν. Its fourth
// moment exists only for ν > 4, where the kurtosis is 3 + 6/(ν − 4).
import { normals } from "./random.js";
export function studentT(n, nu, seed) {
  const g = normals(seed), out = new Float64Array(n), scale = Math.sqrt((nu - 2) / nu);
  for (let i = 0; i < n; i++) {
    let c = 0; for (let j = 0; j < nu; j++) { const x = g(); c += x * x; }
    out[i] = (g() / Math.sqrt(c / nu)) * scale;
  }
  return out;
}
export const tKurtosis = (nu) => (nu > 4 ? 3 + 6 / (nu - 4) : Infinity);

// calendar years covered, and trading days a year (Saturdays traded until 1952)
const ms = (n) => Date.UTC(Math.floor(n / 1e4), Math.floor(n / 100) % 100 - 1, n % 100);
export const CAL_YEARS = (ms(DATES[N - 1]) - ms(DATES[0])) / 864e5 / 365.25;
export const DAYS_PER_YEAR = N / CAL_YEARS;
export const dataYearsApart = (k) => CAL_YEARS / beyond(k);
export const normalYearsApartCal = (k) => 1 / (2 * Phi(-k) * DAYS_PER_YEAR);

// a histogram of z in bins of width w, from lo to hi
export function histogram(w = 0.5, lo = -18, hi = 16) {
  const n = Math.round((hi - lo) / w), counts = new Array(n).fill(0);
  for (const z of Z) { const i = Math.floor((z - lo) / w); if (i >= 0 && i < n) counts[i]++; }
  return counts.map((c, i) => ({ a: lo + i * w, b: lo + (i + 1) * w, c, normal: N * (Phi(lo + (i + 1) * w) - Phi(lo + i * w)) }));
}

// windows of L years from 1927: kurtosis, and the biggest day's share of the fourth powers
export function windows(L) {
  const out = [];
  for (let y = 1927; y + L - 1 <= 2026; y += L) {
    const i0 = DATES.findIndex((d) => d >= y * 1e4);
    let i1 = DATES.findIndex((d) => d >= (y + L) * 1e4); if (i1 < 0) i1 = N;
    const m = maxShare(RET, i0, i1);
    out.push({ a: y, b: y + L - 1, kurt: kurtosis(RET, i0, i1), share: m.share, day: DATES[m.at], ret: RET[m.at] });
  }
  return out;
}

// the running kurtosis of a series at chosen sample sizes (one pass)
export function kurtosisAt(a, ns) {
  let s1 = 0, s2 = 0, s3 = 0, s4 = 0, j = 0; const out = [];
  for (let i = 0; i < a.length && j < ns.length; i++) {
    const x = a[i]; s1 += x; s2 += x * x; s3 += x * x * x; s4 += x * x * x * x;
    if (i + 1 === ns[j]) {
      const n = i + 1, m = s1 / n, v = s2 / n - m * m;
      out.push([n, (s4 / n - 4 * m * (s3 / n) + 6 * m * m * (s2 / n) - 3 * m ** 4) / (v * v)]);
      j++;
    }
  }
  return out;
}
// sample sizes from 100 to 100,000 days, 40 to a factor of ten
export const T_DAYS = 100000;
export const GRID = [...new Set(Array.from({ length: 121 }, (_, j) => Math.round(100 * Math.pow(10, j / 40))))];
export const T_SEEDS = { 3: [11, 12, 13, 14], 6: [21, 22, 23, 24] };
export const tRun = (nu, seed) => kurtosisAt(studentT(T_DAYS, nu, seed), GRID);
