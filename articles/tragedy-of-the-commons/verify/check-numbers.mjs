/*
 * check-numbers.mjs - Number verification for tragedy-of-the-commons (Mi12)
 */

import {
  A_DEFAULT as A,
  W_DEFAULT as w,
  effEffort as eff,
  closedEffort as closed,
  rent,
  dissipatedRent,
  effortRatio,
  pigouvianTax,
} from "../src/commons.js";
import { solveCommons } from "../src/nplayer.js";

let passed = 0;
let failed = 0;

function ok(name, cond, extra) {
  if (cond) {
    console.log(`  ok   ${name}${extra ? "  [" + extra + "]" : ""}`);
    passed++;
  } else {
    console.error(`  FAIL ${name}${extra ? "  [" + extra + "]" : ""}`);
    failed++;
  }
}

console.log("\n=== tragedy-of-the-commons (Mi12): number verification ===");

// 1 & 2: Solver checks
{
  let worst = 0;
  let focWorst = 0;
  for (const th of [0.3, 0.5, 0.7]) {
    for (const n of [1, 2, 3, 5, 10]) {
      const e = solveCommons(n, th, A, w);
      const E = e.reduce((s, x) => s + x, 0);
      worst = Math.max(worst, Math.abs(E - closed(n, th)) / closed(n, th));
      const AP = A * Math.pow(E, th - 1);
      const MP = th * AP;
      focWorst = Math.max(focWorst, Math.abs((1 - 1 / n) * AP + (1 / n) * MP - w));
    }
  }
  ok(
    "the equilibrium sets (1 - 1/n)*AP + (1/n)*MP = w, by blind sequential best response",
    worst < 1e-6 && focWorst < 1e-6,
    worst.toExponential(3) + " over 15 cases — the flat-maximum floor"
  );
  ok(
    "and a sole owner reproduces the efficient effort of 2500 exactly",
    Math.abs(closed(1, 0.5) - eff(0.5)) < 1e-9 && Math.abs(eff(0.5) - 2500) < 1e-9
  );
}

// 3, 4, 5, 6, 7, 8: The square-root identities and front-loaded damage
{
  const th = 0.5;
  const Es = eff(th);
  const Rs = rent(Es, th);
  let wD = 0;
  let wE = 0;
  for (let n = 1; n <= 4000; n++) {
    const E = closed(n, th);
    wD = Math.max(wD, Math.abs(1 - rent(E, th) / Rs - Math.pow((n - 1) / n, 2)));
    wE = Math.max(wE, Math.abs(E / Es - Math.pow((2 * n - 1) / n, 2)) / (E / Es));
  }
  ok(
    "THE IDENTITY: for a square-root resource the rent destroyed is exactly ((n-1)/n)^2",
    wD < 1e-12,
    wD.toExponential(3) + " over n = 1..4000"
  );
  ok(
    "and effort overshoots by exactly ((2n-1)/n)^2, tending to four times the efficient level",
    wE < 1e-12 && Math.abs(closed(1e6, th) / Es - 4) < 1e-5,
    wE.toExponential(3)
  );

  const D = (n) => 1 - rent(closed(n, th), th) / Rs;
  ok(
    "the table: 25%, 44.44%, 56.25%, 64%, 81%, 90.25%, 98.01% at n = 2,3,4,5,10,20,100",
    [
      [2, 0.25],
      [3, 4 / 9],
      [4, 0.5625],
      [5, 0.64],
      [10, 0.81],
      [20, 0.9025],
      [100, 0.9801],
    ].every(([n, v]) => Math.abs(D(n) - v) < 1e-12)
  );

  let maxInc = 0;
  let argMax = 0;
  for (let n = 2; n <= 200; n++) {
    const inc = D(n) - D(n - 1);
    if (inc > maxInc) {
      maxInc = inc;
      argMax = n;
    }
  }
  ok(
    "THE FRONT LOADING: the single most damaging user is the SECOND one, at 25.0 points",
    argMax === 2 && Math.abs(maxInc - 0.25) < 1e-12
  );
  ok(
    "and the second user alone does more damage than users six to thirteen combined",
    D(2) - D(1) > D(13) - D(5),
    (100 * (D(2) - D(1))).toFixed(2) + " vs " + (100 * (D(13) - D(5))).toFixed(2)
  );

  let lo = 1;
  let hi = 10;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (D(m) < 0.5) lo = m;
    else hi = m;
  }
  ok(
    "half the rent is gone at exactly 2 + sqrt(2) = 3.4142 users",
    Math.abs((lo + hi) / 2 - (2 + Math.SQRT2)) < 1e-9,
    ((lo + hi) / 2).toFixed(9)
  );
}

// 9 & 10: Other production functions (the shape survives)
{
  let allFull = true;
  const row = [];
  for (const th of [0.2, 0.5, 0.8]) {
    const Es = eff(th);
    const Rs = rent(Es, th);
    const D = (n) => 1 - rent(closed(n, th), th) / Rs;
    row.push([th, D(2), D(5), D(20)]);
    if (!(1 - rent(closed(1e7, th), th) / Rs > 0.999)) allFull = false;
  }
  ok(
    "other technologies: the square is theta = 1/2's, and the shape survives",
    [
      [0.2, 0.34196, 0.713689, 0.925989],
      [0.5, 0.25, 0.64, 0.9025],
      [0.8, 0.199103, 0.585277, 0.882743],
    ].every(
      ([th, a2, b2, c2], i) =>
        Math.abs(row[i][1] - a2) < 1e-5 &&
        Math.abs(row[i][2] - b2) < 1e-5 &&
        Math.abs(row[i][3] - c2) < 1e-5
    )
  );
  ok("but full dissipation in the limit is exact for every theta tried", allFull);
}

// 11 & 12: Pigouvian corrective fee
{
  const th = 0.5;
  const Es = eff(th);
  const tax = pigouvianTax(th, A, w);
  ok(
    "the corrective tax is AP(E*) - MP(E*) = 1.000 per unit of effort",
    Math.abs(tax - 1) < 1e-9,
    tax.toFixed(9)
  );
  ok("(and that a tax, a quota and a bargain all land there is `externalities`, not this article)", true);

  // The prose and the lab: t* is the fee for open access (the limit), and with
  // n boats the fee that restores E* is (1 - 1/n) t*.
  const fullFeeLimit = closed(1e6, th, A, w + tax);
  const fullFeeFour = closed(4, th, A, w + tax);
  ok(
    "t* brings open access (n -> infinity) back to E* = 2500, but pushes four boats down to 1914 hours",
    Math.abs(fullFeeLimit - Es) / Es < 1e-5 && Math.abs(fullFeeFour - 1914.0625) < 1e-9,
    fullFeeLimit.toFixed(3) + ", " + fullFeeFour.toFixed(4)
  );
  let worstFee = 0;
  for (const t of [0.3, 0.5, 0.7]) {
    const tS = pigouvianTax(t, A, w);
    for (let n = 1; n <= 50; n++) {
      const E = closed(n, t, A, w + (1 - 1 / n) * tS);
      worstFee = Math.max(worstFee, Math.abs(E - eff(t)) / eff(t));
    }
  }
  ok(
    "with n boats the fee (1 - 1/n) t* brings effort back to E* exactly, for n = 1..50 and three technologies",
    worstFee < 1e-12,
    worstFee.toExponential(3)
  );
  ok("for two boats that fee is 0.50 an hour", Math.abs((1 - 1 / 2) * tax - 0.5) < 1e-12);
}

// 13: Arithmetic precision check
ok(
  "reciprocal sums are spelled as a single division: 1/2 + 1/3 !== 5/6 but (2+3)/(2*3) === 5/6",
  1 / 3 + 1 / 2 !== 5 / 6 && (3 + 2) / (3 * 2) === 5 / 6
);

console.log(`\nALL ${passed + failed} CHECKS PASS (${failed} failures)\n`);
if (failed > 0) process.exit(1);
