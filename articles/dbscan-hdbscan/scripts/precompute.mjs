/*
  Everything on this page that costs more than a fraction of a second.

  It runs from the SAME src/ modules the page imports and writes
  src/precomputed.js, which is committed. The first check in
  verify/check-numbers.mjs re-runs this and diffs the result against the
  committed file, so a stale precompute is a failing check rather than a quiet
  lie - and it catches the case where the data changed and nobody re-ran
  anything, which computing in the browser would not.

  The eps sweep itself is NOT here. Enumerating every distinct answer for one
  (dataset, minPts) takes about 40 ms, so the hook does it live and the reader
  can move minPts and watch the whole staircase change. What is here is the
  work that is quadratic in the number of parameter settings: the (eps, minPts)
  grid, the classic-DBSCAN grid with border points, the min_cluster_size sweep,
  the separation sweep, and the dimension table.

  Run: npm run precompute
*/
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { DATA, withTransit, twoModes, EXTENT } from "../src/datasets.js";
import {
  distanceMatrix, coreDistances, mreachMST, euclideanMST, clustersFromMST, breakpoints,
  dbscan, hdbscan, ari, recovery, epsSweep, canonicalPartition, kmeans, kdistCurve, knee,
} from "../src/density.js";
import { mulberry32 } from "../src/rng.js";

export const CONFIG = {
  M_DEFAULT: 8,
  MCS_DEFAULT: 15,
  EPS_MAX: 60,
  SEARCH_LO: 2, // the range a reader would plausibly search over, in metres
  SEARCH_HI: 40,
  MCS_LO: 5, // and in points
  MCS_HI: 60,
  M_GRID: [2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 30],
  CLASSIC_STEP: 0.1,
  ORDER_TRIALS: 24,
  SEED_ORDER: 5,
  SEED_KMEANS: 17,
  MODE_SD: 6,
  MODE_N: 600,
};

const r3 = (x) => Math.round(x * 1000) / 1000;
const r4 = (x) => Math.round(x * 10000) / 10000;
const median = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };

/* The window in eps where every stop is found, and how much of a plausible
   search range that is. Exact - it reads the enumerated sweep, not a grid. */
function windowOf(rows, nStops) {
  let lo = null, hi = null, width = 0, right = 0;
  for (const r of rows) {
    if (r.found !== nStops) continue;
    right++;
    if (lo === null) lo = r.lo;
    hi = r.hi;
    width += Math.min(r.hi, CONFIG.SEARCH_HI) - Math.max(r.lo, CONFIG.SEARCH_LO);
  }
  return { lo: lo === null ? null : r3(lo), hi: hi === null ? null : r3(hi), width: r3(Math.max(0, width)), right };
}

/* ------------------------------------------------- the (eps, minPts) grid */
function gridOf(sc) {
  const dm = distanceMatrix(sc.pts);
  return CONFIG.M_GRID.map((m) => {
    const core = coreDistances(sc.pts, m, dm);
    const mst = mreachMST(sc.pts, m, dm, core);
    const rows = epsSweep(mst, core, sc.stop, sc.nStops, { max: CONFIG.EPS_MAX });
    const w = windowOf(rows, sc.nStops);
    let best = { found: -1, ari: -1 };
    for (const r of rows) {
      const cl = clustersFromMST(mst, core, r.at, 1);
      const a = ari(sc.stop, cl.labels);
      if (r.found > best.found || (r.found === best.found && a > best.ari))
        best = { found: r.found, ari: r4(a), eps: r3(r.at), nClusters: r.nClusters };
    }
    const kn = knee(kdistCurve(core));
    const atKnee = clustersFromMST(mst, core, kn.eps, 1);
    const rk = recovery(sc.stop, sc.nStops, atKnee.labels);
    return {
      m, ...w, best, distinct: rows.length,
      elbow: { eps: r3(kn.eps), pct: r4(kn.frac), found: rk.found, nClusters: atKnee.nClusters,
               inside: w.lo !== null && kn.eps >= w.lo && kn.eps <= w.hi },
    };
  });
}

/*
  The two numbers the café/bakery/park section turns on: the eps at which two
  stops merge into one cluster, and the eps at which the loosest stop first
  holds together. When the first is below the second there is no window, and
  the distance between them is how badly it is missing.
*/
function crossings(sc) {
  const dm = distanceMatrix(sc.pts);
  const idx = (g) => sc.stop.map((s, i) => [s, i]).filter(([s]) => s === g).map(([, i]) => i);
  const G = Array.from({ length: sc.nStops }, (_, g) => idx(g));
  const rows = CONFIG.M_GRID.map((m) => {
    const core = coreDistances(sc.pts, m, dm);
    const mst = mreachMST(sc.pts, m, dm, core);
    let merge = null, mergePair = null;
    const cohere = new Array(sc.nStops).fill(null);
    for (const bp of breakpoints(mst, core)) {
      if (bp.lo > CONFIG.EPS_MAX) break;
      const r = clustersFromMST(mst, core, bp.at, 1);
      if (merge === null)
        for (let a = 0; a < sc.nStops && merge === null; a++)
          for (let b = a + 1; b < sc.nStops && merge === null; b++) {
            const ca = new Set(G[a].map((i) => r.labels[i]).filter((l) => l >= 0));
            if (G[b].some((i) => r.labels[i] >= 0 && ca.has(r.labels[i]))) { merge = bp.lo; mergePair = [a, b]; }
          }
      for (let g = 0; g < sc.nStops; g++) {
        if (cohere[g] !== null) continue;
        const c = new Map();
        for (const i of G[g]) if (r.labels[i] >= 0) c.set(r.labels[i], (c.get(r.labels[i]) || 0) + 1);
        if ([...c.values()].some((v) => v >= 0.8 * G[g].length)) cohere[g] = bp.lo;
      }
      if (merge !== null && cohere.every((v) => v !== null)) break;
    }
    // The loosest stop is the one that takes the longest to hold together, and
    // it is the one the window has to wait for.
    let loose = 0;
    for (let g = 1; g < sc.nStops; g++) if ((cohere[g] ?? Infinity) > (cohere[loose] ?? Infinity)) loose = g;
    return {
      m, merge: merge === null ? null : r3(merge), mergePair, loose,
      cohere: cohere[loose] === null ? null : r3(cohere[loose]),
      cohereAll: cohere.map((v) => (v === null ? null : r3(v))),
      gap: merge === null || cohere[loose] === null ? null : r3(cohere[loose] - merge),
    };
  });
  return rows;
}

/* Does the failure survive border points? Classic DBSCAN, on a 10 cm grid. */
function classicGrid(sc) {
  const dm = distanceMatrix(sc.pts);
  return CONFIG.M_GRID.map((m) => {
    const core = coreDistances(sc.pts, m, dm);
    let any = false;
    let best = { found: -1 };
    for (let eps = 1; eps <= CONFIG.SEARCH_HI; eps += CONFIG.CLASSIC_STEP) {
      const r = dbscan(sc.pts, eps, m, { D: dm, core });
      const rec = recovery(sc.stop, sc.nStops, r.labels);
      if (rec.found === sc.nStops) any = true;
      if (rec.found > best.found) best = { found: rec.found, eps: r3(eps), nClusters: r.nClusters };
    }
    return { m, any, best };
  });
}

/*
  HDBSCAN across the whole plausible min_cluster_size range.

  min_samples is held at M_DEFAULT, the same neighbour count the eps sweep
  holds minPts at. That is what makes the two comparable: one parameter varies
  in each, and it is the parameter the comparison is about. The library
  defaults min_samples to min_cluster_size, which couples two different
  questions together, so that version is measured too and reported beside it -
  it is what somebody actually gets out of the box.
*/
function mcsSweep(sc, minSamples) {
  const dm = distanceMatrix(sc.pts);
  const rows = [];
  for (let mcs = CONFIG.MCS_LO; mcs <= CONFIG.MCS_HI; mcs++) {
    const h = hdbscan(sc.pts, mcs, minSamples === null ? null : minSamples, { D: dm });
    const rec = recovery(sc.stop, sc.nStops, h.labels);
    rows.push({
      mcs, found: rec.found, nClusters: h.nClusters, ari: r4(ari(sc.stop, h.labels)),
      noise: r4(h.labels.filter((l) => l < 0).length / h.labels.length),
      transitInCluster: r4(rec.transitInCluster),
    });
  }
  const good = rows.filter((r) => r.found === sc.nStops);
  return { rows, share: r4(good.length / rows.length), lo: good.length ? good[0].mcs : null, hi: good.length ? good[good.length - 1].mcs : null };
}

/* What mutual reachability buys: the width of the window, not the best answer. */
function linkageWindows(sc) {
  const dm = distanceMatrix(sc.pts);
  const n = sc.pts.length;
  const out = [];
  for (const m of [1, 4, 8, 16, 24]) {
    const core = m === 1 ? new Float64Array(n) : coreDistances(sc.pts, m, dm);
    const mst = m === 1 ? euclideanMST(sc.pts, dm) : mreachMST(sc.pts, m, dm, core);
    const rows = epsSweep(mst, core, sc.stop, sc.nStops, { max: CONFIG.EPS_MAX, minSize: 12 });
    const w = windowOf(rows, sc.nStops);
    out.push({ m, ...w, best: Math.max(...rows.map((r) => r.found)) });
  }
  return out;
}

/* ------------------------------------------------------------- the extras */

function orderDependence(sc) {
  const dm = distanceMatrix(sc.pts);
  const n = sc.pts.length;
  const m = CONFIG.M_DEFAULT;
  const core = coreDistances(sc.pts, m, dm);
  let worst = { partitions: 0, flips: 0, eps: 0, border: 0 };
  for (let eps = 3; eps <= 25; eps += 0.25) {
    const rand = mulberry32(CONFIG.SEED_ORDER);
    const runs = [];
    const parts = new Set();
    for (let t = 0; t < CONFIG.ORDER_TRIALS; t++) {
      const ord = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
      const r = dbscan(sc.pts, eps, m, { D: dm, core, order: ord });
      const c = canonicalPartition(r.labels).split(",");
      runs.push(c);
      parts.add(c.join(","));
    }
    let flips = 0;
    for (let i = 0; i < n; i++) { const v = new Set(runs.map((r) => r[i])); if (v.size > 1) flips++; }
    let border = 0;
    for (let i = 0; i < n; i++) {
      if (core[i] <= eps) continue;
      for (let j = 0; j < n; j++) if (core[j] <= eps && dm[i * n + j] <= eps) { border++; break; }
    }
    if (parts.size > worst.partitions || (parts.size === worst.partitions && flips > worst.flips))
      worst = { partitions: parts.size, flips, eps: r3(eps), border };
  }
  return { ...worst, trials: CONFIG.ORDER_TRIALS };
}

/* The elbow, over every combination the article could have used, plus the
   single-stray-ping test. */
function elbowStudy() {
  const pct = [];
  for (const sc of DATA)
    for (const m of [3, 4, 5, 6, 8, 10, 12, 16, 20, 25]) pct.push(knee(kdistCurve(coreDistances(sc.pts, m))).frac);
  for (const s of [0, 0.5, 2, 3, 5, 8])
    for (const m of [4, 8, 16]) {
      const sc = withTransit("platforms", s);
      pct.push(knee(kdistCurve(coreDistances(sc.pts, m))).frac);
    }
  const mean = pct.reduce((a, b) => a + b, 0) / pct.length;
  const sd = Math.sqrt(pct.reduce((a, b) => a + (b - mean) ** 2, 0) / pct.length);
  const base = DATA[0];
  const strayPts = base.pts.concat([[290, 12]]);
  return {
    n: pct.length,
    min: r4(Math.min(...pct)), max: r4(Math.max(...pct)), median: r4(median(pct)), sd: r4(sd),
    stray: {
      before: r3(knee(kdistCurve(coreDistances(base.pts, CONFIG.M_DEFAULT))).eps),
      after: r3(knee(kdistCurve(coreDistances(strayPts, CONFIG.M_DEFAULT))).eps),
    },
  };
}

/* Two Gaussians: the population is bimodal above 2 sigma, and still not
   findable for a long time afterwards. Compared against the best a perfect
   midpoint split could score, so the gap is a gap and not a difficulty. */
function modeStudy() {
  const out = [];
  for (let s = 10; s <= 70; s += 2) {
    const sep = s / 10;
    const t = twoModes(sep, CONFIG.MODE_N, CONFIG.MODE_SD, 77);
    const dm = distanceMatrix(t.pts);
    const bayes = ari(t.side, t.pts.map((p) => (p[0] > 150 ? 1 : 0)));
    let best = 0, bestK = 0;
    for (const m of [5, 8, 12, 20, 30]) {
      const core = coreDistances(t.pts, m, dm);
      const mst = mreachMST(t.pts, m, dm, core);
      for (const bp of breakpoints(mst, core)) {
        if (bp.at > 45) break;
        const r = clustersFromMST(mst, core, bp.at, 15);
        const a = ari(t.side, r.labels);
        if (a > best) { best = a; bestK = r.nClusters; }
      }
    }
    const h = hdbscan(t.pts, 30, 12, { D: dm });
    out.push({ sep: r3(sep), bimodal: sep > 2, bayes: r4(bayes), best: r4(best), bestK, hdb: r4(ari(t.side, h.labels)), hdbK: h.nClusters });
  }
  return out;
}

/* Dimension. The same three clusters, with the extra axes pure noise. */
function dimStudy() {
  const out = [];
  const mk = (d) => {
    const r = mulberry32(1234);
    const g = () => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
    const centres = [[0, 0], [52, 0], [26, 45]];
    const pts = [], lab = [];
    for (let c = 0; c < 3; c++) for (let i = 0; i < 120; i++) {
      pts.push(new Array(d).fill(0).map((_, k) => (k < 2 ? centres[c][k] : 0) + 4 * g()));
      lab.push(c);
    }
    return { pts, lab };
  };
  for (const d of [2, 3, 5, 8, 12, 20, 40, 80]) {
    const { pts, lab } = mk(d);
    const n = pts.length;
    const dm = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      let s = 0;
      for (let k = 0; k < d; k++) s += (pts[i][k] - pts[j][k]) ** 2;
      const v = Math.sqrt(s);
      dm[i * n + j] = v; dm[j * n + i] = v;
    }
    const core = coreDistances(pts, 10, dm);
    const mst = mreachMST(pts, 10, dm, core);
    let best = 0, width = 0;
    for (const bp of breakpoints(mst, core)) {
      const a = ari(lab, clustersFromMST(mst, core, bp.at, 20).labels);
      if (a > best) best = a;
      if (a >= 0.9) width += bp.hi - bp.lo;
    }
    let within = [], between = [];
    for (let i = 0; i < n; i++) {
      let a = Infinity, b = Infinity;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        if (lab[j] === lab[i]) a = Math.min(a, dm[i * n + j]); else b = Math.min(b, dm[i * n + j]);
      }
      within.push(a); between.push(b);
    }
    out.push({ d, best: r4(best), width: r3(width), ratio: r4(median(within) / median(between)) });
  }
  return out;
}

/* Two identical clusters, one of them shrunk. Stability is in points per
   metre, so the compact one wins by exactly the scale factor. */
function stabilityScale() {
  const rand = mulberry32(4);
  const g = () => { let u = 0; while (u === 0) u = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); };
  const base = Array.from({ length: 120 }, () => [g(), g()]);
  return [1, 0.5, 0.25].map((s) => {
    const pts = base.map((p) => [p[0] * s - 40, p[1] * s]).concat(base.map((p) => [p[0] + 40, p[1]]));
    const h = hdbscan(pts, 20, 8);
    const st = [...h.S.entries()].filter(([c]) => h.chosen.has(c)).map(([, v]) => v).sort((a, b) => b - a);
    return { scale: s, stabilities: st.map(r3), ratio: r3(st[0] / st[st.length - 1]) };
  });
}

/* --------------------------------------------------------------- assemble */
export function run() {
  const scenarios = DATA.map((sc) => {
    const dm = distanceMatrix(sc.pts);
    const core = coreDistances(sc.pts, CONFIG.M_DEFAULT, dm);
    const byStop = [];
    for (let g = 0; g < sc.nStops; g++) {
      const v = sc.stop.map((s, i) => [s, i]).filter(([s]) => s === g).map(([, i]) => core[i]);
      byStop.push(r3(median(v)));
    }
    const transitCore = r3(median(sc.stop.map((s, i) => [s, i]).filter(([s]) => s < 0).map(([, i]) => core[i])));
    /* Over every ping that belongs to a stop, rather than the mean of the
       per-stop medians - the prose compares "inside a stop" against "on the
       walk", and that is the statistic for it. */
    const stopsCore = r3(median(sc.stop.map((s, i) => [s, i]).filter(([s]) => s >= 0).map(([, i]) => core[i])));
    const grid = gridOf(sc);
    const atDefault = grid.find((g) => g.m === CONFIG.M_DEFAULT);
    const km = kmeans(sc.pts, sc.nStops, mulberry32(CONFIG.SEED_KMEANS));
    const kmRec = recovery(sc.stop, sc.nStops, km.labels);
    const biggest = sc.stopNames.map((_, g) => sc.stop.filter((s) => s === g).length);
    const split = (() => {
      const idx = sc.stop.map((s, i) => [s, i]).filter(([s]) => s === 0).map(([, i]) => i);
      const c = new Map();
      for (const i of idx) c.set(km.labels[i], (c.get(km.labels[i]) || 0) + 1);
      return [...c.values()].sort((a, b) => b - a);
    })();
    return {
      id: sc.id, name: sc.name, blurb: sc.blurb,
      n: sc.pts.length, nStops: sc.nStops, nStopPings: sc.nStopPings, nTransit: sc.nTransit,
      stopNames: sc.stopNames, stopSizes: biggest,
      medianCore: { byStop, stops: stopsCore, transit: transitCore },
      grid, atDefault, crossings: crossings(sc),
      searchShare: r4(atDefault.width / (CONFIG.SEARCH_HI - CONFIG.SEARCH_LO)),
      classic: classicGrid(sc),
      mcs: mcsSweep(sc, CONFIG.M_DEFAULT),
      mcsCoupled: mcsSweep(sc, null),
      linkage: linkageWindows(sc),
      order: orderDependence(sc),
      kmeans: { k: sc.nStops, ari: r4(ari(sc.stop, km.labels)), found: kmRec.found, split },
    };
  });

  return {
    config: CONFIG, extent: EXTENT,
    scenarios,
    elbow: elbowStudy(),
    modes: modeStudy(),
    dims: dimStudy(),
    stabilityScale: stabilityScale(),
  };
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) main();

function main() {
  const t0 = Date.now();
  const result = run();
  const here = dirname(fileURLToPath(import.meta.url));
  const banner = `/*
  GENERATED by scripts/precompute.mjs - do not edit by hand.

  Re-run it after touching src/datasets.js, src/density.js or the config in the
  script. verify/check-numbers.mjs re-derives this whole object and fails if it
  does not match, so an edit here without a re-run is caught rather than shipped.
*/
`;
  writeFileSync(join(here, "..", "src", "precomputed.js"), banner + "export default " + JSON.stringify(result) + ";\n");
  console.log("wrote src/precomputed.js in " + ((Date.now() - t0) / 1000).toFixed(1) + "s");
  for (const s of result.scenarios) {
    console.log("  " + s.id.padEnd(18) +
      "window " + (s.atDefault.lo === null ? "EMPTY".padEnd(16) : ("[" + s.atDefault.lo.toFixed(1) + ", " + s.atDefault.hi.toFixed(1) + "]").padEnd(16)) +
      " eps " + (100 * s.searchShare).toFixed(1).padStart(5) + "% of range" +
      "   mcs " + (100 * s.mcs.share).toFixed(1).padStart(5) + "% of range" +
      "   elbow " + (s.atDefault.elbow.inside ? "inside " : "misses ") +
      "   k-means ARI " + s.kmeans.ari.toFixed(3));
  }
}
