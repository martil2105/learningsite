/*
  Put-call parity: a European call minus a European put on the same share,
  with the same strike and expiry, pays S_T - K whatever happens, so it's
  worth what a forward is worth: S0 e^(-bT) - K e^(-rT), where b is anything
  holding the share earns or costs besides the share price itself (dividends,
  or a fee for borrowing it).

  Our share stands at $100, the safe rate is 4% and the options run a year.
  Two models of where the share goes price calls and puts differently; parity
  says their differences must agree.
*/
export const S0 = 100, R = 0.04, T = 1;

// The normal distribution function to about 1e-15.
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

// Black and Scholes with a carry b (dividend yield or borrowing fee).
export function bs(K, sigma, { s = S0, r = R, b = 0, t = T, call = true } = {}) {
  const sq = sigma * Math.sqrt(t);
  const d1 = (Math.log(s / K) + (r - b + (sigma * sigma) / 2) * t) / sq, d2 = d1 - sq;
  const S = s * Math.exp(-b * t), D = K * Math.exp(-r * t);
  return call ? S * Phi(d1) - D * Phi(d2) : D * Phi(-d2) - S * Phi(-d1);
}

// The two models. "Calm": the share is lognormal with volatility 20%.
// "Crash": with chance 10% the share drops 30% at some point in the year, and
// otherwise it's lognormal with volatility 15%; the price of the share for
// delivery in a year is the same in both (prices are risk-neutral).
export const MODELS = {
  calm: { label: "smooth, 20% a year", price: (K, call) => bs(K, 0.2, { call }) },
  crash: {
    label: "a 10% chance of a 30% crash",
    price: (K, call) => {
      const w = 0.1, J = 0.7, fwd = S0 * Math.exp(R * T), X = fwd / (1 - w + w * J);
      const at = (f, sig) => bs(K, sig, { s: f * Math.exp(-R * T), call });
      return (1 - w) * at(X, 0.15) + w * at(X * J, 0.15);
    },
  },
};
// What a forward to buy at K is worth today.
export const forwardValue = (K, { s = S0, r = R, b = 0, t = T } = {}) => s * Math.exp(-b * t) - K * Math.exp(-r * t);

// Implied volatility by bisection; NaN when the price is outside what any
// volatility can give.
export function iv(price, K, { s = S0, r = R, b = 0, t = T, call = true } = {}) {
  const lo0 = bs(K, 1e-6, { s, r, b, t, call }), hi0 = bs(K, 5, { s, r, b, t, call });
  if (!(price > lo0 && price < hi0)) return NaN;
  let lo = 1e-6, hi = 5;
  for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (bs(K, m, { s, r, b, t, call }) < price) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
// The forward price the options imply: K + e^(rT)(C - P).
export const impliedForward = (C, P, K, { r = R, t = T } = {}) => K + Math.exp(r * t) * (C - P);

// Palm, 17 March 2000 (Lamont and Thaler 2003, Table 6): strike $55, bid and
// ask for calls and puts, discounted at LIBOR with simple interest.
export const PALM = {
  price: 55.25, strike: 55,
  rows: [
    { key: "may", label: "May 2000", months: 2, libor: 0.0621, callBid: 5.75, callAsk: 7.25, putBid: 10.625, putAsk: 12.625, paper: { short: 47.55, long: 51.05 } },
    { key: "aug", label: "August 2000", months: 5, libor: 0.0641, callBid: 9.25, callAsk: 10.75, putBid: 17.25, putAsk: 19.25, paper: { short: 43.57, long: 47.07 } },
    { key: "nov", label: "November 2000", months: 8, libor: 0.0641, callBid: 10, callAsk: 11.5, putBid: 21.625, putAsk: 23.625, paper: { short: 39.12, long: 42.62 } },
  ],
};
// A synthetic share from options: buy a call, sell a put, and hold the
// strike's present value. Selling one (sell the call at the bid, buy the put
// at the ask) raises the "synthetic short" price; buying one costs the long.
export function synthetic(row, strike = PALM.strike) {
  const pv = strike / (1 + row.libor * (row.months / 12));
  return { short: row.callBid - row.putAsk + pv, long: row.callAsk - row.putBid + pv, pv };
}

// A box: a call minus a put at K1, less the same at K2, is a loan of
// (K2 - K1) e^(-rT) repaid with K2 - K1.
export const box = (K1, K2, price = (K, call) => bs(K, 0.2, { call })) =>
  price(K1, true) - price(K1, false) - (price(K2, true) - price(K2, false));
