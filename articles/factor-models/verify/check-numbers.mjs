// Every number the page states, from the pinned data and src/factors.js. The
// data first (hashes and a fresh parse), then least squares checked against a
// second solver, then the identity for every model, then the claims.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { run } from "../scripts/build-data.mjs";
import * as F from "../src/factors.js";
import DATA from "../src/data.js";

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
  truth("the vintage is the 202608 CRSP file", F.VINTAGE === "202608");
  eq("July 1963 to August 2026, 758 months", F.MONTHS, 758, 0);
  const five = readFileSync(here("../data/F-F_Research_Data_5_Factors_2x3.csv"), "utf8").split(/\r?\n/).find((l) => l.startsWith("202608,")).split(",").map(Number);
  const mom = readFileSync(here("../data/F-F_Momentum_Factor.csv"), "utf8").split(/\r?\n/).find((l) => l.startsWith("202608,")).split(",").map(Number);
  eq("August 2026 HML, read straight from the file", DATA.hml.at(-1), five[3], 1e-12);
  eq("August 2026 CMA", DATA.cma.at(-1), five[5], 1e-12);
  eq("August 2026 momentum", DATA.mom.at(-1), mom[1], 1e-12);
}

console.log("-- least squares, two ways");
{
  // modified Gram-Schmidt QR, then back-substitution
  function qr(y, xs) {
    const cols = [y.map(() => 1), ...xs].map((c) => c.slice());
    const k = cols.length, R = Array.from({ length: k }, () => new Array(k).fill(0));
    const Q = [];
    for (let j = 0; j < k; j++) {
      let v = cols[j].slice();
      for (let i = 0; i < j; i++) { const d = Q[i].reduce((s, q, t) => s + q * v[t], 0); R[i][j] = d; v = v.map((x, t) => x - d * Q[i][t]); }
      const nv = Math.sqrt(v.reduce((s, x) => s + x * x, 0)); R[j][j] = nv; Q.push(v.map((x) => x / nv));
    }
    const qty = Q.map((q) => q.reduce((s, x, t) => s + x * y[t], 0));
    const b = new Array(k).fill(0);
    for (let i = k - 1; i >= 0; i--) { let s = qty[i]; for (let j = i + 1; j < k; j++) s -= R[i][j] * b[j]; b[i] = s / R[i][i]; }
    return b;
  }
  let worst = 0;
  for (const [a, fs] of [["hml", ["smb", "rmw", "cma"]], ["mom", ["smb", "hml", "rmw", "cma"]], ["low", ["smb", "hml", "rmw", "cma", "mom"]]]) {
    const o = F.ols(F.series(a), ["mkt", ...fs].map((f) => DATA[f])).b, q = qr(F.series(a), ["mkt", ...fs].map((f) => DATA[f]));
    worst = Math.max(worst, ...o.map((v, i) => Math.abs(v - q[i])));
  }
  truth("normal equations and QR give the same coefficients", worst < 1e-10, worst.toExponential(1));
}

console.log("-- the identity, for every model");
{
  let worst = 0, models = 0, nested = 0;
  for (const a of Object.keys(F.ASSETS)) {
    const pool = F.FACTORS.filter((f) => f !== F.ASSETS[a].own);
    for (let mask = 0; mask < 1 << pool.length; mask++) {
      const set = pool.filter((_, i) => mask & (1 << i));
      const w = F.waterfall(a, set);
      worst = Math.max(worst, Math.abs(w.capm + w.steps.reduce((s, x) => s + x.move, 0) - w.alpha));
      models++;
      // and between nested non-CAPM models: small = first factor only, big = the set
      if (set.length >= 2) {
        const small = [set[0]], big = set;
        const lhs = F.fit(a, small).alpha - F.fit(a, big).alpha;
        const rhs = big.slice(1).reduce((s, k) => s + F.fit(a, big).loads[k] * F.fit(k, small).alpha, 0);
        worst = Math.max(worst, Math.abs(lhs - rhs)); nested++;
      }
    }
  }
  truth(`the steps add up to the model's alpha in all ${models} asset-model pairs, and the identity holds between ${nested} nested pairs`, worst < 1e-10, worst.toExponential(1));
}

console.log("-- the opening");
{
  eq("the value portfolio earned 3.5% a year", r1(F.yearlyMean("hml")), 3.5, 0);
  truth("while leaning slightly against the market", F.fit("hml", []).loads.mkt < 0 && F.fit("hml", []).loads.mkt > -0.3, F.fit("hml", []).loads.mkt.toFixed(2));
  eq("its CAPM alpha is 4.5%", r1(F.fit("hml", []).alpha), 4.5, 0);
}

console.log("-- the prices");
{
  eq("momentum's own CAPM alpha is 8.3%", r1(F.ownCapmAlpha("mom")), 8.3, 0);
  eq("size's is 0.9%", r1(F.ownCapmAlpha("smb")), 0.9, 0);
  truth("momentum's is the highest and size's the lowest", F.FACTORS.every((f) => F.ownCapmAlpha(f) <= F.ownCapmAlpha("mom") && F.ownCapmAlpha(f) >= F.ownCapmAlpha("smb")));
  eq("investment's is 4.1%", r1(F.ownCapmAlpha("cma")), 4.1, 0);
  let ok = true;
  for (const f of F.FACTORS) { const o = F.fit(f, []); if (o.alpha + 2 * o.se > 12 || o.alpha - 2 * o.se < -2) ok = false; }
  truth("every price and its whiskers fit the −2% to 12% chart", ok);
}

console.log("-- value, explained by investment");
{
  const w = F.waterfall("hml", ["smb", "rmw", "cma"]);
  eq("in the five-factor model value's alpha is −0.3%", r1(w.alpha), -0.3, 0);
  eq("with a t-statistic of −0.3", r1(w.t), -0.3, 0);
  eq("its investment loading is 1.00", r2(w.loads.cma), 1.0, 0);
  eq("which takes away 4.1 points", r1(w.steps.find((s) => s.f === "cma").move), -4.1, 0);
  eq("profitability takes 0.6", r1(w.steps.find((s) => s.f === "rmw").move), -0.6, 0);
  eq("and size about 0.1", r1(w.steps.find((s) => s.f === "smb").move), -0.1, 0);
}

console.log("-- alpha can grow");
{
  const w = F.waterfall("mom", ["hml"]);
  eq("momentum's alpha rises from 8.3%", r1(w.capm), 8.3, 0);
  eq("to 9.8% with value", r1(w.alpha), 9.8, 0);
  eq("because it loads −0.33 on value", r2(w.loads.hml), -0.33, 0);
  eq("which adds 1.5 points", r1(w.steps[0].move), 1.5, 0);
  eq("value's alpha grows to 5.9% with momentum", r1(F.fit("hml", ["mom"]).alpha), 5.9, 0);
}

console.log("-- the lowest-beta shares");
{
  const c = F.fit("low", []);
  eq("CAPM alpha 2.5%", r1(c.alpha), 2.5, 0);
  eq("t-statistic 2.6", r1(c.t), 2.6, 0);
  eq("three factors: 1.7%", r1(F.fit("low", ["smb", "hml"]).alpha), 1.7, 0);
  const f5 = F.fit("low", ["smb", "hml", "rmw", "cma"]);
  eq("five factors: 0.3%", r1(f5.alpha), 0.3, 0);
  eq("t-statistic 0.4", r1(f5.t), 0.4, 0);
  eq("profitability and investment alone: −0.1%", r1(F.fit("low", ["rmw", "cma"]).alpha), -0.1, 0);
}

console.log("-- what this costs you, and the chart");
{
  const quoted = [["hml", []], ["hml", ["smb", "rmw", "cma"]], ["mom", []], ["mom", ["hml"]], ["hml", ["mom"]], ["low", []], ["low", ["smb", "hml"]], ["low", ["smb", "hml", "rmw", "cma"]], ["low", ["rmw", "cma"]]];
  const ses = quoted.map(([a, fs]) => F.fit(a, fs).se);
  truth("every alpha quoted has a standard error of roughly one to two points", ses.every((s) => s >= 0.85 && s <= 2.05), ses.map((s) => s.toFixed(2)).join(" "));
  let lo = Infinity, hi = -Infinity;
  for (const a of Object.keys(F.ASSETS)) {
    const pool = F.FACTORS.filter((f) => f !== F.ASSETS[a].own);
    for (let mask = 0; mask < 1 << pool.length; mask++) {
      const set = pool.filter((_, i) => mask & (1 << i));
      // the lab adds factors in a fixed order, so the running totals are what it draws
      const w = F.waterfall(a, set); let run = w.capm; lo = Math.min(lo, run, w.alpha - 2 * w.se); hi = Math.max(hi, run, w.alpha + 2 * w.se);
      for (const s of w.steps) { run += s.move; lo = Math.min(lo, run); hi = Math.max(hi, run); }
    }
  }
  truth("every bar and whisker of every model fits the lab's −4% to 14% window", lo > -4 && hi < 14, `${lo.toFixed(2)} to ${hi.toFixed(2)}`);
}

console.log(`\n${n - fails} of ${n} checks pass`);
if (fails) process.exit(1);
