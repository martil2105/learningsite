/*
  Re-derives every number the page states, from the same modules the page
  imports, with no build step.

  Two routes to the optimal wage: closed form and a golden-section search
  that is handed the workforce L (the oracle rule — it reads L, and the
  claim is that the answer ignores it). The Solow elasticity is asserted at
  the optimum to 1e-7, the a = 1 case with === where the arithmetic is
  exact, and the no-shirking premium table with ===.
*/
import { WR, effort, unitCost, elasticityAt, optimalWage, closedWage, closedEffort, closedUnitCost, noShirkingWage, premiumPct } from "../src/effort.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const close = (a, b, tol) => Math.abs(a - b) <= tol;

// ------------------------------------------------- closed forms vs search
{
  let worst = 0;
  for (const wr of [8, 10, 12]) {
    for (const a of [1, 2, 3]) {
      worst = Math.max(worst, Math.abs(optimalWage(wr, a, 1) - closedWage(wr, a)));
    }
  }
  ok("the golden-section search lands on the closed-form optimum, 9 parameterisations",
     worst < 1e-6, `worst ${worst.toExponential(2)}`);
  ok("the a = 1 case is exact: w* = 2 w_r, e* = 1/2, unit cost 4 w_r",
     closedWage(10, 1) === 20 && closedEffort(1) === 0.5 && closedUnitCost(10, 1) === 40);
  ok("the closed-form effort matches the curve at the optimum",
     [1, 2, 3].every((a) =>
       close(effort(closedWage(10, a), 10, a), closedEffort(a), 1e-12)));
}

// ------------------------------------------------- the Solow condition
{
  let worst = 0;
  for (const a of [1, 1.5, 2, 3]) {
    worst = Math.max(worst, Math.abs(elasticityAt(closedWage(10, a), 10, a) - 1));
  }
  ok("the elasticity of effort with respect to the wage is exactly 1 at w*",
     worst < 1e-7, `worst ${worst.toExponential(2)}`);
  ok("and it is away from 1 off the optimum, both sides",
     elasticityAt(15, 10, 1) > 1 && elasticityAt(30, 10, 1) < 1);
  ok("unit cost at w* matches the closed form over the sweep",
     [1, 2, 3].every((a) =>
       close(unitCost(closedWage(10, a), 10, a), closedUnitCost(10, a), 1e-9)));
}

// ------------------------------------------------- demand never enters
{
  let worst = 0;
  for (const L of [1, 10, 100, 1000]) {
    worst = Math.max(worst, Math.abs(optimalWage(10, 1, L) - closedWage(10, 1)));
  }
  ok("the solver reads L and returns one wage, within its own search noise",
     worst < 1e-6, `worst ${worst.toExponential(2)}`);
  ok("and the four answers agree with each other to 1e-6",
     (() => {
       const ws = [1, 10, 100, 1000].map((L) => optimalWage(10, 1, L));
       return Math.max(...ws) - Math.min(...ws) < 1e-6;
     })());
}

// ------------------------------------------------- the no-shirking hyperbola
{
  ok("the premium is exactly 1/(pF): 2000 / 500 / 100 percent",
     premiumPct(0.05) === 2000 && premiumPct(0.2) === 500 && premiumPct(1) === 100);
  ok("the premium depends on the product alone: (0.1, 2) = (0.2, 1)",
     premiumPct(0.1, 2) === premiumPct(0.2, 1));
  ok("perfect monitoring at a bounded penalty still pays a 100% premium",
     noShirkingWage(1, 1, 10) === 20);
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);