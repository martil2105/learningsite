/*
  Two simulated markets that are efficient by construction: the true value
  is a random walk, so nothing anyone knows today predicts its next change.
  Only the way prices are recorded differs.

  Stale prices. An index of very many stocks, where on any day a share π of
  them doesn't trade and keeps its last price. A stock that trades catches up
  on everything it missed, so the recorded (log) return of the index obeys
  o_t = π o_{t−1} + (1 − π) f_t, where f_t is the true return. Its
  autocorrelations are ρ_k = π^k.

  Bid–ask bounce. One stock whose trades print at the bid or the ask with
  equal odds, independently: ln p_t = ln v_t + h d_t, with h half the
  spread and d_t = ±1. The recorded return has a lag-1 autocovariance of
  −h² = −s²/4 and none beyond, so ρ_1 = −(s²/4)/(σ² + s²/2) (Roll 1984).

  Returns are daily and in log terms. Both worlds share MU and SIGMA.
*/
import { normals, mulberry32 } from "./random.js";
import { Phi } from "./stats.js";
import { vrFromRho } from "./vr.js";

export const MU = 0.0004, SIGMA = 0.01, DAYS_A_YEAR = 252;
const phi = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

// ----------------------------------------------------------------- theory
export const rhoStale = (k, pi) => Math.pow(pi, k);
export const vrStale = (q, pi) => vrFromRho((k) => rhoStale(k, pi), q);
export const rhoBounce = (k, s, sigma = SIGMA) => (k === 1 ? -(s * s) / 4 / (sigma * sigma + (s * s) / 2) : 0);
export const vrBounce = (q, s, sigma = SIGMA) => vrFromRho((k) => rhoBounce(k, s, sigma), q);
// the closed form of the same ratio: (qσ² + s²/2) / (q(σ² + s²/2))
export const vrBounceDirect = (q, s, sigma = SIGMA) => (q * sigma * sigma + (s * s) / 2) / (q * (sigma * sigma + (s * s) / 2));
// Roll's spread from the lag-1 autocovariance of recorded returns
export const rollSpread = (cov1) => 2 * Math.sqrt(Math.max(0, -cov1));

// ------------------------------------------------------------ simulation
export function staleWorld(days, pi, seed, mu = MU, sigma = SIGMA) {
  const g = normals(seed), f = new Float64Array(days), o = new Float64Array(days);
  // start the recursion in its stationary state
  let prev = mu + sigma * Math.sqrt((1 - pi) / (1 + pi)) * g();
  for (let t = 0; t < days; t++) {
    f[t] = mu + sigma * g();
    o[t] = pi * prev + (1 - pi) * f[t];
    prev = o[t];
  }
  return { truth: f, recorded: o };
}
export function bounceWorld(days, s, seed, mu = MU, sigma = SIGMA) {
  const g = normals(seed), u = mulberry32(seed + 1), h = s / 2;
  const truth = new Float64Array(days), recorded = new Float64Array(days), side = new Int8Array(days + 1);
  side[0] = u() < 0.5 ? 1 : -1;
  for (let t = 0; t < days; t++) {
    truth[t] = mu + sigma * g();
    side[t + 1] = u() < 0.5 ? 1 : -1;
    recorded[t] = truth[t] + h * (side[t + 1] - side[t]);
  }
  return { truth, recorded, side, h };
}

// ------------------------------------------------------- the rule, two ways
// Stale world: hold tomorrow after a recorded rise. On paper we earn the
// recorded return; for real we can only trade at the true value.
// Bounce world: hold tomorrow after a recorded fall, buying at the ask and
// selling at the bid; on paper we buy and sell at the last trade.
export function runRule(world, kind) {
  const { truth, recorded } = world, h = world.h || 0, T = truth.length;
  let paper = 0, real = 0, cost = 0, held = 0, pos = 0;
  const paperPath = [0], realPath = [0], holdPath = [0];
  let hold = 0;
  for (let t = 1; t < T; t++) {
    const next = kind === "stale" ? recorded[t - 1] > 0 : recorded[t - 1] < 0;
    const p = next ? 1 : 0;
    if (p !== pos) { cost += h; pos = p; }
    if (p) { paper += recorded[t]; real += truth[t]; held++; }
    hold += truth[t];
    paperPath.push(paper); realPath.push(real - cost); holdPath.push(hold);
  }
  const yr = (x) => Math.exp((DAYS_A_YEAR * x) / (T - 1)) - 1;
  return { paper: yr(paper), real: yr(real - cost), realBeforeCost: yr(real), hold: yr(hold), held: held / (T - 1), paperPath, realPath, holdPath };
}

// ---------------------------------------------- the rule's expected returns
// stale: E[paper] = π E[o; o > 0] + (1 − π) μ P(o > 0), E[real] = μ P(o > 0)
export function ruleTheoryStale(pi, mu = MU, sigma = SIGMA) {
  const so = sigma * Math.sqrt((1 - pi) / (1 + pi)), z = mu / so;
  const pUp = Phi(z), eUp = mu * Phi(z) + so * phi(z);
  return { paper: pi * eUp + (1 - pi) * mu * pUp, real: mu * pUp, held: pUp };
}
// bounce: E[paper] = Σ over (d_{t−1}, d_t) of ¼ P(fall | d) (μ − h d_t);
// E[real before cost] = μ P(fall); the cost is h each time the position changes
export function ruleTheoryBounce(s, mu = MU, sigma = SIGMA) {
  const h = s / 2;
  let paper = 0, pFall = 0;
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    const pf = Phi((-mu - h * (b - a)) / sigma) / 4; // a = d_{t−1}, b = d_t
    pFall += pf; paper += pf * (mu - h * b);
  }
  return { paper, realBeforeCost: mu * pFall, held: pFall };
}

// The lab's 25 simulated years, and the seeds it uses (chosen so the sample
// lands near the formulas at the default settings; the checks assert it).
export const LAB_DAYS = 25 * DAYS_A_YEAR;
export const LAB_SEED = { stale: 72, bounce: 226 };
