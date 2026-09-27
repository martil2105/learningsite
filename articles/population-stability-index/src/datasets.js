/*
  One model, watched for a month.

  An application scorecard at a consumer lender. The score runs on the usual
  banking scale - higher is safer, odds of default double every PDO points -
  and the article's whole subject is a number computed from the HISTOGRAM of
  that score, so the histogram has to be a real shape rather than a bell.

  It is a two-component mixture on purpose. Applicants arrive as established
  files (long credit history, scores bunched high) and thin files (little
  history, lower and more spread out), and the resulting distribution is
  left-skewed with a shoulder rather than symmetric. Two of the shift shapes
  the article uses - more thin files, a new subprime source - are things that
  happen to a mixture and cannot be written down at all as "the mean moved".

  Everything about the population is available in closed form: the bin
  probabilities are differences of the mixture CDF, and the bad rate, approval
  rate and AUC are integrals against it. Nothing the prose quotes about the
  POPULATION is a Monte Carlo estimate. The only simulated quantities are the
  ones that are genuinely about sampling - which is the article's subject.
*/

import { normCdf, normInv, trapz } from "./stats.js";

/* ------------------------------------------------------------- the score */

export const SCORE_LO = 300;
export const SCORE_HI = 900;

/* The development-window population. These are the "expected" side of every
   PSI in the article. */
export const BASELINE = [
  { w: 0.63, mu: 706, sd: 58, name: "established files" },
  { w: 0.37, mu: 604, sd: 74, name: "thin files" },
];

export const mixPdf = (spec, x) =>
  spec.reduce((s, c) => s + (c.w / c.sd) * Math.exp(-0.5 * ((x - c.mu) / c.sd) ** 2) / 2.5066282746310002, 0);

export const mixCdf = (spec, x) =>
  spec.reduce((s, c) => s + c.w * normCdf((x - c.mu) / c.sd), 0);

export const mixMean = (spec) => spec.reduce((s, c) => s + c.w * c.mu, 0);

export function mixSd(spec) {
  const m = mixMean(spec);
  const m2 = spec.reduce((s, c) => s + c.w * (c.sd * c.sd + c.mu * c.mu), 0);
  return Math.sqrt(m2 - m * m);
}

/* Inverse CDF by bisection. A 3000-wide bracket halved 100 times is far past
   the last bit of a double; it is called inside quadrature loops, so the count
   is the difference between a two-minute precompute and a four-minute one. */
export function mixQuantile(spec, p) {
  let lo = -1000, hi = 2000;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (mixCdf(spec, mid) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/* One draw. Component first, then a normal within it. Three uniforms per
   observation, which is what keeps a 200,000-point pool inside a few
   milliseconds in the lab. */
export function mixSample(spec, rand) {
  const u = rand();
  let acc = 0, c = spec[spec.length - 1];
  for (let i = 0; i < spec.length; i++) {
    acc += spec[i].w;
    if (u < acc) { c = spec[i]; break; }
  }
  let v = 0;
  while (v === 0) v = rand();
  const z = Math.sqrt(-2 * Math.log(v)) * Math.cos(2 * Math.PI * rand());
  return c.mu + c.sd * z;
}

export function mixSamples(spec, n, rand) {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = mixSample(spec, rand);
  return out;
}

/* Exact probability mass in each bin, given B-1 interior edges. This is what
   a monitoring window is sampling FROM, so it is the "true" a against which a
   realised PSI is noise. */
export function binProbs(spec, edges) {
  const p = [];
  let prev = 0;
  for (const e of edges) {
    const c = mixCdf(spec, e);
    p.push(c - prev);
    prev = c;
  }
  p.push(1 - prev);
  return p;
}

/* --------------------------------------------------------- shift shapes */

/*
  The four ways a population moves, as operations on the mixture. Keeping them
  as mixtures rather than as "the data, jittered" means the resulting
  population is still available in closed form, so the article can say what a
  shift does to the approval rate and to AUC without simulating anything.
*/
export const shiftLocation = (spec, d) => spec.map((c) => ({ ...c, mu: c.mu + d }));

export function shiftSpread(spec, s) {
  const m = mixMean(spec);
  return spec.map((c) => ({ ...c, mu: m + (c.mu - m) * s, sd: c.sd * s }));
}

/* More thin files: move weight from component 0 to component 1. */
export function shiftMixWeight(spec, wThin) {
  return [
    { ...spec[0], w: 1 - wThin },
    { ...spec[1], w: wThin },
  ];
}

/* A new source feeding the bottom of the book - a fourth-party lead generator,
   a new geography - added as its own component and the rest renormalised. */
export function addSource(spec, w, mu, sd) {
  return spec.map((c) => ({ ...c, w: c.w * (1 - w) })).concat([{ w, mu, sd, name: "new source" }]);
}

/* ------------------------------------------------------ what the score is for */

/*
  The scorecard's calibration, in the form every scorecard is delivered in:
  odds of default ANCHOR_ODDS to one at ANCHOR_SCORE, doubling every PDO
  points. This is the link between "the histogram moved" and "it cost money",
  and the article needs it because PSI itself contains no reference to it at
  all - which is most of the point.
*/
export const PDO = 40;
export const ANCHOR_SCORE = 660;
export const ANCHOR_ODDS = 50; // goods per bad at ANCHOR_SCORE
export const CUTOFF = 640;

export const logOddsBad = (s) => -Math.log(ANCHOR_ODDS) + ((ANCHOR_SCORE - s) * Math.LN2) / PDO;
export const pd = (s) => 1 / (1 + Math.exp(-logOddsBad(s)));

/*
  Concept drift: the histogram is untouched and the meaning of a score
  changes. Expressed as a shift of the calibration line - `shiftPoints` says
  how many score points the same risk now sits at. This is the one kind of
  drift PSI is structurally unable to see, because it never looks at an
  outcome.
*/
export const pdShifted = (s, shiftPoints) => 1 / (1 + Math.exp(-logOddsBad(s - shiftPoints)));

/* ------------------------------------------------ exact portfolio integrals */

const GRID_N = 24001;
const GRID_LO = 150;
const GRID_HI = 1050;
const DX = (GRID_HI - GRID_LO) / (GRID_N - 1);
const GRID = Array.from({ length: GRID_N }, (_, i) => GRID_LO + i * DX);

export function badRate(spec, pdFn = pd) {
  const f = GRID.map((s) => mixPdf(spec, s));
  const num = trapz(GRID.map((s, i) => f[i] * pdFn(s)), DX);
  const den = trapz(f, DX);
  return num / den;
}

export function approvalRate(spec, cutoff = CUTOFF) {
  return 1 - mixCdf(spec, cutoff);
}

/* Bad rate among the applications the cutoff lets through. */
export function acceptedBadRate(spec, cutoff = CUTOFF, pdFn = pd) {
  const idx = GRID.map((s, i) => (s >= cutoff ? i : -1)).filter((i) => i >= 0);
  const xs = idx.map((i) => GRID[i]);
  const f = xs.map((s) => mixPdf(spec, s));
  const num = trapz(xs.map((s, i) => f[i] * pdFn(s)), DX);
  const den = trapz(f, DX);
  return num / den;
}

/*
  AUC as an exact double integral rather than a rank statistic on a sample.

    AUC = P(score of a good > score of a bad)
        = INT f(s) (1-p(s)) F_bad(s) ds / [ P(good) P(bad) ]

  where F_bad is the cumulative mass of bads below s. One pass of the grid
  builds F_bad, a second integrates. No sampling noise, so a third decimal
  place in the prose is a real third decimal place.
*/
export function auc(spec, pdFn = pd) {
  const f = GRID.map((s) => mixPdf(spec, s));
  const p = GRID.map((s) => pdFn(s));
  const fb = f.map((v, i) => v * p[i]);
  const fg = f.map((v, i) => v * (1 - p[i]));
  const Pb = trapz(fb, DX);
  const Pg = trapz(fg, DX);
  // cumulative bad mass strictly below each grid point (trapezoid, running)
  const cumB = new Array(GRID_N).fill(0);
  for (let i = 1; i < GRID_N; i++) cumB[i] = cumB[i - 1] + ((fb[i - 1] + fb[i]) / 2) * DX;
  // ties have measure zero for continuous scores; the half-mass term is the
  // trapezoid's own correction and is already inside cumB.
  const inner = fg.map((v, i) => v * cumB[i]);
  return trapz(inner, DX) / (Pg * Pb);
}

/* ------------------------------------------------------------- the month */

/*
  Four acquisition channels, one monitoring month, one scorecard.

  The volumes are the point. A monitoring pack computes the same PSI for a
  channel that wrote forty-four thousand applications and for one that wrote
  three hundred, prints both in the same column, and colours both against the
  same two thresholds. Two of these four populations did not move at all.

  `shift` is the TRUE population for that channel this month. It is never
  shown to the reader before the reveal.
*/
export const SEGMENTS = [
  {
    id: "online",
    name: "Online direct",
    n: 44000,
    truth: "A spring acquisition campaign brought in more thin files: their share of the channel went from 37% to 52%.",
    spec: shiftMixWeight(BASELINE, 0.52),
    moved: true,
  },
  {
    id: "branch",
    name: "Branch",
    n: 9300,
    truth: "Nothing. Same population as the development window.",
    spec: BASELINE,
    moved: false,
  },
  {
    id: "dealer",
    name: "Motor dealer",
    n: 2600,
    truth: "A modest drift down - the whole channel is about 6 points weaker than it was.",
    spec: shiftLocation(BASELINE, -6),
    moved: true,
  },
  {
    id: "broker",
    name: "Broker panel",
    n: 180,
    truth: "Nothing. Same population as the development window.",
    spec: BASELINE,
    moved: false,
  },
];

/* The development sample. Fixed once and never redrawn, which is what a
   development sample is: its sampling error is baked into the bin edges for
   the life of the model. */
export const BASELINE_N = 50000;
export const DEFAULT_BINS = 10;
export const BASELINE_SEED = 20260911;

/* ------------------------------------------- rearrangement inside a bin */

/*
  A monotone map that moves every observation without moving a single bin count.

  Written in the uniform coordinate u = F(x). `breaks` is the cumulative
  population mass at the bin edges - [0, F(edge1), ..., F(edge_{B-1}), 1] - and
  NOT the exact deciles, because the edges came from a finite development
  sample and the true mass in bin 4 is 0.0997 rather than 0.1. Inside each
  interval the coordinate is rescaled to t in [0,1], sent to t^gamma, and put
  back, so every point stays in the bin it started in, including in the two
  unbounded outer bins. The binned proportions are therefore IDENTICAL and PSI
  is exactly zero for any gamma - which the checks verify by re-integrating the
  warped population against the real edges rather than by asserting it.

  gamma > 1 pushes mass toward the bottom of each bin.

  If X' = Finv(w(F(X))) then P(X' <= x) = winv(F(x)), so every quantity the
  article quotes about the rearranged population is an integral in u rather
  than a simulation.
*/
function segOf(u, breaks) {
  let i = 0;
  while (i < breaks.length - 2 && u >= breaks[i + 1]) i++;
  return i;
}

export function warpU(u, breaks, gamma) {
  const i = segOf(u, breaks);
  const lo = breaks[i], hi = breaks[i + 1];
  const t = hi > lo ? (u - lo) / (hi - lo) : 0;
  return lo + Math.pow(Math.min(1, Math.max(0, t)), gamma) * (hi - lo);
}

export function unwarpU(u, breaks, gamma) {
  const i = segOf(u, breaks);
  const lo = breaks[i], hi = breaks[i + 1];
  const t = hi > lo ? (u - lo) / (hi - lo) : 0;
  return lo + Math.pow(Math.min(1, Math.max(0, t)), 1 / gamma) * (hi - lo);
}

export const breaksFromEdges = (spec, edges) => [0, ...edges.map((x) => mixCdf(spec, x)), 1];

export const warpedCdf = (spec, breaks, gamma, x) => unwarpU(mixCdf(spec, x), breaks, gamma);

/* Quadrature in u, where the density is flat. */
export function warpedIntegral(spec, breaks, gamma, g, panels = 20000) {
  let s = 0;
  for (let k = 0; k < panels; k++) {
    s += g(mixQuantile(spec, warpU((k + 0.5) / panels, breaks, gamma)));
  }
  return s / panels;
}

/* ------------------------------------------------- a categorical characteristic */

/*
  PSI is not only computed on the score. The same formula is run per input
  characteristic - where it is usually called the characteristic stability
  index - and characteristics are often categorical, with the bins given rather
  than chosen. That is where the zero-cell problem actually lives: a rare level
  can be empty by chance in a small window, and a NEW level, one that did not
  exist when the model was built, has an expected proportion of exactly zero,
  which no substitution on the actual side can repair.

  Development shares for a residential-status characteristic, of the kind every
  application scorecard has.
*/
export const RESIDENTIAL = [
  { code: "Owner, no mortgage", p: 0.148 },
  { code: "Owner, mortgaged", p: 0.392 },
  { code: "Private tenant", p: 0.271 },
  { code: "Living with parents", p: 0.098 },
  { code: "Social tenant", p: 0.083 },
  { code: "Other", p: 0.008 },
];

/* The same characteristic after a product change introduces a code that was
   not in the development data. Everything else is scaled down to make room. */
export function withNewLevel(levels, share, label = "Shared ownership") {
  return levels.map((l) => ({ ...l, p: l.p * (1 - share) })).concat([{ code: label, p: share, isNew: true }]);
}
