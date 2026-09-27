/*
  XGBoost core mathematical engine.
  Implements the exact formulation from Chen & Guestrin (2016):
  - Second-order Taylor expansion of loss
  - Optimal leaf weights with L2 regularization (lambda)
  - Split Gain evaluation with complexity penalty (gamma)
  - Sequential gradient boosting with shrinkage (eta / learning rate)
*/

export function calculateBaseScore(data) {
  if (!data || data.length === 0) return 0;
  const sum = data.reduce((acc, p) => acc + p.y, 0);
  return sum / data.length;
}

export function computeGradients(data, predictions) {
  // For Squared Error Loss: L(y, y_hat) = 0.5 * (y - y_hat)^2
  // First derivative w.r.t y_hat: g_i = y_hat_i - y_i
  // Note: negative gradient (pseudo-residual) is y_i - y_hat_i = -g_i
  // Second derivative w.r.t y_hat: h_i = 1
  return data.map((p, i) => {
    const yHat = predictions[i];
    const residual = p.y - yHat; // target - prediction
    const g = yHat - p.y; // first-order gradient
    const h = 1.0; // second-order Hessian
    return { ...p, yHat, residual, g, h };
  });
}

export function leafWeight(points, lambda = 1.0) {
  if (!points || points.length === 0) return 0;
  const sumG = points.reduce((acc, p) => acc + p.g, 0);
  const sumH = points.reduce((acc, p) => acc + p.h, 0);
  // w* = - sum(g) / (sum(h) + lambda)
  return -sumG / (sumH + lambda);
}

export function similarityScore(points, lambda = 1.0) {
  if (!points || points.length === 0) return 0;
  const sumG = points.reduce((acc, p) => acc + p.g, 0);
  const sumH = points.reduce((acc, p) => acc + p.h, 0);
  return (sumG * sumG) / (sumH + lambda);
}

export function calculateGain(leftPoints, rightPoints, lambda = 1.0, gamma = 0.0) {
  const gL = leftPoints.reduce((acc, p) => acc + p.g, 0);
  const hL = leftPoints.reduce((acc, p) => acc + p.h, 0);
  const gR = rightPoints.reduce((acc, p) => acc + p.g, 0);
  const hR = rightPoints.reduce((acc, p) => acc + p.h, 0);

  const scoreL = (gL * gL) / (hL + lambda);
  const scoreR = (gR * gR) / (hR + lambda);
  const scoreTotal = ((gL + gR) * (gL + gR)) / (hL + hR + lambda);

  // Gain = 0.5 * [Score_L + Score_R - Score_Total] - gamma
  return 0.5 * (scoreL + scoreR - scoreTotal) - gamma;
}

export function scanCandidateSplits(points, lambda = 1.0, gamma = 0.0) {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const candidates = [];

  const totalG = sorted.reduce((acc, p) => acc + p.g, 0);
  const totalH = sorted.reduce((acc, p) => acc + p.h, 0);
  const totalScore = (totalG * totalG) / (totalH + lambda);

  let runningG = 0;
  let runningH = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    runningG += sorted[i].g;
    runningH += sorted[i].h;

    // Only consider split between different x values
    if (sorted[i].x !== sorted[i + 1].x) {
      const splitValue = (sorted[i].x + sorted[i + 1].x) / 2;
      const rightG = totalG - runningG;
      const rightH = totalH - runningH;

      const scoreL = (runningG * runningG) / (runningH + lambda);
      const scoreR = (rightG * rightG) / (rightH + lambda);
      const gain = 0.5 * (scoreL + scoreR - totalScore) - gamma;

      candidates.push({
        splitValue,
        gain,
        scoreL,
        scoreR,
        totalScore,
        leftWeight: -runningG / (runningH + lambda),
        rightWeight: -rightG / (rightH + lambda),
        leftCount: i + 1,
        rightCount: sorted.length - (i + 1),
      });
    }
  }

  return candidates;
}

export function buildTree(points, maxDepth = 1, lambda = 1.0, gamma = 0.0, currentDepth = 0) {
  const weight = leafWeight(points, lambda);

  if (currentDepth >= maxDepth || points.length < 2) {
    return {
      type: "leaf",
      weight,
      points,
      depth: currentDepth,
    };
  }

  const candidates = scanCandidateSplits(points, lambda, gamma);
  if (candidates.length === 0) {
    return {
      type: "leaf",
      weight,
      points,
      depth: currentDepth,
    };
  }

  // Find best candidate with maximum positive gain
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i].gain > best.gain) {
      best = candidates[i];
    }
  }

  if (best.gain <= 0) {
    // Pruned! Gain is not positive
    return {
      type: "leaf",
      weight,
      points,
      depth: currentDepth,
      pruned: true,
    };
  }

  const leftPoints = points.filter((p) => p.x <= best.splitValue);
  const rightPoints = points.filter((p) => p.x > best.splitValue);

  return {
    type: "split",
    splitValue: best.splitValue,
    gain: best.gain,
    depth: currentDepth,
    points,
    left: buildTree(leftPoints, maxDepth, lambda, gamma, currentDepth + 1),
    right: buildTree(rightPoints, maxDepth, lambda, gamma, currentDepth + 1),
  };
}

export function predictTree(treeNode, x) {
  if (treeNode.type === "leaf") {
    return treeNode.weight;
  }
  if (x <= treeNode.splitValue) {
    return predictTree(treeNode.left, x);
  }
  return predictTree(treeNode.right, x);
}

export function computeRMSE(data, predictions) {
  if (data.length === 0) return 0;
  let sse = 0;
  for (let i = 0; i < data.length; i++) {
    const diff = data[i].y - predictions[i];
    sse += diff * diff;
  }
  return Math.sqrt(sse / data.length);
}

export function trainEnsemble(data, options = {}) {
  const {
    nTrees = 25,
    learningRate = 0.2,
    lambda = 1.0,
    gamma = 0.0,
    maxDepth = 1,
    baseScore = calculateBaseScore(data),
  } = options;

  const rounds = [];
  let currentPredictions = data.map(() => baseScore);

  // Round 0: initial baseline
  rounds.push({
    round: 0,
    tree: null,
    predictions: [...currentPredictions],
    residuals: data.map((p) => p.y - baseScore),
    rmse: computeRMSE(data, currentPredictions),
  });

  const trees = [];

  for (let t = 1; t <= nTrees; t++) {
    const pointsWithGrads = computeGradients(data, currentPredictions);
    const tree = buildTree(pointsWithGrads, maxDepth, lambda, gamma, 0);
    trees.push(tree);

    // Update predictions with shrinkage: y_hat = y_hat + eta * f_t(x)
    currentPredictions = currentPredictions.map((pred, i) => {
      const treePred = predictTree(tree, data[i].x);
      return pred + learningRate * treePred;
    });

    const residuals = data.map((p, i) => p.y - currentPredictions[i]);
    const rmse = computeRMSE(data, currentPredictions);

    rounds.push({
      round: t,
      tree,
      predictions: [...currentPredictions],
      residuals,
      rmse,
      learningRate,
      lambda,
      gamma,
    });
  }

  return {
    baseScore,
    trees,
    rounds,
    predict(x, upToRound = nTrees) {
      let pred = baseScore;
      const count = Math.min(upToRound, trees.length);
      for (let i = 0; i < count; i++) {
        pred += learningRate * predictTree(trees[i], x);
      }
      return pred;
    },
    predictCurve(xDomain, steps = 100, upToRound = nTrees) {
      const [xMin, xMax] = xDomain;
      const stepSize = (xMax - xMin) / (steps - 1);
      const points = [];
      for (let i = 0; i < steps; i++) {
        const x = xMin + i * stepSize;
        points.push({ x, y: this.predict(x, upToRound) });
      }
      return points;
    },
    treeCurve(treeIndex, xDomain, steps = 100) {
      if (treeIndex < 0 || treeIndex >= trees.length) return [];
      const tree = trees[treeIndex];
      const [xMin, xMax] = xDomain;
      const stepSize = (xMax - xMin) / (steps - 1);
      const points = [];
      for (let i = 0; i < steps; i++) {
        const x = xMin + i * stepSize;
        points.push({ x, y: predictTree(tree, x) });
      }
      return points;
    },
  };
}

/*
  Root mean squared error of a trained ensemble on any set of points — the
  training set it was fit on, or held-out days it has never seen.
*/
export function rmseOn(model, points, upToRound) {
  if (!points || points.length === 0) return 0;
  let sse = 0;
  for (const p of points) {
    const e = p.y - model.predict(p.x, upToRound);
    sse += e * e;
  }
  return Math.sqrt(sse / points.length);
}

/*
  Squared error is the degenerate case for the second-order machinery: the
  Taylor expansion is exact and every Hessian is 1, so the Hessian cancels out
  of both the leaf weight and the gain and nothing in this article's charts
  would change if you deleted it.

  Logistic loss is where it earns its place. With a raw score (log-odds) m and
  p = sigma(m), the gradient is p - y and the Hessian is p(1 - p): largest at
  p = 0.5, where the model is unsure, and vanishing as p approaches 0 or 1.
  Since the Hessian is the denominator of the leaf weight and of the gain, a
  point the model is already confident about carries almost no weight in
  choosing the next split. That is the whole point of going to second order.
*/
export const sigmoid = (m) => 1 / (1 + Math.exp(-m));

export function logisticStats(label, margin) {
  const p = sigmoid(margin);
  return { p, g: p - label, h: p * (1 - p) };
}

export function squaredStats(y, yHat) {
  return { g: yHat - y, h: 1 };
}
