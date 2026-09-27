/*
  What the page reads.

  Two kinds of thing live here. The first is the live machinery: given a
  scenario and a minPts, build the distance matrix, the core distances and the
  mutual reachability MST once, cache them, and hand back an object every
  figure can slice at any eps. One (scenario, minPts) costs about 40 ms to set
  up, and after that a change of eps is a union-find pass, so the slider is
  genuinely live rather than a lookup into a table of frames.

  The second is the numbers the prose asserts, pulled out of src/precomputed.js
  and given names. Nothing in a component computes a headline figure of its
  own: if a sentence contains a number, that number is here, and
  verify/check-numbers.mjs re-derives it from src/ rather than reading it back.
*/
import { DATA, byId, EXTENT, withTransit, twoModes, twoModeProfile } from "./datasets.js";
import {
  distanceMatrix, coreDistances, mreachMST, euclideanMST, linkage, clustersFromMST,
  breakpoints, epsSweep, recovery, dbscan, hdbscan, condense, stabilities, selectEOM,
  labelsFromSelection, ari, kdistCurve, knee, kmeans, canonicalPartition,
} from "./density.js";
import { marchingSquares } from "./contour.js";
import { mulberry32 } from "./rng.js";
import P from "./precomputed.js";

export { EXTENT, DATA, byId, withTransit, twoModes, twoModeProfile, kmeans, ari, recovery, dbscan, canonicalPartition, kdistCurve, knee, coreDistances, distanceMatrix, clustersFromMST, hdbscan, mulberry32 };

export const CONFIG = P.config;
export const M_DEFAULT = P.config.M_DEFAULT;
export const MCS_DEFAULT = P.config.MCS_DEFAULT;
export const SEARCH = { lo: P.config.SEARCH_LO, hi: P.config.SEARCH_HI };
export const MCS_RANGE = { lo: P.config.MCS_LO, hi: P.config.MCS_HI };

export const PRE = P;
export const pre = (id) => P.scenarios.find((s) => s.id === id);
export const HOOK = pre("platforms");
export const HARD = pre("cafe-bakery-park");
export const DAY = pre("whole-day");

/* -------------------------------------------------------------- formatting */
export const int = (x) => Math.round(x).toLocaleString("en-US");
export const num = (x, d = 2) => Number(x).toFixed(d);
export const pct = (x, d = 0) => (100 * x).toFixed(d) + "%";
export const m = (x, d = 1) => Number(x).toFixed(d) + " m";
export const plural = (n, one, many) => n + " " + (n === 1 ? one : many);

/* ------------------------------------------------------------------ caches */
const DM = new Map();
const SCENE = new Map();

function matrixOf(id) {
  if (!DM.has(id)) DM.set(id, distanceMatrix(byId(id).pts));
  return DM.get(id);
}

/*
  Everything a figure needs for one (scenario, minPts), computed once.

  `sweep` is the exact enumeration of every distinct answer eps can produce -
  not a sampled grid. It is what the staircase under the slider draws, and it
  is why the article can say "367 clusterings, none of them right" rather than
  "we tried a lot of values".
*/
export function scene(id, mPts) {
  const key = id + "/" + mPts;
  if (SCENE.has(key)) return SCENE.get(key);
  const sc = byId(id);
  const D = matrixOf(id);
  const core = coreDistances(sc.pts, mPts, D);
  const mst = mreachMST(sc.pts, mPts, D, core);
  const sweep = epsSweep(mst, core, sc.stop, sc.nStops, { max: P.config.EPS_MAX });
  const win = windowOf(sweep, sc.nStops);
  const kn = knee(kdistCurve(core));
  const out = {
    sc, id, m: mPts, D, core, mst, sweep, win, knee: kn,
    link: linkage(mst, sc.pts.length),
    maxCore: Math.max(...core),
    at(eps, minSize = 1) {
      const r = clustersFromMST(mst, core, eps, minSize);
      return { ...r, rec: recovery(sc.stop, sc.nStops, r.labels) };
    },
  };
  SCENE.set(key, out);
  return out;
}

export function windowOf(sweep, nStops) {
  let lo = null, hi = null, width = 0, n = 0;
  for (const r of sweep) {
    if (r.found !== nStops) continue;
    n++;
    if (lo === null) lo = r.lo;
    hi = r.hi;
    width += Math.min(r.hi, SEARCH.hi) - Math.max(r.lo, SEARCH.lo);
  }
  return { lo, hi, width: Math.max(0, width), n, share: Math.max(0, width) / (SEARCH.hi - SEARCH.lo) };
}

/*
  The union of the eps-discs around the core points, grouped by cluster, as a
  real outline.

  The obvious construction - one circle subpath per core point, filled with the
  nonzero rule - gets the FILL right and the stroke catastrophically wrong: it
  draws every circle's outline, so five hundred overlapping rings come out as a
  scribble with the union somewhere underneath. There is no way to stroke the
  boundary of a union of subpaths in SVG, so the boundary has to be computed.

  Which is cheap, because the thing being contoured is trivial: stamp
  (eps - distance) onto a grid with a max-reduction, one disc at a time,
  touching only the cells a disc can reach, then run marching squares at zero.
  Half a million grid writes at the largest eps, a few tens of thousands at a
  typical one.

  Takes the plot transform explicitly. A version that quietly defaulted to the
  identity is how an entire Voronoi layer once got drawn in the corner of four
  charts.
*/
const GRID_NX = 240;

export function regionPaths(pts, core, labels, eps, plot, { ext = EXTENT } = {}) {
  const byCluster = new Map();
  for (let i = 0; i < pts.length; i++) {
    if (labels[i] < 0 || core[i] > eps) continue;
    if (!byCluster.has(labels[i])) byCluster.set(labels[i], []);
    byCluster.get(labels[i]).push(i);
  }
  const W = ext.x1 - ext.x0;
  const H = ext.y1 - ext.y0;
  const nx = GRID_NX;
  const ny = Math.max(24, Math.round((GRID_NX * H) / W));
  const cw = W / (nx - 1);
  const ch = H / (ny - 1);
  const field = new Float32Array(nx * ny);
  const out = [];

  for (const [c, idx] of [...byCluster.entries()].sort((a, b) => a[0] - b[0])) {
    field.fill(-eps);
    for (const i of idx) {
      const px = pts[i][0];
      const py = pts[i][1];
      const i0 = Math.max(0, Math.floor((px - eps - ext.x0) / cw));
      const i1 = Math.min(nx - 1, Math.ceil((px + eps - ext.x0) / cw));
      const j0 = Math.max(0, Math.floor((py - eps - ext.y0) / ch));
      const j1 = Math.min(ny - 1, Math.ceil((py + eps - ext.y0) / ch));
      for (let j = j0; j <= j1; j++) {
        const gy = ext.y0 + j * ch;
        const dy = gy - py;
        const row = j * nx;
        for (let i2 = i0; i2 <= i1; i2++) {
          const dx = ext.x0 + i2 * cw - px;
          const v = eps - Math.sqrt(dx * dx + dy * dy);
          if (v > field[row + i2]) field[row + i2] = v;
        }
      }
    }
    /* Hold the outermost ring below the threshold. A region running off the
       edge otherwise produces an OPEN chain, and an open chain drawn as a
       filled path is closed by a straight chord back to its start, which can
       cut clean across the chart. */
    for (let i = 0; i < nx; i++) { field[i] = -eps; field[(ny - 1) * nx + i] = -eps; }
    for (let j = 0; j < ny; j++) { field[j * nx] = -eps; field[j * nx + nx - 1] = -eps; }

    const rings = marchingSquares(field, nx, ny, 0).map((line) =>
      line.map(([gi, gj]) => [plot.X(ext.x0 + gi * cw), plot.Y(ext.y0 + gj * ch)])
    );
    if (!rings.length) continue;
    const d = rings
      .map((r) => r.map((p, k) => (k ? "L " : "M ") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ") + " Z")
      .join(" ");
    out.push({ cluster: c, d, rings, size: idx.length, members: idx });
  }
  return out;
}

/* ------------------------------------------------------- axes for the map */
export const MAP_TICKS = [0, 50, 100, 150, 200, 250, 300].filter((v) => v >= EXTENT.x0 && v <= EXTENT.x1);
export const MAP_TICKS_Y = [0, 50, 100, 150, 200].filter((v) => v >= EXTENT.y0 && v <= EXTENT.y1);
export const tickLabel = (v) => (v === 0 ? "0" : v + " m");

/* ------------------------------------------------- HDBSCAN, with the tree */
const HDB = new Map();
export function hdb(id, mcs, minSamples = null) {
  const key = id + "/" + mcs + "/" + minSamples;
  if (HDB.has(key)) return HDB.get(key);
  const sc = byId(id);
  const h = hdbscan(sc.pts, mcs, minSamples, { D: matrixOf(id) });
  const out = { ...h, sc, rec: recovery(sc.stop, sc.nStops, h.labels), ari: ari(sc.stop, h.labels) };
  HDB.set(key, out);
  return out;
}

/*
  The condensed tree, laid out for drawing.

  x is a slot per cluster, allocated so a cluster sits over the middle of its
  children; y is lambda, which is one over a distance, so the top of the chart
  is where things are dense. Width is how many points the cluster still holds
  at that level - the falling-off is the shape the picture is for.
*/
export function condensedLayout(h) {
  const kids = h.kids;
  const rows = h.cond.rows;
  const n = h.cond.n;
  const pointsOf = new Map();
  for (const r of rows) {
    if (r.child >= n) continue;
    if (!pointsOf.has(r.parent)) pointsOf.set(r.parent, []);
    pointsOf.get(r.parent).push(r.lambda);
  }
  const sizeAtBirth = new Map([[h.cond.root, n]]);
  for (const r of rows) if (r.child >= n) sizeAtBirth.set(r.child, r.size);

  let slot = 0;
  const node = new Map();
  const walk = (c) => {
    const ch = (kids.get(c) || []).slice().sort((a, b) => (sizeAtBirth.get(b) || 0) - (sizeAtBirth.get(a) || 0));
    const lam = (pointsOf.get(c) || []).slice().sort((a, b) => a - b);
    let x;
    if (!ch.length) x = slot++;
    else {
      const xs = ch.map((k) => walk(k).x);
      x = (Math.min(...xs) + Math.max(...xs)) / 2;
    }
    // The level at which this cluster stops existing: where its children were
    // born, or where the last of its points fell out.
    const death = ch.length
      ? node.get(ch[0]).birth
      : lam.length ? Math.max(...lam.filter(Number.isFinite)) : h.birth.get(c);
    const rec = {
      id: c, x, birth: h.birth.get(c), death, size: sizeAtBirth.get(c) || 0,
      stability: h.S.get(c) || 0, selected: h.chosen.has(c), children: ch,
      leaving: lam.filter(Number.isFinite),
    };
    node.set(c, rec);
    return rec;
  };
  walk(h.cond.root);
  const all = [...node.values()];
  return {
    nodes: all, byId: node, slots: slot,
    lamMax: Math.max(...all.map((r) => r.death).filter(Number.isFinite)),
    // A cluster still holding `size` points at birth loses them one at a time;
    // this is how many are left at a given lambda.
    remaining: (rec, l) => rec.size - rec.leaving.filter((x) => x <= l).length -
      rec.children.reduce((a, k) => a + (l >= node.get(k).birth ? node.get(k).size : 0), 0),
  };
}

/*
  The readout under every figure that clusters something.

  Built here rather than in a template because an {#if} block strips the
  leading whitespace of its contents, so a figure spliced next to one renders
  glued to the word after it - which has happened in three articles in three
  different shapes. It also means the sentence and the check assert the same
  thing: verify/ calls this function.
*/
export function verdict(sc, rec, nClusters) {
  const faults = [];
  const covered = new Set();
  for (const [a, b] of rec.merged) {
    faults.push(sc.stopNames[a] + " and " + sc.stopNames[b] + " are one cluster");
    covered.add(a);
    covered.add(b);
  }
  for (let g = 0; g < sc.nStops; g++) {
    if (rec.per[g].found || covered.has(g)) continue;
    if (rec.per[g].noise > 0.4) faults.push(sc.stopNames[g] + " is " + pct(rec.per[g].noise) + " noise");
    else faults.push(sc.stopNames[g] + " is split up");
  }
  const count = plural(nClusters, "cluster", "clusters");
  if (rec.found === sc.nStops)
    return {
      ok: true,
      line: count + " — every stop found, and " + pct(rec.transitInCluster) + " of the walking swept in with them.",
    };
  return {
    ok: false,
    line: count + " — " + rec.found + " of " + sc.nStops + " stops found. " +
      faults.slice(0, 2).join("; ").replace(/^./, (c) => c.toUpperCase()) + ".",
  };
}

/*
  The same day with one extra ping, logged somewhere nothing else happened.

  It exists for one claim: the elbow recipe reads its far endpoint off a single
  order statistic, so one stray fix can move the recommendation by most of its
  own value. The stray is placed by hand, well away from everything and inside
  the drawn window, and the stops are untouched.
*/
export const STRAY_AT = [290, 12];
const STRAY = new Map();
export function strayScene(id, mPts) {
  const key = id + "/" + mPts;
  if (STRAY.has(key)) return STRAY.get(key);
  const sc = byId(id);
  const pts = sc.pts.concat([STRAY_AT.slice()]);
  const stop = sc.stop.concat([-1]);
  const D = distanceMatrix(pts);
  const core = coreDistances(pts, mPts, D);
  const mst = mreachMST(pts, mPts, D, core);
  const sweep = epsSweep(mst, core, stop, sc.nStops, { max: CONFIG.EPS_MAX });
  const out = {
    sc: { ...sc, pts, stop }, id, m: mPts, D, core, mst, sweep,
    win: windowOf(sweep, sc.nStops), knee: knee(kdistCurve(core)),
  };
  STRAY.set(key, out);
  return out;
}

/*
  The hierarchy for one scene, condensed at a given min_cluster_size and laid
  out for drawing. Same code path as HDBSCAN's - the tree the reader drags a
  line across IS the tree HDBSCAN cuts branch by branch two sections later.
*/
export function treeOf(S, mcs) {
  const cond = condense(S.link, mcs);
  const { S: stab, birth } = stabilities(cond);
  const { chosen, kids } = selectEOM(cond, stab);
  const h = { cond, S: stab, birth, chosen, kids };
  /*
    HDBSCAN's own answer for this min_cluster_size, from the same tree. Cheap,
    because the expensive part - the distance matrix and the MST - was built
    once with the scene and is not touched here, so the slider is live rather
    than a lookup into precomputed frames.
  */
  const sel = labelsFromSelection(cond, chosen);
  return {
    ...condensedLayout(h), cond, stab, birth, chosen, kids,
    labels: sel.labels, clusterIds: sel.clusterIds, nClusters: sel.nClusters,
    rec: recovery(S.sc.stop, S.sc.nStops, sel.labels),
    ari: ari(S.sc.stop, sel.labels),
  };
}

/* lambda is one over a distance. The tree is drawn in metres, because metres
   are what the reader has been sliding all article. */
export const epsOf = (lam) => (lam > 0 && Number.isFinite(lam) ? 1 / lam : Infinity);
