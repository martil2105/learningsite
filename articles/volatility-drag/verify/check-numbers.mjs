// Every number the page states, derived twice. Route A is src/drag.js; route B
// is written here from the definitions with no shared code.
import { simulate, pinEnd, indexPath, fundPath, realisedVariance, predictFund, dragCoefficient, zigzag, beatMargin } from "../src/drag.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!ok) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }

// Route B: products and exponentials written out.
const prod = (arr) => arr.reduce((a, b) => a * b, 1);
const fundB = (r, L) => prod(r.map((x) => Math.max(0, 1 + L * x)));
const idxB = (r) => prod(r.map((x) => 1 + x));
const coefB = (L) => (L * L - L) / 2;
const flatYearB = (L, vol) => Math.exp(-coefB(L) * vol * vol) - 1;

console.log("-- two days");
eq("index after +10%, -10% is 0.99 (A)", indexPath([0.1, -0.1])[2], 0.99);
eq("index after +10%, -10% is 0.99 (B)", 1.1 * 0.9, 0.99);
eq("3x fund is 0.91 (A)", fundPath([0.1, -0.1], 3)[2], 0.91);
eq("3x fund is 0.91 (B)", 1.3 * 0.7, 0.91);
eq("nine times the index's loss", (1 - 1.3 * 0.7) / (1 - 1.1 * 0.9), 9);
eq("three of the nine points are three times the index's loss", 3 * (1 - 0.99) * 100, 3);

console.log("-- the ±2% zigzag over 60 days");
const z = zigzag(0.02, 60);
const zi = indexPath(z)[60], z3 = fundPath(z, 3)[60], zm3 = fundPath(z, -3)[60];
eq("index (A vs B)", zi, Math.pow(1.02 * 0.98, 30));
truth("index down a little over 1%", zi - 1 < -0.01 && zi - 1 > -0.015, (100 * (zi - 1)).toFixed(3) + "%");
truth("three times the index's return is under 4%", 3 * (1 - zi) < 0.04 && 3 * (1 - zi) > 0.03, (300 * (1 - zi)).toFixed(3));
eq("3x fund (A vs B)", z3, Math.pow(1.06 * 0.94, 30));
truth("3x fund down more than 10%", z3 - 1 < -0.1, (100 * (z3 - 1)).toFixed(3) + "%");
eq("-3x fund lands in the same place", zm3, z3, 1e-12);
eq("each pair multiplies both by 1.06 x 0.94", fundPath([0.02, -0.02], -3)[2], 1.06 * 0.94);

console.log("-- the rule and the lab");
truth("the rule's drag coefficient is (L^2 - L)/2 for every lab leverage", [3, 2, -1, -2, -3].every((L) => dragCoefficient(L) === coefB(L)));
const r0 = pinEnd(simulate(7, 0, 0.2), 0);
eq("lab opening: index ends flat", idxB(r0), 1, 1e-12);
const f0 = fundPath(r0, 3).at(-1), p0 = predictFund(1, realisedVariance(r0), 3);
eq("lab opening: fund (A vs B)", f0, fundB(r0, 3), 1e-12);
truth("lab opening: 3x fund down about 10%", f0 - 1 < -0.095 && f0 - 1 > -0.11, (100 * (f0 - 1)).toFixed(2) + "%");
truth("lab opening: rule within a tenth of a point", Math.abs(f0 - p0) < 0.001, (100 * Math.abs(f0 - p0)).toFixed(3) + " pts");
const rvB = r0.reduce((a, x) => a + Math.log(1 + x) ** 2, 0);
eq("realised variance (A vs B)", realisedVariance(r0), rvB, 1e-12);
eq("reversing the year leaves the fund unchanged", fundB([...r0].reverse(), 3), f0, 1e-12);
eq("reversing the year leaves the index unchanged", idxB([...r0].reverse()), 1, 1e-12);

console.log("-- accuracy across a thousand flat years (3x)");
function within(vol) {
  const e = [];
  for (let seed = 1; seed <= 1000; seed++) {
    const r = pinEnd(simulate(seed, 0, vol), 0);
    e.push(Math.abs(fundB(r, 3) - Math.exp(-coefB(3) * r.reduce((a, x) => a + Math.log(1 + x) ** 2, 0))));
  }
  e.sort((a, b) => a - b);
  return e[949];
}
const w20 = within(0.2), w60 = within(0.6);
truth("20% volatility: 95% of years within a tenth of a point", w20 < 0.001, (100 * w20).toFixed(3) + " pts");
truth("60% volatility: 95% of years within about a point", w60 < 0.015 && w60 > 0.005, (100 * w60).toFixed(3) + " pts");

console.log("-- flat years and trends");
eq("flat year, 20%, 3x: about -11% (A)", Math.exp(-dragCoefficient(3) * 0.04) - 1, flatYearB(3, 0.2));
truth("  which rounds to 11%", Math.round(-100 * flatYearB(3, 0.2)) === 11);
truth("flat year, 40%, 3x: about -38%", Math.round(-100 * flatYearB(3, 0.4)) === 38);
truth("flat year, 20%, 2x: about -4%", Math.round(-100 * flatYearB(2, 0.2)) === 4);
truth("flat year, 40%, 2x: about -15%", Math.round(-100 * flatYearB(2, 0.4)) === 15);
truth("flat year, 20%, -3x: about -21%", Math.round(-100 * flatYearB(-3, 0.2)) === 21);
truth("  nearly twice the 3x loss", flatYearB(-3, 0.2) / flatYearB(3, 0.2) > 1.8 && flatYearB(-3, 0.2) / flatYearB(3, 0.2) < 2);
const trend = predictFund(1.3, 0.15 * 0.15, 3) - 1;
eq("trend: +30% at 15% vol, 3x makes about 105% (A vs B)", trend, Math.pow(1.3, 3) * Math.exp(-3 * 0.0225) - 1);
truth("  rounds to 105%", Math.round(100 * trend) === 105);
truth("  and beats 3 x 30% = 90%", trend > 0.9 && beatMargin(1.3, 0.0225, 3) > 0);
truth("flat year trails for any volatility", [0.05, 0.2, 0.6].every((v) => beatMargin(1, v * v, 3) < 0 && beatMargin(1, v * v, -3) < 0));
truth("zero volatility never trails (Bernoulli)", [-0.4, -0.1, 0.1, 0.6].every((R) => beatMargin(1 + R, 0, 3) >= 0 && beatMargin(1 + R, 0, -3) >= 0));

console.log("-- the parabola");
eq("-1x bleeds like +2x", coefB(-1), dragCoefficient(2));
eq("-2x bleeds like +3x", coefB(-2), dragCoefficient(3));
eq("-3x has coefficient 6", dragCoefficient(-3), 6);
eq("  twice the +3x coefficient", dragCoefficient(-3) / dragCoefficient(3), 2);
truth("coefficient negative between 0 and 1", dragCoefficient(0.5) < 0 && dragCoefficient(0.25) < 0);
eq("lowest point at L = 1/2", -0.125, dragCoefficient(0.5));
// continuous-rebalancing limit: many small steps make the rule exact
const steps = 252 * 400, sig = 0.3;
const rc = pinEnd(simulate(11, 0, sig, steps), 0.1);
truth("the rule becomes exact as rebalancing gets continuous", Math.abs(fundB(rc, 3) / predictFund(idxB(rc), realisedVariance(rc), 3) - 1) < 1e-4);
// 50/50 mix gains from volatility
const mix = fundB(r0, 0.5);
truth("a daily 50/50 index and cash mix gains in a flat volatile year", mix > 1, (100 * (mix - 1)).toFixed(3) + "%");

console.log(fails ? `\n${fails} of ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
if (fails) process.exit(1);
