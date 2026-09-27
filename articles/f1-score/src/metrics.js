/*
  Precision, recall, F1, and the thing this article is actually about: what
  tradeoff a threshold is asserting on your behalf.

  Everything is computed from a scored validation set rather than from a
  formula, because the empirical PR curve is a staircase and its jaggedness at
  the high-threshold end is part of the story.
*/

/*
  The full PR curve: one operating point per distinct score, thresholds
  descending, plus the two degenerate ends.

  Ties matter. Two units with the same score must move across the threshold
  together or the curve reports operating points no threshold can actually
  produce.
*/
export function prCurve(rows) {
  const s = rows.slice().sort((a, b) => b.score - a.score);
  const P = s.reduce((n, r) => n + r.y, 0);
  const out = [];
  let tp = 0;
  let fp = 0;
  let i = 0;
  while (i < s.length) {
    const t = s[i].score;
    while (i < s.length && s[i].score === t) {
      if (s[i].y === 1) tp++;
      else fp++;
      i++;
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    const recall = P > 0 ? tp / P : 0;
    out.push({
      t,
      tp,
      fp,
      fn: P - tp,
      tn: s.length - P - fp,
      precision,
      recall,
      f1: precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0,
      flagged: tp + fp,
    });
  }
  return out;
}

export const fbeta = (p, r, beta) => {
  const b2 = beta * beta;
  return p + r > 0 ? ((1 + b2) * p * r) / (b2 * p + r) : 0;
};

export function bestBy(curve, f) {
  let best = curve[0];
  for (const row of curve) if (f(row) > f(best)) best = row;
  return best;
}

export const bestF1 = (curve) => bestBy(curve, (r) => r.f1);

/*
  What the threshold is asserting.

  For a calibrated score, the expected-cost-minimising rule is to act when the
  probability exceeds cFP / (cFP + cFN). Read backwards, a threshold t is a
  claim that a missed failure costs (1-t)/t times what a false alarm costs —
  whether or not anyone chose that number, and whether or not anyone would
  agree with it if it were said out loud.
*/
export const impliedCostRatio = (t) => (t > 0 && t < 1 ? (1 - t) / t : Infinity);
export const thresholdForCostRatio = (ratio) => 1 / (1 + ratio);

/* Total cost at a threshold, in units of one false alarm. */
export const costAt = (row, ratio) => row.fp + ratio * row.fn;

export function bestCost(curve, ratio) {
  let best = curve[0];
  for (const row of curve) if (costAt(row, ratio) < costAt(best, ratio)) best = row;
  return best;
}

/* Average precision — the honest summary of a PR curve, because it does not
   interpolate between operating points that no classifier achieves. */
export function averagePrecision(curve) {
  let ap = 0;
  let prev = 0;
  for (const row of curve) {
    ap += row.precision * (row.recall - prev);
    prev = row.recall;
  }
  return ap;
}
