<script>
  import katexify from "../katexify";
  import { MAIN, MAIN_K } from "../datasets.js";
  import { PRESET_RUNS, BEST, int } from "../experiments.js";

  const corner = PRESET_RUNS.corner;
</script>

<h1 class="body-header">Writing it down</h1>

<p class="body-text">
  There is one quantity behind everything above. Write
  {@html katexify("r_{ij} = 1")} when point {@html katexify("i")} belongs to
  cluster {@html katexify("j")} and {@html katexify("0")} otherwise — each point
  in exactly one cluster — and let {@html katexify("\\mu_j")} be that cluster's
  centroid. Then:
</p>

<div class="math-display">
  {@html katexify(
    "J(r, \\mu) \\;=\\; \\sum_{i=1}^{n} \\sum_{j=1}^{k} r_{ij} \\, \\lVert x_i - \\mu_j \\rVert^2",
    true
  )}
</div>

<p class="body-text">
  The sum of squared distances from every point to the centroid of its own
  cluster. It goes by <span class="bold">inertia</span>, or
  within-cluster sum of squares, and it is the number under the chart. Notice
  that it takes <em>two</em> arguments. Almost everything worth knowing about
  k-means follows from that.
</p>

<p class="body-text">
  Because with two arguments you have two different minimisations available, and
  both of them are trivial. Hold the centroids fixed and ask which assignment is
  best: each point contributes {@html katexify("\\lVert x_i - \\mu_j \\rVert^2")}
  and nothing else does, so every point independently picks its nearest
  centroid. No search, no iteration — the exact minimiser, in one pass.
</p>

<div class="math-display">
  {@html katexify(
    "r_{ij} = 1 \\quad \\text{iff} \\quad j = \\arg\\min_{l} \\; \\lVert x_i - \\mu_l \\rVert^2",
    true
  )}
</div>

<p class="body-text">
  Now hold the assignment fixed and ask which centroids are best.
  {@html katexify("J")} splits into {@html katexify("k")} independent problems,
  one per cluster, and each is smooth. Differentiate and set to zero:
</p>

<div class="math-display">
  {@html katexify(
    "\\frac{\\partial J}{\\partial \\mu_j} = -2 \\sum_{i} r_{ij} (x_i - \\mu_j) = 0 \\;\\Longrightarrow\\; \\mu_j = \\frac{\\sum_i r_{ij} x_i}{\\sum_i r_{ij}}",
    true
  )}
</div>

<p class="body-text">
  The mean of the cluster. Also exact, also one pass. So the algorithm you
  dragged around above is not a heuristic bolted onto a hard problem — it is
  <span class="bold">two exact minimisations of the same function</span>, taken
  in turn, each one optimal in the argument it is allowed to touch and blind to
  the other. The technical name for that shape is block coordinate descent.
</p>

<div class="callout">
  <h4>The mean is not a stylistic choice</h4>
  <p>
    Nothing above works for a different distance. The mean falls out of that
    derivative <em>because</em> the distance is squared and Euclidean. Swap in
    absolute distance and the same argument produces the coordinate-wise median,
    which is a different algorithm — k-medians. Swap in an arbitrary
    dissimilarity and the update step may have no closed form at all, which is
    why k-medoids gives up and restricts every centre to being one of the data
    points. "k-means with cosine distance" is not a thing you can ask for
    without saying what happened to this step.
  </p>
</div>

<h1 class="body-header">Why it always stops</h1>

<p class="body-text">
  Neither half-step can ever increase {@html katexify("J")}, because each one
  returns the minimum over what it controls and the current value is always one
  of the candidates it minimised over. So the sequence of values is
  non-increasing, which you can watch happening in the trace under the chart —
  the line only ever goes down.
</p>

<p class="body-text">
  That alone does not prove it terminates; a sequence can decrease forever. The
  argument that finishes it is a counting one. After an update step,
  {@html katexify("J")} is completely determined by the assignment, since the
  centroids are that assignment's means. There are at most
  {@html katexify("k^n")} assignments. And whenever the assignment step actually
  changes a label, {@html katexify("J")} strictly falls — so no assignment can
  ever come back. Finitely many assignments, none repeated: it has to stop.
</p>

<p class="body-text">
  In practice it stops fast. Starting the {MAIN.length} points from three
  centroids stacked in the bottom-left corner — about as bad as you can draw —
  takes {corner.iterations} rounds to go from an inertia of
  {int(corner.startInertia)} to {int(BEST.inertia)}. The
  worst case is spectacularly worse than that: there are datasets in the plane
  that force exponentially many iterations. You will not meet one.
</p>

<h1 class="body-header">Four things called k-means</h1>

<p class="body-text">
  The word gets used for at least four different objects, and the confusion
  between them is where most arguments about k-means actually live.
</p>

<div class="terms">
  <div class="term">
    <h4>The problem</h4>
    <p>
      Minimise {@html katexify("J")} over all assignments and centroids. This is
      the thing you want. It is NP-hard, including for points in the plane.
    </p>
  </div>
  <div class="term">
    <h4>Lloyd's algorithm</h4>
    <p>
      The alternation above. Cheap, always terminates, and returns a
      <em>fixed point</em> — not a minimum. When somebody says "k-means", this
      is nearly always what they ran.
    </p>
  </div>
  <div class="term">
    <h4>The initialisation</h4>
    <p>
      Where the centroids start. Not part of Lloyd's algorithm, not usually
      mentioned, and — as the next section is about — frequently the thing that
      decided your answer.
    </p>
  </div>
  <div class="term">
    <h4>The value of k</h4>
    <p>
      An input. The algorithm will return exactly {@html katexify("k")} clusters
      for any {@html katexify("k")} you name, on any data, including data with
      no clusters in it.
    </p>
  </div>
</div>

<style>
  .math-display {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 620px;
    margin: 1.2rem auto;
    padding: 0.4rem 0.6rem;
    text-align: center;
  }

  .callout {
    max-width: 600px;
    margin: 1.5rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 5px solid var(--violet);
    border-radius: 8px;
    padding: 0.9rem 1.1rem;
  }

  .callout h4 {
    margin: 0 0 0.4rem 0;
    font-family: var(--font-heavy);
    font-size: 1rem;
    color: var(--squidink);
  }

  .callout p {
    margin: 0;
    font-family: var(--font-main);
    font-size: 0.92rem;
    line-height: 1.55;
    color: #4a5568;
  }

  .terms {
    max-width: 640px;
    margin: 1.5rem auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
    padding: 0 0.5rem;
  }

  .term {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.85rem 0.95rem;
  }

  .term h4 {
    margin: 0 0 0.4rem 0;
    font-family: var(--font-main);
    font-size: 0.95rem;
    color: var(--squidink);
  }

  .term p {
    margin: 0;
    font-family: var(--font-main);
    font-size: 0.83rem;
    line-height: 1.5;
    color: #4a5568;
  }

  @media screen and (max-width: 950px) {
    .math-display {
      max-width: 92%;
    }

    .terms {
      grid-template-columns: 1fr;
      max-width: 92%;
    }

    .callout {
      max-width: 85%;
    }
  }
</style>
