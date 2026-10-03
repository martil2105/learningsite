// Every number the page states, from the pinned data and src/capm.js.
// First the data: hashes against data/sources.json, and src/data.js against a
// fresh parse of the pinned files. Then an independent parse of the CSV for a
// few raw values, a simulated CAPM world against the closed form, and the
// claims in page order.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { run } from "../scripts/build-data.mjs";
import * as C from "../src/capm.js";
import { normals } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100;
const here = (p) => new URL(p, import.meta.url);

console.log("-- the data");
{
  const sources = JSON.parse(readFileSync(here("../data/sources.json"), "utf8"));
  for (const s of sources) {
    const h = createHash("sha256").update(readFileSync(here(`../data/${s.file}`))).digest("hex");
    truth(`${s.file} matches its recorded hash`, h === s.sha256, h.slice(0, 16));
  }
  truth("src/data.js is a fresh parse of the pinned files", run() === readFileSync(here("../src/data.js"), "utf8"));
  truth("the vintage is the 202608 CRSP file", C.VINTAGE === "202608");
  eq("July 1963 to August 2026 is 758 months", C.MONTHS, 758, 0);
  // an independent parse: the first and last rows of the beta file and the factor file
  const beta = readFileSync(here("../data/Portfolios_Formed_on_BETA.csv"), "utf8").split(/\r?\n/);
  const first = beta.find((l) => l.startsWith("196307,")).split(",").map(Number);
  const fac = readFileSync(here("../data/F-F_Research_Data_Factors.csv"), "utf8").split(/\r?\n/);
  const f1 = fac.find((l) => l.startsWith("196307,")).split(",").map(Number);
  eq("July 1963, lowest decile, read straight from the file", C.excessOf(0)[0] + f1[4], first[6], 1e-12);
  eq("July 1963, highest decile", C.excessOf(9)[0] + f1[4], first[15], 1e-12);
  eq("July 1963, the market's excess return", C.MKT[0], f1[1], 1e-12);
}

console.log("-- a beta is a slope (US groups)");
const US = C.usDeciles();
{
  eq("the highest group was sorted at 2.66", r2(US[9].sorted), 2.66, 0);
  eq("and then had 1.60", r2(US[9].had), 1.6, 0);
  eq("the lowest was sorted at 0.22", r2(US[0].sorted), 0.22, 0);
  eq("and then had 0.59", r2(US[0].had), 0.59, 0);
  eq("so the shares in the intro move about 0.6 and 1.6 with the market", r1(US[0].had) * 10 + r1(US[9].had), 6 + 1.6, 1e-12);
  let lim = 0;
  for (let k = 0; k < 10; k++) lim = Math.max(lim, ...C.excessOf(k).map(Math.abs), ...C.MKT.map(Math.abs));
  truth("every month fits the scatter's ±35% window", lim < 35, lim.toFixed(2));
}

console.log("-- the CAPM's line");
{
  eq("the market earned 7.2% a year above bills", r1(C.usPremium()), 7.2, 0);
  eq("so a beta of 1.6 should earn 11.6%", r1(1.6 * C.usPremium()), 11.6, 0);
  eq("and a beta of 0.6 should earn 4.3%", r1(0.6 * C.usPremium()), 4.3, 0);
}

console.log("-- a test that flattens the line on its own");
{
  eq("the tenths' normal means add to zero", C.TENTH_MEANS.reduce((a, b) => a + b, 0), 0, 1e-12);
  eq("and are symmetric", C.TENTH_MEANS[0], -C.TENTH_MEANS[9], 1e-12);
  // a simulated standard normal, sorted into tenths
  const z = normals(5); const N = 1_000_000; const v = Array.from({ length: N }, () => z()).sort((a, b) => a - b);
  let worst = 0;
  for (let k = 0; k < 10; k++) { let s = 0; for (let i = (k * N) / 10; i < ((k + 1) * N) / 10; i++) s += v[i]; worst = Math.max(worst, Math.abs(s / (N / 10) - C.TENTH_MEANS[k])); }
  truth("the tenths' means match a million sorted normal draws (sampling tolerance)", worst < 0.01, worst.toFixed(4));
  const w = C.world();
  eq("the US spread was 2.44 when sorted", r2(US[9].sorted - US[0].sorted), 2.44, 0);
  eq("and 1.01 once formed", r2(US[9].had - US[0].had), 1.01, 0);
  eq("that's 41%", Math.round(100 * C.usSpreadRatio()), 41, 0);
  eq("the noise that matches it is 0.54", r2(C.NOISE_US), 0.54, 0);
  eq("and the world's reliability is the same 41%", w.rel, C.usSpreadRatio(), 1e-12);
  const ws = C.lineThrough(w.deciles.map((d) => d.sorted), w.deciles.map((d) => d.mean));
  const wh = C.lineThrough(w.deciles.map((d) => d.had), w.deciles.map((d) => d.mean));
  eq("in the world, the line through sorting betas has slope premium × reliability", ws.slope, C.usPremium() * w.rel, 1e-9);
  eq("which is 3.0 points", r1(ws.slope), 3.0, 0);
  eq("through the betas they then had it is the CAPM's line", wh.slope, C.usPremium(), 1e-9);
  eq("and crosses zero beta at zero", wh.intercept, 0, 1e-9);
  const w0 = C.world({ e: 0 });
  eq("with no noise the two rulers agree", C.lineThrough(w0.deciles.map((d) => d.sorted), w0.deciles.map((d) => d.mean)).slope, C.usPremium(), 1e-9);
  // the world, simulated: 400,000 shares with noisy beta estimates, sorted into tenths
  const g = normals(11); const M = 400_000;
  const sh = Array.from({ length: M }, () => { const b = 1 + C.S_TRUE * g(); return [b + C.NOISE_US * g(), b]; }).sort((a, b) => a[0] - b[0]);
  let wb = 0;
  for (let k = 0; k < 10; k++) { let s = 0, t = 0; for (let i = (k * M) / 10; i < ((k + 1) * M) / 10; i++) { s += sh[i][0]; t += sh[i][1]; } wb = Math.max(wb, Math.abs(s / (M / 10) - w.deciles[k].sorted), Math.abs(t / (M / 10) - w.deciles[k].had)); }
  truth("a simulated world of 400,000 shares gives the same sorted and true betas (sampling tolerance)", wb < 0.01, wb.toFixed(4));
  let inWin = true;
  for (let e = 0; e <= 0.8001; e += 0.01) for (const d of C.world({ e }).deciles) for (const x of [d.sorted, d.had]) if (x < -0.8 || x > 2.8 || d.mean < -5 || d.mean > 20) inWin = false;
  truth("every dot stays inside the lab's window at every noise on the slider", inWin);
}

console.log("-- the line in US data");
{
  const s = C.lineThrough(US.map((d) => d.sorted), US.map((d) => d.mean));
  const h = C.lineThrough(US.map((d) => d.had), US.map((d) => d.mean));
  eq("against the sorting betas the US line rises 1.3 points", r1(s.slope), 1.3, 0);
  eq("against the betas they then had, 3.4", r1(h.slope), 3.4, 0);
  eq("crossing zero beta at 4.6%", r1(h.intercept), 4.6, 0);
  const fm = C.famaMacBeth();
  eq("Fama and MacBeth's slope is the same line", fm.slope, h.slope, 1e-9);
  eq("its standard error is 3.0", r1(fm.slopeSE), 3.0, 0);
  truth("so it can't rule out 7.2 on its own (gap under two standard errors)", Math.abs(fm.tGap) < 2, fm.tGap.toFixed(2));
  const a = C.famaMacBeth(196307, 199412), b = C.famaMacBeth(199501, 202608);
  eq("up to 1994 the slope is 1.2", r1(a.slope), 1.2, 0);
  eq("since 1995 it is 5.0", r1(b.slope), 5.0, 0);
  for (const s of US) truth(`${s.label} fits the US chart's window`, s.sorted > -0.8 && s.sorted < 2.8 && s.mean > -5 && s.mean < 20);
}

console.log("-- the halves' premiums");
{
  // straight from the data module, not through the article's helpers
  const D = (await import("../src/data.js")).default;
  const prem = (lo, hi) => { const v = D.mkt.filter((_, t) => D.dates[t] >= lo && D.dates[t] <= hi); return (12 * v.reduce((x, y) => x + y, 0)) / v.length; };
  eq("the market premium up to 1994 is 4.8", r1(prem(196307, 199412)), 4.8, 0);
  eq("and since 1995, 9.6", r1(prem(199501, 202608)), 9.6, 0);
}

console.log("-- the conclusion and the costs");
{
  const h = C.lineThrough(US.map((d) => d.had), US.map((d) => d.mean));
  eq("a line through sorting betas comes out at about two fifths of its true slope", +((US[9].had - US[0].had) / (US[9].sorted - US[0].sorted)).toFixed(1), 0.4, 0);
  eq("the US line is about half as steep as the CAPM says", +(h.slope / C.usPremium()).toFixed(1), 0.5, 0);
  // equal-weighted groups, straight from the pinned beta file (the page draws only value-weighted ones)
  const { frenchBlock } = await import("../scripts/data-lib.mjs");
  const raw = readFileSync(here("../data/Portfolios_Formed_on_BETA.csv"), "utf8");
  const fac = frenchBlock(readFileSync(here("../data/F-F_Research_Data_Factors.csv"), "utf8"), /^This file/);
  const F = new Map(fac.rows.map((r) => [r[0], r]));
  const slopeOf = (re) => {
    const b = frenchBlock(raw, re), off = b.cols.findIndex((c) => /Lo 10/.test(c)) + 1;
    const rows = b.rows.filter((r) => r[0] >= 196307 && r[0] <= 202608), m = rows.map((r) => F.get(r[0])[1]);
    const betas = [], means = [];
    for (let k = 0; k < 10; k++) { const y = rows.map((r) => r[off + k] - F.get(r[0])[4]); betas.push(C.lineThrough(m, y).slope); means.push((12 * y.reduce((p, q) => p + q, 0)) / y.length); }
    return C.lineThrough(betas, means).slope;
  };
  eq("the value-weighted line rebuilt from the raw file is the page's", slopeOf(/Value Weighted Returns -- Monthly/), h.slope, 1e-9);
  truth("equal-weighted groups give a flatter line still", slopeOf(/Equal Weighted Returns -- Monthly/) < h.slope, slopeOf(/Equal Weighted Returns -- Monthly/).toFixed(2));
}

console.log("-- low beta, high alpha");
{
  eq("the lowest group's alpha is +2.5%", r1(US[0].alpha), 2.5, 0);
  eq("the highest group's is −2.9%", r1(US[9].alpha), -2.9, 0);
  const L = C.lowMinusHigh();
  eq("low minus high has a beta of about −1", r1(L.beta), -1.0, 0);
  eq("and an alpha of 5.4%", r1(L.alpha), 5.4, 0);
  eq("with a t-statistic of 2.2", r1(L.t), 2.2, 0);
  eq("its alpha is the difference of the two groups' alphas", L.alpha, US[0].alpha - US[9].alpha, 1e-9);
  let win = true;
  for (const d of US) if (d.alpha + 2 * d.alphaSE > 6 || d.alpha - 2 * d.alphaSE < -8) win = false;
  truth("every whisker fits the alpha chart's −8% to 6% window", win);
}

console.log(`\n${n - fails} of ${n} checks pass`);
if (fails) process.exit(1);
