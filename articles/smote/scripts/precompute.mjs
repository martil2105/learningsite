/*
  Everything on this page that is too slow to compute while it paints.

  The sweeps and the classifier comparison run from the SAME src/ modules the
  page imports, and write src/precomputed.js, which is committed. The first
  check in verify/check-numbers.mjs re-runs this and diffs the result against
  the committed file, so a stale precompute is a failing check rather than a
  quiet lie - which is a stronger guarantee than computing in the browser,
  because it also catches the case where the data changed and nobody re-ran
  anything.

  Run: node scripts/precompute.mjs
*/
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { DATA, EXTENT, N_LEGIT } from "../src/datasets.js";
import {
  smote, kNearestWithin, borderlineFlags, ennKeep, normalTerritory, convexHull, inHull,
  childMoments, traceVar,
} from "../src/smote.js";
import { marchingSquares } from "../src/contour.js";
import { mulberry32 } from "../src/rng.js";

export const CONFIG = {
  K_DEFAULT: 5,
  K_MAX: 21,
  SWEEP_CHILDREN: 20000,
  HULL_TRIAL_CHILDREN: 50000,
  CLASSIFIER_K: 25,
  BORDERLINE_M: 5,
  ENN_K: 3,
  EVAL_GRID: 130,
  BOUNDARY_GRID: 140,
  SEED_SWEEP: 7,
  SEED_FIT: 31,
};

/* The kind each minority point was drawn from - not available to any algorithm
   here, only to the commentary. */
function kindsOf(sc) {
  const out = [];
  for (const { kind, n } of sc.spec) for (let i = 0; i < n; i++) out.push(kind);
  return out;
}

/* --------------------------------------------------------------- the sweep */
function sweepScenario(sc) {
  const kinds = kindsOf(sc);
  const realSpread = traceVar(sc.minority);
  const hull = convexHull(sc.minority);
  const rows = [];

  for (let k = 1; k <= Math.min(CONFIG.K_MAX, sc.minority.length - 1); k++) {
    const nbrs = kNearestWithin(sc.minority, k);
    let crossPairs = 0;
    let crossPoints = 0;
    for (let i = 0; i < nbrs.length; i++) {
      const c = nbrs[i].filter((j) => kinds[j] !== kinds[i]).length;
      crossPairs += c;
      if (c > 0) crossPoints++;
    }
    const rand = mulberry32(CONFIG.SEED_SWEEP);
    const kids = smote(sc.minority, k, CONFIG.SWEEP_CHILDREN, rand);
    const pts = kids.map((c) => c.p);
    const bad = pts.filter((p) => normalTerritory(p, sc)).length;
    const outside = pts.filter((p) => !inHull(p, hull)).length;

    rows.push({
      k,
      contaminated: bad / pts.length,
      outsideHull: outside,
      crossPairs,
      crossPairsTotal: k * sc.minority.length,
      crossPoints,
      // Exact, from childMoments - not the spread of the sampled children.
      spreadRatio: childMoments(sc.minority, k).trace / realSpread,
      spreadSampled: traceVar(pts) / realSpread,
    });
  }
  return rows;
}

/* -------------------------------------------------------- the classifier */
const GRID = (() => {
  const n = CONFIG.EVAL_GRID;
  const g = [];
  const { x0, x1, y0, y1 } = EXTENT;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++)
      g.push([x0 + ((x1 - x0) * (i + 0.5)) / n, y0 + ((y1 - y0) * (j + 0.5)) / n]);
  return g;
})();

/* Top-k by insertion into a small buffer. A full sort per query is forty
   thousand sorts of two thousand elements, which is most of a minute for
   nothing. */
function knnScore(train, labels, k, q) {
  const bd = new Float64Array(k).fill(Infinity);
  const bl = new Int8Array(k);
  for (let j = 0; j < train.length; j++) {
    const t = train[j];
    const d = (q[0] - t[0]) ** 2 + (q[1] - t[1]) ** 2;
    if (d >= bd[k - 1]) continue;
    let m = k - 1;
    while (m > 0 && bd[m - 1] > d) { bd[m] = bd[m - 1]; bl[m] = bl[m - 1]; m--; }
    bd[m] = d; bl[m] = labels[j];
  }
  let s = 0;
  for (let t = 0; t < k; t++) s += bl[t];
  return s / k;
}

/*
  The whole threshold curve, integrated against the two class-conditional
  densities rather than estimated on a test sample.

  Both are held-out in the sense that matters - the model never saw them - and
  the integral has no sampling error at all, so a difference of half a point
  between two methods is a real difference rather than a lucky draw.
*/
function thresholdCurve(train, labels, sc) {
  const K = CONFIG.CLASSIFIER_K;
  const sco = GRID.map((g) => knnScore(train, labels, K, g));
  const fm = GRID.map((g) => sc.pMin(g));
  const fj = GRID.map((g) => sc.pMaj(g));
  const WM = fm.reduce((a, b) => a + b, 0);
  const WJ = fj.reduce((a, b) => a + b, 0);
  const out = [];
  for (let t = 0; t <= K; t++) {
    const th = t / K - 1e-9;
    let eMin = 0, eMaj = 0;
    for (let i = 0; i < GRID.length; i++) {
      const yh = sco[i] >= th ? 1 : 0;
      if (yh !== 1) eMin += fm[i];
      if (yh !== 0) eMaj += fj[i];
    }
    out.push({ th: t / K, miss: eMin / WM, falseAlarm: eMaj / WJ, balanced: 0.5 * (eMin / WM + eMaj / WJ) });
  }
  return out;
}

/*
  How much the two classifiers actually disagree.

  The figure draws two boundaries and the prose has to say something about them.
  "SMOTE's boundary bulges out here" is the kind of sentence that survives every
  code review and is simply not true of the picture beside it, so the sentence
  gets a number instead: the share of the plane where the two predictions
  differ, plain and weighted by how much data is actually there.
*/
function disagreement(a, b, thA, thB, sc) {
  const K = CONFIG.CLASSIFIER_K;
  let cells = 0, wDiff = 0, wMin = 0, wMaj = 0, wMinDiff = 0, wMajDiff = 0;
  for (const g of GRID) {
    const pa = knnScore(a.X, a.y, K, g) >= thA - 1e-9 ? 1 : 0;
    const pb = knnScore(b.X, b.y, K, g) >= thB - 1e-9 ? 1 : 0;
    const fm = sc.pMin(g), fj = sc.pMaj(g);
    wMin += fm; wMaj += fj;
    if (pa !== pb) {
      cells++;
      wMinDiff += fm; wMajDiff += fj;
    }
  }
  return {
    cells: cells / GRID.length,
    // Balanced, so a disagreement out in empty space does not count for as much
    // as one where transactions actually are.
    weighted: 0.5 * (wMinDiff / wMin + wMajDiff / wMaj),
  };
}

/* The learned boundary, as polylines in data coordinates. */
function boundaryOf(train, labels, th) {
  const n = CONFIG.BOUNDARY_GRID;
  const K = CONFIG.CLASSIFIER_K;
  const { x0, x1, y0, y1 } = EXTENT;
  const field = new Float64Array(n * n);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++)
      field[j * n + i] = knnScore(train, labels, K, [x0 + ((x1 - x0) * i) / (n - 1), y0 + ((y1 - y0) * j) / (n - 1)]);
  // Halfway between attainable scores: the field is a multiple of 1/K, so a
  // contour exactly ON an attainable level is degenerate.
  const level = th - 0.5 / K;
  return marchingSquares(field, n, n, level).map((line) =>
    simplify(line.map(([i, j]) => [x0 + ((x1 - x0) * i) / (n - 1), y0 + ((y1 - y0) * j) / (n - 1)]))
  );
}

function simplify(line, tol = 0.012) {
  const out = [line[0]];
  for (let i = 1; i < line.length - 1; i++) {
    const last = out[out.length - 1];
    if (Math.abs(line[i][0] - last[0]) + Math.abs(line[i][1] - last[1]) > tol) out.push(line[i]);
  }
  out.push(line[line.length - 1]);
  return out.map((p) => [round(p[0]), round(p[1])]);
}
const round = (x) => Math.round(x * 1000) / 1000;
const round4 = (x) => Math.round(x * 10000) / 10000;

const at = (curve, th) => curve.reduce((a, b) => (Math.abs(b.th - th) < Math.abs(a.th - th) ? b : a));
const best = (curve) => curve.reduce((a, b) => (b.balanced < a.balanced ? b : a));

function trainingSets(sc) {
  const X0 = sc.majority.concat(sc.minority);
  const y0 = sc.majority.map(() => 0).concat(sc.minority.map(() => 1));
  const need = sc.majority.length - sc.minority.length;

  const kids = smote(sc.minority, CONFIG.K_DEFAULT, need, mulberry32(CONFIG.SEED_FIT)).map((c) => c.p);

  const flags = borderlineFlags(sc.minority, sc.majority, CONFIG.BORDERLINE_M);
  const danger = flags.map((f, i) => (f === "danger" ? i : -1)).filter((i) => i >= 0);
  const kidsB = danger.length
    ? smote(sc.minority, CONFIG.K_DEFAULT, need, mulberry32(CONFIG.SEED_FIT), { from: danger }).map((c) => c.p)
    : [];

  const Xa = X0.concat(kids);
  const ya = y0.concat(kids.map(() => 1));
  const keep = ennKeep(Xa, ya, CONFIG.ENN_K);

  return {
    flags,
    danger,
    kids,
    methods: [
      { id: "none", name: "no resampling", X: X0, y: y0 },
      { id: "smote", name: "SMOTE", X: Xa, y: ya },
      { id: "borderline", name: "Borderline-SMOTE", X: X0.concat(kidsB), y: y0.concat(kidsB.map(() => 1)) },
      {
        id: "smote-enn",
        name: "SMOTE, then ENN cleaning",
        X: Xa.filter((_, i) => keep[i]),
        y: ya.filter((_, i) => keep[i]),
      },
    ],
  };
}

/* --------------------------------------------------------------- assemble */
function run() {
  const scenarios = DATA.map((sc) => {
    const sweep = sweepScenario(sc);
    const { flags, danger, kids, methods } = trainingSets(sc);
    const kindsHere = kindsOf(sc);

    const out = methods.map((m) => {
      const curve = thresholdCurve(m.X, m.y, sc);
      const half = at(curve, 0.5);
      const tuned = best(curve);
      return {
        id: m.id,
        name: m.name,
        trainSize: m.X.length,
        synthetic: m.X.length - (sc.majority.length + sc.minority.length),
        curve: curve.map((r) => ({
          th: round4(r.th), miss: round4(r.miss), falseAlarm: round4(r.falseAlarm), balanced: round4(r.balanced),
        })),
        atHalf: { th: round4(half.th), miss: round4(half.miss), falseAlarm: round4(half.falseAlarm), balanced: round4(half.balanced) },
        tuned: { th: round4(tuned.th), miss: round4(tuned.miss), falseAlarm: round4(tuned.falseAlarm), balanced: round4(tuned.balanced) },
      };
    });

    // Boundaries: three of them, which is what the last figure draws.
    const bMap = Object.fromEntries(methods.map((m) => [m.id, m]));
    const tunedNone = out.find((o) => o.id === "none").tuned.th;
    const boundaries = {
      noneHalf: boundaryOf(bMap.none.X, bMap.none.y, 0.5),
      noneTuned: boundaryOf(bMap.none.X, bMap.none.y, tunedNone),
      smoteHalf: boundaryOf(bMap.smote.X, bMap.smote.y, 0.5),
    };

    const agree = disagreement(bMap.none, bMap.smote, tunedNone, 0.5, sc);

    // The balancing run at the default k, kept so the page can say how many of
    // the children it would actually create land in the wrong place.
    const need = sc.majority.length - sc.minority.length;
    const badKids = kids.filter((p) => normalTerritory(p, sc)).length;

    return {
      id: sc.id,
      n: sc.minority.length,
      nMajority: sc.majority.length,
      kinds: kindsHere,
      borderline: { flags, danger: danger.length, noise: flags.filter((f) => f === "noise").length },
      sweep: sweep.map((r) => ({ ...r, contaminated: round4(r.contaminated), spreadRatio: round4(r.spreadRatio), spreadSampled: round4(r.spreadSampled) })),
      balancing: { need, contaminated: badKids, rate: round4(badKids / need) },
      methods: out,
      boundaries,
      tunedNoneTh: tunedNone,
      disagreement: { cells: round4(agree.cells), weighted: round4(agree.weighted) },
    };
  });

  return { config: CONFIG, N_LEGIT, extent: EXTENT, scenarios };
}

export { run };

/*
  Importable as well as runnable: verify/check-numbers.mjs calls run() and diffs
  the result against the committed file, so it must not write anything when it
  is merely imported.
*/
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (!invokedDirectly) {
  // nothing else to do - the caller wants run()
} else {
  main();
}

function main() {
const result = run();
const here = dirname(fileURLToPath(import.meta.url));
const banner = `/*
  GENERATED by scripts/precompute.mjs - do not edit by hand.

  Re-run it after touching src/datasets.js, src/smote.js or the config in the
  script. verify/check-numbers.mjs re-derives this whole object and fails if it
  does not match, so an edit here without a re-run is caught rather than shipped.
*/
`;
writeFileSync(join(here, "..", "src", "precomputed.js"), banner + "export default " + JSON.stringify(result) + ";\n");
console.log("wrote src/precomputed.js");
for (const s of result.scenarios) {
  const d = s.sweep.find((r) => r.k === CONFIG.K_DEFAULT);
  console.log(
    "  " + s.id.padEnd(14),
    "k=5 contaminated " + (100 * d.contaminated).toFixed(1) + "%",
    " balancing " + s.balancing.contaminated + "/" + s.balancing.need,
    " methods " + s.methods.map((m) => m.id + " " + (100 * m.atHalf.balanced).toFixed(1) + "/" + (100 * m.tuned.balanced).toFixed(1)).join(" ")
  );
}
}
