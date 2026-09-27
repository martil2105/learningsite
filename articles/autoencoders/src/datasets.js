/*
  Three datasets, all from a seeded stream so the page and the checking script
  see identical numbers.
*/
import { mulberry32, gaussian } from "./rng.js";

/*
  PLANE: the hook. Two correlated coordinates with an obvious major axis, so
  that "the direction that loses least" is a thing the reader can see before
  anything is computed. Centred at the origin already - the article is about
  the weights, not about biases, and a mean would be a distraction.
*/
export const PLANE = (() => {
  const rand = mulberry32(20260908);
  const out = [];
  const theta = (28 * Math.PI) / 180;
  const [c, s] = [Math.cos(theta), Math.sin(theta)];
  for (let i = 0; i < 180; i++) {
    const u = gaussian(rand) * 3.1; // along the major axis
    const v = gaussian(rand) * 1.05; // across it
    out.push([c * u - s * v, s * u + c * v]);
  }
  const m = [0, 1].map((j) => out.reduce((a, r) => a + r[j], 0) / out.length);
  return out.map((r) => [r[0] - m[0], r[1] - m[1]]);
})();

/*
  WIDE: eight measured coordinates generated from two latent factors plus
  isotropic noise. There is a real two-dimensional subspace in here and a real
  gap after the second eigenvalue, which is what makes "the top-2 subspace" a
  well-posed thing to go looking for.

  The loadings are fixed rather than random-per-run: the article quotes numbers
  about this matrix and they have to be the same numbers every time.
*/
export const WIDE_D = 8;
export const WIDE_K = 2;
export const WIDE_LOADINGS = [
  [0.92, 0.11], [0.74, -0.48], [0.55, 0.63], [-0.31, 0.81],
  [0.66, 0.34], [-0.72, 0.29], [0.24, -0.77], [0.41, 0.58],
];
export const WIDE_NOISE = 0.34;

export const WIDE = (() => {
  const rand = mulberry32(773311);
  const out = [];
  for (let i = 0; i < 400; i++) {
    const f1 = gaussian(rand) * 2.4;
    const f2 = gaussian(rand) * 1.35;
    out.push(WIDE_LOADINGS.map(([a, b]) => a * f1 + b * f2 + gaussian(rand) * WIDE_NOISE));
  }
  const m = Array.from({ length: WIDE_D }, (_, j) => out.reduce((a, r) => a + r[j], 0) / out.length);
  return out.map((r) => r.map((v, j) => v - m[j]));
})();

/*
  ARC: a curve in the plane, thickened with noise. One-dimensional structure
  that no line can follow - the case where the whole linear story runs out.
*/
export const ARC = (() => {
  const rand = mulberry32(5150);
  const out = [];
  for (let i = 0; i < 220; i++) {
    const t = -1.15 + 2.3 * (i / 219);
    const x = t * 3.4;
    const y = 2.1 - 1.75 * t * t;
    out.push([x + gaussian(rand) * 0.19, y + gaussian(rand) * 0.19]);
  }
  const m = [0, 1].map((j) => out.reduce((a, r) => a + r[j], 0) / out.length);
  return out.map((r) => [r[0] - m[0], r[1] - m[1]]);
})();

export const extent2 = (X, pad = 0.1) => {
  const xs = X.map((r) => r[0]);
  const ys = X.map((r) => r[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const m = Math.max(x1 - x0, y1 - y0) * pad;
  return { x0: x0 - m, x1: x1 + m, y0: y0 - m, y1: y1 + m };
};
