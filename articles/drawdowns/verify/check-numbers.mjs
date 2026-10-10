// Every number on the page, from src/drawdown.js, src/precomputed.js and the
// pinned daily file, in page order and rounded as the page rounds. First the
// provenance and the precompute's freshness, then second routes to the
// eigenfunction series (exact formulas, simulation), then the sentences.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { run } from "../scripts/build-data.mjs";
import { run as precompute } from "../scripts/precompute.mjs";
import * as M from "../src/market.js";
import * as D from "../src/drawdown.js";
import P from "../src/precomputed.js";
import { normals } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const here = (p) => new URL(p, import.meta.url);
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2);
const pc1 = (x) => r1(100 * x), pc0 = (x) => r0(100 * x);
const lostMed = (sr, T) => D.lost(D.median(sr * D.SIGMA, D.SIGMA, T));
const beat = (sr, B, L) => P.BEAT[sr][B][P.LIVE.indexOf(L)];

console.log("-- the data and the precompute");
{
  const csv = readFileSync(here("../data/F-F_Research_Data_Factors_daily.csv"));
  const src = JSON.parse(readFileSync(here("../data/sources.json"), "utf8"))[0];
  truth("the pinned file's hash is the one recorded", createHash("sha256").update(csv).digest("hex") === src.sha256);
  truth("src/data.js is a fresh parse of the pinned file", run() === readFileSync(here("../src/data.js"), "utf8"));
  truth("src/precomputed.js is a fresh run of scripts/precompute.mjs", precompute() === readFileSync(here("../src/precomputed.js"), "utf8"));
}

console.log("-- second routes to the series");
{
  // with no drift the mean is exactly √(πτ/2)
  let worst = 0;
  for (const t of [0.01, 0.3, 1, 7, 50]) worst = Math.max(worst, Math.abs(D.meanScaled(t, D.survivalZero) / D.meanShort(t) - 1));
  eq("with no edge, the series' mean is √(π/2)·σ√T", worst, 0, 1e-6);
  // with drift, the two ends of Magdon-Ismail et al.
  truth("a short record: the mean tends to √(πτ/2)", Math.abs(D.meanScaled(1e-4) / D.meanShort(1e-4) - 1) < 0.01, (D.meanScaled(1e-4) / D.meanShort(1e-4)).toFixed(4));
  truth("a long record: the mean tends to ½ ln τ + 0.63519", Math.abs(D.meanScaled(1e4) - D.meanLong(1e4)) < 0.003, (D.meanScaled(1e4) - D.meanLong(1e4)).toFixed(4));
  eq("the page rounds the constant to 0.64", r2(0.63519), 0.64, 0);
  // a simulation sharing no code with the series; daily-style steps miss about 1.165·√dt of the worst drawdown
  const g = normals(31);
  for (const [tau, steps, paths] of [[1, 4000, 12000], [10, 8000, 3000]]) {
    const dt = tau / steps, sd = Math.sqrt(dt);
    let s = 0, s2 = 0;
    for (let p = 0; p < paths; p++) { let x = 0, m = 0, d = 0; for (let i = 0; i < steps; i++) { x += dt + sd * g(); if (x > m) m = x; else if (m - x > d) d = m - x; } s += d; s2 += d * d; }
    const mean = s / paths, se = Math.sqrt((s2 / paths - mean * mean) / paths), fixed = mean + 1.1652 * sd;
    truth(`simulated walks with drift agree with the series at τ = ${tau}`, Math.abs(fixed - D.meanScaled(tau)) < 4 * se + 0.004, `${fixed.toFixed(4)} vs ${D.meanScaled(tau).toFixed(4)} ± ${se.toFixed(4)}`);
  }
  // the scaling: two strategies with the same SR²T have the same worst drawdown in units of σ/SR
  const a = D.median(0.25 * 0.15, 0.15, 16) / (0.15 / 0.25), b = D.median(1 * 0.3, 0.3, 1) / (0.3 / 1);
  eq("Sharpe 0.25 for 16 years and Sharpe 1 for 1 year (at another volatility) share a scaled median", a, b, 1e-6);
  // and the median of the cdf really is a median: a simulation of the strategy itself, daily steps
  const g2 = normals(77); const W = [];
  for (let p = 0; p < 3000; p++) { let x = 0, m = 0, d = 0; for (let i = 0; i < 2520; i++) { x += D.MU / 252 + (D.SIGMA / Math.sqrt(252)) * g2(); if (x > m) m = x; else if (m - x > d) d = m - x; } W.push(d); }
  W.sort((p, q) => p - q);
  truth("3,000 simulated decades of our strategy put the median worst fall within a point of the formula's", Math.abs(D.lost(W[1500]) - lostMed(0.5, 10)) < 0.01, `${(100 * D.lost(W[1500])).toFixed(1)} vs ${(100 * lostMed(0.5, 10)).toFixed(1)}`);
}

console.log("-- the opening and the guess card");
{
  eq("a ten-year backtest's typical worst fall is about 30%", r0(100 * lostMed(0.5, 10)), 30, 0);
  eq("live trading goes past the backtest's worst within as many years half the time", beat(0.5, 10, 10), 0.5, 1e-4);
  eq("the guess card says 50%", pc0(beat(0.5, 10, 10)), 50, 0);
  // simulated fresh starts: two independent decades of the same strategy
  let past = 0;
  for (let s = 1; s <= 2000; s++) { const x = D.path(0.5, s, 20); const b = D.underwater(x.subarray(0, 2521)), l = D.underwater(x.subarray(2520)); if (l.worst[l.worst.length - 1] > b.worst[2520]) past++; }
  truth("2,000 simulated strategies agree (sampling error about 1.1 points)", Math.abs(past / 2000 - 0.5) < 0.035, (past / 2000).toFixed(3));
}

console.log("-- one strategy, forty years");
{
  eq("7.5% a year", D.MU, 0.075, 1e-12);
  eq("Sharpe 0.5", D.MU / D.SIGMA, 0.5, 1e-12);
  const story = D.SEEDS.map((s) => { const x = D.path(0.5, s); const b = D.underwater(x.subarray(0, 2521)), l = D.underwater(x.subarray(2520)); const w = b.worst[2520]; let f = -1; for (let i = 0; i < l.dd.length; i++) if (l.dd[i] > w) { f = i / 252; break; } return { w, f }; });
  eq("the first path's backtest worst is 28.9%", pc1(D.lost(story[0].w)), 28.9, 0);
  truth("and live trading goes past it in its fifth year", story[0].f > 4 && story[0].f <= 5, story[0].f.toFixed(2));
  truth("some paths take more than a decade", story.filter((s) => s.f > 10).length >= 1);
  eq("one path doesn't get there in thirty years", story.filter((s) => s.f < 0).length, 1, 0);
  truth("more often than not, it happens", story.filter((s) => s.f >= 0).length >= 3);
  // the same days with no edge: deeper falls; at Sharpe 1, much of the climb early
  truth("with the Sharpe ratio at zero, every path's live worst is deeper", D.SEEDS.every((s) => { const l0 = D.underwater(D.path(0, s).subarray(2520)), l5 = D.underwater(D.path(0.5, s).subarray(2520)); return l0.worst[l0.worst.length - 1] > l5.worst[l5.worst.length - 1]; }));
  truth("at Sharpe 1, more of the typical climb comes in the first four years than at zero", lostMed(1, 4) / lostMed(1, 30) > 0.6 && D.median(0, 0.15, 4) / D.median(0, 0.15, 30) < 0.4, `${(lostMed(1, 4) / lostMed(1, 30)).toFixed(2)}`);
}

console.log("-- how fast the worst gets worse");
{
  eq("no edge: 15.8% in a year", pc1(lostMed(0, 1)), 15.8, 0);
  eq("42.0% in ten", pc1(lostMed(0, 10)), 42.0, 0);
  eq("66.4% in forty", pc1(lostMed(0, 40)), 66.4, 0);
  eq("Sharpe 0.5: 13.6% in a year", pc1(lostMed(0.5, 1)), 13.6, 0);
  eq("29.5% in ten", pc1(lostMed(0.5, 10)), 29.5, 0);
  eq("40.8% in forty", pc1(lostMed(0.5, 40)), 40.8, 0);
  eq("the unit of time for 0.5 is four years", 1 / 0.5 ** 2, 4, 0);
  eq("for 0.25 sixteen", 1 / 0.25 ** 2, 16, 0);
  eq("for 1 one", 1 / 1 ** 2, 1, 0);
  // the precomputed curves the figure draws agree with the module at their own grid
  truth("the drawn medians are the module's", P.YEARS.every((T, i) => Math.abs(P.MEDIANS[0.5][i] - D.median(D.MU, D.SIGMA, T)) < 1e-5 * Math.max(1, P.MEDIANS[0.5][i])));
}

console.log("-- live trading against the backtest");
{
  eq("within a year: 4.0%", pc1(beat(0.5, 10, 1)), 4.0, 0);
  eq("within five: 31.0%", pc1(beat(0.5, 10, 5)), 31.0, 0);
  eq("within ten: 50.0%", pc1(beat(0.5, 10, 10)), 50.0, 0);
  eq("within twenty: 68.4%", pc1(beat(0.5, 10, 20)), 68.4, 0);
  eq("within forty: 82.4%", pc1(beat(0.5, 10, 40)), 82.4, 0);
  for (const sr of [0.5, 0]) for (const B of P.BACK) eq(`50% where live has run as long as the backtest (Sharpe ${sr}, ${B} years)`, beat(sr, B, B), 0.5, 2e-4);
  eq("no edge, within five: 27.2%", pc1(beat(0, 10, 5)), 27.2, 0);
  eq("within twenty: 72.8%", pc1(beat(0, 10, 20)), 72.8, 0);
  eq("and the two add up to one", beat(0, 10, 5) + beat(0, 10, 20), 1, 2e-4);
  eq("the same mirror at other lengths (5 and 20 against a 10-year backtest, 2.5 and 10 against 5)", beat(0, 5, 2.5) + beat(0, 5, 10), 1, 2e-4);
  truth("with an edge there's no mirror", Math.abs(beat(0.5, 10, 5) + beat(0.5, 10, 20) - 1) > 0.003);
  eq("the module's direct integral agrees with the drawn one", D.beatChance(5, 10, D.MU, D.SIGMA), beat(0.5, 10, 5), 2e-4);
}

console.log("-- how deep is too deep");
{
  const rule = (T) => Math.round(1000 * D.lost(D.quantile(0.95, D.MU, D.SIGMA, T))) / 1000;
  const past = (thr, mu, T) => 1 - D.cdf(D.logOf(thr), mu, D.SIGMA, T);
  eq("five years: the line at 40.6%", pc1(rule(5)), 40.6, 0);
  eq("a working strategy goes past it 1 time in 20", pc1(past(rule(5), D.MU, 5)), 5.0, 0);
  eq("a dead one 24.1%", pc1(past(rule(5), 0, 5)), 24.1, 0);
  eq("three in four survive", r0(4 * (1 - past(rule(5), 0, 5))), 3, 0);
  eq("two years: 31.4%", pc1(rule(2)), 31.4, 0);
  eq("catches 15.1%", pc1(past(rule(2), 0, 2)), 15.1, 0);
  eq("ten years: 47.3%", pc1(rule(10)), 47.3, 0);
  eq("catches 35.4%", pc1(past(rule(10), 0, 10)), 35.4, 0);
  // the drawn densities integrate to one over the window, less what lies beyond 85%
  for (const T of [2, 5, 10]) for (const sr of [0.5, 0]) {
    const dd = P.DMAX / P.DENS[T][sr].length, area = P.DENS[T][sr].reduce((s, f) => s + f * dd, 0);
    eq(`the ${T}-year density at Sharpe ${sr} holds the chance of the window`, area, D.cdf(P.DMAX, sr * D.SIGMA, D.SIGMA, T) - D.cdf(1e-9, sr * D.SIGMA, D.SIGMA, T), 1e-6);
  }
}

console.log("-- climbing back");
{
  eq("a fall of 30% takes 4.8 years on average", r1(D.backYears(D.logOf(0.3), D.MU)), 4.8, 0);
  // Wald, by simulation of the climb, daily steps
  const g = normals(5); let s = 0; const K = 3000, d = D.logOf(0.3), dt = 1 / 252;
  for (let k = 0; k < K; k++) { let x = -d, t = 0; while (x < 0) { x += D.MU * dt + D.SIGMA * Math.sqrt(dt) * g(); t += dt; } s += t; }
  truth("3,000 simulated climbs take about that long", Math.abs(s / K - D.backYears(d, D.MU)) < 0.25, (s / K).toFixed(2));
  truth("whatever the volatility (the formula has none)", D.backYears(d, D.MU) === d / D.MU);
}

console.log("-- the US market");
{
  eq("from July 1926", Math.floor(M.DATES[0] / 100), 192607, 0);
  eq("to August 2026", Math.floor(M.DATES[M.N - 1] / 100), 202608, 0);
  eq("drift 9.8% a year", pc1(D.US_MU), 9.8, 0);
  eq("volatility 17.5%", pc1(D.US_SIGMA), 17.5, 0);
  const med = D.lost(D.median(D.US_MU, D.US_SIGMA, D.US_YEARS)), p99 = D.lost(D.quantile(0.99, D.US_MU, D.US_SIGMA, D.US_YEARS));
  eq("a random walk's typical worst in the century: 50.9%", pc1(med), 50.9, 0);
  eq("1 century in 100 past 74.1%", pc1(p99), 74.1, 0);
  const e = D.usEpisodes();
  eq("2007 to 2009: 54.6%", pc1(D.lost(e[1].depth)), 54.6, 0);
  truth("which is about what the random walk expects (between its 40th and 75th percentiles)", D.cdf(e[1].depth, D.US_MU, D.US_SIGMA, D.US_YEARS) > 0.4 && D.cdf(e[1].depth, D.US_MU, D.US_SIGMA, D.US_YEARS) < 0.75);
  truth("and it ran from 2007 to 2009", Math.floor(D.usDate(e[1].peak) / 1e4) === 2007 && Math.floor(D.usDate(e[1].low) / 1e4) === 2009);
  eq("the worst: 84.1%", pc1(D.lost(e[0].depth)), 84.1, 0);
  eq("from September 1929", Math.floor(D.usDate(e[0].peak) / 100), 192909, 0);
  eq("to July 1932", Math.floor(D.usDate(e[0].low) / 100), 193207, 0);
  eq("back in February 1945", Math.floor(D.usDate(e[0].back) / 100), 194502, 0);
  eq("a random walk falls that far in about 1 century in 2,400", Math.round(1 / (1 - D.cdf(e[0].depth, D.US_MU, D.US_SIGMA, D.US_YEARS)) / 100) * 100, 2400, 0);
  eq("drift alone from the 1932 low: 18.8 years", r1(D.backYears(e[0].depth, D.US_MU)), 18.8, 0);
  eq("it took 12.6", r1(D.yearsBetween(D.usDate(e[0].low), D.usDate(e[0].back))), 12.6, 0);
  eq("from the March 2009 low: 8.1", r1(D.backYears(e[1].depth, D.US_MU)), 8.1, 0);
  truth("and the low was in March 2009", Math.floor(D.usDate(e[1].low) / 100) === 200903);
  eq("it took 3.0", r1(D.yearsBetween(D.usDate(e[1].low), D.usDate(e[1].back))), 3.0, 0);
  // volatility during the fall, a calendar year
  const i0 = M.DATES.indexOf(19290903), i1 = M.DATES.indexOf(19320708);
  let s = 0, s2 = 0, k = 0; for (let i = i0 + 1; i <= i1; i++) { const r = Math.log1p(M.RET[i]); s += r; s2 += r * r; k++; }
  const vol = Math.sqrt(((s2 / k - (s / k) ** 2) * k) / D.yearsBetween(19290903, 19320708));
  eq("from 1929 to 1932 volatility ran at about twice its average", r0(vol / D.US_SIGMA), 2, 0);
}

console.log("-- costs");
{
  eq("ten years pin a Sharpe ratio down to a standard error of about 0.3", r1(1 / Math.sqrt(10)), 0.3, 0);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
