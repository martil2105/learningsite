<script>
  import katexify from "../katexify";
  import {
    PRE, CONFIG, BIN_SWEEP, LEAF_FLOOR, firstWithin, GAIN_EVAL_RATIO, ROW_TOUCH_RATIO,
    NOSUB_VS_EXACT, SUBTRACT_SAVING, ACCURACY_COST, compact, pct, times, rmse, int,
  } from "../experiments.js";
  import { N_TRAIN, N_TEST, FEATURES, NOISE_SD } from "../datasets.js";
  const sweep32 = BIN_SWEEP.find((r) => r.maxBin === 32);
</script>

<h1 class="body-header">What the histogram is actually for</h1>

<p class="body-text">
  Replacing a column with a histogram of it makes split finding
  {times(GAIN_EVAL_RATIO)} cheaper in arithmetic, {times(ROW_TOUCH_RATIO)}
  cheaper in trips to memory, and about eight times smaller on the way in. It
  costs {pct(ACCURACY_COST, 1)} of held-out error. Nothing in this article is an
  argument against doing it.
</p>

<p class="body-text">
  But the three savings do not come from the same place, and the usual
  one-sentence version — "it buckets the data so there is less to scan" — gets
  the largest one wrong. The arithmetic saving is the bucketing. The memory
  saving is the bucketing. The saving in passes over your data is
  <span class="bold">entirely</span> the subtraction identity: with it switched
  off, the histogram touches {compact(PRE.histNoSubtract.rowTouches)} rows against
  the pre-sorted scan's {compact(PRE.exact.rowTouches)}, which is
  {times(NOSUB_VS_EXACT)} — no saving at all. Turn it on and
  {pct(SUBTRACT_SAVING, 0)} of that disappears. The histogram's real contribution
  is that it is a summary you can subtract, and a sorted index list is not.
</p>

<h1 class="body-header">The limits worth knowing before you tune anything</h1>

<p class="body-text">
  <span class="bold">Turning max_bin down is the wrong trade.</span> On this
  problem, going from 255 bins to 32 costs {pct(sweep32.excess, 0)} of held-out
  error and saves {pct(1 - sweep32.rowTouches / BIN_SWEEP[BIN_SWEEP.length - 1].rowTouches, 0)}
  of the row work, because building a histogram is a pass over the rows whatever
  its width. What you save is gain evaluations, and those were already the cheap
  half. If you need the model faster, the parameters that touch the expensive
  half are the ones that reduce how many rows a tree looks at —
  <span class="mono">bagging_fraction</span>,
  <span class="mono">feature_fraction</span>, GOSS — not
  <span class="mono">max_bin</span>.
</p>

<p class="body-text">
  <span class="bold">max_bin and min_data_in_leaf are one parameter.</span> The
  bins are a grid for placing leaf boundaries; how fine the grid needs to be
  depends on how small the leaves are allowed to be. Measured here: within 3% of
  the exact model needs {firstWithin(LEAF_FLOOR[1], 0.03)} bins at a floor of
  {LEAF_FLOOR[1].minDataInLeaf} and only {firstWithin(LEAF_FLOOR[3], 0.03)} at a
  floor of {LEAF_FLOOR[3].minDataInLeaf}. Sweeping one with the other pinned will
  find you a local optimum and tell you nothing.
</p>

<p class="body-text">
  <span class="bold">The bin edges are estimated from a sample.</span>
  <span class="mono">bin_construct_sample_cnt</span> defaults to 200,000 rows, so
  on anything larger the edges are a random variable. Two fits of the same
  pipeline on the same data can bin differently and therefore split differently.
  If you are diffing two models and the splits have moved, check this before
  concluding anything about the data.
</p>

<p class="body-text">
  <span class="bold">A cut that is not a bin edge does not exist.</span> The gain
  is exact and the leaf values are exact sums; the approximation is entirely in
  the candidate set. That is usually a rounding error and occasionally it is the
  whole signal, as the narrow-window example above shows. Suspect it when a
  feature's effect lives in a small range that the bulk of the distribution does
  not visit — a threshold effect, a regulatory cutoff, a sensor limit.
</p>

<p class="body-text">
  <span class="bold">Low-cardinality columns are untouched.</span> A feature with
  fewer distinct values than <span class="mono">max_bin</span> gets one bin per
  value. Whatever binning costs you, it is not being paid by your integer,
  ordinal or one-hot columns — it is concentrated in the continuous ones.
</p>

<p class="body-text">
  <span class="bold">Histograms are not the paper's contribution.</span>
  Histogram-based split finding was in the literature and in implementations
  before LightGBM; the 2017 paper is about two other things, GOSS and EFB, both
  of which are built <em>on</em> the histogram. And XGBoost's own documentation
  describes its <span class="mono">tree_method="hist"</span> as "an approximation
  tree method used in LightGBM with slight differences in implementation". If you
  are comparing the two libraries and one is on <span class="mono">hist</span>,
  binning is not the difference between them.
</p>

<p class="body-text">
  <span class="bold">Leaf-wise growth is a separate idea and gets blamed for
  this one.</span> LightGBM grows the leaf with the largest gain rather than a
  level at a time, and its defaults —
  <span class="mono">num_leaves = 31</span> with
  <span class="mono">max_depth = -1</span> — will happily build a deep, narrow,
  overfitted tree on a small dataset. That is a growth policy, not a consequence
  of binning, and the two get argued about as if they were the same choice.
</p>

<h1 class="body-header">A note on the numbers here</h1>

<p class="body-text">
  The model is {CONFIG.numTrees} trees of {CONFIG.numLeaves} leaves on
  {int(N_TRAIN)} synthetic rows with {FEATURES.length} features, scored against
  {int(N_TEST)} held-out rows, with an irreducible noise floor of {NOISE_SD}
  minutes; the exact-split version reaches {rmse(PRE.exact.test)} and the
  255-bin version {rmse(PRE.hist.test)}. Every cost figure is an exact operation
  count taken from counters inside the split finders, not a timing — the
  constant-factor wins that binning also brings, sequential access and a
  one-byte payload, are real and do not show up in a count, which means the
  ratios here are if anything conservative.
</p>

<p class="body-text">
  The first split in the chart at the top is computed in your browser as you drag
  the slider. The sweeps are not: twelve boosted forests is several seconds of
  work, so they are computed by a script in the repository, from the same modules
  this page imports, and committed as data. The checking script re-runs every one
  of those fits and fails if a number has moved, which makes a stale figure a
  broken build rather than a quiet lie.
</p>

<p class="body-text">
  It is worth noticing what the trick actually was. Nobody found a better way to
  search for a split. They noticed that the thing being searched over depends on
  the data only through a handful of sums, that sums can be computed in advance,
  and that sums subtract. Everything else — the byte-wide storage, the cheap
  siblings, the distributed training where you send histograms instead of rows —
  falls out of that one observation about the shape of the formula.
</p>
