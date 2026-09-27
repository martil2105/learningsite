/*
  Re-derives every number unemployment-flows' prose states, from src/flows.js
  (closed forms), and checks the headline ones against src/agents.js, a
  simulation of individual workers that shares no code with the closed forms.
*/
import { steady, path, meanSpell, longTermShare, halfLife, durationBins, shockRun, fForRate } from "../src/flows.js";
import { simulate } from "../src/agents.js";
import { TOWN_A, TOWN_B, LONG_TERM, FREEZE, LAYOFFS, RUN_MONTHS } from "../src/datasets.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const close = (a, b, tol = 1e-12) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const A = TOWN_A, B = TOWN_B;

// --- the two towns -----------------------------------------------------------------
ok("both towns sit at exactly 6%", steady(A.s, A.f) === 0.06 && close(steady(B.s, B.f), 0.06), `${steady(A.s, A.f)}, ${steady(B.s, B.f)}`);
ok("both have the ratio f/s = 47/3", close(A.f / A.s, 47 / 3) && close(B.f / B.s, 47 / 3));
ok("Eastport's average spell is 2.1 months, Millbrook's 10.6", meanSpell(A.f).toFixed(1) === "2.1" && meanSpell(B.f).toFixed(1) === "10.6");
ok("a year or more: 0.05% in Eastport, 30.6% in Millbrook (nearly a third)",
   (longTermShare(A.f, LONG_TERM) * 100).toFixed(2) === "0.05" && (longTermShare(B.f, LONG_TERM) * 100).toFixed(1) === "30.6");
{
  const bins = durationBins(A.f, [0, 3, 6, 12, Infinity]);
  ok("most of Eastport's unemployed have been looking under three months (85%)", Math.round(bins[0].share * 100) === 85);
  const sum = (f) => durationBins(f, [0, 3, 6, 12, Infinity]).reduce((a, b) => a + b.share, 0);
  ok("each town's duration shares sum to 1", close(sum(A.f), 1) && close(sum(B.f), 1));
}
ok("five times as many people enter unemployment each month in Eastport", close((A.s * 0.94) / (B.s * 0.94), 5));
ok("inflow in Eastport is 28.2 per 1,000 workers a month", (1000 * A.s * (1 - 0.06)).toFixed(1) === "28.2");

// --- the agent simulation agrees (sampling tolerance) --------------------------------
{
  const simA = simulate(A.s, A.f, { seed: 11 });
  const simB = simulate(B.s, B.f, { seed: 12 });
  ok("simulated workers: both towns at 6% (20,000 workers, 600 months; sampling tolerance 0.002)",
     Math.abs(simA.u - 0.06) < 0.002 && Math.abs(simB.u - 0.06) < 0.002, `${simA.u.toFixed(4)}, ${simB.u.toFixed(4)}`);
  ok("simulated average completed spells match 1/f (sampling tolerance 2%)",
     Math.abs(simA.meanSpell / meanSpell(A.f) - 1) < 0.02 && Math.abs(simB.meanSpell / meanSpell(B.f) - 1) < 0.02,
     `${simA.meanSpell.toFixed(2)}, ${simB.meanSpell.toFixed(2)}`);
  ok("simulated long-term share in Millbrook matches (1 − f)^12 (sampling tolerance 1 point)",
     Math.abs(simB.longTermShare - longTermShare(B.f, LONG_TERM)) < 0.01, `${simB.longTermShare.toFixed(4)}`);
}

// --- one ratio -------------------------------------------------------------------------
ok("doubling layoffs and halving hiring give EXACTLY the same steady state (===)", steady(LAYOFFS.s, LAYOFFS.f) === steady(FREEZE.s, FREEZE.f));
ok("…which is 11.3%", (steady(FREEZE.s, FREEZE.f) * 100).toFixed(1) === "11.3");
{
  let worst = 0;
  for (let i = 1; i <= 50; i++) {
    const s = 0.001 * i, k = 0.3 + 0.1 * i;
    worst = Math.max(worst, Math.abs(steady(s, k * s) - steady(3 * s, 3 * k * s)));
  }
  ok("scaling both flows by the same factor never moves the rate", worst < 1e-15, worst.toExponential(2));
  let rays = 0;
  for (const u of [0.03, 0.06, 0.1, 0.15, 0.25]) for (const s of [0.01, 0.03, 0.07]) rays = Math.max(rays, Math.abs(steady(s, fForRate(s, u)) - u));
  ok("every point on a drawn ray has that ray's rate", rays < 1e-15, rays.toExponential(2));
}

// --- the hiring freeze ------------------------------------------------------------------
{
  const fr = shockRun(A, FREEZE, RUN_MONTHS), lo = shockRun(A, LAYOFFS, RUN_MONTHS);
  ok("hiring halves: unemployment climbs towards 11.3%, within 0.01 points after two years",
     Math.abs(fr[RUN_MONTHS].u - steady(FREEZE.s, FREEZE.f)) < 1e-4, `${fr[RUN_MONTHS].u}`);
  ok("…while job losses never rise above their old level, and end at 26.6 per 1,000",
     fr.every((r) => r.losers <= fr[0].losers + 1e-15) && (1000 * fr[RUN_MONTHS].losers).toFixed(1) === "26.6");
  ok("…falling from 28.2", (1000 * fr[0].losers).toFixed(1) === "28.2" && (1000 * fr[1].losers).toFixed(1) === "28.2");
  ok("layoffs double: 56.4 per 1,000 lose their job in the first month", (1000 * lo[1].losers).toFixed(1) === "56.4");
  ok("both runs head for the same rate", Math.abs(fr[RUN_MONTHS].u - lo[RUN_MONTHS].u) < 1e-4);
  ok("the layoff run gets there faster at every month", lo.slice(1).every((r, i) => r.u > fr[i + 1].u));
  // the path() route agrees with shockRun()
  const p = path(0.06, FREEZE.s, FREEZE.f, RUN_MONTHS);
  ok("two routes to the freeze path agree", p.every((r, t) => close(r.u, fr[t].u)));
}

// --- speed ----------------------------------------------------------------------------------
ok("Eastport's half-life is exactly one month (s + f = 1/2)", halfLife(A.s, A.f) === 1);
ok("Millbrook's is 6.6 months", halfLife(B.s, B.f).toFixed(1) === "6.6");
ok("after the shocks: 0.9 months when layoffs double, 2.3 when hiring halves",
   halfLife(LAYOFFS.s, LAYOFFS.f).toFixed(1) === "0.9" && halfLife(FREEZE.s, FREEZE.f).toFixed(1) === "2.3");
{
  // the gap really halves in that many months, simulated forward
  const s = B.s, f = B.f, h = halfLife(s, f);
  const p = path(0.12, s, f, 20);
  const gapAt = (t) => p[Math.floor(t)].u - 0.06;
  ok("Millbrook's gap is more than half left at month 6 and less than half at month 7",
     gapAt(6) > 0.03 && gapAt(7) < 0.03, `${gapAt(6)}, ${gapAt(7)}, h=${h}`);
}
// --- logs --------------------------------------------------------------------------------------
{
  const u = steady(A.s, A.f), e = 1e-6;
  const ds = (Math.log(steady(A.s * (1 + e), A.f)) - Math.log(u)) / Math.log(1 + e);
  const df = (Math.log(steady(A.s, A.f * (1 + e))) - Math.log(u)) / Math.log(1 + e);
  ok("d ln u*/d ln s = 1 − u* and d ln u*/d ln f = −(1 − u*)", Math.abs(ds - (1 - u)) < 1e-6 && Math.abs(df + (1 - u)) < 1e-6, `${ds}, ${df}`);
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);
