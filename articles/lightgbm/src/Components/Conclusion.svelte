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
  Replacing a column with its histogram makes split finding
  {times(GAIN_EVAL_RATIO)} cheaper in arithmetic and {times(ROW_TOUCH_RATIO)}
  cheaper in trips to memory, and it makes the data about eight times smaller on
  the way in. All of this costs {pct(ACCURACY_COST, 1)} of held-out error, so
  nothing in this article is an argument against doing it.
</p>

<p class="body-text">
  However, the three savings don't come from the same place, and the usual
  one-sentence explanation ("it buckets the data so there's less to scan") gets
  the largest one wrong. The arithmetic saving and the memory saving both come
  from the bucketing, but the saving in passes over your data comes
  <span class="bold">entirely</span> from the subtraction identity. With the
  subtraction switched off, the histogram touches
  {compact(PRE.histNoSubtract.rowTouches)} rows compared with the pre-sorted
  scan's {compact(PRE.exact.rowTouches)}, a ratio of {times(NOSUB_VS_EXACT)},
  which is no saving at all. Once we turn it on, {pct(SUBTRACT_SAVING, 0)} of
  that work disappears. So the histogram's real contribution is that it's a
  summary you can subtract, which a sorted index list isn't.
</p>

<h1 class="body-header">Things to know before you tune anything</h1>

<p class="body-text">
  <span class="bold">Turning max_bin down is the wrong trade.</span> On this
  problem, going from 255 bins to 32 costs {pct(sweep32.excess, 0)} of held-out
  error and saves {pct(1 - sweep32.rowTouches / BIN_SWEEP[BIN_SWEEP.length - 1].rowTouches, 0)}
  of the row work, because building a histogram takes a pass over the rows
  whatever its width. What you save is gain evaluations, and those were already
  the cheap half. If you need a faster model, the parameters that affect the
  expensive half are the ones that reduce how many rows a tree looks at, such as
  <span class="mono">bagging_fraction</span>,
  <span class="mono">feature_fraction</span> and GOSS, not
  <span class="mono">max_bin</span>.
</p>

<p class="body-text">
  <span class="bold">max_bin and min_data_in_leaf are really one
  parameter.</span> The bins are a grid for placing leaf boundaries, and how fine
  that grid needs to be depends on how small the leaves are allowed to be. In our
  measurements, getting within 3% of the exact model takes
  {firstWithin(LEAF_FLOOR[1], 0.03)} bins at a floor of
  {LEAF_FLOOR[1].minDataInLeaf}, but only {firstWithin(LEAF_FLOOR[3], 0.03)} at a
  floor of {LEAF_FLOOR[3].minDataInLeaf}. If you sweep one while keeping the other
  fixed, you'll find a local optimum that tells you nothing.
</p>

<p class="body-text">
  <span class="bold">The bin edges are estimated from a sample.</span>
  The <span class="mono">bin_construct_sample_cnt</span> parameter defaults to
  200,000 rows, so on any larger dataset, the edges are a random variable. This
  means two fits of the same pipeline on the same data can bin differently, and
  therefore split differently. If you're comparing two models and the splits
  have moved, check this before concluding anything about the data.
</p>

<p class="body-text">
  <span class="bold">A cut that isn't a bin edge doesn't exist.</span> The gain
  is exact and the leaf values are exact sums, so the approximation lies entirely
  in the candidate set. Usually that amounts to a rounding error, but
  occasionally it's the whole signal, as the narrow-window example above shows.
  Be suspicious when a feature's effect lives in a small range that most of the
  distribution never visits, such as a threshold effect, a regulatory cutoff or
  a sensor limit.
</p>

<p class="body-text">
  <span class="bold">Low-cardinality columns are untouched.</span> A feature with
  fewer distinct values than <span class="mono">max_bin</span> gets one bin per
  value. So whatever binning costs you, it isn't paid by your integer, ordinal or
  one-hot columns. The cost is concentrated in the continuous ones.
</p>

<p class="body-text">
  <span class="bold">Histograms aren't the paper's contribution.</span>
  Histogram-based split finding appeared in the literature and in
  implementations before LightGBM. The 2017 paper is about two other ideas, GOSS
  and EFB, both of which are built <em>on top of</em> the histogram. In fact,
  XGBoost's own documentation describes its
  <span class="mono">tree_method="hist"</span> as "an approximation tree method
  used in LightGBM with slight differences in implementation". So if you're
  comparing the two libraries and one of them uses
  <span class="mono">hist</span>, binning isn't what separates them.
</p>

<p class="body-text">
  <span class="bold">Leaf-wise growth is a separate idea, and it often gets
  confused with this one.</span> LightGBM grows the leaf with the largest gain
  rather than growing one level at a time, and its defaults
  (<span class="mono">num_leaves = 31</span> with
  <span class="mono">max_depth = -1</span>) will happily build a deep, narrow,
  overfitted tree on a small dataset. That's a growth policy, not a consequence
  of binning, yet the two often get argued about as if they were the same
  choice.
</p>

<h1 class="body-header">A note on the numbers</h1>

<p class="body-text">
  The model here is {CONFIG.numTrees} trees with {CONFIG.numLeaves} leaves each,
  trained on {int(N_TRAIN)} synthetic rows with {FEATURES.length} features and
  scored against {int(N_TEST)} held-out rows, with an irreducible noise floor of
  {NOISE_SD} minutes. The exact-split version reaches {rmse(PRE.exact.test)},
  and the 255-bin version reaches {rmse(PRE.hist.test)}. Every cost figure is an
  exact operation count taken from counters inside the split finders, not a
  timing. Binning also brings constant-factor wins, such as sequential access and
  a one-byte payload, which are real but don't show up in a count, so if
  anything, the ratios here are conservative.
</p>

<p class="body-text">
  The first split in the chart at the top is computed in your browser as you
  drag the slider, but the sweeps aren't. Twelve boosted forests take several
  seconds to fit, so they're computed by a script in the repository, using the
  same modules this page imports, and committed as data. The checking script
  re-runs every one of those fits and fails if any number has moved, which turns
  a stale figure into a broken build rather than a quiet error.
</p>

<p class="body-text">
  Finally, it's worth noticing what the trick actually was. Nobody found a better
  way to search for a split. Instead, they noticed that the thing being searched
  over depends on the data only through a handful of sums, that sums can be
  computed in advance, and that sums can be subtracted. Everything else, from the
  byte-wide storage and the cheap siblings to distributed training that sends
  histograms instead of rows, follows from that one observation about the shape
  of the formula.
</p>

<p class="body-text">
  Thanks for reading!
</p>
