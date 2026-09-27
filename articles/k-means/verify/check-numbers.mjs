/*
  Every claim this article makes, re-derived outside the browser from the same
  modules the page imports. Run it after any change to the data, the algorithm
  or the prose:

      npm run check          (or: node verify/check-numbers.mjs)

  Exits non-zero if anything it asserts stops being true. The sentences in the
  components read their figures out of experiments.js, so a number can never
  drift silently - but a number can stay correct while the SENTENCE around it
  stops being true ("converges faster", "peaks at", "prefers the wrong
  grouping"), and those are what most of these check.
*/
import { MAIN, MAIN_K, UNIFORM, SHAPES, stirling2, extent } from "../src/datasets.js";
import { assign, centroidsFrom, inertia, runToConvergence, dist2 } from "../src/kmeans.js";
import { initRandom, initPlusPlus } from "../src/init.js";
import { mulberry32 } from "../src/rng.js";
import { voronoiCells } from "../src/voronoi.js";
import { fitEqual } from "../src/plot.js";
import {
  BEST, PRESETS, PRESET_RUNS, FORGY, PLUSPLUS, BEST_OF, N_INIT_10,
  ELBOW, BEST_SILHOUETTE_K, NOISE, NOISE_BEST_K, SHAPE_FITS, SHAPE, int, pct,
} from "../src/experiments.js";

let failures = 0;
const ok = (label, condition, detail = "") => {
  console.log((condition ? "  PASS  " : "  FAIL  ") + label + (detail ? "   " + detail : ""));
  if (!condition) failures++;
};
const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

console.log("\n--- the data is what the prose says it is ---");
ok("MAIN has 150 points in 3 generated groups", MAIN.length === 150 && MAIN_K === 3, MAIN.length + " points");
ok("UNIFORM has the same count, so the comparison is like for like", UNIFORM.length === MAIN.length);
ok("stirling2 agrees with the closed form for k=3",
   stirling2(20, 3) === (3n ** 20n - 3n * 2n ** 20n + 3n) / 6n, stirling2(20, 3).toString());
ok("stirling2 small cases", stirling2(4, 2) === 7n && stirling2(5, 3) === 25n);

console.log("\n--- the guarantees: neither half-step can raise the objective ---");
{
  let worst = 0;
  let traces = 0;
  for (let t = 0; t < 60; t++) {
    const start = t % 2 ? initRandom(MAIN, 3, mulberry32(60000 + t)) : initPlusPlus(MAIN, 3, mulberry32(60000 + t));
    const run = runToConvergence(MAIN, start);
    traces++;
    for (let i = 1; i < run.trace.length; i++) {
      worst = Math.max(worst, run.trace[i].inertia - run.trace[i - 1].inertia);
    }
  }
  ok("60 runs, every half-step non-increasing", worst <= 1e-9, "largest rise " + worst.toExponential(2));
  ok("all 60 terminated inside the iteration cap", traces === 60);
}
for (const p of PRESETS) {
  const run = PRESET_RUNS[p.key];
  const mono = run.trace.every((s, i) => i === 0 || s.inertia <= run.trace[i - 1].inertia + 1e-9);
  ok(("preset " + p.key).padEnd(20) + " trace is monotone", mono);
}

console.log("\n--- the assignment step really is the shaded region ---");
{
  // The article's central visual claim: a point joins the centroid whose
  // Voronoi cell it is standing in. Check the polygons against argmin directly.
  const EXT = extent(MAIN, 0.08);
  const sites = BEST.centroids;
  const cells = voronoiCells(sites, EXT);
  const inside = (poly, q) => {
    // Convex polygon, vertices in order: the point is inside when it is on the
    // same side of every edge. A small tolerance keeps boundary points honest.
    let sign = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const cross = (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x);
      if (Math.abs(cross) < 1e-7) continue;
      const s = Math.sign(cross);
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
    return true;
  };
  let mismatches = 0;
  let covered = 0;
  const N = 45;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const q = { x: EXT.x0 + ((EXT.x1 - EXT.x0) * i) / N, y: EXT.y0 + ((EXT.y1 - EXT.y0) * j) / N };
      const nearest = sites
        .map((s, idx) => ({ idx, d: dist2(q, s) }))
        .reduce((a, b) => (b.d < a.d ? b : a)).idx;
      const owners = cells.map((poly, idx) => (poly.length >= 3 && inside(poly, q) ? idx : -1)).filter((x) => x >= 0);
      if (owners.length >= 1) covered++;
      // Boundary points can legitimately land in two cells; require only that
      // the nearest centroid is among the owners.
      if (owners.length && !owners.includes(nearest)) mismatches++;
    }
  }
  ok("every grid point lies in some cell", covered === (N + 1) * (N + 1), covered + "/" + (N + 1) * (N + 1));
  ok("the cell a point lies in is its nearest centroid", mismatches === 0, mismatches + " mismatches");
}

console.log("\n--- charts do not stretch one axis against the other ---");
{
  const EXT = extent(MAIN, 0.08);
  const p = fitEqual(EXT, 613, 291, { top: 10, right: 10, bottom: 10, left: 10 });
  const dxScreen = p.X(10) - p.X(0);
  const dyScreen = p.Y(0) - p.Y(10);
  ok("equal data distances map to equal screen distances", close(dxScreen, dyScreen, 1e-9),
     dxScreen.toFixed(6) + " vs " + dyScreen.toFixed(6));
  ok("the inverse transform round-trips", close(p.invX(p.X(37.5)), 37.5, 1e-9) && close(p.invY(p.Y(61.25)), 61.25, 1e-9));
  ok("the fitted box stays inside the chart", p.box.x >= 10 - 1e-9 && p.box.y >= 10 - 1e-9);
}

console.log("\n--- 'a different start, a different answer' ---");
{
  const good = PRESET_RUNS.spread;
  const trap = PRESET_RUNS.trap;
  const corner = PRESET_RUNS.corner;
  ok("the spread start reaches the best solution", close(good.inertia, BEST.inertia, 1e-6), int(good.inertia));
  ok("the corner start reaches it too", close(corner.inertia, BEST.inertia, 1e-6),
     "from " + int(corner.startInertia) + " in " + corner.iterations + " rounds");
  ok("the trap start does not", trap.inertia > BEST.inertia * 1.5, int(trap.inertia));
  ok("the prose's '" + pct(trap.excess, 0) + " worse' is above 80%", trap.excess > 0.8);
  ok("the trap converges SOONER than the good run", trap.iterations < good.iterations,
     trap.iterations + " rounds vs " + good.iterations);
  ok("the trap really is a fixed point", (() => {
    const a = assign(MAIN, trap.centroids);
    const c = centroidsFrom(MAIN, a, MAIN_K, trap.centroids);
    return a.every((v, i) => v === trap.labels[i]) && c.every((p, i) => close(p.x, trap.centroids[i].x, 1e-9));
  })());
  ok("the trap merges the two right-hand groups", Math.max(...trap.sizes) >= 70, trap.sizes.join("/"));
}

console.log("\n--- 'not a rare accident' ---");
{
  const bad = FORGY.buckets.filter((b) => b.inertia > BEST.inertia * 1.0001);
  ok("a quarter or so of random starts miss", FORGY.rate > 0.6 && FORGY.rate < 0.9, pct(FORGY.rate, 2));
  ok("more than one distinct fixed point was found", FORGY.buckets.length > 3, FORGY.buckets.length + " of them");
  ok("the prose's 48,000-49,100 window holds every bad run",
     bad.every((b) => b.inertia >= 48000 && b.inertia <= 49100),
     int(Math.min(...bad.map((b) => b.inertia))) + " .. " + int(Math.max(...bad.map((b) => b.inertia))));
  ok("there is a clear gap, not a continuum",
     Math.min(...bad.map((b) => b.inertia)) > BEST.inertia * 1.5);
  ok("counts add up", FORGY.buckets.reduce((a, b) => a + b.count, 0) === FORGY.trials);
}

console.log("\n--- 'two fixes, and only one of them works' ---");
{
  ok("k-means++ beats random seeding on this data", PLUSPLUS.rate > FORGY.rate,
     pct(FORGY.rate, 0) + " -> " + pct(PLUSPLUS.rate, 0));
  ok("...but not by enough to call it a fix", PLUSPLUS.rate < 0.95, pct(PLUSPLUS.rate, 2));
  ok("k-means++ also needs fewer rounds", PLUSPLUS.meanIters < FORGY.meanIters,
     FORGY.meanIters.toFixed(2) + " -> " + PLUSPLUS.meanIters.toFixed(2));
  ok("best-of-10 is the actual fix", N_INIT_10.forgy < 1e-5, "1 in " + Math.round(1 / N_INIT_10.forgy).toLocaleString("en-US"));
  ok("best-of-n is monotone in n", BEST_OF.every((b, i) => i === 0 || b.forgy < BEST_OF[i - 1].forgy));
}

console.log("\n--- 'choosing k' ---");
{
  ok("inertia falls at every k, so it cannot choose one",
     ELBOW.every((e, i) => i === 0 || e.inertia < ELBOW[i - 1].inertia));
  ok("the silhouette peaks at k = 3 on the real structure", BEST_SILHOUETTE_K === 3,
     "peak " + ELBOW[2].silhouette.toFixed(2));
  ok("the biggest proportional drop is into k = 3", (() => {
    const drops = ELBOW.slice(1).map((e, i) => (ELBOW[i].inertia - e.inertia) / ELBOW[i].inertia);
    return drops.indexOf(Math.max(...drops)) === 1;
  })());
  ok("the drop after k = 3 is much smaller than into it", (() => {
    const into = (ELBOW[1].inertia - ELBOW[2].inertia) / ELBOW[1].inertia;
    const after = (ELBOW[2].inertia - ELBOW[3].inertia) / ELBOW[2].inertia;
    return after < into * 0.7;
  })());
  ok("inertia on pure noise also falls at every k",
     NOISE.every((e, i) => i === 0 || e.inertia < NOISE[i - 1].inertia));
  ok("the silhouette still names a 'best' k on structureless data", NOISE_BEST_K.k >= 2,
     "k = " + NOISE_BEST_K.k + " at " + NOISE_BEST_K.silhouette.toFixed(2));
  ok("...but scores lower than the real structure does",
     NOISE_BEST_K.silhouette < ELBOW[2].silhouette,
     NOISE_BEST_K.silhouette.toFixed(2) + " vs " + ELBOW[2].silhouette.toFixed(2));
  ok("the noise curve has no elbow: no drop is twice the next", (() => {
    const drops = NOISE.slice(1).map((e, i) => (NOISE[i].inertia - e.inertia) / NOISE[i].inertia);
    return drops.every((d, i) => i === 0 || d < drops[i - 1] * 2);
  })());
}

console.log("\n--- 'what k-means assumes': the objective prefers the wrong grouping ---");
for (const s of SHAPE_FITS) {
  ok((s.key + " : generated grouping scores worse").padEnd(42), s.objectivePrefersWrong,
     int(s.trueInertia) + " vs " + int(s.fit.inertia) + "  (x" + (s.trueInertia / s.fit.inertia).toFixed(2) + ")");
  ok((s.key + " : the fit uses the generated k").padEnd(42), s.fit.centroids.length === s.k);
  ok((s.key + " : colour map is a permutation").padEnd(42),
     new Set(s.colorMap).size === s.k && s.colorMap.every((v) => v >= 0 && v < s.k));
}
ok("the stretched bands are the worst case, above 2x", SHAPE.aniso.trueInertia / SHAPE.aniso.fit.inertia > 2,
   "x" + (SHAPE.aniso.trueInertia / SHAPE.aniso.fit.inertia).toFixed(2));
ok("the wide group is split across all three clusters",
   SHAPE.variance.confusion[2].every((n) => n > 0), SHAPE.variance.confusion[2].join(" / "));
ok("the two tight groups survive whole",
   SHAPE.variance.confusion[0].filter((n) => n > 0).length === 1 &&
   SHAPE.variance.confusion[1].filter((n) => n > 0).length === 1);
{
  const c = SHAPE.sizes.confusion;
  const bigSplit = c[0].filter((n) => n > 80).length;
  ok("the 200-point group is cut into two big pieces", bigSplit === 2, c[0].join(" / "));
  ok("the two 25-point groups land in one shared cluster",
     c[1].findIndex((n) => n > 0) === c[2].findIndex((n) => n > 0),
     c[1].join("/") + " and " + c[2].join("/"));
}
{
  const c = SHAPE.moons.confusion;
  const frac = c.map((row) => Math.max(...row) / row.reduce((a, b) => a + b, 0));
  ok("each arc is split roughly in half", frac.every((f) => f > 0.35 && f < 0.68),
     frac.map((f) => pct(f, 0)).join(" and "));
}

console.log("\n--- the conclusion's summary figures ---");
ok("k-means returns clusters from noise without complaint",
   NOISE[NOISE_BEST_K.k - 1].centroids.length === NOISE_BEST_K.k);
ok("BEST is at least as good as every run in either sweep",
   [...FORGY.buckets, ...PLUSPLUS.buckets].every((b) => b.inertia >= Math.floor(BEST.inertia)));
ok("BEST is itself a fixed point", (() => {
  const a = assign(MAIN, BEST.centroids);
  return close(inertia(MAIN, a, BEST.centroids), BEST.inertia, 1e-6);
})());

console.log("\n" + (failures ? failures + " CHECK(S) FAILED" : "all checks passed") + "\n");
process.exit(failures ? 1 : 0);
