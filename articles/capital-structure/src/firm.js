/*
  One firm, one year, one loan (Merton's model of a firm's debt).

  The firm's assets are worth V0 = $100 today. In a year they're worth V1,
  lognormal, with an expected return of RA = 8% and a volatility s. The firm
  owes lenders a face value F, due in a year. Lenders get min(V1, F) and the
  shareholders get what's left, max(V1 - F, 0), so the two claims always add up
  to V1. Today they're priced by Black and Scholes with a safe rate RF = 3%.

  Every rate here is a simple yearly rate: RA = 8% means E[V1] = 108.
*/
export const V0 = 100;
export const RA = 0.08;
export const RF = 0.03;
export const SIGMA = 0.25;

// The standard normal distribution function, to about 1e-15: a series for
// small |x| and a continued fraction (Lentz) for erfc beyond.
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

// The density of next year's asset value, lognormal with an expected return ra.
export function density(v, s = SIGMA, ra = RA) {
  if (v <= 0) return 0;
  const m = Math.log(V0) + Math.log(1 + ra) - (s * s) / 2;
  const z = (Math.log(v) - m) / s;
  return Math.exp(-0.5 * z * z) / (v * s * Math.sqrt(2 * Math.PI));
}

// The firm with a loan of face value F, at asset volatility s.
export function firm(F, s = SIGMA, { ra = RA, rf = RF } = {}) {
  if (F <= 0) {
    return { F: 0, s, E0: V0, D0: 0, DE: 0, DV: 0, rE: ra, rD: rf, y: rf, wacc: ra, waccYield: ra, line: ra, pDefault: 0, lossGivenDefault: 0 };
  }
  const mu = Math.log(1 + ra), r = Math.log(1 + rf);
  const lm = Math.log(V0 / F);
  // today's prices (risk-neutral drift r)
  const d1 = (lm + r + s * s / 2) / s, d2 = d1 - s;
  const E0 = V0 * Phi(d1) - (F / (1 + rf)) * Phi(d2);
  const D0 = V0 - E0;
  // expected payoffs in a year (real drift mu)
  const e1 = (lm + mu + s * s / 2) / s, e2 = e1 - s;
  const EE1 = V0 * (1 + ra) * Phi(e1) - F * Phi(e2);
  const ED1 = V0 * (1 + ra) - EE1;
  const rE = EE1 / E0 - 1;
  const rD = ED1 / D0 - 1;
  const y = F / D0 - 1;                 // the promised yield
  const DE = D0 / E0, DV = D0 / V0;
  const pDefault = Phi(-e2);            // chance the assets end below F
  return {
    F, s, E0, D0, DE, DV, rE, rD, y,
    wacc: (E0 * rE + D0 * rD) / V0,     // the average expected return, by value
    waccYield: (E0 * rE + D0 * y) / V0, // the same with the yield in place of rD
    line: ra + (ra - rf) * DE,          // Modigliani and Miller's line with safe debt
    pDefault,
  };
}

// The face value that gives a debt-to-equity ratio de (by value), by bisection.
export function faceFor(de, s = SIGMA, opts = {}) {
  if (de <= 0) return 0;
  let lo = 0, hi = V0 * 50;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (firm(m, s, opts).DE < de) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
export const atDE = (de, s = SIGMA, opts = {}) => firm(faceFor(de, s, opts), s, opts);

// Safe debt, by algebra: Modigliani and Miller's proposition II.
export const mm2 = (de, ra = RA, rd = RF) => ra + (ra - rd) * de;

// Taxes. Interest of rD * D a year saves tax of tax * rD * D. If the loan is
// permanent and as safe as the debt, the savings are worth tax * D. If the firm
// keeps its debt at a fixed share of its value, the savings rise and fall with
// the firm and are discounted at the assets' rate instead.
export const shieldPermanent = (D, tax) => tax * D;
export const shieldRebalanced = (D, tax, rd = RF, ra = RA) => (tax * rd * D) / ra;
