// Every number on the page, from the pinned daily file (through src/data.js)
// and the GARCH fit, in page order and rounded as the page rounds. First the
// provenance and the fit's freshness, then a second route to the fit.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { run } from "../scripts/build-data.mjs";
import { run as precompute } from "../scripts/precompute.mjs";
import * as M from "../src/market.js";
import * as G from "../src/garch.js";
import { acf } from "../src/vr.js";
import { Phi } from "../src/stats.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const here = (p) => new URL(p, import.meta.url);
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2), r3 = (x) => +x.toFixed(3);
const I = (d) => M.dayIndex(d);

console.log("-- the data and the fit");
{
  const csv = readFileSync(here("../data/F-F_Research_Data_Factors_daily.csv"));
  const src = JSON.parse(readFileSync(here("../data/sources.json"), "utf8"))[0];
  truth("the pinned file's hash is the one recorded", createHash("sha256").update(csv).digest("hex") === src.sha256);
  truth("src/data.js is a fresh parse of the pinned file", run() === readFileSync(here("../src/data.js"), "utf8"));
  truth("src/precomputed.js is a fresh fit", precompute() === readFileSync(here("../src/precomputed.js"), "utf8"));
  // a second route: the fit's likelihood is at least as good as a grid around it
  const f0 = G.negLogLik(G.FIT.w, G.FIT.a, G.FIT.b);
  let best = Infinity;
  for (const da of [-0.01, -0.003, 0, 0.003, 0.01]) for (const db of [-0.01, -0.003, 0, 0.003, 0.01]) for (const dw of [0.9, 1, 1.1]) best = Math.min(best, G.negLogLik(G.FIT.w * dw, G.FIT.a + da, G.FIT.b + db));
  truth("no point on a grid around the fit has a higher likelihood", f0 <= best + 1e-6, `${f0.toFixed(3)} vs ${best.toFixed(3)}`);
  // and on simulated data the fit recovers the parameters it was simulated with
  const sim = Array.from(G.simulate({ w: 2e-6, a: 0.08, b: 0.9 }, 20000, 3));
  const m = sim.reduce((s, x) => s + x, 0) / sim.length, e = sim.map((x) => x - m);
  const q = G.fit(e);
  truth("simulated with α 0.08 and β 0.90, the fit recovers both within 0.03", Math.abs(q.a - 0.08) < 0.03 && Math.abs(q.b - 0.9) < 0.03, `${q.a.toFixed(3)} ${q.b.toFixed(3)}`);
}

console.log("-- the two days");
{
  const a = I(19871019), b = I(19550926);
  eq("1987 fell 17.4%", r1(100 * M.RET[a]), -17.4, 0);
  eq("1955 fell 6.5%", r1(100 * M.RET[b]), -6.5, 0);
  truth("26 September 1955 is the first trading day after Saturday 24 September", M.DATES[b - 1] === 19550923);
  eq("against the century's spread 1987 is 16.2", r1(-G.Z_RAW[a]), 16.2, 0);
  eq("and 1955 only 6.1", r1(-G.Z_RAW[b]), 6.1, 0);
  eq("against its forecast 1955 is 14.2", r1(-G.Z_GARCH[b]), 14.2, 0);
  eq("and 1987 8.5", r1(-G.Z_GARCH[a]), 8.5, 0);
  truth("1987 is the century's biggest fall", M.RET.every((r) => r >= M.RET[a]));
  truth("in the week before the crash the forecast was already above the long run", G.SD_T[a] > 1.5 * Math.sqrt(G.longRunVar(G.FIT)), (100 * G.SD_T[a]).toFixed(2));
  truth("and in September 1955 below it for months (every day of the 120 before)", Array.from({ length: 120 }, (_, j) => G.SD_T[b - 1 - j]).every((s) => s < Math.sqrt(G.longRunVar(G.FIT))));
}

console.log("-- sign and size");
{
  const A = (k) => G.ACF.find((p) => p.k === k);
  eq("returns: 0.05 at one day", r2(A(1).r), 0.05, 0);
    const out = G.ACF.filter((p) => p.k > 1 && Math.abs(p.r) > 2 * p.se);
  truth("no other lag gets further than 0.03 from zero", G.ACF.filter((p) => p.k > 1).every((p) => Math.abs(p.r) < 0.03));
  truth("the few that poke out of the band do so only slightly (at most 3 of 36 lags, each by under 0.007)", out.length <= 3 && out.every((p) => Math.abs(p.r) - 2 * p.se < 0.007), out.map((p) => p.k + ":" + (Math.abs(p.r) - 2 * p.se).toFixed(4)).join(","));
  truth("about as often as chance gives across 36 lags (5% of 36 is 1.8)", out.length <= 4);
  truth("the band allows for clustering: about twice the constant-spread 1/√N at one day", Math.abs(G.ACF[0].se * Math.sqrt(M.N) - 2.4) < 0.4, (G.ACF[0].se * Math.sqrt(M.N)).toFixed(2));
  // the robust standard error against simulated GARCH days with no memory in direction
  { const sims = []; for (let s = 0; s < 120; s++) { const x = Array.from(G.simulate(G.FIT, 4000, 900 + s)); sims.push(acf(x, 1)); }
    const m = sims.reduce((a, b) => a + b, 0) / sims.length, sd = Math.sqrt(sims.reduce((a, b) => a + (b - m) ** 2, 0) / (sims.length - 1));
    truth("in simulated GARCH days, the spread of the lag-1 return correlation is well above 1/√N", sd > 1.3 / Math.sqrt(4000), (sd * Math.sqrt(4000)).toFixed(2)); }
  truth("sizes sit above the band at every lag up to 500", G.ACF.every((p) => p.abs > 2 * p.se));
  eq("sizes: 0.30 at one day", r2(A(1).abs), 0.3, 0);
  eq("0.21 a month apart", r2(A(21).abs), 0.21, 0);
  eq("0.11 a year apart", r2(A(252).abs), 0.11, 0);
  
  eq("the ACF at one day by a direct sum", acf(G.ABS, 1), A(1).abs, 1e-12);
}

console.log("-- a forecast of the spread");
{
  eq("α is 0.10", r2(G.FIT.a), 0.1, 0);
  eq("β is 0.89", r2(G.FIT.b), 0.89, 0);
  eq("α + β is 0.989", r3(G.FIT.a + G.FIT.b), 0.989, 0);
  eq("keeps 89% of yesterday's", r0(100 * G.FIT.b), 89, 0);
  eq("adds 10% of the squared surprise", r0(100 * G.FIT.a), 10, 0);
  eq("the gap halves every 64 trading days", r0(G.halfLife(G.FIT)), 64, 0);
  // the forecast formula against iterating the recursion with expected squared surprises
  let h = 4 * G.longRunVar(G.FIT); const h0 = h;
  for (let k = 0; k < 64; k++) h = G.FIT.w + (G.FIT.a + G.FIT.b) * h;
  eq("iterating the recursion 64 days agrees with the formula", h, G.forecastVar(G.FIT, h0, 64), 1e-12);
  truth("and after 64 days about half the gap is left", Math.abs((h - G.longRunVar(G.FIT)) / (h0 - G.longRunVar(G.FIT)) - 0.5) < 0.01);
  eq("the long-run daily standard deviation is 1.11%", r2(100 * Math.sqrt(G.longRunVar(G.FIT))), 1.11, 0);
  eq("or 17.6% a year", r1(100 * Math.sqrt(252 * G.longRunVar(G.FIT))), 17.6, 0);
}

console.log("-- three years with the band");
{
  eq("after the crash the next day's forecast is 5.9%", r1(100 * G.SD_T[I(19871020)]), 5.9, 0);
  const [i0, i1] = M.span(1986, 1988);
  const sd = (y0, y1) => { let s = 0, c = 0; for (let i = i0; i < i1; i++) if (M.DATES[i] >= y0 && M.DATES[i] < y1) { s += G.SD_T[i]; c++; } return s / c; };
  truth("the band is narrow through 1986 and wider in the autumn of 1987", sd(19860101, 19870101) < sd(19870901, 19871017), `${(100 * sd(19860101, 19870101)).toFixed(2)} ${(100 * sd(19870901, 19871017)).toFixed(2)}`);
  truth("and shrinks back over the following months", G.SD_T[I(19880405)] < 0.5 * G.SD_T[I(19871020)]);
  const k = I(19631126);
  truth("the calm window's biggest day is 26 November 1963, the market's reopening after Kennedy's funeral", (() => { const [a, b] = M.span(1963, 1965); let mx = a; for (let i = a; i < b; i++) if (Math.abs(M.RET[i]) > Math.abs(M.RET[mx])) mx = i; return mx === k; })() && M.DATES[k - 1] === 19631122);
  eq("3.6 by the century's ruler", r1(G.Z_RAW[k]), 3.6, 0);
  eq("and 3.4 by its own", r1(G.Z_GARCH[k]), 3.4, 0);
  eq("across the century 5.1% of days land outside the band", r1(100 * G.Z_GARCH.filter((z) => Math.abs(z) > 2).length / M.N), 5.1, 0);
  eq("against 4.6% for a normal", r1(100 * 2 * Phi(-2)), 4.6, 0);
  const share = (a, b) => { const [p, q] = M.span(a, b); let o = 0; for (let i = p; i < q; i++) if (Math.abs(G.Z_GARCH[i]) > 2) o++; return o / (q - p); };
  truth("more escape it around 1987 and 2008", share(1986, 1988) > 0.06 && share(2007, 2009) > 0.07, `${share(1986, 1988).toFixed(3)} ${share(2007, 2009).toFixed(3)}`);
}

console.log("-- how much of the fat tail is clustering");
{
  const raw = G.ranked(G.Z_RAW, 10).map((i) => Math.floor(M.DATES[i] / 1e4));
  truth("by the century's ruler the top ten are from 1987, 1929, 1933, 2008 and 2020 (and 1931–32)", [1987, 1929, 1933, 2008, 2020].every((y) => raw.includes(y)) && raw.every((y) => [1987, 1929, 1931, 1932, 1933, 2008, 2020].includes(y)), raw.join(" "));
  const g = G.ranked(G.Z_GARCH, 10).map((i) => M.DATES[i]);
  eq("16 March 2020 fell 12.0%", r1(100 * M.RET[I(20200316)]), -12, 0);
  eq("only 2.3 of its forecast's standard deviations", r1(-G.Z_GARCH[I(20200316)]), 2.3, 0);
  truth("at the top: 26 September 1955, then 13 October 1989, then 26 June 1950, then 19 October 1987", g[0] === 19550926 && g[1] === 19891013 && g[2] === 19500626 && g[3] === 19871019, g.slice(0, 4).join(" "));
  truth("13 October 1989 was a Friday and 26 June 1950 the Monday after the Korean War began", new Date(Date.UTC(1989, 9, 13)).getUTCDay() === 5 && new Date(Date.UTC(1950, 5, 26)).getUTCDay() === 1);
  eq("kurtosis falls from 19.1", r1(G.kurtosis(G.Z_RAW)), 19.1, 0);
  eq("to 7.3", r1(G.kurtosis(G.Z_GARCH)), 7.3, 0);
  eq("days beyond five sd fall from 101", G.beyond(G.Z_RAW, 5), 101, 0);
  eq("to 26", G.beyond(G.Z_GARCH, 5), 26, 0);
  truth("where a normal expects almost none (under 0.02)", 2 * M.N * Phi(-5) < 0.02);
  // GARCH with normal shocks, many simulated centuries
  const counts = [];
  for (let s = 1; s <= 301; s++) { const x = Array.from(G.simulate(G.FIT, M.N, s)); const sd = Math.sqrt(x.reduce((a, v) => a + v * v, 0) / x.length); counts.push(x.filter((v) => Math.abs(v) >= 5 * sd).length); }
  counts.sort((a, b) => a - b);
  const med = counts[150];
  truth("the typical simulated century has about 41 days beyond five sd (38 to 44)", med >= 38 && med <= 44, String(med));
  truth("about two fifths of the 101", Math.abs(med / 101 - 0.4) < 0.05, (med / 101).toFixed(2));
}

console.log("-- what this costs you");
{
  const sq = G.E.map((e) => e * e);
  eq("GARCH says 0.40 at one day for squared returns", r2(G.rho2(G.FIT, 1)), 0.4, 0);
  eq("the data say 0.26", r2(acf(sq, 1)), 0.26, 0);
  eq("at 500 days GARCH says 0.002", r3(G.rho2(G.FIT, 500)), 0.002, 0);
  eq("and the data 0.021", r3(acf(sq, 500)), 0.021, 0);
  // the closed form for the squared-return autocorrelation against a long simulation
  const x = Array.from(G.simulate({ w: 2e-6, a: 0.08, b: 0.85 }, 400000, 9)), x2 = x.map((v) => v * v);
  truth("GARCH's formula for that correlation agrees with a long simulation (where the fourth moment exists)", Math.abs(acf(x2, 1) - G.rho2({ a: 0.08, b: 0.85 }, 1)) < 0.03 && Math.abs(acf(x2, 10) - G.rho2({ a: 0.08, b: 0.85 }, 10)) < 0.03, `${acf(x2, 1).toFixed(3)} vs ${G.rho2({ a: 0.08, b: 0.85 }, 1).toFixed(3)}`);
  let c = 0, s1 = 0, s2 = 0; const mA = G.ABS.reduce((s, v) => s + v, 0) / M.N;
  for (let i = 0; i < M.N - 1; i++) { c += G.E[i] * (G.ABS[i + 1] - mA); s1 += G.E[i] ** 2; s2 += (G.ABS[i + 1] - mA) ** 2; }
  eq("today's return against tomorrow's size: −0.09", r2(c / Math.sqrt(s1 * s2)), -0.09, 0);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
