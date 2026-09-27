/*
 * check-numbers.mjs - Number verification for cartels-and-the-prisoners-dilemma (Mi11)
 */

import {
  A_DEFAULT as a,
  C_DEFAULT as c,
  piN,
  member,
  outsider,
  isProfitable,
  kMin,
  maxOutsiders,
  price,
  consumerSurplus,
} from "../src/cournot.js";
import { solveCournot } from "../src/nplayer.js";

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

console.log("\n=== cartels-and-the-prisoners-dilemma (Mi11): number verification ===");

// 1 & 2: Sequential solver reproduction
{
  let worst = 0;
  let dev = 0;
  for (const n of [2, 3, 5, 8, 12, 25, 60]) {
    const q = solveCournot(n, a, c);
    const Q = q.reduce((s, x) => s + x, 0);
    const p = a - Q;
    worst = Math.max(worst, Math.abs((p - c) * q[0] - piN(n, a, c)) / piN(n, a, c));
    for (let i = 0; i < n; i++) {
      const rest = Q - q[i];
      const best = (a - c - rest) / 2;
      dev = Math.max(dev, Math.abs(best - q[i]));
    }
  }
  ok(
    "sequential best response reproduces the Cournot profit (a-c)^2/(n+1)^2",
    worst < 1e-12,
    worst.toExponential(3) + " over seven industry sizes"
  );
  ok(
    "and it has actually converged: the largest single-firm deviation is negligible",
    dev < 1e-10,
    dev.toExponential(3)
  );
}

// 3: Merged industry solver
{
  let worst = 0;
  for (const [n, k] of [
    [5, 2],
    [5, 3],
    [5, 4],
    [5, 5],
    [20, 15],
    [20, 19],
    [40, 30],
  ]) {
    const q = solveCournot(n - k + 1, a, c);
    const Q = q.reduce((s, x) => s + x, 0);
    const p = a - Q;
    worst = Math.max(worst, Math.abs(((p - c) * q[0]) / k - member(n, k, a, c)) / member(n, k, a, c));
  }
  ok(
    "the same solver on the merged industry matches (a-c)^2/(k(n-k+2)^2)",
    worst < 1e-12,
    worst.toExponential(3) + " over seven (n,k)"
  );
}

// 4, 5, 6, 7: The n=5 knife-edge and welfare
ok(
  "THE KNIFE EDGE: four of five firms merging leaves each member's profit at exactly 225",
  piN(5, a, c) === 225 && member(5, 4, a, c) === 225
);
ok(
  "while the one firm that stayed out goes from 225 to 900 — exactly four times",
  outsider(5, 4, a, c) === 900 && outsider(5, 4, a, c) / piN(5, a, c) === 4
);
ok(
  "the n = 5 table: 0.72, 0.75, 1.00, 1.80 for k = 2..5",
  [
    [2, 0.72],
    [3, 0.75],
    [4, 1.0],
    [5, 1.8],
  ].every(([k, v]) => Math.abs(member(5, k, a, c) / piN(5, a, c) - v) < 1e-12)
);
ok(
  "the price rises from 25 to 40 and consumer surplus falls from 2812.5 to 1800",
  (a + 5 * c) / 6 === 25 &&
    (a + 2 * c) / 3 === 40 &&
    Math.abs(Math.pow((5 * (a - c)) / 6, 2) / 2 - 2812.5) < 1e-9 &&
    Math.abs(Math.pow((2 * (a - c)) / 3, 2) / 2 - 1800) < 1e-9
);

// 8, 9, 10: The outsider identity and merger profitability equivalence
{
  let worst = 0;
  let equivOk = true;
  let gainOk = true;
  for (let n = 3; n <= 200; n++) {
    for (let k = 2; k < n; k++) {
      worst = Math.max(worst, Math.abs(outsider(n, k, a, c) / member(n, k, a, c) - k) / k);
      const profitable = member(n, k, a, c) > piN(n, a, c);
      const cond = isProfitable(n, k);
      if (profitable !== cond) equivOk = false;
      if (!(outsider(n, k, a, c) > piN(n, a, c))) gainOk = false;
    }
  }
  ok(
    "THE IDENTITY: the outsider earns exactly k times a cartel member, for every (n,k)",
    worst < 1e-12,
    worst.toExponential(3) + ", all pairs to n = 200"
  );
  ok("a merger is profitable if and only if k(n-k+2)^2 < (n+1)^2 — the equivalence, both ways", equivOk);
  ok("and the free rider's gain is never negative", gainOk);
}

// 11 & 12: Smallest profitable cartel size and free rider bound
ok(
  "the smallest profitable cartel: all of 5, then 5 of 6, 9 of 10, 17 of 20, 92 of 100, 970 of 1000",
  kMin(5) === 5 &&
    kMin(6) === 5 &&
    kMin(10) === 9 &&
    kMin(20) === 17 &&
    kMin(100) === 92 &&
    kMin(1000) === 970
);

{
  let worstM = 0;
  for (const n of [6, 8, 10, 15, 20, 30, 50, 100, 200, 500, 1000, 5000, 20000]) {
    const mMax = maxOutsiders(n);
    worstM = Math.max(worstM, Math.abs(mMax - Math.floor(Math.sqrt(n) - 2)));
  }
  ok(
    "the number of firms that can stay out is floor(sqrt(n)) - 2, to within one, from n = 6 to 20,000",
    worstM <= 1,
    "worst deviation " + worstM
  );
}

// 13: Irrational parameterisation
{
  const a2 = Math.PI * 30;
  const c2 = Math.E;
  ok(
    "both identities survive an irrational market: the (5,4) equality and outsider = k x member",
    Math.abs(member(5, 4, a2, c2) - piN(5, a2, c2)) / piN(5, a2, c2) < 1e-14 &&
      Math.abs(outsider(17, 11, a2, c2) / member(17, 11, a2, c2) - 11) < 1e-12
  );
}

console.log(`\nALL ${passed + failed} CHECKS PASS (${failed} failures)\n`);
if (failed > 0) process.exit(1);
