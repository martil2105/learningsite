// Every number on the page, from src/backtest.js and the pinned daily file
// (through src/data.js), in page order and rounded as the page rounds. First
// the provenance, then second routes to the binomial, the sliding quantiles
// and the variance identity, then the sentences.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { run } from "../scripts/build-data.mjs";
import * as M from "../src/market.js";
import * as B from "../src/backtest.js";
import { mulberry32 } from "../src/random.js";
import { PhiInv } from "../src/stats.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const here = (p) => new URL(p, import.meta.url);
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2);
const pc1 = (x) => r1(100 * x), pc2 = (x) => r2(100 * x), pc0 = (x) => r0(100 * x);

console.log("-- the data");
{
  const csv = readFileSync(here("../data/F-F_Research_Data_Factors_daily.csv"));
  const src = JSON.parse(readFileSync(here("../data/sources.json"), "utf8"))[0];
  truth("the pinned file's hash is the one recorded", createHash("sha256").update(csv).digest("hex") === src.sha256);
  truth("src/data.js is a fresh parse of the pinned file", run() === readFileSync(here("../src/data.js"), "utf8"));
  eq("the file ends on 31 August 2026", M.DATES[M.N - 1], 20260831, 0);
}

console.log("-- second routes");
{
  // the binomial against seeded right and optimistic models, sharing no code with it
  const u = mulberry32(7), Y = 200000;
  for (const p of [0.01, 0.02]) {
    let g = 0, y = 0, r = 0;
    for (let i = 0; i < Y; i++) { let k = 0; for (let d = 0; d < 250; d++) if (u() < p) k++; if (k >= 10) r++; else if (k >= 5) y++; else g++; }
    const z = B.zoneChances(p);
    truth(`200,000 simulated years at ${p * 100}% match the binomial's zones`, Math.abs(g / Y - z.green) < 0.004 && Math.abs(y / Y - z.yellow) < 0.004 && Math.abs(r / Y - z.red) < 0.002, `${(g / Y).toFixed(4)} ${(y / Y).toFixed(4)} ${(r / Y).toFixed(4)}`);
  }
  // the sliding quantiles against a brute-force sort on scattered days
  const L = M.RET.map((r) => -r);
  const hs = B.varSeries("history"), fh = B.varSeries("filtered"), rm = B.varSeries("riskmetrics");
  let worst = 0;
  for (let t = B.FIRST; t < M.N; t += 997) {
    const w = L.slice(t - 250, t).sort((a, b) => b - a);
    worst = Math.max(worst, Math.abs(w[2] - hs[t]));
    const a = Math.max(1, t - 1000), z = [];
    for (let j = a; j < t; j++) z.push(L[j] / B.SIGMA[j]);
    z.sort((x, y) => y - x);
    worst = Math.max(worst, Math.abs(B.SIGMA[t] * z[Math.floor(0.01 * z.length + 1e-9)] - fh[t]));
  }
  eq("historical simulation is the 3rd-largest of the last 250 losses, and the filtered model its own quantile (brute force)", worst, 0, 1e-15);
  // RiskMetrics' volatility from the recursion written out as a weighted sum
  let worstRm = 0;
  for (const t of [B.FIRST, 5000, 20000, M.N - 1]) {
    let v = Math.pow(0.94, t - 1) * M.RET[0] ** 2;
    for (let j = 1; j < t; j++) v += 0.06 * Math.pow(0.94, t - 1 - j) * M.RET[j] ** 2;
    worstRm = Math.max(worstRm, Math.abs(B.Z99 * Math.sqrt(v) - rm[t]) / rm[t]);
  }
  eq("RiskMetrics' value at risk is 2.326 times the weighted sum, from returns up to the day before", worstRm, 0, 1e-12);
  // the variance identity: from the exception series' correlations, and over every window
  const b = B.bunching("century");
  truth("the bracket from the correlations and from the windows agree within 1%", Math.abs(b.fromAcf / b.fromWindows - 1) < 0.01, `${b.fromAcf.toFixed(3)} ${b.fromWindows.toFixed(3)}`);
  truth("and the window figure is the one the shuffle figure shows", Math.abs(B.describe(B.tested("century")).factor - b.fromWindows) < 1e-12);
  // the identity holds for any series: a planted one with no memory gives a bracket near 1
  const u2 = mulberry32(11), I = new Uint8Array(26000).map(() => (u2() < 0.01 ? 1 : 0));
  truth("independent planted exceptions give a spread of about 1", Math.abs(B.describe(I).factor - 1) < 0.2, B.describe(I).factor.toFixed(3));
}

console.log("-- the opening and the guess card");
{
  eq("a right model expects 2.5 exceptions in 250 days", B.zoneChances(0.01).mean, 2.5, 1e-12);
  eq("green up to four", B.YELLOW, 5, 0);
  eq("red from ten", B.RED, 10, 0);
  eq("the multiplier is 3 in the green zone", 3 + B.plusFactor(4), 3, 0);
  eq("and 4 in the red", 3 + B.plusFactor(10), 4, 0);
  truth("each yellow count raises it a little", [5, 6, 7, 8, 9].every((k, i, a) => i === 0 || B.plusFactor(k) > B.plusFactor(a[i - 1])) && B.plusFactor(9) < 1);
  eq("the optimistic model is green in 43.9% of years", pc1(B.zoneChances(0.02).green), 43.9, 0);
  eq("a right model in 89.2%", pc1(B.zoneChances(0.01).green), 89.2, 0);
  truth("which is almost half", B.zoneChances(0.02).green > 0.4 && B.zoneChances(0.02).green < 0.5);
}

console.log("-- a count of rare events");
{
  eq("the standard deviation is 1.57", r2(B.zoneChances(0.01).sd), 1.57, 0);
  const z = B.zoneChances(0.01);
  eq("a right model is yellow in 10.8% of years", pc1(z.yellow), 10.8, 0);
  eq("about one year in nine", r0(1 / z.yellow), 9, 0);
  eq("and red in 0.03%", pc2(z.red), 0.03, 0);
  // the zones from the binomial: green while P(more than k) ≥ 5%, red once it's under 0.01%
  truth("4 is the last count a right model beats at least 5% of the time", B.upper(250, 0.01, 5) >= 0.05 && B.upper(250, 0.01, 6) < 0.05);
  truth("10 is the first count a right model beats less than 0.01% of the time", B.upper(250, 0.01, 11) < 1e-4 && B.upper(250, 0.01, 10) >= 1e-4);
  const t = B.zoneChances(0.02);
  eq("twice too many: green 43.9%", pc1(t.green), 43.9, 0);
  eq("yellow 53.1%", pc1(t.yellow), 53.1, 0);
  eq("red 3.0%", pc1(t.red), 3.0, 0);
  eq("average multiplier 3.32", r2(t.multiplier), 3.32, 0);
  eq("against a right model's 3.05", r2(z.multiplier), 3.05, 0);
  eq("about 9% more capital", pc0(t.multiplier / z.multiplier - 1), 9, 0);
  eq("on US losses since 1927 the 2% loss is 22% smaller than the 1% loss", pc0(1 - B.usLoss(0.98) / B.usLoss(0.99)), 22, 0);
  truth("those losses are counted over the tested days, which start in 1927", Math.floor(M.DATES[B.FIRST] / 1e4) === 1927);
  eq("so the optimistic model holds 15% less capital", pc0(1 - B.capitalRatio(0.02)), 15, 0);
  let falls = true;
  for (let p = 0.0125; p <= 0.04 + 1e-9; p += 0.0025) if (!(B.capitalRatio(p) < B.capitalRatio(p - 0.0025))) falls = false;
  truth("and the gap grows as the slider goes right", falls);
  eq("for normal losses about 4% less", pc0(1 - B.capitalRatioNormal(0.02)), 4, 0);
  truth("the slider's grid holds 1% and 2%", [0.01, 0.02].every((x) => Math.abs(((x - 0.005) / 0.0025) - Math.round((x - 0.005) / 0.0025)) < 1e-9));
}

console.log("-- Kupiec's test");
{
  eq("reject above 3.84", r2(B.CHI95), 3.84, 0);
  const [lo, hi] = B.kupiecAccept(250);
  truth("over 250 days it accepts 1 to 6", lo === 1 && hi === 6);
  truth("it rejects zero", B.kupiec(250, 0) > B.CHI95, B.kupiec(250, 0).toFixed(2));
  let rej = 0; for (let k = 0; k <= 250; k++) if (k < lo || k > hi) rej += B.pmf(250, 0.02, k);
  eq("and rejects the 2% model in 24% of years", pc0(rej), 24, 0);
}

console.log("-- how many days");
{
  eq("one-sided over 250 days: reject at six or more", B.critical(250), 6, 0);
  eq("which a right model reaches 4.1% of the time", pc1(B.upper(250, 0.01, 6)), 4.1, 0);
  eq("one year catches the 2% model 38% of the time", pc0(B.power(250, 0.02)), 38, 0);
  const d2 = B.daysToCatch(0.02, 0.8, 9000), d15 = B.daysToCatch(0.015, 0.8, 9000), d3 = B.daysToCatch(0.03, 0.8, 9000);
  eq("80% of the time from 1,015 days", d2, 1015, 0);
  eq("about four years", r0(d2 / 250), 4, 0);
  eq("at 1.5%, 3,295 days", d15, 3295, 0);
  eq("about 13 years", r0(d15 / 250), 13, 0);
  eq("at 3%, 340 days", d3, 340, 0);
  truth("and the page's search limit is well past each of them", Math.max(d2, d15, d3) < 9000 / 2);
  // the searches stopped where the curve really stays up: check far beyond
  truth("the power stays above 80% well beyond (2%, to 20,000 days)", B.daysToCatch(0.02, 0.8, 20000) === d2);
  const a2 = B.daysApprox(0.02), a15 = B.daysApprox(0.015);
  truth("half the gap takes three or four times the days, by the rule and exactly", a15 / a2 > 3 && a15 / a2 < 4 && d15 / d2 > 3 && d15 / d2 < 4, `${(a15 / a2).toFixed(2)} ${(d15 / d2).toFixed(2)}`);
  truth("the dot's readout: the jags are real (the curve dips under 80% after first reaching it)", (() => { for (let m = 300; m < d2; m++) if (B.power(m, 0.02) >= 0.8) return true; return false; })());
}

console.log("-- a century of real days");
{
  eq("26,000 tested days", B.BLOCKS * B.YEAR, 26000, 0);
  eq("in 104 blocks", B.BLOCKS, 104, 0);
  eq("the newest block ends on the last day", B.blockEnd(B.BLOCKS - 1), M.DATES[M.N - 1], 0);
  truth("the first starts in 1927", Math.floor(B.blockStart(0) / 1e4) === 1927);
  eq("the century's 1% loss is 3.09%", pc2(B.varSeries("century")[M.N - 1]), 3.09, 0);
  const c = B.summary("century");
  eq("exactly 260 exceptions", c.k, 260, 0);
  eq("1.00% of days", pc2(c.rate), 1.0, 0);
  eq("red 8 times", c.red, 8, 0);
  eq("yellow 10 times", c.yellow, 10, 0);
  eq("49 blocks with none", c.none, 49, 0);
  eq("a right model: red about once in 4,000 blocks", Math.round(1 / B.zoneChances(0.01).red / 1000) * 1000, 4000, 0);
  eq("and none in about 8 of 104", r0(104 * Math.pow(0.99, 250)), 8, 0);
  for (const [d, label] of [[19320601, "1931–32"], [20081231, "2008–09"]]) {
    const bk = B.blocks("century")[B.blockOf(d)];
    truth(`the ${label} preset shows a red block for the century model`, bk.zone === "red", `${bk.start}–${bk.end}: ${bk.k}`);
  }
  const h = B.summary("history"), rm = B.summary("riskmetrics"), f = B.summary("filtered");
  eq("historical simulation: 1.46%", pc2(h.rate), 1.46, 0);
  eq("3 red blocks", h.red, 3, 0);
  eq("30 yellow", h.yellow, 30, 0);
  eq("RiskMetrics: 2.13%", pc2(rm.rate), 2.13, 0);
  eq("red in 9", rm.red, 9, 0);
  eq("filtered: 1.07%", pc2(f.rate), 1.07, 0);
  eq("no red blocks", f.red, 0, 0);
  eq("15 yellow", f.yellow, 15, 0);
  eq("where a right model would have about 11", r0(104 * B.zoneChances(0.01).yellow), 11, 0);
}

console.log("-- bunches");
{
  const I = B.tested("century");
  let red = 0, noneSum = 0, noneMax = 0, k = 0;
  for (let s = 1; s <= 20; s++) { const d = B.describe(B.shuffled(I, s)); red = Math.max(red, d.red); noneSum += d.none; noneMax = Math.max(noneMax, d.none); k = Math.max(k, Math.abs(d.k - 260)); }
  eq("shuffled, the same 260 exceptions", k, 0, 0);
  eq("give no red blocks (the first 20 shuffles)", red, 0, 0);
  truth("and about as many empty ones as the binomial's 8.4", Math.abs(noneSum / 20 - 104 * Math.pow(0.99, 250)) < 1.5 && noneMax <= 12, `${(noneSum / 20).toFixed(1)}`);
  const b = B.bunching("century");
  eq("the bracket is 10.3 from the correlations", r1(b.fromAcf), 10.3, 0);
  eq("and 10.4 over every window", r1(b.fromWindows), 10.4, 0);
  eq("about ten times", r0(b.fromWindows), 10, 0);
  const t = Object.fromEntries(B.MODELS.map((m) => [m.key, B.timing(m.key)]));
  eq("the day after an exception: century 9.6%", pc1(t.century.p11), 9.6, 0);
  eq("historical simulation 9.2%", pc1(t.history.p11), 9.2, 0);
  eq("RiskMetrics 5.6%", pc1(t.riskmetrics.p11), 5.6, 0);
  eq("filtered 4.3%", pc1(t.filtered.p11), 4.3, 0);
  eq("four times too high", r0(t.filtered.p11 / 0.01), 4, 0);
  truth("Christoffersen's test rejects all four", B.MODELS.every((m) => t[m.key].lrInd > B.CHI95), B.MODELS.map((m) => t[m.key].lrInd.toFixed(1)).join(" "));
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
