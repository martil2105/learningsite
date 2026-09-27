/*
  Re-derives every number the page states, from the same modules the page
  imports, with no build step.

  The article's claims are identities, so the assertions are held to machine
  precision wherever the arithmetic is exact, and the tolerances that exist
  say which route produced them: the golden-section optimiser has its own
  tolerance, and the best-response fixed point carries the iteration's.
*/
import { R_A, R_B } from "../src/datasets.js";
import {
  rubinstein, discount, limitShare, backwardInduction, closedFinite,
  fixedPoint, nashShare,
} from "../src/bargain.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const close = (a, b, tol) => Math.abs(a - b) <= tol;

// ------------------------------------------------- the horizon sequence
{
  let worst = 0;
  for (const d of [0.3, 0.5, 0.8, 0.95]) {
    for (let T = 1; T <= 60; T++) {
      worst = Math.max(worst, Math.abs(backwardInduction(T, d, d) - closedFinite(T, d)));
    }
  }
  ok("literal backward induction matches the closed form (1-(-d)^T)/(1+d)",
     worst < 1e-12, `worst ${worst.toExponential(2)}`);
  ok("the dyadic case is exact: T=1,2,3,4 at d=1/2 give 1, 1/2, 3/4, 5/8",
     backwardInduction(1, 0.5, 0.5) === 1 &&
     backwardInduction(2, 0.5, 0.5) === 0.5 &&
     backwardInduction(3, 0.5, 0.5) === 0.75 &&
     backwardInduction(4, 0.5, 0.5) === 0.625);
  let worstU = 0;
  for (let T = 200; T <= 220; T++) {
    worstU = Math.max(worstU, Math.abs(backwardInduction(T, 0.5, 0.8) - rubinstein(0.5, 0.8)));
  }
  ok("an unequal horizon converges onto the Rubinstein share",
     worstU < 1e-6, `worst ${worstU.toExponential(2)}`);
  // The sequence oscillates around the limit and each parity closes in.
  // (Large T is FP-degenerate here: the contraction factor is 0.4, so the
  // sequence reaches the double of 1/3 exactly and the bracket reads zero.)
  const r58 = rubinstein(0.5, 0.8);
  const s4 = backwardInduction(4, 0.5, 0.8);
  const s5 = backwardInduction(5, 0.5, 0.8);
  const s6 = backwardInduction(6, 0.5, 0.8);
  ok("the even and odd horizons bracket the limit, and the bracket tightens",
     (s4 - r58) * (s5 - r58) < 0 &&
     Math.abs(s6 - r58) < Math.abs(s4 - r58),
     `${s4.toFixed(4)} ${s5.toFixed(4)} ${s6.toFixed(4)} vs ${r58.toFixed(4)}`);
  ok("the Rubinstein share at (0.5, 0.8) is exactly 1/3 as a double",
     Math.abs(r58 - 1 / 3) < 1e-15);
}

// ------------------------------------------------------- the 3/4 limit
{
  ok("the limit share is r_B/(r_A+r_B) = 3/4 to the last bit the decimal rates carry",
     Math.abs(limitShare(R_A, R_B) - 0.75) < 1e-12, limitShare(R_A, R_B));
  const err = (dt) => Math.abs(rubinstein(discount(R_A, dt), discount(R_B, dt)) - 0.75);
  ok("halving the period halves the first-mover advantage (to O(Δ²))",
     Math.abs(err(0.1) / err(0.05) - 2) < 2e-3 && Math.abs(err(0.01) / err(0.001) - 10) < 1e-2,
     `${(err(0.1) / err(0.05)).toFixed(6)}`);
  ok("at a period of 1/1000 the gap is under 2e-5", err(0.001) < 2e-5, err(0.001).toExponential(2));
}

// ------------------------------------- two theories, one answer (axioms)
{
  const pairs = [[0.05, 0.15], [0.1, 0.1], [0.02, 0.18], [0.12, 0.04], [0.3, 0.02]];
  let worst = 0;
  for (const [ra, rb] of pairs) {
    worst = Math.max(worst, Math.abs(nashShare(ra, rb) - limitShare(ra, rb)));
  }
  ok("the Nash product, maximised numerically, lands on r_B/(r_A+r_B)",
     worst < 1e-8, `worst ${worst.toExponential(2)}`);
  ok("the Nash solution is symmetric: swapping the rates mirrors the share",
     Math.abs(nashShare(0.07, 0.13) + nashShare(0.13, 0.07) - 1) < 1e-6);
}

// ------------------------------------- outside options: flat, then one-for-one
{
  // A fine period, so the fixed point sits O(dt) from the limit curve.
  const dt = 0.002;
  const dA = discount(R_A, dt);
  const dB = discount(R_B, dt);
  let worst = 0;
  for (const sA of [0, 0.1, 0.3, 0.5, 0.7, 0.749, 0.8, 0.9]) {
    const x = fixedPoint(dA, dB, sA, 0, 400000);
    worst = Math.max(worst, Math.abs(x - Math.max(0.75, sA)));
  }
  ok("with outside options the fixed point is max(limit, fallback) to O(dt)",
     worst < 5e-4, `worst ${worst.toExponential(2)}`);
  const flat = [0, 0.2, 0.4, 0.6, 0.7].map((sA) => {
    const x = fixedPoint(dA, dB, sA, 0, 400000);
    return Math.max(x, sA);
  });
  const flatWorst = Math.max(...flat) - Math.min(...flat);
  ok("seven fallbacks below the line move A's payoff by less than 1e-3 in total",
     flatWorst < 1e-3, `spread ${flatWorst.toExponential(2)}`);
  const above = fixedPoint(dA, dB, 0.9, 0, 400000);
  ok("a fallback above the line binds one for one",
     Math.abs(above - 0.9) < 5e-4, `${above}`);
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);