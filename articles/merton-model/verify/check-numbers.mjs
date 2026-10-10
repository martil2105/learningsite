// Every number on the page, from src/merton.js, in page order and rounded as
// the page rounds. The solver is checked against both clues, the equation for
// the market's chance against a direct computation and the equal Sharpe ratio
// of shares and assets by quadrature, and Black and Cox's formula against a
// simulation with fine steps.
import * as M from "../src/merton.js";
import { normals } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2);
const pc0 = (x) => r0(100 * x), pc1 = (x) => r1(100 * x), pc2 = (x) => r2(100 * x);

const x = M.solve();
const LAM = 0.2;

console.log("-- the firm and the two clues");
{
  eq("it owes $70, due in a year, at a safe rate of 3%", M.F + M.T + M.R, 71.03, 1e-12);
  eq("the shares are worth $30", x.E, 30, 1e-9);
  eq("and move 60% a year", x.sE, 0.6, 1e-9);
  // the shares really are a call: payoff max(V - F, 0) priced by integration under the safe rate
  const nq = 20001, zmax = 9; let call = 0;
  for (let i = 0; i < nq; i++) {
    const z = -zmax + (2 * zmax * i) / (nq - 1), w = (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)) * (2 * zmax / (nq - 1));
    const VT = x.V * Math.exp((M.R - x.s * x.s / 2) * M.T + x.s * Math.sqrt(M.T) * z);
    call += w * Math.max(VT - M.F, 0);
  }
  eq("Black and Scholes's formula is the discounted average payoff of the call", x.E, Math.exp(-M.R * M.T) * call, 1e-6);
  eq("the assets are worth $97.78", r2(x.V), 97.78, 0);
  eq("and move 18.81% a year", pc2(x.s), 18.81, 0);
  eq("guess card: 18.8%", pc1(x.s), 18.8, 0);
  truth("under a third as much as the shares", x.s < x.sE / 3);
  // the solution lies on both curves
  eq("on the blue curve: shares worth $30 at this volatility", M.assetsFor(30, x.s), x.V, 1e-9);
  eq("on the pink curve: shares moving 60% at this volatility", M.assetsForVol(0.6, x.s), x.V, 1e-7);
  // the blue curve is nearly flat, near E + PV(F)
  const pv = 30 + M.F * Math.exp(-M.R * M.T);
  truth("shares this far from default are worth almost the assets minus the debt's value today", Math.abs(x.V - pv) < 0.2, `${x.V.toFixed(2)} vs ${pv.toFixed(2)}`);
  const a05 = M.assetsFor(30, 0.05), a30 = M.assetsFor(30, 0.3), b10 = M.assetsForVol(0.6, 0.1), b30 = M.assetsForVol(0.6, 0.3);
  truth("the blue curve moves under $2 from 5% to 30% volatility; the pink one moves $54", a05 - a30 < 2 && b30 - b10 > 50, `${(a05 - a30).toFixed(2)} vs ${(b30 - b10).toFixed(2)}`);
  // dragging the share volatility up moves the circle right along an almost flat line
  const y = M.solve(30, 0.9);
  truth("at 90% share volatility the assets are much the same and riskier", Math.abs(y.V - x.V) < 2 && y.s > x.s * 1.4, `${y.V.toFixed(2)} ${(100 * y.s).toFixed(1)}%`);
  // dragging the share value down: the assets end up closer to the debt
  const z = M.solve(15, 0.6);
  truth("shares worth $15 at 60%: the assets are closer to the debt", z.V < x.V && z.d2 < x.d2, `${z.V.toFixed(2)} ${z.d2.toFixed(2)}`);
  // every slider position solves
  let worst = 0;
  for (let e = 10; e <= 50; e += 2.5) for (let s = 0.3; s <= 1.2001; s += 0.05) { const f = M.solve(e, s); worst = Math.max(worst, Math.abs(f.E - e) / e, Math.abs(f.sE - s) / s); }
  eq("the solver matches both clues everywhere on the sliders", worst, 0, 1e-8);
}

console.log("-- why the shares move more");
{
  eq("the shares move 3.19 times as much as the assets", r2(x.lever), 3.19, 0);
  eq("$30 of claims on $97.78: a 1% move is about 3.3%", r1(x.V / x.E), 3.3, 0);
  eq("N(d1) is 0.98", r2(x.delta), 0.98, 0);
  const f10 = M.firm(x.V * 0.9, x.s), f20 = M.firm(x.V * 0.8, x.s);
  eq("assets down 10%: the shares lose 31%", pc0(1 - f10.E / x.E), 31, 0);
  eq("their volatility rises from 60%", pc0(x.sE), 60, 0);
  eq("to 75%", pc0(f10.sE), 75, 0);
  eq("the chance of default goes from 3.27%", pc2(x.pdQ), 3.27, 0);
  eq("to 9.99%", pc2(f10.pdQ), 9.99, 0);
  eq("which triples it", r0(f10.pdQ / x.pdQ), 3, 0);
  eq("a 20% fall: the shares lose 60%", pc0(1 - f20.E / x.E), 60, 0);
  eq("and move 97%", pc0(f20.sE), 97, 0);
  truth("the multiple grows as the assets fall", f20.lever > f10.lever && f10.lever > x.lever);
  truth("the slider's grid holds −10% and −20%", Math.abs(-0.1 / 0.01 - Math.round(-0.1 / 0.01)) < 1e-9 && Math.abs(-0.2 / 0.01 - Math.round(-0.2 / 0.01)) < 1e-9);
}

console.log("-- distance to default");
{
  eq("our firm is 1.84 standard deviations from default", r2(x.d2), 1.84, 0);
  eq("the chance of ending below $70 is N(−d2) = 3.27%", pc2(M.Phi(-x.d2)), 3.27, 0);
}

console.log("-- whose chance");
{
  const mu = M.R + LAM * x.s;
  const p = M.pdP(x.V, x.s, mu);
  eq("the equation: the market's chance from the real one, shifted by λ√T", M.Phi(M.PhiInv(p) + LAM * Math.sqrt(M.T)), x.pdQ, 1e-9);
  eq("and back", M.pdFromQ(x.pdQ, LAM), p, 1e-9);
  // the shares and the assets have the same Sharpe ratio, moment by moment
  for (const lam of [0.2, 0.4]) {
    const m = M.R + lam * x.s, dt = 1e-4;
    const exp = (drift) => { let a = 0; const nq = 4001, zmax = 8; for (let i = 0; i < nq; i++) { const z = -zmax + (2 * zmax * i) / (nq - 1); const w = (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)) * (2 * zmax / (nq - 1)); const V = x.V * Math.exp((drift - x.s * x.s / 2) * dt + x.s * Math.sqrt(dt) * z); a += w * M.firm(V, x.s, M.F, M.T - dt).E; } return a; };
    const excess = (exp(m) - exp(M.R)) / x.E / dt;
    eq(`the shares' Sharpe ratio equals the assets' (${lam})`, excess / x.sE, lam, 1e-3);
  }
  eq("a typical firm: 0.5 × 0.4 = 0.2", 0.5 * 0.4, LAM, 1e-12);
  eq("our firm's real chance of default is 2.06%", pc2(p), 2.06, 0);
  eq("the market's 3.27% is 1.59 times as large", r2(x.pdQ / p), 1.59, 0);
  const s = M.solve(M.SAFE.E, M.SAFE.sE, M.SAFE.F);
  const ps = M.pdP(s.V, s.s, M.R + LAM * s.s, M.SAFE.F);
  eq("the safer firm: shares $40, moving 45%, debt $60", M.SAFE.E + M.SAFE.sE + M.SAFE.F, 100.45, 1e-12);
  eq("its market's chance is 0.29%", pc2(s.pdQ), 0.29, 0);
  eq("its real chance is 0.16%", pc2(ps), 0.16, 0);
  eq("ratio 1.88", r2(s.pdQ / ps), 1.88, 0);
  truth("the ratio is larger in the tail", s.pdQ / ps > x.pdQ / p);
  // ten years: the ratio is several times larger again, at our firm's real chance
  const r10 = M.Phi(M.PhiInv(p) + LAM * Math.sqrt(10)) / p;
  eq("a ten-year loan with our firm's real chance: ratio 3.86", r2(r10), 3.86, 0);
  eq("at a Sharpe ratio of zero the two agree", M.pdP(x.V, x.s, M.R), x.pdQ, 1e-12);
  truth("the slider holds 0.2 and 0", Math.abs(0.2 / 0.01 - Math.round(0.2 / 0.01)) < 1e-9);
}

console.log("-- default before the debt is due");
{
  const mu = M.R + LAM * x.s;
  const pe = M.pdP(x.V, x.s, mu), pt = M.firstPassage(x.V, x.s, mu);
  eq("2.06% of years end below the debt", pc2(pe), 2.06, 0);
  eq("4.60% touch it", pc2(pt), 4.6, 0);
  truth("more than twice as many", pt > 2 * pe, (pt / pe).toFixed(3));
  // no drift in the log: exactly twice
  const s = x.s, m0 = (s * s) / 2;
  eq("with no drift it would be exactly twice", M.firstPassage(x.V, s, m0) / M.pdP(x.V, s, m0), 2, 1e-12);
  // a fine-stepped simulation agrees with Black and Cox's formula
  const g = normals(7), paths = 20000, steps = 2000, dt = 1 / steps, a = (mu - s * s / 2) * dt, b = s * Math.sqrt(dt), lb = Math.log(M.F / x.V);
  let hit = 0, below = 0;
  for (let p = 0; p < paths; p++) { let l = 0, h = false; for (let i = 0; i < steps; i++) { l += a + b * g(); if (l < lb) h = true; } if (h) hit++; if (l < lb) below++; }
  const se = Math.sqrt(pt * (1 - pt) / paths);
  // daily-style monitoring misses about 0.5826·σ√dt of the barrier; shift it for the comparison
  const shifted = M.firstPassage(x.V * Math.exp(0.5826 * b), s, mu);
  truth("simulated touches agree with the formula (barrier shifted for the steps)", Math.abs(hit / paths - shifted) < 4 * se, `${(hit / paths * 100).toFixed(2)}% vs ${(shifted * 100).toFixed(2)}% ± ${(se * 100).toFixed(2)}`);
  truth("simulated ends agree with Merton's", Math.abs(below / paths - pe) < 4 * Math.sqrt(pe * (1 - pe) / paths), `${(below / paths * 100).toFixed(2)}%`);
  // the drawn sample: seed 105, 200 paths, 100 steps
  const P = M.paths(x.V, x.s, mu, normals(105), 200, 100);
  eq("the chart's 4 pink lines under Merton's rule", P.filter((q) => q[100] < M.F).length, 4, 0);
  eq("become 9 when touching counts", P.filter((q) => q.some((v) => v < M.F)).length, 9, 0);
  truth("the chart's paths stay inside $60 to $170", P.every((q) => q.every((v) => v > 60 && v < 170)));
}

console.log("-- what this costs you");
{
  eq("Merton's lenders get back 93 cents on the dollar in default", pc0(x.recovery), 93, 0);
  // recovery checked by integration: E_Q[V_T | V_T < F] / F
  const nq = 20001, zmax = 9; let num = 0, den = 0;
  for (let i = 0; i < nq; i++) {
    const z = -zmax + (2 * zmax * i) / (nq - 1), w = (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)) * (2 * zmax / (nq - 1));
    const VT = x.V * Math.exp((M.R - x.s * x.s / 2) * M.T + x.s * Math.sqrt(M.T) * z);
    if (VT < M.F) { num += w * VT; den += w; }
  }
  eq("the recovery by integration (to the grid's step at the kink)", num / den / M.F, x.recovery, 1e-3);
  eq("they'd charge only 0.23 points over the safe rate", pc2(x.spread), 0.23, 0);
  eq("debt + shares = assets", x.D + x.E, x.V, 1e-12);
}

console.log(`\n${fails ? fails + " FAILED of " + n : "ALL " + n + " CHECKS PASS"}`);
process.exit(fails ? 1 : 0);
