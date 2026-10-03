/*
  A firm that earns a return on equity ROE on its book, pays out part of its
  earnings and reinvests the rest at the same ROE, for ever.

  Per share, today: book B, next year's earnings E1 = ROE * B. It reinvests a
  share b of earnings (the plowback), so book, earnings and dividends all grow
  at g = b * ROE, and next year's dividend is D1 = (1 - b) E1. Shareholders need
  a return r > g. The price is the growing stream of dividends,

      P = D1 / (r - g) = E1 (1 - g/ROE) / (r - g),

  so the forward P/E is (1 - g/ROE)/(r - g) and the price-to-book ratio is
  (ROE - g)/(r - g). Every function takes plain numbers and returns plain
  numbers; nothing here reads component state.
*/

export const R = 0.08; // the return shareholders need, in every example

// The firm, priced. g is the growth rate, which fixes the plowback b = g / ROE.
export function value({ r = R, roe, g, E1 = 1 }) {
  const b = g / roe;                  // plowback: the share of earnings reinvested
  const D1 = (1 - b) * E1;            // next year's dividend
  const P = D1 / (r - g);             // the growing stream
  const B = E1 / roe;                 // book value today
  const noGrowth = E1 / r;            // what the earnings are worth with no growth
  return {
    r, roe, g, b, E1, D1, B, P,
    PE: P / E1,                       // forward P/E
    PB: P / B,                        // price to book
    EY: E1 / P,                       // earnings yield
    noGrowth,
    pvgo: P - noGrowth,               // the present value of growth opportunities
    growthShare: (P - noGrowth) / P,
  };
}

// The same three numbers from the closed forms, kept separate so the checks can
// set one route against the other.
export const peOf = (r, g, roe) => (1 - g / roe) / (r - g);
export const pbOf = (r, g, roe) => (roe - g) / (r - g);
export const pvgoRatio = (r, g, roe) => (g / (r - g)) * (1 - r / roe); // PVGO / (E1 / r)

// The P/E at which a share stops being worth more for growing faster.
export const flatPE = (r = R) => 1 / r;

// Read backwards: a P/E and a P/B fix ROE = P/B / P/E, and then every growth
// rate g goes with exactly one required return,
//     r = E/P + g (1 - B/P).
export const impliedR = (PE, PB, g) => 1 / PE + g * (1 - 1 / PB);
export const impliedROE = (PE, PB) => PB / PE;

// Growth that lasts N years: the firm reinvests b of its earnings at ROE for N
// years, and after that new investment earns only r, so it adds nothing. Each
// year's reinvestment b E_t is worth b E_t (ROE - r)/r on the day it is made.
export function pvgoFor(N, { r = R, roe, g, E1 = 1 }) {
  const b = g / roe;
  let s = 0;
  for (let t = 1; t <= N; t++) s += (b * E1 * Math.pow(1 + g, t - 1) * (roe - r)) / r / Math.pow(1 + r, t);
  return s;
}
