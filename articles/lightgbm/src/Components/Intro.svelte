<script>
  import { EXACT_CURVE, PRE, CONFIG, int, big, compact } from "../experiments.js";
  import { N_TRAIN, FEATURES } from "../datasets.js";
</script>

<p class="body-text">
  A gradient boosting library spends nearly all of its time answering the same
  question over and over: given these rows and this column, where should the
  split go? The most thorough way to answer it is to try everywhere. We sort the
  rows by the column and walk along them, and at every point where the value
  changes, we score the split that would put everything on the left in one child
  and everything on the right in the other. Then we take the best one. It isn't
  clever, but nothing does better, because this scan finds the optimal split by
  construction.
</p>

<p class="body-text">
  The problem is the cost. The root node below holds {int(N_TRAIN)} rows, and
  its {FEATURES[0].name} column has {int(EXACT_CURVE.length)} places where we
  could cut it, and that's just one node and one column. If we do this for every
  column at every node of every tree, the small model in this article
  ({CONFIG.numTrees} trees with {CONFIG.numLeaves} leaves each,
  {FEATURES.length} columns and {int(N_TRAIN)} rows) scores
  <span class="bold">{big(PRE.exact.gainEvals)}</span> candidate splits before
  it's done.
</p>

<p class="body-text">
  Sorting once instead of at every node helps, and that's what "pre-sorted"
  means. However, it only removes the sort, not the walk. The walk still visits
  every row, at every node, for every feature, and it needs the sort order kept
  alongside the data for as long as the tree is growing.
</p>

<p class="body-text">
  So let's look at what the score actually depends on. Scoring a split needs the
  sum of the gradients on each side and the sum of the hessians on each side,
  which is just four numbers. It doesn't need the rows themselves, and it can't
  tell whether a sum arrived from ten thousand rows one at a time or from a
  bucket that had already added them up.
</p>

<p class="body-text">
  That's the whole trick. We bucket each column once, into a fixed number of
  bins, and add each row's gradient into its bin. Now the search for a split is
  a walk along the bins, and there are 255 of those no matter how many rows we
  have.
</p>

<p class="body-text">
  Below is that first split on that first column, with the bin count under your
  control. The thin line shows the gain at every one of the
  {int(EXACT_CURVE.length)} cuts the exact scan would consider, and the dots
  show the ones a histogram lets you see.
</p>
