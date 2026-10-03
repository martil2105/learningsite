// Every number the page states, re-derived from src/firm.js. The second route
// prices the loan and the shares by integrating their payoffs over next year's
// asset value (trapezoid rule on ln V1), without the Black-Scholes formula.
import * as M from "../src/firm.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const p1 = (x) => Math.round(x * 1000) / 10, p2 = (x) => Math.round(x * 10000) / 100;

// route B: integrate over z, ln V1 = ln V0 + drift - s^2/2 + s z, by Simpson's
// rule on each side of the kink where V1 = F, so both pieces are smooth.
const phi = (z) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
function simpson(f, a, b, N = 4000) {
  if (b <= a) return 0;
  const h = (b - a) / N; let s = f(a) + f(b);
  for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}
function integrate(F, s, drift) {
  const lo = -12, hi = 12;
  const V = (z) => M.V0 * Math.exp(drift - (s * s) / 2 + s * z);
  const zk = Math.min(hi, Math.max(lo, (Math.log(F / M.V0) - drift + (s * s) / 2) / s));
  const eq = simpson((z) => (V(z) - F) * phi(z), zk, hi);
  const debt = simpson((z) => V(z) * phi(z), lo, zk) + F * simpson(phi, zk, hi);
  const below = simpson(phi, lo, zk);
  return { eq, debt, below };
}
function routeB(F, s) {
  const Q = integrate(F, s, Math.log(1 + M.RF)), P = integrate(F, s, Math.log(1 + M.RA));
  const E0 = Q.eq / (1 + M.RF), D0 = Q.debt / (1 + M.RF);
  return { E0, D0, rE: P.eq / E0 - 1, rD: P.debt / D0 - 1, pDefault: P.below };
}

console.log("-- the normal distribution");
{
  let worst = 0;
  for (let x = -6; x <= 6; x += 0.25) {
    worst = Math.max(worst, Math.abs(simpson(phi, -14, x, 8000) - M.Phi(x)));
  }
  truth("Phi matches the integral of the normal density from −6 to 6", worst < 1e-10, worst.toExponential(1));
}

console.log("-- the guess card: a safe loan for half the firm");
{
  eq("shareholders now expect 13%", M.mm2(1), 0.13, 1e-12);
  eq("half of 13% and half of 3% is 8%", 0.5 * 0.13 + 0.5 * 0.03, 0.08, 1e-12);
  const o = M.atDE(1);
  eq("in the model at 25% volatility it's 13.0%", p1(o.rE), 13.0, 0);
  truth("and the loan is nearly safe (repaid in all but 0.2% of years)", p1(o.pDefault) === 0.2, (100 * o.pDefault).toFixed(3) + "%");
}

console.log("-- the two propositions, everywhere");
{
  let worstW = 0, worstV = 0, worstII = 0, worstGap = 0, worstB = 0, worstErr = 0;
  for (const s of [0.05, 0.1, 0.15, 0.25, 0.35, 0.45]) for (let de = 0.05; de <= 4.0001; de += 0.15) {
    const o = M.atDE(de, s);
    worstW = Math.max(worstW, Math.abs(o.wacc - M.RA));
    worstV = Math.max(worstV, Math.abs(o.E0 + o.D0 - 100));
    worstII = Math.max(worstII, Math.abs(o.rE - (M.RA + (M.RA - o.rD) * o.DE)));
    worstGap = Math.max(worstGap, Math.abs(o.line - o.rE - (o.rD - M.RF) * o.DE));
    worstErr = Math.max(worstErr, Math.abs(o.waccYield - o.wacc - o.DV * (o.y - o.rD)));
    const b = routeB(o.F, s);
    worstB = Math.max(worstB, Math.abs(b.E0 - o.E0) / o.E0, Math.abs(b.D0 - o.D0) / o.D0, Math.abs(b.rE - o.rE), Math.abs(b.rD - o.rD), Math.abs(b.pDefault - o.pDefault));
  }
  truth("the cost of capital is 8% at every ratio and volatility", worstW < 1e-13, worstW.toExponential(1));
  truth("the loan and the shares add up to $100 everywhere", worstV < 1e-11, worstV.toExponential(1));
  truth("proposition II holds with what lenders expect in place of 3%", worstII < 1e-12, worstII.toExponential(1));
  truth("the gap below the straight line is (rD − 3%)·D/E", worstGap < 1e-12, worstGap.toExponential(1));
  truth("the yield's error is D/V × (yield − rD)", worstErr < 1e-12, worstErr.toExponential(1));
  truth("integrating the payoffs gives the same prices, returns and default chance", worstB < 1e-8, worstB.toExponential(1));
}

console.log("-- when the loan isn't safe (25% volatility)");
{
  const o = M.atDE(3);
  eq("at a ratio of 3 the straight line says 23.0%", p1(o.line), 23.0, 0);
  eq("shareholders expect 21.0%", p1(o.rE), 21.0, 0);
  eq("the loan goes unpaid in 12.9% of years", p1(o.pDefault), 12.9, 0);
  eq("lenders expect 3.7%", p1(o.rD), 3.7, 0);
  eq("we owe $78.89", Math.round(o.F * 100) / 100, 78.89, 0);
  let up = true, prev = M.atDE(0.05).rD, below = true;
  for (let de = 0.1; de <= 4.0001; de += 0.05) { const q = M.atDE(de); if (q.rD < prev - 1e-12) up = false; prev = q.rD; if (q.rD > M.RF + 1e-9 && !(q.rE < q.line)) below = false; }
  truth("what lenders expect rises with borrowing", up);
  truth("and shareholders sit below the straight line wherever lenders expect more than 3%", below);
  const lo = M.atDE(3, 0.1);
  eq("at 10% volatility the straight line holds up to a ratio of 3 (23.0%)", p1(lo.rE), 23.0, 0);
  let top = 0;
  for (const s of [0.05, 0.25, 0.45]) for (let de = 0; de <= 4.0001; de += 0.05) top = Math.max(top, M.atDE(de, s).rE, M.mm2(de));
  truth("every line in the lab stays under its 30% top", top < 0.3, (100 * top).toFixed(2) + "%");
}

console.log("-- the yield is a promise");
{
  const o = M.atDE(3);
  eq("the loan promises 5.2%", p1(o.y), 5.2, 0);
  eq("the cost of capital with the yield is 9.15%", p2(o.waccYield), 9.15, 0);
  let up = true, prev = 0;
  for (let de = 0.05; de <= 4.0001; de += 0.05) { const e = M.atDE(de).waccYield - M.RA; if (e < prev - 1e-12) up = false; prev = e; }
  truth("the error grows the more we borrow", up);
  let top = 0;
  for (const s of [0.15, 0.25, 0.4]) top = Math.max(top, M.atDE(0.05, s).waccYield);
  truth("every curve starts inside the chart (above 6%)", top > 0.06);
}

console.log("-- taxes");
{
  eq("a permanent $50 loan at 22% adds $11", M.shieldPermanent(50, 0.22), 11, 1e-12);
  eq("kept at a fixed share of value it adds $4.13", Math.round(M.shieldRebalanced(50, 0.22) * 100) / 100, 4.13, 0);
  let worst = 0;
  for (const t of [0.1, 0.22, 0.35]) for (const D of [10, 50]) worst = Math.max(worst, Math.abs(M.shieldRebalanced(D, t) / M.shieldPermanent(D, t) - 3 / 8));
  truth("three eighths as much, at any tax rate", worst < 1e-12);
  truth("the chart's top ($125) holds a permanent $60 loan at 40%", 100 + M.shieldPermanent(60, 0.4) <= 125);
}

console.log(`\n${n - fails} of ${n} checks pass`);
if (fails) process.exit(1);
