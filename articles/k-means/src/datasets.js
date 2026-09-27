/*
  Every dataset on this page is generated here, from a seeded stream, so the
  page and verify/check-numbers.mjs see byte-identical points.

  Coordinates live in a nominal [0, 100] box in both axes and are treated as
  already comparable - which is a modelling assumption, not a fact, and the
  conclusion says so. Real features arrive in different units and the choice of
  scaling silently sets their relative weight in the objective.
*/
import { mulberry32, gaussian } from "./rng.js";

const blob = (rand, n, cx, cy, sx, sy, shear = 0, group = 0) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = gaussian(rand) * sx;
    const v = gaussian(rand) * sy;
    out.push({ x: cx + u + shear * v, y: cy + v, group });
  }
  return out;
};

/*
  The main dataset, used by the hook and by everything in the first half.

  Three round, well-separated groups: one broad one on the left holding 80
  points, and two tight ones on the right holding 35 each. Nobody looking at
  this picture is in any doubt about the answer, which is the point - if the
  algorithm can land somewhere visibly wrong HERE, the failure is not about
  hard data.
*/
export function mainData() {
  const rand = mulberry32(20260906);
  return [
    ...blob(rand, 80, 38, 55, 12, 12, 0, 0),
    ...blob(rand, 35, 76, 76, 6, 6, 0, 1),
    ...blob(rand, 35, 76, 36, 6, 6, 0, 2),
  ];
}

export const MAIN = mainData();
export const MAIN_K = 3;

/*
  The four shapes in "What k-means assumes". Each is a different way of
  violating the same assumption, and each k is the number of groups actually
  generated - so a wrong answer is wrong on its own terms, not because it was
  asked for the wrong k.
*/
export const SHAPES = [
  {
    key: "variance",
    name: "Unequal spread",
    k: 3,
    caption: "Three round groups. One is six times as wide as the other two, and holds more points.",
    points: (() => {
      const rand = mulberry32(7717);
      return [
        ...blob(rand, 50, 36, 70, 4, 4, 0, 0),
        ...blob(rand, 50, 60, 70, 4, 4, 0, 1),
        ...blob(rand, 80, 48, 48, 24, 24, 0, 2),
      ];
    })(),
  },
  {
    key: "aniso",
    name: "Stretched groups",
    k: 3,
    caption: "The same three groups, sheared into long diagonal bands.",
    points: (() => {
      const rand = mulberry32(4242);
      return [
        ...blob(rand, 60, 30, 62, 4, 15, 1.15, 0),
        ...blob(rand, 60, 48, 62, 4, 15, 1.15, 1),
        ...blob(rand, 60, 66, 62, 4, 15, 1.15, 2),
      ];
    })(),
  },
  {
    key: "sizes",
    name: "Unequal populations",
    k: 3,
    caption: "One group holds 200 points; the other two hold 25 each.",
    points: (() => {
      const rand = mulberry32(31337);
      return [
        ...blob(rand, 200, 34, 50, 13, 13, 0, 0),
        ...blob(rand, 25, 76, 68, 4, 4, 0, 1),
        ...blob(rand, 25, 78, 34, 4, 4, 0, 2),
      ];
    })(),
  },
  {
    key: "moons",
    name: "Not convex",
    k: 2,
    caption: "Two interleaving arcs. No straight line separates them.",
    points: (() => {
      const rand = mulberry32(99);
      const out = [];
      for (let i = 0; i < 90; i++) {
        const t = Math.PI * (i / 89);
        out.push({
          x: 50 + 30 * Math.cos(t) + gaussian(rand) * 2.4,
          y: 42 + 30 * Math.sin(t) + gaussian(rand) * 2.4,
          group: 0,
        });
      }
      for (let i = 0; i < 90; i++) {
        const t = Math.PI * (i / 89);
        out.push({
          x: 35 + 30 * Math.cos(t + Math.PI) + gaussian(rand) * 2.4,
          y: 58 - 30 * Math.sin(t + Math.PI) + gaussian(rand) * 2.4,
          group: 1,
        });
      }
      return out;
    })(),
  },
];

/*
  Structureless data, for the point in the conclusion that k-means has no way
  of declining. 150 points drawn uniformly from the same box as MAIN.
*/
export const UNIFORM = (() => {
  const rand = mulberry32(5150);
  const out = [];
  for (let i = 0; i < 150; i++) out.push({ x: 8 + rand() * 84, y: 8 + rand() * 84, group: 0 });
  return out;
})();

/*
  Data extent with a margin, per dataset. Nothing here is forced into a fixed
  [0, 100] box: a wide Gaussian has tails, and cropping them to make the axes
  tidy would be quietly deleting the points that decide the answer.
*/
export function extent(points, pad = 0.06) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const m = Math.max(x1 - x0, y1 - y0) * pad;
  return { x0: x0 - m, x1: x1 + m, y0: y0 - m, y1: y1 + m };
}

// Number of ways to partition n labelled points into exactly k non-empty
// groups: the Stirling number of the second kind, exactly, in BigInt.
export function stirling2(n, k) {
  let row = [1n];
  for (let i = 1; i <= n; i++) {
    const next = new Array(Math.min(i, k) + 1).fill(0n);
    for (let j = 1; j <= Math.min(i, k); j++) {
      next[j] = BigInt(j) * (row[j] || 0n) + (row[j - 1] || 0n);
    }
    row = next;
  }
  return row[k] || 0n;
}

// "6.1 x 10^70" from a BigInt, for prose that has to stay readable.
export function scientific(big, sig = 2) {
  const s = big.toString();
  const mantissa = (Number(s.slice(0, sig + 1)) / Math.pow(10, sig)).toFixed(sig - 1);
  return { mantissa, exponent: s.length - 1 };
}
