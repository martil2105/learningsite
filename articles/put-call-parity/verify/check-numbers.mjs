// Every number on the page, from src/parity.js, in page order and rounded as
// the page rounds. Parity is checked in both models at every strike, the
// crash model against a direct average over its outcomes, the implied
// volatilities both ways, and Palm's synthetic prices against Lamont and
// Thaler's Table 6.
import * as P from "../src/parity.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2);
const pc0 = (x) => Math.round(100 * x), pc1 = (x) => r1(100 * x), pc2 = (x) => r2(100 * x);

console.log("-- a call minus a put");
{
  let worst = 0;
  for (let K = 80; K <= 120; K++) for (let s = 60; s <= 140; s += 0.5) worst = Math.max(worst, Math.abs(Math.max(s - K, 0) - Math.max(K - s, 0) - (s - K)));
  eq("the payoffs differ by S_T − K everywhere", worst, 0, 0);
  eq("strike $100, share ends at $120: the call pays $20", Math.max(120 - 100, 0), 20, 0);
  eq("ends at $80: the put pays $20 and the difference is −$20", Math.max(100 - 80, 0) + (80 - 100), 0, 0);
  eq("$100, 4%, a year: a call minus a put at $100 is worth $3.92", r2(P.forwardValue(100)), 3.92, 0);
  eq("and Black and Scholes agree", P.bs(100, 0.2) - P.bs(100, 0.2, { call: false }), P.forwardValue(100), 1e-12);
  eq("guess card: with no interest a call and a put at $100 cost the same", P.bs(100, 0.3, { r: 0 }) - P.bs(100, 0.3, { r: 0, call: false }), 0, 1e-12);
}

console.log("-- whatever the model");
{
  // the crash model as a direct average over outcomes: a jump of -30% with chance 10%, then lognormal 15%
  const crashDirect = (K, call) => {
    const w = 0.1, J = 0.7, fwd = 100 * Math.exp(P.R), X = fwd / (1 - w + w * J), s = 0.15;
    let acc = 0; const nq = 40001, zmax = 10;
    for (let i = 0; i < nq; i++) {
      const z = -zmax + (2 * zmax * i) / (nq - 1), wt = (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)) * (2 * zmax / (nq - 1));
      for (const [pr, f] of [[1 - w, X], [w, X * J]]) { const ST = f * Math.exp(-s * s / 2 + s * z); acc += pr * wt * (call ? Math.max(ST - K, 0) : Math.max(K - ST, 0)); }
    }
    return Math.exp(-P.R) * acc;
  };
  eq("the crash model's call at $110 by direct averaging", crashDirect(110, true), P.MODELS.crash.price(110, true), 1e-6);
  eq("and its put", crashDirect(110, false), P.MODELS.crash.price(110, false), 1e-6);
  const mean = (() => { const w = 0.1, J = 0.7, X = 100 * Math.exp(P.R) / (1 - w + w * J); return (1 - w) * X + w * X * J; })();
  eq("both models price the share at $100 (forward $104.08)", mean, 100 * Math.exp(P.R), 1e-12);
  let worst = 0;
  for (let K = 70; K <= 130; K += 0.5) for (const m of Object.values(P.MODELS)) worst = Math.max(worst, Math.abs(m.price(K, true) - m.price(K, false) - P.forwardValue(K)));
  eq("in both models the call minus the put is the forward's value at every strike", worst, 0, 1e-9);
  const c1 = P.MODELS.calm, c2 = P.MODELS.crash;
  eq("smooth: the call at $110 costs $5.66", r2(c1.price(110, true)), 5.66, 0);
  eq("and the put $11.35", r2(c1.price(110, false)), 11.35, 0);
  eq("crash: the call costs $4.53", r2(c2.price(110, true)), 4.53, 0);
  eq("and the put $10.22", r2(c2.price(110, false)), 10.22, 0);
  eq("the call minus the put is −$5.69 in both", r2(c1.price(110, true) - c1.price(110, false)), -5.69, 0);
  eq("and it's the forward to buy at $110", r2(P.forwardValue(110)), -5.69, 0);
  let differ = true;
  for (let K = 70; K <= 130; K += 5) if (Math.abs(c1.price(K, true) - c2.price(K, true)) < 0.01) differ = false;
  truth("the models disagree at every strike", differ);
  eq("crash world: $80 implies 20.4%", pc1(P.iv(c2.price(80, true), 80)), 20.4, 0);
  eq("$120 implies 16.6%", pc1(P.iv(c2.price(120, true), 120)), 16.6, 0);
  let wiv = 0;
  for (let K = 70; K <= 130; K += 5) wiv = Math.max(wiv, Math.abs(P.iv(c2.price(K, true), K) - P.iv(c2.price(K, false), K, { call: false })));
  eq("the call and the put at each strike imply the same volatility", wiv, 0, 1e-7);
  truth("the price chart's −$30 to $35 holds every line", [...Array(121).keys()].every((i) => { const K = 70 + i * 0.5; return Object.values(P.MODELS).every((m) => [m.price(K, true), m.price(K, false), m.price(K, true) - m.price(K, false)].every((v) => v > -30 && v < 35)); }));
}

console.log("-- the forward hiding in option prices");
{
  eq("the share price grown at 4%: $104.08", r2(P.impliedForward(P.bs(100, 0.2), P.bs(100, 0.2, { call: false }), 100)), 104.08, 0);
  const b = 0.03, c = P.bs(100, 0.25, { b }), p = P.bs(100, 0.25, { b, call: false });
  const f = P.impliedForward(c, p, 100);
  eq("with a 3% fee, the forward is $101.01", r2(f), 101.01, 0);
  eq("which is 100 e^(0.04 − 0.03)", f, 100 * Math.exp(0.01), 1e-12);
  eq("the put at $100 seems to imply 28.17%", pc2(P.iv(p, 100, { call: false })), 28.17, 0);
  eq("and the call 20.45%", pc2(P.iv(c, 100)), 20.45, 0);
  const KS = Array.from({ length: 81 }, (_, i) => 80 + i * 0.5);
  const none = KS.filter((K) => !Number.isFinite(P.iv(P.bs(K, 0.25, { b }), K)));
  eq("below a strike of $84.50 no volatility gives the call's price", none[none.length - 1] + 0.5, 84.5, 0);
  truth("and those calls are worth less than the wrong forward says any call can be", none.every((K) => P.bs(K, 0.25, { b }) < P.forwardValue(K)));
  const bf = 0.04 - Math.log(f / 100);
  let w = 0;
  for (const K of KS) for (const call of [true, false]) w = Math.max(w, Math.abs(P.iv(P.bs(K, 0.25, { b, call }), K, { b: bf, call }) - 0.25));
  eq("with the forward the options imply, every option gives 25%", w, 0, 1e-7);
  let w0 = 0;
  for (const K of KS) w0 = Math.max(w0, Math.abs(P.iv(P.bs(K, 0.25, { b: 0 }), K) - P.iv(P.bs(K, 0.25, { b: 0, call: false }), K, { call: false })));
  eq("with no fee the two lines meet without help", w0, 0, 1e-7);
  truth("the volatility chart's 0 to 40% holds every line at every fee", [0, 0.03, 0.06].every((b) => KS.every((K) => [true, false].every((call) => { const v = P.iv(P.bs(K, 0.25, { b, call }), K, { call }); return !Number.isFinite(v) || (v > 0 && v < 0.4); }))));
  truth("the fee slider holds 3% and 0", Math.abs(0.03 / 0.005 - Math.round(0.03 / 0.005)) < 1e-9);
}

console.log("-- Palm");
{
  eq("1.525 Palm shares at $95.06 are $144.97", r2(1.525 * 95.06), 144.97, 0);
  truth("more than a 3Com share's $81.81", 1.525 * 95.06 > 81.81);
  for (const row of P.PALM.rows) {
    const s = P.synthetic(row);
    eq(`${row.label}: the synthetic short matches the paper to a cent`, Math.abs(s.short - row.paper.short) <= 0.0151 ? 1 : 0, 1, 0);
    eq(`${row.label}: the synthetic long matches the paper to a cent`, Math.abs(s.long - row.paper.long) <= 0.0151 ? 1 : 0, 1, 0);
  }
  const nov = P.synthetic(P.PALM.rows[2]);
  eq("November: selling a share through the options raised $39.12", r2(nov.short), 39.12, 0);
  eq("exactly the paper's figure", r2(nov.short), P.PALM.rows[2].paper.short, 0);
  eq("29% below $55.25", pc0(1 - nov.short / 55.25), 29, 0);
  eq("buying one cost $42.62", r2(nov.long), 42.62, 0);
  eq("the difference from $55.25 is $12.63", r2(55.25 - nov.long), 12.63, 0);
  const pcts = P.PALM.rows.map((r) => pc0(1 - P.synthetic(r).short / 55.25));
  eq("14% for May", pcts[0], 14, 0);
  eq("21% for August", pcts[1], 21, 0);
  eq("29% for November", pcts[2], 29, 0);
  eq("meta: November 23% to 29% below", pc0(1 - nov.long / 55.25), 23, 0);
  truth("the Palm chart's $35 to $60 holds every bar and the price", P.PALM.rows.every((r) => { const s = P.synthetic(r); return s.short > 35 && s.long < 60; }) && P.PALM.price < 60);
}

console.log("-- a box and American options");
{
  eq("a box from $90 to $110 costs $19.22 in the smooth model", r2(P.box(90, 110)), 19.22, 0);
  eq("and the same in the crash model", P.box(90, 110, P.MODELS.crash.price), P.box(90, 110), 1e-9);
  eq("the present value of $20 at 4%", P.box(90, 110), 20 * Math.exp(-0.04), 1e-12);
  eq("to $3.92", r2(100 - 100 * Math.exp(-0.04)), 3.92, 0);
}

console.log(`\n${fails ? fails + " FAILED of " + n : "ALL " + n + " CHECKS PASS"}`);
process.exit(fails ? 1 : 0);
