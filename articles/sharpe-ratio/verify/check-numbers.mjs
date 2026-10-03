// Every number the page states, re-derived from src/smoothing.js. The second
// route is simulation: two million months of true and reported returns, and
// thousands of seeded short histories for the estimation claims.
import * as S from "../src/smoothing.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const f2 = (x) => Math.round(x * 100) / 100, f1 = (x) => Math.round(x * 10) / 10, pc = (x) => Math.round(x * 100);

console.log("-- our fund");
{
  eq("6% a year above the risk-free rate", 12 * S.MU, 0.06, 1e-12);
  eq("with a volatility of 15%", S.SD * Math.sqrt(12), 0.15, 1e-12);
  eq("so its true Sharpe ratio is 0.40", S.TRUE_SR, 0.4, 1e-12);
}

console.log("-- from a month to a year");
{
  const V = (q, r) => S.qVarianceFactor(q, (k) => Math.pow(r, k));
  eq("with no memory a year is 12 months of variance", V(12, 0), 12, 1e-12);
  eq("at a correlation of 0.1 it's 14.4 months", f1(V(12, 0.1)), 14.4, 0);
  eq("so the √12 rule overstates by 9.6%", f1(100 * (S.ar1Factor(0.1) - 1)), 9.6, 0);
  eq("and at −0.1 it understates by 8.8%", f1(100 * (1 - S.ar1Factor(-0.1))), 8.8, 0);
  // the AR(1) variance of a year from a simulation
  const z = (await import("../src/random.js")).normals(99);
  let x = 0; const sums = [];
  for (let y = 0; y < 200000; y++) { let s = 0; for (let m = 0; m < 12; m++) { x = 0.1 * x + Math.sqrt(1 - 0.01) * z(); s += x; } sums.push(s); }
  const mean = sums.reduce((a, b) => a + b, 0) / sums.length, v = sums.reduce((a, b) => a + (b - mean) ** 2, 0) / (sums.length - 1);
  truth("a simulated AR(1) market agrees (sampling tolerance)", Math.abs(v - V(12, 0.1)) < 0.15, `${v.toFixed(3)} vs ${V(12, 0.1).toFixed(3)}`);
  truth("the memory chart's window holds every correlation on the slider", V(12, 0.5) < 35 && V(12, -0.5) > 0, `${V(12, 0.5).toFixed(1)}, ${V(12, -0.5).toFixed(1)}`);
}

console.log("-- prices that remember (closed forms)");
{
  const o6 = S.smoothed(0.6), o8 = S.smoothed(0.8);
  eq("at a smoothing of 0.6 the reported volatility is 7.5%", o6.sdRep * Math.sqrt(12), 0.075, 1e-12);
  eq("half the true one", o6.sdRep / o6.sdTrue, 0.5, 1e-12);
  eq("so the reported Sharpe ratio is 0.80", o6.naive, 0.8, 1e-12);
  eq("and at 0.8 it triples to 1.20", o8.naive, 1.2, 1e-12);
  eq("Lo's correction gives 0.44 at 0.6", f2(o6.lo), 0.44, 0);
  let worst = 0;
  for (let a = 0; a <= 0.9; a += 0.05) for (const q of [1, 3, 12, 24, 60, 120])
    worst = Math.max(worst, Math.abs(S.loSharpe(S.MU / (S.SD * Math.sqrt((1 - a) / (1 + a))), q, (k) => Math.pow(a, k)) / ((Math.sqrt(q) * S.MU) / S.SD) - S.loInflationAt(a, q)));
  truth("Lo's formula with correlations a^k equals the hidden-months form at every a and horizon", worst < 1e-12, worst.toExponential(1));
  eq("1.87 months are hidden in a year at 0.6", f2(S.hiddenMonths(0.6, 12)), 1.87, 0);
  eq("Lo's correction is 9% high at one year (0.6)", pc(S.loInflationAt(0.6, 12) - 1), 9, 0);
  eq("and 24% high at 0.8", pc(S.loInflationAt(0.8, 12) - 1), 24, 0);
  eq("over five years, 2% (0.6)", pc(S.loInflationAt(0.6, 60) - 1), 2, 0);
  eq("and 4% (0.8)", pc(S.loInflationAt(0.8, 60) - 1), 4, 0);
  let flat = 0;
  for (const a of [0.3, 0.6, 0.8]) flat = Math.max(flat, Math.abs(S.hiddenMonths(a, 120) - S.hiddenMonths(a, 24)));
  truth("the hidden months barely change past two years", flat < 0.03, flat.toFixed(4));
  let start = 0;
  for (let a = 0; a <= 0.85; a += 0.05) start = Math.max(start, Math.abs(S.loInflationAt(a, 1) - Math.sqrt((1 + a) / (1 - a))));
  truth("at one month Lo's correction starts from the square-root rule", start < 1e-12);
  const ac = (a) => { const h12 = S.hiddenMonths(a, 12), h24 = S.hiddenMonths(a, 24); return (2 * h12 - h24) / 2 / (12 - h12); };
  eq("reported yearly returns have a year-to-year correlation of 0.09 at 0.6", f2(ac(0.6)), 0.09, 0);
  truth("the horizon chart's 3.6× top holds the square-root rule at 0.85", Math.sqrt(1.85 / 0.15) < 3.6);
}

console.log("-- the same, simulated (two million months at a = 0.6)");
{
  const a = 0.6, N = 2_000_000, burn = 1000;
  const R = S.truePath(N, 11), Ro = S.smooth(R, a, S.MU);
  const st = S.sampleStats(Ro.slice(burn));
  truth("reported monthly volatility matches the closed form", Math.abs(st.sd / S.smoothed(a).sdRep - 1) < 0.003, (st.sd / S.smoothed(a).sdRep).toFixed(4));
  truth("reported returns correlate with last month's by a", Math.abs(st.ac(1) - a) < 0.003, st.ac(1).toFixed(4));
  truth("and with two months back by a²", Math.abs(st.ac(2) - a * a) < 0.003, st.ac(2).toFixed(4));
  const ys = []; for (let i = burn; i + 12 <= N; i += 12) { let s = 0; for (let k = 0; k < 12; k++) s += Ro[i + k]; ys.push(s); }
  const sy = S.sampleStats(ys);
  truth("the Sharpe ratio of reported yearly returns is Lo's 0.44, not the true 0.40", Math.abs(sy.mean / sy.sd - S.smoothed(a).lo) < 0.01, (sy.mean / sy.sd).toFixed(4));
  truth("and reported years correlate with the year before by about 0.09", Math.abs(sy.ac(1) - 0.092) < 0.01, sy.ac(1).toFixed(4));
  const U = S.unsmooth(Ro, a, S.MU);
  let worst = 0; for (let i = 0; i < N; i += 997) worst = Math.max(worst, Math.abs(U[i] - R[i]));
  truth("unsmoothing with the right a gives back every true return", worst < 1e-14, worst.toExponential(1));
}

console.log("-- the lab's history");
{
  const R = S.truePath(12 * S.YEARS, S.SEED), st = S.sampleStats(R);
  eq("its own Sharpe ratio is 0.40", f2((Math.sqrt(12) * st.mean) / st.sd), 0.4, 0);
  let lo = Infinity, hi = 0, un = 0;
  for (let a = 0; a <= 0.851; a += 0.05) {
    const Ro = S.smooth(R, a, S.MU), U = S.unsmooth(Ro, a, S.MU);
    for (const g of [S.growth(R), S.growth(Ro)]) for (const v of g) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    for (let i = 0; i < R.length; i++) un = Math.max(un, Math.abs(U[i] - R[i]));
  }
  truth("every line in the lab stays inside its $0.80 to $4.50 window", lo > 0.8 && hi < 4.5, `${lo.toFixed(2)} to ${hi.toFixed(2)}`);
  truth("and the unsmoothed series lands on the true one at every smoothing", un < 1e-15, un.toExponential(1));
  const g = S.growth(R); const peak = Math.max(...g);
  {
    const Ro = S.smooth(R, 0.6, S.MU), h = S.growth(Ro), ip = g.indexOf(Math.max(...g)), it = ip + g.slice(ip).indexOf(Math.min(...g.slice(ip)));
    truth("the peak is near year 9", Math.abs(ip / 12 - 9) < 0.5, (ip / 12).toFixed(2));
    truth("the reported line's peak is lower than the true one and its trough after it higher", Math.max(...h) < Math.max(...g) - 0.1 && Math.min(...h.slice(ip)) > g[it] + 0.05);
  }
  truth("the history has a fall in it of more than a third from its peak", g.at(-1) / peak < 0.67 || Math.min(...g.slice(g.indexOf(peak))) / peak < 0.67, (Math.min(...g.slice(g.indexOf(peak))) / peak).toFixed(2));
}

console.log("-- estimation");
{
  const a = 0.6, n = 60, M = 4000;
  let s = 0;
  for (let i = 0; i < M; i++) { const R = S.truePath(n + 200, 1000 + i); const Ro = S.smooth(R, a, S.MU).slice(200); s += S.sampleStats(Ro).ac(1); }
  const m = s / M;
  truth("with five years of data, the estimate of a averages 0.54 (sampling tolerance)", Math.abs(m - 0.54) < 0.01, m.toFixed(4));
  const se = Math.sqrt(12) * Math.sqrt((1 + (S.MU / S.SD) ** 2 / 2) / 120);
  eq("the standard error of a ten-year Sharpe ratio is about 0.32", f2(se), 0.32, 0);
  const ests = [];
  for (let i = 0; i < 4000; i++) { const R = S.truePath(120, 50000 + i), st = S.sampleStats(R); ests.push((Math.sqrt(12) * st.mean) / st.sd); }
  const mu = ests.reduce((x, y) => x + y, 0) / ests.length, sd = Math.sqrt(ests.reduce((x, y) => x + (y - mu) ** 2, 0) / (ests.length - 1));
  truth("and 4,000 simulated ten-year histories agree", Math.abs(sd - se) < 0.015, sd.toFixed(4));
}

console.log(`\n${n - fails} of ${n} checks pass`);
if (fails) process.exit(1);
