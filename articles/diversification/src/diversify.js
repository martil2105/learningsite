// Equal-weighted portfolios of n stocks that all have volatility sigma and
// pairwise correlation rho, and a simulated universe of such stocks.
import { normals } from "./random.js";

export function portfolioVariance(n, sigma, rho) {
  return sigma * sigma * (rho + (1 - rho) / n);
}
export function portfolioVol(n, sigma, rho) {
  return Math.sqrt(portfolioVariance(n, sigma, rho));
}
export function floorVol(sigma, rho) {
  return sigma * Math.sqrt(rho);
}
// Share of the diversifiable variance (the part above the floor) removed by n stocks.
export function removedShare(n) {
  return 1 - 1 / n;
}
// Extra yearly growth (log terms) from holding the portfolio instead of one stock.
export function growthGain(n, sigma, rho) {
  return (sigma * sigma - portfolioVariance(n, sigma, rho)) / 2;
}

// Standard normal CDF via erfc (Cody-style rational approximation from
// Numerical Recipes, error below 1.2e-7).
export function Phi(x) {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? 1 - r / 2 : r / 2;
}

// Chance that one stock ends T years ahead of a large rebalanced portfolio of
// stocks like it.
export function beatProbability(sigma, rho, T) {
  return Phi(-Math.sqrt((1 - rho) * sigma * sigma * T) / 2);
}

// A universe of N stocks over `years`, monthly steps, one common factor.
// Every stock has expected return mu, volatility sigma, correlation rho with
// every other. Returns wealth paths (per year) and the equal-weighted
// portfolio rebalanced monthly.
export function universe(seed, N, sigma, rho, years, mu = 0.08) {
  const z = normals(seed);
  const steps = 12 * years, dt = 1 / 12;
  const sf = sigma * Math.sqrt(rho), se = sigma * Math.sqrt(1 - rho);
  const logW = new Float64Array(N);
  const paths = Array.from({ length: N }, () => [1]);
  const port = [1];
  let P = 1;
  for (let s = 1; s <= steps; s++) {
    const f = z();
    let avg = 0;
    for (let i = 0; i < N; i++) {
      const lr = (mu - (sigma * sigma) / 2) * dt + Math.sqrt(dt) * (sf * f + se * z());
      logW[i] += lr;
      avg += Math.expm1(lr);
    }
    P *= 1 + avg / N;
    if (s % 12 === 0) { for (let i = 0; i < N; i++) paths[i].push(Math.exp(logW[i])); port.push(P); }
  }
  return { paths, port };
}

// Smallest share of stocks whose gains add up to the whole net gain of an
// equal buy-and-hold stake in every stock (each starts at 1).
export function shareCarryingGain(finals) {
  const net = finals.reduce((a, w) => a + (w - 1), 0);
  if (net <= 0) return NaN;
  const sorted = [...finals].sort((a, b) => b - a);
  let acc = 0;
  for (let k = 0; k < sorted.length; k++) { acc += sorted[k] - 1; if (acc >= net) return (k + 1) / sorted.length; }
  return 1;
}
