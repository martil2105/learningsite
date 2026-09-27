/*
 * check-numbers.mjs - Number verification for gini-and-the-lorenz-curve (Mi13)
 */

import {
  giniPairs,
  giniCov,
  giniLorenz,
  Phi,
  invPhi,
  gTwo,
  twoPointPop,
  share,
  atkinson,
  topPareto,
  topLognormal,
  auc,
  aucPairs,
  accuracyRatio as ar,
  capture,
} from "../src/inequality.js";

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

function mk(s) {
  let x = s >>> 0;
  return () => {
    x |= 0;
    x = (x + 0x6d2b79f5) | 0;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const normFrom = (r) => {
  let u = 0;
  let v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

console.log("\n=== gini-and-the-lorenz-curve (Mi13): number verification ===");

// 1: Three routes agree
{
  const rand = mk(515151);
  let w1 = 0;
  let w2 = 0;
  for (let r = 0; r < 30; r++) {
    const n = 200 + Math.floor(300 * rand());
    const x = Array.from({ length: n }, () => Math.exp(6 * rand()));
    const A2 = giniPairs(x);
    w1 = Math.max(w1, Math.abs(A2 - giniCov(x)) / A2);
    w2 = Math.max(w2, Math.abs(A2 - giniLorenz(x)) / A2);
  }
  ok(
    "three routes to the Gini agree — it IS the average gap between two people, over twice the mean",
    w1 < 1e-10 && w2 < 1e-10,
    w1.toExponential(3) + " / " + w2.toExponential(3)
  );
}

// 2: Lognormal Gini closed form
{
  const rand = mk(808080);
  const sims = [0.3, 0.5, 0.7416, 1.0].map((s) =>
    giniCov(Array.from({ length: 200000 }, () => Math.exp(s * normFrom(rand))))
  );
  ok(
    "for a lognormal the Gini is exactly 2*Phi(sigma/sqrt(2)) - 1, matched by 200,000 draws",
    [0.3, 0.5, 0.7416, 1.0].every((s, i) => Math.abs(sims[i] - (2 * Phi(s / Math.SQRT2) - 1)) < 3e-3),
    "a sampling tolerance"
  );
}

// 3, 4, 5, 6, 7: Two-point populations and Atkinson crossing
{
  const target = gTwo(0.3, 4, 10);
  let lo = 8.0001;
  let hi = 200;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (gTwo(0.85, 8, m) < target) lo = m;
    else hi = m;
  }
  const y = (lo + hi) / 2;
  const P = twoPointPop(0.3, 4, 10);
  const Q = twoPointPop(0.85, 8, y);

  ok(
    "the two-point Gini closed form p(1-p)(b-a)/mu matches the population",
    Math.abs(giniCov(P) - target) < 1e-9 && Math.abs(target - 0.15365854) < 1e-7
  );
  ok(
    "two populations with the SAME Gini: 30% at 4 / 70% at 10, and 85% at 8 / 15% at 19.7688",
    Math.abs(giniCov(P) - giniCov(Q)) < 1e-9 && Math.abs(y - 19.7688) < 1e-3
  );
  ok(
    "their poorest 30% hold 14.63% and 24.58%, their richest 15% hold 18.29% and 30.37%",
    Math.abs(100 * share(P, 0.3, false) - 14.634) < 0.01 &&
      Math.abs(100 * share(Q, 0.3, false) - 24.577) < 0.01 &&
      Math.abs(100 * share(P, 0.15, true) - 18.293) < 0.01 &&
      Math.abs(100 * share(Q, 0.15, true) - 30.366) < 0.01
  );

  let flips = 0;
  let prev = Math.sign(atkinson(P, 0.02) - atkinson(Q, 0.02));
  for (let e = 0.04; e <= 10; e += 0.02) {
    const s = Math.sign(atkinson(P, e) - atkinson(Q, e));
    if (s !== prev) {
      flips++;
      prev = s;
    }
  }

  let a3 = 0.01;
  let b3 = 1;
  for (let i = 0; i < 200; i++) {
    const m = (a3 + b3) / 2;
    if (atkinson(P, m) - atkinson(Q, m) < 0) a3 = m;
    else b3 = m;
  }
  ok(
    "THE CONSEQUENCE: Atkinson ranks them opposite ways, switching exactly once, at eps = 0.4633",
    flips === 1 && Math.abs((a3 + b3) / 2 - 0.463302) < 1e-4,
    ((a3 + b3) / 2).toFixed(6)
  );
  ok(
    "and at eps = 8 the first reads 0.4210 against the second's 0.1616 — a factor of 2.605",
    Math.abs(atkinson(P, 8) - 0.420963) < 1e-4 &&
      Math.abs(atkinson(Q, 8) - 0.16157) < 1e-4 &&
      Math.abs(atkinson(P, 8) / atkinson(Q, 8) - 2.605) < 1e-2
  );
}

// 8 & 9: Pareto vs Lognormal same Gini 0.4
{
  const G = 0.4;
  const alpha = (1 / G + 1) / 2;
  let lo = 0.01;
  let hi = 5;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (2 * Phi(m / Math.SQRT2) - 1 < G) lo = m;
    else hi = m;
  }
  const sig = (lo + hi) / 2;
  ok(
    "same Gini of 0.4: the Pareto's top 1% holds 13.90% and the lognormal's 5.65% — a factor of 2.46",
    Math.abs(alpha - 1.75) < 1e-12 &&
      Math.abs(sig - 0.741614) < 1e-4 &&
      Math.abs(100 * topPareto(0.01, alpha) - 13.895) < 0.01 &&
      Math.abs(100 * topLognormal(0.01, sig) - 5.651) < 0.05
  );
  ok(
    "and at the top 0.1% it is 5.18% against 0.94% — a factor of 5.50",
    Math.abs(100 * topPareto(0.001, alpha) - 5.1795) < 0.01 &&
      Math.abs(100 * topLognormal(0.001, sig) - 0.9421) < 0.05
  );
}

// 10, 11, 12, 13, 14, 15, 16, 17: Scorecard / Machine Learning half
{
  const rand = mk(616161);
  let worst = 0;
  for (const [m, s] of [
    [1, 1],
    [1.5, 1],
    [0.8, 1.4],
    [2, 0.7],
    [0.4, 2],
  ]) {
    const bad = Array.from({ length: 1200 }, () => m + s * normFrom(rand));
    const good = Array.from({ length: 2400 }, () => normFrom(rand));
    worst = Math.max(worst, Math.abs(auc(bad, good) - aucPairs(bad, good)));
  }
  ok("AUC by ranks and AUC by counting every pair agree EXACTLY on the same sample", worst === 0, worst.toExponential(3));

  const ties = [...Array(300).fill(1), ...Array(300).fill(2)];
  const tg = [...Array(300).fill(1), ...Array(300).fill(0)];
  ok(
    "and they still agree when the scorecard has deliberate ties (midpoint ranks)",
    Math.abs(auc(ties, tg) - aucPairs(ties, tg)) < 1e-12
  );
}

{
  const rand = mk(171717);
  let worst = 0;
  for (const [m, s] of [
    [1, 1],
    [1.5, 1],
    [0.8, 1.4],
    [2, 0.7],
    [0.4, 2],
  ]) {
    const bad = Array.from({ length: 15000 }, () => m + s * normFrom(rand));
    const good = Array.from({ length: 45000 }, () => normFrom(rand));
    worst = Math.max(worst, Math.abs(ar(bad, good) - (2 * auc(bad, good) - 1)));
  }
  ok(
    "THE SAME CONSTRUCTION: the accuracy ratio from the CAP curve equals 2*AUC - 1",
    worst < 1e-10,
    worst.toExponential(3) + " over five scorecards"
  );
}

{
  const r1 = mk(929292);
  const r2 = mk(353535);
  const nB = 30000;
  const nG = 90000;
  const goodA = Array.from({ length: nG }, () => normFrom(r1));
  const badA = Array.from({ length: nB }, () => 1.0 + normFrom(r1));
  const gA = 2 * auc(badA, goodA) - 1;
  const lam = gA;
  const goodB = Array.from({ length: nG }, () => normFrom(r2));
  const badB = Array.from({ length: nB }, (_, i) => (i / nB < lam ? 12 + normFrom(r2) : normFrom(r2)));
  const gB = 2 * auc(badB, goodB) - 1;

  ok(
    "scorecard B built by separating a fraction lambda cleanly has Gini = lambda, as predicted",
    Math.abs(gB - lam) < 5e-3,
    "predicted " + lam.toFixed(6) + ", measured " + gB.toFixed(6)
  );
  ok("so two scorecards can carry the SAME Gini by completely different means", Math.abs(gA - gB) < 5e-3, gA.toFixed(6) + " vs " + gB.toFixed(6));

  const rows = [
    [0.01, 3.353, 4.0],
    [0.05, 14.175, 20.0],
    [0.1, 25.567, 40.0],
    [0.2, 43.293, 55.827],
    [0.5, 77.665, 72.55],
  ];
  ok(
    "and in the top decile they catch 25.6% and 40.0% of bads — 14.4 points apart",
    Math.abs(100 * capture(badA, goodA, 0.1) - 25.567) < 0.6 &&
      Math.abs(100 * capture(badB, goodB, 0.1) - 40.0) < 0.6
  );
  ok(
    "the capture table at five cut-offs, to within its sampling error",
    rows.every(
      ([f, va, vb]) =>
        Math.abs(100 * capture(badA, goodA, f) - va) < 0.6 &&
        Math.abs(100 * capture(badB, goodB, f) - vb) < 0.6
    )
  );
  ok(
    "THE CROSSING: B is ahead at the top and BEHIND at the bottom, so the CAP curves cross",
    capture(badB, goodB, 0.1) > capture(badA, goodA, 0.1) &&
      capture(badB, goodB, 0.5) < capture(badA, goodA, 0.5)
  );
}

console.log(`\nALL ${passed + failed} CHECKS PASS (${failed} failures)\n`);
if (failed > 0) process.exit(1);
