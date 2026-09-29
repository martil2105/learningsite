// Reads the solved settings that the lab draws (src/precomputed.js).
import { DATA } from "./precomputed.js";

export const START = 25, RETIRE = 65;
// the last year of the plan (89) has no saving to allocate, so the charts stop at 88
export const LAST = 88;
export const AGES = Array.from({ length: LAST - START + 1 }, (_, i) => START + i);
export const key = (g, cap, rho) => `${g}|${cap}|${rho}`;
export const get = (g, cap, rho) => DATA[key(g, cap, rho)];
const at = (arr, age) => arr[age - START];
export const medianAt = (e, age) => at(e.median, age);
export const atCapAt = (e, age) => at(e.atCap, age);
export const wealthAt = (e, age) => at(e.wealth, age);
// the first age at which the median worker is below the limit, or null if she never is
export function leavesLimit(e, cap) {
  for (const age of AGES) if (medianAt(e, age) < cap - 0.005) return age;
  return null;
}
// the rise in consumption, every year, that a worker facing no borrowing would need to
// be as well off as with a 2:1 limit (F is a sum of c^(1-g), so it falls as welfare rises)
export const ceGain = (g, rho) => Math.pow(get(g, 1, rho).F / get(g, 2, rho).F, 1 / (g - 1)) - 1;
// the Merton share of savings alone, at our stocks
export const PREMIUM = 0.04, SIGMA = 0.157;
export const merton = (g) => PREMIUM / (g * SIGMA * SIGMA);
