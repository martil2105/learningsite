/*
  A small gradient-boosted forest, deliberately written twice over the same
  scaffolding: the ONLY difference between the two modes is how a node picks its
  split. Everything else - leaf-wise growth, the gain, the leaf values, the
  shrinkage - is shared code, so any difference in the results is the split
  finder and nothing else.

    mode "exact"  pre-sorted scan over every threshold, per node, per feature
    mode "hist"   one histogram per node per feature, then a scan over bins

  Growth is leaf-wise (LightGBM's default): repeatedly split whichever leaf
  promises the largest gain, up to num_leaves. That is orthogonal to binning and
  the article says so - it is here because comparing against a level-wise tree
  would confound the two ideas.
*/
import {
  COUNTERS, resetCounters, snapshotCounters,
  splitGain, leafValue, binEdges, binizeColumn, newHistogram,
  buildHistogram, subtractHistogram, histogramBestSplit, exactBestSplit, argsortIndices,
} from "./binning.js";

export const DEFAULTS = {
  maxBin: 255,
  numLeaves: 31,
  minDataInLeaf: 20,
  lambda: 1.0,
  gamma: 0.0,
  learningRate: 0.1,
  numTrees: 60,
  subtract: true,
  minDataInBin: 3,
};

/* ------------------------------------------------------------------ binning */
export function prepareBins(cols, maxBin, opts = {}) {
  const edges = cols.map((c) => binEdges(c, maxBin, { minDataInBin: opts.minDataInBin ?? 3 }));
  const binned = cols.map((c, j) => binizeColumn(c, edges[j]));
  return { edges, binned, nBins: edges.map((e) => e.length + 1) };
}

/* -------------------------------------------------------------- tree growth */
function growTree(ctx, grad, hess) {
  const { mode, cols, prep, order, params } = ctx;
  const nFeat = cols.length;
  const n = grad.length;
  const { lambda, gamma, minDataInLeaf, numLeaves } = params;

  const allRows = Int32Array.from({ length: n }, (_, i) => i);

  const makeLeaf = (rows, perFeatureOrder, hists) => {
    let G = 0;
    let H = 0;
    for (let k = 0; k < rows.length; k++) {
      G += grad[rows[k]];
      H += hess[rows[k]];
    }
    return { rows, perFeatureOrder, hists, G, H, depth: 0, value: leafValue(G, H, lambda), best: null };
  };

  // --- the split search, in whichever mode
  const findBest = (node) => {
    let best = null;
    for (let j = 0; j < nFeat; j++) {
      let cand = null;
      if (mode === "hist") {
        cand = histogramBestSplit(node.hists[j], { lambda, gamma, minDataInLeaf });
        if (cand) cand = { ...cand, feature: j, threshold: prep.edges[j][cand.bin] };
      } else {
        cand = exactBestSplit(cols[j], node.perFeatureOrder[j], grad, hess,
                              { G: node.G, H: node.H, lambda, gamma, minDataInLeaf });
        if (cand) cand = { ...cand, feature: j };
      }
      if (cand && (!best || cand.gain > best.gain)) best = cand;
    }
    node.best = best;
  };

  // --- the root
  let rootHists = null;
  let rootOrder = null;
  if (mode === "hist") {
    rootHists = prep.nBins.map((b) => newHistogram(b));
    for (let j = 0; j < nFeat; j++) buildHistogram(rootHists[j], prep.binned[j], allRows, grad, hess);
  } else {
    rootOrder = order.map((o) => Int32Array.from(o));
  }
  const root = makeLeaf(allRows, rootOrder, rootHists);
  findBest(root);

  const leaves = [root];
  let splits = 0;

  while (leaves.length < numLeaves) {
    let bi = -1;
    for (let i = 0; i < leaves.length; i++) {
      if (leaves[i].best && (bi < 0 || leaves[i].best.gain > leaves[bi].best.gain)) bi = i;
    }
    if (bi < 0) break;

    const node = leaves[bi];
    const s = node.best;
    const goesLeft = new Uint8Array(n);
    const lrows = [];
    const rrows = [];
    for (let k = 0; k < node.rows.length; k++) {
      const i = node.rows[k];
      const left = cols[s.feature][i] < s.threshold;
      goesLeft[i] = left ? 1 : 0;
      (left ? lrows : rrows).push(i);
    }
    if (lrows.length < minDataInLeaf || rrows.length < minDataInLeaf) {
      node.best = null;
      continue;
    }
    const L = Int32Array.from(lrows);
    const R = Int32Array.from(rrows);

    let lHists = null;
    let rHists = null;
    let lOrder = null;
    let rOrder = null;

    if (mode === "hist") {
      lHists = prep.nBins.map((b) => newHistogram(b));
      rHists = prep.nBins.map((b) => newHistogram(b));
      const smallerIsLeft = L.length <= R.length;
      for (let j = 0; j < nFeat; j++) {
        if (params.subtract) {
          // Build only the smaller child; the sibling is a subtraction, and its
          // cost does not depend on how many rows it holds.
          if (smallerIsLeft) {
            buildHistogram(lHists[j], prep.binned[j], L, grad, hess);
            subtractHistogram(rHists[j], node.hists[j], lHists[j]);
          } else {
            buildHistogram(rHists[j], prep.binned[j], R, grad, hess);
            subtractHistogram(lHists[j], node.hists[j], rHists[j]);
          }
        } else {
          buildHistogram(lHists[j], prep.binned[j], L, grad, hess);
          buildHistogram(rHists[j], prep.binned[j], R, grad, hess);
        }
      }
    } else {
      // The pre-sorted algorithm: partition each feature's ordered index list,
      // preserving order, so no node ever re-sorts. O(node) per feature.
      lOrder = [];
      rOrder = [];
      for (let j = 0; j < nFeat; j++) {
        const src = node.perFeatureOrder[j];
        const a = [];
        const b = [];
        for (let k = 0; k < src.length; k++) (goesLeft[src[k]] ? a : b).push(src[k]);
        lOrder.push(Int32Array.from(a));
        rOrder.push(Int32Array.from(b));
      }
    }

    const left = makeLeaf(L, lOrder, lHists);
    const right = makeLeaf(R, rOrder, rHists);
    left.depth = node.depth + 1;
    right.depth = node.depth + 1;
    findBest(left);
    findBest(right);

    // Optional per-split trace, for the cost figures. The interesting quantity
    // is the node's SIZE at the moment it is split: it is what decides whether
    // scanning bins is cheaper than scanning rows.
    if (params.onSplit) {
      params.onSplit({
        depth: node.depth,
        nodeSize: node.rows.length,
        left: L.length,
        right: R.length,
        smaller: Math.min(L.length, R.length),
        feature: s.feature,
        gain: s.gain,
      });
    }

    node.split = { feature: s.feature, threshold: s.threshold, gain: s.gain };
    node.left = left;
    node.right = right;
    node.rows = null;
    node.hists = null;
    node.perFeatureOrder = null;
    leaves.splice(bi, 1, left, right);
    splits++;
  }

  // Freeze into a compact tree; drop the training-time scaffolding.
  const freeze = (node) =>
    node.split
      ? { split: node.split, left: freeze(node.left), right: freeze(node.right) }
      : { value: node.value, count: node.rows ? node.rows.length : 0 };
  return { tree: freeze(root), splits, leaves: splits + 1 };
}

const predictOne = (tree, x) => {
  let node = tree;
  while (node.split) node = x[node.split.feature] < node.split.threshold ? node.left : node.right;
  return node.value;
};

/* ---------------------------------------------------------------- boosting */
export function fit(cols, y, testCols, testY, options = {}) {
  const params = { ...DEFAULTS, ...options };
  const mode = params.mode || "hist";
  const n = y.length;
  const nTest = testY ? testY.length : 0;

  resetCounters();
  const t0 = Date.now();

  const prep = mode === "hist" ? prepareBins(cols, params.maxBin, params) : null;
  const order = mode === "exact" ? cols.map(argsortIndices) : null;
  const ctx = { mode, cols, prep, order, params };

  let base = 0;
  for (let i = 0; i < n; i++) base += y[i];
  base /= n;

  const pred = new Float64Array(n).fill(base);
  const testPred = nTest ? new Float64Array(nTest).fill(base) : null;
  const grad = new Float64Array(n);
  const hess = new Float64Array(n).fill(1);

  const rmse = (p, t) => {
    let s = 0;
    for (let i = 0; i < t.length; i++) s += (p[i] - t[i]) * (p[i] - t[i]);
    return Math.sqrt(s / t.length);
  };

  const trees = [];
  const curve = [{ round: 0, train: rmse(pred, y), test: nTest ? rmse(testPred, testY) : null }];

  for (let t = 0; t < params.numTrees; t++) {
    for (let i = 0; i < n; i++) grad[i] = pred[i] - y[i];
    const { tree } = growTree(ctx, grad, hess);
    trees.push(tree);
    const row = new Array(cols.length);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < cols.length; j++) row[j] = cols[j][i];
      pred[i] += params.learningRate * predictOne(tree, row);
    }
    if (nTest) {
      for (let i = 0; i < nTest; i++) {
        for (let j = 0; j < testCols.length; j++) row[j] = testCols[j][i];
        testPred[i] += params.learningRate * predictOne(tree, row);
      }
    }
    curve.push({ round: t + 1, train: rmse(pred, y), test: nTest ? rmse(testPred, testY) : null });
  }

  return {
    mode,
    params,
    trees,
    curve,
    edges: prep ? prep.edges : null,
    nBins: prep ? prep.nBins : null,
    train: rmse(pred, y),
    test: nTest ? rmse(testPred, testY) : null,
    counters: snapshotCounters(),
    ms: Date.now() - t0,
  };
}

export const predict = predictOne;
