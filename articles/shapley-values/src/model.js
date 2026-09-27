/*
  A small gradient-boosted regression forest, and the value function that turns
  one of its predictions into a cooperative game.

  The model is here to be non-additive. Nothing about Shapley values needs
  trees; what the article needs is a model whose answer to "what is a kilometre
  worth" genuinely depends on the other features, and a pile of depth-3 trees
  fit to an interacting target is the honest way to get one.
*/

// ---------------------------------------------------------------- CART

function mean(values) {
  let s = 0;
  for (const v of values) s += v;
  return values.length ? s / values.length : 0;
}

// Candidate thresholds: midpoints between consecutive distinct values, thinned
// to at most `maxSplits` evenly spaced candidates so fitting stays cheap.
function candidates(rows, f, maxSplits) {
  const vals = [...new Set(rows.map((r) => r.x[f]))].sort((a, b) => a - b);
  if (vals.length < 2) return [];
  const mids = [];
  for (let i = 1; i < vals.length; i++) mids.push((vals[i - 1] + vals[i]) / 2);
  if (mids.length <= maxSplits) return mids;
  const out = [];
  for (let k = 0; k < maxSplits; k++) {
    out.push(mids[Math.floor(((k + 0.5) * mids.length) / maxSplits)]);
  }
  return out;
}

function buildTree(rows, targets, depth, opts) {
  const value = mean(targets);
  if (depth >= opts.maxDepth || rows.length < 2 * opts.minLeaf) {
    return { leaf: true, value };
  }

  let best = null;
  const parentSse = targets.reduce((s, t) => s + (t - value) * (t - value), 0);

  for (let f = 0; f < opts.nFeatures; f++) {
    for (const thr of candidates(rows, f, opts.maxSplits)) {
      const li = [];
      const ri = [];
      for (let i = 0; i < rows.length; i++) {
        (rows[i].x[f] <= thr ? li : ri).push(i);
      }
      if (li.length < opts.minLeaf || ri.length < opts.minLeaf) continue;
      const lt = li.map((i) => targets[i]);
      const rt = ri.map((i) => targets[i]);
      const lm = mean(lt);
      const rm = mean(rt);
      const sse =
        lt.reduce((s, t) => s + (t - lm) * (t - lm), 0) +
        rt.reduce((s, t) => s + (t - rm) * (t - rm), 0);
      if (!best || sse < best.sse) best = { f, thr, sse, li, ri };
    }
  }

  if (!best || parentSse - best.sse <= 0) return { leaf: true, value };

  return {
    leaf: false,
    feature: best.f,
    threshold: best.thr,
    left: buildTree(
      best.li.map((i) => rows[i]),
      best.li.map((i) => targets[i]),
      depth + 1,
      opts
    ),
    right: buildTree(
      best.ri.map((i) => rows[i]),
      best.ri.map((i) => targets[i]),
      depth + 1,
      opts
    ),
  };
}

function treePredict(node, x) {
  let n = node;
  while (!n.leaf) n = x[n.feature] <= n.threshold ? n.left : n.right;
  return n.value;
}

// ---------------------------------------------------------------- boosting

export const DEFAULTS = {
  // Chosen off a train/held-out sweep over trees x rate x depth (verify/sweep.mjs).
  // Held-out RMSE is flat at roughly 1130-1160 kr across a wide band; this is the
  // cheapest corner of that plateau, which matters because the model is fit in
  // the reader's browser at page load.
  nTrees: 40,
  learningRate: 0.2,
  maxDepth: 3,
  minLeaf: 8,
  maxSplits: 24,
  nFeatures: 3,
};

export function fitEnsemble(rows, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const base = mean(rows.map((r) => r.y));
  const running = rows.map(() => base);
  const trees = [];
  for (let t = 0; t < opts.nTrees; t++) {
    const residuals = rows.map((r, i) => r.y - running[i]);
    const tree = buildTree(rows, residuals, 0, opts);
    trees.push(tree);
    for (let i = 0; i < rows.length; i++) {
      running[i] += opts.learningRate * treePredict(tree, rows[i].x);
    }
  }
  return { base, trees, learningRate: opts.learningRate };
}

export function predict(model, x) {
  let y = model.base;
  for (const tree of model.trees) y += model.learningRate * treePredict(tree, x);
  return y;
}

export function rmse(model, rows) {
  let s = 0;
  for (const r of rows) {
    const d = r.y - predict(model, r.x);
    s += d * d;
  }
  return Math.sqrt(s / rows.length);
}

// ---------------------------------------------------------------- the game

/*
  A prediction, recast as a cooperative game.

  The players are the features. A coalition S is the set of features you are
  allowed to look at, and its payoff is what the model predicts on average when
  the features in S are held at this listing's values and everything else is
  drawn from the background data:

      v(S) = (1 / M) * sum over background rows m of  f( x_S , m_notS )

  This is the *interventional* (marginal) value function: the features outside S
  are replaced, not conditioned on. It is the one that keeps the explanation a
  statement about the model rather than about the data's correlations, and it is
  what the article's limits section is careful about.

  v(empty) is the average prediction over the background - the baseline every
  waterfall starts from - and v(all) is f(x) exactly, so the Shapley values sum
  to f(x) - baseline.
*/
export function makeValueFunction(model, instance, background, nFeatures = 3) {
  const cache = new Map();
  return function v(mask) {
    if (cache.has(mask)) return cache.get(mask);
    let total = 0;
    for (const row of background) {
      const x = row.x.slice();
      for (let i = 0; i < nFeatures; i++) {
        if ((mask >> i) & 1) x[i] = instance[i];
      }
      total += predict(model, x);
    }
    const out = total / background.length;
    cache.set(mask, out);
    return out;
  };
}

// A fixed, evenly-spaced slice of the training data. Small enough that all 2^n
// coalitions are computed instantly in the browser, large enough that the
// baseline is stable.
export function backgroundSample(rows, size = 200) {
  const step = Math.max(1, Math.floor(rows.length / size));
  const out = [];
  for (let i = 0; i < rows.length && out.length < size; i += step) out.push(rows[i]);
  return out;
}
