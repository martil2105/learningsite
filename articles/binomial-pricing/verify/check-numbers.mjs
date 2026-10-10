// Every number on the page, from src/binomial.js, in page order and rounded
// as the page rounds. The copy is checked as a portfolio, the risk-neutral
// price against the copy, the return identity at every p, the tree against a
// path-by-path average and Black and Scholes, and the three-branch investor
// against the prices she must get right.
import * as B from "../src/binomial.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2), r3 = (x) => +x.toFixed(3), r4 = (x) => +x.toFixed(4);
const pc0 = (x) => Math.round(100 * x);

const o = B.onePeriod();
console.log("-- copying the call");
{
  eq("two thirds of a share", o.delta, 2 / 3, 1e-12);
  eq("owing $60 next year", -o.bond * B.GROWTH, 60, 1e-12);
  eq("pays $80 less $60 = $20 if the share rises", (2 / 3) * 120 - 60, 20, 1e-12);
  eq("and $60 less $60 = nothing if it falls", (2 / 3) * 90 - 60, 0, 1e-12);
  eq("$20 over $30", 20 / 30, o.delta, 1e-12);
  eq("borrowing $57.14 today", r2(-o.bond), 57.14, 0);
  eq("two thirds of $100", r2((2 / 3) * 100), 66.67, 0);
  eq("costs $9.52", r2(o.price), 9.52, 0);
  // the lab's sliders reach the copy exactly
  const shares = 40 * (1 / 60), owe = 60;
  truth("the sliders' grid holds the copy", Math.abs(shares * 120 - owe - 20) < 1e-9 && Math.abs(shares * 90 - owe) < 1e-9);
}

console.log("-- a price, not a probability");
{
  eq("q = (105 − 90)/(120 − 90) = 0.5", o.q, 0.5, 1e-12);
  eq("the average payoff under q, discounted, is the copy's cost", (o.q * 20 + (1 - o.q) * 0) / 1.05, o.price, 1e-12);
  eq("and q prices the share at $100", (o.q * 120 + (1 - o.q) * 90) / 1.05, 100, 1e-12);
}

console.log("-- what the real chance decides");
{
  eq("leveraged 7.0 to 1", r1(o.omega), 7, 0);
  eq("$66.67 of shares", r2(o.delta * 100), 66.67, 0);
  let worst = 0;
  for (let p = 0; p <= 1.0001; p += 0.05) { const r = B.returns(p); worst = Math.max(worst, Math.abs(r.call - 0.05 - o.omega * (r.share - 0.05))); }
  eq("the call's extra return is seven times the share's at every p", worst, 0, 1e-12);
  const a = B.returns(0.9), b = B.returns(0.1), c = B.returns(0.5);
  eq("Ann (90%): the share returns 17%", pc0(a.share), 17, 0);
  eq("and the call 89%", pc0(a.call), 89, 0);
  eq("Ben (10%): the share returns −7%", pc0(b.share), -7, 0);
  eq("and the call −79%", pc0(b.call), -79, 0);
  eq("at 50% both earn the safe 5%", c.share, 0.05, 1e-12);
  eq("both", c.call, 0.05, 1e-12);
  eq("a 10-point swing in the share is a 70-point swing in the call", r1((B.returns(0.6).call - B.returns(0.5).call) / (B.returns(0.6).share - B.returns(0.5).share)), 7, 0);
  eq("10 points of the share's expected return", r1(100 * (B.returns(0.6667).share - B.returns(0.3333).share)), 10, 0);
  truth("the return chart's −100% to 120% holds both lines", B.returns(0).call >= -1 - 1e-12 && B.returns(1).call < 1.2);
}

console.log("-- many steps");
{
  const t = B.tree(4);
  eq("u = e^(0.2 √0.25)", t.u, Math.exp(0.1), 1e-12);
  eq("the top node after three steps: $134.99", r2(t.S[3][3]), 134.99, 0);
  eq("a quarter later $149.18", r2(t.S[4][4]), 149.18, 0);
  eq("paying $49.18", r2(t.V[4][4]), 49.18, 0);
  eq("or $122.14", r2(t.S[4][3]), 122.14, 0);
  eq("paying $22.14", r2(t.V[4][3]), 22.14, 0);
  eq("the node is worth $36.23", r2(t.V[3][3]), 36.23, 0);
  eq("by hand", r2((t.q * t.V[4][4] + (1 - t.q) * t.V[4][3]) / Math.exp(0.05 / 4)), 36.23, 0);
  eq("the call today: $9.97", r2(t.price), 9.97, 0);
  eq("the risk-neutral chance of a rise: 0.5378", r4(t.q), 0.5378, 0);
  eq("the copy at the start holds 0.629 of a share", r3(t.D[0][0]), 0.629, 0);
  // the tree's price is the discounted average payoff over all 16 paths under q
  let avg = 0;
  for (let mask = 0; mask < 16; mask++) { let ups = 0, pr = 1; for (let k = 0; k < 4; k++) { const up = (mask >> k) & 1; ups += up; pr *= up ? t.q : 1 - t.q; } avg += pr * Math.max(100 * Math.pow(t.u, ups) * Math.pow(t.d, 4 - ups) - 100, 0); }
  eq("the same as averaging over its 16 paths", avg * Math.exp(-0.05), t.price, 1e-12);
  // the copy at each node really copies the next step
  let wc = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j <= i; j++) {
    const D = t.D[i][j], bond = (t.V[i + 1][j] - D * t.S[i + 1][j]) / t.g;
    wc = Math.max(wc, Math.abs(D * t.S[i + 1][j + 1] + bond * t.g - t.V[i + 1][j + 1]), Math.abs(D * t.S[i][j] + bond - t.V[i][j]));
  }
  eq("at every node the copy pays the next node's values and costs this one's", wc, 0, 1e-12);
  eq("crr() agrees with the tree", B.crr(4), t.price, 1e-12);
}

console.log("-- towards Black and Scholes");
{
  const bs = B.blackScholes();
  // Black and Scholes by integration
  let acc = 0; const nq = 40001, zmax = 10;
  for (let i = 0; i < nq; i++) { const z = -zmax + (2 * zmax * i) / (nq - 1), w = (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)) * (2 * zmax / (nq - 1)); acc += w * Math.max(100 * Math.exp(0.05 - 0.02 + 0.2 * z) - 100, 0); }
  eq("Black and Scholes's price by integration", Math.exp(-0.05) * acc, bs, 1e-7);
  eq("is $10.45", r2(bs), 10.45, 0);
  eq("50 steps: $10.41", r2(B.crr(50)), 10.41, 0);
  eq("51 steps: $10.49", r2(B.crr(51)), 10.49, 0);
  let zig = true;
  for (let k = 1; k <= 100; k++) if ((k % 2 === 0) !== (B.crr(k) < bs)) zig = false;
  truth("even steps come out low and odd steps high, from 1 to 100", zig);
  eq("100 steps miss by 2 cents", Math.round(100 * Math.abs(B.crr(100) - bs)), 2, 0);
  eq("1,000 by a fifth of a cent", r1(100 * Math.abs(B.crr(1000) - bs)), 0.2, 0);
  truth("the gap shrinks about in proportion to 1/n", Math.abs((B.crr(200) - bs) / (B.crr(100) - bs) - 0.5) < 0.02);
  truth("with an even number of steps a final node sits exactly at the strike", Math.abs(B.tree(4).S[4][2] - 100) < 1e-9);
  truth("the convergence chart's $9.40 to $12.40 holds every price", Array.from({ length: 100 }, (_, i) => B.crr(i + 1)).every((v) => v > 9.4 && v < 12.4));
}

console.log("-- a third branch");
{
  const miss = B.copyMiss();
  eq("the old copy pays $10 at $105", miss.at105, 10, 1e-12);
  eq("where the call pays $5", miss.call, 5, 0);
  const b = B.bounds();
  eq("arbitrage allows $4.76", r2(b.lo), 4.76, 0);
  eq("to $9.52", r2(b.hi), 9.52, 0);
  // the bounds really are the cheapest copies that always beat the call, and the dearest it always beats
  // super-replication: min cost of shares/bank paying >= call in all three states (LP over a grid)
  let best = Infinity;
  for (let d = 0; d <= 1.0001; d += 1 / 600) { const owe = Math.min(...[[120, 20], [105, 5], [90, 0]].map(([s, c]) => d * s - c)); best = Math.min(best, d * 100 - owe / 1.05); }
  eq("the cheapest portfolio that always pays at least the call costs $9.52", best, b.hi, 1e-6);
  let worst = -Infinity;
  for (let d = 0; d <= 1.0001; d += 1 / 600) { const owe = Math.max(...[[120, 20], [105, 5], [90, 0]].map(([s, c]) => d * s - c)); worst = Math.max(worst, d * 100 - owe / 1.05); }
  eq("the dearest that never pays more costs $4.76", worst, b.lo, 1e-6);
  const at = (pm, up) => B.investorPrice((1 - pm) * up, pm, (1 - pm) * (1 - up));
  const x = at(0.3, 0.6);
  eq("30% middle, 60 to 40: she pays $8.09", r2(x.price), 8.09, 0);
  eq("middle at zero: $9.52", r2(at(0, 0.6).price), 9.52, 0);
  eq("middle at 90%: $5.24", r2(at(0.9, 0.6).price), 5.24, 0);
  eq("risk aversion 1.41 at 60%", r2(x.gamma), 1.41, 0);
  eq("3.82 at 75%", r2(at(0.3, 0.75).gamma), 3.82, 0);
  eq("her price $7.99 at 75%", r2(at(0.3, 0.75).price), 7.99, 0);
  // she prices the share and the bank correctly at every slider position, inside the band
  let ok = true;
  for (let pm = 0; pm <= 0.9001; pm += 0.05) for (let up = 0.45; up <= 0.7501; up += 0.05) {
    const y = at(pm, up), qs = y.q;
    if (Math.abs(qs[0] + qs[1] + qs[2] - 1) > 1e-12 || Math.abs((qs[0] * 120 + qs[1] * 105 + qs[2] * 90) / 1.05 - 100) > 1e-9 || y.price < b.lo - 1e-9 || y.price > b.hi + 1e-9) ok = false;
  }
  truth("at every slider position she prices the share at $100 and the call inside the band", ok);
  truth("the band chart's $4 to $10 holds it", b.lo > 4 && b.hi < 10);
}

console.log(`\n${fails ? fails + " FAILED of " + n : "ALL " + n + " CHECKS PASS"}`);
process.exit(fails ? 1 : 0);
