/*
  Density clustering, from the definitions.

  Everything on this page runs through this file: the eps slider, the tree, the
  condensed tree, and every number in verify/. Nothing is hard-coded anywhere
  else, which is what lets the checks re-derive a claim rather than re-read it.

  The organising fact, and the one the article is built around:

    DBSCAN* at EVERY eps at once is a single minimum spanning tree.

  Two points are in the same DBSCAN* cluster at eps exactly when there is a
  path between them on which every point is core and every step is at most eps.
  Write d_mreach(a,b) = max(core(a), core(b), d(a,b)) and that condition
  becomes "a path whose every edge is at most eps" - the definition of
  connectivity in the single-linkage hierarchy of d_mreach, which the MST
  encodes completely. So the whole eps sweep is one tree, computed once, and
  every eps is a horizontal line drawn across it. verify/check-numbers.mjs
  asserts this against a brute-force DBSCAN* at every eps the sweep can
  distinguish.
*/

/* ------------------------------------------------------------------ basics */

export function distanceMatrix(pts) {
  const n = pts.length;
  const D = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      D[i * n + j] = d;
      D[j * n + i] = d;
    }
  }
  return D;
}

/*
  Core distance: the distance to the m-th nearest neighbour COUNTING THE POINT
  ITSELF, which is the convention both DBSCAN's minPts and HDBSCAN's
  min_samples use. So m = 1 gives zero, and "p is a core point at eps" is
  exactly core_m(p) <= eps.
*/
export function coreDistances(pts, m, D = null) {
  const n = pts.length;
  D = D || distanceMatrix(pts);
  const need = Math.max(0, m - 1); // neighbours other than p
  const core = new Float64Array(n);
  const buf = new Float64Array(Math.max(1, need));
  for (let i = 0; i < n; i++) {
    if (need === 0) { core[i] = 0; continue; }
    buf.fill(Infinity);
    const row = i * n;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const d = D[row + j];
      if (d >= buf[need - 1]) continue;
      let k = need - 1;
      while (k > 0 && buf[k - 1] > d) { buf[k] = buf[k - 1]; k--; }
      buf[k] = d;
    }
    core[i] = buf[need - 1];
  }
  return core;
}

/* Prim's, on the complete graph. O(n^2), which at these sizes is a few
   milliseconds and lets the whole page recompute on a parameter change. */
function primMST(n, weight) {
  const inTree = new Uint8Array(n);
  const best = new Float64Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const edges = [];
  best[0] = 0;
  for (let it = 0; it < n; it++) {
    let u = -1;
    let bu = Infinity;
    for (let i = 0; i < n; i++) if (!inTree[i] && best[i] < bu) { bu = best[i]; u = i; }
    if (u < 0) break;
    inTree[u] = 1;
    if (from[u] >= 0) edges.push({ a: from[u], b: u, w: best[u] });
    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      const w = weight(u, v);
      if (w < best[v]) { best[v] = w; from[v] = u; }
    }
  }
  edges.sort((p, q) => p.w - q.w);
  return edges;
}

/* The mutual reachability MST - the object the whole article is about. */
export function mreachMST(pts, m, D = null, core = null) {
  const n = pts.length;
  D = D || distanceMatrix(pts);
  core = core || coreDistances(pts, m, D);
  return primMST(n, (u, v) => {
    const d = D[u * n + v];
    const cu = core[u];
    const cv = core[v];
    return d > cu ? (d > cv ? d : cv) : cu > cv ? cu : cv;
  });
}

/* The plain Euclidean MST - single linkage, used once, to show what mutual
   reachability is actually for. */
export function euclideanMST(pts, D = null) {
  const n = pts.length;
  D = D || distanceMatrix(pts);
  return primMST(n, (u, v) => D[u * n + v]);
}

/* ------------------------------------------------------------- union-find */

function makeUF(n) {
  const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const find = (x) => {
    let r = x;
    while (parent[r] !== r) r = parent[r];
    while (parent[x] !== r) { const nx = parent[x]; parent[x] = r; x = nx; }
    return r;
  };
  return { find, union: (a, b) => { const ra = find(a); const rb = find(b); if (ra !== rb) parent[rb] = ra; } };
}

/* ------------------------------------------------------- DBSCAN, two ways */

/*
  DBSCAN as it is actually implemented - the 1996 definition, border points and
  all. A point that is not core but sits within eps of a core point joins
  whichever cluster reaches it FIRST, so the output depends on the order the
  rows arrive in. `order` makes that explicit rather than accidental.
*/
export function dbscan(pts, eps, m, { D = null, core = null, order = null } = {}) {
  const n = pts.length;
  D = D || distanceMatrix(pts);
  core = core || coreDistances(pts, m, D);
  const labels = new Int32Array(n).fill(-1);
  const seen = new Uint8Array(n);
  const ord = order || Array.from({ length: n }, (_, i) => i);
  let c = 0;
  for (const s of ord) {
    if (seen[s] || core[s] > eps) continue;
    const queue = [s];
    seen[s] = 1;
    labels[s] = c;
    while (queue.length) {
      const p = queue.pop();
      const row = p * n;
      for (const q of ord) {
        if (q === p || D[row + q] > eps) continue;
        if (labels[q] !== -1) continue; // first cluster to reach a border point keeps it
        labels[q] = c;
        if (core[q] <= eps && !seen[q]) { seen[q] = 1; queue.push(q); }
      }
    }
    c++;
  }
  return { labels: Array.from(labels), nClusters: c };
}

/*
  DBSCAN*, from the HDBSCAN paper: identical except that non-core points are
  noise, full stop. Border points are the only difference between the two, and
  they are the reason HDBSCAN is built on this version - a hierarchy needs the
  clusters at every level to nest, and a border point that belongs to whichever
  neighbour asked first does not nest.
*/
export function dbscanStar(pts, eps, m, { D = null, core = null } = {}) {
  const n = pts.length;
  D = D || distanceMatrix(pts);
  core = core || coreDistances(pts, m, D);
  const uf = makeUF(n);
  for (let i = 0; i < n; i++) {
    if (core[i] > eps) continue;
    const row = i * n;
    for (let j = i + 1; j < n; j++) {
      if (core[j] > eps) continue;
      if (D[row + j] <= eps) uf.union(i, j);
    }
  }
  return finishLabels(n, uf, core, eps, 1);
}

/* The same clustering read off the MST instead: threshold the tree, drop the
   points that are not core at this level. */
export function clustersFromMST(mst, core, eps, minSize = 1) {
  const n = core.length;
  const uf = makeUF(n);
  for (const e of mst) {
    if (e.w > eps) break; // mst is sorted ascending
    if (core[e.a] > eps || core[e.b] > eps) continue;
    uf.union(e.a, e.b);
  }
  return finishLabels(n, uf, core, eps, minSize);
}

function finishLabels(n, uf, core, eps, minSize) {
  const size = new Map();
  for (let i = 0; i < n; i++) {
    if (core[i] > eps) continue;
    const r = uf.find(i);
    size.set(r, (size.get(r) || 0) + 1);
  }
  const id = new Map();
  const labels = new Array(n).fill(-1);
  let c = 0;
  for (let i = 0; i < n; i++) {
    if (core[i] > eps) continue;
    const r = uf.find(i);
    if (size.get(r) < minSize) continue;
    if (!id.has(r)) id.set(r, c++);
    labels[i] = id.get(r);
  }
  return { labels, nClusters: c };
}

/*
  Every eps at which the DBSCAN* answer can possibly change: a point becoming
  core, or two components merging. Between two consecutive breakpoints the
  clustering is constant, so evaluating at the midpoints enumerates every
  distinct answer the sweep contains - exactly, with no grid and no sampling.
*/
export function breakpoints(mst, core) {
  const s = new Set();
  for (let i = 0; i < core.length; i++) s.add(core[i]);
  for (const e of mst) s.add(e.w);
  const xs = [...s].sort((a, b) => a - b);
  const mids = [];
  for (let i = 0; i < xs.length; i++) {
    const lo = xs[i];
    const hi = i + 1 < xs.length ? xs[i + 1] : xs[i] * 1.15 + 1;
    mids.push({ lo, hi, at: (lo + hi) / 2 });
  }
  return mids;
}

/* --------------------------------------------------- the linkage hierarchy */

/*
  The MST as a merge tree, in the shape scipy calls a linkage matrix: leaves
  0..n-1 are points, internal node n+t is the t-th merge.
*/
export function linkage(mst, n) {
  const uf = makeUF(n);
  const nodeOf = new Int32Array(n);
  for (let i = 0; i < n; i++) nodeOf[i] = i;
  const size = new Int32Array(2 * n - 1).fill(1);
  const nodes = [];
  for (let t = 0; t < mst.length; t++) {
    const e = mst[t];
    const ra = uf.find(e.a);
    const rb = uf.find(e.b);
    const na = nodeOf[ra];
    const nb = nodeOf[rb];
    const k = n + t;
    size[k] = size[na] + size[nb];
    nodes.push({ id: k, left: na, right: nb, dist: e.w, size: size[k] });
    uf.union(ra, rb);
    nodeOf[uf.find(ra)] = k;
  }
  return { n, nodes, size, root: n + mst.length - 1, child: (k) => (k < n ? null : nodes[k - n]) };
}

const lam = (d) => (d > 0 ? 1 / d : Infinity);

/*
  Condensing the hierarchy, which is the step that turns "every eps" into
  "every cluster worth the name".

  Walk down from the root. At each merge, look at the two sides. If both are at
  least minClusterSize, that was a real split and both sides become clusters in
  their own right. If only one is, the small side did not split off - it fell
  off, and its points leave the current cluster at that level while the cluster
  itself carries on. If neither is, the cluster has come apart and every point
  still in it leaves at that level.

  Returned as rows (parent, child, lambda, size). A child below n is a point.
*/
export function condense(link, minClusterSize) {
  const n = link.n;
  const rows = [];
  const relabel = new Map();
  let next = n;
  relabel.set(link.root, next++);

  const leavesUnder = (k) => {
    if (k < n) return [k];
    const out = [];
    const stack = [k];
    while (stack.length) {
      const cur = stack.pop();
      if (cur < n) { out.push(cur); continue; }
      const nd = link.child(cur);
      stack.push(nd.left, nd.right);
    }
    return out;
  };

  const queue = [link.root];
  while (queue.length) {
    const node = queue.shift();
    if (node < n) continue;
    const nd = link.child(node);
    const L = nd.left;
    const R = nd.right;
    const l = lam(nd.dist);
    const cid = relabel.get(node);
    const sl = L < n ? 1 : link.size[L];
    const sr = R < n ? 1 : link.size[R];
    const bigL = sl >= minClusterSize;
    const bigR = sr >= minClusterSize;

    if (bigL && bigR) {
      const a = next++;
      const b = next++;
      relabel.set(L, a);
      relabel.set(R, b);
      rows.push({ parent: cid, child: a, lambda: l, size: sl });
      rows.push({ parent: cid, child: b, lambda: l, size: sr });
      queue.push(L, R);
    } else if (!bigL && !bigR) {
      for (const p of leavesUnder(L)) rows.push({ parent: cid, child: p, lambda: l, size: 1 });
      for (const p of leavesUnder(R)) rows.push({ parent: cid, child: p, lambda: l, size: 1 });
    } else {
      const small = bigL ? R : L;
      const big = bigL ? L : R;
      for (const p of leavesUnder(small)) rows.push({ parent: cid, child: p, lambda: l, size: 1 });
      relabel.set(big, cid);
      queue.push(big);
    }
  }
  return { n, rows, root: n, nClusters: next - n };
}

/*
  Stability, exactly as HDBSCAN defines it: for a cluster born at lambda_birth,
  add up (lambda_leave - lambda_birth) over everything that leaves it, a point
  at a time.

  Two things worth noticing about the units, because the article makes a point
  of them. Lambda is one over a distance, so stability is measured in
  points-per-metre; and a dense cluster lives at large lambda, so the same
  number of points, arranged the same way, contributes more stability the
  denser the cluster is. The criterion is not scale-free, and that is visible
  in the numbers rather than only arguable.
*/
export function stabilities(cond) {
  const birth = new Map();
  birth.set(cond.root, 0);
  for (const r of cond.rows) if (r.child >= cond.n) birth.set(r.child, r.lambda);
  const S = new Map();
  for (const r of cond.rows) {
    const b = birth.get(r.parent);
    const l = Number.isFinite(r.lambda) ? r.lambda : b; // a zero-distance merge adds nothing
    S.set(r.parent, (S.get(r.parent) || 0) + (l - b) * r.size);
  }
  for (const c of birth.keys()) if (!S.has(c)) S.set(c, 0);
  return { S, birth };
}

/* Excess of mass: keep a cluster if it is more stable than its descendants put
   together. Bottom-up, and the root is never eligible - "everything is one
   cluster" is an answer HDBSCAN declines to give. */
export function selectEOM(cond, S) {
  const kids = new Map();
  for (const r of cond.rows) {
    if (r.child < cond.n) continue;
    if (!kids.has(r.parent)) kids.set(r.parent, []);
    kids.get(r.parent).push(r.child);
  }
  /*
    The root is not a candidate and is not merely dropped at the end: it never
    enters the competition at all. A root that wins would deselect every
    descendant on its way past, and removing it afterwards leaves the answer
    empty - which is how this first returned zero clusters on data with two
    obvious ones. "Everything is one cluster" is an answer HDBSCAN declines to
    give, so its children compete against each other, not against it.
  */
  const ids = [...S.keys()].filter((c) => c !== cond.root).sort((a, b) => b - a); // deepest first
  const hat = new Map();
  const chosen = new Set();
  for (const c of ids) {
    const ch = kids.get(c) || [];
    if (!ch.length) { hat.set(c, S.get(c)); chosen.add(c); continue; }
    const sub = ch.reduce((a, k) => a + hat.get(k), 0);
    if (sub > S.get(c)) {
      hat.set(c, sub);
    } else {
      hat.set(c, S.get(c));
      // deselect the whole subtree, then take this one
      const stack = [...ch];
      while (stack.length) {
        const d = stack.pop();
        chosen.delete(d);
        for (const g of kids.get(d) || []) stack.push(g);
      }
      chosen.add(c);
    }
  }
  return { chosen, hat, kids };
}

/* Which condensed cluster each point fell out of, and therefore its label. */
export function labelsFromSelection(cond, chosen) {
  const parentOf = new Map();
  const fellOutOf = new Int32Array(cond.n).fill(-1);
  for (const r of cond.rows) {
    if (r.child >= cond.n) parentOf.set(r.child, r.parent);
    else fellOutOf[r.child] = r.parent;
  }
  const order = [...chosen].sort((a, b) => a - b);
  const idx = new Map(order.map((c, i) => [c, i]));
  const labels = new Array(cond.n).fill(-1);
  for (let p = 0; p < cond.n; p++) {
    let c = fellOutOf[p];
    while (c !== undefined && c >= cond.n) {
      if (chosen.has(c)) { labels[p] = idx.get(c); break; }
      c = parentOf.get(c);
    }
  }
  return { labels, clusterIds: order, nClusters: order.length };
}

/* The whole of HDBSCAN, from points to labels. */
export function hdbscan(pts, minClusterSize, minSamples = null, { D = null } = {}) {
  const m = minSamples == null ? minClusterSize : minSamples;
  D = D || distanceMatrix(pts);
  const core = coreDistances(pts, m, D);
  const mst = mreachMST(pts, m, D, core);
  const link = linkage(mst, pts.length);
  const cond = condense(link, minClusterSize);
  const { S, birth } = stabilities(cond);
  const { chosen, kids } = selectEOM(cond, S);
  const out = labelsFromSelection(cond, chosen);
  return { ...out, core, mst, link, cond, S, birth, chosen, kids };
}

/* ------------------------------------------------------------- comparison */

/* Adjusted Rand index. Noise is a label like any other, so calling everything
   noise and calling everything one cluster both score about zero, which is
   what we want from a yardstick. */
export function ari(a, b) {
  const n = a.length;
  const rows = new Map();
  const ca = new Map();
  const cb = new Map();
  for (let i = 0; i < n; i++) {
    const k = a[i] + "|" + b[i];
    rows.set(k, (rows.get(k) || 0) + 1);
    ca.set(a[i], (ca.get(a[i]) || 0) + 1);
    cb.set(b[i], (cb.get(b[i]) || 0) + 1);
  }
  const c2 = (x) => (x * (x - 1)) / 2;
  let sij = 0;
  for (const v of rows.values()) sij += c2(v);
  let si = 0;
  for (const v of ca.values()) si += c2(v);
  let sj = 0;
  for (const v of cb.values()) sj += c2(v);
  const tot = c2(n);
  const exp = (si * sj) / tot;
  const max = (si + sj) / 2;
  return max === exp ? 0 : (sij - exp) / (max - exp);
}

/* Ground truth as a label vector: one label per stop, one shared label for
   every ping logged in transit - the same shape of answer a clusterer gives,
   where -1 means "not one of the places". */
export const truthLabels = (sc) => sc.stop.slice();

/* A partition, in a form that does not depend on which cluster got number 0.
   Two runs of DBSCAN agree exactly when these strings match. */
export function canonicalPartition(labels) {
  const first = new Map();
  labels.forEach((l, i) => { if (l >= 0 && !first.has(l)) first.set(l, i); });
  const order = [...first.entries()].sort((p, q) => p[1] - q[1]);
  const re = new Map(order.map(([l], i) => [l, i]));
  return labels.map((l) => (l < 0 ? -1 : re.get(l))).join(",");
}

/* k-means, for the one comparison the article makes against it. k-means++
   seeding and the best of several restarts, so the comparison is against a
   version someone who liked k-means would recognise. */
export function kmeans(pts, k, rand, restarts = 12) {
  let best = null;
  for (let r = 0; r < restarts; r++) {
    const cent = [pts[Math.floor(rand() * pts.length)].slice()];
    while (cent.length < k) {
      const d2 = pts.map((p) => Math.min(...cent.map((c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2)));
      const tot = d2.reduce((a, b) => a + b, 0);
      let t = rand() * tot;
      let i = 0;
      while (i < pts.length - 1 && (t -= d2[i]) > 0) i++;
      cent.push(pts[i].slice());
    }
    let labels = new Array(pts.length).fill(0);
    for (let it = 0; it < 100; it++) {
      let moved = false;
      for (let i = 0; i < pts.length; i++) {
        let bi = 0;
        let bd = Infinity;
        for (let c = 0; c < k; c++) {
          const d = (pts[i][0] - cent[c][0]) ** 2 + (pts[i][1] - cent[c][1]) ** 2;
          if (d < bd) { bd = d; bi = c; }
        }
        if (labels[i] !== bi) { labels[i] = bi; moved = true; }
      }
      const sum = Array.from({ length: k }, () => [0, 0, 0]);
      for (let i = 0; i < pts.length; i++) {
        sum[labels[i]][0] += pts[i][0];
        sum[labels[i]][1] += pts[i][1];
        sum[labels[i]][2]++;
      }
      for (let c = 0; c < k; c++) if (sum[c][2]) cent[c] = [sum[c][0] / sum[c][2], sum[c][1] / sum[c][2]];
      if (!moved) break;
    }
    let inertia = 0;
    for (let i = 0; i < pts.length; i++)
      inertia += (pts[i][0] - cent[labels[i]][0]) ** 2 + (pts[i][1] - cent[labels[i]][1]) ** 2;
    if (!best || inertia < best.inertia) best = { labels, cent, inertia };
  }
  return best;
}

/* ------------------------------------------------------------ the k-dist heuristic */

/* The sorted k-distance curve the 1996 paper suggests reading eps off. */
export const kdistCurve = (core) => Array.from(core).sort((a, b) => a - b);

/*
  The elbow, as the most common recipe finds it: the point on the sorted curve
  furthest from the chord joining its two ends. Returns the index and the eps
  it recommends.
*/
export function knee(curve) {
  const n = curve.length;
  const x0 = 0;
  const y0 = curve[0];
  const x1 = n - 1;
  const y1 = curve[n - 1];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy);
  let bi = 0;
  let bd = -Infinity;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(dy * (i - x0) - dx * (curve[i] - y0)) / L;
    if (d > bd) { bd = d; bi = i; }
  }
  return { index: bi, eps: curve[bi], frac: bi / (n - 1) };
}

/* ---------------------------------------------------- did it find the stops */

/*
  The article's yardstick, and the only one it asks the reader to hold:

    a stop is FOUND when some cluster contains at least 80% of its pings and
    fewer than 20% of every other stop's.

  Deliberately not an information-theoretic score. It is a count of places,
  which is the thing somebody clustering a location log actually wants, and it
  says out loud what it treats as success. `share` is how much of the stop that
  cluster holds, so the prose can say "94% of the park is noise" rather than
  "the ARI is 0.79".
*/
export function recovery(stop, nStops, labels) {
  const sizes = new Array(nStops).fill(0);
  for (const s of stop) if (s >= 0) sizes[s]++;
  const K = Math.max(-1, ...labels) + 1;
  const tab = Array.from({ length: nStops }, () => new Array(K).fill(0));
  const noise = new Array(nStops).fill(0);
  for (let i = 0; i < labels.length; i++) {
    const g = stop[i];
    if (g < 0) continue;
    if (labels[i] < 0) noise[g]++;
    else tab[g][labels[i]]++;
  }
  const per = [];
  for (let g = 0; g < nStops; g++) {
    let hit = -1;
    let share = 0;
    for (let c = 0; c < K; c++) {
      if (tab[g][c] / sizes[g] > share) share = tab[g][c] / sizes[g];
      if (tab[g][c] >= 0.8 * sizes[g] && tab.every((row, h) => h === g || row[c] < 0.2 * sizes[h])) hit = c;
    }
    per.push({ found: hit >= 0, cluster: hit, share, noise: noise[g] / sizes[g] });
  }
  // Which pairs of stops ended up sharing a cluster - the other half of the story.
  const merged = [];
  for (let a = 0; a < nStops; a++)
    for (let b = a + 1; b < nStops; b++) {
      const ca = new Set();
      for (let c = 0; c < K; c++) if (tab[a][c] >= 0.2 * sizes[a]) ca.add(c);
      for (let c = 0; c < K; c++) if (tab[b][c] >= 0.2 * sizes[b] && ca.has(c)) merged.push([a, b]);
    }
  return { found: per.filter((p) => p.found).length, per, merged, transitInCluster: countTransit(stop, labels) };
}

function countTransit(stop, labels) {
  let n = 0;
  let inC = 0;
  for (let i = 0; i < labels.length; i++) if (stop[i] < 0) { n++; if (labels[i] >= 0) inC++; }
  return n ? inC / n : 0;
}

/*
  The eps sweep, enumerated exactly rather than sampled: between two
  consecutive breakpoints the clustering cannot change, so this IS every answer
  the knob can produce. Returns one row per distinct answer, which is what the
  staircase under the slider draws.
*/
export function epsSweep(mst, core, stop, nStops, { max = 60, minSize = 1 } = {}) {
  const rows = [];
  let prev = null;
  for (const bp of breakpoints(mst, core)) {
    if (bp.lo > max) break;
    const r = clustersFromMST(mst, core, bp.at, minSize);
    const key = canonicalPartition(r.labels);
    if (key === prev) {
      rows[rows.length - 1].hi = Math.min(bp.hi, max);
      continue;
    }
    prev = key;
    const rec = recovery(stop, nStops, r.labels);
    rows.push({
      lo: bp.lo, hi: Math.min(bp.hi, max), at: bp.at,
      nClusters: r.nClusters, found: rec.found, noiseShare: r.labels.filter((l) => l < 0).length / r.labels.length,
    });
  }
  return rows;
}
