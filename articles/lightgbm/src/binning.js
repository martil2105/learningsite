/*
  The histogram trick, written out.

  Two split finders live here, doing the same job on the same data, and the
  article is the difference between them:

    exactBestSplit      considers every threshold between consecutive distinct
                        values - the best split that exists
    histogramBestSplit  considers only the bin edges - a subset of the same
                        candidates, so it can never score higher, and usually
                        scores within a hair

  Both are instrumented. COUNTERS is the article's cost model: it is not a
  timing, it is an exact count of the two operations that matter.
*/

// ------------------------------------------------------------------ counters
export const COUNTERS = {
  rowTouches: 0, // a row's gradient read while scanning or accumulating
  gainEvals: 0, // one candidate split scored: two divisions and a subtraction
  histBuilds: 0, // a histogram accumulated from rows
  histSubtracts: 0, // a histogram obtained as parent minus sibling
};
export const resetCounters = () => {
  COUNTERS.rowTouches = 0;
  COUNTERS.gainEvals = 0;
  COUNTERS.histBuilds = 0;
  COUNTERS.histSubtracts = 0;
};
export const snapshotCounters = () => ({ ...COUNTERS });

// ------------------------------------------------------------------ the gain
/*
  The split gain, in the form both XGBoost and LightGBM use. With gradients g
  and hessians h summed on each side, and L2 penalty lambda:

    gain = 1/2 [ G_L^2/(H_L+L) + G_R^2/(H_R+L) - G^2/(H+L) ] - gamma

  The only thing to notice - and it is the whole article - is that the data
  enters ONLY through the four sums. Nothing in this expression can tell whether
  G_L came from ten thousand rows or from a bucket that already added them up.
*/
export function splitGain(gL, hL, gR, hR, lambda, gamma) {
  COUNTERS.gainEvals++;
  const g = gL + gR;
  const h = hL + hR;
  return 0.5 * ((gL * gL) / (hL + lambda) + (gR * gR) / (hR + lambda) - (g * g) / (h + lambda)) - gamma;
}

export const leafValue = (g, h, lambda) => -g / (h + lambda);

// ------------------------------------------------------------------ bin edges
/*
  Where the cuts go. LightGBM samples up to bin_construct_sample_cnt rows
  (200,000 by default), sorts the distinct values, and lays the edges down so
  that bins hold roughly equal COUNTS - quantiles, not equal widths. A feature
  with fewer distinct values than max_bin keeps one bin per value, and bins
  holding fewer than min_data_in_bin rows are merged away.

  Three consequences the article shows:
    - edges cluster where the data is dense, so a skewed feature is not wasted
      on empty range;
    - a candidate threshold is always an actual data value;
    - the edges depend on a SAMPLE, so they are a random variable.
*/
export function binEdges(values, maxBin, { minDataInBin = 3, sampleCount = Infinity, rand = null } = {}) {
  let sample = values;
  if (rand && sampleCount < values.length) {
    sample = new Float64Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) sample[i] = values[Math.floor(rand() * values.length)];
  }
  const sorted = Float64Array.from(sample).sort();
  const n = sorted.length;

  // Distinct values and how many rows sit on each.
  const distinct = [];
  const counts = [];
  for (let i = 0; i < n; i++) {
    if (i === 0 || sorted[i] !== sorted[i - 1]) {
      distinct.push(sorted[i]);
      counts.push(1);
    } else counts[counts.length - 1]++;
  }
  // Fewer distinct values than bins: every value gets its own bin, and no
  // approximation happens at all. This is why a column of small integers is
  // unaffected by max_bin.
  if (distinct.length <= maxBin) return distinct.slice(1); // upper edges, exclusive of the first

  const target = n / maxBin;
  const edges = [];
  let acc = 0;
  for (let i = 0; i < distinct.length - 1; i++) {
    acc += counts[i];
    if (acc >= target * (edges.length + 1) && acc >= minDataInBin) {
      edges.push(distinct[i + 1]);
      if (edges.length === maxBin - 1) break;
    }
  }
  return edges;
}

// Bin index of a value: the number of edges it is at or above. Binary search.
export function binOf(value, edges) {
  let lo = 0;
  let hi = edges.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (value < edges[mid]) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/*
  The binned column. Uint8Array when it fits, which is the memory claim in
  LightGBM's docs: with max_bin = 255 a feature value is one byte instead of the
  eight of a Float64, and there is no permutation index to keep beside it.
*/
export function binizeColumn(values, edges) {
  const nBins = edges.length + 1;
  const out = nBins <= 256 ? new Uint8Array(values.length) : new Uint16Array(values.length);
  for (let i = 0; i < values.length; i++) out[i] = binOf(values[i], edges);
  return out;
}

export function bytesPerValue(nBins) {
  return nBins <= 256 ? 1 : nBins <= 65536 ? 2 : 4;
}

// ------------------------------------------------------------------ histogram
/*
  A histogram is three small arrays: the gradient sum, the hessian sum and the
  row count per bin. Building it is one sequential pass with two adds per row -
  no sorting, no gather through a permutation, and the output does not grow with
  the number of rows.
*/
export function newHistogram(nBins) {
  return { g: new Float64Array(nBins), h: new Float64Array(nBins), c: new Int32Array(nBins) };
}

export function buildHistogram(hist, binned, indices, grad, hess) {
  hist.g.fill(0);
  hist.h.fill(0);
  hist.c.fill(0);
  for (let k = 0; k < indices.length; k++) {
    const i = indices[k];
    const b = binned[i];
    hist.g[b] += grad[i];
    hist.h[b] += hess[i];
    hist.c[b]++;
    COUNTERS.rowTouches++;
  }
  COUNTERS.histBuilds++;
  return hist;
}

/*
  The subtraction trick, and the reason the histogram is not merely a different
  way of spending the same time. A node's rows are exactly its two children's
  rows, so every bin of the parent's histogram is the sum of the same bin in the
  two children. Build the SMALLER child from its rows and the larger one is a
  subtraction: O(#bins), independent of how many rows it holds.
*/
export function subtractHistogram(out, parent, sibling) {
  for (let b = 0; b < out.g.length; b++) {
    out.g[b] = parent.g[b] - sibling.g[b];
    out.h[b] = parent.h[b] - sibling.h[b];
    out.c[b] = parent.c[b] - sibling.c[b];
  }
  COUNTERS.histSubtracts++;
  return out;
}

/*
  Scan a histogram left to right, keeping running sums. Every bin boundary is one
  candidate split; there are #bins - 1 of them however many rows went in.
*/
export function histogramBestSplit(hist, { lambda, gamma, minDataInLeaf }) {
  const nBins = hist.g.length;
  let G = 0;
  let H = 0;
  let C = 0;
  for (let b = 0; b < nBins; b++) {
    G += hist.g[b];
    H += hist.h[b];
    C += hist.c[b];
  }
  let best = null;
  let gL = 0;
  let hL = 0;
  let cL = 0;
  for (let b = 0; b < nBins - 1; b++) {
    gL += hist.g[b];
    hL += hist.h[b];
    cL += hist.c[b];
    if (cL < minDataInLeaf || C - cL < minDataInLeaf) continue;
    const gain = splitGain(gL, hL, G - gL, H - hL, lambda, gamma);
    if (gain > 0 && (!best || gain > best.gain)) {
      best = { gain, bin: b, countLeft: cL, countRight: C - cL, gL, hL, gR: G - gL, hR: H - hL };
    }
  }
  return best;
}

/*
  The thing being approximated. Sort the node's rows by the raw feature value and
  score every boundary between distinct values. This is the best split that
  exists, and it is what "exact" means in tree_method="exact".

  Written to be the strongest version of the opponent: the sort order is passed
  in, so this is the pre-sorted algorithm, not a naive re-sort per node.
*/
export function exactBestSplit(values, orderedIndices, grad, hess, { G, H, lambda, gamma, minDataInLeaf }) {
  const n = orderedIndices.length;
  // The node's totals are passed in rather than recomputed. A second pass over
  // the rows would double this method's row count and make the comparison in
  // the article flattering to the histogram for no good reason - the caller
  // already knows G and H, and so does every real implementation.
  let best = null;
  let gL = 0;
  let hL = 0;
  for (let k = 0; k < n - 1; k++) {
    const i = orderedIndices[k];
    gL += grad[i];
    hL += hess[i];
    COUNTERS.rowTouches++;
    // Only a boundary between two DIFFERENT values is a real candidate.
    if (values[i] === values[orderedIndices[k + 1]]) continue;
    const cL = k + 1;
    if (cL < minDataInLeaf || n - cL < minDataInLeaf) continue;
    const gain = splitGain(gL, hL, G - gL, H - hL, lambda, gamma);
    if (gain > 0 && (!best || gain > best.gain)) {
      best = {
        gain,
        threshold: (values[i] + values[orderedIndices[k + 1]]) / 2,
        countLeft: cL,
        countRight: n - cL,
        gL, hL, gR: G - gL, hR: H - hL,
      };
    }
  }
  return best;
}

// Every candidate the exact scan would consider, with its gain - the curve the
// hook draws underneath the binned candidates.
export function exactGainCurve(values, orderedIndices, grad, hess, { lambda, gamma, minDataInLeaf }) {
  const n = orderedIndices.length;
  let G = 0;
  let H = 0;
  for (let k = 0; k < n; k++) {
    G += grad[orderedIndices[k]];
    H += hess[orderedIndices[k]];
  }
  const out = [];
  let gL = 0;
  let hL = 0;
  for (let k = 0; k < n - 1; k++) {
    const i = orderedIndices[k];
    gL += grad[i];
    hL += hess[i];
    if (values[i] === values[orderedIndices[k + 1]]) continue;
    const cL = k + 1;
    if (cL < minDataInLeaf || n - cL < minDataInLeaf) continue;
    const g = gL;
    const h = hL;
    const gain =
      0.5 * ((g * g) / (h + lambda) + ((G - g) * (G - g)) / (H - h + lambda) - (G * G) / (H + lambda)) - gamma;
    out.push({ threshold: (values[i] + values[orderedIndices[k + 1]]) / 2, gain, countLeft: cL });
  }
  return out;
}

export const argsortIndices = (values) =>
  Int32Array.from(Array.from({ length: values.length }, (_, i) => i).sort((a, b) => values[a] - values[b]));
