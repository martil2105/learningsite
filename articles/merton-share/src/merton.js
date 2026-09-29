// The Merton share and what it's worth.
//
// A safe asset pays r. Stocks earn an expected return mu with volatility
// sigma, and we hold a constant share pi in stocks, rebalanced continuously.
// For an investor with constant relative risk aversion gamma, the position is
// worth a certainty-equivalent return per year of
//   CE(pi) = r + pi (mu - r) - gamma pi^2 sigma^2 / 2,
// at every horizon (wealth at T is lognormal and every moment scales with T).
// Everything below is measured as the gain over the safe rate, CE - r.
import { normals } from "./random.js";

export const PREMIUM = 0.05; // mu - r, the arithmetic premium
export const SIGMA = 0.18;
export const GAMMA = 2;

export const mertonShare = (e = PREMIUM, s = SIGMA, g = GAMMA) => e / (g * s * s);
export const gain = (pi, e = PREMIUM, s = SIGMA, g = GAMMA) => pi * e - (g * pi * pi * s * s) / 2;
export const bestGain = (e = PREMIUM, s = SIGMA, g = GAMMA) => (e * e) / (2 * g * s * s);
// Held at x times the Merton share, we keep 2x - x^2 of the best gain.
export const keptAt = (x) => 2 * x - x * x;

// With log utility (gamma = 1) the gain is the median growth rate over the
// safe asset, and the share is the Kelly fraction.
export const kellyShare = (e = PREMIUM, s = SIGMA) => e / (s * s);

// The same stocks described by their expected log excess return m = e - s^2/2.
export const logPremium = (e = PREMIUM, s = SIGMA) => e - (s * s) / 2;
export const shareFromLog = (m, s = SIGMA, g = GAMMA) => (m + (s * s) / 2) / (g * s * s);

// An investor who estimates the premium from N years of excess returns and
// plugs the average in: the share's standard error, and the fraction of the
// best gain kept on average, 1 - 1 / (N SR^2), whatever gamma is.
export const sharpe = (e = PREMIUM, s = SIGMA) => e / s;
export const shareError = (N, s = SIGMA, g = GAMMA) => 1 / (g * s * Math.sqrt(N));
export const keptAfterEstimating = (N, e = PREMIUM, s = SIGMA) => 1 - (s * s) / (N * e * e);
export const breakEvenYears = (e = PREMIUM, s = SIGMA) => (s * s) / (e * e);

// Plug-in shares of `count` investors, each with N years of yearly excess
// returns drawn from the truth.
export function pluginShares(seed, N, count, e = PREMIUM, s = SIGMA, g = GAMMA) {
  const z = normals(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    let sum = 0;
    for (let t = 0; t < N; t++) sum += e + s * z();
    out.push(sum / N / (g * s * s));
  }
  return out;
}
