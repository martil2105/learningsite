/*
  A seeded eight-player game, used only to show what sampling buys you.

  Three players is too few to sample: there are six orderings and you may as
  well enumerate them. So this game is deliberately bigger, and deliberately of
  a shape whose exact answer is known in closed form:

      v(S) = sum_i a_i  +  sum_{i<j} b_ij      for i, j in S

  A game built from single effects and pairwise synergies has

      phi_i = a_i + (1/2) sum_j b_ij

  which gives an independent check on both the closed-form Shapley routine and
  the sampler. (verify/check-sampling.mjs runs it.)
*/
import { mulberry32 } from "./datasets.js";

export const BIG_N = 8;

function build() {
  const rng = mulberry32(414243);
  const a = [];
  for (let i = 0; i < BIG_N; i++) a.push(Math.round((rng() * 18 - 4) * 10) / 10);
  const b = Array.from({ length: BIG_N }, () => new Array(BIG_N).fill(0));
  for (let i = 0; i < BIG_N; i++) {
    for (let j = i + 1; j < BIG_N; j++) {
      const value = Math.round((rng() * 10 - 3.5) * 10) / 10;
      b[i][j] = value;
      b[j][i] = value;
    }
  }
  return { a, b };
}

export const { a: SOLO, b: SYNERGY } = build();

export function bigValue(mask) {
  let total = 0;
  for (let i = 0; i < BIG_N; i++) {
    if (!((mask >> i) & 1)) continue;
    total += SOLO[i];
    for (let j = i + 1; j < BIG_N; j++) {
      if ((mask >> j) & 1) total += SYNERGY[i][j];
    }
  }
  return total;
}

// The analytic answer for this family of games.
export const BIG_TRUTH = SOLO.map(
  (ai, i) => ai + 0.5 * SYNERGY[i].reduce((s, v) => s + v, 0)
);
