<script>
  import { EXACT_CURVE, PRE, CONFIG, int, big, compact } from "../experiments.js";
  import { N_TRAIN, FEATURES } from "../datasets.js";
</script>

<p class="body-text">
  A gradient boosting library spends nearly all of its time answering one
  question over and over: given these rows, and this column, where should the
  split go? The honest way to answer it is to try everywhere. Sort the rows by
  the column, walk along, and at every point where the value changes, score the
  split that would put everything to the left in one child and everything to the
  right in the other. Take the best. It is not clever, and there is nothing
  better — that scan finds the optimal split, by construction.
</p>

<p class="body-text">
  The cost is the problem. The root node below holds {int(N_TRAIN)} rows, and
  its {FEATURES[0].name} column has {int(EXACT_CURVE.length)} places you could
  cut it. That is one node, one column. Do it for every column at every node of
  every tree and the small model in this article — {CONFIG.numTrees} trees,
  {CONFIG.numLeaves} leaves each, {FEATURES.length} columns, {int(N_TRAIN)} rows —
  scores <span class="bold">{big(PRE.exact.gainEvals)}</span> candidate splits
  before it is done.
</p>

<p class="body-text">
  Sorting once instead of at every node helps, and that is what "pre-sorted"
  means; it removes the sort, not the walk. The walk is still every row, at every
  node, for every feature, and it needs the sort order kept alongside the data
  for as long as the tree is growing.
</p>

<p class="body-text">
  So look at what the score actually depends on. Scoring a split needs the sum
  of the gradients on each side and the sum of the hessians on each side: four
  numbers. It does not need the rows. It cannot tell whether a sum arrived from
  ten thousand rows one at a time or from a bucket that had already added them
  up.
</p>

<p class="body-text">
  That is the whole trick. Bucket each column once, into a fixed number of bins.
  Add each row's gradient into its bin. Now the search for a split is a walk
  along the bins — and there are 255 of those however many rows you have.
</p>

<p class="body-text">
  Below is that first split, on that first column, with the bin count under your
  control. The thin line is the gain at every one of the
  {int(EXACT_CURVE.length)} cuts the exact scan would consider. The dots are the
  ones a histogram lets you see.
</p>
