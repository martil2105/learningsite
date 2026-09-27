import { simulate, pinEnd, indexPath, fundPath, realisedVariance, predictFund } from "../src/drag.js";
function errs(vol, Ls) {
  const e = [];
  for (let seed = 1; seed <= 997; seed++) for (const L of Ls) {
    const r = pinEnd(simulate(seed, 0, vol), 0.0);
    const F = fundPath(r, L).at(-1), P = predictFund(indexPath(r).at(-1), realisedVariance(r), L);
    e.push(Math.abs(F - P)); // in return points
  }
  e.sort((a, b) => a - b);
  return { med: e[Math.floor(e.length / 2)], p95: e[Math.floor(e.length * 0.95)], max: e.at(-1) };
}
for (const v of [0.1, 0.2, 0.3, 0.4, 0.6]) console.log(v, JSON.stringify(errs(v, [3])), JSON.stringify(errs(v, [-3])));
const r = pinEnd(simulate(7, 0, 0.2), 0);
console.log("opening: rv vol", Math.sqrt(realisedVariance(r)), "fund", fundPath(r, 3).at(-1) - 1, "pred", predictFund(indexPath(r).at(-1), realisedVariance(r), 3) - 1);
// shuffle invariance
const sh = [...r].reverse(); console.log("reversed fund", fundPath(sh, 3).at(-1) - 1);
