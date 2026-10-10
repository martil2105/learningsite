/*
  A bond with annual coupons: c a year per unit of face value (so $100c on
  $100), T years to maturity, $100 back at the end. Everything is priced at
  one flat rate, compounded once a year, which is the yield to maturity when
  the rate is the one that gives today's price.

  The two results the article rests on:

  - At an unchanged yield, every year's return is the yield, whatever the
    coupon: (100c + P_{t+1}) / P_t = 1 + y, because P_t (1 + y) = 100c + P_{t+1}.
  - Held to maturity with every coupon reinvested at a new rate r (set just
    after we buy and kept), the money at maturity is the bond's price at r,
    grown at r for T years: W = P(r)(1 + r)^T. So the yearly return is
    (1 + r)(P(r)/P(y))^(1/T) − 1, and to first order it is y on a share D/T of
    the bond's life and r on the rest, with D the average wait for the money
    (Macaulay's duration).
*/
export const FACE = 100;

export function price(c, T, y) {
  let p = 0;
  for (let t = 1; t <= T; t++) p += (FACE * c) / Math.pow(1 + y, t);
  return p + FACE / Math.pow(1 + y, T);
}
// the cash flows and what each is worth today
export function flows(c, T, y) {
  return Array.from({ length: T }, (_, i) => { const t = i + 1, cf = FACE * c + (t === T ? FACE : 0); return { t, cf, pv: cf / Math.pow(1 + y, t) }; });
}
// the yield that gives a price, by bisection
export function yieldOf(c, T, p) {
  let lo = -0.5, hi = 2;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (price(c, T, m) > p) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
// the average wait for the money, each payment weighted by its share of the price
export function macaulay(c, T, y) {
  let p = 0, w = 0;
  for (const f of flows(c, T, y)) { p += f.pv; w += f.t * f.pv; }
  return w / p;
}
export const currentYield = (c, T, y) => (FACE * c) / price(c, T, y);

// the price after t of the T years, at an unchanged yield, and that year's return
export const priceAfter = (c, T, y, t) => (t >= T ? FACE : price(c, T - t, y));
export const yearReturn = (c, T, y, t) => (FACE * c + priceAfter(c, T, y, t + 1)) / priceAfter(c, T, y, t) - 1;

// the money at maturity per bond, coupons reinvested at r, in three parts
export function atMaturity(c, T, r) {
  const coupons = FACE * c * T;
  const grown = r === 0 ? coupons : (FACE * c * (Math.pow(1 + r, T) - 1)) / r;
  return { principal: FACE, coupons, interest: grown - coupons, total: FACE + grown };
}
// the yearly return over the T years, bought at yield y, reinvested at r
export const realised = (c, T, y, r) => Math.pow(atMaturity(c, T, r).total / price(c, T, y), 1 / T) - 1;
// the same by the identity, and the first-order rule
export const realisedByPrice = (c, T, y, r) => (1 + r) * Math.pow(price(c, T, r) / price(c, T, y), 1 / T) - 1;
export const realisedRule = (c, T, y, r) => y + (1 - macaulay(c, T, y) / T) * (r - y);
// what the position is worth t years after buying, with every flow valued and
// reinvested at the rate r: the bond's price at r, grown at r
export const worth = (c, T, r, t) => price(c, T, r) * Math.pow(1 + r, t);
