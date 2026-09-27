/*
  Re-derives every number the page states, from the same modules the page
  imports, with no build step.

  The load-bearing identities: the Pigouvian quantity is the social optimum
  (closed form against a blind numeric search), the three instruments move
  the same money, and the Weitzman loss ratio is (g/b)² while the tax stays
  interior — with the corner at extreme ratios reported as measured.
*/
import {
  A, B, C, S, E, pD, pS, q0, qSocial, marketAt, welfare, numericOptimum,
  instruments, weitzman,
} from "../src/externality.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const close = (a, b, tol) => Math.abs(a - b) <= tol;

// ------------------------------------------------------------ the market
{
  ok("laissez-faire: 40 units at price 30, exactly", q0 === 40 && pD(q0) === 30);
  ok("the closed-form optimum is 32", qSocial === 32);
  ok("a blind numeric search lands on 32 to 1e-4",
     close(numericOptimum(), 32, 1e-4), numericOptimum().toFixed(6));
  ok("at the optimum the buyer–seller price gap is exactly e",
     close(pD(qSocial) - pS(qSocial), E, 1e-9));
  ok("the Pigouvian tax delivers the optimum",
     close(marketAt(E).q, 32, 1e-9), marketAt(E).q);
  ok("doing nothing burns exactly 48 of surplus",
     close(welfare(qSocial) - welfare(q0), 48, 1e-4));
}

// ------------------------------------------- three instruments, one money
{
  const inst = instruments();
  ok("the three instruments land on the optimum quantity",
     inst.quantity === 32);
  ok("the tax collects 384 and the quota rents 384 — same money, different pockets",
     inst.taxRevenue === 384 && inst.quotaRent === 384 && inst.bargainPayment === 384,
     `${inst.taxRevenue} ${inst.quotaRent}`);
  ok("the welfare gain equals the DWL the laissez-faire market was burning",
     close(welfare(32) - welfare(40), 48, 1e-4));
}

// --------------------------------------------- the Weitzman turn, measured
{
  let worst = 0;
  for (const g of [1, 2, 4]) { // g/b = 0.5 / 1 / 2 at b = B = 2
    const w = weitzman(g, 20, 41, 40000);
    worst = Math.max(worst, Math.abs(w.ratio - (g / B) * (g / B)));
  }
  ok("the expected-loss ratio is (g/b)^2 on the interior: 0.25 / 1.00 / 4.00",
     worst < 1e-2, `worst ${worst.toExponential(2)}`);
  const one = weitzman(2, 20, 41, 40000);
  ok("at g/b = 1 the instruments tie to within the integration's noise",
     Math.abs(one.tax - one.quota) / one.quota < 1e-2,
     `${one.tax.toFixed(2)} vs ${one.quota.toFixed(2)}`);
  const flat = weitzman(1, 20, 41, 40000);
  const steep = weitzman(4, 20, 41, 40000);
  ok("flat damage: the price instrument wins; steep: the quantity instrument",
     flat.tax < flat.quota && steep.quota < steep.tax);
  const corner = weitzman(16, 20, 41, 40000);
  ok("at g/b = 8 the ratio is about 46, not 64 — the tax hit the corner",
     Math.abs(corner.ratio - 46) < 1 && Math.abs(corner.ratio - 64) > 1,
     corner.ratio.toFixed(2));
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);