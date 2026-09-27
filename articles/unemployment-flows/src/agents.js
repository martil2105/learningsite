/*
  An independent route to the same numbers: simulate people rather than shares.

  Each of N people is either employed or unemployed with a spell counter. Every
  month an employed person loses their job with probability s and an unemployed
  person finds one with probability f. Nothing here uses the closed forms in
  flows.js; check-numbers.mjs compares the two.
*/
import { mulberry32 } from "./rng.js";

export function simulate(s, f, { N = 20000, burn = 300, months = 600, seed = 1, longTerm = 12 } = {}) {
  const rand = mulberry32(seed);
  const spell = new Int32Array(N).fill(-1); // -1 means employed
  let uSum = 0, ltSum = 0, n = 0, completed = 0, completedMonths = 0;
  for (let t = 0; t < burn + months; t++) {
    for (let i = 0; i < N; i++) {
      if (spell[i] < 0) {
        if (rand() < s) spell[i] = 0;
      } else if (rand() < f) {
        if (t >= burn) { completed++; completedMonths += spell[i] + 1; }
        spell[i] = -1;
      } else {
        spell[i]++;
      }
    }
    if (t >= burn) {
      let u = 0, lt = 0;
      for (let i = 0; i < N; i++) if (spell[i] >= 0) { u++; if (spell[i] >= longTerm) lt++; }
      uSum += u / N;
      ltSum += u ? lt / u : 0;
      n++;
    }
  }
  return { u: uSum / n, longTermShare: ltSum / n, meanSpell: completedMonths / completed };
}
