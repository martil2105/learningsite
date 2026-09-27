<script>
  /*
    "What it actually buys."

    Two charts across four steps. The first is the candidate count as a function
    of node size, which is where the textbook explanation lives and where it
    stops being true - a node smaller than the bin count is a node where the
    histogram scans MORE candidates than the exact scan would.

    The second is the measured row work, and it is the point of the section: the
    histogram on its own touches as many rows as the pre-sorted scan does. Every
    row of that chart is a counter from src/binning.js, not an estimate.

    Side-by-side rather than the starter's centre-scroll, so the text card never
    covers the chart it is describing.
  */
  import Scrolly from "./Scrolly.svelte";
  import { scaleLog, scaleLinear } from "d3-scale";
  import {
    PRE, SPLIT_TRACE, N_SPLITS, SPLITS_BELOW_BINS, SUM_NODE_ROWS, SUM_SMALLER_ROWS,
    SUBTRACT_SAVING, GAIN_EVAL_RATIO, ROW_TOUCH_RATIO, NOSUB_VS_EXACT,
    EXACT_CURVE, CONFIG, int, compact, pct, times,
  } from "../experiments.js";
  import { N_TRAIN } from "../datasets.js";
  import { EXACT, HIST, THIRD, ACCENT, MUTED, FAINT, INK } from "../palette.js";

  const BINS = 255;
  let value = 0;
  $: step = typeof value === "number" ? Math.min(3, Math.max(0, value)) : 0;
  $: showCandidates = step <= 1;

  const NODE_SIZES = SPLIT_TRACE.map((s) => s.nodeSize);
  const ROOT = Math.max(...NODE_SIZES);

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
  $: H = narrow ? 300 : 340;
  $: margin = { top: 26, right: narrow ? 14 : 20, bottom: 52, left: narrow ? 44 : 58 };
  $: plotW = Math.max(140, CW - margin.left - margin.right);
  $: plotH = H - margin.top - margin.bottom;

  // candidate chart: both axes log, because both quantities span three decades
  $: xNode = scaleLog().domain([20, ROOT * 1.15]).range([margin.left, margin.left + plotW]);
  $: yCand = scaleLog().domain([1, ROOT * 1.15]).range([margin.top + plotH, margin.top]);
  // Reactive: these close over the scales, which change with the measured width.
  $: exactLine =
    "M " + xNode(20) + " " + yCand(19) + " L " + xNode(ROOT * 1.15) + " " + yCand(ROOT * 1.15 - 1);
  $: histLine =
    "M " + xNode(20) + " " + yCand(BINS - 1) + " L " + xNode(ROOT * 1.15) + " " + yCand(BINS - 1);

  // row-work chart: three measured configurations
  const BARS = [
    { key: "exact", label: "pre-sorted, exact", value: PRE.exact.rowTouches, color: EXACT },
    { key: "nosub", label: "histogram, no subtraction", value: PRE.histNoSubtract.rowTouches, color: MUTED },
    { key: "hist", label: "histogram + subtraction", value: PRE.hist.rowTouches, color: HIST },
  ];
  const BAR_MAX = Math.max(...BARS.map((b) => b.value));
  $: barsShown = step === 2 ? BARS.slice(0, 2) : BARS;
  $: xBar = scaleLinear().domain([0, BAR_MAX * 1.02]).range([margin.left, margin.left + plotW]);
  $: barH = Math.min(46, (plotH - 30) / 3 - 14);
  $: barY = (i) => margin.top + 14 + i * ((plotH - 20) / 3);

  $: steps = [
    "<h1 class='step-title'>At the root, it is not close</h1>" +
      "<p>The first node holds every row. Its " + int(EXACT_CURVE.length) + " candidate cuts become " +
      (BINS - 1) + " — and that number does not move if you hand it ten times the data, because it is a " +
      "property of the histogram and not of the rows.</p>" +
      "<p>This is the version of the story everybody tells, and at the top of the tree it is exactly right.</p>",

    "<h1 class='step-title'>Then the nodes get small</h1>" +
      "<p>A tree of " + CONFIG.numLeaves + " leaves makes " + N_SPLITS + " splits, and after the first few " +
      "they are made on nodes holding hundreds of rows, not thousands. The two lines cross at a node of " +
      BINS + " rows: below that, a histogram scan is looking at <em>more</em> candidates than the exact scan " +
      "would, because it walks all " + BINS + " bins whether or not there are rows in them.</p>" +
      "<p>Here that happens at <span class='bold'>" + SPLITS_BELOW_BINS + " of " + N_SPLITS + "</span> splits. " +
      "Across the whole model the saving is real but finite: <span class='bold'>" + times(GAIN_EVAL_RATIO) +
      " fewer</span> gain evaluations, not a thousandfold.</p>",

    "<h1 class='step-title'>Now the part that surprises people</h1>" +
      "<p>Building a histogram is a pass over the node's rows. So is the exact scan. Neither one can " +
      "score a split without having looked at every row underneath it, and no amount of bucketing " +
      "changes that.</p>" +
      "<p>Measured, with the subtraction trick switched off: the histogram touches " +
      compact(PRE.histNoSubtract.rowTouches) + " rows and the pre-sorted scan touches " +
      compact(PRE.exact.rowTouches) + ". That is <span class='bold'>" + times(NOSUB_VS_EXACT) +
      "</span> — the same. On its own, the histogram saves no passes over the data at all.</p>",

    "<h1 class='step-title'>The saving is the subtraction</h1>" +
      "<p>Build the smaller child, subtract for the other. Over one tree the nodes being split hold " +
      int(SUM_NODE_ROWS) + " rows between them, and their smaller children hold " + int(SUM_SMALLER_ROWS) +
      " — so the rows you have to visit fall to about a third.</p>" +
      "<p>Measured: <span class='bold'>" + pct(SUBTRACT_SAVING, 0) + "</span> of the histogram's row work " +
      "disappears, taking it from " + compact(PRE.histNoSubtract.rowTouches) + " to " +
      compact(PRE.hist.rowTouches) + " and finally below the exact scan — " + times(ROW_TOUCH_RATIO) +
      " fewer. That, and not the bucketing, is where the passes over your data go.</p>",
  ];
</script>

<h1 class="body-header">What it actually buys</h1>

<p class="body-text">
  Two costs matter and they are not the same cost. One is how many candidate
  splits get scored — arithmetic on four numbers, twice a division. The other is
  how many times a row's gradient has to be read out of memory. Binning does very
  different things to the two, and the second one is the reason LightGBM is fast.
</p>

<section class="side-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="measure" bind:clientWidth={chartWidth} />
      <div class="chart-header">
        <span class="chart-title">
          {showCandidates ? "Candidates scored at one node" : "Rows touched, whole model"}
        </span>
        <span class="chart-sub">
          {showCandidates ? "per feature · log scale" : int(CONFIG.numTrees) + " trees · measured"}
        </span>
      </div>

      {#if showCandidates}
        <svg viewBox="0 0 {CW} {H}" width={CW} height={H}>
          {#each [1, 10, 100, 1000] as t}
            <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={yCand(t)} y2={yCand(t)} />
            <text class="tick" x={margin.left - 7} y={yCand(t) + 3.5} text-anchor="end">{t}</text>
          {/each}

          <path class="ln" d={exactLine} stroke={EXACT} />
          <path class="ln" d={histLine} stroke={HIST} />

          <!-- the crossover -->
          <line class="cross" x1={xNode(BINS)} x2={xNode(BINS)} y1={margin.top} y2={margin.top + plotH} />
          <text class="cross-label" x={xNode(BINS) - 5} y={margin.top + 11} text-anchor="end">
            a node of {BINS} rows
          </text>

          <!-- where this model's splits actually happen -->
          {#each NODE_SIZES as n}
            <line
              class="rug"
              x1={xNode(n)}
              x2={xNode(n)}
              y1={margin.top + plotH}
              y2={margin.top + plotH + (n < BINS ? 12 : 8)}
              stroke={n < BINS ? EXACT : INK}
            />
          {/each}
          <text class="rug-label" x={margin.left} y={margin.top + plotH + 26}>
            the {N_SPLITS} splits in one tree, by node size
          </text>

          <line class="axis" x1={margin.left} x2={margin.left + plotW} y1={margin.top + plotH} y2={margin.top + plotH} />
          {#each [20, 100, 1000, 6000] as t}
            <text class="tick" x={xNode(t)} y={margin.top + plotH + 38} text-anchor="middle">{t}</text>
          {/each}
          <text class="axis-title" x={margin.left + plotW / 2} y={H - 6} text-anchor="middle">
            rows in the node
          </text>

          <text class="ln-label" x={margin.left + plotW} y={yCand(ROOT * 0.55) - 4} text-anchor="end" fill={EXACT}>
            exact: one per distinct value
          </text>
          <text class="ln-label" x={margin.left + plotW} y={yCand(BINS - 1) - 7} text-anchor="end" fill={HIST}>
            histogram: {BINS - 1}, always
          </text>
        </svg>
      {:else}
        <svg viewBox="0 0 {CW} {H}" width={CW} height={H}>
          {#each xBar.ticks(4) as t}
            <line class="grid" x1={xBar(t)} x2={xBar(t)} y1={margin.top} y2={margin.top + plotH} />
            <text class="tick" x={xBar(t)} y={margin.top + plotH + 16} text-anchor="middle">{compact(t)}</text>
          {/each}

          {#each BARS as b, i}
            {#if barsShown.includes(b)}
              <rect x={margin.left} y={barY(i)} width={xBar(b.value) - margin.left} height={barH} fill={b.color} opacity="0.9" />
              <text class="bar-label" x={margin.left + 8} y={barY(i) - 5}>{b.label}</text>
              <text class="bar-value" x={xBar(b.value) + 7} y={barY(i) + barH / 2 + 4}>{compact(b.value)}</text>
            {/if}
          {/each}

          {#if step >= 3}
            <line
              class="saving"
              x1={xBar(PRE.hist.rowTouches)}
              x2={xBar(PRE.histNoSubtract.rowTouches)}
              y1={barY(2) + barH + 12}
              y2={barY(2) + barH + 12}
            />
            <text class="saving-label" x={(xBar(PRE.hist.rowTouches) + xBar(PRE.histNoSubtract.rowTouches)) / 2} y={barY(2) + barH + 26} text-anchor="middle">
              {pct(SUBTRACT_SAVING, 0)} removed by the subtraction
            </text>
          {/if}

          <line class="axis" x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotH} />
          <text class="axis-title" x={margin.left + plotW / 2} y={H - 6} text-anchor="middle">
            gradient reads over the whole model
          </text>
        </svg>
      {/if}

      <div class="foot">
        {#if step === 0}
          <span class="foot-plain">{int(EXACT_CURVE.length)} → {BINS - 1} at the root.</span>
        {:else if step === 1}
          <span class="foot-plain">{times(GAIN_EVAL_RATIO)} fewer gain evaluations over the whole model.</span>
        {:else if step === 2}
          <span class="foot-bad">The same number of rows. The histogram alone saves nothing here.</span>
        {:else}
          <span class="foot-good">{times(ROW_TOUCH_RATIO)} fewer rows touched — all of it from the subtraction.</span>
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
    font-size: 0.74rem;
    color: #718096;
  }

  .grid {
    stroke: #eef1f5;
  }

  .axis {
    stroke: #b6bfcc;
  }

  .ln {
    fill: none;
    stroke-width: 2.2;
  }

  .ln-label {
    font-family: var(--font-main);
    font-size: 10.5px;
    font-weight: 700;
  }

  .cross {
    stroke: var(--violet);
    stroke-width: 1.2;
    stroke-dasharray: 4 3;
  }

  .cross-label {
    font-family: var(--font-main);
    font-size: 10px;
    font-weight: 700;
    fill: var(--violet);
  }

  .rug {
    stroke-width: 1.4;
    opacity: 0.65;
  }

  .rug-label {
    font-family: var(--font-main);
    font-size: 9.5px;
    fill: #9aa5b1;
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

  .bar-label {
    font-family: var(--font-main);
    font-size: 11px;
    font-weight: 600;
    fill: var(--squidink);
  }

  .bar-value {
    font-family: var(--font-mono, monospace);
    font-size: 11.5px;
    font-weight: 700;
    fill: var(--squidink);
  }

  .saving {
    stroke: var(--violet);
    stroke-width: 1.6;
  }

  .saving-label {
    font-family: var(--font-main);
    font-size: 10.5px;
    font-weight: 700;
    fill: var(--violet);
  }

  .foot {
    min-height: 20px;
    margin-top: 0.4rem;
    font-family: var(--font-main);
    font-size: 0.77rem;
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
