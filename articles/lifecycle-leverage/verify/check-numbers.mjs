// Every number the page states. Route A is src/expo.js and the simulation it
// ran into src/precomputed.js. Route B never uses their formulas: it grows each
// deposit forward one year at a time, enumerates every path of a small coin-flip
// market to test the variance identity itself, simulates again with its own
// random numbers, and gets the exact mean and coefficient of variation of final
// wealth from the moments of one year's growth factor.
import * as X from "../src/expo.js";
import { CAPS } from "../src/caps.js";
import { DATA } from "../src/precomputed.js";
import { run } from "../scripts/precompute.mjs";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const pc = (x) => 100 * x;
const N = X.N, R = X.R, MU = X.MU, S = X.SIGMA, PREM = MU - R;

console.log("-- the precomputed file");
if (process.env.SKIP_FRESHNESS) console.log("skip freshness (SKIP_FRESHNESS set)");
else {
  const fresh = run();
  truth("src/precomputed.js is fresh: same keys", JSON.stringify(Object.keys(fresh)) === JSON.stringify(Object.keys(DATA)));
  let same = true, where = "";
  for (const k of Object.keys(fresh)) if (JSON.stringify(fresh[k]) !== JSON.stringify(DATA[k])) { same = false; where = k; break; }
  truth("src/precomputed.js is fresh: same values for every rule", same, where);
}

// route B pieces ---------------------------------------------------------------
// the expected value of a deposit made at the start of year j when it reaches the end
function growth(e, j) { let g = 1; for (let s = j; s < e.length; s++) g *= 1 + R + e[s] * PREM; return g; }
// the balance in expectation at the start of each year, just after that year's deposit
function balances(e) { const b = []; let w = 0; for (let s = 0; s < e.length; s++) { w = (s === 0 ? 0 : b[s - 1] * (1 + R + e[s - 1] * PREM)) + 1; b.push(w); } return b; }
// the exposures, by route B: the balance in year s, carried to the end, over all of final wealth
function exposureB(e) {
  const b = balances(e), n = e.length; let tot = 0; for (let j = 0; j < n; j++) tot += growth(e, j);
  return e.map((x, s) => { let carry = b[s]; for (let t = s; t < n; t++) carry *= 1 + R + e[t] * PREM; return x * carry / tot; });
}
const sum = (a) => a.reduce((s, v) => s + v, 0);
const last = (E, k, p = 1) => sum(E.slice(-k).map((v) => v ** p)) / sum(E.map((v) => v ** p));

const RULES = { all: X.allStocks(), 1.25: X.flatCap(1.25), 1.5: X.flatCap(1.5), 1.75: X.flatCap(1.75), 2: X.flatCap(2), 2.5: X.flatCap(2.5), 3: X.flatCap(3), 3.5: X.flatCap(3.5), 4: X.flatCap(4), glide: X.glide() };
const key = (k) => (k === "all" ? "1" : String(k));

console.log("-- the setting");
{
  let pv = 0; for (let j = 0; j < N; j++) pv += growth(X.allStocks(), j);
  eq("forty deposits at 7% a year, summed one by one", X.exposure(X.allStocks()).tot, pv, 1e-12);
  eq("the same by the annuity formula", pv, ((Math.pow(1 + MU, N) - 1) / MU) * (1 + MU), 1e-12);
  truth("the premium is 5%", Math.abs(PREM - 0.05) < 1e-12 && Math.abs(S - 0.18) < 1e-12 && N === 40 && Math.abs(R - 0.02) < 1e-12);
  truth("caps run from 1 to 4 and include the ones the page names", CAPS[0] === 1 && CAPS[CAPS.length - 1] === 4 && [1.5, 2, 3, 4].every((c) => CAPS.includes(c)));
}

console.log("-- the exposures, grown forward one year at a time");
for (const [name, e] of Object.entries(RULES)) {
  const A = X.exposure(e).E, B = exposureB(e);
  let worst = 0; for (let i = 0; i < N; i++) worst = Math.max(worst, Math.abs(A[i] - B[i]));
  truth(`${name}: the module's exposures match the forward balances in every year`, worst < 1e-12, worst.toExponential(2));
}

console.log("-- the variance identity, by enumerating every path of a small market");
{
  // ten years, a coin-flip stock whose log return has standard deviation s, so
  // the identity should hold as s shrinks. The exact first-order factor is
  // (1+MU)/(1+R+e PREM) on each year, which the page's identity leaves out.
  const e = [2.5, 2, 2, 1.5, 1.2, 1, 0.9, 0.8, 0.75, 0.75], T = e.length;
  const ex = X.exposure(e);
  const varLnW = (s) => {
    let m1 = 0, m2 = 0;
    for (let mask = 0; mask < 1 << T; mask++) {
      let W = 0;
      for (let t = 0; t < T; t++) {
        const z = mask & (1 << t) ? 1 : -1, Rr = ((1 + MU) * Math.exp(s * z)) / Math.cosh(s);
        W = (W + 1) * (1 + R + e[t] * (Rr - 1 - R));
      }
      const l = Math.log(W); m1 += l; m2 += l * l;
    }
    const q = 1 << T; return m2 / q - (m1 / q) ** 2;
  };
  const withFactor = sum(ex.E.map((v, t) => (v * (1 + MU) / (1 + R + e[t] * PREM)) ** 2));
  const errs = [0.02, 0.01, 0.005].map((s) => Math.abs(varLnW(s) / (s * s * ex.sumE2) - 1));
  const errsF = [0.02, 0.01, 0.005].map((s) => Math.abs(varLnW(s) / (s * s * withFactor) - 1));
  truth("the page's identity is within 3% of the exact variance at s = 0.005", errs[2] < 0.03, errs.map((v) => v.toFixed(4)).join(" "));
  truth("and the error shrinks as s does", errs[2] < errs[1] && errs[1] < errs[0]);
  truth("with the factor the page leaves out, it is within 0.3% at s = 0.005", errsF[2] < 0.003, errsF.map((v) => v.toFixed(5)).join(" "));
  truth("the factor is close to 1 on the rules the page draws (all within 5% for the cap-2 rule)", X.flatCap(2).every((x) => Math.abs((1 + MU) / (1 + R + x * PREM) - 1) < 0.05));
}

console.log("-- a simulation of our own, with its own random numbers");
function sim(e, paths, seed) {
  let a = seed >>> 0;
  const u = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const norm = () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u());
  const lw = new Float64Array(paths); let mean = 0;
  for (let p = 0; p < paths; p++) {
    let W = 0;
    for (let t = 0; t < e.length; t++) { const Rr = (1 + MU) * Math.exp(S * norm() - (S * S) / 2); W = (W + 1) * (1 + R + e[t] * (Rr - 1 - R)); if (W <= 0) W = 1e-9; }
    lw[p] = Math.log(W); mean += W;
  }
  const m = lw.reduce((s, v) => s + v, 0) / paths, sd = Math.sqrt(lw.reduce((s, v) => s + (v - m) ** 2, 0) / paths);
  const so = Float64Array.from(lw).sort();
  return { sd, median: Math.exp(so[paths >> 1]), p5: Math.exp(so[Math.floor(paths * 0.05)]), mean: mean / paths };
}
const OWN = {};
for (const [name, e] of Object.entries(RULES)) OWN[name] = sim(e, 200000, 20260929);
for (const name of Object.keys(RULES)) {
  const a = DATA[key(name)], b = OWN[name];
  truth(`${name}: the seeded run and ours agree on the spread of ln W to 1%`, Math.abs(a.sd / b.sd - 1) < 0.01, `${a.sd} ${b.sd.toFixed(4)}`);
  truth(`${name}: and on the median to 1.5% and the 5th percentile to 3%`, Math.abs(a.median / b.median - 1) < 0.015 && Math.abs(a.p5 / b.p5 - 1) < 0.03, `${a.median} ${b.median.toFixed(2)} ${a.p5} ${b.p5.toFixed(2)}`);
}
for (const name of ["all", "1.5", "2", "3", "4", "glide"]) {
  const tot = X.exposure(RULES[name]).tot, a = DATA[key(name)].mean;
  truth(`${name}: the simulated mean is within 1.5% of the sum of expected deposits`, Math.abs(a / tot - 1) < 0.015, `${a} ${tot.toFixed(2)}`);
}

console.log("-- the rules");
{
  const target = X.exposure(X.allStocks()).sumE;
  for (const c of CAPS.filter((v) => v > 1)) eq(`cap ${c}: total exposure equals the all-stocks saver's`, X.exposure(X.flatCap(c)).sumE, target, 1e-9);
  eq("all stocks: total exposure is 28.6 years of final wealth", round(target, 1), 28.6, 0);
  for (const [name, e] of Object.entries(RULES)) {
    const { E, sumE, sumE2, neff } = X.exposure(e);
    eq(`${name}: effective years from the definition`, neff, (sum(E) ** 2) / sum(E.map((v) => v * v)), 1e-12);
    truth(`${name}: effective years never exceed 40`, neff <= N + 1e-9, neff.toFixed(3));
  }
  // an even spread has 40 effective years, and no other exposure with the same total does better
  const even = new Array(N).fill(1).map((v) => v * 0.5);
  eq("an even spread of exposure has forty effective years", (sum(even) ** 2) / sum(even.map((v) => v * v)), 40, 1e-12);
  const c50 = X.flatCap(50), d50 = X.exposure(c50);
  truth("a cap that never binds makes the exposure level in every year", Math.max(...d50.E) - Math.min(...d50.E) < 1e-9, `${Math.min(...d50.E).toFixed(4)} ${Math.max(...d50.E).toFixed(4)}`);
  eq("and effective years are then 40", d50.neff, 40, 1e-9);
  eq("it takes 6.4 to 1 in the first year", round(c50[0], 1), 6.4, 0);
  truth("the level is the total divided by 40", Math.abs(d50.E[0] - target / N) < 1e-9);
  const neffs = CAPS.map((c) => X.exposure(RULES[c === 1 ? "all" : c]).neff), sdD = CAPS.map((c) => X.exposure(RULES[c === 1 ? "all" : c]).sd);
  const sdM = CAPS.map((c) => DATA[String(c)].sd), p5 = CAPS.map((c) => DATA[String(c)].p5), med = CAPS.map((c) => DATA[String(c)].median);
  const inc = (a) => a.every((v, i) => i === 0 || v > a[i - 1]), dec = (a) => a.every((v, i) => i === 0 || v < a[i - 1]);
  truth("a higher cap gives more effective years", inc(neffs), neffs.map((v) => v.toFixed(2)).join(" "));
  truth("the identity's spread falls with the cap", dec(sdD));
  truth("and so does the simulation's, so the two rank the caps the same way", dec(sdM), sdM.join(" "));
  truth("the 5th percentile rises with the cap and the median falls", inc(p5) && dec(med));
  const g15 = neffs[CAPS.indexOf(1.5)], g2 = neffs[CAPS.indexOf(2)], g3 = neffs[CAPS.indexOf(3)], g4 = neffs[CAPS.indexOf(4)];
  truth("moving 1.5 to 2, 2 to 3, and 3 to 4 adds less each time, per unit of cap", (g2 - g15) / 0.5 > (g3 - g2) / 1 && (g3 - g2) / 1 > (g4 - g3) / 1, `${((g2 - g15) / 0.5).toFixed(3)} ${(g3 - g2).toFixed(3)} ${(g4 - g3).toFixed(3)}`);
}

console.log("-- all stocks: what the page says about the first lab");
{
  const e = X.allStocks(), d = X.exposure(e);
  eq("year 1: 7% of final wealth is riding on the market", round(pc(d.E[0])), 7, 0);
  eq("year 10: 53%", round(pc(d.E[9])), 53, 0);
  truth("year 20: about 80%", Math.abs(pc(d.E[19]) - 80) < 1, pc(d.E[19]).toFixed(2));
  eq("year 30: 93%", round(pc(d.E[29])), 93, 0);
  eq("year 40: all of it", d.E[39], 1, 1e-12);
  eq("the last ten years carry 34% of the exposure", round(pc(last(d.E, 10))), 34, 0);
  eq("and 41% of the variance", round(pc(last(d.E, 10, 2))), 41, 0);
  eq("the first ten carry 11% of the exposure", round(pc(1 - last(d.E, 30))), 11, 0);
  eq("effective years are 35.2", round(d.neff, 1), 35.2, 0);
  truth("the lab's own numbers agree with ours (lastShare and the exposures)", Math.abs(X.lastShare(d.E, 10, 1) - last(d.E, 10)) < 1e-12 && Math.abs(X.lastShare(d.E, 10, 2) - last(d.E, 10, 2)) < 1e-12);
  truth("the last decade holds a third of the exposure in a quarter of the years", last(d.E, 10) > 0.33 && last(d.E, 10) < 0.35);
  const ck = X.exposure(X.allStocks());
  truth("the exposure rises every year", ck.E.every((v, i, a) => i === 0 || v > a[i - 1]));
}

console.log("-- cap 2: what the page says about the rule");
{
  const e = X.flatCap(2), d = X.exposure(e);
  truth("she holds 2 to 1 for years 1 to 5", e.slice(0, 5).every((v) => Math.abs(v - 2) < 1e-9) && e[5] < 2 - 1e-6, e.slice(0, 7).map((v) => v.toFixed(3)).join(" "));
  truth("she borrows through year 16 and lends from year 17", e[15] > 1 && e[16] < 1, `${e[15].toFixed(3)} ${e[16].toFixed(3)}`);
  truth("the multiple falls every year once the cap stops binding", e.slice(5).every((v, i, a) => i === 0 || v < a[i - 1]));
  eq("she finishes at 75% in stocks", round(pc(e[39])), 75, 0);
  truth("exposure reaches 75% in year 6 and stays there", Math.abs(d.E[5] - 0.75) < 5e-4 && d.E[4] < d.E[5] && d.E.slice(5).every((v) => Math.abs(v - d.E[5]) < 1e-6), `${d.E[4].toFixed(4)} ${d.E[5].toFixed(4)}`);
  eq("effective years are 39.0", round(d.neff, 1), 39.0, 0);
  eq("the last ten years carry 26% of the exposure", round(pc(last(d.E, 10))), 26, 0);
  truth("against 25% if spread evenly", Math.abs(10 / 40 - 0.25) < 1e-12);
}

console.log("-- what a cap buys, by simulation");
{
  const a = DATA["1"], b = DATA["2"];
  eq("cap 2: the spread of ln W falls 8%", round(pc(b.sd / a.sd - 1)), -8, 0);
  eq("the 5th percentile rises 14%", round(pc(b.p5 / a.p5 - 1)), 14, 0);
  eq("from 41 to 47 years of deposits", round(a.p5) * 1000 + round(b.p5), 41047, 0);
  eq("the median falls 2%", round(pc(b.median / a.median - 1)), -2, 0);
  eq("from 145 to 142", round(a.median) * 1000 + round(b.median), 145142, 0);
  eq("at a cap of 4 the spread falls 9%", round(pc(DATA["4"].sd / a.sd - 1)), -9, 0);
}
truth("effective years read as strings", ["1.5", "2", "3", "4"].map((c) => round(DATA[c].neff, 1).toFixed(1)).join(" ") === "38.2 39.0 39.6 39.8");

console.log("-- the glide path");
{
  const a = DATA["1"], g = DATA.glide, dg = X.exposure(X.glide()), da = X.exposure(X.allStocks());
  eq("its spread is 43% lower", round(pc(g.sd / a.sd - 1)), -43, 0);
  eq("its total exposure is 16.1 against 28.6", round(dg.sumE, 1) * 1000 + round(da.sumE, 1), 16100 + 28.6, 1e-6);
  eq("its median is 24% lower", round(pc(g.median / a.median - 1)), -24, 0);
  eq("110 years of deposits against 145", round(g.median) * 1000 + round(a.median), 110145, 0);
  truth("it starts at 90% and slides to 40%", Math.abs(X.glide()[0] - 0.9) < 1e-12 && Math.abs(X.glide()[N - 1] - 0.4) < 1e-12);
}

console.log("-- the costs");
{
  const a = DATA["1"], b = DATA["2"];
  eq("the identity overstates the spread by 6% for all stocks", round(pc(a.sdDelta / a.sd - 1)), 6, 0);
  eq("and by 9% for a cap of 2", round(pc(b.sdDelta / b.sd - 1)), 9, 0);
  truth("the identity's own number is what the module says", Math.abs(a.sdDelta - X.exposure(X.allStocks()).sd) < 1e-4 && Math.abs(b.sdDelta - X.exposure(X.flatCap(2)).sd) < 1e-4);
  const totA = X.exposure(X.allStocks()).tot, totB = X.exposure(X.flatCap(2)).tot;
  truth("the average final wealth is about 5% lower at a cap of 2, exactly and by simulation", Math.abs(pc(totB / totA - 1) + 5) < 0.5 && pc(b.mean / a.mean - 1) < -4 && pc(b.mean / a.mean - 1) > -5.5, `${pc(totB / totA - 1).toFixed(2)} ${pc(b.mean / a.mean - 1).toFixed(2)}`);
  // exact coefficient of variation of final wealth, from the first two moments of one year's growth factor
  const m1r = 1 + MU, m2r = m1r * m1r * Math.exp(S * S);
  const cv = (e) => { let m = 0, q = 0; for (const x of e) { const k = (1 + R) * (1 - x), M1 = k + x * m1r, M2 = k * k + 2 * k * x * m1r + x * x * m2r; const nm = (m + 1) * M1, nq = (q + 2 * m + 1) * M2; m = nm; q = nq; } return { mean: m, cv: Math.sqrt(q - m * m) / m }; };
  eq("the exact mean from moments matches the sum of expected deposits", cv(X.allStocks()).mean, totA, 1e-12);
  eq("the coefficient of variation is 1.11 at 100% stocks", round(cv(X.allStocks()).cv, 2), 1.11, 0);
  for (const c of [2, 3, 4]) eq(`and 1.07 at a cap of ${c}`, round(cv(X.flatCap(c)).cv, 2), 1.07, 0);
  truth("it barely moves from 2 to 4", Math.abs(cv(X.flatCap(2)).cv - cv(X.flatCap(4)).cv) < 0.005);
  // a wipe-out at 4 to 1
  const thr = 1 + R - (1 + R) / 4;
  truth("a fall of a little over 23% wipes the pile out at 4 to 1", Math.abs(thr - 0.765) < 1e-12 && pc(1 - thr) > 23 && pc(1 - thr) < 24, pc(1 - thr).toFixed(2));
  let a2 = 987654321; const u = () => { a2 = (a2 + 0x6d2b79f5) >>> 0; let t = a2; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let hit = 0; const T = 2000000;
  for (let i = 0; i < T; i++) { const Rr = m1r * Math.exp(S * Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u()) - (S * S) / 2); if (Rr < thr) hit++; }
  truth("which happens about one year in 26", Math.abs(T / hit - 26.3) < 1.5, (T / hit).toFixed(2));
  truth("and the seeded rules never wipe a saver out at a cap of 2 (a return of −49% is needed)", 1 + R - (1 + R) / 2 < 0.52);
}

console.log("-- what the drawn windows can show");
{
  truth("the cap chart's y-window (−15% to +20%) holds every line at every cap", CAPS.every((c) => ["sd", "p5", "median"].every((f) => { const v = DATA[String(c)][f] / DATA["1"][f] - 1; return v > -0.15 && v < 0.2; })));
  truth("the exposure chart's y-window (0 to 100%) holds every bar of every rule", Object.values(RULES).every((e) => X.exposure(e).E.every((v) => v >= 0 && v <= 1.0000001)));
  truth("the leverage chart's window (0 to 320%) holds the multiple of every rule the first lab offers", ["all", "glide", "1.5", "2", "3"].every((k) => RULES[k].every((v) => v >= 0 && v <= 3.2)));
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
