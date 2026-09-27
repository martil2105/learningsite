// Insuring stocks against ending behind bonds, after Bodie (1995).
//
// Measure stocks in units of the bond, so the safe rate drops out. The ratio
// R = stocks / bonds starts at 1, and ln R_T is normal with mean m T and
// standard deviation sigma sqrt(T), where m = premium - sigma^2 / 2. The
// insurance pays (1 - R_T)^+ at T: a European put on the stocks struck at
// the bonds' value, which is the forward price.
import { normCdf, normInv } from "./stats.js";

export const PREMIUM = 0.06;
export const SIGMA = 0.2;
export const YEARS = 40;

// Black-Scholes with the strike at the forward: d1 = s/2, d2 = -s/2,
// so the price per unit of stake is N(s/2) - N(-s/2) = 2N(s/2) - 1.
// Neither the premium nor the safe rate appears.
export function insuranceCost(T, sigma = SIGMA) {
  return 2 * normCdf((sigma * Math.sqrt(T)) / 2) - 1;
}

export function chanceBehind(T, premium = PREMIUM, sigma = SIGMA) {
  const mu = (premium - (sigma * sigma) / 2) * T, s = sigma * Math.sqrt(T);
  return normCdf(-mu / s);
}

// The payout we'd expect from the insurance, averaged with real-world odds:
// E[(1 - R)^+] = P(R < 1) - E[R ; R < 1].
export function expectedPayout(T, premium = PREMIUM, sigma = SIGMA) {
  const mu = (premium - (sigma * sigma) / 2) * T, s = sigma * Math.sqrt(T);
  return normCdf(-mu / s) - Math.exp(mu + (s * s) / 2) * normCdf((-mu - s * s) / s);
}

// The horizon at which insurance costs half the stake: 2N(s/2) - 1 = 1/2.
export const halfStakeYears = (sigma = SIGMA) => Math.pow((2 * normInv(0.75)) / sigma, 2);

// Only sigma sqrt(T) matters, so a horizon at one volatility has a twin at another.
export const twinHorizon = (T, sigma, sigma2) => (T * sigma * sigma) / (sigma2 * sigma2);

// A Cox-Ross-Rubinstein tree for the same put, as an independent route: the
// stock in bond units moves up by u or down by 1/u each step, and the
// risk-neutral chance of an up step makes the ratio a martingale.
export function treeCost(T, sigma = SIGMA, steps = 2000) {
  const dt = T / steps, u = Math.exp(sigma * Math.sqrt(dt)), d = 1 / u;
  const q = (1 - d) / (u - d);
  let v = new Float64Array(steps + 1);
  for (let j = 0; j <= steps; j++) v[j] = Math.max(0, 1 - Math.pow(u, j) * Math.pow(d, steps - j));
  for (let i = steps - 1; i >= 0; i--) for (let j = 0; j <= i; j++) v[j] = q * v[j + 1] + (1 - q) * v[j];
  return v[0];
}
