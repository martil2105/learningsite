/*
  Precomputed convergence of the ordering sampler on the eight-player game.

  Run once at module load: for each budget m, draw m orderings under several
  seeds and record the median worst-case error against the exact answer. The
  median rather than the mean, because a single unlucky seed should not be what
  the chart is showing.
*/
import { BIG_N, bigValue } from "./bigGame.js";
import { shapleyByWeights, shapleySampled } from "./shapley.js";
import { mulberry32 } from "./datasets.js";

export const BIG_EXACT = shapleyByWeights(BIG_N, bigValue);
export const BIG_SCALE = Math.max(...BIG_EXACT.map(Math.abs));

export const BUDGETS = [4, 8, 16, 32, 64, 128, 256, 512];
const SEEDS = 9;

export const CONVERGENCE = BUDGETS.map((m) => {
  const errors = [];
  for (let s = 0; s < SEEDS; s++) {
    const { phi } = shapleySampled(BIG_N, bigValue, m, mulberry32(1000 + s));
    errors.push(Math.max(...phi.map((x, i) => Math.abs(x - BIG_EXACT[i]))));
  }
  errors.sort((a, b) => a - b);
  const median = errors[(SEEDS - 1) >> 1];
  return { m, median, lo: errors[0], hi: errors[SEEDS - 1], pct: (median / BIG_SCALE) * 100 };
});

// Number of orderings (n!) and coalitions (2^n) as n grows. Computed in logs,
// because 20! overflows any sensible axis long before it overflows a double.
export const BLOWUP = [];
for (let n = 2; n <= 24; n++) {
  let logFact = 0;
  for (let k = 2; k <= n; k++) logFact += Math.log10(k);
  BLOWUP.push({ n, logOrderings: logFact, logCoalitions: n * Math.log10(2) });
}

export function bigNumber(log10) {
  if (log10 < 6) return Math.round(10 ** log10).toLocaleString("en-US");
  const exponent = Math.floor(log10);
  const mantissa = 10 ** (log10 - exponent);
  return mantissa.toFixed(1) + " × 10^" + exponent;
}
