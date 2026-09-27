/*
  Everything the prose quotes is computed here, when the page loads, from the
  same modules the charts draw with. No figure in this article is typed in by
  hand, and verify/check-numbers.mjs re-derives every one of them from this
  file. If a number in a sentence stops being true, the check fails.
*/
import { MAIN, MAIN_K, SHAPES, UNIFORM } from "./datasets.js";
import { runToConvergence, silhouette, counts, inertia, assign, centroidsFrom } from "./kmeans.js";
import { initRandom, initPlusPlus } from "./init.js";
import { mulberry32 } from "./rng.js";

const bestOfSeeds = (points, k, initFn, trials, seed0) => {
  let best = null;
  for (let t = 0; t < trials; t++) {
    const out = runToConvergence(points, initFn(points, k, mulberry32(seed0 + t * 131)));
    if (!best || out.inertia < best.inertia) best = out;
  }
  return best;
};

/* The best solution anyone here has found for k = 3. Not provably optimal -
   nothing cheap is - so it is called BEST, never OPTIMUM. */
export const BEST = bestOfSeeds(MAIN, MAIN_K, initPlusPlus, 80, 500);

/* ------------------------------------------------------------------ presets
   Three starting positions for the hook. `trap` is the one that matters: it is
   a perfectly ordinary-looking start that converges faster than the good run
   and lands 86% worse. */
export const PRESETS = [
  {
    key: "spread",
    label: "Spread out",
    note: "One centroid roughly per group. The start you would draw by hand.",
    centroids: [{ x: 22, y: 78 }, { x: 64, y: 84 }, { x: 58, y: 20 }],
  },
  {
    key: "trap",
    label: "Two in the big group",
    note: "Nothing obviously wrong with it. It converges in two rounds, to the wrong answer.",
    centroids: [{ x: 30, y: 64 }, { x: 44, y: 46 }, { x: 76, y: 56 }],
  },
  {
    key: "corner",
    label: "All in a corner",
    note: "As bad a start as you can draw - and it still finds the right answer.",
    centroids: [{ x: 14, y: 14 }, { x: 21, y: 11 }, { x: 16, y: 21 }],
  },
];

export const PRESET_RUNS = Object.fromEntries(
  PRESETS.map((p) => {
    const out = runToConvergence(MAIN, p.centroids);
    return [
      p.key,
      {
        ...out,
        startInertia: inertia(MAIN, assign(MAIN, p.centroids), p.centroids),
        excess: (out.inertia - BEST.inertia) / BEST.inertia,
        sizes: counts(out.labels, MAIN_K),
      },
    ];
  })
);

/* ------------------------------------------------- what restarts are for
   400 independent runs from each initialiser. "Good" means it reached BEST;
   because the alternatives here are 85%+ worse, there is no ambiguity about
   which side of the line a run fell on. */
const TRIALS = 400;

function sweep(initFn, seed0) {
  const runs = [];
  for (let t = 0; t < TRIALS; t++) {
    runs.push(runToConvergence(MAIN, initFn(MAIN, MAIN_K, mulberry32(seed0 + t * 7919))));
  }
  const good = runs.filter((r) => r.inertia < BEST.inertia * 1.0001).length;
  const excesses = runs.map((r) => (r.inertia - BEST.inertia) / BEST.inertia).sort((a, b) => a - b);
  return {
    trials: TRIALS,
    good,
    rate: good / TRIALS,
    meanIters: runs.reduce((a, r) => a + r.iterations, 0) / TRIALS,
    worstExcess: excesses[excesses.length - 1],
    // Every distinct fixed point found, by rounded inertia, for the strip plot.
    buckets: (() => {
      const m = new Map();
      for (const r of runs) {
        const key = Math.round(r.inertia);
        m.set(key, (m.get(key) || 0) + 1);
      }
      return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([inertia, count]) => ({ inertia, count }));
    })(),
  };
}

export const FORGY = sweep(initRandom, 1000);
export const PLUSPLUS = sweep(initPlusPlus, 1000);

/* Failure probability of "run it n times, keep the best", assuming the runs are
   independent - which they are, since each draws its own seed. */
export const BEST_OF = [1, 2, 5, 10, 20].map((n) => ({
  n,
  forgy: Math.pow(1 - FORGY.rate, n),
  pp: Math.pow(1 - PLUSPLUS.rate, n),
}));

export const N_INIT_10 = BEST_OF.find((b) => b.n === 10);

/* ---------------------------------------------------------- choosing k
   Inertia is the k-means objective; silhouette is not, and deliberately so -
   two criteria that measure different things is the honest picture. */
export const ELBOW = [];
for (let k = 1; k <= 8; k++) {
  const fit = bestOfSeeds(MAIN, k, initPlusPlus, 40, 900);
  ELBOW.push({
    k,
    inertia: fit.inertia,
    silhouette: k >= 2 ? silhouette(MAIN, fit.labels, k) : null,
    labels: fit.labels,
    centroids: fit.centroids,
  });
}
export const BEST_SILHOUETTE_K = ELBOW.filter((e) => e.silhouette !== null)
  .reduce((a, b) => (b.silhouette > a.silhouette ? b : a)).k;

/* Structureless data. k-means has no way of declining to answer, and neither
   criterion above says "there is nothing here". */
export const NOISE = [];
for (let k = 1; k <= 6; k++) {
  const fit = bestOfSeeds(UNIFORM, k, initPlusPlus, 30, 700);
  NOISE.push({
    k,
    inertia: fit.inertia,
    silhouette: k >= 2 ? silhouette(UNIFORM, fit.labels, k) : null,
    labels: fit.labels,
    centroids: fit.centroids,
  });
}
export const NOISE_BEST_K = NOISE.filter((e) => e.silhouette !== null)
  .reduce((a, b) => (b.silhouette > a.silhouette ? b : a));

/* --------------------------------------------------- the shapes it cannot see
   Each shape is fitted with the k it was generated with, best of 60 k-means++
   starts, so that nothing here can be blamed on a bad initialisation. What is
   left is the algorithm doing its best. */
const permutations = (n) => {
  if (n === 1) return [[0]];
  const out = [];
  for (const rest of permutations(n - 1)) {
    for (let i = 0; i < n; i++) out.push([...rest.slice(0, i), n - 1, ...rest.slice(i)]);
  }
  return out;
};

export const SHAPE_FITS = SHAPES.map((sh) => {
  const fit = bestOfSeeds(sh.points, sh.k, initPlusPlus, 60, 11);
  const confusion = Array.from({ length: sh.k }, () => new Array(sh.k).fill(0));
  sh.points.forEach((p, i) => confusion[p.group][fit.labels[i]]++);

  // Fraction of points sitting in a cluster whose majority group is their own.
  let matched = 0;
  for (let c = 0; c < sh.k; c++) matched += Math.max(...confusion.map((row) => row[c]));

  /*
    A display-only relabelling. Cluster indices are arbitrary, so cluster 0
    could be drawn in blue next to the red group it actually corresponds to,
    and the two panels would look like they disagree more than they do. Pick
    the permutation of cluster -> colour that maximises the overlap with the
    generated groups, by brute force over all k! of them (k <= 3 here).
  */
  let colorMap = permutations(sh.k)[0];
  let bestOverlap = -1;
  for (const perm of permutations(sh.k)) {
    // perm[c] = the group whose colour cluster c should borrow
    let score = 0;
    for (let c = 0; c < sh.k; c++) score += confusion[perm[c]][c];
    if (score > bestOverlap) {
      bestOverlap = score;
      colorMap = perm;
    }
  }

  /*
    What the objective says about the grouping the data was actually generated
    from. If this is HIGHER than what k-means found, the algorithm did not fail
    to solve its problem - it solved it, and the answer to that problem is not
    the structure in the data. No amount of restarting fixes that.
  */
  const trueCentroids = centroidsFrom(sh.points, sh.points.map((p) => p.group), sh.k, fit.centroids);
  const trueInertia = inertia(sh.points, sh.points.map((p) => p.group), trueCentroids);

  return {
    ...sh,
    fit,
    confusion,
    colorMap,
    trueCentroids,
    trueInertia,
    objectivePrefersWrong: fit.inertia < trueInertia,
    purity: matched / sh.points.length,
    sizes: counts(fit.labels, sh.k),
    trueSizes: counts(sh.points.map((p) => p.group), sh.k),
  };
});

export const SHAPE = Object.fromEntries(SHAPE_FITS.map((s) => [s.key, s]));

/* ------------------------------------------------------------- formatting */
export const int = (x) => Math.round(x).toLocaleString("en-US");
export const pct = (x, digits = 0) => (100 * x).toFixed(digits) + "%";
export const oneIn = (p) => "1 in " + Math.round(1 / p).toLocaleString("en-US");
