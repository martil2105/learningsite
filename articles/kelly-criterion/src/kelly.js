/*
  The Kelly criterion, twice over.

  The coin game is Haghani and Dewey's (2016): a coin that lands heads 60% of
  the time, even-money bets, $25 to start and about 300 flips. A player who
  bets a fixed fraction f of her money each flip has, after k heads in n
  flips, 25 (1 + f)^k (1 − f)^(n − k), so everything about her is a
  binomial sum, computed exactly here.

  The stock market version is continuous: a premium m over cash and a
  volatility σ, rebalanced continuously, measured against cash (so the safe
  rate drops out). A position of c times the Kelly share m/σ² has a log
  wealth that drifts at SR²(2c − c²)/2 a year with volatility c·SR, where
  SR = m/σ, and every claim on the page follows from those two numbers.
*/
import { Phi, PhiInv } from "./stats.js";
import { mulberry32, normals } from "./random.js";

// ------------------------------------------------------------------ the coin
export const P = 0.6, START = 25, FLIPS = 300, CAP = 250;
export const KELLY_COIN = 2 * P - 1; // 0.2 for an even-money bet

// expected log growth per flip
export const growth = (f, p = P) => (f >= 1 ? -Infinity : p * Math.log1p(f) + (1 - p) * Math.log1p(-f));
// the log growth of the average wealth per flip
export const meanGrowth = (f, p = P) => Math.log1p(f * (2 * p - 1));

// the fraction above Kelly where growth falls back to zero
export function zeroGrowth(p = P) {
  let lo = 2 * p - 1, hi = 1 - 1e-12;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (growth(m, p) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

const lgam = (() => { const c = [0]; for (let i = 1; i <= 5000; i++) c[i] = c[i - 1] + Math.log(i); return c; })();
export function pmf(n, p = P) {
  const out = new Float64Array(n + 1);
  for (let k = 0; k <= n; k++) out[k] = Math.exp(lgam[n] - lgam[k] - lgam[n - k] + k * Math.log(p) + (n - k) * Math.log(1 - p));
  return out;
}
export const wealthAfter = (f, k, n) => (f >= 1 ? (k === n ? START * Math.pow(2, n) : 0) : START * Math.exp(k * Math.log1p(f) + (n - k) * Math.log1p(-f)));

// median wealth: the median of Binomial(n, 0.6) is 0.6n when that is whole,
// and wealth rises with the number of heads, so it is the wealth at 0.6n heads
export const medianWealth = (f, n = FLIPS) => wealthAfter(f, Math.round(P * n), n);
export const meanWealth = (f, n = FLIPS) => START * Math.pow(1 + f * (2 * P - 1), n);
// the chance of ending behind the $25 we started with
export function behind(f, n = FLIPS) {
  const w = pmf(n); let s = 0;
  for (let k = 0; k <= n; k++) if (wealthAfter(f, k, n) < START) s += w[k];
  return s;
}
// the chance that fraction f1 ends ahead of fraction f2 after n flips
export function raceCoin(f1, f2, n) {
  const w = pmf(n), a = Math.log1p(f1) - Math.log1p(f2), b = Math.log1p(-f1) - Math.log1p(-f2);
  let s = 0;
  for (let k = 0; k <= n; k++) if (k * a + (n - k) * b > 0) s += w[k];
  return s;
}
// the per-flip Sharpe ratio of an even-money bet: mean 2p − 1 over sd 2√(pq)
export const SR_COIN = (2 * P - 1) / (2 * Math.sqrt(P * (1 - P)));

// 61 seeded players, as in the experiment: heads[i][t] is player i's number of
// heads after t flips, so a path at any fraction is a function of it
export const PLAYERS = 61, PLAYER_SEED = 116;
export function players(n = FLIPS, count = PLAYERS, seed = PLAYER_SEED) {
  const u = mulberry32(seed), out = [];
  for (let i = 0; i < count; i++) {
    const h = new Int16Array(n + 1);
    for (let t = 1; t <= n; t++) h[t] = h[t - 1] + (u() < P ? 1 : 0);
    out.push(h);
  }
  return out;
}
export const pathWealth = (h, f) => Array.from(h, (k, t) => wealthAfter(f, k, t));
export function everBelow(h, f, level) {
  for (let t = 0; t < h.length; t++) if (wealthAfter(f, h[t], t) <= level) return true;
  return false;
}

// ---------------------------------------------------------- the stock market
export const M = 0.05, SIGMA = 0.18;
export const SR = M / SIGMA;
export const KELLY = M / (SIGMA * SIGMA);
// c is the position as a multiple of the Kelly share
export const drift = (c) => (SR * SR * (2 * c - c * c)) / 2; // log growth over cash, a year
export const vol = (c) => c * SR;
// the chance of ever falling to a fraction x of today's wealth (measured
// against cash): x^(2/c − 1) below twice Kelly, certain at or above it
export const everFall = (c, x) => (c >= 2 ? 1 : Math.pow(x, 2 / c - 1));
// the same within T years: Brownian motion with drift ν and volatility s
// first reaching −a, a = −ln x
export function fallWithin(c, x, T) {
  const nu = drift(c), s = vol(c), a = -Math.log(x), r = s * Math.sqrt(T);
  return Phi((-a - nu * T) / r) + Math.exp((-2 * nu * a) / (s * s)) * Phi((-a + nu * T) / r);
}
// the chance that the Kelly bettor is ahead of c times Kelly after T years:
// the gap in log wealth drifts at (1 − c)²SR²/2 with volatility |1 − c|·SR
export const raceStocks = (c, T) => Phi((Math.abs(1 - c) * SR * Math.sqrt(T)) / 2);
// the years needed for the Kelly bettor to be ahead with probability prob
export const yearsFor = (prob, c = 0.5) => Math.pow((2 * PhiInv(prob)) / (Math.abs(1 - c) * SR), 2);
// the years of stock market that hold as much evidence as n flips: SR²T = SR_coin² n
export const yearsLikeFlips = (n) => (SR_COIN * SR_COIN * n) / (SR * SR);

// The exact chance, over n flips, that wealth ever touches a level: a walk on
// the binomial lattice that stops counting a path once it has touched.
// below = true for "ever at or below level", false for "ever at or above".
export function everTouch(f, level, n = FLIPS, below = true) {
  let alive = new Float64Array(n + 2); alive[0] = 1; let hit = 0;
  const touched = (k, t) => (below ? wealthAfter(f, k, t) <= level : wealthAfter(f, k, t) >= level);
  if (touched(0, 0)) return 1;
  for (let t = 1; t <= n; t++) {
    const next = new Float64Array(n + 2);
    for (let k = 0; k < t; k++) {
      if (!alive[k]) continue;
      next[k + 1] += alive[k] * P;
      next[k] += alive[k] * (1 - P);
    }
    for (let k = 0; k <= t; k++) if (next[k] && touched(k, t)) { hit += next[k]; next[k] = 0; }
    alive = next;
  }
  return hit;
}

// Forty pairs of investors in the stock market, one holding the Kelly share
// and the other c times it. Both hold the same market, so with B_t one
// Brownian path, ln W_c = drift(c) t + c SR B_t and the log of Kelly's money
// over the rival's is (1 − c)² SR² t / 2 + (1 − c) SR B_t. The paths are
// exact yearly steps, and the same luck is reused for every rival.
export const PAIRS = 40, PAIR_SEED = 768, YEARS = 300;
export function brownian(years = YEARS, count = PAIRS, seed = PAIR_SEED) {
  const g = normals(seed), out = [];
  for (let i = 0; i < count; i++) {
    const b = new Float64Array(years + 1);
    for (let t = 1; t <= years; t++) b[t] = b[t - 1] + g();
    out.push(b);
  }
  return out;
}
export const gapAt = (c, b, t) => ((1 - c) * (1 - c) * SR * SR * t) / 2 + (1 - c) * SR * b[t];
