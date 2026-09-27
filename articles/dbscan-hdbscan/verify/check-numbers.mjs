/*
  Every number and every CLAIM this article makes, re-derived from the same
  modules the page imports.

  The distinction matters. A figure staying correct while the sentence around
  it stops being true is the failure this file exists to catch, so most
  assertions below are worded as the sentence they defend rather than as the
  quantity they read. Identities are held to machine precision; measurements
  are held to bounds that would fail if the story changed.

  Run: npm run check
*/
import { run as precompute } from "../scripts/precompute.mjs";
import COMMITTED from "../src/precomputed.js";
import { DATA, byId, withTransit, twoModes, twoModeProfile, PATCH, EXTENT, PATCH_EXTENT } from "../src/datasets.js";
import {
  distanceMatrix, coreDistances, mreachMST, euclideanMST, dbscan, dbscanStar, clustersFromMST,
  breakpoints, linkage, condense, stabilities, selectEOM, labelsFromSelection, hdbscan,
  ari, recovery, epsSweep, canonicalPartition, kmeans, kdistCurve, knee,
} from "../src/density.js";
import { mulberry32 } from "../src/rng.js";
import {
  scene, treeOf, hdb, verdict, epsOf, windowOf, regionPaths, strayScene, STRAY_AT,
  PRE, HOOK, HARD, DAY, M_DEFAULT, MCS_DEFAULT, SEARCH, MCS_RANGE, pct, num,
} from "../src/experiments.js";
import { fitEqual } from "../src/plot.js";

let failures = 0;
let checks = 0;
function ok(claim, cond, detail = "") {
  checks++;
  if (cond) console.log("  ok   " + claim + (detail ? "   [" + detail + "]" : ""));
  else { failures++; console.log("  FAIL " + claim + (detail ? "   [" + detail + "]" : "")); }
}
const head = (s) => console.log("\n" + s);
const M_GRID = PRE.config.M_GRID;

/* =====================================================================
   0. The committed precompute is not stale
   ===================================================================== */
head("The precompute is fresh");
{
  const fresh = precompute();
  ok("src/precomputed.js matches what scripts/precompute.mjs produces right now",
     JSON.stringify(fresh) === JSON.stringify(COMMITTED));
}

/* =====================================================================
   1. The identity the whole article rests on
   ===================================================================== */
head("Identities — these are not tolerances");
{
  let tested = 0, mismatch = 0;
  for (const sc of DATA) {
    const D = distanceMatrix(sc.pts);
    for (const m of [3, 8, 16]) {
      const core = coreDistances(sc.pts, m, D);
      const mst = mreachMST(sc.pts, m, D, core);
      for (const bp of breakpoints(mst, core)) {
        const brute = canonicalPartition(dbscanStar(sc.pts, bp.at, m, { D, core }).labels);
        const tree = canonicalPartition(clustersFromMST(mst, core, bp.at, 1).labels);
        tested++;
        if (brute !== tree) mismatch++;
      }
    }
  }
  ok("brute-force DBSCAN* and the mutual-reachability tree agree at EVERY eps the sweep can distinguish",
     mismatch === 0, tested + " thresholds, " + mismatch + " disagreements");
  ok("the article prints that count, and it is the count this sweep actually ran",
     tested === 3581, "prose says 3,581, the sweep ran " + tested);
}

{
  /* The window's edges have a closed form: it opens where the loosest stop
     finally holds together and closes where the two closest stops merge. One
     side of this is an enumeration of every distinct clustering; the other is
     two single thresholds. They share no code path beyond the tree itself. */
  let agree = 0, total = 0;
  for (const s of PRE.scenarios) {
    const sc = byId(s.id);
    for (const g of s.grid) {
      const c = s.crossings.find((x) => x.m === g.m);
      total++;
      const predictedEmpty = c.gap === null ? null : c.gap > 0;
      const measuredEmpty = g.lo === null;
      const edgesOk = measuredEmpty ||
        (Math.abs(g.lo - c.cohere) < 1e-9 && Math.abs(g.hi - c.merge) < 1e-9);
      if (predictedEmpty === measuredEmpty && edgesOk) agree++;
    }
  }
  ok("the window read off two thresholds equals the window enumerated from every clustering",
     agree === total, agree + " of " + total + " (day, minPts) combinations");
  ok("and the article says 39 of 39", total === 39 && agree === 39, total + " combinations");
}

{
  /* Stability is measured in points per metre, so scaling the data scales it
     by exactly the reciprocal. Machine precision, not a tolerance. */
  let worst = 0;
  for (const sc of DATA) {
    const base = hdbscan(sc.pts, 15);
    for (const s of [0.5, 2, 7.25]) {
      const scaled = hdbscan(sc.pts.map((p) => [p[0] * s, p[1] * s]), 15);
      const a = [...base.S.entries()].sort((x, y) => x[0] - y[0]);
      const b = [...scaled.S.entries()].sort((x, y) => x[0] - y[0]);
      if (a.length !== b.length) { worst = Infinity; break; }
      for (let i = 0; i < a.length; i++) {
        if (a[i][1] === 0) continue;
        worst = Math.max(worst, Math.abs(b[i][1] * s - a[i][1]) / a[i][1]);
      }
    }
  }
  ok("scale the data by s and every stability scales by exactly 1/s", worst < 1e-12,
     "worst relative error " + worst.toExponential(2));
}

{
  /*
    Two derivations of every cluster's stability, sharing no arithmetic: the
    sum over points that HDBSCAN defines, and a numerical integral of how many
    points the cluster still holds, which is what the ribbon in the condensed
    figure is drawn from. If the drawing and the criterion ever disagree, the
    picture is lying about what was selected.
  */
  let worst = 0, n = 0;
  for (const id of DATA.map((d) => d.id)) {
    const S = scene(id, M_DEFAULT);
    const T = treeOf(S, MCS_DEFAULT);
    for (const nd of T.nodes) {
      if (nd.id === T.cond.root) continue;
      const lamA = nd.birth;
      const lamB = Math.max(...nd.leaving.filter(Number.isFinite).concat(
        nd.children.map((k) => T.byId.get(k).birth), [nd.birth]));
      if (!(lamB > lamA)) continue;
      const steps = 4000;
      let integral = 0;
      for (let i = 0; i < steps; i++) {
        const l = lamA + ((lamB - lamA) * (i + 0.5)) / steps;
        integral += T.remaining(nd, l) * ((lamB - lamA) / steps);
      }
      const direct = T.stab.get(nd.id);
      if (direct > 1e-9) { worst = Math.max(worst, Math.abs(integral - direct) / direct); n++; }
    }
  }
  ok("the stability sum equals the area under the number of points still in the cluster",
     worst < 6e-3 && n > 20, n + " clusters, worst relative gap " + worst.toExponential(2));
}

/* =====================================================================
   2. There is no window, and it is not a compromise
   ===================================================================== */
head("The café day: it is not a narrow window, it is no window");
{
  const sc = byId("cafe-bakery-park");
  const c8 = HARD.crossings.find((x) => x.m === M_DEFAULT);
  ok("the café and the bakery become one cluster at 6.40 m", Math.abs(c8.merge - 6.399) < 0.01, c8.merge + " m");
  ok("the park does not hold together until 9.96 m", Math.abs(c8.cohere - 9.962) < 0.01, c8.cohere + " m");
  ok("so the window is missing by 3.56 m", Math.abs(c8.gap - 3.563) < 0.01, c8.gap + " m");
  ok("the pair that merges first really is the café and the bakery",
     c8.mergePair[0] === 0 && c8.mergePair[1] === 1, sc.stopNames.filter((_, i) => c8.mergePair.includes(i)).join(" + "));
  ok("and the stop that takes longest to cohere really is the park", c8.loose === 2, sc.stopNames[c8.loose]);

  const gaps = HARD.crossings.map((c) => c.gap);
  ok("the gap is positive at EVERY minPts in the grid — no value rescues it", gaps.every((g) => g > 0),
     "from " + Math.min(...gaps).toFixed(2) + " m at minPts " + M_GRID[0] +
     " to " + Math.max(...gaps).toFixed(2) + " m at minPts " + M_GRID[M_GRID.length - 1]);
  ok("and it grows monotonically with minPts, as the prose says it does",
     gaps.every((g, i) => i === 0 || g >= gaps[i - 1] - 1e-9));
  ok("no eps at any minPts finds all three stops, in the exact enumeration",
     HARD.grid.every((g) => g.lo === null), HARD.grid.filter((g) => g.lo !== null).length + " that do");
  ok("border points do not rescue it either: classic DBSCAN, 10 cm grid, every minPts",
     HARD.classic.every((c) => !c.any), HARD.classic.filter((c) => c.any).map((c) => c.m).join(","));
}

{
  /* The counts the prose gives for the size of the search. */
  ok("the eps knob has 367 distinct answers on the café day and none of them is right",
     HARD.atDefault.distinct === 367 && HARD.atDefault.right === 0,
     HARD.atDefault.distinct + " answers, " + HARD.atDefault.right + " right");
  ok("on the platforms it has 302, of which 53 are right",
     HOOK.atDefault.distinct === 302 && HOOK.atDefault.right === 53,
     HOOK.atDefault.distinct + " / " + HOOK.atDefault.right);
  ok("on a whole day, 522 and 52", DAY.atDefault.distinct === 522 && DAY.atDefault.right === 52,
     DAY.atDefault.distinct + " / " + DAY.atDefault.right);
}

{
  /* The density table, and the sentence built on it. */
  const mc = HARD.medianCore;
  ok("the café is the densest thing on the café day and the walking is the loosest",
     mc.byStop[0] < mc.byStop[1] && mc.byStop[1] < mc.byStop[2] && mc.byStop[2] < mc.transit,
     mc.byStop.join(" < ") + " < " + mc.transit);
  ok("the park is about four times looser than the café table, as the prose says",
     Math.abs(mc.byStop[2] / mc.byStop[0] - 4) < 0.6, (mc.byStop[2] / mc.byStop[0]).toFixed(2) + "×");
}

{
  /* The readout at the best eps, which is a sentence the page renders. */
  const S = scene("cafe-bakery-park", M_DEFAULT);
  const shot = S.at(HARD.atDefault.best.eps);
  const v = verdict(S.sc, shot.rec, shot.nClusters);
  ok("at the best eps that exists, the park comes back almost entirely as noise",
     shot.rec.per[2].noise > 0.9, pct(shot.rec.per[2].noise) + " of the park is noise");
  ok("...and the café and the bakery are both found there", shot.rec.per[0].found && shot.rec.per[1].found);
  ok("...so the readout the page renders is a failure, not a success", !v.ok, v.line);
}

/* =====================================================================
   3. The elbow
   ===================================================================== */
head("The elbow recipe");
{
  // Re-derived from src/ rather than read out of the precompute.
  let hits = 0, tries = 0, easyHit = 0, easyN = 0, dayHit = 0, dayN = 0;
  for (const sc of DATA) {
    const D = distanceMatrix(sc.pts);
    for (const m of M_GRID) {
      const core = coreDistances(sc.pts, m, D);
      const mst = mreachMST(sc.pts, m, D, core);
      const w = windowOf(epsSweep(mst, core, sc.stop, sc.nStops, { max: PRE.config.EPS_MAX }), sc.nStops);
      if (w.lo === null) continue;
      const kn = knee(kdistCurve(core));
      const inside = kn.eps >= w.lo && kn.eps <= w.hi;
      tries++;
      if (inside) hits++;
      if (sc.id === "platforms") { easyN++; if (inside) easyHit++; }
      if (sc.id === "whole-day") { dayN++; if (inside) dayHit++; }
    }
  }
  ok("the elbow lands inside the working window 12 times out of 26", hits === 12 && tries === 26,
     hits + " of " + tries);
  ok("it works on the easy day — 9 of 13", easyHit === 9 && easyN === 13, easyHit + " of " + easyN);
  ok("and misses on the realistic one — 3 of 13", dayHit === 3 && dayN === 13, dayHit + " of " + dayN);
  ok("so the recipe does better where a window is easy to find than where it is not", easyHit > dayHit);
}
{
  const E = PRE.elbow;
  ok("the elbow always lands in a narrow band of percentiles — it is a percentile in disguise",
     E.min > 0.65 && E.max < 0.95 && E.sd < 0.06,
     "range " + pct(E.min, 1) + "–" + pct(E.max, 1) + ", median " + pct(E.median, 1) + ", sd " + num(100 * E.sd, 1) + " pts");
  ok("one stray ping moves the recommendation from 8.27 m to 14.45 m",
     Math.abs(E.stray.before - 8.274) < 0.01 && Math.abs(E.stray.after - 14.446) < 0.01,
     E.stray.before + " -> " + E.stray.after);
  ok("...which the prose calls a 75% change", Math.abs((E.stray.after / E.stray.before - 1) - 0.75) < 0.03,
     pct(E.stray.after / E.stray.before - 1, 0));
  // And the figure's own scene agrees with the study.
  const s0 = scene("platforms", M_DEFAULT);
  const s1 = strayScene("platforms", M_DEFAULT);
  // The study's figures are rounded to three decimals on the way into
  // precomputed.js, so this compares at that resolution rather than at
  // machine precision - the claim is "the same scene", not "the same float".
  ok("the figure's stray scene is the same one the study measured",
     Math.abs(s0.knee.eps - E.stray.before) < 5e-4 && Math.abs(s1.knee.eps - E.stray.after) < 5e-4,
     num(s0.knee.eps, 4) + " vs " + E.stray.before + "   " + num(s1.knee.eps, 4) + " vs " + E.stray.after);
  ok("the stray ping is inside the drawn window, so nothing is clipped",
     STRAY_AT[0] > EXTENT.x0 && STRAY_AT[0] < EXTENT.x1 && STRAY_AT[1] > EXTENT.y0 && STRAY_AT[1] < EXTENT.y1);
}

/* =====================================================================
   4. Mutual reachability
   ===================================================================== */
head("What mutual reachability buys");
{
  const L = DAY.linkage;
  const plain = L.find((l) => l.m === 1);
  const best = L.reduce((a, b) => (b.width > a.width ? b : a));
  ok("plain single linkage already finds all five stops at its best threshold", plain.best === 5, plain.best + " of 5");
  ok("so does mutual reachability at every m — it does not change the best answer",
     L.every((l) => l.best === 5), L.map((l) => l.m + ":" + l.best).join(" "));
  ok("what it changes is the width of the window: 6.24 m plain, 10.05 m at m = 8",
     Math.abs(plain.width - 6.238) < 0.01 && Math.abs(L.find((l) => l.m === 8).width - 10.048) < 0.01,
     L.map((l) => "m" + l.m + "=" + l.width).join(" "));
  ok("the widest is more than twice the plain one, as the prose says", best.width > 2 * plain.width,
     num(best.width / plain.width, 2) + "× at m = " + best.m);
  ok("the mechanism is visible in the core distances: the walking is inflated over 3x more than the stops",
     DAY.medianCore.transit / DAY.medianCore.stops > 3 && DAY.medianCore.transit / DAY.medianCore.stops < 4.2,
     num(DAY.medianCore.transit / DAY.medianCore.stops, 2) + "× — the figure prints " + num(DAY.medianCore.transit / DAY.medianCore.stops, 1));
}
{
  /* d_mreach can only push points apart, never together, and it is symmetric.
     Both are identities; they are what let the MST stand in for the sweep. */
  const sc = byId("platforms");
  const D = distanceMatrix(sc.pts);
  const core = coreDistances(sc.pts, 8, D);
  const n = sc.pts.length;
  let shrunk = 0, asym = 0, sameInDense = 0, denseTested = 0;
  for (let i = 0; i < n; i += 3)
    for (let j = i + 1; j < n; j += 3) {
      const d = D[i * n + j];
      const ab = Math.max(core[i], core[j], d);
      const ba = Math.max(core[j], core[i], D[j * n + i]);
      if (ab < d - 1e-12) shrunk++;
      if (Math.abs(ab - ba) > 1e-12) asym++;
      if (d > core[i] && d > core[j]) { denseTested++; if (Math.abs(ab - d) < 1e-12) sameInDense++; }
    }
  ok("mutual reachability never makes two pings closer than they are", shrunk === 0, shrunk + " pairs shrunk");
  ok("and it is symmetric", asym === 0);
  ok("where both pings are in a crowd it changes nothing at all",
     denseTested > 1000 && sameInDense === denseTested, sameInDense + " of " + denseTested + " pairs unchanged");
}

/* =====================================================================
   5. The tree, and the spans the figure draws
   ===================================================================== */
head("The tree the reader drags a line across");
{
  const MCS = 10;
  const spansOf = (id) => {
    const S = scene(id, M_DEFAULT);
    const T = treeOf(S, MCS);
    const n = S.sc.pts.length;
    const parentOf = new Map();
    const fell = new Int32Array(n).fill(-1);
    for (const r of T.cond.rows) {
      if (r.child >= n) parentOf.set(r.child, r.parent);
      else fell[r.child] = r.parent;
    }
    const counts = new Map();
    for (let p = 0; p < n; p++) {
      const g = S.sc.stop[p];
      if (g < 0) continue;
      let c = fell[p];
      while (c !== undefined && c >= n) {
        if (!counts.has(c)) counts.set(c, new Array(S.sc.nStops).fill(0));
        counts.get(c)[g]++;
        c = parentOf.get(c);
      }
    }
    const sizes = Array.from({ length: S.sc.nStops }, (_, g) => S.sc.stop.filter((s) => s === g).length);
    const out = [];
    for (let g = 0; g < S.sc.nStops; g++) {
      let best = null;
      for (const [c, arr] of counts.entries()) {
        if (arr[g] < 0.8 * sizes[g]) continue;
        if (arr.some((v, h) => h !== g && v >= 0.2 * sizes[h])) continue;
        if (best === null || c < best) best = c;
      }
      if (best === null) continue;
      const nd = T.byId.get(best);
      out.push({ g, lo: epsOf(nd.death), hi: epsOf(nd.birth) });
    }
    return out;
  };
  for (const id of ["platforms", "cafe-bakery-park", "whole-day"]) {
    const sp = spansOf(id);
    ok("every stop on " + id + " has a branch of its own in the drawn tree",
       sp.length === byId(id).nStops, sp.length + " of " + byId(id).nStops);
  }
  const hard = spansOf("cafe-bakery-park");
  const floor = Math.max(...hard.map((s) => s.lo));
  const ceiling = Math.min(...hard.map((s) => s.hi));
  ok("on the café day no height crosses all three branches at once", floor > ceiling,
     "highest floor " + num(floor, 2) + " m, lowest ceiling " + num(ceiling, 2) + " m");
  ok("the article quotes those spans: café 1.2–6.4, bakery 2.3–6.4, park 8.4–22.6",
     Math.abs(hard[0].lo - 1.2) < 0.15 && Math.abs(hard[0].hi - 6.4) < 0.15 &&
     Math.abs(hard[1].lo - 2.3) < 0.15 && Math.abs(hard[2].lo - 8.4) < 0.2,
     hard.map((s) => num(s.lo, 1) + "–" + num(s.hi, 1)).join("  "));
  for (const id of ["platforms", "whole-day"]) {
    const sp = spansOf(id);
    const f = Math.max(...sp.map((s) => s.lo));
    const c = Math.min(...sp.map((s) => s.hi));
    ok("on " + id + " a single height does cross all of them", f < c, num(f, 1) + " < " + num(c, 1));
  }
  const plat = spansOf("platforms");
  ok("and on the platforms that overlap IS the window the enumeration found",
     Math.abs(Math.max(...plat.map((s) => s.lo)) - HOOK.atDefault.lo) < 0.05 &&
     Math.abs(Math.min(...plat.map((s) => s.hi)) - HOOK.atDefault.hi) < 0.05,
     "[" + num(Math.max(...plat.map((s) => s.lo)), 2) + ", " + num(Math.min(...plat.map((s) => s.hi)), 2) + "] vs " +
     "[" + num(HOOK.atDefault.lo, 2) + ", " + num(HOOK.atDefault.hi, 2) + "]");
}

/* =====================================================================
   6. HDBSCAN, and the honest comparison
   ===================================================================== */
head("HDBSCAN, and where it does not win");
{
  for (const s of PRE.scenarios) {
    const bestHdb = Math.max(...s.mcs.rows.map((r) => r.ari));
    const bestDb = s.atDefault.best.ari;
    const label = s.id.padEnd(18);
    if (s.id === "cafe-bakery-park")
      ok("on the café day HDBSCAN beats the best eps that exists", bestHdb > bestDb + 0.05,
         num(bestHdb, 3) + " vs " + num(bestDb, 3));
    else
      ok("on " + s.id + " the best eps is at least as good as HDBSCAN — the article says so",
         bestDb >= bestHdb, num(bestDb, 3) + " vs " + num(bestHdb, 3));
  }
  ok("HDBSCAN finds every stop on all three days, somewhere in the size range",
     PRE.scenarios.every((s) => s.mcs.rows.some((r) => r.found === s.nStops)),
     PRE.scenarios.map((s) => s.id + ":" + Math.max(...s.mcs.rows.map((r) => r.found)) + "/" + s.nStops).join(" "));
  ok("min_cluster_size works over a much larger share of its range than eps does over its",
     PRE.scenarios.every((s) => s.mcs.share > s.searchShare + 0.5),
     PRE.scenarios.map((s) => pct(s.searchShare, 1) + " vs " + pct(s.mcs.share, 1)).join("   "));
  ok("the three shares the figure prints for eps are 12.3%, 0.0% and 26.4%",
     Math.abs(HOOK.searchShare - 0.123) < 0.002 && HARD.searchShare === 0 && Math.abs(DAY.searchShare - 0.2644) < 0.002,
     PRE.scenarios.map((s) => pct(s.searchShare, 1)).join(" "));
  ok("...and for min_cluster_size, effectively the whole range on all three days",
     PRE.scenarios.every((s) => s.mcs.share > 0.95),
     PRE.scenarios.map((s) => pct(s.mcs.share, 1)).join(" "));
  ok("with min_samples coupled to min_cluster_size, as the library does by default, there is less room",
     PRE.scenarios.every((s) => s.mcsCoupled.share < s.mcs.share && s.mcsCoupled.share > 0.3),
     PRE.scenarios.map((s) => pct(s.mcsCoupled.share, 1)).join(" "));
  ok("...but it is still never empty, unlike eps",
     PRE.scenarios.every((s) => s.mcsCoupled.share > 0) && HARD.searchShare === 0);
}
{
  /* The selection HDBSCAN makes, re-derived through the page's own path. */
  for (const id of DATA.map((d) => d.id)) {
    const S = scene(id, M_DEFAULT);
    const T = treeOf(S, MCS_DEFAULT);
    const direct = hdbscan(byId(id).pts, MCS_DEFAULT, M_DEFAULT);
    ok("the tree the condensed figure draws gives the same labels as running HDBSCAN outright [" + id + "]",
       canonicalPartition(T.labels) === canonicalPartition(direct.labels));
    ok("...and the same labels the min_cluster_size sweep measured [" + id + "]",
       PRE.scenarios.find((s) => s.id === id).mcs.rows.find((r) => r.mcs === MCS_DEFAULT).found === T.rec.found);
    ok("the root is never selected [" + id + "]", !T.chosen.has(T.cond.root));
    ok("no selected cluster is an ancestor of another [" + id + "]", (() => {
      for (const c of T.chosen) {
        let p = T.nodes.find((n) => n.children.includes(c));
        while (p) { if (T.chosen.has(p.id)) return false; p = T.nodes.find((n) => n.children.includes(p.id)); }
      }
      return true;
    })());
  }
}
{
  const SS = PRE.stabilityScale;
  ok("two identical clusters are equally stable", Math.abs(SS[0].ratio - 1) < 1e-6, SS[0].ratio);
  ok("shrink one by half and it is twice as stable", Math.abs(SS[1].ratio - 2) < 0.05, SS[1].ratio + "×");
  ok("shrink it to a quarter and it is four times as stable", Math.abs(SS[2].ratio - 4) < 0.1, SS[2].ratio + "×");
}

/* =====================================================================
   7. Border points, k-means, modes, dimension
   ===================================================================== */
head("The two things that bite");
{
  const sc = byId("platforms");
  const D = distanceMatrix(sc.pts);
  const core = coreDistances(sc.pts, M_DEFAULT, D);
  const o = HOOK.order;
  const rand = mulberry32(PRE.config.SEED_ORDER);
  const parts = new Set();
  for (let t = 0; t < o.trials; t++) {
    const ord = Array.from({ length: sc.pts.length }, (_, i) => i);
    for (let i = ord.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
    parts.add(canonicalPartition(dbscan(sc.pts, o.eps, M_DEFAULT, { D, core, order: ord }).labels));
  }
  ok("shuffling the rows really does change DBSCAN's answer", parts.size > 1,
     parts.size + " distinct partitions from " + o.trials + " orderings at eps " + o.eps + " m");
  ok("the article's worst case is 8 answers and 32 pings moving",
     o.partitions === 8 && o.flips === 32, o.partitions + " answers, " + o.flips + " pings");
  ok("DBSCAN* has no such freedom — it is a function of the data alone", (() => {
    const a = canonicalPartition(dbscanStar(sc.pts, o.eps, M_DEFAULT, { D, core }).labels);
    const mst = mreachMST(sc.pts, M_DEFAULT, D, core);
    const b = canonicalPartition(clustersFromMST(mst, core, o.eps, 1).labels);
    return a === b;
  })());
}
{
  ok("k-means with k = 2 on the platforms is worse than dealing labels at random",
     HOOK.kmeans.ari < 0, num(HOOK.kmeans.ari, 4));
  ok("...because it cuts the first platform in half along its length rather than between the two",
     HOOK.kmeans.split.length === 2 && Math.min(...HOOK.kmeans.split) / Math.max(...HOOK.kmeans.split) > 0.85,
     HOOK.kmeans.split.join(" / "));
  ok("but on the café day k-means finds all three stops, which the article says out loud",
     HARD.kmeans.found === HARD.nStops && HARD.kmeans.ari > HARD.atDefault.best.ari,
     "ARI " + num(HARD.kmeans.ari, 3) + " vs the best eps at " + num(HARD.atDefault.best.ari, 3));
}
{
  /* The unimodality condition, from the density itself rather than from the
     formula the prose quotes. */
  const SD = PRE.config.MODE_SD;
  let wrong = 0;
  for (let s = 5; s <= 80; s++) {
    const sep = s / 10;
    const p = twoModeProfile(sep, SD, 4001);
    const mid = Math.floor(p.xs.length / 2);
    // a dip at the centre means the midpoint is a local minimum
    const dip = p.ys[mid] < p.ys[mid - 40] && p.ys[mid] < p.ys[mid + 40];
    if (dip !== sep > 2.0001) {
      if (Math.abs(sep - 2) > 0.05) wrong++;
    }
  }
  ok("the mixture is bimodal exactly above 2σ and unimodal below it", wrong === 0,
     wrong + " separations where the density disagreed with the condition");

  const M = PRE.modes;
  const at = (s) => M.reduce((a, b) => (Math.abs(b.sep - s) < Math.abs(a.sep - s) ? b : a));
  ok("below 2σ no density clustering finds anything, which is correct rather than a failure",
     M.filter((r) => r.sep < 2).every((r) => r.best < 0.05));
  ok("at 3σ the density is bimodal and the best density clustering still scores 0.12 against a possible 0.71",
     Math.abs(at(3).best - 0.1229) < 0.01 && Math.abs(at(3).bayes - 0.7051) < 0.01,
     at(3).best + " vs " + at(3).bayes);
  const caught = M.find((r) => r.best >= 0.9 * r.bayes);
  ok("they do not come within a tenth of each other until somewhere past 5σ",
     caught && caught.sep > 5 && caught.sep < 5.8, caught ? caught.sep + "σ" : "never");
  ok("so the gap between a mode existing and being findable is over 3σ wide",
     caught && caught.sep - 2 > 3 && caught.sep - 2 < 3.6, num(caught.sep - 2, 1) + "σ");
}
{
  const D = PRE.dims;
  ok("the best achievable agreement does not degrade with dimension at all",
     D.every((r) => r.best > 0.999), D.map((r) => r.d + ":" + r.best).join(" "));
  ok("but the working range narrows by about fivefold from 2 to 80 dimensions",
     D[0].width / D[D.length - 1].width > 4 && D[0].width / D[D.length - 1].width < 6,
     num(D[0].width / D[D.length - 1].width, 1) + "×");
  ok("and it narrows monotonically", D.every((r, i) => i === 0 || r.width <= D[i - 1].width + 1e-9));
  ok("distance concentration is visible in the same table",
     D[0].ratio < 0.02 && D[D.length - 1].ratio > 0.6,
     num(D[0].ratio, 3) + " -> " + num(D[D.length - 1].ratio, 3));
}

/* =====================================================================
   8. The walkthrough, and the drawing helpers
   ===================================================================== */
head("The walkthrough and the drawing");
{
  const EPS = 5, MINPTS = 5;
  const n = PATCH.length;
  const D = distanceMatrix(PATCH);
  const core = coreDistances(PATCH, MINPTS, D);
  const isCore = PATCH.map((_, i) => core[i] <= EPS);
  const roles = PATCH.map((_, i) => {
    if (isCore[i]) return "core";
    for (let j = 0; j < n; j++) if (isCore[j] && D[i * n + j] <= EPS) return "border";
    return "noise";
  });
  const counts = { core: 0, border: 0, noise: 0 };
  for (const r of roles) counts[r]++;
  ok("the patch has all three kinds of ping on it, in useful numbers",
     counts.core > 20 && counts.border >= 8 && counts.noise >= 4,
     counts.core + " core, " + counts.border + " border, " + counts.noise + " noise");
  ok("every patch ping is inside the patch's own window, so nothing is clipped",
     PATCH.every((p) => p[0] > PATCH_EXTENT.x0 && p[0] < PATCH_EXTENT.x1 && p[1] > PATCH_EXTENT.y0 && p[1] < PATCH_EXTENT.y1));
  // the ping the first step draws a circle on: the core ping with the fewest neighbours
  let ex = 0, bn = Infinity;
  for (let i = 0; i < n; i++) {
    if (!isCore[i]) continue;
    let k = 0;
    for (let j = 0; j < n; j++) if (j !== i && D[i * n + j] <= EPS) k++;
    if (k < bn) { bn = k; ex = i; }
  }
  ok("the ping the walkthrough circles has a countable number of neighbours", bn + 1 >= MINPTS && bn + 1 <= 12,
     bn + 1 + " inside its circle, minPts = " + MINPTS);
  ok("a border ping really is not core and really is inside some core ping's circle",
     roles.every((r, i) => r !== "border" || (!isCore[i] && PATCH.some((_, j) => isCore[j] && D[i * n + j] <= EPS))));
  ok("a noise ping is outside every core ping's circle",
     roles.every((r, i) => r !== "noise" || PATCH.every((_, j) => !isCore[j] || D[i * n + j] > EPS)));
}
{
  /* Every ping in every scenario is inside the drawn window. A stop whose tail
     is clipped is a different distribution from the one the comments describe. */
  for (const sc of DATA)
    ok("every ping on " + sc.id + " is inside the drawn map",
       sc.pts.every((p) => p[0] > EXTENT.x0 && p[0] < EXTENT.x1 && p[1] > EXTENT.y0 && p[1] < EXTENT.y1));
}
{
  /* The region paths are the union of the eps-discs around the CORE points of
     each cluster, and nothing else. Checked in the plot transform the page
     uses, because that helper takes it explicitly for exactly this reason. */
  const S = scene("platforms", M_DEFAULT);
  const plot = fitEqual(EXTENT, 600, 460, { top: 10, right: 10, bottom: 30, left: 40 });
  const shot = S.at(10.1);
  const paths = regionPaths(S.sc.pts, S.core, shot.labels, 10.1, plot);
  ok("there is one region per cluster", paths.length === shot.nClusters,
     paths.length + " regions, " + shot.nClusters + " clusters");
  ok("every region ring is closed", paths.every((p) => p.rings.every((r) =>
     Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 1e-6)));
  ok("no region path contains NaN or undefined", paths.every((p) => !/undefined|NaN/.test(p.d)));
  {
    /*
      The outline is a contour on a grid, so the claim worth checking is the
      one the picture makes: every core ping of a cluster is INSIDE its own
      cluster's outline and outside every other cluster's. Ray casting on the
      returned rings, in the same screen coordinates the browser will fill.
    */
    const inRings = (rings, x, y) => {
      let n = 0;
      for (const r of rings)
        for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
          const [xi, yi] = r[i];
          const [xj, yj] = r[j];
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) n++;
        }
      return n % 2 === 1;
    };
    let outside = 0, shared = 0, tested = 0;
    for (let i = 0; i < S.sc.pts.length; i++) {
      if (shot.labels[i] < 0 || S.core[i] > 10.1) continue;
      tested++;
      const x = plot.X(S.sc.pts[i][0]);
      const y = plot.Y(S.sc.pts[i][1]);
      const hits = paths.filter((p) => inRings(p.rings, x, y));
      if (!hits.some((p) => p.cluster === shot.labels[i])) outside++;
      if (hits.length > 1) shared++;
    }
    ok("every core ping is inside its own cluster's drawn outline", outside === 0,
       outside + " of " + tested + " outside");
    ok("...and inside no other cluster's", shared === 0, shared + " in two outlines at once");
  }
}
{
  /* The scenario data is what the prose describes it as. */
  ok("the two platforms are 32 m apart, as the intro says", (() => {
    const sc = byId("platforms");
    const y1 = sc.stop.map((s, i) => [s, i]).filter(([s]) => s === 0).map(([, i]) => sc.pts[i][1]);
    const y2 = sc.stop.map((s, i) => [s, i]).filter(([s]) => s === 1).map(([, i]) => sc.pts[i][1]);
    const m1 = y1.reduce((a, b) => a + b, 0) / y1.length;
    const m2 = y2.reduce((a, b) => a + b, 0) / y2.length;
    return Math.abs(Math.abs(m1 - m2) - 32) < 1.5;
  })());
  ok("changing how much walking there is leaves every stop bit-identical", (() => {
    const a = withTransit("cafe-bakery-park", 1);
    const b = withTransit("cafe-bakery-park", 4);
    return a.nStopPings === b.nStopPings &&
      a.pts.slice(0, a.nStopPings).every((p, i) => p[0] === b.pts[i][0] && p[1] === b.pts[i][1]) &&
      b.nTransit > 3 * a.nTransit - 5;
  })());
}

head("Two claims the prose makes about the shape of the tree");
{
  /* "a branch of size two that exists over a few centimetres of eps". Measured
     on the raw hierarchy: how long a pair of pings that merged with each other
     first survives before something absorbs it. */
  const S = scene("cafe-bakery-park", M_DEFAULT);
  const L = S.link;
  const lives = [];
  for (const nd of L.nodes) {
    if (nd.left >= L.n || nd.right >= L.n) continue;
    const parent = L.nodes.find((p) => p.left === nd.id || p.right === nd.id);
    if (parent) lives.push(parent.dist - nd.dist);
  }
  lives.sort((a, b) => a - b);
  const med = lives[Math.floor(lives.length / 2)];
  ok("a two-ping branch really does last only centimetres", lives.length > 5 && med < 0.15,
     lives.length + " of them, median " + (100 * med).toFixed(1) + " cm");

  /* And the number the tree figure's caption prints for the hierarchy it
     summarises. */
  const T = treeOf(S, 10);
  ok("the drawn tree is a summary of a far larger hierarchy",
     L.nodes.length > 20 * T.nodes.length, L.nodes.length + " internal nodes condensed to " + T.nodes.length);

  /*
    The claim that was in this caption before the checks were written - "at the
    bottom of the tree there are dozens of clusters DBSCAN would report" - is
    false, and this is what killed it: the most sub-minimum clusters any eps
    produces is twelve, three and seven. DBSCAN* makes a sparse point noise
    rather than a tiny cluster, so small eps gives noise, not confetti.
  */
  for (const id of DATA.map((d) => d.id)) {
    const sc = scene(id, M_DEFAULT);
    let most = 0;
    for (const bp of breakpoints(sc.mst, sc.core)) {
      if (bp.at > 60) break;
      const r = clustersFromMST(sc.mst, sc.core, bp.at, 1);
      const sizes = new Map();
      for (const l of r.labels) if (l >= 0) sizes.set(l, (sizes.get(l) || 0) + 1);
      most = Math.max(most, [...sizes.values()].filter((v) => v < 10).length);
    }
    ok("small eps gives noise rather than a scatter of tiny clusters [" + id + "]", most < 20,
       "at most " + most + " clusters of fewer than 10 pings, at any eps");
  }
}

/* ===================================================================== */
console.log("\n" + (failures ? failures + " OF " + checks + " CHECKS FAILED" : "ALL " + checks + " CHECKS PASS") + "\n");
process.exit(failures ? 1 : 0);
