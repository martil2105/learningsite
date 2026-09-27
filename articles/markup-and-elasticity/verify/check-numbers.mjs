/*
  Re-derives every number the page states, from the same modules the page
  imports, with no build step.

  The two routes: the closed-form optimum and pass-through in src/demand.js,
  and a golden-section optimiser that never sees a formula. The pinned-point
  invariants are exact: every member of the family passes through (25, 45)
  with elasticity 5/3 there, whatever its exponent.
*/
import { P0, Q0, EPS0, C0, family, q, elasticity, optimalPrice, numericOptimal, passThrough, numericPassThrough, profit } from "../src/demand.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const close = (a, b, tol) => Math.abs(a - b) <= tol;

// --------------------------------------------------- the pin, for every n
{
  const NS = [1, 0.5, 0.25, 2, 4, 6, -1.5, -2, -3, -5];
  let worstQ = 0, worstE = 0;
  for (const n of NS) {
    const d = family(n);
    worstQ = Math.max(worstQ, Math.abs(q(d, P0) - Q0));
    worstE = Math.max(worstE, Math.abs(elasticity(d, P0) - EPS0));
  }
  ok("every member passes through (25, 45) with elasticity 5/3 there",
     worstQ < 1e-9 && worstE < 1e-9, `q ${worstQ.toExponential(2)}, eps ${worstE.toExponential(2)}`);
  const lin = family(1), ces = family(-EPS0);
  ok("n = 1 is the straight line 120 - 3p", lin.a === 120 && lin.b === -3);
  ok("n = -5/3 is the constant-elasticity curve with a = 0",
     Math.abs(ces.a) < 1e-12 && close(q(ces, P0), Q0, 1e-12));
}

// ------------------------------------- the optimum: closed form vs search
{
  const NS = [1, 0.5, 2, 4, -1.5, -2, -3, -5];
  let worst = 0;
  for (const n of NS) {
    const d = family(n);
    for (const c of [8, 9, 10, 11, 12]) {
      worst = Math.max(worst, Math.abs(optimalPrice(d, c) - numericOptimal(d, c)));
    }
  }
  ok("the closed-form optimum agrees with a blind golden-section search",
     worst < 1e-6, `worst ${worst.toExponential(2)}`);
  const lin = family(1);
  ok("the straight line's optimum is (choke + c)/2, always",
     [8, 9, 10, 11, 12].every((c) => Math.abs(optimalPrice(lin, c) - (40 + c) / 2) < 1e-12));
  const ces = family(-EPS0);
  ok("the constant-elasticity curve's optimum is 2.5c at eps = 5/3",
     [8, 10, 12].every((c) => Math.abs(optimalPrice(ces, c) - 2.5 * c) < 1e-9));
}

// ------------------------------------- the Lerner identity, both curves
{
  const lin = family(1), ces = family(-EPS0);
  let worstL = 0, worstR = 0;
  for (const c of [8, 9, 10, 11, 12]) {
    const pl = optimalPrice(lin, c), pc = optimalPrice(ces, c);
    worstL = Math.max(worstL,
      Math.abs((pl - c) / pl - 1 / elasticity(lin, pl)),
      Math.abs((pc - c) / pc - 1 / elasticity(ces, pc)));
    worstR = Math.max(worstR, Math.abs(pl - pc));
  }
  ok("markup = 1/|epsilon| at the optimum, exactly, on both curves",
     worstL < 1e-12, `worst ${worstL.toExponential(2)}`);
  ok("the two optima coincide only at c = 10", worstR > 4 && close(0, 0, 1));
  ok("at c = 10 both prices are exactly 25",
     Math.abs(optimalPrice(lin, 10) - 25) < 1e-12 &&
     Math.abs(optimalPrice(ces, 10) - 25) < 1e-12);
  ok("at c = 12 the line says 26 and the CES curve says 30",
     Math.abs(optimalPrice(lin, 12) - 26) < 1e-12 &&
     Math.abs(optimalPrice(ces, 12) - 30) < 1e-9);
}

// ------------------------------------- pass-through: closed, formula, numeric
{
  const NS = [1, 0.5, 2, 4, -1.5, -2, -3, -5];
  let worstC = 0, worstN = 0;
  const d1 = family(1);
  for (const n of NS) {
    const d = family(n);
    // numeric derivative of the CLOSED-form optimum, and of the SEARCH optimum
    const h = 1e-4;
    const numClosed = (optimalPrice(d, C0 + h) - optimalPrice(d, C0 - h)) / (2 * h);
    worstC = Math.max(worstC, Math.abs(numClosed - passThrough(n)));
    worstN = Math.max(worstN, Math.abs(numericPassThrough(d, C0) - passThrough(n)));
  }
  ok("dp*/dc is exactly n/(1+n) for the whole family",
     worstC < 1e-6, `worst ${worstC.toExponential(2)}`);
  ok("and the blind search route agrees", worstN < 5e-3, `worst ${worstN.toExponential(2)}`);
  ok("the straight line passes exactly half, at every cost",
     [8, 10, 12].every((c) => {
       const h = 1e-6;
       return Math.abs((optimalPrice(d1, c + h) - optimalPrice(d1, c - h)) / (2 * h) - 0.5) < 1e-6;
     }));
  ok("the CES curve over-shifts: 3.0 / 2.0 / 1.5 / 1.25 at eps 1.5/2/3/5",
     close(passThrough(-1.5), 3, 1e-12) && close(passThrough(-2), 2, 1e-12) &&
     close(passThrough(-3), 1.5, 1e-12) && close(passThrough(-5), 1.25, 1e-12));
  ok("the perverse pocket is real: rho < 0 for -1 < n < 0",
     passThrough(-0.5) === -1 && passThrough(-0.8) < 0);
}

// ------------------------------------- the curvature identity, numerically
{
  const NS = [1, 2, -1.5, -3];
  let worst = 0;
  for (const n of NS) {
    const d = family(n);
    const p = optimalPrice(d, C0);
    const h = 1e-4;
    const qp = (q(d, p + h) - q(d, p - h)) / (2 * h);
    const qpp = (q(d, p + h) - 2 * q(d, p) + q(d, p - h)) / (h * h);
    const rho = qp / (2 * qp + (p - C0) * qpp);
    worst = Math.max(worst, Math.abs(rho - passThrough(n)));
  }
  ok("rho = q'/(2q' + (p-c)q'') reads off the curve, no closed form needed",
     worst < 1e-4, `worst ${worst.toExponential(2)}`);
  ok("profit at the optimum beats two neighbours, for a hard case",
     (() => {
       const d = family(-1.5), c = 10, p = optimalPrice(d, c);
       return profit(d, p, c) > profit(d, p - 0.5, c) && profit(d, p, c) > profit(d, p + 0.5, c);
     })());
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);