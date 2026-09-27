<script>
  import katexify from "../katexify";
  import { MAIN, MAIN_K } from "../datasets.js";
  import { PRESET_RUNS, BEST, int } from "../experiments.js";

  const corner = PRESET_RUNS.corner;
</script>

<h1 class="body-header">Writing down the objective</h1>

<p class="body-text">
  Everything we just saw revolves around a single quantity. To write it down,
  let {@html katexify("r_{ij} = 1")} when point {@html katexify("i")} belongs to
  cluster {@html katexify("j")} and {@html katexify("0")} otherwise (so each point
  sits in exactly one cluster), and let {@html katexify("\\mu_j")} be the
  centroid of that cluster. The quantity is then:
</p>

<div class="math-display">
  {@html katexify(
    "J(r, \\mu) \\;=\\; \\sum_{i=1}^{n} \\sum_{j=1}^{k} r_{ij} \\, \\lVert x_i - \\mu_j \\rVert^2",
    true
  )}
</div>

<p class="body-text">
  In words, this is the sum of squared distances from every point to the
  centroid of its own cluster. It's called the <span class="bold">inertia</span>,
  or the within-cluster sum of squares, and it's the number shown under the chart
  above. Notice that it takes <em>two</em> arguments: the assignment and the
  centroids. As we'll see, almost everything worth knowing about k-means follows
  from that one fact.
</p>

<p class="body-text">
  With two arguments, there are two different ways to minimise
  {@html katexify("J")}, and both of them turn out to be easy. First, let's hold
  the centroids fixed and ask which assignment is best. A point's assignment only
  affects its own term, {@html katexify("\\lVert x_i - \\mu_j \\rVert^2")}, so
  every point can simply pick its nearest centroid, independently of all the
  others. That takes no search and no iteration, and it gives us the exact
  minimiser in a single pass:
</p>

<div class="math-display">
  {@html katexify(
    "r_{ij} = 1 \\quad \\text{iff} \\quad j = \\arg\\min_{l} \\; \\lVert x_i - \\mu_l \\rVert^2",
    true
  )}
</div>

<p class="body-text">
  Next, let's hold the assignment fixed and ask which centroids are best. Now
  {@html katexify("J")} splits into {@html katexify("k")} independent problems,
  one per cluster, and each of them is smooth, so we can differentiate and set
  the result to zero:
</p>

<div class="math-display">
  {@html katexify(
    "\\frac{\\partial J}{\\partial \\mu_j} = -2 \\sum_{i} r_{ij} (x_i - \\mu_j) = 0 \\;\\Longrightarrow\\; \\mu_j = \\frac{\\sum_i r_{ij} x_i}{\\sum_i r_{ij}}",
    true
  )}
</div>

<p class="body-text">
  In other words, the best centroid is simply the mean of its cluster, and just
  like the assignment, we can compute it exactly in a single pass. This means the
  algorithm you played with above isn't a heuristic bolted onto a hard problem.
  It's <span class="bold">two exact minimisations of the same function</span>,
  taken in turn, where each step is optimal for the argument it controls and
  leaves the other one alone. This pattern is known as block coordinate descent.
</p>

<div class="callout">
  <h4>Why the mean, and not something else?</h4>
  <p>
    This derivation only works for one particular distance. The mean falls out
    of the derivative <em>because</em> the distance is squared and Euclidean. If
    we used absolute distance instead, the same argument would give us the
    coordinate-wise median, which leads to a different algorithm called
    k-medians. With an arbitrary dissimilarity, the update step may have no
    closed form at all, which is why k-medoids gives up and requires every centre
    to be one of the data points. So if you ask for "k-means with cosine
    distance", you also need to say what happens to this step.
  </p>
</div>

<h1 class="body-header">Why it always stops</h1>

<p class="body-text">
  Neither half-step can ever increase {@html katexify("J")}. Each one returns the
  minimum over the variables it controls, and the current value is always one of
  the options it considered, so the result can't be worse than where it started.
  As a result, the sequence of values never increases. You can see this in the
  trace under the chart, where the line only ever goes down unless you drag a
  centroid yourself.
</p>

<p class="body-text">
  On its own, that doesn't prove the algorithm stops, since a sequence can keep
  decreasing forever. To finish the argument, we need to count. After an update
  step, {@html katexify("J")} is completely determined by the assignment, because
  the centroids are just that assignment's means. There are at most
  {@html katexify("k^n")} possible assignments, and whenever the assignment step
  actually changes a label, {@html katexify("J")} strictly falls, which means no
  assignment can ever come back. Since there are only finitely many assignments
  and none of them can repeat, the algorithm has to stop.
</p>

<p class="body-text">
  In practice, it stops quickly. If we start the {MAIN.length} points from three
  centroids stacked in the bottom-left corner, which is about as bad a start as
  you can draw, it takes {corner.iterations} rounds to go from an inertia of
  {int(corner.startInertia)} to {int(BEST.inertia)}. The worst case is far
  slower, since there are datasets in the plane that force exponentially many
  iterations. Fortunately, you're very unlikely to run into one.
</p>

<h1 class="body-header">Four things called k-means</h1>

<p class="body-text">
  The name "k-means" gets used for at least four different things, and mixing
  them up is behind most arguments about the algorithm. Let's separate them.
</p>

<div class="terms">
  <div class="term">
    <h4>The problem</h4>
    <p>
      Minimise {@html katexify("J")} over all assignments and centroids. This is
      what we actually want, but it's NP-hard, even for points in the plane.
    </p>
  </div>
  <div class="term">
    <h4>Lloyd's algorithm</h4>
    <p>
      The alternating procedure above. It's cheap and always terminates, but it
      returns a <em>fixed point</em> rather than a minimum. When someone says they
      ran "k-means", this is nearly always what they mean.
    </p>
  </div>
  <div class="term">
    <h4>The initialisation</h4>
    <p>
      Where the centroids start. It isn't part of Lloyd's algorithm and it's rarely
      mentioned, but as we'll see in the next section, it often decides the
      answer you get.
    </p>
  </div>
  <div class="term">
    <h4>The value of k</h4>
    <p>
      An input that you choose. The algorithm will return exactly
      {@html katexify("k")} clusters for any {@html katexify("k")} you give it, on
      any data, including data with no clusters in it at all.
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
