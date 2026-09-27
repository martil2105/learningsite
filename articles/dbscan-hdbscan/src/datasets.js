/*
  A day of location pings.

  Every scenario on this page is the same kind of object: a phone that logged
  where it was every so often, all day. Two things make this a better setting
  for density clustering than the usual two-moons picture.

  First, the axes are metres. Both of them. There is no scaler in the way, so
  eps is a distance a reader can have an opinion about - "twelve metres" is a
  claim about the world, where "0.4 standardised units" is a claim about a
  preprocessing step. Everything drawn here is drawn at equal aspect for the
  same reason.

  Second, the noise is not noise. The pings logged while walking between stops
  lie along paths, and a path is a one-dimensional filament of moderate density
  running straight between two clusters - which is exactly the structure that
  bridges them at the eps a sparse stop needs. The failure this article is
  about is built into the application, not into a counterexample.

  Densities are chosen, not tuned: a stop's ping density is (time spent) /
  (area covered), so a long sit in a small area is dense and a long wander over
  a lawn is sparse, by construction. The numbers below are what a logger at
  roughly one fix per 20 seconds and a GPS scatter of a few metres would give.
*/
import { mulberry32, gaussian } from "./rng.js";

export const EXTENT = { x0: 0, y0: 0, x1: 300, y1: 220 };

/* Keep every generated ping inside the drawn window, by rejection at the
   source rather than by clipping afterwards. A stop whose tail is cut off is a
   different distribution from the one these comments describe, and a ping
   outside the window is a coordinate system that has quietly broken. */
const inside = (p, pad = 4) =>
  p[0] > EXTENT.x0 + pad && p[0] < EXTENT.x1 - pad && p[1] > EXTENT.y0 + pad && p[1] < EXTENT.y1 - pad;

function draw(n, gen, rand, pad = 4) {
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 400) {
    const p = gen(rand);
    if (inside(p, pad)) out.push(p);
  }
  return out;
}

/* A stationary stop: isotropic GPS scatter about a fixed place. */
const blob = (cx, cy, sd) => (rand) => [cx + sd * gaussian(rand), cy + sd * gaussian(rand)];

/* A stop spread over an area rather than a point - a lawn, a concourse. */
const patch = (cx, cy, w, h) => (rand) => [cx + w * (rand() - 0.5), cy + h * (rand() - 0.5)];

/* Somewhere long and thin: a platform, a market street, a queue. */
const strip = (x0, y0, x1, y1, sd) => (rand) => {
  const t = rand();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  const off = sd * gaussian(rand);
  return [x0 + t * dx + off * nx, y0 + t * dy + off * ny];
};

/* Pings logged while walking a route: uniform in arc length along a polyline,
   with lateral scatter. Several traversals of the same route land on the same
   filament, which is the whole point - a corridor you use ten times a day can
   carry more pings per square metre than a lawn you sat on for an hour. */
const route = (pts, sd) => {
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push({ a: pts[i - 1], b: pts[i], L, cum: total });
    total += L;
  }
  return (rand) => {
    const s = rand() * total;
    const seg = segs[Math.max(0, segs.findIndex((g) => g.cum + g.L > s))] || segs[segs.length - 1];
    const t = (s - seg.cum) / seg.L;
    const dx = seg.b[0] - seg.a[0];
    const dy = seg.b[1] - seg.a[1];
    const nx = -dy / seg.L;
    const ny = dx / seg.L;
    const off = sd * gaussian(rand);
    return [seg.a[0] + t * dx + off * nx, seg.a[1] + t * dy + off * ny];
  };
};

/*
  The scenarios.

  `stops` are the places the phone actually stopped - the thing a clustering is
  supposed to recover. `transit` is everything logged in between. Both are
  ground truth, available to the commentary and to verify/, and to nothing that
  runs on the points.
*/
const SPECS = [
  {
    id: "platforms",
    name: "Two platforms",
    blurb: "Waiting for a train, first on one platform and then on the other.",
    seed: 20260910,
    stops: [
      { name: "platform 1", n: 150, gen: strip(58, 150, 188, 150, 3.4) },
      { name: "platform 2", n: 128, gen: strip(58, 118, 188, 118, 3.4) },
    ],
    transit: [{ n: 46, gen: route([[26, 44], [70, 74], [128, 92], [196, 104], [200, 134], [188, 150]], 4.6) }],
  },
  {
    id: "cafe-bakery-park",
    name: "Café, bakery, park",
    blurb: "Two stops a few doors apart on one street, then a long slow hour on a lawn.",
    seed: 771107,
    stops: [
      { name: "café terrace", n: 172, gen: blob(66, 162, 4.6) },
      { name: "bakery", n: 62, gen: blob(90, 153, 4.6) },
      { name: "the park", n: 104, gen: patch(214, 70, 72, 50) },
    ],
    transit: [
      { n: 20, gen: route([[90, 153], [130, 140], [168, 116], [196, 92]], 5.0) },
      { n: 16, gen: route([[196, 92], [232, 62], [258, 44]], 5.0) },
      { n: 14, gen: route([[16, 196], [40, 178], [66, 162]], 5.0) },
    ],
  },
  {
    id: "whole-day",
    name: "A whole day",
    blurb: "Five stops, an order of magnitude between the densest and the loosest.",
    seed: 3140807,
    stops: [
      { name: "the office", n: 158, gen: blob(62, 168, 5.6) },
      { name: "the gym", n: 66, gen: blob(252, 176, 4.4) },
      { name: "coffee", n: 42, gen: blob(150, 128, 3.0) },
      { name: "market street", n: 84, gen: strip(46, 62, 150, 44, 3.6) },
      { name: "the park", n: 92, gen: patch(244, 78, 62, 54) },
    ],
    transit: [
      { n: 22, gen: route([[62, 168], [104, 150], [150, 128]], 4.8) },
      { n: 20, gen: route([[150, 128], [196, 150], [252, 176]], 4.8) },
      { n: 18, gen: route([[252, 176], [258, 128], [244, 78]], 4.8) },
      { n: 20, gen: route([[46, 62], [30, 110], [62, 168]], 4.8) },
      { n: 16, gen: route([[150, 44], [200, 56], [244, 78]], 4.8) },
    ],
  },
];

/*
  Two independent streams, deliberately. The stops are drawn from one and the
  transit pings from another, so changing HOW MUCH transit there is leaves
  every stop bit-identical. The k-distance section leans on that: it varies the
  amount of walking and nothing else, and the claim that the stops did not move
  is a fact about the generator rather than an assurance.
*/
function build(spec, transitScale = 1) {
  const rs = mulberry32(spec.seed);
  const rt = mulberry32(spec.seed ^ 0x5bf03635);
  const pts = [];
  const stop = [];
  spec.stops.forEach((s, i) => {
    for (const p of draw(s.n, s.gen, rs)) {
      pts.push(p);
      stop.push(i);
    }
  });
  const nStopPings = pts.length;
  for (const t of spec.transit) {
    for (const p of draw(Math.round(t.n * transitScale), t.gen, rt)) {
      pts.push(p);
      stop.push(-1);
    }
  }
  return {
    id: spec.id,
    name: spec.name,
    blurb: spec.blurb,
    pts,
    stop,
    stopNames: spec.stops.map((s) => s.name),
    nStops: spec.stops.length,
    nStopPings,
    nTransit: pts.length - nStopPings,
    transitScale,
  };
}

/* The same day with more or less walking in it, for the k-distance figure. */
export const withTransit = (id, scale) => build(SPECS.find((s) => s.id === id), scale);

export const DATA = SPECS.map((s) => build(s)); // not SPECS.map(build): map passes the index as the second argument, which would become transitScale
export const byId = (id) => DATA.find((d) => d.id === id);
export const DEFAULT_ID = "platforms";

/*
  The two-ends-of-a-table figure, which is about a theorem rather than about a
  day: an equal mixture of two isotropic Gaussians is unimodal exactly when
  their centres are closer than 2 sigma. Generated on demand so the separation
  can be a slider.
*/
export function twoModes(sepSigmas, n = 260, sd = 6, seed = 99) {
  const rand = mulberry32(seed);
  const half = (sepSigmas * sd) / 2;
  const cx = 150;
  const cy = 110;
  const out = [];
  const side = [];
  for (let i = 0; i < n; i++) {
    const s = i % 2;
    out.push([cx + (s ? half : -half) + sd * gaussian(rand), cy + sd * gaussian(rand)]);
    side.push(s);
  }
  return { pts: out, side, sd, sep: sepSigmas * sd };
}

/* The mixture density along the axis joining the two centres, normalised so
   the peak is 1. Drawn under the point cloud in that figure. */
export function twoModeProfile(sepSigmas, sd = 6, n = 160) {
  const half = (sepSigmas * sd) / 2;
  const span = Math.max(4 * sd, 2.2 * half + 3 * sd);
  const f = (x) =>
    Math.exp(-((x - half) ** 2) / (2 * sd * sd)) + Math.exp(-((x + half) ** 2) / (2 * sd * sd));
  const xs = [];
  for (let i = 0; i < n; i++) xs.push(-span + (2 * span * i) / (n - 1));
  const ys = xs.map(f);
  const peak = Math.max(...ys);
  return { xs, ys: ys.map((y) => y / peak), centre: f(0) / peak, half };
}

/*
  A small patch for the walkthrough, in its own window.

  Sixty-odd pings rather than five hundred, because the mechanism section asks
  the reader to count neighbours, and you cannot count neighbours in a cloud.
  Its own extent, so nothing has to be clipped: everything drawn is inside the
  window by construction.
*/
export const PATCH_EXTENT = { x0: 0, y0: 0, x1: 72, y1: 54 };

export const PATCH = (() => {
  const rand = mulberry32(8191);
  const pts = [];
  const push = (p) => {
    if (p[0] > 3 && p[0] < 69 && p[1] > 3 && p[1] < 51) pts.push(p);
  };
  // a stop: forty minutes in one place
  while (pts.length < 34) push([22 + 5.2 * gaussian(rand), 33 + 5.2 * gaussian(rand)]);
  // a second, looser stop
  while (pts.length < 52) push([54 + 6.4 * gaussian(rand), 20 + 5.6 * gaussian(rand)]);
  // the walk between them, and one ping logged on the way in
  const trail = [[30, 30], [38, 27], [45, 24]];
  while (pts.length < 60) {
    const t = rand() * (trail.length - 1);
    const i = Math.min(trail.length - 2, Math.floor(t));
    const f = t - i;
    push([
      trail[i][0] + f * (trail[i + 1][0] - trail[i][0]) + 2.1 * gaussian(rand),
      trail[i][1] + f * (trail[i + 1][1] - trail[i][1]) + 2.1 * gaussian(rand),
    ]);
  }
  push([9, 46]);
  push([65, 47]);
  return pts;
})();
