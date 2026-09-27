/*
  SMOTE, and the small family of things built to patch it.

  Chawla, Bowyer, Hall and Kegelmeyer (JAIR, 2002). The whole algorithm is the
  last line of `child()`: take a minority point, take one of its k nearest
  minority neighbours, and put a new minority point somewhere on the segment
  between them.

  Everything else in this file exists to measure what that line does.
*/

export const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
export const dist = (a, b) => Math.sqrt(dist2(a, b));

/*
  The k nearest neighbours of each point, WITHIN the given set.

  The restriction is the algorithm's, not a simplification: SMOTE never looks at
  the majority class when it chooses a neighbour. A minority point sitting in
  the middle of majority territory still gets its k neighbours, still gets its
  children, and nothing in the procedure can notice.
*/
export function kNearestWithin(points, k) {
  const n = points.length;
  const kk = Math.max(1, Math.min(k, n - 1));
  const out = [];
  for (let i = 0; i < n; i++) {
    const order = [];
    for (let j = 0; j < n; j++) if (j !== i) order.push([dist2(points[i], points[j]), j]);
    order.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    out.push(order.slice(0, kk).map((e) => e[1]));
  }
  return out;
}

/* One synthetic point. */
export function child(points, nbrs, i, rand) {
  const cand = nbrs[i];
  const j = cand[Math.floor(rand() * cand.length)];
  const lam = rand();
  const a = points[i];
  const b = points[j];
  return {
    p: [a[0] + lam * (b[0] - a[0]), a[1] + lam * (b[1] - a[1])],
    parent: i,
    neighbour: j,
    lambda: lam,
  };
}

/*
  `count` synthetic points, parents cycled round-robin rather than drawn at
  random, which is what the reference implementations do: every minority point
  contributes the same number of children.
*/
export function smote(points, k, count, rand, { from = null } = {}) {
  const nbrs = kNearestWithin(points, k);
  const pool = from === null ? points.map((_, i) => i) : from;
  const out = [];
  if (!pool.length) return out;
  for (let t = 0; t < count; t++) out.push(child(points, nbrs, pool[t % pool.length], rand));
  return out;
}

/* ------------------------------------------------------------- convex hull

   Andrew's monotone chain. Used for one claim only, and it is an identity
   rather than a measurement: every point SMOTE can produce is a convex
   combination of two sample points, so the hull of the augmented set is the
   hull of the original set, whatever k is and however many children you draw.
*/
export function convexHull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function inHull(p, hull, eps = 1e-9) {
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if (cr < -eps) return false;
  }
  return true;
}

/* --------------------------------------------------------- the two verdicts

   Whether a synthetic point landed somewhere the minority class actually lives.
   Two independent ways of asking, because a single one would be a modelling
   choice dressed up as a fact.

   1. `normalTerritory` compares the two class-conditional densities. Equal
      densities is the boundary a classifier would learn if the classes were
      equally common - which, after any resampling, is exactly the boundary it
      is being asked to learn. Only available because this data is synthetic.

   2. `nearestIsMajority` asks whether the closest REAL transaction to the
      synthetic one is a legitimate transaction. No densities, no priors, no
      generative model: it is computable on data you were handed.
*/
export const normalTerritory = (p, sc) => sc.pMaj(p) > sc.pMin(p);

/*
  The class-BALANCED version, which is the one worth running on real data.

  Asking whether the nearest real row is majority sounds like the same question
  and is not: with forty legitimate rows for every fraud row, the nearest thing
  to anything is usually legitimate, so that test flags a third of the synthetic
  rows in a scenario where the density test flags a tenth. It is measuring the
  imbalance, which is the one thing everyone already knows about.

  Correcting for it costs nothing. A k-nearest-neighbour density estimate in two
  dimensions is proportional to r / (n * d_r^2), so comparing the two classes at
  equal priors is comparing n_min * d_min^2 against n_maj * d_maj^2 - the same
  r-th neighbour on both sides, each scaled by how many of that class there are.
  No generative model, no densities, computable on data you were handed.
*/
export function balancedNeighbourVerdict(p, minority, majority, r = 3) {
  const dm = [];
  const dj = [];
  for (const q of minority) dm.push(dist2(p, q));
  for (const q of majority) dj.push(dist2(p, q));
  dm.sort((a, b) => a - b);
  dj.sort((a, b) => a - b);
  const rr = Math.min(r, dm.length, dj.length);
  return minority.length * dm[rr - 1] > majority.length * dj[rr - 1];
}

export function nearestIsMajority(p, minority, majority) {
  let bestMin = Infinity;
  for (const q of minority) bestMin = Math.min(bestMin, dist2(p, q));
  let bestMaj = Infinity;
  for (const q of majority) bestMaj = Math.min(bestMaj, dist2(p, q));
  return bestMaj < bestMin;
}

/* ------------------------------------------------------------ the remedies */

/*
  Borderline-SMOTE (Han, Wang and Mao, 2005).

  Look at each minority point's m nearest neighbours in the WHOLE dataset and
  count how many are majority. All of them: the point is noise, generate
  nothing from it. Half or more: it is on the border, which is where the
  decision boundary needs help, so generate from it. Fewer than half: it is
  safely interior and needs no help.
*/
export function borderlineFlags(minority, majority, m = 5) {
  const all = minority.concat(majority);
  const isMin = minority.map(() => true).concat(majority.map(() => false));
  return minority.map((p, i) => {
    const order = [];
    for (let j = 0; j < all.length; j++) {
      if (j === i) continue;
      order.push([dist2(p, all[j]), j]);
    }
    order.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const majCount = order.slice(0, m).filter((e) => !isMin[e[1]]).length;
    if (majCount === m) return "noise";
    if (majCount >= m / 2) return "danger";
    return "safe";
  });
}

/*
  Edited Nearest Neighbours (Wilson, 1972), used as a cleaning pass on the
  augmented set: drop any point its own k nearest neighbours disagree with.
  Applied after SMOTE, this is what removes children that landed in the wrong
  place - it is the "clean up afterwards" half of SMOTE-ENN (Batista, Prati and
  Monard, 2004).
*/
export function ennKeep(points, labels, k = 3) {
  return points.map((p, i) => {
    const order = [];
    for (let j = 0; j < points.length; j++) {
      if (j === i) continue;
      order.push([dist2(p, points[j]), j]);
    }
    order.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const votes = order.slice(0, k).reduce((s, e) => s + labels[e[1]], 0);
    return (votes > k / 2 ? 1 : 0) === labels[i];
  });
}

/* ------------------------------------------------------- a small classifier

   k-nearest-neighbours, so that "what did the synthetic points do to the
   decision boundary" is a question about the training set and nothing else.
   No optimiser, no learning rate, no seed: change the training set and the
   change in the boundary is entirely attributable to the training set.
*/
export function knnPredict(train, labels, k, q) {
  const order = [];
  for (let j = 0; j < train.length; j++) order.push([dist2(q, train[j]), j]);
  order.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let s = 0;
  for (let t = 0; t < k; t++) s += labels[order[t][1]];
  return s / k;
}

/*
  The exact mean and spread of the SMOTE child distribution, for a given point
  set and a given k. No sampling.

  A child is (1-L)x_i + L x_j with L ~ U(0,1), i uniform over the n points and
  j uniform over i's k nearest. Both moments are finite sums:

    E[child]        = (1/n) sum_i [ x_i + mean of i's k neighbours ] / 2
    E[child child'] = (1/n) sum_i (1/k) sum_{j in N(i)}
                        (1/3)(x_i x_i' + x_j x_j') + (1/6)(x_i x_j' + x_j x_i')

  using E[L^2] = E[(1-L)^2] = 1/3 and E[L(1-L)] = 1/6. Sampling twenty thousand
  children estimates the spread ratio to about +/- 0.005, which is the same size
  as the effect being reported over the interesting range of k. This is exact,
  so the curve in the article is a curve rather than a scatter of noise.
*/
export function childMoments(points, k) {
  const n = points.length;
  const nbrs = kNearestWithin(points, k);
  const mean = [0, 0];
  // Second moments, accumulated as xx, yy and xy.
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const cand = nbrs[i];
    for (const j of cand) {
      const b = points[j];
      const w = 1 / (n * cand.length);
      mean[0] += w * 0.5 * (a[0] + b[0]);
      mean[1] += w * 0.5 * (a[1] + b[1]);
      sxx += w * ((a[0] * a[0] + b[0] * b[0]) / 3 + (a[0] * b[0] * 2) / 6);
      syy += w * ((a[1] * a[1] + b[1] * b[1]) / 3 + (a[1] * b[1] * 2) / 6);
      sxy += w * ((a[0] * a[1] + b[0] * b[1]) / 3 + (a[0] * b[1] + b[0] * a[1]) / 6);
    }
  }
  return {
    mean,
    // Total variance: the trace of the covariance, which is what "spread" means
    // wherever this article uses the word.
    trace: sxx + syy - mean[0] * mean[0] - mean[1] * mean[1],
    cov: [
      [sxx - mean[0] * mean[0], sxy - mean[0] * mean[1]],
      [sxy - mean[0] * mean[1], syy - mean[1] * mean[1]],
    ],
  };
}

export function traceVar(P) {
  const m = [0, 0];
  for (const p of P) { m[0] += p[0]; m[1] += p[1]; }
  m[0] /= P.length; m[1] /= P.length;
  let s = 0;
  for (const p of P) s += (p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2;
  return s / P.length;
}

/*
  The exact expected variance ratio when the neighbour is drawn uniformly from
  every other point - SMOTE at k = n-1.

  child = (1-L)x_i + L x_j with L ~ U(0,1), i uniform, j uniform among the rest:

    Cov(child) = E[(1-L)^2] S + E[L^2] S + 2 E[L(1-L)] E[u v']
               = (1/3 + 1/3) S + (1/3)(-S/(n-1))
               = S (2/3 - 1/(3(n-1)))

  using E[u v'] = -S/(n-1) for i != j drawn from a finite set with covariance S.
  Not a tolerance and not a fit: an identity in n, and the check in verify/
  holds it to machine precision.
*/
export const varianceRatioAtFullK = (n) => 2 / 3 - 1 / (3 * (n - 1));
