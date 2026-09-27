/*
  Compound growth, the averages of growth rates, and the gap between the
  expected path and the typical one.
*/
import { mulberry32, gaussian } from "./rng.js";

/* Years to double at a constant annual growth rate g. */
export const doublingTime = (g) => Math.log(2) / Math.log(1 + g);

/* Years for a gap in levels to double when one economy grows at g1 and the other at g2. */
export const gapDoublingTime = (g1, g2) => Math.log(2) / Math.log((1 + g1) / (1 + g2));

/* The growth rate at which the "rule of N" (N / percent) is exactly right, by bisection. */
export function ruleExactAt(N) {
  const f = (g) => N / (100 * g) - doublingTime(g);
  let lo = 1e-6, hi = 0.5;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/* The compound (geometric-mean) growth rate of a sequence of annual rates. */
export function compoundRate(rates) {
  const logSum = rates.reduce((a, g) => a + Math.log(1 + g), 0);
  return Math.exp(logSum / rates.length) - 1;
}
export const arithmeticMean = (rates) => rates.reduce((a, g) => a + g, 0) / rates.length;

/* Alternating a + s and a - s: the compound rate, exactly. */
export const alternating = (a, s) => Math.sqrt((1 + a) * (1 + a) - s * s) - 1;

/* The swing at which alternating growth around a mean of a goes nowhere. */
export const zeroGrowthSwing = (a) => Math.sqrt((1 + a) * (1 + a) - 1);

/* Standard normal CDF (Abramowitz–Stegun 7.1.26, |error| < 1.5e-7). */
export function Phi(z) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/*
  Lognormal growth: log(1 + g) ~ N(mu, sigma^2) each year, independently, with
  mu set so that the expected growth factor is 1 + m whatever sigma is.
*/
export const muFor = (m, sigma) => Math.log(1 + m) - (sigma * sigma) / 2;
export const expectedLevel = (m, t) => Math.pow(1 + m, t);
export const medianLevel = (m, sigma, t) => Math.exp(muFor(m, sigma) * t);
/* The share of paths that end above the expected level: exactly Phi(-sigma sqrt(t) / 2). */
export const shareAboveMean = (sigma, t) => Phi((-sigma * Math.sqrt(t)) / 2);
/* The median path's compound growth rate. */
export const typicalRate = (m, sigma) => Math.exp(muFor(m, sigma)) - 1;

/* Simulated paths, seeded, on a common stream of standard normals so sigma only rescales them. */
export function normals(n, T, seed) {
  const rand = mulberry32(seed);
  const z = [];
  for (let i = 0; i < n; i++) {
    const row = new Float64Array(T);
    for (let t = 0; t < T; t++) row[t] = gaussian(rand);
    z.push(row);
  }
  return z;
}

export function paths(z, m, sigma) {
  const mu = muFor(m, sigma);
  return z.map((row) => {
    const out = new Float64Array(row.length + 1);
    let l = 0;
    out[0] = 1;
    for (let t = 0; t < row.length; t++) {
      l += mu + sigma * row[t];
      out[t + 1] = Math.exp(l);
    }
    return out;
  });
}
