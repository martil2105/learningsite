/*
  Duration's three jobs, on the bonds of src/bonds.js (annual coupons, one flat
  rate) and on portfolios of zero-coupon bonds.

  1. The average wait for the money, each payment weighted by its share of the
     price: D = Σ t·PV_t / P (Macaulay).
  2. The slope of the log price: d ln P / d ln(1 + y) = −D, so a small move Δy
     changes the price by about −D/(1 + y)·Δy, and convexity
     C = Σ t(t + 1)·PV_t / (P (1 + y)²) adds ½·C·Δy².
  3. The horizon that cancels: held for H years with everything reinvested at
     a new rate r set just after buying, the money is W_H(r) = P(r)(1 + r)^H,
     and d ln W_H / d ln(1 + r) = H − D(r). At H = D(y) the slope is zero at
     the yield, and the second derivative is the variance of the payment
     dates, so the money is lowest when rates don't move: to second order the
     gain is ½·Var(t)·(ln((1 + r)/(1 + y)))².
*/
import { flows, price, macaulay } from "./bonds.js";
export { flows, price, macaulay };

// the payment dates' mean, variance and the convexity, at a yield
export function dates(c, T, y) {
  const fs = flows(c, T, y), P = fs.reduce((s, f) => s + f.pv, 0);
  const D = fs.reduce((s, f) => s + f.t * f.pv, 0) / P;
  const V = fs.reduce((s, f) => s + (f.t - D) ** 2 * f.pv, 0) / P;
  const C = fs.reduce((s, f) => s + f.t * (f.t + 1) * f.pv, 0) / P / (1 + y) ** 2;
  return { P, D, V, C };
}
// the money after H years at a new rate r, against the promise at y, as a ratio
export const atHorizon = (c, T, y, H, r) => (price(c, T, r) * Math.pow(1 + r, H)) / (price(c, T, y) * Math.pow(1 + y, H));
// the price after a move, three ways
export function priceMove(c, T, y, dy) {
  const { D, C } = dates(c, T, y);
  return { exact: price(c, T, y + dy) / price(c, T, y) - 1, duration: (-D / (1 + y)) * dy, withConvexity: (-D / (1 + y)) * dy + 0.5 * C * dy * dy };
}

// ---------------------------------------------- portfolios of zero-coupon bonds
// legs: [{ t, w }] with w each leg's share of the $100 paid at yield y
export function zeros(legs, y) {
  const faces = legs.map((l) => ({ t: l.t, face: 100 * l.w * Math.pow(1 + y, l.t) }));
  const valueAt = (r, H = 0) => faces.reduce((s, f) => s + f.face / Math.pow(1 + r, f.t - H), 0);
  const D = legs.reduce((s, l) => s + l.w * l.t, 0);
  const V = legs.reduce((s, l) => s + l.w * (l.t - D) ** 2, 0);
  const C = legs.reduce((s, l) => s + (l.w * l.t * (l.t + 1)) / (1 + y) ** 2, 0);
  return { faces, valueAt, D, V, C, atHorizon: (H, r) => valueAt(r, H) / (100 * Math.pow(1 + y, H)) };
}
// a 2-year and a 30-year zero mixed to a given average wait
export function barbell(D, y, short = 2, long = 30) {
  const w = (long - D) / (long - short);
  return zeros([{ t: short, w }, { t: long, w: 1 - w }], y);
}
export const bullet = (D, y) => zeros([{ t: D, w: 1 }], y);

// what extra convexity earns a year, if yields move by σ a year and both portfolios earn the same yield
export const convexityEdge = (dC, sigma) => 0.5 * dC * sigma * sigma;

// the average wait of a perpetuity
export const perpetuityWait = (y) => (1 + y) / y;
