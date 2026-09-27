<script>
  /*
    The limits section is where domain knowledge shows. "It fails in high
    dimensions" and "it needs scaling" are the answers everybody gives, so the
    first of those is measured here rather than repeated - and it turns out the
    usual statement is wrong in an interesting way.
  */
  import { PRE, HARD, DAY, HOOK, num, pct, int, M_DEFAULT } from "../experiments.js";

  const D = PRE.dims;
  const lo = D[0];
  const hi = D[D.length - 1];
  const hard = HARD.crossings.find((c) => c.m === M_DEFAULT);
</script>

<h1 class="body-header">What to take from it</h1>

<p class="body-text">
  DBSCAN's answer has one number in it. When your clusters really do share a
  density, that is the right shape of answer, and DBSCAN is an excellent thing
  to reach for: it is fast, it does not care what shape anything is, and it will
  tell you when a row belongs nowhere. When they do not share a density, no
  value of that number is right — not a hard-to-find one, not a compromise, none
  — because the branches of the tree it is slicing do not line up. HDBSCAN's
  contribution is not a cleverer way of choosing the number. It is an answer
  that is allowed to have several.
</p>

<p class="body-text">
  The practical version, and the one thing worth taking away if nothing else
  is: <span class="bold">build the tree before you tune anything</span>. You do
  not need labels to look at it. Condense the hierarchy at some sensible
  <span class="mono">min_cluster_size</span>, look at the branches you believe
  in, and check whether any horizontal line crosses all of them. If one does,
  DBSCAN will work and the tree has just told you which <span class="mono">eps</span>
  to use — for free, without a grid search, and without you having chosen an
  answer because you liked how it looked. If none does, you have learned the
  most useful thing about your data that any of this was going to tell you.
</p>

<h2 class="sub-header">Things a two-dimensional map hides</h2>

<p class="body-text">
  <span class="bold">The usual warning about dimension is the wrong warning.</span>
  Three well-separated Gaussian blobs, with every extra axis pure noise: the
  best achievable agreement stays at 1.000 all the way to eighty dimensions.
  Nothing fails. What collapses is the window.
</p>

<div class="tablewrap">
  <table class="dims">
    <thead>
      <tr>
        <th>dimensions</th>
        <th class="r">best agreement</th>
        <th class="r">width of the working range</th>
        <th class="r">nearest neighbour ÷ nearest other cluster</th>
      </tr>
    </thead>
    <tbody>
      {#each D as row}
        <tr>
          <td class="mono">{row.d}</td>
          <td class="r mono">{num(row.best, 3)}</td>
          <td class="r mono">{num(row.width, 1)}</td>
          <td class="r mono">{num(row.ratio, 3)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<p class="body-text">
  The last column is distance concentration happening in front of you: at two
  dimensions a point's nearest neighbour is {num(100 * lo.ratio, 1)}% as far
  away as the nearest point from another cluster, and at eighty it is
  {num(100 * hi.ratio, 0)}%. Everything is becoming equidistant, and the range
  of thresholds that separates the clusters narrows from {num(lo.width, 1)} to
  {num(hi.width, 1)}, a factor of {num(lo.width / hi.width, 1)}. So the
  algorithm does not stop working in high dimensions. It stops being tunable,
  which is worse, because it fails silently and looks like a parameter problem.
</p>

<p class="body-text">
  <span class="bold">The scaler is part of the algorithm.</span> Both of these
  are distance methods wearing a hat, so whatever you did to the columns before
  they arrived is part of the model. This article had the luxury of metres on
  both axes; almost nothing else does, and if
  <span class="mono">eps</span> is in units of a
  <span class="mono">StandardScaler</span> fitted on the training set, then
  refitting the scaler changes the clustering.
</p>

<p class="body-text">
  <span class="bold">Nothing here is a probability, and stability is not a
  p-value.</span> There is no null model anywhere in this. "We found seven
  clusters" is not evidence that seven things exist, and a large stability is
  not evidence that a branch is real — it is a statement about how much density
  sat above a level, on this sample, with no reference distribution to compare
  it against. HDBSCAN's per-point membership strengths are a monotone function
  of a distance and are not posteriors, whatever they look like on a colour
  scale. If you need to defend the number of clusters, you need a resampling
  argument on top: cluster many bootstrap draws and count how often a branch
  survives.
</p>

<p class="body-text">
  <span class="bold">Neither of them predicts.</span> Both label the rows you
  gave them and nothing else. <span class="mono">approximate_predict</span>
  does something sensible — it works out where a new point would have entered
  the existing tree — but it does not re-cluster, so a genuinely new cluster
  arriving is invisible until you refit. Anything running on a schedule needs a
  monitor for that, and the monitor is not "did the model error"; it is
  something like the share of new rows landing in noise, tracked over time.
</p>

<p class="body-text">
  <span class="bold">Two knobs, not one.</span>
  <span class="mono">min_samples</span> sets the core distance and therefore how
  aggressively thin structure is suppressed;
  <span class="mono">min_cluster_size</span> sets the smallest thing you are
  willing to call a cluster. They default to being equal in the usual
  implementation and they are answering different questions. Turn the first up
  if filaments are bridging things; turn the second up if you are getting
  clusters you would not act on.
</p>

<p class="body-text">
  <span class="bold">And the cost is not the thing that gets criticised.</span>
  Both are near-linear in low dimensions with a spatial index and quadratic
  without one; the implementations here are the naive quadratic ones, on a few
  hundred points, deliberately, so that everything on the page is re-derivable
  from a page of code. The complexity argument about DBSCAN has been had
  properly elsewhere, and the conclusion was that the index was on trial rather
  than the algorithm.
</p>

<p class="footnote">
  This article is a derived work of
  <a href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a>
  by Amazon's Machine Learning University, whose scaffold and design system it
  borrows under CC BY-SA 4.0. All prose, data, code and figures here are
  original. The location data is synthetic and is not a trace of any real
  person or device; every number on this page is reproducible from
  <span class="mono">scripts/precompute.mjs</span> and asserted in
  <span class="mono">verify/</span>. Three synthetic days in two dimensions are
  enough to show a mechanism and not enough to settle a question about anyone's
  data.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  .tablewrap { max-width: 600px; margin: 1.1rem auto; overflow-x: auto; }
  .dims { border-collapse: collapse; width: 100%; font-family: var(--font-main); font-size: 0.84rem; }
  .dims th {
    text-align: left; font-weight: 700; font-size: 0.71rem; color: #718096; line-height: 1.3;
    border-bottom: 1px solid #cbd5e0; padding: 0.3rem 0.5rem 0.3rem 0; vertical-align: bottom;
  }
  .dims td { padding: 0.25rem 0.5rem 0.25rem 0; color: var(--squid-ink); border-bottom: 1px solid #eef1f5; }
  .dims .r { text-align: right; padding-right: 0; }

  .footnote {
    max-width: 600px; margin: 2.5rem auto 1rem auto; font-family: var(--font-main);
    font-size: 0.82rem; line-height: 1.6; color: #718096;
    border-top: 1px solid #e2e8f0; padding-top: 1rem;
  }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .tablewrap { max-width: 80%; }
    .footnote { max-width: 80%; }
  }
</style>
