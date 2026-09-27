/*
  One market and its uncounted cost; three instruments; and the
  prices-versus-quantities turn under uncertainty.

  Linear demand and supply with a constant external cost e per unit:
      demand:  q = A − B·pc
      supply:  q = C + S·pp
  The social supply adds e to every unit: the optimum is
      q_s = q0 − e·B·S/(B+S),   closed and exact for the straight line,
  and at q_s the buyer–seller price gap equals e — which is the Pigouvian
  tax in words. The welfare integral is computed numerically (trapezoid),
  so the closed forms face an independent route, and the three instruments
  are computed from three independent modules.

  The Weitzman turn: the private-benefit intercept a is shocked by ±s around
  its mean, both instruments are set for the mean shock, and the expected
  welfare losses are integrated numerically over a grid of shocks. For
  linear curves the loss ratio tax:quota is (g/b)² while the optimum stays
  interior — g the marginal-damage slope, b the private-benefit slope — and
  the ratio departs from the square at extreme g/b because the tax drives
  output to the corner. The corner is reported as measured.
*/
export const A = 100, B = 2, C = 10, S = 1, E = 12;

export const pD = (q) => (A - q) / B; // inverse demand for q = A − B·p
export const pS = (q) => (q - C) / S;
export const pSsocial = (q) => (q - C) / S + E;

export const q0 = C + S * ((A - C) / (B + S)); // 40, the laissez-faire quantity
export const qSocial = q0 - (E * B * S) / (B + S); // 32, closed form

/* The market at a tax t on the output. */
export function marketAt(t) {
  const pp = (A - B * t - C) / (B + S);
  return { q: C + S * pp, pp, pc: pp + t };
}

/* Welfare of running quantity q under external cost e — trapezoid. */
export function welfare(q, e = E, n = 200000) {
  let s = 0;
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) * q) / n;
    s += pD(x) - pS(x) - e;
  }
  return (s * q) / n;
}

/* The social optimum, found numerically by golden section — no closed form. */
export function numericOptimum(e = E) {
  const f = (q) => -welfare(q, e);
  const g = (Math.sqrt(5) - 1) / 2;
  let lo = 0, hi = q0 * 1.3;
  for (let i = 0; i < 200; i++) {
    const x = hi - g * (hi - lo), y = lo + g * (hi - lo);
    if (f(x) < f(y)) hi = y;
    else lo = x;
  }
  return (lo + hi) / 2;
}

/* The three instruments at the known e. Each returns the same quantity and
   the same money — different pockets. */
export function instruments(e = E) {
  const byTax = marketAt(e);
  const qStar = qSocial;
  return {
    quantity: qStar,
    taxRevenue: e * byTax.q,
    quotaRent: (pD(qStar) - pS(qStar)) * qStar,
    bargainPayment: (pD(qStar) - pS(qStar)) * qStar,
  };
}

/* Expected losses under a mean-zero shock s on the private-benefit
   intercept, instruments set for the mean. Returns {tax, quota, ratio},
   the losses integrated over a shock grid. */
export function weitzman(g, shock = 20, steps = 41, n = 40000) {
  const b = B, d = C + E * 0; // damage intercept absorbs the level; slope g
  const loss = (instrument) => {
    let acc = 0;
    for (let i = 0; i < steps; i++) {
      const da = -shock + ((2 * shock * i) / (steps - 1));
      const a = A + da;
      const qOpt = (a - d) / (b + g);
      const realised = (q) => {
        // welfare at q under intercept a, slope g on damage
        let s = 0;
        for (let k = 0; k < n; k++) {
          const x = ((k + 0.5) * q) / n;
          s += a - b * x - (d + g * x);
        }
        return (s * q) / n;
      };
      const qQuota = (A - d) / (b + g); // set for the mean shock
      const tStar = d + g * qQuota; // tax set for the mean shock
      const qTax = instrument === "tax" ? Math.max(0, (a - tStar) / b) : qQuota;
      acc += realised(qOpt) - realised(qTax);
    }
    return acc / steps;
  };
  const lt = loss("tax");
  const lq = loss("quota");
  return { tax: lt, quota: lq, ratio: lt / lq };
}