/*
  Backtesting a 99% value at risk by counting exceptions.

  An exception is a day whose loss is bigger than the value at risk reported
  the evening before. If the model is right, each day is an exception with
  probability 1% whatever happened before it, so a year's count K is
  Binomial(n, 1%), with n the year's trading days (250 in the rules).

  Part one is that binomial: the Basel traffic light (green 0–4, yellow 5–9,
  red 10 or more in 250 days), Kupiec's likelihood-ratio test, and how many
  days a one-sided test needs to tell 1% from a higher rate.

  Part two runs four models over a century of US daily returns (French's
  daily file, in market.js) and counts their exceptions year by year:
    century      the 99% loss of all the days being tested (it knows the future)
    history      the 3rd-largest loss of the last 250 days (historical simulation)
    riskmetrics  2.326 × an exponentially weighted volatility, λ = 0.94
    filtered     that volatility × the 99% quantile of the last 1,000 days'
                 losses, each divided by its own day's volatility
  Losses are −r with r the market's total daily return. Every quantile is the
  smallest loss l with P(L ≤ l) ≥ 99%, as in the value-at-risk article.
*/
import { RET, DATES, N, yearOf } from "./market.js";
import { PhiInv } from "./stats.js";

export const P0 = 0.01;
export const YEAR = 250;

// ------------------------------------------------------------------ binomial
const LG = (() => { const c = new Float64Array(30001); for (let i = 1; i <= 30000; i++) c[i] = c[i - 1] + Math.log(i); return c; })();
export function pmf(n, p, k) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  return Math.exp(LG[n] - LG[k] - LG[n - k] + k * Math.log(p) + (n - k) * Math.log1p(-p));
}
export function cdf(n, p, k) { let s = 0; for (let j = 0; j <= k; j++) s += pmf(n, p, j); return Math.min(1, s); }
export const upper = (n, p, c) => Math.max(0, 1 - cdf(n, p, c - 1)); // P(K ≥ c)

// ---------------------------------------------------------- the traffic light
// The zones come from the binomial for a right model: green while
// P(K ≤ k) ≤ 95%, red once it passes 99.99%.
export function zoneEdges(n = YEAR, p = P0) {
  let c = 0, yellow = null, red = null;
  for (let k = 0; k <= n; k++) {
    c += pmf(n, p, k);
    if (yellow === null && c > 0.95) yellow = k;
    if (red === null && c > 0.9999) { red = k; break; }
  }
  return { yellow, red }; // first yellow count, first red count
}
const EDGES = zoneEdges();
export const YELLOW = EDGES.yellow, RED = EDGES.red; // 5 and 10
export const zoneOf = (k) => (k >= RED ? "red" : k >= YELLOW ? "yellow" : "green");
// the plus factor on the capital multiplier of 3
const PLUS = { 5: 0.4, 6: 0.5, 7: 0.65, 8: 0.75, 9: 0.85 };
export const plusFactor = (k) => (k < YELLOW ? 0 : k >= RED ? 1 : PLUS[k]);

export function zoneChances(p, n = YEAR) {
  let green = 0, yellow = 0, red = 0, mult = 0;
  for (let k = 0; k <= n; k++) {
    const q = pmf(n, p, k);
    const z = zoneOf(k);
    if (z === "green") green += q; else if (z === "yellow") yellow += q; else red += q;
    mult += q * (3 + plusFactor(k));
  }
  return { green, yellow, red, mean: n * p, sd: Math.sqrt(n * p * (1 - p)), multiplier: mult };
}

// ----------------------------------------------------------- Kupiec's test
// LR = −2 ln[ (1−p)^(n−k) p^k / ((1−k/n)^(n−k) (k/n)^k) ], against χ²(1)'s 3.84
export const CHI95 = 3.841458820694124;
export function kupiec(n, k, p = P0) {
  const h = k / n;
  const l0 = (n - k) * Math.log1p(-p) + (k ? k * Math.log(p) : 0);
  const l1 = (n - k ? (n - k) * Math.log1p(-h) : 0) + (k ? k * Math.log(h) : 0);
  return -2 * (l0 - l1);
}
export function kupiecAccept(n, p = P0) {
  const ks = [];
  for (let k = 0; k <= n; k++) if (kupiec(n, k, p) < CHI95) ks.push(k);
  return [ks[0], ks[ks.length - 1]];
}

// ------------------------------------- how many days to catch a bad model
// One-sided: reject when K ≥ c, the smallest c with P(K ≥ c | 1%) ≤ 5%.
export function critical(n, p0 = P0, size = 0.05) {
  let c = 0;
  for (let k = 0; k <= n; k++) { if (1 - c <= size + 1e-15) return k; c += pmf(n, p0, k); }
  return n + 1;
}
export const power = (n, p1, p0 = P0) => upper(n, p1, critical(n, p0));
// the first n from which the power stays at or above the target (checked up to nMax)
export function daysToCatch(p1, target = 0.8, nMax = 20000) {
  let last = 0;
  for (let n = 20; n <= nMax; n++) if (power(n, p1) < target) last = n;
  return last + 1;
}
// the normal approximation: n ≈ ((z₉₅ √(p₀q₀) + z₈₀ √(p₁q₁)) / (p₁ − p₀))²
export function daysApprox(p1, target = 0.8, p0 = P0, size = 0.05) {
  const a = PhiInv(1 - size), b = PhiInv(target);
  return ((a * Math.sqrt(p0 * (1 - p0)) + b * Math.sqrt(p1 * (1 - p1))) / (p1 - p0)) ** 2;
}

// ------------------------------------------------------ four models on data
// The tested days are the last 104 blocks of 250 trading days, ending on the
// file's last day, so the newest block is "the last 250 days" as a regulator
// would see them today. Every model has at least 250 days behind its first one.
export const BLOCKS = Math.floor((N - YEAR) / YEAR);
export const FIRST = N - BLOCKS * YEAR;
export const Z99 = PhiInv(0.99);
export const LAMBDA = 0.94;
export const MODELS = [
  { key: "century", label: "The century's 1%" },
  { key: "history", label: "The last 250 days" },
  { key: "riskmetrics", label: "RiskMetrics" },
  { key: "filtered", label: "RiskMetrics with history" },
];

// the 99% quantile of a sample: the smallest l with a share of at least 99% at or below it
export const rankFromTop = (m, alpha = 0.99) => Math.floor((1 - alpha) * m + 1e-9); // 0-based index in a descending sort
export function quantile99(xs) { const s = Array.from(xs).sort((a, b) => b - a); return s[rankFromTop(s.length)]; }

// a window kept sorted (ascending) as days arrive and leave
function slidingTop(values, window, from, start = 0) {
  const out = new Float64Array(N).fill(NaN);
  const s = [];
  const ins = (v) => { let lo = 0, hi = s.length; while (lo < hi) { const m = (lo + hi) >> 1; if (s[m] < v) lo = m + 1; else hi = m; } s.splice(lo, 0, v); };
  const del = (v) => { let lo = 0, hi = s.length; while (lo < hi) { const m = (lo + hi) >> 1; if (s[m] < v) lo = m + 1; else hi = m; } s.splice(lo, 1); };
  for (let t = start; t < N; t++) {
    if (t >= from && s.length) out[t] = s[s.length - 1 - rankFromTop(s.length)];
    ins(values[t]);
    if (s.length > window) del(values[t - window]);
  }
  return out;
}

const LOSS = RET.map((r) => -r);
// RiskMetrics' volatility for day t, from returns up to t − 1, seeded with day 0's square
export const SIGMA = (() => {
  const s = new Float64Array(N);
  let v = RET[0] * RET[0];
  s[0] = NaN;
  for (let t = 1; t < N; t++) { s[t] = Math.sqrt(v); v = LAMBDA * v + (1 - LAMBDA) * RET[t] * RET[t]; }
  // s[t] uses r_0 … r_{t−1}: v after the update at t−1 holds r_{t−1}
  return s;
})();

const cache = {};
export function varSeries(key) {
  if (cache[key]) return cache[key];
  let v;
  if (key === "century") {
    const q = quantile99(LOSS.slice(FIRST));
    v = new Float64Array(N).fill(NaN);
    for (let t = FIRST; t < N; t++) v[t] = q;
  } else if (key === "history") {
    v = slidingTop(LOSS, 250, FIRST);
  } else if (key === "riskmetrics") {
    v = new Float64Array(N).fill(NaN);
    for (let t = FIRST; t < N; t++) v[t] = Z99 * SIGMA[t];
  } else if (key === "filtered") {
    const z = new Float64Array(N);
    for (let t = 1; t < N; t++) z[t] = LOSS[t] / SIGMA[t];
    const zq = slidingTop(z, 1000, FIRST, 1);
    v = new Float64Array(N).fill(NaN);
    for (let t = FIRST; t < N; t++) v[t] = SIGMA[t] * zq[t];
  } else throw new Error(key);
  return (cache[key] = v);
}

export function exceptions(key) {
  const v = varSeries(key), out = new Uint8Array(N);
  for (let t = FIRST; t < N; t++) out[t] = LOSS[t] > v[t] + 1e-12 ? 1 : 0;
  return out;
}

// block b runs over days [FIRST + 250b, FIRST + 250(b + 1))
export const blockSpan = (b) => [FIRST + YEAR * b, FIRST + YEAR * (b + 1)];
export const blockEnd = (b) => DATES[FIRST + YEAR * (b + 1) - 1];
export const blockStart = (b) => DATES[FIRST + YEAR * b];
// the block that holds a date (yyyymmdd), or the nearest one
export function blockOf(date) { let b = 0; while (b < BLOCKS - 1 && blockEnd(b) < date) b++; return b; }

export function blocks(key) {
  const e = exceptions(key);
  return Array.from({ length: BLOCKS }, (_, b) => { const [a, z] = blockSpan(b); let k = 0; for (let t = a; t < z; t++) k += e[t]; return { b, start: DATES[a], end: DATES[z - 1], k, zone: zoneOf(k) }; });
}

// the chance of an exception, and of one the day after one; Christoffersen's LR
export function timing(key) {
  const e = exceptions(key);
  let n00 = 0, n01 = 0, n10 = 0, n11 = 0;
  for (let t = FIRST + 1; t < N; t++) {
    const a = e[t - 1], b = e[t];
    if (!a && !b) n00++; else if (!a && b) n01++; else if (a && !b) n10++; else n11++;
  }
  const p01 = n01 / (n00 + n01), p11 = n11 / (n10 + n11), p = (n01 + n11) / (n00 + n01 + n10 + n11);
  const ll = (k, n, q) => (k ? k * Math.log(q) : 0) + (n - k ? (n - k) * Math.log(1 - q) : 0);
  const lrInd = -2 * (ll(n01 + n11, n00 + n01 + n10 + n11, p) - ll(n01, n00 + n01, p01) - ll(n11, n10 + n11, p11));
  return { p01, p11, after: n11, of: n10 + n11, lrInd };
}

// the variance of a 250-day count against the binomial's: from the
// exception series' autocorrelations, 1 + 2 Σ (1 − k/250) ρ_k, and directly
// from every 250-day window
export function bunching(key, w = YEAR) {
  const e = exceptions(key);
  const I = Array.from(e.subarray(FIRST));
  const n = I.length, p = I.reduce((s, x) => s + x, 0) / n;
  const d = I.map((x) => x - p);
  const c0 = d.reduce((s, x) => s + x * x, 0) / n;
  let vr = 1;
  for (let k = 1; k < w; k++) { let c = 0; for (let t = k; t < n; t++) c += d[t] * d[t - k]; vr += 2 * (1 - k / w) * (c / n / c0); }
  const counts = []; let s = 0;
  for (let t = 0; t < n; t++) { s += I[t]; if (t >= w) s -= I[t - w]; if (t >= w - 1) counts.push(s); }
  const m = counts.reduce((a, b) => a + b, 0) / counts.length;
  const v = counts.reduce((a, b) => a + (b - m) ** 2, 0) / counts.length;
  return { fromAcf: vr, fromWindows: v / (w * p * (1 - p)), rho1: (() => { let c = 0; for (let t = 1; t < n; t++) c += d[t] * d[t - 1]; return c / n / c0; })() };
}

export function summary(key) {
  const e = exceptions(key);
  let k = 0; for (let t = FIRST; t < N; t++) k += e[t];
  const n = N - FIRST;
  const ys = blocks(key);
  const counts = ys.map((y) => y.k);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const sampleVar = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / (counts.length - 1);
  return {
    k, n, rate: k / n,
    blocks: ys.length,
    green: ys.filter((y) => y.zone === "green").length,
    yellow: ys.filter((y) => y.zone === "yellow").length,
    red: ys.filter((y) => y.zone === "red").length,
    none: ys.filter((y) => y.k === 0).length,
    most: ys.reduce((a, y) => (y.k > a.k ? y : a), ys[0]),
    meanCount: mean, countVar: sampleVar, binomVar: YEAR * P0 * (1 - P0),
    ...timing(key),
  };
}

// one block's days for the year view: returns, the model's VaR, exceptions
export function blockDays(key, b) {
  const [a, z] = blockSpan(b), v = varSeries(key), e = exceptions(key);
  const out = [];
  for (let t = a; t < z; t++) out.push({ t, date: DATES[t], r: RET[t], v: v[t], ex: e[t] === 1 });
  return out;
}

// ------------------------------------------------- order against count
import { mulberry32 } from "./random.js";
// the tested days' exceptions, 0 or 1, in order
export const tested = (key) => exceptions(key).slice(FIRST);
// the same exceptions on randomly shuffled days (Fisher–Yates, seeded)
export function shuffled(I, seed) {
  const u = mulberry32(seed), J = Uint8Array.from(I);
  for (let i = J.length - 1; i > 0; i--) { const j = Math.floor(u() * (i + 1)); const x = J[i]; J[i] = J[j]; J[j] = x; }
  return J;
}
// what a series of exceptions looks like in blocks of 250, and the day after one
export function describe(I) {
  const counts = [];
  for (let b = 0; b < I.length / YEAR; b++) { let k = 0; for (let t = b * YEAR; t < (b + 1) * YEAR; t++) k += I[t]; counts.push(k); }
  let n10 = 0, n11 = 0, k = 0;
  for (let t = 0; t < I.length; t++) { k += I[t]; if (t && I[t - 1]) { if (I[t]) n11++; else n10++; } }
  // the spread of the count over every 250-day window, against independent days'
  const win = []; let s = 0;
  for (let t = 0; t < I.length; t++) { s += I[t]; if (t >= YEAR) s -= I[t - YEAR]; if (t >= YEAR - 1) win.push(s); }
  const m = win.reduce((a, b) => a + b, 0) / win.length;
  const v = win.reduce((a, b) => a + (b - m) ** 2, 0) / win.length;
  const p = k / I.length;
  return {
    counts, k, rate: p,
    red: counts.filter((c) => c >= RED).length,
    yellow: counts.filter((c) => c >= YELLOW && c < RED).length,
    none: counts.filter((c) => c === 0).length,
    most: Math.max(...counts),
    after: n11 / (n10 + n11),
    factor: v / (YEAR * p * (1 - p)),
  };
}
// how many blocks a model with independent days would have with k exceptions
export const binomialBlocks = (rate, k, blocks = BLOCKS) => blocks * pmf(YEAR, rate, k);

// ------------------------------------------- does the penalty pay for it?
// A model whose real exception rate is p reports the loss beaten on p of days.
// Its average capital is its average multiplier times that loss; against a
// right model's, on the US market's tested days and for normal losses.
const SORTED_LOSS = Array.from(RET.slice(FIRST), (r) => -r).sort((a, b) => b - a);
export const usLoss = (alpha) => SORTED_LOSS[rankFromTop(SORTED_LOSS.length, alpha)];
export const capitalRatio = (p) => (zoneChances(p).multiplier * usLoss(1 - p)) / (zoneChances(P0).multiplier * usLoss(1 - P0));
export const capitalRatioNormal = (p) => (zoneChances(p).multiplier * PhiInv(1 - p)) / (zoneChances(P0).multiplier * PhiInv(1 - P0));
