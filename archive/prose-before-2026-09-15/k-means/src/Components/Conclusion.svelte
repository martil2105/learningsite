<script>
  import katexify from "../katexify";
  import { MAIN, UNIFORM } from "../datasets.js";
  import { FORGY, PLUSPLUS, BEST, N_INIT_10, NOISE_BEST_K, SHAPE, int, pct, oneIn } from "../experiments.js";
</script>

<h1 class="body-header">What you actually have</h1>

<p class="body-text">
  A partition of your points into k groups, and a guarantee that no single point
  would rather be in a different group and no single centroid would rather be
  somewhere else. That is a real property and it is worth having. It is also the
  entire list.
</p>

<p class="body-text">
  It is not a minimum of the objective — you saw {pct(1 - FORGY.rate, 0)} of runs
  stop short of one. It is not the structure in the data — you saw the objective
  actively prefer the wrong grouping in all four of the shapes above. And it is
  not evidence that groups exist, because the same procedure returns a tidy
  {NOISE_BEST_K.k} clusters from {UNIFORM.length} points of uniform noise.
</p>

<h1 class="body-header">The limits worth knowing before you act on a cluster</h1>

<p class="body-text">
  <span class="bold">Your scaling decision is the model.</span> The objective is
  a sum of <em>squared</em> distances, so multiplying a feature by ten multiplies
  its say in the answer by a hundred. Standardising every column is the usual
  reflex and it is not neutral — it asserts that a standard deviation of income
  and a standard deviation of age should count the same. There is no
  scaling-free version of k-means to fall back on. Whatever you chose, that is
  the modelling assumption, and it belongs in the write-up.
</p>

<p class="body-text">
  <span class="bold">It has no way to decline.</span> Ask for six clusters in
  data with none and you get six, with centroids, sizes and a silhouette score.
  Nothing in the output distinguishes a discovered group from a slice of a
  continuum. The one method here that can answer "there is only one cluster" is
  the gap statistic, because it is the only one that compares against a
  reference distribution.
</p>

<p class="body-text">
  <span class="bold">The mean is not robust, and squaring makes it worse.</span>
  A single stray point pulls its centroid, and pulls with weight proportional to
  its distance. On real data that usually means a handful of outliers quietly
  claim a cluster of their own — which is occasionally what you wanted and
  usually not. k-medians and k-medoids exist for this and cost more.
</p>

<p class="body-text">
  <span class="bold">Distances stop discriminating in high dimensions.</span> As
  the number of features grows at a fixed sample size, the distance to the
  nearest point and to the farthest point converge, and "assign to the nearest
  centroid" is deciding on an increasingly thin margin. Reducing dimension first
  is the standard answer, and it is a second modelling choice stacked on the
  first — PCA-then-k-means finds clusters in the projection, not in your data.
</p>

<p class="body-text">
  <span class="bold">Membership is less stable than it looks.</span> Cluster
  numbering is arbitrary between runs, which everybody knows. The part that
  matters is that points near a boundary change cluster under a different seed
  or a different bootstrap sample, and a report that ranks customers by cluster
  is treating those assignments as facts. If a decision hangs on a label, the
  quantity to measure is how often that label survives resampling — not the
  silhouette, which says nothing about it.
</p>

<p class="body-text">
  <span class="bold">There is no ground truth it is failing to find.</span>
  Kleinberg's impossibility result says no clustering function can be at once
  scale-invariant, able to produce every partition, and consistent under
  shrinking clusters together. Some property has to go. So "the correct
  clustering" is not a target k-means is missing; it is not a well-posed thing
  to miss, and the useful question is always whether these groups are useful for
  the decision you are about to make.
</p>

<p class="body-text">
  <span class="bold">Say what you ran.</span> The initialiser, the number of
  restarts, the scaling, the seed, and k. "We ran k-means with k = 4" describes a
  draw from a distribution without saying how many draws you took — and since
  scikit-learn 1.4, the default is one.
</p>

<h1 class="body-header">A note on the numbers here</h1>

<p class="body-text">
  Every figure on this page is computed in your browser when it loads, from a
  seeded generator, so the numbers in the sentences and the pixels in the charts
  come from the same objects. The {MAIN.length} points are three Gaussian blobs;
  the best solution found for {@html katexify("k = 3")} scores
  {int(BEST.inertia)} and was reached by {FORGY.good} of {FORGY.trials} random
  starts and {PLUSPLUS.good} of {PLUSPLUS.trials} k-means++ starts.
  A companion script re-derives all of it outside the browser and fails loudly
  if any claim in the prose stops matching the code — including the monotonicity
  of every trace, and the fact that the generated grouping scores worse than the
  clustering in all four shapes.
</p>

<p class="body-text">
  It is worth ending on where this came from. Lloyd was not looking for clusters.
  He was working out how to place quantisation levels for a telephone signal, in
  a 1957 memo that Bell Labs did not publish for twenty-five years, and the
  algorithm has not changed since. What kept it is not that it is good at finding
  groups — it is often bad at that, in ways that are entirely predictable from
  three lines of algebra about a perpendicular bisector. What kept it is that
  both of its steps are a single pass over the data, and at a billion points that
  is still the only property anybody is buying.
</p>
