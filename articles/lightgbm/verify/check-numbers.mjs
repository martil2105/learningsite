/*
  Every claim this article makes, re-derived from the same modules the page
  imports:

      npm run check          (or: node verify/check-numbers.mjs)

  The first section is the one that matters most. Unlike the other articles in
  this project, this one does not compute its sweeps in the browser - twelve
  boosted forests is several seconds - so they are committed as
  src/precomputed.js. That is only safe if a stale file is a loud failure, so
  the check re-runs every one of those fits and compares. Nothing else here
  works if that section is red.

  The rest checks the sentences: that the histogram's split can never beat the
  exact one, that the subtraction identity actually holds bin by bin, and above
  all that the article's central and least obvious claim - the histogram on its
  own touches as many rows as the pre-sorted scan - is still true of the code.
*/
import { computeAll } from "../scripts/precompute.mjs";
import COMMITTED from "../src/precomputed.js";
import { TRAIN_COLS, TRAIN_Y, TEST_COLS, TEST_Y, FEATURES, N_TRAIN, N_TEST, NEEDLE_LO, NEEDLE_HI } from "../src/datasets.js";
import { fit } from "../src/gbdt.js";
import {
  binEdges, binizeColumn, newHistogram, buildHistogram, subtractHistogram,
  histogramBestSplit, argsortIndices, exactBestSplit, bytesPerValue, resetCounters,
} from "../src/binning.js";
import {
  BINNED, BIN_SETTINGS, EXACT_CURVE, EXACT_BEST, kept, BIN_SWEEP, LEAF_FLOOR,
  firstWithin, NEEDLE, NEEDLE_ROW, SPLIT_TRACE, N_SPLITS, SPLITS_BELOW_BINS,
  GAIN_EVAL_RATIO, ROW_TOUCH_RATIO, NOSUB_VS_EXACT, SUBTRACT_SAVING, ACCURACY_COST,
  EDGE_SETS, STOPS, CONFIG, compact, pct, times,
} from "../src/experiments.js";

let failures = 0;
const ok = (label, condition, detail = "") => {
  console.log((condition ? "  PASS  " : "  FAIL  ") + label + (detail ? "   " + detail : ""));
  if (!condition) failures++;
};
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

console.log("\n--- the committed precompute is not stale ---");
{
  const fresh = computeAll();
  const diffs = [];
  const walk = (a, b, path) => {
    if (typeof a === "number" && typeof b === "number") {
      if (!near(a, b, 1e-9)) diffs.push(path + ": " + a + " != " + b);
    } else if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) diffs.push(path + ": length " + a.length + " != " + b.length);
      else a.forEach((v, i) => walk(v, b[i], path + "[" + i + "]"));
    } else if (a && b && typeof a === "object" && typeof b === "object") {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const k of keys) walk(a[k], b[k], path + "." + k);
    } else if (a !== b) diffs.push(path + ": " + a + " != " + b);
  };
  walk(fresh, COMMITTED, "");
  ok("src/precomputed.js matches a fresh run of scripts/precompute.mjs",
     diffs.length === 0, diffs.length ? diffs.length + " differences, first: " + diffs[0] : "");
  if (diffs.length) console.log("        run: node scripts/precompute.mjs");
}

console.log("\n--- the data is what the prose says it is ---");
ok("row counts", N_TRAIN === 6000 && N_TEST === 3000, N_TRAIN + " train, " + N_TEST + " test");
ok("three continuous columns and one small-integer one",
   EDGE_SETS.filter((e) => e.distinct > 1000).length === 3 && STOPS.distinct < 32,
   EDGE_SETS.map((e) => e.key + ":" + e.distinct).join(" "));
ok("the exact scan has one candidate per distinct value, less the ends",
   EXACT_CURVE.length > 5000 && EXACT_CURVE.length < N_TRAIN, EXACT_CURVE.length + " candidates");

console.log("\n--- the histogram can never beat the exact split ---");
{
  // Every bin edge is an actual data value, so the histogram's candidates are a
  // SUBSET of the exact scan's. This is a guarantee, not an observation.
  let worst = 0;
  for (const b of BINNED) worst = Math.max(worst, b.best.gain - EXACT_BEST.gain);
  ok("no bin setting scores above the exact optimum", worst <= 1e-6, "largest excess " + worst.toExponential(2));
  ok("255 bins keeps essentially all of it", kept(BINNED[BIN_SETTINGS.length - 1]) > 0.99,
     pct(kept(BINNED[BIN_SETTINGS.length - 1]), 2));
  ok("2 bins does not", kept(BINNED[0]) < 0.75, pct(kept(BINNED[0]), 2));
  // Observed rather than guaranteed: quantile edges at B bins are not a subset
  // of the edges at 2B, so a coarser setting could in principle get luckier.
  // It does not here, and if that ever changes the hook's caption needs looking at.
  ok("gain kept is non-decreasing in the bin count (observed, not guaranteed)",
     BINNED.every((b, i) => i === 0 || kept(b) >= kept(BINNED[i - 1]) - 1e-12),
     BINNED.map((b) => pct(kept(b), 1)).join(" "));
  ok("every candidate threshold is a real bin edge",
     BINNED.every((b) => b.candidates.every((c) => b.edges.includes(c.threshold))));
  ok("a byte per value at 255 bins", BINNED[BIN_SETTINGS.length - 1].bytesPerValue === 1);
}

console.log("\n--- the subtraction identity holds bin by bin ---");
{
  resetCounters();
  const edges = binEdges(TRAIN_COLS[0], 255, { minDataInBin: CONFIG.minDataInBin });
  const binned = binizeColumn(TRAIN_COLS[0], edges);
  const nB = edges.length + 1;
  const grad = Float64Array.from(TRAIN_Y, (y) => y * 0.37 - 1.1);
  const hess = new Float64Array(N_TRAIN).fill(1);
  const all = Int32Array.from({ length: N_TRAIN }, (_, i) => i);
  const left = [];
  const right = [];
  for (let i = 0; i < N_TRAIN; i++) (TRAIN_COLS[1][i] < 3.0 ? left : right).push(i);
  const hp = buildHistogram(newHistogram(nB), binned, all, grad, hess);
  const hl = buildHistogram(newHistogram(nB), binned, Int32Array.from(left), grad, hess);
  const hr = buildHistogram(newHistogram(nB), binned, Int32Array.from(right), grad, hess);
  const derived = subtractHistogram(newHistogram(nB), hp, hl);
  let worstG = 0;
  let worstC = 0;
  for (let b = 0; b < nB; b++) {
    worstG = Math.max(worstG, Math.abs(derived.g[b] - hr.g[b]));
    worstC = Math.max(worstC, Math.abs(derived.c[b] - hr.c[b]));
  }
  ok("parent minus one child equals the other child", worstG < 1e-8 && worstC === 0,
     "largest gradient discrepancy " + worstG.toExponential(2));
  ok("the derived histogram finds the same split as the built one", (() => {
    const p = { lambda: CONFIG.lambda, gamma: CONFIG.gamma, minDataInLeaf: CONFIG.minDataInLeaf };
    const a = histogramBestSplit(hr, p);
    const b = histogramBestSplit(derived, p);
    return a.bin === b.bin && near(a.gain, b.gain, 1e-9);
  })());
  resetCounters();
}

console.log("\n--- the article's central claim about where the speed comes from ---");
ok("the histogram alone touches as many rows as the pre-sorted scan",
   NOSUB_VS_EXACT > 0.85 && NOSUB_VS_EXACT < 1.15,
   compact(COMMITTED.histNoSubtract.rowTouches) + " vs " + compact(COMMITTED.exact.rowTouches) +
   " = " + times(NOSUB_VS_EXACT));
ok("the subtraction removes most of the histogram's row work", SUBTRACT_SAVING > 0.5,
   pct(SUBTRACT_SAVING, 1));
ok("...and that is the whole row saving", ROW_TOUCH_RATIO > 2.5, times(ROW_TOUCH_RATIO));
ok("gain evaluations fall several-fold", GAIN_EVAL_RATIO > 4, times(GAIN_EVAL_RATIO));
ok("but not a thousandfold, because nodes shrink below the bin count",
   GAIN_EVAL_RATIO < 50, times(GAIN_EVAL_RATIO));
ok("some splits happen on nodes smaller than the bin count",
   SPLITS_BELOW_BINS > 0 && SPLITS_BELOW_BINS < N_SPLITS,
   SPLITS_BELOW_BINS + " of " + N_SPLITS);
ok("the root is the largest node and holds every row",
   Math.max(...SPLIT_TRACE.map((s) => s.nodeSize)) === N_TRAIN);
ok("smaller children really are smaller",
   SPLIT_TRACE.every((s) => s.smaller <= s.nodeSize / 2 + 1e-9));
ok("binning costs under 1% of held-out error", ACCURACY_COST < 0.01 && ACCURACY_COST > 0, pct(ACCURACY_COST, 2));
ok("the exact model is not beaten on training error", COMMITTED.hist.train >= COMMITTED.exact.train - 1e-9,
   COMMITTED.hist.train.toFixed(3) + " vs " + COMMITTED.exact.train.toFixed(3));

console.log("\n--- 'so how many bins do you need' ---");
{
  ok("held-out error falls at every step up in bin count",
     BIN_SWEEP.every((r, i) => i === 0 || r.test < BIN_SWEEP[i - 1].test),
     BIN_SWEEP.map((r) => r.test.toFixed(2)).join(" "));
  const s32 = BIN_SWEEP.find((r) => r.maxBin === 32);
  const s255 = BIN_SWEEP[BIN_SWEEP.length - 1];
  ok("32 bins costs real accuracy, not a rounding error", s32.excess > 0.15, pct(s32.excess, 1));
  ok("...and saves almost no row work, which is the point",
     Math.abs(s32.rowTouches - s255.rowTouches) / s255.rowTouches < 0.15,
     compact(s32.rowTouches) + " vs " + compact(s255.rowTouches));
  ok("...while gain evaluations do fall a lot", s255.gainEvals / s32.gainEvals > 4,
     times(s255.gainEvals / s32.gainEvals));
  const firsts = LEAF_FLOOR.map((r) => firstWithin(r, 0.03));
  ok("a looser leaf floor needs fewer bins",
     firsts.slice(1).every((v, i) => v === null || firsts[i] === null || v <= firsts[i]),
     LEAF_FLOOR.map((r, i) => r.minDataInLeaf + "->" + firsts[i]).join("  "));
  ok("at the default floor the answer is the default bin count",
     firstWithin(LEAF_FLOOR[1], 0.03) === 255 && LEAF_FLOOR[1].minDataInLeaf === 20);
  ok("the tightest floor is not satisfied by any binning tried",
     firstWithin(LEAF_FLOOR[0], 0.03) === null,
     "255 bins is still " + pct(LEAF_FLOOR[0].bins[LEAF_FLOOR[0].bins.length - 1].excess, 1) + " short");
}

console.log("\n--- 'where the bins bite' ---");
ok("no bin edge falls inside the window at 8 bins", NEEDLE_ROW(8).edgesInWindow === 0);
ok("several do at 255", NEEDLE_ROW(255).edgesInWindow >= 3, NEEDLE_ROW(255).edgesInWindow + " edges");
ok("and the held-out error follows", NEEDLE_ROW(8).test > NEEDLE_ROW(255).test * 1.4,
   NEEDLE_ROW(8).test.toFixed(2) + " vs " + NEEDLE_ROW(255).test.toFixed(2) + ", exact " + NEEDLE.exact.toFixed(2));
ok("the exact scan does best of all on the needle",
   NEEDLE.exact <= Math.min(...NEEDLE.rows.map((r) => r.test)) + 1e-9);
ok("the window is where the prose says it is", NEEDLE_HI - NEEDLE_LO > 0.03 && NEEDLE_HI - NEEDLE_LO < 0.04,
   NEEDLE_LO + " to " + NEEDLE_HI.toFixed(3));
ok("no column gets more than min(max_bin, distinct values) bins",
   EDGE_SETS.every((e) => BIN_SETTINGS.every((b) => e.edges[b] <= Math.min(b, e.distinct))),
   EDGE_SETS.map((e) => e.key + ":" + e.edges[255]).join(" "));
{
  // The one column that falls short is the clipped one, and it falls short for
  // the documented reason: a value held by more rows than a bin's share cannot
  // be divided between two bins, so it takes a boundary with it. This started
  // as a failing check against a sentence that claimed exact equality.
  const short = EDGE_SETS.filter((e) => e.edges[255] < Math.min(255, e.distinct));
  ok("exactly one column comes out below that bound", short.length === 1,
     short.map((e) => e.key + ":" + e.edges[255]).join(" "));
  ok("...and it is the one with a value heavier than a bin's share",
     short.every((e) => e.maxTie > CONFIG.N_TRAIN / 255),
     short.map((e) => e.key + " maxTie=" + e.maxTie + " vs " + Math.round(CONFIG.N_TRAIN / 255)).join(" "));
  ok("no continuous column has such a value",
     EDGE_SETS.filter((e) => e.distinct > 1000 && e.edges[255] === 255).every((e) => e.maxTie <= CONFIG.N_TRAIN / 255));
}
ok("the integer column stops responding to max_bin",
   STOPS.edges[32] === STOPS.distinct && STOPS.edges[255] === STOPS.distinct,
   STOPS.distinct + " bins at every setting above " + STOPS.distinct);
ok("skewed quantile edges cluster where the rows are", (() => {
  const e = binEdges(TRAIN_COLS[0], 32, { minDataInBin: 3 });
  const mid = (Math.min(...TRAIN_COLS[0]) + Math.max(...TRAIN_COLS[0])) / 2;
  return e.filter((v) => v < mid).length > e.length * 0.8;
})());

console.log("\n--- determinism ---");
{
  const a = fit(TRAIN_COLS, TRAIN_Y, TEST_COLS, TEST_Y, { mode: "hist", maxBin: 64, numTrees: 8 });
  const b = fit(TRAIN_COLS, TRAIN_Y, TEST_COLS, TEST_Y, { mode: "hist", maxBin: 64, numTrees: 8 });
  ok("two identical fits agree exactly",
     a.test === b.test && a.counters.rowTouches === b.counters.rowTouches);
}

console.log("\n" + (failures ? failures + " CHECK(S) FAILED" : "all checks passed") + "\n");
process.exit(failures ? 1 : 0);
