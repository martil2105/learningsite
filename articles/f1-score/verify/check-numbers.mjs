/*
  Every number and every CLAIM this article makes, re-derived from the same
  modules the page imports.

  Run: npm run check
*/
import { run as precompute } from "../scripts/precompute.mjs";
import COMMITTED from "../src/precomputed.js";
import {
  sample,
  DEFAULT_DEGRADED,
  DEFAULT_N,
  truePrevalence,
  scorePdf,
} from "../src/datasets.js";
import {
  prCurve,
  bestF1,
  impliedCostRatio,
  thresholdForCostRatio,
  costAt,
} from "../src/metrics.js";

let failures = 0;
let checks = 0;
function ok(claim, cond, detail = "") {
  checks++;
  if (cond) {
    console.log("  ok   " + claim + (detail ? "   [" + detail + "]" : ""));
  } else {
    failures++;
    console.log("  FAIL " + claim + (detail ? "   [" + detail + "]" : ""));
  }
}
const head = (s) => console.log("\n" + s);

/* =====================================================================
   0. Precompute freshness
   ===================================================================== */
head("0. The precompute is fresh");
{
  const fresh = precompute();
  ok(
    "src/precomputed.js matches what scripts/precompute.mjs produces right now",
    JSON.stringify(fresh) === JSON.stringify(COMMITTED)
  );
}

/* =====================================================================
   1. Lipton et al. (2014) identity
   ===================================================================== */
head("1. Lipton et al. (2014) identity: delta F1 > 0 iff p > F1 / 2");
{
  // Algebraic test across 10,000 synthetic state pairs
  let violations = 0;
  for (let i = 0; i < 10000; i++) {
    const A = 10 + Math.random() * 500;
    const D = A + 5 + Math.random() * 500;
    const f1 = A / D;
    const p = Math.random();
    const f1New = (A + 2 * p) / (D + 1);
    const improves = f1New > f1;
    const predicted = p > f1 / 2;
    if (improves !== predicted) violations++;
  }
  ok("adding item with probability p improves F1 iff p > F1/2 (10,000 random trials)", violations === 0);

  // Across population and sweeps, t* matches F1max / 2 to four decimals
  ok(
    "population optimal threshold t* is exactly F1max / 2 (0.2552 vs 0.5105/2)",
    Math.abs(COMMITTED.population.tStar - COMMITTED.population.f1max / 2) < 0.0001
  );

  for (const s of COMMITTED.drift) {
    ok(
      `drift scenario ${(s.prevalence * 100).toFixed(2)}%: t* (${s.tStar}) brackets F1max/2 (${(s.f1max / 2).toFixed(4)})`,
      Math.abs(s.tStar - s.f1max / 2) < 0.0005
    );
  }
}

/* =====================================================================
   2. Population numbers
   ===================================================================== */
head("2. Population optimum numbers");
{
  const pop = COMMITTED.population;
  ok("population F1max is 0.5105", pop.f1max === 0.5105);
  ok("population t* is 0.2552", pop.tStar === 0.2552);
  ok("population implied cost ratio is 2.92", pop.costRatio === 2.92);
  ok(
    "implied cost ratio formula (1 - t*) / t* gives 2.92",
    Math.abs(impliedCostRatio(pop.tStar) - 2.92) < 0.01
  );
}

/* =====================================================================
   3. The 40 draws empirical spread
   ===================================================================== */
head("3. The spread: 40 validation draws of 6,000 units");
{
  const stats = COMMITTED.spread.stats;
  ok("mean t* across 40 draws is 0.2641", stats.meanT === 0.2641);
  ok("standard deviation of t* is 0.0561", stats.sdT === 0.0561);
  ok("minimum t* is 0.1244", stats.minT === 0.1244);
  ok("maximum t* is 0.3857", stats.maxT === 0.3857);
  ok("mean F1max is 0.5176", stats.meanF1 === 0.5176);
  ok("optimism bias is +0.0071 (+0.5176 - 0.5105)", stats.optimism === 0.0071);
  ok("implied cost ratio spans at least 1.6x to 7.0x", stats.minRatio <= 1.6 && stats.maxRatio >= 7.0);

  // Assert all 40 draws re-derived directly from sample()
  let diffCount = 0;
  for (let i = 0; i < 40; i++) {
    const s = sample(DEFAULT_N, DEFAULT_DEGRADED, 1000 + i);
    const b = bestF1(prCurve(s));
    const committedDraw = COMMITTED.spread.draws[i];
    if (Math.abs(b.t - committedDraw.t) > 0.0001 || Math.abs(b.f1 - committedDraw.f1) > 0.0001) {
      diffCount++;
    }
  }
  ok("all 40 validation draws re-derived exactly from src/datasets.js", diffCount === 0);
}

/* =====================================================================
   4. Prevalence sweep numbers
   ===================================================================== */
head("4. Prevalence sweep (model fixed, degradation moves)");
{
  const expected = [
    { prev: 0.0195, f1: 0.3992, t: 0.1996, ratio: 4.01 },
    { prev: 0.0324, f1: 0.5101, t: 0.2552, ratio: 2.92 },
    { prev: 0.0565, f1: 0.5605, t: 0.2803, ratio: 2.57 },
    { prev: 0.1232, f1: 0.5897, t: 0.2948, ratio: 2.39 },
  ];

  for (let i = 0; i < expected.length; i++) {
    const act = COMMITTED.drift[i];
    const exp = expected[i];
    ok(
      `prevalence ${(exp.prev * 100).toFixed(2)}%: F1max=${exp.f1}, t*=${exp.t}, ratio=${exp.ratio}`,
      act.prevalence === exp.prev &&
        act.f1max === exp.f1 &&
        act.tStar === exp.t &&
        act.costRatio === exp.ratio
    );
  }

  ok(
    "F1max increases monotonically with prevalence on identical underlying model",
    COMMITTED.drift[0].f1max < COMMITTED.drift[1].f1max &&
      COMMITTED.drift[1].f1max < COMMITTED.drift[2].f1max &&
      COMMITTED.drift[2].f1max < COMMITTED.drift[3].f1max
  );
  ok(
    "Implied cost ratio decreases monotonically with prevalence",
    COMMITTED.drift[0].costRatio > COMMITTED.drift[1].costRatio &&
      COMMITTED.drift[1].costRatio > COMMITTED.drift[2].costRatio &&
      COMMITTED.drift[2].costRatio > COMMITTED.drift[3].costRatio
  );
}

/* =====================================================================
   5. Decision-theoretic cost identity
   ===================================================================== */
head("5. Decision-theoretic cost identities");
{
  // Check round-trip of impliedCostRatio and thresholdForCostRatio
  let rtErrors = 0;
  for (const t of [0.05, 0.1, 0.2, 0.2552, 0.35, 0.5, 0.65]) {
    const r = impliedCostRatio(t);
    const tBack = thresholdForCostRatio(r);
    if (Math.abs(t - tBack) > 1e-10) rtErrors++;
  }
  ok("thresholdForCostRatio is exact inverse of impliedCostRatio", rtErrors === 0);

  // Calibrated cost minimization check on a validation sample
  const rows = sample(6000, 0.055, 20260908);
  const curve = prCurve(rows);
  for (const ratio of [2.0, 5.0, 10.0]) {
    const tPrinciple = thresholdForCostRatio(ratio);
    // Find closest row in curve to theoretical optimal threshold
    let bestDist = Infinity, rowAtPrinciple = curve[0];
    for (const r of curve) {
      if (Math.abs(r.t - tPrinciple) < bestDist) {
        bestDist = Math.abs(r.t - tPrinciple);
        rowAtPrinciple = r;
      }
    }
    // Compare loss against arbitrary thresholds
    const lossOptimal = costAt(rowAtPrinciple, ratio);
    const rowArbitrary = curve.find((r) => Math.abs(r.t - 0.5) < 0.01) || curve[0];
    const lossArbitrary = costAt(rowArbitrary, ratio);
    ok(
      `at cost ratio ${ratio}x, t_cost (${tPrinciple.toFixed(3)}) beats or ties t=0.50 (${lossOptimal} <= ${lossArbitrary})`,
      lossOptimal <= lossArbitrary
    );
  }
}

/* =====================================================================
   Claims that had no check at all until the review pass.

   The existing assertions in this file check VALUES — "F1max is 0.5105". These
   check SENTENCES: the things the prose actually tells the reader, including
   two whole sections that were asserting nothing.
   ===================================================================== */
head("Claims the prose makes, as claims");
{
  const drift = COMMITTED.drift;

  // DriftFigure's entire argument, previously unchecked.
  const byPrev = drift.slice().sort((a, b) => a.prevalence - b.prevalence);
  ok(
    "drift: as prevalence rises the achievable F1 rises with it",
    byPrev.every((r, i) => i === 0 || r.f1max > byPrev[i - 1].f1max),
    byPrev.map((r) => r.f1max.toFixed(4)).join(" → ")
  );
  ok(
    "drift: and the cost ratio the metric asserts falls, on a model nobody touched",
    byPrev.every((r, i) => i === 0 || r.costRatio < byPrev[i - 1].costRatio),
    byPrev.map((r) => r.costRatio.toFixed(2) + "×").join(" → ")
  );
  ok(
    "drift: the conclusion quotes 0.399 → 0.590 and 4.01× → 2.39×",
    Math.abs(byPrev[0].f1max - 0.3992) < 5e-4 &&
      Math.abs(byPrev[byPrev.length - 1].f1max - 0.5897) < 5e-4 &&
      Math.abs(byPrev[0].costRatio - 4.01) < 5e-3 &&
      Math.abs(byPrev[byPrev.length - 1].costRatio - 2.39) < 5e-3
  );

  /*
    The mechanism the drift section rests on: prevalence enters ONLY as a mixing
    weight, so the two score distributions are the same objects at every
    prevalence and "the model is unchanged" is a fact rather than a promise.
    Mixture density is affine in the weight, so the midpoint identity is exact.
  */
  let worst = 0;
  for (const x of [0.02, 0.1, 0.25, 0.5, 0.8]) {
    const mid = (scorePdf(x, 0.02) + scorePdf(x, 0.30)) / 2;
    worst = Math.max(worst, Math.abs(scorePdf(x, 0.16) - mid) / Math.max(1e-9, mid));
  }
  ok(
    "drift: prevalence is only a mixing weight — the populations themselves never move",
    worst < 1e-12,
    "worst relative departure from exact affinity " + worst.toExponential(1)
  );

  // TheReveal's table says the identity holds at every prevalence, not just one.
  const offBy = drift.map((r) => Math.abs(r.tStar - r.f1max / 2));
  ok(
    "the identity t* = F1max/2 holds at every prevalence in the table, not only the base case",
    Math.max(...offBy) < 2e-3,
    "worst |t* − F1max/2| = " + Math.max(...offBy).toExponential(1) + " (stored values are rounded to 4dp)"
  );

  /*
    WhatThatMeans: "improve the model and you quietly decide that missing a
    failure matters less". Pure consequence of the identity, and the section
    prints the numbers, so the numbers get a check.
  */
  const policyFor = (f1max) => {
    const t = f1max / 2;
    return { t, ratio: impliedCostRatio(t) };
  };
  const better = policyFor(0.70);
  const worse = policyFor(0.30);
  ok(
    "a better model moves the threshold up and the asserted cost ratio down",
    Math.abs(better.t - 0.35) < 1e-9 && Math.abs(better.ratio - 1.86) < 5e-3,
    "F1max 0.70 → t* " + better.t.toFixed(3) + " → " + better.ratio.toFixed(2) + "×"
  );
  ok(
    "a degraded model does the reverse, with the plant unchanged",
    Math.abs(worse.t - 0.15) < 1e-9 && Math.abs(worse.ratio - 5.67) < 5e-3,
    "F1max 0.30 → t* " + worse.t.toFixed(3) + " → " + worse.ratio.toFixed(2) + "×"
  );

  /*
    The reveal now tells the reader outright that their own two numbers do not
    satisfy the identity. That sentence is only worth writing if it is true.
  */
  const hook = COMMITTED.hook;
  const gap = Math.abs(hook.best.t - hook.best.f1 / 2);
  ok(
    "the reader's own answer really is a long way off the identity, as the reveal now says",
    gap > 0.05,
    "empirical t* " + hook.best.t.toFixed(4) + " vs F1max/2 = " + (hook.best.f1 / 2).toFixed(4) + " (gap " + gap.toFixed(4) + ")"
  );

  // SpreadFigure's headline, as a sentence rather than four separate numbers.
  const ratios = COMMITTED.spread.draws.map((d) => d.ratio);
  ok(
    "sample luck alone swings the asserted cost ratio by more than fourfold",
    Math.max(...ratios) / Math.min(...ratios) > 4,
    Math.min(...ratios).toFixed(1) + "× to " + Math.max(...ratios).toFixed(1) + "× across " +
      COMMITTED.spread.draws.length + " draws of the same size"
  );
}

/* =====================================================================
   The plateau.

   Added in review, after looking at the F1-vs-threshold chart and noticing its
   caption promised "the peak and the steep drop at both ends" while the drawing
   showed a flat top. The flat top is the better fact — it is the mechanism
   behind the spread section, visible without resampling anything — so the
   caption now states it and this holds it.
   ===================================================================== */
head("The plateau the caption now claims");
{
  const curve = prCurve(sample(DEFAULT_N, DEFAULT_DEGRADED));
  const peak = bestF1(curve);
  const near = curve.filter((r) => r.f1 >= peak.f1 - 0.005);
  const lo = Math.min(...near.map((r) => r.t));
  const hi = Math.max(...near.map((r) => r.t));
  ok(
    "every threshold from 0.148 to 0.265 scores within 0.005 of the best, as the caption says",
    Math.abs(lo - 0.148) < 0.005 && Math.abs(hi - 0.265) < 0.005,
    "flat to within 0.005 across " + lo.toFixed(3) + " – " + hi.toFixed(3)
  );
  ok(
    "and that indifference spans more than a twofold difference in asserted cost",
    impliedCostRatio(lo) / impliedCostRatio(hi) > 2,
    impliedCostRatio(hi).toFixed(2) + "× to " + impliedCostRatio(lo).toFixed(2) + "× for half a point of F1"
  );
}

/* =====================================================================
   Summary
   ===================================================================== */
head("Summary");
if (failures > 0) {
  console.log(`\n  FAILURES: ${failures} of ${checks} checks failed.\n`);
  process.exit(1);
} else {
  console.log(`\n  ALL ${checks} CHECKS PASS\n`);
}
