// Every number the page states, from the pinned data and src/premium.js.
// First the data: hashes against data/sources.json, and src/data.js against a
// fresh parse of the pinned files. Then an independent parse of both CSVs for
// a few raw values, a bootstrap standard error against the formula, the
// identities the prose leans on, and the claims in page order.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { run } from "../scripts/build-data.mjs";
import * as P from "../src/premium.js";
import { mulberry32 } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
// rounded the way the page rounds (toFixed), so a value on a half rounds the same here as in a readout
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1);
const here = (p) => new URL(p, import.meta.url);

console.log("-- the data");
{
  const sources = JSON.parse(readFileSync(here("../data/sources.json"), "utf8"));
  for (const s of sources) {
    const h = createHash("sha256").update(readFileSync(here(`../data/${s.file}`))).digest("hex");
    truth(`${s.file} matches its recorded hash`, h === s.sha256, h.slice(0, 16));
  }
  truth("src/data.js is a fresh parse of the pinned files", run() === readFileSync(here("../src/data.js"), "utf8"));
  truth("the vintage is the 202608 CRSP file", P.VINTAGE === "202608");
  eq("the yearly record starts in 1927", P.FIRST_YEAR, 1927, 0);
  eq("and ends in 2025", P.LAST_YEAR, 2025, 0);
  // an independent parse: the annual block's first and last rows, straight from the text
  const ff = readFileSync(here("../data/F-F_Research_Data_Factors.csv"), "utf8").split(/\r?\n/);
  const at = ff.findIndex((l) => /Annual Factors/.test(l));
  const row = (y) => ff.slice(at).find((l) => l.trim().startsWith(y + ",")).split(",").map(Number);
  eq("1927's premium, read straight from the annual block", P.PREMIUM[0], row(1927)[1], 1e-12);
  eq("2025's premium", P.PREMIUM[P.PREMIUM.length - 1], row(2025)[1], 1e-12);
  // and Shiller's: January 1951 and January 2001, for the ratio quoted in the prose
  const sh = readFileSync(here("../data/shiller-sp500.csv"), "utf8").split(/\r?\n/);
  const jan = (y) => sh.find((l) => l.startsWith(`${y}-01-01,`)).split(",").map(Number);
  eq("January 1951's price per dollar of dividends, from the raw file", P.split(1951, 2000).pdStart, jan(1951)[1] / jan(1951)[2], 1e-12);
  eq("January 2001's", P.split(1951, 2000).pdEnd, jan(2001)[1] / jan(2001)[2], 1e-12);
  eq("Shiller's record starts in 1871", P.SHILLER_FIRST, 1871, 0);
}

console.log("-- a century of premiums");
const ALL = P.band();
{
  eq("99 years", ALL.n, 99, 0);
  eq("the average premium is 8.9%", r1(ALL.mean), 8.9, 0);
  eq("the yearly standard deviation is 20.1 points", r1(P.sd(P.PREMIUM)), 20.1, 0);
  eq("the standard error is 2.0 points", r1(ALL.se), 2.0, 0);
  eq("which is the standard deviation over root 99", ALL.se, P.sd(P.PREMIUM) / Math.sqrt(99), 1e-12);
  eq("the band runs from 4.9%", r1(ALL.lo), 4.9, 0);
  eq("to 12.8%", r1(ALL.hi), 12.8, 0);
  eq("a range about 8 points wide", r0(ALL.hi - ALL.lo), 8, 0);
  truth("both of the intro's premiums, 5% and 10%, sit inside the band", ALL.lo < 5 && 10 < ALL.hi);
  // a bootstrap: resample the 99 years, 20,000 times
  const rnd = mulberry32(7), B = 20000, means = [];
  for (let b = 0; b < B; b++) { let s = 0; for (let i = 0; i < 99; i++) s += P.PREMIUM[Math.floor(rnd() * 99)]; means.push(s / 99); }
  const boot = P.sd(means), want = ALL.se * Math.sqrt(98 / 99);
  truth("a bootstrap of the years gives the same standard error (within 3%)", Math.abs(boot / want - 1) < 0.03, boot.toFixed(3) + " vs " + want.toFixed(3));
  const a = P.band(1927, 1975), b = P.band(1976, 2025);
  eq("1927 to 1975 averaged 8.5%", r1(a.mean), 8.5, 0);
  eq("with a band from 1.9%", r1(a.lo), 1.9, 0);
  eq("to 15.0%", r1(a.hi), 15.0, 0);
  eq("1976 to 2025 averaged 9.3%", r1(b.mean), 9.3, 0);
  eq("with a band from 4.7%", r1(b.lo), 4.7, 0);
  eq("to 13.8%", r1(b.hi), 13.8, 0);
  truth("each half is less sure than the whole", a.se > ALL.se && b.se > ALL.se);
  truth("every bar fits the chart's −50% to 60% window", Math.min(...P.PREMIUM) > -50 && Math.max(...P.PREMIUM) < 60);
  let win = true;
  for (let lo = 1927; lo <= 2006; lo++) for (let hi = lo + 19; hi <= 2025; hi++) for (const f of ["yearly", "monthly"]) { const x = P.band(lo, hi, f); if (x.mean < -10 || x.mean > 30) win = false; }
  truth("every average the sliders can reach fits the ruler's −10% to 30%", win);
}

console.log("-- more often isn't more precise");
{
  const m = P.band(1927, 2025, "monthly");
  eq("99 years are 1,188 months", m.n, 1188, 0);
  eq("monthly returns average 8.3%", r1(m.mean), 8.3, 0);
  eq("with a standard error of 1.9 points", r1(m.se), 1.9, 0);
  eq("the guess card's imagined error is 0.6", r1(ALL.se / Math.sqrt(12)), 0.6, 0);
  // twelve times the monthly average is the sum of the months over the years
  const D = (await import("../src/data.js")).default;
  const v = D.monthly.mktrf.filter((_, i) => D.monthly.date[i] >= 192701 && D.monthly.date[i] <= 202512);
  eq("12 × the average month is the sum of months over T", m.mean, v.reduce((x, y) => x + y, 0) / 99, 1e-12);
  let together = true, wider = true;
  for (let k = 20; k <= 99; k++) {
    const y = P.band(2026 - k, 2025), mo = P.band(2026 - k, 2025, "monthly");
    if (mo.se / y.se < 0.8 || mo.se / y.se > 1.0) together = false;
    if (mo.se < 2.5 * (y.se / Math.sqrt(12))) wider = false;
  }
  truth("at every slider length the monthly error is 80% to 100% of the yearly one", together);
  truth("and at least two and a half times the imagined one", wider);
}

console.log("-- thirty years at a time");
{
  const e30 = P.extremes(30), e20 = P.extremes(20), e50 = P.extremes(50);
  eq("the lowest thirty-year average is 4.7%", r1(e30.lo.mean), 4.7, 0);
  truth("from 1965 to 1994", e30.lo.start === 1965 && e30.lo.end === 1994);
  eq("the highest is 14.2%", r1(e30.hi.mean), 14.2, 0);
  truth("from 1932 to 1961", e30.hi.start === 1932 && e30.hi.end === 1961);
  eq("twenty-year windows run from 2.5%", r1(e20.lo.mean), 2.5, 0);
  eq("to 16.1%", r1(e20.hi.mean), 16.1, 0);
  eq("fifty-year windows from 5.4%", r1(e50.lo.mean), 5.4, 0);
  eq("to 10.0%", r1(e50.hi.mean), 10.0, 0);
  truth("longer windows narrow the range", e20.hi.mean - e20.lo.mean > e30.hi.mean - e30.lo.mean && e30.hi.mean - e30.lo.mean > e50.hi.mean - e50.lo.mean);
  let fit = true;
  for (const w of [20, 30, 50]) for (const r of P.rolling(w)) if (r.mean - P.Z95 * r.se < -10 || r.mean + P.Z95 * r.se > 30) fit = false;
  truth("every window's band fits the chart's −10% to 30%", fit);
}

console.log("-- what dividends say");
{
  const S = Object.fromEntries(P.PERIODS.map((p) => [p.id, P.split(p.from, p.to)]));
  for (const [id, s] of Object.entries(S)) {
    eq(`${id}: realised minus dividends is price growth minus dividend growth`, s.realised - s.dividends, s.gP - s.gD, 1e-12);
    eq(`${id}: realised is dividend yield plus price growth`, s.realised, s.dp + s.gP, 1e-12);
    // compounded, the real price grew by the real dividend growth times the rise in P/D
    const r = P.SHILLER.filter((x) => x.year >= s.from && x.year <= s.to);
    const ratio = r.reduce((acc, x) => acc * (1 + x.gP / 100) / (1 + x.gD / 100), 1);
    eq(`${id}: compounded, prices outgrew dividends by the rise in P/D`, ratio, P.pdRise(s), 1e-10);
  }
  eq("1871 to 1950 is 80 years", S.early.n, 80, 0);
  eq("realised 8.1%", r1(S.early.realised), 8.1, 0);
  eq("against 7.6% from dividends", r1(S.early.dividends), 7.6, 0);
  eq("1951 to 2000: realised 9.3%", r1(S.fifty.realised), 9.3, 0);
  eq("dividends support 4.6%", r1(S.fifty.dividends), 4.6, 0);
  eq("the price of a dollar of dividends rose from 14", r0(S.fifty.pdStart), 14, 0);
  eq("to 83", r0(S.fifty.pdEnd), 83, 0);
  eq("the dividend estimate's standard error is 0.6", r1(S.fifty.dividendsSE), 0.6, 0);
  eq("against 2.2 for realised returns", r1(S.fifty.realisedSE), 2.2, 0);
  const sh = P.SHILLER.filter((x) => x.year >= 1951 && x.year <= 2000);
  truth("dividends grow more smoothly than prices move", P.sd(sh.map((x) => x.gD)) < 0.5 * P.sd(sh.map((x) => x.gP)));
  eq("to 2022: 8.3% realised", r1(S.late.realised), 8.3, 0);
  eq("against 5.1%", r1(S.late.dividends), 5.1, 0);
  truth("so the gap narrows a little", S.late.realised - S.late.dividends < S.fifty.realised - S.fifty.dividends && S.late.realised - S.late.dividends > 2);
  eq("as the ratio falls back to 59", r0(S.late.pdEnd), 59, 0);
  eq("Shiller's last full year is 2022", P.SHILLER_LAST, 2022, 0);
  let fit = true;
  for (const s of Object.values(S)) for (const [m, se] of [[s.realised, s.realisedSE], [s.dividends, s.dividendsSE]]) if (m + P.Z95 * se > 16 || m - P.Z95 * se < 0) fit = false;
  truth("every bar and whisker fits the chart's 0% to 16%", fit);
  truth("every piece is positive, so the stacks draw upwards", Object.values(S).every((s) => s.dp > 0 && s.gP > 0 && s.gD > 0));
}

console.log("-- costs, title and conclusion");
{
  eq("the average log premium is 6.5%", r1(P.logPremium()), 6.5, 0);
  eq("about 9% a year (title and conclusion)", r0(ALL.mean), 9, 0);
  eq("a band from roughly 5%", r0(ALL.lo), 5, 0);
  eq("to 13%", r0(ALL.hi), 13, 0);
  truth("thirty-year windows from under 5% to over 14%", P.extremes(30).lo.mean < 5 && P.extremes(30).hi.mean > 14);
  const s = P.split(1951, 2022);
  eq("since 1950 dividends support a real return about 3 points lower (description)", r0(s.realised - s.dividends), 3, 0);
}

console.log(`\n${n - fails} of ${n} checks pass`);
if (fails) process.exit(1);
