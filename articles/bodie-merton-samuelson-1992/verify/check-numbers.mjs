// Every number the page states, derived here. Route A is src/flex.js, closed forms.
// Route B never uses them: it maximises utility by search. The flexible worker's
// spending is split between consumption and leisure by a search over the split,
// the risk aversion of each worker is measured from the curvature of their
// utility, and the portfolio demands come from a search over stock dollars in a
// coin-flip market, with the labour choice made inside every outcome.
import * as F from "../src/flex.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;

// ---- route B -------------------------------------------------------------------
const u = (z, g) => (Math.abs(g - 1) < 1e-12 ? Math.log(z) : Math.pow(z, 1 - g) / (1 - g));
// one year's utility of consumption C and leisure L
const util = (C, L, a, g) => u(Math.pow(C, a) * Math.pow(L, 1 - a), g);
// best split of spending x (wage 1, so leisure costs 1 a unit) into C and leisure, by ternary search
function bestSplit(x, a, g) {
  let lo = 1e-9 * x, hi = x * (1 - 1e-9);
  for (let i = 0; i < 200; i++) {
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
    if (util(m1, x - m1, a, g) < util(m2, x - m2, a, g)) lo = m1; else hi = m2;
  }
  const C = (lo + hi) / 2;
  return { C, L: x - C, V: util(C, x - C, a, g) };
}
// relative risk aversion of a function of one variable, by central differences
function rra(f, x, h = 2e-3) {
  const d = h * x;
  const f1 = (f(x + d) - f(x - d)) / (2 * d), f2 = (f(x + d) - 2 * f(x) + f(x - d)) / (d * d);
  return (-x * f2) / f1;
}

console.log("-- the plan: spending is split between consumption and leisure");
for (const [a, g] of [[0.5, 2], [0.4, 1.5], [0.8, 10], [0.6, 4]]) {
  const x = 3.7;
  const s = bestSplit(x, a, g);
  eq(`consumption is a of spending (a ${a}, g ${g})`, s.C / x, a, 1e-6);
  eq(`leisure is 1 - a of spending (a ${a}, g ${g})`, s.L / x, 1 - a, 1e-6);
}

console.log("-- risk aversion, measured from the curvature of utility");
for (const [a, g] of [[0.5, 2], [0.4, 1.5], [0.8, 10], [0.6, 4], [0.3, 3]]) {
  // flexible: the value of spending x once leisure is chosen well
  const rf = rra((x) => bestSplit(x, a, g).V, 5);
  eq(`flexible: risk aversion over spending is g (a ${a}, g ${g})`, rf, g, 2e-4);
  // fixed hours: leisure is stuck at Lbar, so only consumption moves
  const Lbar = 0.55;
  const rx = rra((C) => util(C, Lbar, a, g), 5);
  eq(`fixed: risk aversion over consumption is 1 - a(1 - g) (a ${a}, g ${g})`, rx, F.gammaC(a, g), 2e-4);
  truth(`fixed workers are less risk averse over consumption when g > 1 (a ${a}, g ${g})`, g <= 1 || rx < rf);
}

console.log("-- portfolio demands by search, in a coin-flip market");
{
  // a year in the market, then one last period of work. Savings W, stock up 1.25 or down 0.89, safe 1.02.
  const U = 1.25, D = 0.89, RR = 1.02;
  const share1 = (g) => { const A = U - RR, B = RR - D, k = Math.pow(A / B, 1 / g); return (RR * (k - 1)) / (A + k * B); };
  for (const [a, g, W, hbar] of [[0.5, 2, 1, 0.5], [0.5, 2, 3, 0.3], [0.4, 4, 2, 0.6], [0.7, 3, 0.5, 0.7], [0.5, 10, 1, 0.5]]) {
    // flexible: at date 1 she owns W1 plus her whole time endowment (1) and splits it between consumption and leisure
    const flexValue = (S) => {
      const W1 = (W - S) * RR;
      const up = W1 + S * U + 1, dn = W1 + S * D + 1;
      if (dn <= 0) return -Infinity;
      return 0.5 * bestSplit(up, a, g).V + 0.5 * bestSplit(dn, a, g).V;
    };
    // fixed: she works hbar at date 1 for pay hbar and leisure stays 1 - hbar
    const fixValue = (S) => {
      const W1 = (W - S) * RR;
      const up = W1 + S * U + hbar, dn = W1 + S * D + hbar;
      if (dn <= 0) return -Infinity;
      return 0.5 * util(up, 1 - hbar, a, g) + 0.5 * util(dn, 1 - hbar, a, g);
    };
    const scan = (f) => { let best = -Infinity, arg = 0; for (let S = 0; S <= 12; S += 0.002) { const v = f(S); if (v > best) { best = v; arg = S; } } return arg; };
    const sFlex = scan(flexValue), sFix = scan(fixValue);
    const cFlex = share1(g) * (W + 1 / RR), cFix = share1(F.gammaC(a, g)) * (W + hbar / RR);
    eq(`flexible stock dollars = Merton(g) x (savings + all her time) (a ${a}, g ${g}, W ${W})`, sFlex, cFlex, 0.004);
    eq(`fixed stock dollars = Merton(1 - a(1 - g)) x (savings + her pay) (a ${a}, g ${g}, W ${W}, hours ${hbar})`, sFix, cFix, 0.004);
  }
}

console.log("-- the gap between the two, by route B");
{
  let worst = 0, cases = 0;
  for (const a of [0.4, 0.5, 0.6, 0.8]) for (const g of [1.5, 2, 4, 10]) for (const n of [10, 20, 30, 40]) for (const W of [0, 1, 5, 8]) {
    const A = F.annuity(n);
    const total = W + A;
    const x = total / A;                       // spend everything we own evenly over the years left
    const s = bestSplit(x, a, g);              // the best split, by search
    const hours = 1 - s.L;                     // leisure is what's left of the year
    if (hours <= 0) continue;
    const rf = rra((y) => bestSplit(y, a, g).V, 5), rx = rra((C) => util(C, 1 - hours, a, g), 5);
    const flex = (F.PREMIUM / (rf * F.SIGMA ** 2)) * total;
    const fixed = (F.PREMIUM / (rx * F.SIGMA ** 2)) * (W + hours * A);
    const t = F.today({ a, g, W, n });
    worst = Math.max(worst, Math.abs(hours - t.hours), Math.abs(flex / fixed - F.factor(a, g)) / F.factor(a, g), Math.abs(flex - t.flex) / t.flex, Math.abs(fixed - t.fixed) / t.fixed);
    cases++;
  }
  truth(`the search agrees with the closed forms on hours, stock dollars and the gap (${cases} cases, worst ${worst.toExponential(1)})`, worst < 5e-4);
}

console.log("-- the gap");
eq("gap at a = 1/2, g = 2 is 3/2", F.factor(0.5, 2), 1.5, 1e-12);
eq("gap at g = 4 is 1.25", F.factor(0.5, 4), 1.25, 1e-12);
eq("gap at g = 10 is 1.1", F.factor(0.5, 10), 1.1, 1e-12);
eq("gap at a = 0.3, g = 2 is 13/6", F.factor(0.3, 2), 13 / 6, 1e-12);
{
  const gs = [1.5, 2, 3, 5, 10];
  truth("the gap is above one for every a < 1 and g", [0.4, 0.5, 0.6, 0.8].every((a) => gs.every((g) => F.factor(a, g) > 1)));
  truth("it falls as risk aversion rises", [0.4, 0.5, 0.8].every((a) => gs.slice(1).every((g, i) => F.factor(a, g) < F.factor(a, gs[i]))));
  truth("it falls as the weight on consumption rises", gs.every((g) => F.factor(0.8, g) < F.factor(0.6, g) && F.factor(0.6, g) < F.factor(0.4, g)));
  eq("it is the same at every savings and horizon (spread over the grid)", (() => {
    let lo = Infinity, hi = -Infinity;
    for (const n of [5, 10, 20, 30, 40]) for (const W of [0, 0.5, 1, 2, 4]) { const t = F.today({ a: 0.5, g: 2, W, n }); lo = Math.min(lo, t.ratio); hi = Math.max(hi, t.ratio); }
    return hi - lo;
  })(), 0, 1e-12);
  eq("and it is the ratio of the two risk aversions over a times g", F.gammaC(0.5, 2) / (0.5 * 2), F.factor(0.5, 2), 1e-12);
}

console.log("-- the default: one year's pay saved, thirty years to go");
const P = { a: 0.5, g: 2, W: 1, n: 30 };
const d0 = F.today(P);
truth("thirty years of pay at the safe rate is worth about 22.4", round(d0.A, 1) === 22.4, d0.A.toFixed(3));
truth("we work about 48% of full time today", round(100 * d0.hours) === 48, (100 * d0.hours).toFixed(2));
truth("the flexible worker holds about 18 years of pay in stocks", round(d0.flex) === 18, d0.flex.toFixed(2));
truth("the fixed one about 12", round(d0.fixed) === 12, d0.fixed.toFixed(2));
eq("a third fewer stock dollars is the same as a gap of 1.5", d0.fixed / d0.flex, 1 / 1.5, 1e-12);
truth("the Merton share is about 77%", round(100 * F.merton(2)) === 77);
truth("the fixed worker's risk aversion is 1.5", F.gammaC(0.5, 2) === 1.5);
truth("and her Merton share, on what she owns, about 103%", round(100 * F.merton(1.5)) === 103, (100 * F.merton(1.5)).toFixed(1));
eq("both spend the same today", d0.consumption, 0.5 * d0.total / d0.A, 1e-12);

console.log("-- a bad year: 20% against the safe rate");
{
  const r = F.response(P, -0.2);
  truth("the flexible worker's consumption falls about 15%", round(100 * r.consFlex) === -15, (100 * r.consFlex).toFixed(2));
  truth("the fixed worker's falls about 21%", round(100 * r.consFixed) === -21, (100 * r.consFixed).toFixed(2));
  eq("consumption moves by the Merton share of the market's move", r.consFlex, F.merton(2) * -0.2, 1e-12);
  eq("and for the fixed worker by the share at her own risk aversion", r.consFixed, F.merton(1.5) * -0.2, 1e-12);
  truth("the fixed worker's consumption is exposed a third more than the flexible one's", round(r.consFixed / r.consFlex, 2) === 1.33, (r.consFixed / r.consFlex).toFixed(3));
  truth("her stocks are a third fewer and still hit consumption harder", r.fixed < r.flex && Math.abs(r.consFixed) > Math.abs(r.consFlex));
  truth("the flexible worker's hours rise from 48% to about 56%", round(100 * r.hoursFlex) === 56 && round(100 * r.hours) === 48, (100 * r.hoursFlex).toFixed(2));
  eq("the fixed worker's hours don't move", r.hoursFixed, r.hours, 0);
  // route B: after the loss she re-plans and splits the new wealth again, by search
  const dOm = r.flex * -0.2, x1 = (d0.total + dOm) / d0.A, s1 = bestSplit(x1, 0.5, 2), s0 = bestSplit(d0.total / d0.A, 0.5, 2);
  eq("route B: her new hours, from a fresh search over the split", 1 - s1.L, r.hoursFlex, 1e-6);
  eq("route B: her consumption change, from the same search", (s1.C - s0.C) / s0.C, r.consFlex, 1e-6);
  eq("each unit lost adds (1 - a)/A hours", (1 - 0.5) / d0.A, (r.hoursFlex - r.hours) / -(r.flex * -0.2), 1e-9);
  truth("and a good year: she works less", F.response(P, 0.2).hoursFlex < d0.hours);
  // the figure's control at 10: nearly the same stocks, but the fixed worker's consumption still swings more
  const r10 = F.response({ a: 0.5, g: 10, W: 1, n: 30 }, -0.2);
  truth("at risk aversion 10 the flexible worker holds about 1.1 times as much", round(r10.ratio, 1) === 1.1, r10.ratio.toFixed(3));
  truth("and the fixed worker's consumption swings about 1.8 times as much", round(r10.consFixed / r10.consFlex, 1) === 1.8, (r10.consFixed / r10.consFlex).toFixed(3));
  eq("which is g over the fixed worker's risk aversion", r10.consFixed / r10.consFlex, 10 / F.gammaC(0.5, 10), 1e-12);
}

console.log("-- the retirement corner");
{
  eq("at a = 1/2 with thirty years left, she stops working at 22.4 years of pay", F.retireAt(0.5, 30), d0.A, 1e-12);
  eq("hours are zero there", F.today({ a: 0.5, g: 2, W: F.retireAt(0.5, 30), n: 30 }).hours, 0, 1e-12);
  truth("and past it she is retired", F.today({ a: 0.5, g: 2, W: 23, n: 30 }).retired && !F.today({ a: 0.5, g: 2, W: 22, n: 30 }).retired);
  truth("with 10 years left the corner is about 9 years of pay", round(F.retireAt(0.5, 10)) === 9, F.retireAt(0.5, 10).toFixed(2));
  truth("with 40 years left it is off the chart's axis", F.retireAt(0.5, 40) > 25, F.retireAt(0.5, 40).toFixed(2));
  eq("hours at no savings are the weight on consumption", F.today({ a: 0.6, g: 2, W: 0, n: 20 }).hours, 0.6, 1e-12);
}

console.log("-- the sliders never leave the drawing");
{
  let worstCons = 0, minH = Infinity, maxH = -Infinity, anyRetired = false;
  for (let a = 0.4; a <= 0.8001; a += 0.05) for (let g = 1.5; g <= 10.001; g += 0.5) for (let r = -0.4; r <= 0.4001; r += 0.01) {
    const t = F.response({ a, g, W: 1, n: 30 }, r);
    worstCons = Math.max(worstCons, Math.abs(t.consFlex), Math.abs(t.consFixed));
    minH = Math.min(minH, t.hoursFlex); maxH = Math.max(maxH, t.hoursFlex);
    if (t.retired) anyRetired = true;
  }
  truth("consumption stays inside the 60% window", worstCons < 0.6, worstCons.toFixed(3));
  truth("hours stay between 0 and 100% of full time", minH > 0 && maxH < 1, `${minH.toFixed(3)} to ${maxH.toFixed(3)}`);
  truth("no worker is retired at the first figure's savings", !anyRetired);
  let top = 0;
  for (let a = 0.4; a <= 0.8001; a += 0.05) for (let g = 1.5; g <= 10.001; g += 0.5) for (const n of [10, 20, 30, 40]) for (let W = 0; W <= 25; W += 0.1) { const t = F.today({ a, g, W, n }); if (!t.retired) top = Math.max(top, t.flex, t.fixed); }
  truth("the second figure's window, which grows in tens, never needs more than 60 years of pay", top <= 60, top.toFixed(1));
}

console.log("-- when spending isn't even");
{
  // the plan spends s times the even rate; hours then fall with s and the gap follows
  truth("s = 1 gives the gap above", Math.abs(F.factorAt(0.5, 2, 1) - 1.5) < 1e-12);
  truth("spending a fifth faster: the gap grows to 1.9", round(F.factorAt(0.5, 2, 1.2), 1) === 1.9, F.factorAt(0.5, 2, 1.2).toFixed(3));
  truth("a fifth slower: 1.25", round(F.factorAt(0.5, 2, 0.8), 2) === 1.25, F.factorAt(0.5, 2, 0.8).toFixed(3));
  let ok = true;
  for (const a of [0.4, 0.5, 0.8]) for (const g of [1.5, 2, 4, 10]) for (let s = 0.05; s < 1 / (1 - a) - 0.05; s += 0.05) {
    const above = F.factorAt(a, g, s) > 1, cond = s > 1 - 1 / g;
    if (Math.abs(s - (1 - 1 / g)) < 0.026) continue;
    if (above !== cond) ok = false;
  }
  truth("flexibility raises stock holdings exactly when the plan spends more than 1 - 1/g of the even rate", ok);
  eq("at g = 2 the line is half the even rate", 1 - 1 / 2, 0.5, 1e-12);
  // route B for the hours-and-gap link: search for the split, use the measured risk aversions
  const a = 0.5, g = 2, W = 1, nn = 30, A = F.annuity(nn), total = W + A, s = 1.2;
  const sp = bestSplit((s * total) / A, a, g);
  const hours = 1 - sp.L;
  const rf = rra((y) => bestSplit(y, a, g).V, 5), rx = rra((C) => util(C, 1 - hours, a, g), 5);
  eq("route B: at s = 1.2 the stock dollars are in that ratio", ((F.PREMIUM / (rf * F.SIGMA ** 2)) * total) / ((F.PREMIUM / (rx * F.SIGMA ** 2)) * (W + hours * A)), F.factorAt(a, g, s), 5e-4);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
