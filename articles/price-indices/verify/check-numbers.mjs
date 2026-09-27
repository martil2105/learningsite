/*
  Re-derives every number price-indices' prose states, from src/indices.js,
  and checks the true index by a second route that shares no code with it: a
  direct minimisation of what it costs to reach last year's indifference
  curve, using the CES utility function itself.
*/
import { shock, trueIndex, hicksian, chained, smoothPath, salePath, laspeyres, paasche, tornqvist } from "../src/indices.js";
import { W_ENERGY, SMOOTH_MONTHS, SALE_SHARE, SALE_PRICE, SALE_MONTHS } from "../src/datasets.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const close = (a, b, tol = 1e-12) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const pct1 = (v) => ((v - 1) * 100).toFixed(1);

/* Route two: CES utility, and the cheapest basket on U = U(A) by golden section
   over the energy quantity. Base basket A = (w, 1 − w) at base prices 1. */
function utility(x, s, w) {
  const a = [w, 1 - w];
  if (Math.abs(s - 1) < 1e-9) return Math.exp(a[0] * Math.log(x[0] / a[0]) + a[1] * Math.log(x[1] / a[1]));
  const r = (s - 1) / s;
  return Math.pow(a[0] ** (1 / s) * x[0] ** r + a[1] ** (1 / s) * x[1] ** r, 1 / r);
}
function otherFor(e, s, w, u) {
  // the "everything else" quantity that keeps utility at u, by bisection
  let lo = 1e-9, hi = 1e6;
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(lo * hi);
    if (utility([e, mid], s, w) < u) lo = mid; else hi = mid;
  }
  return Math.sqrt(lo * hi);
}
function directCost(R, s, w) {
  const u = utility([w, 1 - w], s, w);
  const cost = (e) => R * e + otherFor(e, s, w, u);
  let a = 1e-6, b = 5, g = (Math.sqrt(5) - 1) / 2;
  let c = b - g * (b - a), d = a + g * (b - a);
  for (let i = 0; i < 200; i++) {
    if (cost(c) < cost(d)) b = d; else a = c;
    c = b - g * (b - a); d = a + g * (b - a);
  }
  return cost((a + b) / 2);
}

// --- the question ----------------------------------------------------------------
{
  const r = (s) => shock(2, s, W_ENERGY);
  ok("the fixed basket says 20% whatever sigma is", [0, 0.5, 1, 2, 3].every((s) => close(r(s).L, 1.2)));
  ok("sigma = 0 needs the full 20%", close(r(0).C, 1.2));
  ok("sigma = 0.5 needs 17.3%, sigma = 1 needs 14.9%, sigma = 2 needs 11.1%",
     pct1(r(0.5).C) === "17.3" && pct1(r(1).C) === "14.9" && pct1(r(2).C) === "11.1",
     `${pct1(r(0.5).C)}, ${pct1(r(1).C)}, ${pct1(r(2).C)}`);
  ok("sigma = 1 is exactly 2^0.2 (a constant budget share)", close(r(1).C, Math.pow(2, 0.2)));
  let worst = 0;
  for (const s of [0.5, 1, 1.5, 2, 3]) for (const R of [0.5, 0.8, 1.25, 2, 3]) {
    worst = Math.max(worst, Math.abs(directCost(R, s, W_ENERGY) / shock(R, s, W_ENERGY).C - 1));
  }
  ok("the true index agrees with a direct cost minimisation on the indifference curve (golden section, flat-minimum floor)", worst < 1e-7, worst.toExponential(2));
}

// --- the lab ----------------------------------------------------------------------
{
  const r = shock(2, 1, W_ENERGY);
  ok("Paasche says 11.1% at sigma = 1, against a true 14.9% and a fixed-basket 20%", pct1(r.P) === "11.1");
  let bracket = true;
  for (const s of [0.25, 0.5, 1, 2, 3]) for (const R of [0.5, 0.7, 1.3, 2, 3]) {
    const x = shock(R, s, W_ENERGY);
    if (!(x.P <= x.C + 1e-15 && x.C <= x.L + 1e-15)) bracket = false;
  }
  ok("Paasche ≤ true ≤ Laspeyres across the lab's range, prices up or down", bracket);
  ok("with no relative price change every index is exactly 1", [0, 1, 2.5].every((s) => { const x = shock(1, s, W_ENERGY); return x.L === 1 && close(x.P, 1) && close(x.C, 1) && close(x.F, 1); }));
  ok("when every price rises by the same factor, every index equals that factor, whatever sigma",
     [0.5, 1, 2].every((s) => { const a = [0.2, 0.8], p1 = [1.3, 1.3]; const q1 = hicksian(p1, a, s);
       return close(laspeyres([1, 1], p1, a), 1.3) && close(paasche([1, 1], p1, q1), 1.3) && close(trueIndex(p1, a, s), 1.3); }));
  ok("Fisher is exact at sigma = 0, where the two baskets coincide", close(shock(2, 0, W_ENERGY).F, 1.2));
  ok("Fisher says 15.5% for a doubling at sigma = 1 and closes 88% of the fixed basket's gap",
     pct1(r.F) === "15.5" && Math.round(((r.L - r.F) / (r.L - r.C)) * 100) === 88);
  const q = shock(1.25, 1, W_ENERGY);
  ok("for a 25% rise: 5.0% fixed basket, 4.58% Fisher, 4.56% true, 96% of the gap closed",
     ((q.L - 1) * 100).toFixed(1) === "5.0" && ((q.F - 1) * 100).toFixed(2) === "4.58" && ((q.C - 1) * 100).toFixed(2) === "4.56"
     && Math.round(((q.L - q.F) / (q.L - q.C)) * 100) === 96);
  ok("Törnqvist is exact at sigma = 1", close(shock(2, 1, W_ENERGY).T, shock(2, 1, W_ENERGY).C));
  // A and B lie on the same indifference curve (route two's utility).
  let onCurve = 0;
  for (const s of [0.5, 1, 2]) for (const R of [0.5, 2, 3]) {
    const x = shock(R, s, W_ENERGY);
    onCurve = Math.max(onCurve, Math.abs(utility(x.B, s, W_ENERGY) / utility(x.A, s, W_ENERGY) - 1));
  }
  ok("the lab's B is on A's indifference curve (utility equal to machine precision)", onCurve < 1e-12, onCurve.toExponential(2));
}

// --- the square law ---------------------------------------------------------------
{
  const gap = (s, x) => { const r = shock(Math.exp(x), s, W_ENERGY); return Math.log(r.L) - Math.log(r.C); };
  const fgap = (s, x) => { const r = shock(Math.exp(x), s, W_ENERGY); return Math.abs(Math.log(r.F) - Math.log(r.C)); };
  const slope = (f, s, a, b) => (Math.log(f(s, b)) - Math.log(f(s, a))) / (Math.log(b) - Math.log(a));
  ok("the fixed basket's log gap has slope 2 on log–log axes for small shocks (σ = 0.5, 1, 2)",
     [0.5, 1, 2].every((s) => Math.abs(slope(gap, s, 0.01, 0.02) - 2) < 0.01), [0.5, 1, 2].map((s) => slope(gap, s, 0.01, 0.02).toFixed(4)).join(", "));
  ok("Fisher's log gap has slope 3", [0.5, 1, 2].every((s) => Math.abs(slope(fgap, s, 0.01, 0.02) - 3) < 0.02), [0.5, 1, 2].map((s) => slope(fgap, s, 0.01, 0.02).toFixed(4)).join(", "));
  ok("…and the square-law formula ½σ·w(1−w)(ln R)² matches the gap to 2% for a 5% shock (the next term is third order)",
     [0.5, 1, 2].every((s) => Math.abs(gap(s, 0.05) / shock(Math.exp(0.05), s, W_ENERGY).squareLaw - 1) < 0.02));
  ok("doubling sigma doubles the gap for small shocks", Math.abs(gap(2, 0.02) / gap(1, 0.02) - 2) < 0.01);
  const ratio = gap(1, 0.05) / fgap(1, 0.05);
  ok("for a 5% energy rise at σ = 1, Fisher's error is about a hundred times smaller", ratio > 95 && ratio < 105, ratio.toFixed(1));
  ok("an ordinary year: a 5% spread and σ = 1 overstate by about 0.125 points", Math.abs(0.5 * 1 * 0.05 ** 2 * 100 - 0.125) < 1e-12);
}

// --- chaining ---------------------------------------------------------------------
{
  const sm = chained(smoothPath(2, SMOOTH_MONTHS), [W_ENERGY, 1 - W_ENERGY], 1).at(-1);
  ok("energy doubling over 12 monthly steps: chained fixed basket 15.2%, true 14.9%", pct1(sm.L) === "15.2" && pct1(sm.C) === "14.9");
  ok("…and chained Fisher within a few thousandths of a point", Math.abs(sm.F - sm.C) * 100 < 0.005, `${((sm.F - sm.C) * 100).toFixed(4)}`);
  const sale = chained(salePath(SALE_PRICE, SALE_MONTHS), [SALE_SHARE, 1 - SALE_SHARE], 1);
  const end = sale.at(-1);
  ok("the sale path: prices back where they started and the true index exactly 1", close(end.C, 1));
  ok("after 24 months the chained fixed basket says +17.2% and chained Paasche −14.7%", pct1(end.L) === "17.2" && pct1(end.P) === "-14.7", `${pct1(end.L)}, ${pct1(end.P)}`);
  let fisherEven = 0;
  for (let t = 0; t < sale.length; t += 2) fisherEven = Math.max(fisherEven, Math.abs(sale[t].F - sale[t].C));
  ok("chained Fisher equals the truth at every even month, σ = 0.5, 1 and 2",
     [0.5, 1, 2].every((s) => chained(salePath(SALE_PRICE, SALE_MONTHS), [SALE_SHARE, 1 - SALE_SHARE], s).every((p, t) => t % 2 || Math.abs(p.F - p.C) < 1e-12)));
  // Time reversal, directly.
  let rev = true;
  for (const s of [0.5, 1, 2]) for (const R of [0.5, 0.75, 1.5, 3]) {
    const a = [0.3, 0.7], p0 = [1, 1], p1 = [R, 1];
    const q0 = hicksian(p0, a, s), q1 = hicksian(p1, a, s);
    const F01 = Math.sqrt(laspeyres(p0, p1, q0) * paasche(p0, p1, q1));
    const F10 = Math.sqrt(laspeyres(p1, p0, q1) * paasche(p1, p0, q0));
    const L01 = laspeyres(p0, p1, q0), L10 = laspeyres(p1, p0, q1);
    if (!(close(F01 * F10, 1) && L01 * L10 > 1)) rev = false;
  }
  ok("Fisher passes the time reversal test exactly and the fixed basket fails it upwards", rev);
  ok("the chained drift grows with σ: 0.5 < 1 < 2",
     [0.5, 1, 2].map((s) => chained(salePath(SALE_PRICE, SALE_MONTHS), [SALE_SHARE, 1 - SALE_SHARE], s).at(-1).L).every((v, i, a) => i === 0 || v > a[i - 1]));
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);
