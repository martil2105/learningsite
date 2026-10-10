/*
  The yield curve, three ways, on one planted curve of spot rates.

  A spot rate s_t is the yield of a zero-coupon bond maturing in t years
  (annual compounding). We plant s(t) = 4.5% − 2.5%·e^(−t/4), price five coupon
  bonds off it, and get the curve back by bootstrapping: each bond's last
  payment is the only one not yet priced, so its discount factor is what's
  left of the price. A forward rate f_n is the one-year rate from year n − 1
  to n that the spot rates lock in: (1 + s_n)^n = (1 + s_{n−1})^(n−1)(1 + f_n).

  The last section's model is Vasicek's: a short rate that drifts back to θ at
  speed κ with volatility σ. If every bond is expected to earn the same as
  cash over the next instant (no premium), the instantaneous forward rate is
  f(T) = E[r_T] − σ²/(2κ²)·(1 − e^(−κT))², below the expected rate by a
  convexity term; a premium for holding long bonds adds π(1 − e^(−κT)).
  These rates are continuously compounded.
*/
import { yieldOf } from "./bonds.js";

export const spot = (t) => 0.045 - 0.025 * Math.exp(-t / 4);
export const discount = (t, s = spot) => Math.pow(1 + s(t), -t);

// five coupon bonds, priced off the planted curve
export const BONDS = [
  { T: 1, c: 0.02 },
  { T: 2, c: 0.025 },
  { T: 3, c: 0.03 },
  { T: 4, c: 0.035 },
  { T: 5, c: 0.04 },
];
export const priceOff = (c, T, s = spot) => { let p = 0; for (let t = 1; t <= T; t++) p += 100 * c * discount(t, s); return p + 100 * discount(T, s); };
export const PRICES = BONDS.map((b) => priceOff(b.c, b.T));

// bootstrapping: one maturity at a time, from the prices alone
export function bootstrap(prices, bonds = BONDS) {
  const dfs = [], spots = [], steps = [];
  bonds.forEach((b, i) => {
    let known = 0;
    for (let t = 1; t < b.T; t++) known += 100 * b.c * dfs[t - 1];
    const last = 100 * b.c + 100, d = (prices[i] - known) / last;
    dfs.push(d);
    spots.push(Math.pow(d, -1 / b.T) - 1);
    steps.push({ T: b.T, c: b.c, price: prices[i], known, rest: prices[i] - known, last, spot: spots[i] });
  });
  return { dfs, spots, steps };
}
export const forwards = (spots) => spots.map((s, i) => (i ? Math.pow(1 + s, i + 1) / Math.pow(1 + spots[i - 1], i) - 1 : s));
export const ytm = (c, T, p) => yieldOf(c, T, p);

// a coupon bond's yield against the spot rates its payments are discounted at,
// with the duration-weighted average of those spot rates as the first-order rule
export function couponBond(c, T, s = spot) {
  const p = priceOff(c, T, s);
  let w = 0, ws = 0;
  const weights = [];
  for (let t = 1; t <= T; t++) { const pv = (100 * c + (t === T ? 100 : 0)) * discount(t, s); weights.push({ t, w: t * pv }); w += t * pv; ws += t * pv * s(t); }
  weights.forEach((x) => (x.w /= w));
  return { price: p, yield: yieldOf(c, T, p), rule: ws / w, spot: s(T), weights };
}

// two ways to invest for two years: the 2-year zero, or the 1-year zero rolled at next year's rate
export const twoYear = (s1, s2) => 100 * Math.pow(1 + s2, 2);
export const rolled = (s1, next) => 100 * (1 + s1) * (1 + next);

// ------------------------------------------------------ Vasicek's model
export const MODEL = { r0: 0.04, theta: 0.04, kappa: 0.1 };
export const expected = (T, m = MODEL) => m.theta + (m.r0 - m.theta) * Math.exp(-m.kappa * T);
export const convexity = (T, sigma, m = MODEL) => ((sigma * sigma) / (2 * m.kappa * m.kappa)) * (1 - Math.exp(-m.kappa * T)) ** 2;
export const premium = (T, prem, m = MODEL) => prem * (1 - Math.exp(-m.kappa * T));
export const forwardV = (T, sigma, prem, m = MODEL) => expected(T, m) + premium(T, prem, m) - convexity(T, sigma, m);
// the zero-coupon yield is the average of the forward rates up to T (by Simpson's rule)
export function yieldV(T, sigma, prem, m = MODEL, n = 200) {
  if (T <= 0) return forwardV(0, sigma, prem, m);
  const h = T / n; let a = 0;
  for (let i = 0; i <= n; i++) a += forwardV(i * h, sigma, prem, m) * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2);
  return (a * h) / 3 / T;
}
// Vasicek's closed-form bond price, with no premium: P = exp(A − B r0)
export function bondPriceV(T, sigma, m = MODEL) {
  const k = m.kappa, Bt = (1 - Math.exp(-k * T)) / k;
  return Math.exp((m.theta - (sigma * sigma) / (2 * k * k)) * (Bt - T) - (sigma * sigma * Bt * Bt) / (4 * k) - Bt * m.r0);
}
// the long-run limit of the convexity term
export const convexityLimit = (sigma, m = MODEL) => (sigma * sigma) / (2 * m.kappa * m.kappa);
