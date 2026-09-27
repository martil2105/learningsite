/*
  k-means, written out in full. The whole algorithm is the two functions
  `assign` and `centroidsFrom`; everything else here is bookkeeping so the page
  can show one half-step at a time.

  Vocabulary used consistently throughout the article:
    - the k-means PROBLEM is minimising `inertia` over assignments and centroids
    - LLOYD'S ALGORITHM is the alternating heuristic below
    - k-means++ is an INITIALISATION, and is in init.js
*/

export const dist2 = (p, c) => (p.x - c.x) * (p.x - c.x) + (p.y - c.y) * (p.y - c.y);

/*
  The assignment step: each point to the nearest centroid, ties to the lower
  index. This is the exact minimiser of the objective over assignments with the
  centroids held fixed - there is nothing approximate about it, which is why it
  can never increase the objective.
*/
export function assign(points, centroids) {
  const labels = new Array(points.length);
  for (let i = 0; i < points.length; i++) {
    let best = 0;
    let bestD = Infinity;
    for (let j = 0; j < centroids.length; j++) {
      const d = dist2(points[i], centroids[j]);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    labels[i] = best;
  }
  return labels;
}

/*
  The update step: each centroid to the mean of its cluster. Also an exact
  minimiser - of the same objective, over centroids, with the assignment held
  fixed - and the derivation is two lines, in TextAndMathEquations.svelte.

  An empty cluster has no mean. Every implementation has to invent a rule here;
  this one keeps the centroid where it was, which is the least surprising choice
  and leaves the cluster available to pick points up later. scikit-learn instead
  relocates it to the point currently furthest from its own centroid.
*/
export function centroidsFrom(points, labels, k, previous) {
  const sx = new Array(k).fill(0);
  const sy = new Array(k).fill(0);
  const n = new Array(k).fill(0);
  for (let i = 0; i < points.length; i++) {
    const j = labels[i];
    sx[j] += points[i].x;
    sy[j] += points[i].y;
    n[j]++;
  }
  const out = [];
  for (let j = 0; j < k; j++) {
    out.push(n[j] > 0 ? { x: sx[j] / n[j], y: sy[j] / n[j] } : { x: previous[j].x, y: previous[j].y });
  }
  return out;
}

/*
  The objective. Note that it takes BOTH an assignment and a set of centroids:
  it is a function of two arguments, and the whole article turns on that. Drag a
  centroid by hand and you have changed one argument without re-optimising the
  other, which is why the number can go up.
*/
export function inertia(points, labels, centroids) {
  let total = 0;
  for (let i = 0; i < points.length; i++) total += dist2(points[i], centroids[labels[i]]);
  return total;
}

export const counts = (labels, k) => {
  const n = new Array(k).fill(0);
  for (const l of labels) n[l]++;
  return n;
};

const sameLabels = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);

/*
  Run to convergence and report the trace. The stopping rule is the standard
  one: stop when an assignment step changes no label, because from there the
  update step cannot move a centroid either and the state is a fixed point.

  `iterations` counts full assign+update rounds, matching what scikit-learn
  reports as n_iter_.
*/
export function runToConvergence(points, initial, maxIter = 300) {
  let centroids = initial.map((c) => ({ x: c.x, y: c.y }));
  let labels = null;
  let iterations = 0;
  const trace = [];

  for (let it = 0; it < maxIter; it++) {
    const next = assign(points, centroids);
    const settled = sameLabels(next, labels);
    labels = next;
    trace.push({ phase: "assign", inertia: inertia(points, labels, centroids) });
    if (settled) break;
    centroids = centroidsFrom(points, labels, centroids.length, centroids);
    trace.push({ phase: "update", inertia: inertia(points, labels, centroids) });
    iterations++;
  }

  return {
    centroids,
    labels,
    inertia: inertia(points, labels, centroids),
    iterations,
    trace,
    converged: iterations < maxIter,
  };
}

/*
  The mean silhouette coefficient, used only in the choosing-k figure. For each
  point: a = mean distance to its own cluster, b = the smallest mean distance to
  any other cluster, s = (b - a) / max(a, b). Defined as 0 for a singleton
  cluster, which is the usual convention. O(n^2), which at n = 150 is nothing.

  Note this uses plain Euclidean distance, not squared - silhouette is not the
  k-means objective and is not trying to be.
*/
export function silhouette(points, labels, k) {
  const n = points.length;
  const size = counts(labels, k);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const sums = new Array(k).fill(0);
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      sums[labels[j]] += Math.sqrt(dist2(points[i], points[j]));
    }
    const own = labels[i];
    if (size[own] <= 1) continue;
    const a = sums[own] / (size[own] - 1);
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === own || size[c] === 0) continue;
      b = Math.min(b, sums[c] / size[c]);
    }
    if (!isFinite(b)) continue;
    total += (b - a) / Math.max(a, b);
  }
  return total / n;
}
