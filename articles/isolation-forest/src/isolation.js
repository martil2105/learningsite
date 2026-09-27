/*
  Isolation forest, written for watching rather than for speed.

  An isolation tree is built by repeatedly picking a feature at random and a
  split value uniformly between that feature's smallest and largest value at
  the current node. A point's path length h(x) is the number of splits it takes
  before it sits alone.

  Two things here differ from a library implementation, both on purpose:

  1. We only ever expand the branch that contains the point we are looking at.
     The other branch is never built, because nothing in the answer depends on
     it. That makes the tree lazy, not different.

  2. The point being scored is added to the sample before the tree is grown,
     so "isolated" means exactly what it looks like on screen: nobody else is
     left in the box. A library instead grows the trees once and drops new
     points through them, stopping at a leaf that may still hold several
     training points and adding c(size) to account for the subtree it never
     built.

  The randomness is supplied as a fixed "stream" of draws rather than pulled
  from a generator inside the loop. Given the same stream, moving the query
  point moves the cuts continuously instead of reshuffling them, which is what
  makes the picture stable while you drag.
*/

const EULER = 0.5772156649015329;

// Expected path length of an unsuccessful search in a binary search tree of n
// nodes — the yardstick a raw path length is measured against.
export function cFactor(n) {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  return 2 * (Math.log(n - 1) + EULER) - (2 * (n - 1)) / n;
}

// A reusable sequence of (which feature, where between min and max) draws.
export function makeStream(rng, len = 64) {
  const s = new Array(len);
  for (let i = 0; i < len; i++) {
    s[i] = { dim: rng() < 0.5 ? 0 : 1, u: rng() };
  }
  return s;
}

/*
  Grow the branch containing `probe` until the probe is alone.

  Returns the cuts in order, each carrying the region it was drawn inside, so
  a chart can render the whole history at once.
*/
export function isolationPath(probe, points, bounds, stream) {
  let region = { ...bounds };
  let live = points.length ? points.slice() : [];
  // The probe joins the sample, and any exact copy of it steps aside.
  live = live.filter((p) => p !== probe);
  live.push(probe);

  const cuts = [];
  let i = 0;

  while (live.length > 1 && i < stream.length) {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const p of live) {
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
    const xWidth = xMax - xMin;
    const yWidth = yMax - yMin;
    // Every remaining point sits on top of the probe: nothing can separate them.
    if (xWidth <= 0 && yWidth <= 0) break;

    let dim = stream[i].dim;
    if (dim === 0 && xWidth <= 0) dim = 1;
    else if (dim === 1 && yWidth <= 0) dim = 0;

    const lo = dim === 0 ? xMin : yMin;
    const hi = dim === 0 ? xMax : yMax;
    const value = lo + stream[i].u * (hi - lo);
    const key = dim === 0 ? "x" : "y";
    const below = probe[key] < value;
    const next = live.filter((p) => (p[key] < value) === below);

    i++;
    // A split that separates nobody is a wasted draw, not a level of the tree.
    if (next.length === live.length) continue;

    cuts.push({ dim, value, region: { ...region } });
    if (dim === 0) {
      if (below) region.x1 = value;
      else region.x0 = value;
    } else if (below) region.y1 = value;
    else region.y0 = value;

    live = next;
  }

  return { cuts, depth: cuts.length, region, remaining: live.length };
}

// Depth only — the same walk with nothing recorded.
function pathDepth(probe, sample, stream) {
  let live = sample.filter((p) => p !== probe);
  live.push(probe);
  let depth = 0;
  let i = 0;

  while (live.length > 1 && i < stream.length) {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const p of live) {
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
    const xWidth = xMax - xMin;
    const yWidth = yMax - yMin;
    if (xWidth <= 0 && yWidth <= 0) break;

    let dim = stream[i].dim;
    if (dim === 0 && xWidth <= 0) dim = 1;
    else if (dim === 1 && yWidth <= 0) dim = 0;

    const lo = dim === 0 ? xMin : yMin;
    const hi = dim === 0 ? xMax : yMax;
    const value = lo + stream[i].u * (hi - lo);
    const key = dim === 0 ? "x" : "y";
    const below = probe[key] < value;
    const next = live.filter((p) => (p[key] < value) === below);

    i++;
    if (next.length === live.length) continue;
    depth++;
    live = next;
  }
  return depth;
}

/*
  A forest is nothing but a list of (subsample, random stream) pairs. Fixing
  both up front means the score is a stable function of position: drag the
  point back to where it was and you get the same number.
*/
export function makeForest(points, { nTrees = 60, psi = 64, seed = 7 } = {}, rngFactory) {
  const rng = rngFactory(seed);
  const trees = [];
  const n = points.length;
  const size = Math.min(psi, n);

  for (let t = 0; t < nTrees; t++) {
    // Partial Fisher–Yates over an index array: a sample without replacement.
    const idx = Array.from({ length: n }, (_, k) => k);
    for (let k = 0; k < size; k++) {
      const j = k + Math.floor(rng() * (n - k));
      const tmp = idx[k];
      idx[k] = idx[j];
      idx[j] = tmp;
    }
    trees.push({
      sample: idx.slice(0, size).map((k) => points[k]),
      stream: makeStream(rng, 48),
    });
  }

  return { trees, psi: size, norm: cFactor(size + 1) };
}

// s(x) = 2 ^ ( -E[h(x)] / c(n) ). Near 1: isolated fast, treat as anomalous.
// Near 0.5: about as hard to isolate as anything else in the sample.
export function scorePoint(probe, forest) {
  let total = 0;
  for (const tree of forest.trees) total += pathDepth(probe, tree.sample, tree.stream);
  const avgDepth = total / forest.trees.length;
  return { avgDepth, score: Math.pow(2, -avgDepth / forest.norm) };
}

// The individual path lengths behind the average — one per tree.
export function pathDepths(probe, forest) {
  return forest.trees.map((tree) => pathDepth(probe, tree.sample, tree.stream));
}

export function scoreOf(probe, forest) {
  return scorePoint(probe, forest).score;
}

/*
  The score everywhere, on a grid, for the heat map. Same forest as the
  readout, so the colour under a point always agrees with its number.
*/
export function scoreGrid(forest, bounds, nx = 30, ny = 30) {
  const cells = new Float64Array(nx * ny);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < ny; j++) {
    const y = bounds.y0 + ((j + 0.5) / ny) * (bounds.y1 - bounds.y0);
    for (let i = 0; i < nx; i++) {
      const x = bounds.x0 + ((i + 0.5) / nx) * (bounds.x1 - bounds.x0);
      const s = scoreOf({ x, y }, forest);
      cells[j * nx + i] = s;
      if (s < min) min = s;
      if (s > max) max = s;
    }
  }
  return { cells, nx, ny, min, max };
}
