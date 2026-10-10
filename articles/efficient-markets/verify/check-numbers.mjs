// Every number on the page, from the pinned data (through src/data.js) and the
// simulated worlds, in page order and rounded as the page rounds (toFixed).
// First: src/data.js is a fresh parse of the pinned file, and an independent
// parse of the CSV agrees with it. Then the identities, then the claims.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { run } from "../scripts/build-data.mjs";
import * as M from "../src/market.js";
import * as V from "../src/vr.js";
import * as Hh from "../src/history.js";
import * as W from "../src/worlds.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const here = (p) => new URL(p, import.meta.url);
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2), r3 = (x) => +x.toFixed(3);
const yr = (x) => Math.exp(252 * x) - 1;

console.log("-- the data");
{
  const csv = readFileSync(here("../data/F-F_Research_Data_Factors_daily.csv"));
  const src = JSON.parse(readFileSync(here("../data/sources.json"), "utf8"))[0];
  truth("the pinned file's hash is the one recorded", createHash("sha256").update(csv).digest("hex") === src.sha256);
  truth("src/data.js is a fresh parse of the pinned file", run() === readFileSync(here("../src/data.js"), "utf8"));
  // an independent parse: floats, not integers, and dates read directly
  const rows = csv.toString("utf8").split(/\r?\n/).filter((l) => /^\s*\d{8}\s*,/.test(l)).map((l) => l.split(",").map((s) => s.trim()));
  eq("as many days as the file has", M.N, rows.length, 0);
  truth("every decoded date matches the file", rows.every((r, i) => +r[0] === M.DATES[i]));
  let worst = 0; rows.forEach((r, i) => { worst = Math.max(worst, Math.abs((+r[1] + +r[4]) / 100 - M.RET[i])); });
  truth("every total return matches Mkt-RF + RF to rounding", worst < 1e-12, String(worst));
  eq("the vintage is 202608", +M.VINTAGE, 202608, 0);
  eq("19 October 1987 was a fall of 17.41%", M.RET[M.dayIndex(19871019)], -0.1741, 1e-12);
}

console.log("-- the opening rule");
{
  const a = Hh.rule(1962, 1986), b = Hh.rule(2000, 2026);
  eq("1962 to 1986: the rule earned 30.5% a year on paper", r1(100 * a.rule), 30.5, 0);
  eq("holding the market earned 9.5%", r1(100 * a.market), 9.5, 0);
  eq("three times as well", r0(a.rule / a.market), 3, 0);
  truth("while sitting out almost half the days", a.inShare > 0.5 && a.inShare < 0.6, a.inShare.toFixed(3));
  eq("2000 to 2026: 0.3% a year", r1(100 * b.rule), 0.3, 0);
  eq("against 8.6% for the market", r1(100 * b.market), 8.6, 0);
  // the rule by brute force with a separate loop over the decoded series
  let w = 1; const [i0, i1] = M.span(1962, 1986); for (let i = i0 + 1; i < i1; i++) w *= M.RET[i - 1] > 0 ? 1 + M.RET[i] : 1 + M.RF[i];
  eq("a second loop over the days gives the same 30.5%", Math.pow(w, 252 / (i1 - i0 - 1)) - 1, a.rule, 1e-12);
}

console.log("-- the five-year windows");
{
  const S = Hh.WINDOW_STATS;
  eq("twenty windows from 1927 to 2026", S.length, 20, 0);
  const w67 = S.find((s) => s.a === 1967);
  eq("1967 to 1971: lag-1 autocorrelation 0.33", r2(w67.rho1), 0.33, 0);
  truth("the 1940s to the 1980s sit above the band", S.filter((s) => s.a >= 1942 && s.a <= 1982).every((s) => s.rho1 > 2 * s.se));
  truth("since 2002 every window is near zero or below (under 0.01)", S.filter((s) => s.a >= 2002).every((s) => s.rho1 < 0.01), S.filter((s) => s.a >= 2002).map((s) => s.rho1.toFixed(3)).join(" "));
  // the rule did best when the autocorrelation was highest
  let c = 0, mr = 0, mu = 0; S.forEach((s) => { mr += s.rho1; mu += s.rule - s.market; }); mr /= 20; mu /= 20;
  let sxy = 0, sxx = 0, syy = 0; S.forEach((s) => { sxy += (s.rho1 - mr) * (s.rule - s.market - mu); sxx += (s.rho1 - mr) ** 2; syy += (s.rule - s.market - mu) ** 2; });
  truth("the rule's lead over the market follows the autocorrelation (correlation above 0.8)", sxy / Math.sqrt(sxx * syy) > 0.8, (sxy / Math.sqrt(sxx * syy)).toFixed(2));
  const best = S.reduce((a, b) => (b.rule - b.market > a.rule - a.market ? b : a));
  truth("its biggest lead is in a window with one of the three highest autocorrelations", [...S].sort((a, b) => b.rho1 - a.rho1).slice(0, 3).includes(best), `${best.a}`);
  truth("and after 2002 it trails the market in every window", S.filter((s) => s.a >= 2002).every((s) => s.rule < s.market));
  eq("2017 to 2021 reads −0.23", r2(S.find((s) => s.a === 2017).rho1), -0.23, 0);
}

console.log("-- the variance ratio");
{
  // the identity, on a series whose autocorrelations are known: the stale recursion
  for (const pi of [0.1, 0.3, 0.6]) for (const q of [2, 5, 21]) {
    let direct = 0; // Var(q-sum)/(q Var) from the autocovariances of an AR(1), summed directly
    for (let i = 0; i < q; i++) for (let j = 0; j < q; j++) direct += Math.pow(pi, Math.abs(i - j));
    eq(`VR(${q}) = 1 + 2Σ(1 − k/q)ρ_k for ρ_k = ${pi}^k`, W.vrStale(q, pi), direct / q, 1e-12);
  }
  eq("the bounce's closed form agrees with the sum", W.vrBounce(21, 0.01), W.vrBounceDirect(21, 0.01), 1e-12);
  // the sample ratio against the sum of sample autocorrelations, on real data
  const [i0, i1] = M.span(1962, 1986);
  eq("on real data the two forms agree to within 0.01", V.vr(M.LOGRET, 21, i0, i1), V.vrFromRho((k) => V.acf(M.LOGRET, k, i0, i1), 21), 0.01);
  // the standard error against simulated random walks
  const g = (await import("../src/random.js")).normals(5); const sims = [];
  for (let s = 0; s < 400; s++) { const x = Array.from({ length: 1260 }, () => g()); sims.push(V.vr(x, 21)); }
  const m = sims.reduce((a, b) => a + b, 0) / 400, sd = Math.sqrt(sims.reduce((a, b) => a + (b - m) ** 2, 0) / 399);
  truth("400 simulated random walks of 1,260 days have the formula's spread (within 15%)", Math.abs(sd / V.seVR(21, 1260) - 1) < 0.15, `${sd.toFixed(4)} vs ${V.seVR(21, 1260).toFixed(4)}`);
  const z62 = Hh.zScores(21, 1962, 1986), z00 = Hh.zScores(21, 2000, 2026);
  eq("1962 to 1986: VR(21) 1.58", r2(z62.vr), 1.58, 0);
  eq("nine standard errors above a random walk", r0(z62.z), 9, 0);
  eq("2000 to 2026: 0.78", r2(z00.vr), 0.78, 0);
  truth("below 1 by more than two standard errors", z00.z < -2, z00.z.toFixed(2));
}

console.log("-- the two worlds");
{
  eq("the true value moves 0.04% a day on average", W.MU, 0.0004, 0);
  eq("with a volatility of 1%", W.SIGMA, 0.01, 0);
  eq("stale, 30% idle: lag-1 autocorrelation 0.3", W.rhoStale(1, 0.3), 0.3, 1e-15);
  eq("and VR(21) 1.80", r2(W.vrStale(21, 0.3)), 1.8, 0);
  eq("bounce, 1% spread, 1% volatility: −0.17", r2(W.rhoBounce(1, 0.01)), -0.17, 0);
  eq("and VR(21) 0.68", r2(W.vrBounce(21, 0.01)), 0.68, 0);
  // long simulations against the formulas
  const ls = Array.from(W.staleWorld(252 * 400, 0.3, 101).recorded), lb = Array.from(W.bounceWorld(252 * 400, 0.01, 102).recorded);
  truth("400 simulated years of stale prices have ρ₁ ≈ 0.3 and ρ₂ ≈ 0.09", Math.abs(V.acf(ls, 1) - 0.3) < 0.01 && Math.abs(V.acf(ls, 2) - 0.09) < 0.01, `${V.acf(ls, 1).toFixed(3)} ${V.acf(ls, 2).toFixed(3)}`);
  truth("and VR(21) near the formula", Math.abs(V.vr(ls, 21) - W.vrStale(21, 0.3)) < 0.06, V.vr(ls, 21).toFixed(3));
  truth("400 years of bounce have ρ₁ ≈ −0.167 and ρ₂ ≈ 0", Math.abs(V.acf(lb, 1) + 1 / 6) < 0.01 && Math.abs(V.acf(lb, 2)) < 0.01, `${V.acf(lb, 1).toFixed(3)} ${V.acf(lb, 2).toFixed(3)}`);
  const m = V.mean(lb); let c1 = 0; for (let i = 1; i < lb.length; i++) c1 += (lb[i] - m) * (lb[i - 1] - m); c1 /= lb.length;
  eq("Roll's formula recovers the 1% spread from prices alone", W.rollSpread(c1), 0.01, 0.03);
  // the lab's own 25 years are representative
  const s25 = Array.from(W.staleWorld(W.LAB_DAYS, 0.3, W.LAB_SEED.stale).recorded), b25 = Array.from(W.bounceWorld(W.LAB_DAYS, 0.01, W.LAB_SEED.bounce).recorded);
  truth("the lab's stale years: ρ₁ within 0.02 of 0.3, VR(21) within 0.1 of 1.80", Math.abs(V.acf(s25, 1) - 0.3) < 0.02 && Math.abs(V.vr(s25, 21) - 1.8) < 0.1, `${V.acf(s25, 1).toFixed(3)} ${V.vr(s25, 21).toFixed(3)}`);
  truth("the lab's bounce years: ρ₁ within 0.02, VR(21) within 0.05", Math.abs(V.acf(b25, 1) - W.rhoBounce(1, 0.01)) < 0.02 && Math.abs(V.vr(b25, 21) - W.vrBounce(21, 0.01)) < 0.05, `${V.acf(b25, 1).toFixed(3)} ${V.vr(b25, 21).toFixed(3)}`);
  const m25 = V.mean(b25); let c25 = 0; for (let i = 1; i < b25.length; i++) c25 += (b25[i] - m25) * (b25[i - 1] - m25); c25 /= b25.length;
  truth("and Roll's spread from them is within 0.1 points of 1%", Math.abs(W.rollSpread(c25) - 0.01) < 0.001, (100 * W.rollSpread(c25)).toFixed(2));
}

console.log("-- the profit that isn't there");
{
  const ts = W.ruleTheoryStale(0.3), tb = W.ruleTheoryBounce(0.01);
  eq("on paper: about 31% a year with stale prices (long run)", r0(100 * yr(ts.paper)), 31, 0);
  eq("and about 30% with the bounce", r0(100 * yr(tb.paper)), 30, 0);
  eq("for real, about 5% in both before costs", r0(100 * yr(ts.real)), 5, 0);
  eq("(the bounce)", r0(100 * yr(tb.realBeforeCost)), 5, 0);
  eq("which is the market's own return on the days we're in", ts.real, W.MU * ts.held, 1e-15);
  truth("for about half the days", Math.abs(ts.held - 0.5) < 0.05 && Math.abs(tb.held - 0.5) < 0.05, `${ts.held.toFixed(3)} ${tb.held.toFixed(3)}`);
  // the closed forms against 400 simulated years
  const rs = W.runRule(W.staleWorld(252 * 400, 0.3, 103), "stale"), rb = W.runRule(W.bounceWorld(252 * 400, 0.01, 104), "bounce");
  truth("400 simulated years agree with the stale formulas (within 1.5 points)", Math.abs(rs.paper - yr(ts.paper)) < 0.015 && Math.abs(rs.real - yr(ts.real)) < 0.015, `${rs.paper.toFixed(3)} ${rs.real.toFixed(3)}`);
  truth("and with the bounce formulas", Math.abs(rb.paper - yr(tb.paper)) < 0.015 && Math.abs(rb.realBeforeCost - yr(tb.realBeforeCost)) < 0.015, `${rb.paper.toFixed(3)} ${rb.realBeforeCost.toFixed(3)}`);
  eq("paying the spread turns the bounce rule into a loss of about 48% a year", r0(-100 * rb.real), 48, 0);
  // the figure's 25 years
  const fs = W.runRule(W.staleWorld(W.LAB_DAYS, 0.3, W.LAB_SEED.stale), "stale"), fb = W.runRule(W.bounceWorld(W.LAB_DAYS, 0.01, W.LAB_SEED.bounce), "bounce");
  truth("the figure's stale run is within 2 points of the long-run paper and real returns", Math.abs(fs.paper - yr(ts.paper)) < 0.02 && Math.abs(fs.real - yr(ts.real)) < 0.02, `${fs.paper.toFixed(3)} ${fs.real.toFixed(3)}`);
  truth("and the bounce run too", Math.abs(fb.paper - yr(tb.paper)) < 0.02 && Math.abs(fb.realBeforeCost - yr(tb.realBeforeCost)) < 0.02 && Math.abs(fb.real + 0.48) < 0.02, `${fb.paper.toFixed(3)} ${fb.realBeforeCost.toFixed(3)} ${fb.real.toFixed(3)}`);
}

console.log("-- what this costs you");
{
  const z62 = Hh.zScores(21, 1962, 1986), z00 = Hh.zScores(21, 2000, 2026);
  eq("with changing volatility 1962 to 1986 is 6.5 standard errors", r1(z62.zRobust), 6.5, 0);
  eq("instead of 9.1", r1(z62.z), 9.1, 0);
  eq("since 2000 it's 1.7", r1(-z00.zRobust), 1.7, 0);
  eq("instead of 3.5", r1(-z00.z), 3.5, 0);
  truth("which no longer clears two", Math.abs(z00.zRobust) < 2);
  const [i0, i1] = M.span(2017, 2021); const x = []; for (let i = i0; i < i1; i++) { if (M.DATES[i] >= 20200220 && M.DATES[i] <= 20200430) continue; x.push(M.LOGRET[i]); }
  eq("2017 to 2021 without late February to April 2020: −0.06", r2(V.acf(x, 1)), -0.06, 0);
  eq("and those are about ten weeks", r0((i1 - i0 - x.length) / 5), 10, 0);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
