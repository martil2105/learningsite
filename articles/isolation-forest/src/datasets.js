/*
  Synthetic data for the isolation forest article.

  The scenario: one row per bank account, plotted by how big its transfers are
  and how often it makes them. Most accounts fall into one of two ordinary
  habits. A handful belong to neither — those are the ones we want to find.

  Everything is generated from a fixed seed so the article looks identical on
  every load, and so the numbers quoted in the prose stay true.
*/

// Mulberry32 — small, fast, seedable.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Box–Muller, one draw at a time.
function gauss(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// The plotting frame. Splits are drawn between the min and max of the data at
// a node, so nothing here depends on the units — only the picture does.
export const BOUNDS = { x0: 0, x1: 50000, y0: 0, y1: 60 };

export const AXIS = {
  x: "Typical transfer (kr)",
  y: "Transfers per week",
};

function makeAccounts() {
  const rng = mulberry32(20260906);
  const pts = [];

  // Habit one: everyday spending. Small amounts, many of them.
  for (let i = 0; i < 150; i++) {
    pts.push({
      x: clamp(1500 + gauss(rng) * 620, 120, 49500),
      y: clamp(9 + gauss(rng) * 2.6, 1, 59),
      kind: "normal",
    });
  }

  // Habit two: rent, salary, invoices. Large amounts, rarely.
  for (let i = 0; i < 58; i++) {
    pts.push({
      x: clamp(11500 + gauss(rng) * 2300, 120, 49500),
      y: clamp(3 + gauss(rng) * 1.0, 1, 59),
      kind: "normal",
    });
  }

  // Neither habit. We planted these so we can talk about them; the algorithm
  // never sees the label.
  const odd = [
    [46200, 2],
    [43800, 4],
    [38500, 26],
    [900, 52],
    [1400, 49],
    [600, 55],
    [24000, 38],
    [33000, 15],
  ];
  odd.forEach(([x, y]) => pts.push({ x, y, kind: "anomaly" }));

  return pts.map((p, i) => ({ ...p, id: i }));
}

export const accounts = makeAccounts();

// A deliberately tiny sample, for the walkthrough where every point is visible.
export const smallSample = (() => {
  const rng = mulberry32(77);
  const pts = [];
  for (let i = 0; i < 22; i++) {
    pts.push({
      x: clamp(1600 + gauss(rng) * 700, 200, 49000),
      y: clamp(9 + gauss(rng) * 2.4, 1, 59),
      kind: "normal",
    });
  }
  for (let i = 0; i < 9; i++) {
    pts.push({
      x: clamp(11500 + gauss(rng) * 2100, 200, 49000),
      y: clamp(3.2 + gauss(rng) * 1.0, 1, 59),
      kind: "normal",
    });
  }
  pts.push({ x: 44000, y: 3, kind: "anomaly" });
  pts.push({ x: 800, y: 53, kind: "anomaly" });
  return pts.map((p, i) => ({ ...p, id: i }));
})();
