// Every number on the page, from the pinned daily file (through src/data.js)
// and the simulated Student t samples, in page order and rounded as the page
// rounds (toFixed). First the provenance, then the precompute's freshness.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { run } from "../scripts/build-data.mjs";
import { run as precompute } from "../scripts/precompute.mjs";
import * as M from "../src/market.js";
import * as T from "../src/tails.js";
import { Phi } from "../src/stats.js";
import { wide } from "../src/format.js";
import RUNS from "../src/precomputed.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const here = (p) => new URL(p, import.meta.url);
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[(s.length - 1) >> 1]; };

console.log("-- the data and the precompute");
{
  const csv = readFileSync(here("../data/F-F_Research_Data_Factors_daily.csv"));
  const src = JSON.parse(readFileSync(here("../data/sources.json"), "utf8"))[0];
  truth("the pinned file's hash is the one recorded", createHash("sha256").update(csv).digest("hex") === src.sha256);
  truth("src/data.js is a fresh parse of the pinned file", run() === readFileSync(here("../src/data.js"), "utf8"));
  const rows = csv.toString("utf8").split(/\r?\n/).filter((l) => /^\s*\d{8}\s*,/.test(l)).map((l) => l.split(",").map((s) => s.trim()));
  truth("every decoded date and return matches an independent parse", rows.length === M.N && rows.every((r, i) => +r[0] === M.DATES[i] && Math.abs((+r[1] + +r[4]) / 100 - M.RET[i]) < 1e-12));
  truth("src/precomputed.js is fresh", precompute() === readFileSync(here("../src/precomputed.js"), "utf8"));
}

console.log("-- 19 October 1987");
{
  const i = M.dayIndex(19871019);
  eq("the market fell 17.4%", r1(100 * M.RET[i]), -17.4, 0);
  eq("the daily standard deviation over the century is 1.08%", r2(100 * T.SD), 1.08, 0);
  eq("so the fall was 16.2 standard deviations", r1(T.Z[i]), -16.2, 0);
  truth("and it's the century's largest fall in those terms", T.Z.every((z) => z >= T.Z[i]));
  const yrs = 1 / (Phi(T.Z[i]) * T.DAYS_PER_YEAR);
  eq("a normal gives it once every 1.7 × 10⁵⁶ years", r1(yrs / 1e56), 1.7, 0);
  truth("far longer than the universe has existed (about 1.4 × 10¹⁰ years), many times over", yrs > 1e40 * 1.4e10);
  eq("26,317 days from July 1926 to August 2026", M.N, 26317, 0);
  truth("the first is 1 July 1926 and the last 31 August 2026", M.DATES[0] === 19260701 && M.DATES[M.N - 1] === 20260831);
}

console.log("-- counting the big days");
{
  eq("the normal expects a five-sd day about once every 6,600 years", Math.round(T.normalYearsApartCal(5) / 100) * 100, 6600, 0);
  eq("the data have 101", T.beyond(5), 101, 0);
  eq("51 falls", T.below(5), 51, 0);
  eq("and 50 rises", T.above(5), 50, 0);
  eq("about one a year", r0(T.dataYearsApart(5)), 1, 0);
  eq("at ten the normal's wait is 2.5 × 10²⁰ years", r1(T.normalYearsApartCal(10) / 1e20), 2.5, 0);
  eq("and we still have 9 days", T.beyond(10), 9, 0);
  // the histogram's counts add up, and its normal counts match Φ
  const H = T.histogram(0.5, -18, 16);
  eq("the histogram holds every day", H.reduce((s, b) => s + b.c, 0), M.N, 0);
    const ratio = (b) => b.c / b.normal;
  const mid = H.filter((b) => b.a >= -0.5 && b.b <= 0.5), shoulder = H.filter((b) => (b.a >= 1 && b.b <= 2.5) || (b.a >= -2.5 && b.b <= -1));
  truth("near the middle, about one and a half times the normal's days (1.3 to 1.6 in the two central bins)", mid.every((b) => ratio(b) > 1.3 && ratio(b) < 1.6), mid.map((b) => ratio(b).toFixed(2)).join(" "));
  truth("between one and two and a half sd, about half as many (0.4 to 0.7)", shoulder.every((b) => ratio(b) > 0.4 && ratio(b) < 0.7), shoulder.map((b) => ratio(b).toFixed(2)).join(" "));
  truth("beyond three sd every bar is above the curve", H.filter((b) => (b.b <= -3 || b.a >= 3) && b.c > 0).every((b) => ratio(b) > 1.3));
  truth("beyond four sd every bar is far above the curve", H.filter((b) => (b.b <= -4 || b.a >= 4) && b.c > 0).every((b) => b.c > 10 * b.normal));
  // the readout format on the slider's grid
  eq("the readout shows 6,639 years at five", +wide(T.normalYearsApartCal(5)).replace(/,/g, ""), 6639, 0);
}

console.log("-- a straight line on a log–log chart");
{
  eq("fitted through the 200 largest falls, the exponent is 3.1", r1(T.hill(200, -1).alpha), 3.1, 0);
  eq("and through the 200 largest rises, 3.1", r1(T.hill(200, 1).alpha), 3.1, 0);
  // Hill's estimator on a known power law (Pareto with α = 3) recovers it
  let u = 12345; const rand = () => ((u = (u * 1103515245 + 12345) % 2147483648) / 2147483648);
  const xs = Array.from({ length: 50000 }, () => Math.pow(1 - rand(), -1 / 3)).sort((a, b) => b - a);
  let h = 0; for (let i = 0; i < 2000; i++) h += Math.log(xs[i] / xs[2000]);
  truth("Hill's estimate on 50,000 draws of an exact power law with α = 3 is within 0.15 of 3", Math.abs(2000 / h - 3) < 0.15, (2000 / h).toFixed(3));
  eq("twice as large is about 8 times rarer", r0(Math.pow(2, 3)), 8, 0);
  eq("in the data, beyond ten is 11 times rarer than beyond five", r0(T.beyond(5) / T.beyond(10)), 11, 0);
  eq("the normal says about 4 × 10¹⁶", r0(Phi(-5) / Phi(-10) / 1e16), 4, 0);
}

console.log("-- what an exponent of 3 does");
{
  eq("a Student t with 6 degrees of freedom has kurtosis 6", T.tKurtosis(6), 6, 1e-15);
  truth("and one with 3 has none", T.tKurtosis(3) === Infinity);
  // the simulated tail exponent of a t is its degrees of freedom: check by Hill on a large t3 sample
  const big = Array.from(T.studentT(400000, 3, 77)).map(Math.abs).sort((a, b) => b - a);
  let h = 0; for (let i = 0; i < 2000; i++) h += Math.log(big[i] / big[2000]);
  truth("a large t sample with 3 degrees of freedom has a tail exponent near 3", Math.abs(2000 / h - 3) < 0.25, (2000 / h).toFixed(2));
  const kAt = (nu, n, seeds) => med(seeds.map((s) => T.kurtosis(T.studentT(n, nu, s))));
    const seeds = (m, base) => Array.from({ length: m }, (_, i) => base + i);
  // the median of a very skewed statistic: many samples, and ranges rather than decimals
  const k1 = kAt(3, 1000, seeds(1001, 500)), k2 = kAt(3, 10000, seeds(401, 5000)), k3 = kAt(3, 100000, seeds(201, 9000));
  truth("the typical kurtosis with exponent 3 is about 15 after 1,000 days (13 to 17)", k1 > 13 && k1 < 17, k1.toFixed(1));
  truth("it roughly doubles each time the sample grows tenfold (1.8 to 2.6)", k2 / k1 > 1.8 && k2 / k1 < 2.6 && k3 / k2 > 1.8 && k3 / k2 < 2.6, `${k1.toFixed(1)} ${k2.toFixed(1)} ${k3.toFixed(1)}`);
  truth("as theory says, 10^(1/3) = 2.15 for an exponent of 3", Math.abs(Math.pow(10, 4 / 3 - 1) - 2.154) < 0.001);
  truth("to around 70 after 100,000 (60 to 85)", k3 > 60 && k3 < 85, k3.toFixed(1));
  const s6 = kAt(6, 100000, seeds(41, 700));
  truth("while with exponent 6 the typical sample of 100,000 is within 0.4 of 6", Math.abs(s6 - 6) < 0.4, s6.toFixed(2));
  // the four samples drawn
  const last = (runs) => runs.map((r) => r[r.length - 1][1]);
  truth("the four exponent-6 samples drawn end within 0.7 of 6", last(RUNS[6]).every((k) => Math.abs(k - 6) < 0.7), last(RUNS[6]).map((k) => k.toFixed(2)).join(" "));
    truth("the four exponent-3 samples drawn end around the typical value (median within a factor of 1.6 of it)", Math.abs(Math.log(med(last(RUNS[3])) / k3)) < Math.log(1.6), last(RUNS[3]).map((k) => k.toFixed(1)).join(" "));
  truth("and every drawn kurtosis stays inside the 2 to 500 window", [...RUNS[3], ...RUNS[6]].every((r) => r.every(([, k]) => k > 2 && k < 500)));
  eq("the century's kurtosis is 19.1", r1(T.kurtosis(M.RET)), 19.1, 0);
  const W = T.windows(10), top = W.reduce((a, b) => (b.kurt > a.kurt ? b : a)), low = W.reduce((a, b) => (b.kurt < a.kurt ? b : a));
  eq("lowest decade: 1977 to 1986", low.a, 1977, 0);
  eq("at 5.2", r1(low.kurt), 5.2, 0);
  eq("highest: 1987 to 1996", top.a, 1987, 0);
  eq("at 73.3", r1(top.kurt), 73.3, 0);
  eq("where 19 October 1987 supplies 84%", r0(100 * top.share), 84, 0);
  truth("and that's the day", top.day === 19871019);
  // the share is what the bar splits: kurtosis × share is the biggest day's part
  const i0 = M.DATES.findIndex((d) => d >= 19870101), i1 = M.DATES.findIndex((d) => d >= 19970101);
  let mm = 0; for (let i = i0; i < i1; i++) mm += M.RET[i]; mm /= i1 - i0;
  let v = 0, f = 0; for (let i = i0; i < i1; i++) { v += (M.RET[i] - mm) ** 2; f += (M.RET[i] - mm) ** 4; } v /= i1 - i0;
  const part = (M.RET[M.dayIndex(19871019)] - mm) ** 4 / (i1 - i0) / (v * v);
  eq("the pink slice is that day's own fourth power over the squared variance", part, top.kurt * top.share, 1e-10);
}

console.log("-- what this costs you");
{
  const share = (z) => T.Z.filter((x) => x <= -z).length / M.N;
  eq("the normal puts 1% beyond 2.33 sd down", r2(-1 * (() => { let lo = -5, hi = 0; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (Phi(m) < 0.01) lo = m; else hi = m; } return lo; })()), 2.33, 0);
  eq("the data have 1.87% there", r2(100 * share(2.326348)), 1.87, 0);
  eq("at the normal's 0.1% line the data have 0.83%", r2(100 * share(3.090232)), 0.83, 0);
  eq("eight times as many", r0(share(3.090232) / 0.001), 8, 0);
  eq("at the normal's 5% line the data have only 4.1%", r1(100 * share(1.644854)), 4.1, 0);
  eq("through the 50 largest falls the exponent is 3.9", r1(T.hill(50, -1).alpha), 3.9, 0);
  eq("through the largest 800, 2.7", r1(T.hill(800, -1).alpha), 2.7, 0);
  const m = {}; M.DATES.forEach((d, i) => { const k = Math.floor(d / 100); m[k] = (m[k] ?? 1) * (1 + M.RET[i]); });
  const mr = Object.values(m).map((x) => x - 1);
  eq("monthly returns have a kurtosis of 10.4", r1(T.kurtosis(mr)), 10.4, 0);
  const mu = mr.reduce((a, b) => a + b, 0) / mr.length, sd = Math.sqrt(mr.reduce((a, b) => a + (b - mu) ** 2, 0) / (mr.length - 1));
  eq("17 months beyond three standard deviations", mr.filter((x) => Math.abs(x - mu) >= 3 * sd).length, 17, 0);
  eq("where a normal expects about three", r0(2 * mr.length * Phi(-3)), 3, 0);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
