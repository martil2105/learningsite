<script>
  import katexify from "../katexify";
  import { MAIN, UNIFORM } from "../datasets.js";
  import { FORGY, PLUSPLUS, BEST, N_INIT_10, NOISE_BEST_K, SHAPE, int, pct, oneIn } from "../experiments.js";
</script>

<h1 class="body-header">What k-means actually gives you</h1>

<p class="body-text">
  When k-means finishes, you get a partition of your points into k groups, along
  with a guarantee that no single point would rather be in a different group and
  no single centroid would rather be somewhere else. That's a real property, and
  it's worth having, but it's also the only thing you're guaranteed.
</p>

<p class="body-text">
  The result isn't necessarily a minimum of the objective, since we saw
  {pct(1 - FORGY.rate, 0)} of runs stop short of one. It isn't necessarily the
  structure in the data either, since we saw the objective actively prefer the
  wrong grouping in all four of the shapes above. And it isn't evidence that
  groups exist at all, because the same procedure returns a tidy set of
  {NOISE_BEST_K.k} clusters from {UNIFORM.length} points of uniform noise.
</p>

<h1 class="body-header">Things to keep in mind before you act on a cluster</h1>

<p class="body-text">
  <span class="bold">How you scale the features is part of the model.</span> The
  objective is a sum of <em>squared</em> distances, so multiplying a feature by
  ten multiplies its influence on the answer by a hundred. Standardising every
  column is the usual reflex, but it isn't neutral: it assumes that a standard
  deviation of income and a standard deviation of age should count the same.
  Since there's no scaling-free version of k-means to fall back on, whatever
  scaling you choose is a modelling assumption, and it belongs in the write-up.
</p>

<p class="body-text">
  <span class="bold">It can't say no.</span> If you ask for six clusters in data
  that has none, you'll get six, complete with centroids, sizes and a silhouette
  score. Nothing in the output distinguishes a genuine group from an arbitrary
  slice of a continuum. Of the methods in this article, only the gap statistic
  can answer "there is only one cluster", because it's the only one that compares
  against a reference distribution.
</p>

<p class="body-text">
  <span class="bold">The mean isn't robust, and squaring makes it worse.</span>
  A single stray point pulls its centroid towards it, with a weight proportional
  to its distance. On real data, that usually means a handful of outliers quietly
  claim a cluster of their own, which is occasionally what you want but usually
  isn't. k-medians and k-medoids were designed for this situation, although they
  cost more to run.
</p>

<p class="body-text">
  <span class="bold">Distances become less informative in high dimensions.</span>
  As the number of features grows while the sample size stays fixed, the
  distances to the nearest and farthest points converge, so "assign to the
  nearest centroid" ends up deciding on thinner and thinner margins. The standard
  remedy is to reduce the dimension first, but that's a second modelling choice
  stacked on top of the first: running PCA and then k-means finds clusters in the
  projection, not in your data.
</p>

<p class="body-text">
  <span class="bold">Cluster membership is less stable than it looks.</span>
  Most people know that cluster numbers are arbitrary from one run to the next.
  What matters more is that points near a boundary can change cluster under a
  different seed or a different bootstrap sample, yet a report that ranks
  customers by cluster treats those assignments as facts. If a decision depends
  on a label, measure how often that label survives resampling. The silhouette
  won't help here, because it says nothing about stability.
</p>

<p class="body-text">
  <span class="bold">There's no ground truth for it to miss.</span> Kleinberg's
  impossibility theorem says that no clustering function can be scale-invariant,
  able to produce every possible partition, and consistent (i.e. unchanged when
  clusters are made tighter and pushed further apart) all at once, so at least
  one of those properties has to go. This means "the correct clustering" isn't a
  target that k-means keeps missing, because it isn't well defined in the first
  place. The useful question is always whether these groups help with the
  decision you're about to make.
</p>

<p class="body-text">
  <span class="bold">Report exactly what you ran.</span> That means the
  initialiser, the number of restarts, the scaling, the seed, and k. Saying "we
  ran k-means with k = 4" describes a draw from a distribution without saying how
  many draws you took, and since scikit-learn 1.4, the default is just one.
</p>

<h1 class="body-header">A note on the numbers</h1>

<p class="body-text">
  Every figure on this page is computed in your browser when the page loads,
  using a seeded random generator, so the numbers in the text and the pixels in
  the charts come from the same objects. The {MAIN.length} points are drawn from
  three Gaussian blobs, and the best solution found for
  {@html katexify("k = 3")} scores {int(BEST.inertia)}. It was reached by
  {FORGY.good} of {FORGY.trials} random starts and {PLUSPLUS.good} of
  {PLUSPLUS.trials} k-means++ starts. A companion script re-derives all of this
  outside the browser and fails loudly if any claim in the text stops matching
  the code. That includes the check that no trace ever goes up, and the fact
  that the generated grouping scores worse than the clustering in all four
  shapes.
</p>

<p class="body-text">
  Let's end where the algorithm began. Lloyd wasn't looking for clusters at all.
  He was working out where to place quantisation levels for a telephone signal,
  in a 1957 memo that Bell Labs didn't publish for twenty-five years, and the
  algorithm hasn't changed since. It hasn't survived because it's good at
  finding groups. As we've seen, it's often bad at that, in ways that are
  entirely predictable from a few lines of algebra about a perpendicular
  bisector. It has survived because both of its steps are a single pass over the
  data, and when you have a billion points, that's still the property that
  matters most.
</p>

<p class="body-text">
  Thanks for reading!
</p>
