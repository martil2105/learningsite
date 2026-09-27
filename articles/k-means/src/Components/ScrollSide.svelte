<script>
  /*
    "Where you start decides where you end."

    Side-by-side rather than the starter's centre-scroll: a text card floating
    over the chart covers the thing it is describing, which was the single
    biggest readability problem in the previous two articles. On mobile the flex
    direction reverses so the chart sits above its own caption.

    Panels 0 and 1 are the same scatter showing two different converged runs, so
    the reader compares them in time rather than across the page. Panels 2 and 3
    are the same histogram, first with one initialiser and then with both.

    Every figure in the step text is read out of experiments.js.
  */
  import Scrolly from "./Scrolly.svelte";
  import { scaleLinear } from "d3-scale";
  import { MAIN, MAIN_K, extent } from "../datasets.js";
  import { voronoiCells, polygonPath } from "../voronoi.js";
  import { fitEqual } from "../plot.js";
  import { PRESET_RUNS, FORGY, PLUSPLUS, BEST, N_INIT_10, int, pct, oneIn } from "../experiments.js";
  import { CLUSTER_COLORS, CLUSTER_WASH, MUTED, FAINT, ACCENT } from "../palette.js";

  const EXT = extent(MAIN, 0.08);
  const GOOD = PRESET_RUNS.spread;
  const TRAP = PRESET_RUNS.trap;

  let value = 0;
  $: step = typeof value === "number" ? Math.min(3, Math.max(0, value)) : 0;
  $: showing = step === 1 ? TRAP : GOOD;
  $: isScatter = step <= 1;

  // ------------------------------------------------------------- layout
  let chartWidth = 320;
  /*
    A measured width can arrive as 0 - the binding fires before layout, and a
    sticky panel that is momentarily zero-width reports zero. Every scale built
    from it then has an inverted range, which shows up as a negative <rect>
    width in the console and, in the worst case, as a chart drawn backwards.
    Clamp once, here, and use the clamped value everywhere below.
  */
  $: CW = Math.max(260, chartWidth);
  $: narrow = CW < 520;
  $: H = narrow ? 300 : 360;
  $: sMargin = { top: 10, right: 10, bottom: 10, left: 10 };
  $: p = fitEqual(EXT, CW, H, sMargin);
  $: r = narrow ? 2.4 : 3;
  $: cells = voronoiCells(showing.centroids, EXT);

  // ------------------------------------------------------- the histogram
  const BIN = 1000;
  const allRuns = [...FORGY.buckets, ...PLUSPLUS.buckets];
  const lo = Math.floor(Math.min(...allRuns.map((b) => b.inertia)) / BIN) * BIN;
  const hi = Math.ceil(Math.max(...allRuns.map((b) => b.inertia)) / BIN) * BIN;
  const NBINS = Math.round((hi - lo) / BIN);

  const histogram = (buckets) => {
    const bins = new Array(NBINS).fill(0);
    for (const b of buckets) bins[Math.min(NBINS - 1, Math.floor((b.inertia - lo) / BIN))] += b.count;
    return bins;
  };
  const H_FORGY = histogram(FORGY.buckets);
  const H_PP = histogram(PLUSPLUS.buckets);
  const yMax = Math.max(...H_FORGY, ...H_PP);

  $: hMargin = { top: 26, right: narrow ? 12 : 18, bottom: 44, left: narrow ? 34 : 44 };
  $: hPlotW = Math.max(140, CW - hMargin.left - hMargin.right);
  $: hPlotH = H - hMargin.top - hMargin.bottom;
  $: xBin = scaleLinear().domain([lo, hi]).range([hMargin.left, hMargin.left + hPlotW]);
  // 8% headroom: at an exact [0, yMax] domain the tallest bar touches the legend.
  $: yCount = scaleLinear().domain([0, yMax * 1.08]).range([hMargin.top + hPlotH, hMargin.top]);
  // Reactive, not const: these close over xBin/yCount, and a plain const would
  // freeze the bars at the width measured on first render while any attribute
  // that mentions a reactive variable directly kept updating around them.
  $: binW = hPlotW / NBINS;
  $: barW = step >= 3 ? Math.max(2, binW / 2 - 0.6) : Math.max(3, binW - 1.5);
  $: barX = (i, series) => hMargin.left + binW * i + (step >= 3 ? (series === 0 ? 0.4 : binW / 2 + 0.2) : 0.75);

  const badForgy = FORGY.trials - FORGY.good;
  const worstExcess = FORGY.worstExcess;

  $: steps = [
    "<h1 class='step-title'>A good start, and a good answer</h1>" +
      "<p>Let's begin with three centroids spread across the picture, roughly one per group. After " +
      GOOD.iterations + " rounds, nothing moves anymore: every point is already assigned to its " +
      "nearest centroid, and every centroid is already the mean of its points. The inertia is " +
      "<span class='bold'>" + int(GOOD.inertia) + "</span>, and the clusters are the same three you " +
      "would have drawn yourself, with " + GOOD.sizes.slice(0, -1).join(", ") + " and " +
      GOOD.sizes[GOOD.sizes.length - 1] + " points.</p>" +
      "<p>This is the best answer found anywhere on this page for " + MAIN_K + " clusters, so we'll " +
      "treat it as the right one. Notice, though, that the algorithm itself never claimed it was.</p>",

    "<h1 class='step-title'>A different start, a different answer</h1>" +
      "<p>Now let's move the starting centroids. We won't put them anywhere absurd: two go in the " +
      "broad group on the left and one goes out to the right, which is the kind of start a random " +
      "draw often produces.</p>" +
      "<p>This time the algorithm converges in <span class='bold'>" + TRAP.iterations + " rounds</span>, " +
      "even faster than the run that got it right, and it stops at an inertia of " +
      "<span class='bold'>" + int(TRAP.inertia) + "</span>, which is " + pct(TRAP.excess, 0) +
      " worse. The broad group has been cut in half, and the two tight groups on the right have been " +
      "merged into one. Yet every stopping condition is satisfied: no point wants to switch clusters " +
      "and no centroid wants to move, even though the answer is clearly wrong.</p>",

    "<h1 class='step-title'>This isn't a rare accident</h1>" +
      "<p>To see how often this happens, let's run the algorithm from " + FORGY.trials +
      " independent random starts and count where each run ends up. Of those, <span class='bold'>" +
      FORGY.good + "</span> reach " + int(BEST.inertia) + ". The other <span class='bold'>" + badForgy +
      "</span> runs (" + pct(1 - FORGY.rate, 0) + " of them) stop somewhere between " + int(48000) +
      " and " + int(49100) + ", up to " + pct(worstExcess, 0) + " worse.</p>" +
      "<p>Notice the gap in the middle of the histogram. These aren't near misses that shade into one " +
      "another. Instead, they're " + FORGY.buckets.length + " distinct fixed points, and every one of " +
      "the bad ones is the same structural mistake made in slightly different places. So a single run " +
      "of k-means gives you one sample from this distribution, and it doesn't tell you which kind of " +
      "sample you got.</p>",

    "<h1 class='step-title'>Two fixes, but only one of them works</h1>" +
      "<p>The first fix is <span class='bold'>k-means++</span>. It picks the first centre at random " +
      "and each later one with probability proportional to its squared distance from the nearest " +
      "centre already chosen, so the next centre will probably land in territory that nobody has " +
      "claimed yet. It's a good idea, and it comes with a proof. Here it raises the success rate from " +
      pct(FORGY.rate, 0) + " to " + pct(PLUSPLUS.rate, 0) + ", which is an improvement, but it isn't " +
      "a fix.</p>" +
      "<p>The fix that actually works is almost boring: <span class='bold'>run the algorithm several " +
      "times and keep the result with the lowest inertia</span>. The chance that ten independent " +
      "random starts all fail is only about " + oneIn(N_INIT_10.forgy) + ", and that's the whole " +
      "technique.</p>" +
      "<p>This is worth knowing, because it's no longer the default. Since version 1.4, scikit-learn's " +
      "<span class='mono'>n_init='auto'</span> means just <em>one</em> run when the initialiser is " +
      "k-means++. So out of the box, you're drawing a single sample from the k-means++ distribution " +
      "in the chart, not the best of ten.</p>",
  ];
</script>

<h1 class="body-header">Where you start decides where you end</h1>

<p class="body-text">
  Everything in the last section was a guarantee: each half-step is exactly
  optimal, the objective never rises, and the algorithm always terminates.
  However, none of those guarantees say the answer will be any good. A fixed
  point is simply a place where neither step can improve things, and there is
  usually more than one of them. Scroll on to see what that means in practice.
</p>

<section class="side-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="measure" bind:clientWidth={chartWidth} />
      <div class="chart-header">
        <span class="chart-title">
          {isScatter ? "One run, converged" : "Where " + FORGY.trials + " runs ended up"}
        </span>
        <span class="chart-sub">
          {#if isScatter}
            inertia {int(showing.inertia)} · {showing.iterations} rounds
          {:else if step === 2}
            random starts
          {:else}
            random vs k-means++
          {/if}
        </span>
      </div>

      {#if isScatter}
        <svg viewBox="0 0 {CW} {H}" width={CW} height={H}>
          <rect x={p.box.x} y={p.box.y} width={p.box.w} height={p.box.h} fill="#fbfcfd" stroke={FAINT} />
          {#each cells as poly, j}
            <path d={polygonPath(poly, p)} fill={CLUSTER_WASH[j]} stroke={CLUSTER_COLORS[j]} stroke-opacity="0.45" />
          {/each}
          {#each MAIN as d, i}
            <circle cx={p.X(d.x)} cy={p.Y(d.y)} {r} fill={CLUSTER_COLORS[showing.labels[i]]} fill-opacity="0.85" />
          {/each}
          {#each showing.centroids as c, j}
            <path
              d="M {p.X(c.x)} {p.Y(c.y) - 9} L {p.X(c.x) + 9} {p.Y(c.y)} L {p.X(c.x)} {p.Y(c.y) + 9} L {p.X(c.x) - 9} {p.Y(c.y)} Z"
              fill={CLUSTER_COLORS[j]}
              stroke="#ffffff"
              stroke-width="2.2"
            />
          {/each}
        </svg>
      {:else}
        <svg viewBox="0 0 {CW} {H}" width={CW} height={H}>
          {#each yCount.ticks(4) as t}
            <line class="grid" x1={hMargin.left} x2={hMargin.left + hPlotW} y1={yCount(t)} y2={yCount(t)} />
            <text class="tick" x={hMargin.left - 7} y={yCount(t) + 4} text-anchor="end">{t}</text>
          {/each}

          {#each H_FORGY as c, i}
            {#if c > 0}
              <rect
                x={barX(i, 0)}
                y={yCount(c)}
                width={barW}
                height={yCount(0) - yCount(c)}
                fill={CLUSTER_COLORS[0]}
                opacity="0.9"
              />
            {/if}
          {/each}

          {#if step >= 3}
            {#each H_PP as c, i}
              {#if c > 0}
                <rect
                  x={barX(i, 1)}
                  y={yCount(c)}
                  width={barW}
                  height={yCount(0) - yCount(c)}
                  fill={CLUSTER_COLORS[2]}
                  opacity="0.9"
                />
              {/if}
            {/each}
          {/if}

          <!-- The two outcomes, named on the chart. The axis ticks start at 30k,
               so without these the left-hand bars have no number attached to them. -->
          <text class="anno" x={xBin(BEST.inertia) + binW * 1.6} y={yCount(FORGY.good) + 12}>
            {int(BEST.inertia)} — the best found
          </text>
          <text class="anno muted" x={xBin(48700)} y={yCount(Math.max(...H_FORGY.slice(NBINS - 6))) - 10} text-anchor="middle">
            worse fixed points
          </text>

          <line class="axis" x1={hMargin.left} x2={hMargin.left + hPlotW} y1={yCount(0)} y2={yCount(0)} />
          {#each [30000, 40000, 50000] as t}
            <text class="tick" x={xBin(t)} y={H - hMargin.bottom + 18} text-anchor="middle">
              {t / 1000}k
            </text>
          {/each}
          <text class="axis-title" x={hMargin.left + hPlotW / 2} y={H - 8} text-anchor="middle">
            inertia at convergence
          </text>
          <text class="axis-title vert" x={-(hMargin.top + hPlotH / 2)} y={12} transform="rotate(-90)" text-anchor="middle">
            runs
          </text>

          <g class="hist-legend">
            <rect x={hMargin.left} y="6" width="9" height="9" fill={CLUSTER_COLORS[0]} />
            <text class="lg-text" x={hMargin.left + 13} y="14">random start</text>
            {#if step >= 3}
              <rect x={hMargin.left + 96} y="6" width="9" height="9" fill={CLUSTER_COLORS[2]} />
              <text class="lg-text" x={hMargin.left + 109} y="14">k-means++</text>
            {/if}
          </g>
        </svg>
      {/if}

      <div class="foot">
        {#if step === 0}
          <span class="foot-good">the best solution found on this page</span>
        {:else if step === 1}
          <span class="foot-bad">a fixed point {pct(TRAP.excess, 0)} worse, and it got there sooner</span>
        {:else if step === 2}
          <span class="foot-plain">{FORGY.good} of {FORGY.trials} runs found it, and the rest didn't.</span>
        {:else}
          <span class="foot-plain">
            {pct(FORGY.rate, 0)} → {pct(PLUSPLUS.rate, 0)} for one run; {oneIn(N_INIT_10.forgy)} for the best of ten.
          </span>
        {/if}
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
    max-width: 620px;
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
    margin-bottom: 0.3rem;
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

  .grid {
    stroke: #eef1f5;
  }

  .axis {
    stroke: #b6bfcc;
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    fill: #9aa5b1;
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    font-weight: 600;
    fill: var(--squidink);
  }

  .anno {
    font-family: var(--font-main);
    font-size: 10.5px;
    font-weight: 700;
    fill: var(--squidink);
  }

  .anno.muted {
    font-weight: 600;
    fill: #718096;
  }

  .lg-text {
    font-family: var(--font-main);
    font-size: 10.5px;
    fill: #718096;
  }

  .foot {
    min-height: 20px;
    margin-top: 0.35rem;
    font-family: var(--font-main);
    font-size: 0.76rem;
  }

  .foot-good {
    color: #2f7d32;
    font-weight: 700;
  }

  .foot-bad {
    color: #df2a5d;
    font-weight: 700;
  }

  .foot-plain {
    color: #718096;
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
      height: 56vh;
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
