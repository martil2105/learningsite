/*
  Re-derives every number money-creation's prose states, from src/banks.js.
  The in-step formula is checked against the full settlement computed bank by
  bank (settle), and the balance-sheet steps are checked by reading money and
  reserves off the sheets rather than trusting any running total.
*/
import {
  settle, drain, inStepLoans, applySteps, totalOf, caseSteps,
  multiplierRounds, multiplier, measured, identity, qe, textbookQe,
} from "../src/banks.js";
import { BANKS, OPENING, LOAN, AGG, CURRENCY_RATIO, RESERVE_RATIO, INJECTION, QE_PURCHASE } from "../src/datasets.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const close = (a, b, tol = 1e-12) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// --- the case, step by step -------------------------------------------------------------
const steps = caseSteps(LOAN);
const at = (n) => applySteps(OPENING, steps.slice(0, n));
{
  const s0 = at(0);
  ok("before: €1,000 of deposits, €100 of reserves, €900 of loans",
     totalOf(s0, "deposits") === 1000 && totalOf(s0, "reserves") === 100 && totalOf(s0, "loans") === 900);
  ok("each bank keeps a tenth of its deposits as reserves", BANKS.every((b) => close(s0[b.id].reserves, s0[b.id].deposits / 10)));
  ok("shares are half, 30% and 20%", BANKS.map((b) => b.share).join(",") === "0.5,0.3,0.2");
  ok("the shares match the opening deposits", BANKS.every((b) => close(s0[b.id].deposits / 1000, b.share)));

  const s1 = at(1);
  ok("Anchor lends €100: loans and deposits both up €100, and money is €1,100",
     s1.anchor.loans === 550 && s1.anchor.deposits === 600 && totalOf(s1, "deposits") === 1100);
  ok("…and nobody else's deposit fell", s1.birch.deposits === 300 && s1.cedar.deposits === 200);

  const s2 = at(2);
  ok("the bakery spends: Anchor loses €50 of reserves, every reserve it had", close(s2.anchor.reserves, 0) && close(s0.anchor.reserves - s2.anchor.reserves, 50));
  ok("…half the money stays at Anchor", close(s2.anchor.deposits, 550));
  ok("…and the island still has €1,100 of money", close(totalOf(s2, "deposits"), 1100));

  const s3 = at(3);
  ok("Birch lends €60 and Cedar €40, in proportion to their size", close(s3.birch.loans - s2.birch.loans, 60) && close(s3.cedar.loans - s2.cedar.loans, 40));

  const s4 = at(4);
  ok("after all the payments, every bank has exactly the reserves it started with",
     BANKS.every((b) => close(s4[b.id].reserves, s0[b.id].reserves)));
  ok("…and there are €200 more deposits, exactly what was lent",
     close(totalOf(s4, "deposits") - totalOf(s0, "deposits"), 200) && close(totalOf(s4, "loans") - totalOf(s0, "loans"), 200));

  let unbalanced = 0;
  for (let n = 0; n <= steps.length; n++) {
    const s = at(n);
    for (const b of BANKS) {
      const x = s[b.id];
      if (!close(x.reserves + x.loans + x.bonds, x.deposits + x.equity)) unbalanced++;
    }
  }
  ok("every balance sheet balances at every step", unbalanced === 0, `${unbalanced}`);
  ok("system reserves never change through the case", [0, 1, 2, 3, 4].every((n) => close(totalOf(at(n), "reserves"), 100)));
}

// --- the in-step formula ------------------------------------------------------------------
{
  let worst = 0, sums = 0;
  for (let si = 0.1; si <= 0.9 + 1e-9; si += 0.05) {
    const banks = [{ share: si }, { share: ((1 - si) * 3) / 5 }, { share: ((1 - si) * 2) / 5 }];
    for (let phi = 0; phi <= 1 + 1e-9; phi += 0.05) {
      const loans = inStepLoans(0, phi, LOAN, banks);
      const f = settle(banks.map((b) => b.share), loans);
      worst = Math.max(worst, Math.abs(f[0] - drain(si, phi, LOAN)));
      sums = Math.max(sums, Math.abs(f.reduce((a, v) => a + v, 0)));
    }
  }
  ok("−(1 − s)(1 − φ)L equals the full bank-by-bank settlement over the lab's whole grid", worst < 1e-12, worst.toExponential(2));
  ok("net reserve flows always sum to zero: reserves only move between banks", sums < 1e-12, sums.toExponential(2));
  ok("alone at half the market Anchor loses €50; at a tenth, €90", close(drain(0.5, 0, LOAN), -50) && close(drain(0.1, 0, LOAN), -90));
  ok("fully in step it loses nothing", Math.abs(drain(0.5, 1, LOAN)) < 1e-15 && Math.abs(drain(0.1, 1, LOAN)) < 1e-15);
  ok("lending alone: Birch gains €30 and Cedar €20", (() => { const f = settle([0.5, 0.3, 0.2], [100, 0, 0]); return close(f[1], 30) && close(f[2], 20); })());
}

// --- the multiplier -------------------------------------------------------------------------
{
  const c = CURRENCY_RATIO, r = RESERVE_RATIO;
  ok("with c = r = 0.1 the multiplier is 5.5", close(multiplier(c, r), 5.5));
  const run = multiplierRounds(INJECTION, c, r);
  ok("the textbook rounds turn €100 of reserves into €550 of money (to 1e-9)", Math.abs(run.M - 550) < 1e-9, `${run.M}`);
  ok("…each round lends q = (1 − r)/(1 + c) of the round before",
     run.rounds.slice(1, 10).every((v, i) => close(v / run.rounds[i], (1 - r) / (1 + c))));
  const tb = { C: AGG.C + run.C, D: AGG.D + run.D, R: AGG.R + run.R };
  ok("after the rounds the banks hold exactly the required reserves again, and the ratio is still 5.5",
     close(tb.R / tb.D, r) && close(measured(tb), 5.5, 1e-9));
  ok("opening aggregates: money €1,100, base €200, ratio 5.5", AGG.C + AGG.D === 1100 && AGG.C + AGG.R === 200 && close(measured(AGG), 5.5));
  const q = qe(AGG, QE_PURCHASE);
  ok("€500 of QE from a pension fund adds exactly €500 of money", (q.C + q.D) - (AGG.C + AGG.D) === 500);
  ok("…where the multiplier story predicts €2,750", close(textbookQe(AGG, QE_PURCHASE, c, r).dM, 2750));
  ok("…and the measured ratio falls from 5.5 to 2.29", measured(q).toFixed(2) === "2.29");
  ok("the identity (1 + c)/(c + R/D) equals M/B in every state", [AGG, tb, q].every((s) => close(measured(s), identity(s))));
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);
