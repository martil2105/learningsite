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

<h1 class="body-header">What to take away</h1>

<p class="body-text">
  DBSCAN's answer has one number in it. When your clusters really do share a
  density, that's the right shape of answer, and DBSCAN is an excellent tool to
  reach for. It's fast, it doesn't care what shape anything is, and it tells you
  when a row belongs nowhere. But when the clusters don't share a density, no
  value of that number is right (not a hard-to-find one, and not a compromise
  either), because the branches of the tree it's slicing don't line up.
  HDBSCAN's contribution isn't a cleverer way of choosing that number. It's an
  answer that's allowed to contain several.
</p>

<p class="body-text">
  If you take away just one practical lesson, make it this:
  <span class="bold">build the tree before you tune anything</span>. You don't
  need labels to look at it. Condense the hierarchy at a sensible
  <span class="mono">min_cluster_size</span>, look at the branches you believe
  in, and check whether any horizontal line crosses all of them. If one does,
  DBSCAN will work, and the tree has just told you which
  <span class="mono">eps</span> to use, for free, without a grid search, and
  without you choosing an answer because you liked how it looked. If none does,
  you've learned the most useful thing about your data that any of this could
  have told you.
</p>

<h2 class="sub-header">Things a two-dimensional map hides</h2>

<p class="body-text">
  <span class="bold">The usual warning about dimension is the wrong warning.</span>
  Take three well-separated Gaussian blobs and make every extra axis pure
  noise. The best achievable agreement stays at 1.000 all the way up to eighty
  dimensions, so nothing fails. What collapses is the window.
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
  The last column shows distance concentration happening in front of you. At
  two dimensions, a point's nearest neighbour is {num(100 * lo.ratio, 1)}% as far
  away as the nearest point from another cluster, and at eighty dimensions, it's
  {num(100 * hi.ratio, 0)}%. Everything is becoming equidistant, and the range
  of thresholds that separates the clusters narrows from {num(lo.width, 1)} to
  {num(hi.width, 1)}, a factor of {num(lo.width / hi.width, 1)}. So the
  algorithm doesn't stop working in high dimensions. Instead, it stops being
  tunable, which is worse, because it fails silently and looks like a parameter
  problem.
</p>

<p class="body-text">
  <span class="bold">The scaler is part of the algorithm.</span> Both of these
  are distance methods at heart, so whatever you did to the columns before they
  arrived is part of the model. This article had the luxury of metres on both
  axes, but almost nothing else does, and if <span class="mono">eps</span> is in
  the units of a
  <span class="mono">StandardScaler</span> fitted on the training set, then
  refitting the scaler changes the clustering.
</p>

<p class="body-text">
  <span class="bold">Nothing here is a probability, and stability isn't a
  p-value.</span> There's no null model anywhere in this. "We found seven
  clusters" isn't evidence that seven things exist, and a large stability isn't
  evidence that a branch is real. It's a statement about how much density sat
  above a level in this sample, with no reference distribution to compare it
  against. HDBSCAN's per-point membership strengths are a monotone function of a
  distance, not posterior probabilities, whatever they look like on a colour
  scale. If you need to defend the number of clusters, you need a resampling
  argument on top, such as clustering many bootstrap draws and counting how
  often each branch survives.
</p>

<p class="body-text">
  <span class="bold">Neither of them predicts.</span> Both label the rows you
  gave them and nothing else. The <span class="mono">approximate_predict</span>
  function does something sensible, working out where a new point would have
  entered the existing tree, but it doesn't re-cluster, so a brand-new cluster
  stays invisible until you refit. Anything running on a schedule needs a
  monitor for that, and the monitor shouldn't be "did the model throw an
  error?". It should be something like the share of new rows landing in noise,
  tracked over time.
</p>

<p class="body-text">
  <span class="bold">There are two knobs, not one.</span>
  <span class="mono">min_samples</span> sets the core distance, and therefore
  how aggressively thin structure is suppressed, while
  <span class="mono">min_cluster_size</span> sets the smallest thing you're
  willing to call a cluster. They're equal by default in the usual
  implementation, but they answer different questions. Turn the first one up if
  filaments are bridging things, and turn the second one up if you're getting
  clusters you wouldn't act on.
</p>

<p class="body-text">
  <span class="bold">Cost isn't the real problem.</span> Both methods are
  near-linear in low dimensions with a spatial index, and quadratic without one.
  The implementations here are deliberately the naive quadratic ones, running on
  a few hundred points, so that everything on the page can be re-derived from a
  page of code. The debate about DBSCAN's complexity has been settled properly
  elsewhere, and the conclusion was that the index, not the algorithm, was what
  was really on trial.
</p>

<p class="body-text">
  Thanks for reading!
</p>

<p class="footnote">
  This article is a derived work of
  <a href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a>
  by Amazon's Machine Learning University, and it borrows their scaffold and
  design system under CC BY-SA 4.0. All prose, data, code and figures here are
  original. The location data is synthetic and isn't a trace of any real person
  or device, and every number on this page can be reproduced from
  <span class="mono">scripts/precompute.mjs</span> and is asserted in
  <span class="mono">verify/</span>. Three synthetic days in two dimensions are
  enough to show a mechanism, but not enough to settle a question about anyone's
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
