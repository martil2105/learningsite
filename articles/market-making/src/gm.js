/*
  Glosten and Milgrom's market, with two possible values.

  The stock is worth VH or VL (in cents), each equally likely at the start. A
  share mu of the traders who arrive know which; each of them buys if the stock
  is worth VH and sells if it's worth VL. Everyone else buys or sells at random,
  with even odds. One trader arrives at a time and trades one share.

  The market maker quotes an ask equal to what the stock is worth given a buy,
  and a bid equal to what it's worth given a sell, so it breaks even on average
  on every trade. After k more buys than sells, its belief that the stock is
  worth VH has log-odds k * ell, where ell = ln((1 + mu)/(1 - mu)): each buy
  multiplies the odds by (1 + mu)/(1 - mu) and each sell divides them by it.
*/
import { mulberry32 } from "./random.js";

export const VL = 9900, VH = 10100, D = VH - VL, MID = (VH + VL) / 2;

export const ell = (mu) => Math.log((1 + mu) / (1 - mu));

// the market maker's belief that the stock is worth VH, after k net buys
export function belief(k, mu, lo0 = 0) {
  const z = lo0 + k * ell(mu);
  return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
}
export const value = (k, mu) => VL + D * belief(k, mu);
export const ask = (k, mu) => VL + D * belief(k + 1, mu);
export const bid = (k, mu) => VL + D * belief(k - 1, mu);
export const spread = (k, mu) => ask(k, mu) - bid(k, mu);

// the same spread written as a function of the belief x itself
export const spreadAt = (x, mu) => (D * 4 * mu * x * (1 - x)) / (1 - mu * mu + 4 * mu * mu * x * (1 - x));

// who buys and who sells, as shares of all traders, for each value
export function cells(mu) {
  return {
    high: { informedBuy: mu, randomBuy: (1 - mu) / 2, randomSell: (1 - mu) / 2, informedSell: 0 },
    low: { informedBuy: 0, randomBuy: (1 - mu) / 2, randomSell: (1 - mu) / 2, informedSell: mu },
  };
}
// the chance the stock is worth VH given a buy, from the cells (prior one half)
export function highGivenBuy(mu) {
  const c = cells(mu);
  const hb = 0.5 * (c.high.informedBuy + c.high.randomBuy), lb = 0.5 * (c.low.informedBuy + c.low.randomBuy);
  return hb / (hb + lb);
}

// ------------------------------------------------------------ one day of trades
// Two uniform draws per trade, fixed by the seed, so moving mu or the true value
// replays the same arrivals: u1 < mu makes the trader informed, u2 < 1/2 makes an
// uninformed trader a buyer.
export function day(seed, mu, high, n = 300) {
  const u = mulberry32(seed);
  const V = high ? VH : VL;
  const trades = [];
  let k = 0, mm = 0, inf = 0, unf = 0;
  for (let t = 0; t < n; t++) {
    const u1 = u(), u2 = u();
    const informed = u1 < mu;
    const buy = informed ? high : u2 < 0.5;
    const a = ask(k, mu), b = bid(k, mu);
    const price = buy ? a : b;
    // gains measured against the true value: the trader gains V - price on a buy
    const g = buy ? V - price : price - V;
    if (informed) inf += g; else unf += g;
    mm -= g;
    trades.push({ t: t + 1, k, bid: b, ask: a, buy, informed, price, mm, inf, unf });
    k += buy ? 1 : -1;
  }
  return { V, trades, kEnd: k };
}

// The lab's days, in order: an ordinary day first, then one where the price
// wanders the wrong way for a long stretch, then a few more; after these, fresh seeds.
export const DAYS = [11, 7, 13, 5, 26, 32, 38, 20];
export const seedOf = (dayNo) => (dayNo <= DAYS.length ? DAYS[dayNo - 1] : 100 + dayNo);

// ------------------------------------------------ the average spread, trade by trade
// The expected spread before trade t+1, given the stock is worth VH (by symmetry
// the same for VL). The net buys follow a random walk that steps up with chance
// (1 + mu)/2; its distribution is carried forward exactly.
export function expectedSpreads(mu, n) {
  const p = (1 + mu) / 2, q = 1 - p, off = n + 1, len = 2 * n + 3;
  const sp = new Float64Array(len);
  for (let i = 0; i < len; i++) sp[i] = spread(i - off, mu);
  let dist = new Float64Array(len), nd = new Float64Array(len);
  dist[off] = 1;
  const out = new Float64Array(n);
  let lo = off, hi = off;
  for (let t = 0; t < n; t++) {
    let e = 0;
    for (let i = lo; i <= hi; i += 2) e += dist[i] * sp[i];
    out[t] = e;
    nd.fill(0, lo - 1, hi + 2);
    for (let i = lo; i <= hi; i += 2) { nd[i + 1] += dist[i] * p; nd[i - 1] += dist[i] * q; }
    [dist, nd] = [nd, dist];
    lo -= 1; hi += 1;
  }
  return out;
}
// the first trade at which the average spread is below a share of its opening width
export function tradesTo(mu, share, n = 4000) {
  const s = expectedSpreads(mu, n);
  for (let t = 0; t < n; t++) if (s[t] < share * s[0]) return t;
  return NaN;
}

// ------------------------------------------------ what the uninformed pay per piece of news
// An uninformed trader loses half the spread on average, whatever the truth, so
// the uninformed together lose (1 - mu) * spread / 2 per trade. Summed over the
// trades before the news comes out (n of them), or over every trade if it never
// does. The informed collect the same amount and the market maker nothing.
export function billBefore(mu, n) {
  const s = expectedSpreads(mu, n);
  let tot = 0; for (let t = 0; t < n; t++) tot += s[t];
  return ((1 - mu) / 2) * tot;
}
// n = infinity: the expected sum of spreads S(k) solves S(k) = s(k) + p S(k+1) + (1-p) S(k-1),
// solved on a wide stretch of k where the spread outside is negligible
export function billNever(mu) {
  const K = Math.ceil(60 / ell(mu)) + 50, n = 2 * K + 1, p = (1 + mu) / 2, q = 1 - p;
  const b = new Float64Array(n), c = new Float64Array(n), d = new Float64Array(n);
  for (let i = 0; i < n; i++) { b[i] = 1; c[i] = -p; d[i] = spread(i - K, mu); }
  for (let i = 1; i < n; i++) { const w = -q / b[i - 1]; b[i] -= w * c[i - 1]; d[i] -= w * d[i - 1]; }
  const S = new Float64Array(n);
  S[n - 1] = d[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; i--) S[i] = (d[i] - c[i] * S[i + 1]) / b[i];
  return ((1 - mu) / 2) * S[K];
}
// the small-mu limit of the bill: ln 2 * D * (1 - mu) / mu
export const billLimit = (mu) => Math.LN2 * D * (1 - mu) / mu;

export const MUS = Array.from({ length: 50 }, (_, i) => 0.01 * (i + 1));
const cache = {};
export function billCurve(n) {
  const key = String(n);
  if (!cache[key]) cache[key] = MUS.map((mu) => (n === Infinity ? billNever(mu) : billBefore(mu, n)));
  return cache[key];
}
// where the bill peaks, for a news horizon of n trades, on a fine grid
export function peak(n, lo = 0.005, hi = 0.5, step = 0.0025) {
  let best = -1, arg = lo;
  for (let mu = lo; mu <= hi + 1e-12; mu += step) { const v = billBefore(mu, n); if (v > best) { best = v; arg = mu; } }
  return { mu: arg, bill: best };
}
