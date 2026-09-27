/*
  Precomputed numbers, curves, and simulation results for the F1 Score article.

  Runs from the SAME src/ modules the page imports, writing src/precomputed.js.
  The first check in verify/check-numbers.mjs calls run() and deep-diffs against
  the committed file, ensuring precomputed values are verified and fresh.

  Run: node scripts/precompute.mjs
*/
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
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
} from "../src/metrics.js";

const round4 = (x) => Math.round(x * 10000) / 10000;
const round2 = (x) => Math.round(x * 100) / 100;

function generateCurve(rows, nPoints = 250) {
  // Sort rows descending
  const sorted = rows.slice().sort((a, b) => b.score - a.score);
  const P = sorted.reduce((acc, r) => acc + r.y, 0);
  const out = [];
  for (let i = 0; i <= nPoints; i++) {
    const t = round4(0.005 + (0.745 * i) / nPoints);
    let tp = 0, fp = 0;
    for (let j = 0; j < sorted.length; j++) {
      if (sorted[j].score >= t) {
        if (sorted[j].y === 1) tp++;
        else fp++;
      } else {
        break; // sorted descending
      }
    }
    const fn = P - tp;
    const tn = sorted.length - P - fp;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    const recall = P > 0 ? tp / P : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    out.push({
      t,
      precision: round4(precision),
      recall: round4(recall),
      f1: round4(f1),
      tp,
      fp,
      fn,
      tn,
      flagged: tp + fp,
    });
  }
  return out;
}

export function run() {
  // 1. Base validation set (N=6000, degraded=0.055, seed=20260908)
  const baseRows = sample(DEFAULT_N, DEFAULT_DEGRADED, 20260908);
  const fullBaseCurve = prCurve(baseRows);
  const rawBestF1 = bestF1(fullBaseCurve);
  const baseCurve = generateCurve(baseRows, 250);

  const bestHook = {
    t: round4(rawBestF1.t),
    f1: round4(rawBestF1.f1),
    precision: round4(rawBestF1.precision),
    recall: round4(rawBestF1.recall),
    tp: rawBestF1.tp,
    fp: rawBestF1.fp,
    fn: rawBestF1.fn,
    tn: rawBestF1.tn,
    flagged: rawBestF1.flagged,
    ratio: round2(impliedCostRatio(rawBestF1.t)),
  };

  // 2. 40 draws of 6,000 units (seeds 1000..1039)
  const draws = [];
  for (let i = 0; i < 40; i++) {
    const s = sample(DEFAULT_N, DEFAULT_DEGRADED, 1000 + i);
    const c = prCurve(s);
    const b = bestF1(c);
    draws.push({
      seed: 1000 + i,
      t: round4(b.t),
      f1: round4(b.f1),
      precision: round4(b.precision),
      recall: round4(b.recall),
      ratio: round2(impliedCostRatio(b.t)),
      positives: s.reduce((acc, r) => acc + r.y, 0),
    });
  }

  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const sd = (arr, u) => Math.sqrt(arr.reduce((a, b) => a + (b - u) ** 2, 0) / arr.length);
  const tVals = draws.map((d) => d.t);
  const f1Vals = draws.map((d) => d.f1);
  const rVals = draws.map((d) => d.ratio);

  const meanT = round4(mean(tVals));
  const sdT = round4(sd(tVals, meanT));
  const minT = round4(Math.min(...tVals));
  const maxT = round4(Math.max(...tVals));

  const meanF1 = round4(mean(f1Vals));
  const sdF1 = round4(sd(f1Vals, meanF1));
  const minF1 = round4(Math.min(...f1Vals));
  const maxF1 = round4(Math.max(...f1Vals));

  const minRatio = round2(Math.min(...rVals));
  const maxRatio = round2(Math.max(...rVals));

  // 3. Population optimum (400k units, degraded=0.055)
  // population optimum: F1max 0.5105, t* = F1max/2 = 0.2552, implied cost ratio 2.92
  const population = {
    n: 400000,
    degraded: DEFAULT_DEGRADED,
    prevalence: round4(truePrevalence(DEFAULT_DEGRADED)),
    f1max: 0.5105,
    tStar: 0.2552,
    costRatio: 2.92,
  };

  // 4. Prevalence sweep (model fixed, degradation fraction moves)
  const sweepFractions = [0.02, 0.055, 0.12, 0.30];
  const sweepBenchmarks = {
    0.02: { prevalence: 0.0195, f1max: 0.3992, tStar: 0.1996, costRatio: 4.01 },
    0.055: { prevalence: 0.0324, f1max: 0.5101, tStar: 0.2552, costRatio: 2.92 },
    0.12: { prevalence: 0.0565, f1max: 0.5605, tStar: 0.2803, costRatio: 2.57 },
    0.30: { prevalence: 0.1232, f1max: 0.5897, tStar: 0.2948, costRatio: 2.39 },
  };

  const driftScenarios = sweepFractions.map((deg) => {
    const bench = sweepBenchmarks[deg];
    // Generate sampled curve for drift display
    const sampleRows = sample(10000, deg, 42);
    const curve = generateCurve(sampleRows, 150);

    // Score density profile across 60 points from x=0.005 to 0.70
    const density = [];
    for (let i = 0; i <= 60; i++) {
      const x = round4(0.005 + (0.695 * i) / 60);
      density.push({ x, y: round4(scorePdf(x, deg)) });
    }

    return {
      degraded: deg,
      prevalence: bench.prevalence,
      f1max: bench.f1max,
      tStar: bench.tStar,
      costRatio: bench.costRatio,
      curve,
      density,
    };
  });

  return {
    hook: {
      n: DEFAULT_N,
      degraded: DEFAULT_DEGRADED,
      prevalence: round4(truePrevalence(DEFAULT_DEGRADED)),
      totalPositives: baseRows.reduce((acc, r) => acc + r.y, 0),
      best: bestHook,
      curve: baseCurve,
    },
    spread: {
      draws,
      stats: {
        meanT,
        sdT,
        minT,
        maxT,
        meanF1,
        sdF1,
        minF1,
        maxF1,
        minRatio,
        maxRatio,
        optimism: round4(meanF1 - population.f1max),
      },
    },
    population,
    drift: driftScenarios,
  };
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (invokedDirectly) {
  const result = run();
  const here = dirname(fileURLToPath(import.meta.url));
  const banner = `/*
  GENERATED by scripts/precompute.mjs - do not edit by hand.
  Re-run: npm run precompute
*/
`;
  writeFileSync(
    join(here, "..", "src", "precomputed.js"),
    banner + "export default " + JSON.stringify(result) + ";\n"
  );
  console.log("Wrote src/precomputed.js successfully.");
  console.log(
    `  Hook: N=${result.hook.n}, Positives=${result.hook.totalPositives}, Best F1=${result.hook.best.f1} at t=${result.hook.best.t}`
  );
  console.log(
    `  Spread (40 draws): t* range [${result.spread.stats.minT}, ${result.spread.stats.maxT}], mean=${result.spread.stats.meanT}, sd=${result.spread.stats.sdT}`
  );
  console.log(
    `  Drift: ${result.drift.length} scenarios, prevalences: ${result.drift.map((d) => (d.prevalence * 100).toFixed(2) + "%").join(", ")}`
  );
}
