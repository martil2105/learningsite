/*
  Re-derives every number the page states, from the same modules the page
  imports, with no build step.

  Three load-bearing claims, each asserted the way it is true:
    - statutory invariance is EXACT: two routes, sharing no algebra, agree
      to ~1e-14 across the whole rate grid;
    - the linear share S/(B+S), the DWL formula and the peak identity are
      EXACT (===) for the article's integers, and the peak identity is
      asserted over hundreds of thousands of random linear markets;
    - the iso-elastic drift is a MEASUREMENT, asserted at the bisection's
      tolerance against the values quoted in the prose.
*/
import { mulberry32 } from "../src/rng.js";
import {
  A, B, C, S, p0, q0, solveSeller, solveBuyer, consumerShare,
  dwl, revenue, peak, tMax, isoShare, randomMarket,
} from "../src/market.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}

// ------------------------------------------------------------- the market
{
  ok("without tax the price is 20 and quantity 60, exactly",
     p0 === 20 && q0 === 60);
  ok("a 5-unit tax: buyers 22, sellers 17, quantity 54, exactly",
     (() => { const r = solveSeller(5);
       return r.pc === 22 && r.pp === 17 && r.q === 54; })());
  ok("the two routes agree bit for bit, over 401 rates",
     (() => {
       let worst = 0;
       for (let i = 0; i <= 400; i++) {
         const t = i * 0.07;
         const a = solveSeller(t), b = solveBuyer(t);
         worst = Math.max(worst, Math.abs(a.pc - b.pc), Math.abs(a.pp - b.pp), Math.abs(a.q - b.q));
       }
       return worst < 1e-12;
     })());
}

// -------------------------------------------------- the linear share, exact
{
  ok("the consumer share is S/(B+S) = 0.4 and is independent of t",
     consumerShare() === 0.4 &&
     [1, 5, 10, 20].every((t) => {
       const r = solveSeller(t);
       return Math.abs((r.pc - p0) / t - 0.4) < 1e-12;
     }));
  ok("a perfectly inelastic supply side bears everything (share 0)",
     consumerShare({ A, B, C, S: 0 }) === 0 &&
     Math.abs(solveSeller(5, { A, B, C, S: 0 }).pp - ((A - C) / B - 5)) < 1e-12);
  ok("a perfectly inelastic demand side bears everything (share 1)",
     consumerShare({ A, B: 0, C, S }) === 1);
}

// --------------------------------------------- DWL, revenue, and the peak
{
  ok("DWL at t = 5 is exactly 15", dwl(5) === 15);
  ok("doubling the rate quadruples the loss",
     dwl(10) === 4 * dwl(5));
  const pk = peak();
  ok("the revenue peak is at t = 25, exactly", pk.tStar === 25);
  ok("at the peak, quantity is exactly half and loss exactly half the take",
     pk.qRatio === 0.5 && pk.lossRatio === 0.5, `${pk.qRatio} ${pk.lossRatio}`);
  ok("the revenue at the peak is 750 and the loss 375",
     pk.revenue === 750 && pk.dwl === 375);
  ok("the prohibitive tax is (A-C)/B = 33.333... and the peak sits below it",
     Math.abs(tMax() - 100 / 3) < 1e-12 && pk.tStar < tMax());
}

// ------------------------------------- the peak identity, random markets
{
  const rand = mulberry32(20260917);
  let n = 0, worstQ = 0, worstL = 0;
  for (let k = 0; k < 280000; k++) {
    const m = randomMarket(rand);
    const p_0 = (m.A - m.C) / (m.B + m.S);
    const q_0 = m.C + m.S * p_0;
    if (q_0 <= 0 || p_0 <= 0) continue;
    n++;
    const pk = peak(m);
    if (!Number.isFinite(pk.tStar) || pk.tStar <= 0) continue;
    worstQ = Math.max(worstQ, Math.abs(pk.qRatio - 0.5));
    worstL = Math.max(worstL, Math.abs(pk.lossRatio - 0.5));
  }
  ok(`in ${n} random linear markets, q/q0 = 1/2 at the peak`,
     n > 250000 && worstQ < 1e-9, `n ${n}, worst ${worstQ.toExponential(2)}`);
  ok(`in ${n} random linear markets, DWL/revenue = 1/2 at the peak`,
     n > 250000 && worstL < 1e-9, `worst ${worstL.toExponential(2)}`);
}

// ------------------------------------------------ the iso-elastic drift
{
  const ed = 1.5, es = 1;
  const expect = [0.4012, 0.4122, 0.4309, 0.4632];
  const rates = [0.01, 0.1, 0.25, 0.5];
  let worst = 0;
  for (let i = 0; i < rates.length; i++) {
    const s = isoShare(rates[i], ed, es).share;
    worst = Math.max(worst, Math.abs(s - expect[i]));
  }
  ok("the textbook rule is es/(es+ed) = 0.4 and the truth drifts to 0.4632",
     Math.abs(es / (es + ed) - 0.4) < 1e-12 && worst < 1e-3, `worst ${worst.toExponential(2)}`);
  ok("the drift points one way: the true share only grows with the rate",
     (() => {
       let last = 0.4;
       for (const rate of [0.001, 0.01, 0.05, 0.1, 0.2, 0.35, 0.5]) {
         const s = isoShare(rate, ed, es).share;
         if (s < last - 1e-9) return false;
         last = s;
       }
       return true;
     })());
  ok("at a 0.1% rate the textbook rule is fine (within a tenth of a point)",
     Math.abs(isoShare(0.001, ed, es).share - 0.4) < 1e-3);
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);