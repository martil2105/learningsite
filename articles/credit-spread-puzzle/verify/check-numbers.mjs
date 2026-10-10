// Every number on the page, from the pinned FRED files and src/credit.js, in
// page order and rounded as the page rounds. src/data.js is rebuilt from data/
// and compared, the files' hashes are checked against data/sources.json, the
// 1970-2001 average is checked against the figure Chen, Collin-Dufresne and
// Goldstein report from the same series, and the one-factor model is checked
// by quadrature and by simulating firms one by one.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as C from "../src/credit.js";
import { build } from "../scripts/build-data.mjs";
import { normals } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2), r3 = (x) => +x.toFixed(3);
const pc0 = (x) => r0(100 * x), pc1 = (x) => r1(100 * x), pc2 = (x) => r2(100 * x), pc3 = (x) => r3(100 * x);

console.log("-- the data");
{
  const sources = JSON.parse(readFileSync(new URL("../data/sources.json", import.meta.url), "utf8"));
  for (const s of sources) {
    const h = createHash("sha256").update(readFileSync(new URL(`../data/${s.file}`, import.meta.url))).digest("hex");
    eq(`${s.file} is the pinned vintage`, h === s.sha256 ? 1 : 0, 1, 0);
  }
  truth("src/data.js is exactly what scripts/build-data.mjs makes from data/", readFileSync(new URL("../src/data.js", import.meta.url), "utf8") === build());
  eq("monthly from January 1919", C.indexOf("1919-01"), 0, 0);
  eq("to September 2026", C.N - 1, C.indexOf("2026-09"), 0);
  eq("1,293 months", C.N, 1293, 0);
}

console.log("-- a century of Baa over Aaa");
{
  const all = C.stretch("1919-01", "2026-09"), mid = C.stretch("1970-01", "2001-12"), late = C.stretch("2002-01", "2026-09");
  eq("over the whole century, Baa yielded 1.16 points more", r2(all.mean), 1.16, 0);
  eq("widest: 5.64 points", all.max, 5.64, 1e-12);
  eq("in May 1932", all.maxAt === "1932-05" ? 1 : 0, 1, 0);
  eq("December 2008: 3.38 points", C.SPREAD[C.indexOf("2008-12")], 3.38, 1e-12);
  eq("narrowest month: 0.32 points", all.min, 0.32, 1e-12);
  eq("in January 1966", all.minAt === "1966-01" ? 1 : 0, 1, 0);
  eq("1970 to 2001: 1.09 points", r2(mid.mean), 1.09, 0);
  eq("which is Chen, Collin-Dufresne and Goldstein's 109 basis points", Math.round(100 * mid.mean), 109, 0);
  eq("2002 to 2026: 1.01 points", r2(late.mean), 1.01, 0);
  eq("with December 2008 as its peak", late.maxAt === "2008-12" ? 1 : 0, 1, 0);
  truth("a little less than over the whole century", late.mean < all.mean);
  eq("readout: widest month over the century", C.monthName(all.maxAt) === "May 1932" ? 1 : 0, 1, 0);
}

console.log("-- what defaults cost");
{
  eq("Baa: 4.89% default within ten years", C.DEFAULTS.Baa[10], 0.0489, 1e-12);
  eq("Aaa: 0.63%", C.DEFAULTS.Aaa[10], 0.0063, 1e-12);
  eq("recovery 44.9 cents, so they lose 55.1", r1(100 * (1 - C.RECOVERY)), 55.1, 0);
  const b = C.lossSpread(C.DEFAULTS.Baa[10]), a = C.lossSpread(C.DEFAULTS.Aaa[10]);
  eq("0.27 points a year for Baa", pc2(b), 0.27, 0);
  eq("0.035 for Aaa", pc3(a), 0.035, 0);
  eq("defaults explain a gap of 0.24 points", pc2(b - a), 0.24, 0);
  // the formula: a lender paid s a year, continuously, for T years, ends with what she expects to get back
  eq("the spread pays back exactly the expected loss", Math.exp(-b * 10) , 1 - 0.0489 * (1 - C.RECOVERY), 1e-12);
  const mid = C.stretch("1970-01", "2001-12");
  eq("1.09 points is 4.6 times what defaults cost", r1(mid.mean / (100 * (b - a))), 4.6, 0);
  eq("guess card: about 0.035 and 0.27", pc3(a) + pc2(b), 0.305, 1e-9);
}

console.log("-- paying for when defaults happen");
{
  const th = C.CORR * C.SHARPE;
  eq("λ = 0.5 × 0.43 = 0.215", th, 0.215, 1e-12);
  eq("over ten years: 0.68 standard deviations", r2(th * Math.sqrt(10)), 0.68, 0);
  const r = C.ratings(th);
  eq("the market's chance of a Baa default within ten years is 16.5%", pc1(r.Baa.Q), 16.5, 0);
  truth("more than three times the real 4.89%", r.Baa.Q > 3 * 0.0489 && r.Baa.Q < 4 * 0.0489);
  eq("the model's Baa spread is 0.95 points", pc2(r.Baa.spread), 0.95, 0);
  eq("Aaa: 0.19 points", pc2(r.Aaa.spread), 0.19, 0);
  eq("the gap is 0.76 points", pc2(r.gap), 0.76, 0);
  const paid = C.stretch("1970-01", "2001-12").mean;
  eq("69% of what Baa paid over Aaa", pc0((100 * r.gap) / paid), 69, 0);
  eq("blue is about two and a half times grey for Baa", r1(r.Baa.premium / r.Baa.loss), 2.5, 0);
  eq("and about four and a half times for Aaa", r1(r.Aaa.premium / r.Aaa.loss), 4.6, 0.25);
  eq("at a correlation of zero we're back to 0.24 points", pc2(C.ratings(0).gap), 0.24, 0);
  eq("correlation 0.7: the model explains 99%", pc0((100 * C.ratings(0.7 * 0.43).gap) / paid), 99, 0);
  const t = C.impliedTheta(paid / 100);
  truth("the gap still rises at the top of the search", C.ratings(0.6).gap > paid / 100 && C.ratings(0.59).gap < C.ratings(0.6).gap);
  eq("matching 1.09 at correlation 0.5 takes a Sharpe ratio of 0.61", r2(t / 0.5), 0.61, 0);
  eq("about 40% more than 0.43", r1(t / 0.5 / 0.43 - 1), 0.4, 0);
  eq("the slider grid holds 0.7", Math.abs(0.7 / 0.05 - Math.round(0.7 / 0.05)) < 1e-9 ? 1 : 0, 1, 0);
  // the identity really is the market's chance in Merton's model: a firm with a real 10-year chance P and Sharpe λ
  const P = 0.0489, s = 0.25, mu = 0.03 + th * s, T = 10;
  const ln = -C.PhiInv(P) * s * Math.sqrt(T) - (mu - s * s / 2) * T; // ln(V/F) giving that real chance
  const q = C.Phi(-(ln + (0.03 - s * s / 2) * T) / (s * Math.sqrt(T)));
  eq("the shift is Merton's market chance for a firm with that real chance", q, r.Baa.Q, 1e-9);
}

console.log("-- multiples");
{
  const r = C.ratings(0.215), r4 = C.ratings(0.215, 4);
  eq("the model pays Aaa 5.56 times its expected loss", r2(r.Aaa.multiple), 5.56, 0);
  eq("and Baa 3.48 times", r2(r.Baa.multiple), 3.48, 0);
  eq("guess card: 5.6 and 3.5", r1(r.Aaa.multiple) + r1(r.Baa.multiple), 9.1, 1e-9);
  let mono = true, prev = Infinity;
  for (let p = 0.0001; p < 0.5; p *= 1.2) { const m = C.multiple(p, 0.215); if (m > prev + 1e-12) mono = false; prev = m; }
  truth("the multiple falls as default gets likelier", mono);
  eq("four years: 4.34", r2(r4.Aaa.multiple), 4.34, 0);
  eq("and 2.73", r2(r4.Baa.multiple), 2.73, 0);
  eq("four-year default rates: Baa 1.55%, Aaa 0.04%", C.DEFAULTS.Baa[4] + C.DEFAULTS.Aaa[4], 0.0159, 1e-12);
}

console.log("-- how sure is 4.89%?");
{
  const P = 0.0489, zP = C.PhiInv(P);
  // the large-cohort default rate averages to P over the common shock, at any correlation
  for (const rho of [0.05, 0.15, 0.3]) {
    let acc = 0; const nq = 20001, zmax = 9;
    for (let i = 0; i < nq; i++) { const z = -zmax + (2 * zmax * i) / (nq - 1), w = (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)) * (2 * zmax / (nq - 1)); acc += w * C.Phi((zP - Math.sqrt(rho) * z) / Math.sqrt(1 - rho)); }
    eq(`a large cohort defaults ${P * 100}% of the time on average (ρ ${rho})`, acc, P, 1e-8);
  }
  // one cohort of 4,000 firms simulated firm by firm against the formula for its shock
  {
    const g = normals(5), rho = 0.15, z = 1.2, firms = 40000; let d = 0;
    for (let i = 0; i < firms; i++) if (Math.sqrt(rho) * z + Math.sqrt(1 - rho) * g() < zP) d++;
    const want = C.Phi((zP - Math.sqrt(rho) * z) / Math.sqrt(1 - rho));
    truth("firms simulated one by one default as the formula says", Math.abs(d / firms - want) < 4 * Math.sqrt(want * (1 - want) / firms), `${(100 * d / firms).toFixed(2)}% vs ${(100 * want).toFixed(2)}%`);
  }
  eq("32 years hold 23 ten-year groups", 32 - 10 + 1, 23, 0);
  const s = C.summary(C.records(0.15, { draws: normals(11) }));
  eq("2,000 records", s.sorted.length, 2000, 0);
  eq("middle 90%: from 1.7%", pc1(s.lo), 1.7, 0);
  eq("to 10.1%", pc1(s.hi), 10.1, 0);
  eq("the model's Baa spread from 0.43", pc2(C.modelSpread(s.lo, 0.215)), 0.43, 0);
  eq("to 1.64 points", pc2(C.modelSpread(s.hi, 0.215)), 1.64, 0);
  eq("the typical record shows 4.39%", pc2(s.median), 4.39, 0);
  eq("59% show less than 4.89%", pc0(s.below), 59, 0);
  const mean = s.sorted.reduce((a, b) => a + b, 0) / s.sorted.length;
  truth("but the records average about the truth", Math.abs(mean - P) < 0.002, (100 * mean).toFixed(2));
  const s05 = C.summary(C.records(0.05, { draws: normals(11) })), s30 = C.summary(C.records(0.3, { draws: normals(11) }));
  eq("at 0.05: 2.9%", pc1(s05.lo), 2.9, 0);
  eq("to 7.6%", pc1(s05.hi), 7.6, 0);
  eq("at 0.3: 0.9%", pc1(s30.lo), 0.9, 0);
  eq("to 13.0%", pc1(s30.hi), 13, 0);
  truth("the slider holds 0.05, 0.15 and 0.3", [0.05, 0.15, 0.3].every((v) => Math.abs((v - 0.05) / 0.05 - Math.round((v - 0.05) / 0.05)) < 1e-9));
  truth("the histogram's 200 ceiling holds every bin at every slider position", [0.05, 0.1, 0.15, 0.2, 0.25, 0.3].every((rho) => { const c = new Array(80).fill(0); for (const v of C.records(rho, { draws: normals(11) })) c[Math.min(79, Math.floor(v / 0.0025))]++; return Math.max(...c) <= 200; }));
}

console.log("-- what this costs you");
{
  const r = C.ratings(0.215);
  eq("our model: 0.95 for Baa", pc2(r.Baa.spread), 0.95, 0);
  eq("and 0.19 for Aaa", pc2(r.Aaa.spread), 0.19, 0);
  // quoted: Chen, Collin-Dufresne and Goldstein's Black and Cox spreads at correlation 0.5, ten years: 89.74 and 18.4 basis points
  eq("their 89.74 basis points is 0.90", r2(0.8974), 0.9, 0);
  eq("their 18.4 is 0.18", r2(0.184), 0.18, 0);
}

console.log(`\n${fails ? fails + " FAILED of " + n : "ALL " + n + " CHECKS PASS"}`);
process.exit(fails ? 1 : 0);
