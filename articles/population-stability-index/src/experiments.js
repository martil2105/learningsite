/*
  The bridge between src/precomputed.js and the components: named views of the
  numbers, the formatters the prose uses, and the handful of live computations
  the page does while the reader is dragging something.

  Rule followed throughout: a number that appears in a sentence is imported
  from here, never typed. Every figure the prose quotes is either an exact
  population quantity or a simulation recorded in precomputed.js, and
  verify/check-numbers.mjs re-derives both.
*/

import { PRE } from "./precomputed.js";
import * as P from "./psi.js";
import * as D from "./datasets.js";
import { chi2Inv } from "./stats.js";
import * as MULTI from "./stats.js";
import * as RNG from "./rng.js";

export { PRE };
export const M = PRE.meta.M;
export const B = PRE.meta.B;
export const EDGES = PRE.edgesByB[B];
export const E = Array.from({ length: B }, () => 1 / B);
export const POP = PRE.population;
export const SEG = Object.fromEntries(PRE.segments.map((s) => [s.id, s]));
export const SEGS = PRE.segments;

/* ------------------------------------------------------------ formatters */

export const num = (x, d = 2) =>
  Number(x).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
export const int = (x) => Math.round(x).toLocaleString("en-GB");
export const pct = (x, d = 1) => num(x * 100, d) + "%";
export const pp = (x, d = 1) => (x > 0 ? "+" : x < 0 ? "−" : "") + num(Math.abs(x), d) + " points";
export const psiFmt = (x) => (Math.abs(x) < 0.0005 ? num(x, 4) : num(x, 3));
export const signed = (x, d = 3) => (x >= 0 ? "+" : "−") + num(Math.abs(x), d);

/* ------------------------------------------------------------- the floor */

export const floorOf = (N, bins = B, m = M) => P.floorOf(bins, N, m);
export const sdOf = (N, bins = B, m = M) => P.sdOf(bins, N, m);
export const criticalOf = (N, bins = B, m = M, alpha = 0.05) =>
  chi2Inv(1 - alpha, bins - 1) * (1 / N + 1 / m);
export const adjusted = (v, N, bins = B, m = M) => v - P.floorOf(bins, N, m);

/*
  The band a reading would sit in if nothing had moved, interpolated in log N
  from the simulated grid rather than taken from the chi-square formula.

  That matters below about twenty observations per bin, where the chi-square
  approximation understates the floor - by 76% at four per bin. Drawing the
  formula there would flatter the formula at exactly the sample sizes the
  article is complaining about, which would be the wrong kind of convenient.
*/
export function nullBand(N) {
  const g = PRE.nullGrid;
  if (N <= g[0].N) return g[0];
  if (N >= g[g.length - 1].N) return g[g.length - 1];
  let i = 0;
  while (i < g.length - 2 && g[i + 1].N < N) i++;
  const a = g[i], b = g[i + 1];
  const t = (Math.log(N) - Math.log(a.N)) / (Math.log(b.N) - Math.log(a.N));
  const mix = (k) => a[k] + t * (b[k] - a[k]);
  return { N, mean: mix("mean"), sd: mix("sd"), q05: mix("q05"), q50: mix("q50"),
           q95: mix("q95"), q99: mix("q99"), floor: mix("floor"),
           pAmber: mix("pAmber"), pRed: mix("pRed") };
}

/* --------------------------------------------------- what a reading means */

/* The location shift, in score points, that produces a given population PSI.
   Interpolated from the exact curve in precomputed.js. */
export function pointsForPsi(v) {
  const c = PRE.shiftCurve;
  if (v <= c[0].psi) return 0;
  for (let i = 1; i < c.length; i++) {
    if (c[i].psi >= v) {
      const t = (v - c[i - 1].psi) / (c[i].psi - c[i - 1].psi);
      return c[i - 1].points + t * (c[i].points - c[i - 1].points);
    }
  }
  return c[c.length - 1].points;
}

export const psiForPoints = (d) => {
  const c = PRE.shiftCurve;
  const x = Math.min(Math.abs(d), c[c.length - 1].points);
  const i = Math.min(c.length - 2, Math.floor(x));
  const t = x - c[i].points;
  return c[i].psi + t * (c[i + 1].psi - c[i].psi);
};

export const AMBER = 0.1;
export const RED = 0.25;
export const amberPoints = PRE.psiToPoints.find((r) => r.psi === 0.1);
export const redPoints = PRE.psiToPoints.find((r) => r.psi === 0.25);

/* --------------------------------------------------- live, for the lab */

/*
  A pool of (component uniform, standard normal) pairs.

  Storing the two random inputs rather than the finished score means the same
  pool can be re-read under any shift, so dragging a slider re-bins an existing
  sample instead of drawing a new one - the reader sees one population at
  different settings rather than a new population every frame. Taking the first
  N gives nested windows for the same reason.
*/
export function makePool(rand, n) {
  const u = new Float64Array(n), z = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    u[i] = rand();
    let v = 0;
    while (v === 0) v = rand();
    z[i] = Math.sqrt(-2 * Math.log(v)) * Math.cos(2 * Math.PI * rand());
  }
  return { u, z, n };
}

/* One pass: decile counts against the frozen edges, and a fine histogram for
   the picture. Both from the same loop, so a 100,000-application window costs
   about three milliseconds. */
export function readWindow(pool, n, delta, edges, fine) {
  const c = new Int32Array(edges.length + 1);
  const h = new Int32Array(fine.count);
  const w0 = D.BASELINE[0].w;
  const c0 = D.BASELINE[0], c1 = D.BASELINE[1];
  const step = (fine.hi - fine.lo) / fine.count;
  for (let i = 0; i < n; i++) {
    const cpt = pool.u[i] < w0 ? c0 : c1;
    const x = cpt.mu + cpt.sd * pool.z[i] + delta;
    let lo = 0, hi = edges.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (x < edges[mid]) hi = mid; else lo = mid + 1;
    }
    c[lo]++;
    let k = Math.floor((x - fine.lo) / step);
    if (k < 0) k = 0; else if (k >= fine.count) k = fine.count - 1;
    h[k]++;
  }
  return { counts: Array.from(c), fine: Array.from(h) };
}

export const psiOf = (counts) => P.psi(P.props(counts), E, 1e-4);
export const termsOf = (counts) => P.terms(P.props(counts), E, 1e-4);

/* The expected side, as a curve rather than a sample: the development window
   held 50,000 applications, so its histogram is smooth next to a monitoring
   month and drawing it as a density is honest as well as cleaner. */
export function baselineDensity(fine) {
  const step = (fine.hi - fine.lo) / fine.count;
  return Array.from({ length: fine.count }, (_, k) => {
    const lo = fine.lo + k * step;
    return D.mixCdf(D.BASELINE, lo + step) - D.mixCdf(D.BASELINE, lo);
  });
}

export const FINE = { lo: 380, hi: 900, count: 52 };

/*
  One month of the pack, drawn live.

  Shared between the opening question and the closing one so that the two are
  literally the same month rather than two coincidences: same seed, same order,
  same counts. The draw is from each channel's TRUE bin probabilities, so it is
  a real monitoring month and not a replay of a stored one.
*/
export function drawMonth(m) {
  const { multinomialSample } = MULTI;
  const rand = RNG.mulberry32(920000 + m * 7919);
  return SEGS.map((s) => {
    const c = multinomialSample(s.n, s.binProbs, rand);
    const a = c.map((x) => x / s.n);
    let v = 0;
    for (let i = 0; i < a.length; i++) {
      const ai = a[i] > 0 ? a[i] : 1e-4;
      v += (ai - 1 / B) * Math.log(ai / (1 / B));
    }
    return { id: s.id, a, psi: v };
  });
}
