import { simulate, pinEnd, indexPath, fundPath, realisedVariance, predictFund, dragCoefficient, zigzag, beatMargin } from "../src/drag.js";
for (const L of [-3,-2,-1,2,3]) console.log("L", L, "drag coef", dragCoefficient(L));
// flat year at 20% and 40% vol
for (const s of [0.2, 0.4]) for (const L of [3, 2, -1, -3]) console.log(`flat year vol ${s} L=${L}: ${(Math.exp(-dragCoefficient(L) * s * s) - 1).toFixed(4)}`);
// two-day example
for (const L of [3, -3]) { const r=[0.1,-0.1]; console.log("2-day", L, fundPath(r,L).at(-1), predictFund(indexPath(r).at(-1), realisedVariance(r), L)); }
// trend example
console.log("trend: index +30% at 15% vol, 3x:", predictFund(1.3, 0.0225, 3), "vs", 1 + 3*0.3);
// simulation accuracy of the rule, many seeds
let worst = 0;
for (let seed = 1; seed <= 400; seed++) for (const L of [-3,-2,-1,2,3]) {
  const r = simulate(seed, 0.07, 0.2);
  const S = indexPath(r).at(-1), F = fundPath(r, L).at(-1);
  const P = predictFund(S, realisedVariance(r), L);
  worst = Math.max(worst, Math.abs(F / P - 1));
}
console.log("worst rel error over 400 seeds, sigma 20%:", worst);
worst = 0;
for (let seed = 1; seed <= 400; seed++) for (const L of [-3,3]) {
  const r = simulate(seed, 0.07, 0.6);
  const S = indexPath(r).at(-1), F = fundPath(r, L).at(-1);
  worst = Math.max(worst, Math.abs(F / predictFund(S, realisedVariance(r), L) - 1));
}
console.log("worst rel error sigma 60%:", worst);
// zigzag 1% for 252 days
const z = zigzag(0.01, 252); console.log("zigzag 1%: index", indexPath(z).at(-1), "3x", fundPath(z,3).at(-1), "-3x", fundPath(z,-3).at(-1));
const z2 = zigzag(0.02, 252); console.log("zigzag 2%: index", indexPath(z2).at(-1), "3x", fundPath(z2,3).at(-1), "-1x", fundPath(z2,-1).at(-1), "2x", fundPath(z2,2).at(-1));
// pinned flat year, seed 7, 20% vol: index exactly flat
const r0 = pinEnd(simulate(7, 0, 0.2), 0); console.log("pinned flat: idx", indexPath(r0).at(-1), "3x", fundPath(r0,3).at(-1), "rv", realisedVariance(r0));
