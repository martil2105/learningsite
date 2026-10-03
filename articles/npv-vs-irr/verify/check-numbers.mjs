// Every number the page states, re-derived from src/projects.js. The second
// route for the identity is the account itself: run the balance year by year
// and compare (k - r) x the discounted balances with the NPV summed directly.
import * as P from "../src/projects.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const c2 = (x) => Math.round(x * 100) / 100, p1 = (x) => Math.round(x * 1000) / 10;
const Q = P.PAIRS.timing.A.cf, S = P.PAIRS.timing.B.cf, Sm = P.PAIRS.scale.A.cf, L = P.PAIRS.scale.B.cf;

console.log("-- two scores for one project");
{
  eq("Quick's $150 is worth $136.36 today", c2(150 / 1.1), 136.36, 0);
  eq("Quick's NPV at 10% is $36.36", c2(P.npv(Q, 0.1)), 36.36, 0);
  eq("Quick's IRR is 50%", P.irr(Q), 0.5, 1e-12);
  eq("Slow's $300 is worth $186.28 today", c2(300 / 1.1 ** 5), 186.28, 0);
  eq("Slow's NPV at 10% is $86.28", c2(P.npv(S, 0.1)), 86.28, 0);
  eq("Slow's IRR is 24.6%", p1(P.irr(S)), 24.6, 0);
  eq("which is the rate that triples money in five years", P.irr(S), Math.pow(3, 1 / 5) - 1, 1e-12);
  truth("each project has exactly one IRR", P.irrs(Q).length === 1 && P.irrs(S).length === 1 && P.irrs(Sm).length === 1 && P.irrs(L).length === 1);
}

console.log("-- heights and areas (the identity)");
{
  let worst = 0, ends = 0;
  for (const cf of [Q, S, Sm, L]) for (const k of P.irrs(cf)) {
    ends = Math.max(ends, Math.abs(P.balances(cf, k).at(-1)));
    for (let r = 0; r <= 0.6; r += 0.01) worst = Math.max(worst, Math.abs((k - r) * P.capital(cf, k, r) - P.npv(cf, r)) / Math.max(1, Math.abs(P.npv(cf, r))));
  }
  truth("every account ends at zero", ends < 1e-9, ends.toExponential(1));
  truth("NPV = (IRR − r) × money tied up, for every project at every rate from 0% to 60%", worst < 1e-12, worst.toExponential(1));
  // the same identity for random cash flows with one sign change, as a check that nothing about our projects is special
  let seed = 12345; const u = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let worstR = 0;
  for (let i = 0; i < 300; i++) {
    const T = 2 + Math.floor(u() * 8), cf = [-100]; for (let t = 1; t <= T; t++) cf.push(5 + 60 * u());
    const k = P.irr(cf), r = 0.25 * u();
    worstR = Math.max(worstR, Math.abs((k - r) * P.capital(cf, k, r) - P.npv(cf, r)) / Math.max(1, Math.abs(P.npv(cf, r))));
  }
  truth("and for 300 random projects", worstR < 1e-10, worstR.toExponential(1));
  const a = P.rectangle(Q, 0.1), b = P.rectangle(S, 0.1);
  eq("Quick ties up 90.9 dollar-years", Math.round(a.width * 10) / 10, 90.9, 0);
  eq("at a margin of 40 points", a.height, 0.4, 1e-12);
  eq("Slow ties up 592.0 dollar-years", Math.round(b.width * 10) / 10, 592.0, 0);
  eq("at a margin of 14.6 points", p1(b.height), 14.6, 0);
  truth("Slow's rectangle is more than six times as wide", b.width / a.width > 6 && b.width / a.width < 7, (b.width / a.width).toFixed(2));
  truth("both rectangles lose the same height as r rises", Math.abs((P.rectangle(Q, 0.2).height - a.height) - (P.rectangle(S, 0.2).height - b.height)) < 1e-12);
  truth("and Slow's gets narrower faster (10% to 20%)", P.rectangle(S, 0.2).width / b.width < P.rectangle(Q, 0.2).width / a.width, `${(P.rectangle(S, 0.2).width / b.width).toFixed(3)} vs ${(P.rectangle(Q, 0.2).width / a.width).toFixed(3)}`);
}

console.log("-- the crossover");
{
  const x = P.crossover(Q, S);
  eq("the NPVs cross at 18.9%", p1(x), 18.9, 0);
  eq("where both are worth the same", P.npv(Q, x), P.npv(S, x), 1e-9);
  eq("and the rectangles have the same area", P.rectangle(Q, x).area, P.rectangle(S, x).area, 1e-9);
  eq("the difference is −150 in year 1 and +300 in year 5", P.difference(Q, S)[1] + P.difference(Q, S)[5], 150, 0);
  eq("its IRR is 2^(1/4) − 1", x, Math.pow(2, 1 / 4) - 1, 1e-12);
  truth("above the crossover Quick has the higher NPV, below it Slow does", P.npv(Q, 0.2) > P.npv(S, 0.2) && P.npv(Q, 0.18) < P.npv(S, 0.18));
  truth("past 24.6% Slow's rectangle is below zero", P.rectangle(S, 0.25).height < 0 && P.rectangle(S, 0.24).height > 0);
  const xs = P.crossover(Sm, L);
  eq("Small and Large flip at 27.8%", p1(xs), 27.8, 0);
  const sa = P.rectangle(Sm, 0.1), la = P.rectangle(L, 0.1);
  eq("Large's margin at 10% is 20 points", la.height, 0.2, 1e-12);
  eq("Small's is 40", sa.height, 0.4, 1e-12);
  eq("Large's rectangle is ten times as wide", la.width / sa.width, 10, 1e-12);
  eq("Large's NPV is $181.82", c2(la.npv), 181.82, 0);
  eq("Small's is $36.36", c2(sa.npv), 36.36, 0);
}

console.log("-- the lab's windows");
{
  let inA = true;
  for (let r = 0; r <= 0.55; r += 0.005) { if (P.npv(S, r) < -80 || P.npv(S, r) > 220 || P.npv(Q, r) < -80) inA = false; }
  let inB = true;
  for (let r = 0; r <= 0.55; r += 0.005) { if (P.npv(L, r) < -180 || P.npv(L, r) > 320 || P.npv(Sm, r) < -180) inB = false; }
  truth("both pairs' NPV curves fit their charts from 0% to 55%", inA && inB);
  let caps = true;
  for (let r = 0; r <= 0.4; r += 0.005) { if (P.rectangle(S, r).width > 850 || P.rectangle(L, r).width > 1050) caps = false; for (const cf of [Q, S, Sm, L]) { const h = P.rectangle(cf, r).height; if (h < -0.2 || h > 0.55) caps = false; } }
  truth("every rectangle fits its chart for costs of capital up to 40%", caps);
}

console.log("-- does the IRR assume reinvestment?");
{
  eq("at 10% Quick's $150 grows to $219.62", c2(P.reinvested(150, 4, 0.1)), 219.62, 0);
  eq("it matches Slow's $300 at the crossover rate", P.reinvested(150, 4, P.crossover(Q, S)), 300, 1e-12);
  truth("the reinvestment chart's $450 top holds the $150 grown at 30%", P.reinvested(150, 4, 0.3) < 450, P.reinvested(150, 4, 0.3).toFixed(1));
}

console.log("-- a project with two IRRs");
{
  const ks = P.irrs(P.MINE);
  truth("the mine has two IRRs, 20% and 300%", ks.length === 2 && Math.abs(ks[0] - 0.2) < 1e-12 && Math.abs(ks[1] - 3) < 1e-12, ks.join(", "));
  eq("at 10% it loses $23.97", c2(P.npv(P.MINE, 0.1)), -23.97, 0);
  truth("though both IRRs beat 10%", ks.every((k) => k > 0.1));
  eq("at 20% its balance after a year is −$400", P.balances(P.MINE, 0.2)[1], -400, 1e-12);
  eq("so it ties up −239.67 dollar-years at 10%", c2(P.capital(P.MINE, 0.2, 0.1)), -239.67, 0);
  eq("and margin × money is −$23.97 at the 20% IRR", c2((0.2 - 0.1) * P.capital(P.MINE, 0.2, 0.1)), -23.97, 0);
  eq("and at the 300% IRR too", (3 - 0.1) * P.capital(P.MINE, 3, 0.1), P.npv(P.MINE, 0.1), 1e-12);
  let worst = 0;
  for (let r = 0; r <= 3.5; r += 0.01) for (const k of ks) worst = Math.max(worst, Math.abs((k - r) * P.capital(P.MINE, k, r) - P.npv(P.MINE, r)));
  truth("the identity holds at both IRRs at every rate from 0% to 350%", worst < 1e-12, worst.toExponential(1));
  let pos = true;
  for (let i = 1; i < 700; i++) { const r = i / 200; if (Math.abs(r - 0.2) < 1e-6 || Math.abs(r - 3) < 1e-6) continue; const v = P.npv(P.MINE, r); if ((r > 0.2 && r < 3) !== (v > 0)) pos = false; }
  truth("the mine is worth digging only between its two IRRs", pos);
  let lo = 0, hi = 0;
  for (let r = 0; r <= 3.5; r += 0.01) { lo = Math.min(lo, P.npv(P.MINE, r)); hi = Math.max(hi, P.npv(P.MINE, r)); }
  truth("its NPV curve fits the chart (−$70 to $50)", lo > -70 && hi < 50, `${lo.toFixed(1)} to ${hi.toFixed(1)}`);
}

console.log("-- what this costs you");
{
  const f0 = P.fund(0), f1 = P.fund(1);
  eq("calling $100 now for $200 in five years is an IRR of 14.9%", p1(f0.irr), 14.9, 0);
  eq("a year on a 3% credit line lifts it to 18.0%", p1(f1.irr), 18.0, 0);
  eq("the multiple falls from 2.00", c2(f0.multiple), 2.0, 0);
  eq("to 1.94", c2(f1.multiple), 1.94, 0);
  eq("and at 3% the NPV doesn't change", P.npv(f1.cf, 0.03), P.npv(f0.cf, 0.03), 1e-12);
  const none = [100, -250, 200];
  let min = Infinity;
  for (let r = -0.9; r <= 50; r += 0.001) min = Math.min(min, P.npv(none, r));
  truth("$100 now, −$250, +$200 has a positive NPV at every rate", min > 0 && P.irrs(none, -0.9, 50).length === 0, `lowest ${min.toFixed(3)}`);
  eq("its lowest NPV, in today's money, is 21.875 at the rate where 1/(1+r) = 0.625", P.npv(none, 1 / 0.625 - 1), 21.875, 1e-12);
}

console.log(`\n${n - fails} of ${n} checks pass`);
if (fails) process.exit(1);
