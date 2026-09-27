/*
  What the page reads.

  The HOOK is live. Twenty-two points, a k-nearest-neighbours table over them
  and a few hundred children is well under a millisecond, and the reader is
  dragging a fraud row around with a finger, so it has to be.

  The SWEEPS and the CLASSIFIER COMPARISON come from src/precomputed.js, built
  by scripts/precompute.mjs out of these same modules. Four training sets, three
  scenarios and a twenty-six point threshold curve each, integrated over a
  sixteen-thousand cell grid, is five seconds - not something to do while the
  page paints. verify/check-numbers.mjs re-runs it and diffs.
*/
import P from "./precomputed.js";
import { DATA, EXTENT, byId, euros, clock, toAmount, toHour, AMOUNT_TICKS, HOUR_TICKS, LEGIT as LEGIT_MIX } from "./datasets.js";
import { convexHull, kNearestWithin, smote, normalTerritory, dist, varianceRatioAtFullK, childMoments, traceVar, balancedNeighbourVerdict, nearestIsMajority } from "./smote.js";
import { contourOf } from "./contour.js";
import { mulberry32 } from "./rng.js";

export const PRE = P;
export const CONFIG = P.config;
export const K_DEFAULT = P.config.K_DEFAULT;

/* Human names for the fraud modes. No algorithm on this page is told which
   point came from which - this is for the commentary only. */
export const KIND_LABEL = {
  testing: "card testing",
  bigTicket: "big-ticket evening",
  cashout: "overnight cash-out",
  oneOff: "one-off",
};

/*
  Where fraud is the denser of the two classes.

  The boundary is where the two class-conditional densities are equal, which is
  the boundary a classifier would learn if the classes were equally common -
  and after any resampling, equally common is exactly what they are. Stated
  rather than buried: it is a choice, it is the choice the resampling itself
  makes, and it is only computable here because the data is synthetic.
*/
const CONTOUR_N = 190;

export const SCEN = DATA.map((sc) => {
  const pre = P.scenarios.find((s) => s.id === sc.id);
  return {
    ...sc,
    pre,
    kinds: pre.kinds,
    hull: convexHull(sc.minority),
    /*
      Contoured on the LOG ratio, not the difference. Far from every mode both
      densities are tiny and their difference is tiny with them, so a contour of
      the difference spends its resolution on the least interesting part of the
      plane and picks up slivers where the two agree to nothing. The log ratio
      has the same zero set and stays smooth everywhere.
    */
    territory: contourOf((p) => Math.log(sc.pMin(p) + 1e-300) - Math.log(sc.pMaj(p) + 1e-300), EXTENT, CONTOUR_N, 0),
    sweep: pre.sweep,
    methods: pre.methods,
    boundaries: pre.boundaries,
    balancing: pre.balancing,
    disagreement: pre.disagreement,
    borderline: pre.borderline,
  };
});

export const scen = (id) => SCEN.find((s) => s.id === id);
export const HOOK = scen("as-it-arrives");
export const EASY = scen("one-kind");
export const TWO = scen("two-kinds");

/* ------------------------------------------------------------ live SMOTE

   Used by the hook, where the reader has moved one of the points and every
   neighbour table downstream of it has to be rebuilt. */
export function neighboursOf(points, k) {
  return kNearestWithin(points, k);
}

export function childrenFrom(points, k, i, count, rand) {
  const nbrs = kNearestWithin(points, k);
  const out = [];
  const cand = nbrs[i];
  for (let t = 0; t < count; t++) {
    const j = cand[t % cand.length];
    const lam = rand();
    const a = points[i];
    const b = points[j];
    out.push({ p: [a[0] + lam * (b[0] - a[0]), a[1] + lam * (b[1] - a[1])], neighbour: j, lambda: lam });
  }
  return out;
}

/* ------------------------------------------------------- headline numbers */
const row = (s, k) => s.sweep.find((r) => r.k === k);

export const HEADLINE = {
  scenario: HOOK,
  k: K_DEFAULT,
  rate: row(HOOK, K_DEFAULT).contaminated,
  made: HOOK.balancing.need,
  bad: HOOK.balancing.contaminated,
  real: HOOK.minority.length,
  ratio: HOOK.balancing.contaminated / HOOK.minority.length,
};

export const CROSS = {
  points: row(HOOK, K_DEFAULT).crossPoints,
  pairs: row(HOOK, K_DEFAULT).crossPairs,
  pairsTotal: row(HOOK, K_DEFAULT).crossPairsTotal,
};

export const HULL_TRIALS = SCEN.reduce((s, x) => s + x.sweep.reduce((a, r) => a + CONFIG.SWEEP_CHILDREN, 0), 0);
export const HULL_ESCAPES = SCEN.reduce((s, x) => s + x.sweep.reduce((a, r) => a + r.outsideHull, 0), 0);

export const VAR_IDENTITY = varianceRatioAtFullK(HOOK.minority.length);
export const VAR_EXACT_FULL = row(HOOK, HOOK.minority.length - 1).spreadRatio;

export const K_MAX_SWEEP = Math.max(...HOOK.sweep.map((r) => r.k));

/* The last figure: what the whole exercise bought. */
export const VERDICT = SCEN.map((s) => ({
  id: s.id,
  name: s.name,
  short: s.short,
  none: s.methods.find((m) => m.id === "none"),
  smote: s.methods.find((m) => m.id === "smote"),
  borderline: s.methods.find((m) => m.id === "borderline"),
  enn: s.methods.find((m) => m.id === "smote-enn"),
  disagreement: s.disagreement,
}));

/* ------------------------------------------------------------- formatting */
export const pct = (x, d = 0) => (100 * x).toFixed(d) + "%";
export const num = (x, d = 2) => x.toFixed(d);
export const int = (x) => Math.round(x).toLocaleString("en-US");
export const times = (x) => x.toFixed(1) + "×";

export { childMoments, traceVar, EXTENT, byId, euros, clock, toAmount, toHour, AMOUNT_TICKS, HOUR_TICKS, dist, normalTerritory, smote, convexHull };

/*
  The cheap, model-free check the conclusion recommends, measured on the label
  set that broke - because the conclusion claims it agrees with the density
  verdict, and a claim like that is worth computing rather than asserting.

  Twelve thousand children at the default k. Under a second, and it runs once at
  module load rather than on any interaction.
*/
export const CHEAP_CHECK = (() => {
  const kids = smote(HOOK.minority, K_DEFAULT, 12000, mulberry32(613)).map((c) => c.p);
  let agree = 0, cheap = 0, truth = 0, naive = 0;
  for (const p of kids) {
    const t = normalTerritory(p, HOOK);
    const c = balancedNeighbourVerdict(p, HOOK.minority, HOOK.majority, 3);
    if (t === c) agree++;
    if (t) truth++;
    if (c) cheap++;
    if (nearestIsMajority(p, HOOK.minority, HOOK.majority)) naive++;
  }
  return {
    n: kids.length,
    agree: agree / kids.length,
    trueRate: truth / kids.length,
    cheapRate: cheap / kids.length,
    naiveRate: naive / kids.length,
  };
})();
