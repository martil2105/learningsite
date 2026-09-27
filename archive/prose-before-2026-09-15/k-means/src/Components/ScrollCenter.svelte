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
      "<p>Two tight groups of " + V.trueSizes[0] + " and a broad one of " + V.trueSizes[2] +
      ". The two tight ones come out perfectly. The broad one does not come out at all — its points " +
      "are split <span class='bold'>" + V.confusion[2].join(" / ") + "</span> across all three clusters, " +
      "which is to say it was never a cluster as far as the algorithm is concerned.</p>" +
      "<p>There is no parameter here for how wide a cluster is. A centroid owns a region of space, and " +
      "every region is charged for distance at the same rate, so a large loose group and a small tight " +
      "one cannot be told apart by anything the objective can see.</p>",

    "<h1 class='step-title'>The groups are long and thin</h1>" +
      "<p>Three parallel diagonal bands, sheared from the same round blobs. The clustering cuts straight " +
      "across them: only " + pct(A.purity) + " of points end up in a cluster that matches their band.</p>" +
      "<p>And here is the thing to sit with. A long band has enormous squared distance to its own centre — " +
      "the correct grouping scores <span class='bold'>" + int(A.trueInertia) + "</span>, while the " +
      "crosswise slicing scores <span class='bold'>" + int(A.fit.inertia) + "</span>. The wrong answer is " +
      "not a local minimum the algorithm got stuck in. It is genuinely better by the measure it was given.</p>",

    "<h1 class='step-title'>One group has far more points</h1>" +
      "<p>" + S.trueSizes[0] + " points on the left, " + S.trueSizes[1] + " and " + S.trueSizes[2] +
      " in the two small groups on the right. k-means cuts the big one in half — " +
      S.confusion[0][0] + " and " + S.confusion[0][1] + " points — and merges the two small ones into a " +
      "single cluster of " + S.sizes[2] + ".</p>" +
      "<p>Inertia is a sum over points, so a group with " + S.trueSizes[0] + " members contributes far " +
      "more of it than one with " + S.trueSizes[1] + ". Buying a reduction where the points are is simply " +
      "worth more, and the objective is not weighing anything else.</p>",

    "<h1 class='step-title'>The groups are not convex</h1>" +
      "<p>Two interleaving arcs, and the clustering is a vertical cut down the middle: " +
      M.confusion[0][1] + " of one arc's points on one side and " + M.confusion[0][0] + " on the other. " +
      "Every arc is split roughly in half.</p>" +
      "<p>This one is not a matter of degree. A cluster in k-means is the set of points nearer to its " +
      "centroid than to any other, which is an intersection of half-planes — a convex polygon. Neither " +
      "arc is convex, so neither arc is a shape the algorithm is able to express, at any k, from any " +
      "start, with any amount of compute.</p>",
  ];
</script>

<h1 class="body-header">What k-means assumes</h1>

<p class="body-text">
  Restarts fix a search problem. They do nothing about the harder question,
  which is whether the thing being searched for is the thing you wanted. Below
  are four datasets where the groups are obvious to you and unavailable to the
  algorithm — each fitted with the k it was generated with, taking the best of
  sixty k-means++ starts, so that nothing here can be blamed on bad luck.
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

<h1 class="body-header">All four are the same sentence</h1>

<p class="body-text">
  They look like four separate weaknesses and they are one. Go back to the
  assignment step: a point joins cluster <em>i</em> rather than <em>j</em> when
  it is nearer to the first centroid, and for squared Euclidean distance that
  condition simplifies to a linear one. The boundary is the perpendicular
  bisector of the segment between the two centroids — a straight line, always,
  no matter what the data looks like. Which is why the shaded regions in every
  chart on this page have straight edges.
</p>

<p class="body-text">
  So the clusters k-means is <span class="bold">capable of returning</span> are
  exactly the cells of a Voronoi diagram: convex, straight-sided, and defined by
  one location apiece. There is nowhere in that description to record that a
  cluster is wide, or elongated, or heavily populated, because a centroid is a
  point and a point has no width, no orientation and no mass.
</p>

<p class="body-text">
  The same fact, said in the language of models: k-means is what you get from
  fitting a mixture of spherical Gaussians that all share one variance and one
  mixing weight, and then taking hard assignments instead of soft ones. Every
  panel above is one word in that sentence being false — shared variance, then
  spherical, then equal weight, then Gaussian at all. Reach for a Gaussian
  mixture and the first three become parameters you can fit. For the fourth you
  need a method that never compares a point to a centre in the first place, like
  spectral clustering or DBSCAN.
</p>

<p class="body-text">
  And notice what the numbers under each panel have been saying. In all four
  cases the grouping the data was generated from has a
  <span class="bold">higher</span> inertia than the one k-means returned — for
  the stretched bands, {(A.trueInertia / A.fit.inertia).toFixed(1)} times
  higher. The algorithm did not fail to solve its problem. It solved it, and the
  solution is not the structure. No initialisation, no restart count and no
  amount of compute touches that, because there is nothing broken to fix.
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
