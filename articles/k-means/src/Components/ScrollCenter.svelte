<script>
  /*
    "What k-means assumes."

    Four datasets, four ways of breaking the same assumption. Each panel shows
    the generated groups beside the clustering, because the interesting thing is
    always the DISAGREEMENT and a single picture cannot show one.

    Cluster colours are permuted to line up with the groups they best match
    (see colorMap in experiments.js) so that the differences the reader sees are
    real differences and not an artefact of arbitrary label order.

    The fit is the best of 60 k-means++ starts, so nothing here can be waved
    away as a bad initialisation - which matters, because the punchline is that
    the objective genuinely prefers these answers.
  */
  import Scrolly from "./Scrolly.svelte";
  import { extent } from "../datasets.js";
  import { voronoiCells, polygonPath } from "../voronoi.js";
  import { fitEqual } from "../plot.js";
  import { SHAPE_FITS, int, pct } from "../experiments.js";
  import { CLUSTER_COLORS, CLUSTER_WASH, MUTED, FAINT } from "../palette.js";

  const PANELS = SHAPE_FITS.map((s) => ({ ...s, ext: extent(s.points, 0.08) }));

  let value = 0;
  $: step = typeof value === "number" ? Math.min(PANELS.length - 1, Math.max(0, value)) : 0;
  $: panel = PANELS[step];

  let boxWidth = 320;
  /*
    A measured width can arrive as 0 - the binding fires before layout, and a
    sticky panel that is momentarily zero-width reports zero. Every scale built
    from it then has an inverted range, which shows up as a negative <rect>
    width in the console and, in the worst case, as a chart drawn backwards.
    Clamp once, here, and use the clamped value everywhere below.
  */
  $: BW = Math.max(260, boxWidth);
  $: narrow = BW < 560;
  /*
    Math.floor and a 14px budget for a 12px gap. Splitting the box exactly in
    half left the two panels needing 604px of a 603px row, so flex-wrap put the
    second one underneath - a whole panel silently missing, and every assertion
    still green because both svgs existed and neither overflowed its parent.
  */
  $: mw = narrow ? BW : Math.floor((BW - 14) / 2);
  $: mh = narrow ? Math.round(mw * 0.78) : 240;
  $: pl = fitEqual(panel.ext, mw, mh, { top: 6, right: 6, bottom: 6, left: 6 });
  $: r = narrow ? 2 : 2.4;
  $: cells = voronoiCells(panel.fit.centroids, panel.ext);
  // Cluster c borrows the colour of the group it overlaps most.
  $: clusterColor = (c) => CLUSTER_COLORS[panel.colorMap[c]];
  $: clusterWash = (c) => CLUSTER_WASH[panel.colorMap[c]];

  const V = PANELS.find((p) => p.key === "variance");
  const A = PANELS.find((p) => p.key === "aniso");
  const S = PANELS.find((p) => p.key === "sizes");
  const M = PANELS.find((p) => p.key === "moons");

  const steps = [
    "<h1 class='step-title'>One group is wider than the others</h1>" +
      "<p>This dataset has two tight groups of " + V.trueSizes[0] + " points each and a broad group of " +
      V.trueSizes[2] + ". The two tight groups come out perfectly, but the broad one doesn't come out " +
      "at all. Its points are split <span class='bold'>" + V.confusion[2].join(" / ") + "</span> " +
      "across all three clusters, so as far as the algorithm is concerned, it was never a cluster in " +
      "the first place.</p>" +
      "<p>The problem is that k-means has no parameter for how wide a cluster is. Each centroid owns a " +
      "region of space, and every region is charged for distance at the same rate, so nothing the " +
      "objective can see distinguishes a large, loose group from a small, tight one.</p>",

    "<h1 class='step-title'>The groups are long and thin</h1>" +
      "<p>Next, we have three parallel diagonal bands, made by shearing the same round blobs. The " +
      "clustering cuts straight across them, and only " + pct(A.purity) + " of the points end up in a " +
      "cluster that matches their band.</p>" +
      "<p>Here's the part worth pausing on. A long band has a huge squared distance to its own centre, " +
      "so the correct grouping scores <span class='bold'>" + int(A.trueInertia) + "</span>, while the " +
      "crosswise slicing scores just <span class='bold'>" + int(A.fit.inertia) + "</span>. In other " +
      "words, the wrong answer isn't a local minimum that the algorithm got stuck in. It's actually " +
      "better according to the measure the algorithm was given.</p>",

    "<h1 class='step-title'>One group has far more points</h1>" +
      "<p>This time there are " + S.trueSizes[0] + " points in the group on the left, and " +
      S.trueSizes[1] + " and " + S.trueSizes[2] + " in the two small groups on the right. k-means " +
      "splits the big group in two (" + S.confusion[0][0] + " and " + S.confusion[0][1] + " points) " +
      "and merges the two small ones into a single cluster of " + S.sizes[2] + ".</p>" +
      "<p>Since inertia is a sum over points, a group with " + S.trueSizes[0] + " members contributes " +
      "far more to it than a group with " + S.trueSizes[1] + ". Reducing distances where most of the " +
      "points are is simply worth more, and the objective doesn't weigh anything else.</p>",

    "<h1 class='step-title'>The groups are not convex</h1>" +
      "<p>Finally, we have two interleaving arcs, and the clustering is just a vertical cut down the " +
      "middle, with " + M.confusion[0][1] + " of one arc's points on one side and " + M.confusion[0][0] +
      " on the other. Both arcs are split roughly in half.</p>" +
      "<p>Unlike the first three, this failure isn't a matter of degree. A cluster in k-means is the " +
      "set of points closer to its centroid than to any other centroid, which is an intersection of " +
      "half-planes, and therefore a convex polygon. Neither arc is convex, so the algorithm can't " +
      "represent either of them, at any k, from any start, with any amount of compute.</p>",
  ];
</script>

<h1 class="body-header">What k-means assumes</h1>

<p class="body-text">
  Restarts solve a search problem, but they do nothing about a harder question:
  is the thing we're searching for actually the thing we want? Below are four
  datasets where the groups are obvious to you but out of reach for the
  algorithm. Each one is fitted with the k it was generated with, keeping the
  best of sixty k-means++ starts, so none of the results can be blamed on bad
  luck.
</p>

<section class="side-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="measure" bind:clientWidth={boxWidth} />
      <div class="chart-header">
        <span class="chart-title">{panel.name}</span>
        <span class="chart-sub">n = {panel.points.length} · k = {panel.k}</span>
      </div>

      <div class="pair">
        <div class="mini">
          <span class="mini-label">how the data was made</span>
          <svg viewBox="0 0 {mw} {mh}" width={mw} height={mh}>
            <rect x={pl.box.x} y={pl.box.y} width={pl.box.w} height={pl.box.h} fill="#fbfcfd" stroke={FAINT} />
            {#each panel.points as d}
              <circle cx={pl.X(d.x)} cy={pl.Y(d.y)} {r} fill={CLUSTER_COLORS[d.group]} fill-opacity="0.8" />
            {/each}
          </svg>
        </div>

        <div class="mini">
          <span class="mini-label">what k-means found</span>
          <svg viewBox="0 0 {mw} {mh}" width={mw} height={mh}>
            <rect x={pl.box.x} y={pl.box.y} width={pl.box.w} height={pl.box.h} fill="#fbfcfd" stroke={FAINT} />
            {#each cells as poly, c}
              <path d={polygonPath(poly, pl)} fill={clusterWash(c)} stroke={clusterColor(c)} stroke-opacity="0.5" />
            {/each}
            {#each panel.points as d, i}
              <circle cx={pl.X(d.x)} cy={pl.Y(d.y)} {r} fill={clusterColor(panel.fit.labels[i])} fill-opacity="0.8" />
            {/each}
            {#each panel.fit.centroids as c, j}
              <path
                d="M {pl.X(c.x)} {pl.Y(c.y) - 7} L {pl.X(c.x) + 7} {pl.Y(c.y)} L {pl.X(c.x)} {pl.Y(c.y) + 7} L {pl.X(c.x) - 7} {pl.Y(c.y)} Z"
                fill={clusterColor(j)}
                stroke="#ffffff"
                stroke-width="2"
              />
            {/each}
          </svg>
        </div>
      </div>

      <div class="foot">
        <span class="chip">{pct(panel.purity)} of points in a matching cluster</span>
        <span class="chip alt">
          inertia {int(panel.fit.inertia)} · the generated grouping scores {int(panel.trueInertia)}
        </span>
      </div>
    </div>
  </div>

  <div class="steps-container">
    <Scrolly bind:value>
      {#each steps as text, i}
        <div class="step" class:active={step === i}>
          <div class="step-content">{@html text}</div>
        </div>
      {/each}
    </Scrolly>
  </div>
</section>

<h1 class="body-header">Four failures, one cause</h1>

<p class="body-text">
  These might look like four separate weaknesses, but they're really one. Let's
  go back to the assignment step. A point joins cluster <em>i</em> rather than
  cluster <em>j</em> when it's nearer to the first centroid, and for squared
  Euclidean distance, that condition simplifies to a linear one. The boundary
  between the two clusters is the perpendicular bisector of the segment joining
  their centroids, which is always a straight line, no matter what the data looks
  like. That's why the shaded regions in every chart on this page have straight
  edges.
</p>

<p class="body-text">
  This means the clusters k-means is
  <span class="bold">capable of returning</span> are exactly the cells of a
  Voronoi diagram: convex, straight-sided, and each defined by a single location.
  There's no room in that description to record that a cluster is wide,
  elongated or heavily populated, because a centroid is just a point, and a point
  has no width, no orientation and no mass.
</p>

<p class="body-text">
  We can say the same thing in the language of statistical models. k-means is
  what you get when you fit a mixture of spherical Gaussians that all share one
  variance and one mixing weight, and then take hard assignments instead of soft
  ones. Each panel above breaks one part of that description: first the shared
  variance, then the spherical shape, then the equal weights, and finally the
  assumption that the groups are Gaussian at all. If you switch to a Gaussian
  mixture model, the first three become parameters you can fit. For the fourth,
  you need a method that never compares a point to a centre in the first place,
  such as spectral clustering or DBSCAN.
</p>

<p class="body-text">
  Finally, notice what the numbers under each panel have been telling us. In all
  four cases, the grouping the data was generated from has a
  <span class="bold">higher</span> inertia than the one k-means returned (for
  the stretched bands, it's {(A.trueInertia / A.fit.inertia).toFixed(1)} times
  higher). So the algorithm didn't fail to solve its problem. It solved it, but
  the solution simply isn't the structure we were looking for. No
  initialisation, restart count or amount of compute can change that, because
  nothing is broken.
</p>

<style>
  .measure {
    width: 100%;
    height: 0;
  }

  svg {
    max-width: 100%;
    display: block;
  }

  .side-section {
    position: relative;
    margin-top: 2rem;
    display: flex;
    align-items: flex-start;
  }

  .steps-container {
    flex: 1 1 38%;
    z-index: 10;
  }

  .sticky-container {
    position: sticky;
    top: 8vh;
    flex: 1 1 62%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
  }

  .chart-box {
    width: 96%;
    max-width: 640px;
    background: #ffffff;
    border-radius: 10px;
    padding: 1.1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
  }

  .chart-title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--squidink);
  }

  .chart-sub {
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    color: #718096;
  }

  .pair {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .mini-label {
    display: block;
    font-family: var(--font-main);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #9aa5b1;
    margin-bottom: 0.2rem;
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }

  .chip {
    font-family: var(--font-main);
    font-size: 0.73rem;
    color: #4a5568;
    background: #f4f6f8;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 2px 9px;
  }

  .chip.alt {
    font-family: var(--font-mono, monospace);
    font-size: 0.7rem;
  }

  .step {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .step-content {
    background: rgba(255, 255, 255, 0.97);
    color: #4a5568;
    border-radius: 8px;
    padding: 1.1rem 1.3rem;
    max-width: 440px;
    width: 88%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    line-height: 1.55;
    transition: all 250ms ease;
  }

  .step.active .step-content {
    color: var(--squidink);
    border-left: 5px solid var(--violet);
    box-shadow: 0 8px 24px rgba(124, 90, 237, 0.15);
  }

  @media screen and (max-width: 950px) {
    .side-section {
      flex-direction: column-reverse;
    }

    .steps-container {
      pointer-events: none;
    }

    .sticky-container {
      top: 4vh;
      min-height: 0;
      height: 60vh;
    }

    .chart-box {
      width: 96%;
      padding: 0.75rem;
    }

    .step {
      height: 110vh;
    }

    .step-content {
      width: 92%;
      max-width: 640px;
      font-size: 0.95rem;
    }
  }
</style>
