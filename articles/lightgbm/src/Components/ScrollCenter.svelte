<script>
  /*
    "Where the bins bite."

    Three failure modes, each a direct consequence of the one design decision -
    the candidate splits are the bin edges and nothing else. Same side-by-side
    layout as the cost section; the panel changes shape per step because these
    are three different kinds of claim and drawing the third one as a chart
    would be decoration pretending to be evidence.
  */
  import Scrolly from "./Scrolly.svelte";
  import { scaleLinear } from "d3-scale";
  import {
    NEEDLE, NEEDLE_INFO, NEEDLE_X, NEEDLE_Y, NEEDLE_EDGES, NEEDLE_ROW,
    DISTANCE_EDGES, EDGE_SETS, STOPS, HOUR, BIN_SETTINGS, CONFIG, rmse, int, pct,
  } from "../experiments.js";
  import { FEATURES, TRAIN_COLS, N_TRAIN } from "../datasets.js";
  import { EXACT, HIST, ACCENT, MUTED, FAINT, INK } from "../palette.js";

  let value = 0;
  $: step = typeof value === "number" ? Math.min(2, Math.max(0, value)) : 0;

  // ---- panel 1: the needle. Mean target in 200 equal slices of x.
  const SLOTS = 200;
  const PROFILE = (() => {
    const sum = new Float64Array(SLOTS);
    const n = new Int32Array(SLOTS);
    for (let i = 0; i < NEEDLE_X.length; i++) {
      const s = Math.min(SLOTS - 1, Math.floor(NEEDLE_X[i] * SLOTS));
      sum[s] += NEEDLE_Y[i];
      n[s]++;
    }
    return Array.from({ length: SLOTS }, (_, s) => (n[s] ? sum[s] / n[s] : 0));
  })();
  const PROFILE_MAX = Math.max(...PROFILE);

  // ---- panel 2: the shape of a skewed column, and where its quantile edges go
  const DIST_SLOTS = 100;
  const DIST_RANGE = [Math.min(...TRAIN_COLS[0]), Math.max(...TRAIN_COLS[0])];
  const DIST_PROFILE = (() => {
    const c = new Array(DIST_SLOTS).fill(0);
    for (let i = 0; i < N_TRAIN; i++) {
      const s = Math.min(DIST_SLOTS - 1, Math.floor(((TRAIN_COLS[0][i] - DIST_RANGE[0]) / (DIST_RANGE[1] - DIST_RANGE[0])) * DIST_SLOTS));
      c[s]++;
    }
    return c;
  })();
  const DIST_MAX = Math.max(...DIST_PROFILE);

  // ------------------------------------------------------------- layout
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
  $: mw = narrow ? BW : Math.floor((BW - 14) / 2);
  $: mh = narrow ? 150 : 170;
  $: xN = scaleLinear().domain([0, 1]).range([6, mw - 6]);
  $: yN = scaleLinear().domain([-1, PROFILE_MAX * 1.05]).range([mh - 22, 10]);
  $: slotWN = (mw - 12) / SLOTS;

  $: fullW = BW;
  $: fh = narrow ? 170 : 200;
  $: xD = scaleLinear().domain(DIST_RANGE).range([44, fullW - 12]);
  $: yD = scaleLinear().domain([0, DIST_MAX]).range([fh - 30, 14]);
  $: slotWD = (fullW - 56) / DIST_SLOTS;

  const steps = [
    "<h1 class='step-title'>A split can only be a bin edge</h1>" +
      "<p>In this example, the whole signal sits inside a window " + NEEDLE_INFO.width + " wide, which " +
      "is about " + pct(NEEDLE_INFO.width, 0) + " of the range. Outside that window, the target is just " +
      "flat noise.</p>" +
      "<p>At <span class='mono'>max_bin = 8</span>, not a single bin edge lands inside the window, so no " +
      "tree can isolate it at any depth. The held-out error is " + rmse(NEEDLE_ROW(8).test) + ", compared " +
      "with " + rmse(NEEDLE.exact) + " for the exact scan. At 255 bins, there are " +
      NEEDLE_ROW(255).edgesInWindow + " edges inside the window, and the error falls to " +
      rmse(NEEDLE_ROW(255).test) + ". So the approximation isn't in the gain or the leaf values, which " +
      "stay exact sums. It's in which cuts you're allowed to consider at all.</p>",

    "<h1 class='step-title'>The edges are quantiles, not widths</h1>" +
      "<p>Bins hold roughly equal numbers of rows rather than equal spans of the axis. On this column, " +
      "where most deliveries are short and a few are long, 32 bins put more than half their edges below " +
      DISTANCE_EDGES[32][Math.floor(DISTANCE_EDGES[32].length / 2)].toFixed(1) + " km and spread the " +
      "rest across the long tail.</p>" +
      "<p>This is the right behaviour, and it's worth noticing for two reasons. It means a skewed " +
      "feature doesn't waste its resolution on empty range, and it means the edges are a property of " +
      "the data rather than of the axis. If you rescale the column (say, by taking a logarithm or " +
      "standardising it), the bins, and therefore the model, stay exactly the same.</p>",

    "<h1 class='step-title'>A column of integers is never binned</h1>" +
      "<p>If a feature has fewer distinct values than <span class='mono'>max_bin</span>, every value gets " +
      "its own bin, and no approximation happens at all. The <span class='mono'>stops</span> column here " +
      "has " + STOPS.distinct + " distinct values, so it has " + STOPS.distinct + " bins at " +
      "<span class='mono'>max_bin = 255</span>, at 128 and at 32.</p>" +
      "<p>Two things follow from this. First, tuning <span class='mono'>max_bin</span> does nothing at " +
      "all to your integer and low-cardinality columns. Second, the accuracy cost of binning isn't " +
      "spread evenly across a dataset. It's concentrated entirely in the continuous columns, so that's " +
      "where to look when a coarser setting suddenly hurts.</p>" +
      "<p>The count can also come out <em>below</em> both numbers, as the table shows: " +
      "<span class='mono'>hour</span> gets " + HOUR.edges[255] + " bins rather than 255. Its most common " +
      "value is shared by " + int(HOUR.maxTie) + " rows, which is more than the " +
      int(Math.round(CONFIG.N_TRAIN / 255)) + " rows a bin is entitled to at that setting, and since a " +
      "value can't be split across two bins, it swallows a boundary. Every heaped or clipped column " +
      "does this.</p>",
  ];
</script>

<h1 class="body-header">Where the bins bite</h1>

<p class="body-text">
  Everything so far says the approximation is cheap. Still, it's worth being
  precise about what's being approximated, because it's narrower than "the
  model is approximate", and it fails in a specific way. The gain is exact, and
  the leaf values are exact sums over the rows that landed in each leaf. The only
  thing binning changes is the <em>set of cuts you're allowed to consider</em>,
  and a cut that isn't in that set isn't available at any depth, in any tree,
  ever.
</p>

<section class="side-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="measure" bind:clientWidth={boxWidth} />

      {#if step === 0}
        <div class="chart-header">
          <span class="chart-title">Signal in a window {NEEDLE_INFO.width} wide</span>
          <span class="chart-sub">exact scan: {rmse(NEEDLE.exact)}</span>
        </div>
        <div class="pair">
          {#each [8, 255] as mb}
            <div class="mini">
              <span class="mini-label">max_bin = {mb} · held out {rmse(NEEDLE_ROW(mb).test)}</span>
              <svg viewBox="0 0 {mw} {mh}" width={mw} height={mh}>
                <rect
                  x={xN(NEEDLE_INFO.lo)}
                  y={10}
                  width={xN(NEEDLE_INFO.hi) - xN(NEEDLE_INFO.lo)}
                  height={mh - 32}
                  fill="#fdeaf0"
                />
                {#each PROFILE as v, s}
                  <rect x={6 + s * slotWN} y={yN(v)} width={Math.max(0.5, slotWN - 0.3)} height={Math.max(0, yN(-1) - yN(v))} fill={INK} opacity="0.35" />
                {/each}
                {#each NEEDLE_EDGES[mb] as e}
                  <line class="edge" x1={xN(e)} x2={xN(e)} y1={10} y2={mh - 22} />
                {/each}
                <line class="axis" x1={6} x2={mw - 6} y1={yN(-1)} y2={yN(-1)} />
                <text class="mini-note" x={xN(NEEDLE_INFO.lo)} y={mh - 8}>
                  {NEEDLE_ROW(mb).edgesInWindow} edge{NEEDLE_ROW(mb).edgesInWindow === 1 ? "" : "s"} inside
                </text>
              </svg>
            </div>
          {/each}
        </div>
      {:else if step === 1}
        <div class="chart-header">
          <span class="chart-title">{FEATURES[0].name}, and where 32 bins cut it</span>
          <span class="chart-sub">{int(N_TRAIN)} rows</span>
        </div>
        <svg viewBox="0 0 {fullW} {fh}" width={fullW} height={fh}>
          {#each DIST_PROFILE as c, s}
            <rect x={44 + s * slotWD} y={yD(c)} width={Math.max(0.6, slotWD - 0.4)} height={yD(0) - yD(c)} fill={MUTED} opacity="0.4" />
          {/each}
          {#each DISTANCE_EDGES[32] as e}
            <line class="edge" x1={xD(e)} x2={xD(e)} y1={14} y2={yD(0)} />
          {/each}
          <line class="axis" x1={44} x2={fullW - 12} y1={yD(0)} y2={yD(0)} />
          {#each xD.ticks(8) as t}
            <text class="tick" x={xD(t)} y={yD(0) + 15} text-anchor="middle">{t}</text>
          {/each}
          <text class="axis-title" x={44} y={11}>rows per slice of the axis</text>
          <text class="axis-title" x={fullW - 12} y={fh - 4} text-anchor="end">{FEATURES[0].name} ({FEATURES[0].unit})</text>
        </svg>
      {:else}
        <div class="chart-header">
          <span class="chart-title">Bins each column actually gets</span>
          <span class="chart-sub">by max_bin</span>
        </div>
        <table class="bins">
          <thead>
            <tr>
              <th class="lft">column</th>
              <th>distinct</th>
              {#each [8, 32, 128, 255] as b}<th>{b}</th>{/each}
            </tr>
          </thead>
          <tbody>
            {#each EDGE_SETS as e}
              <tr class:capped={e.distinct < 255}>
                <td class="lft mono">{e.key}</td>
                <td class="mono">{int(e.distinct)}</td>
                {#each [8, 32, 128, 255] as b}
                  <td class="mono">{e.edges[b]}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
        <p class="table-note">
          At most <span class="mono">min(max_bin, distinct values)</span>, and sometimes fewer:
          <span class="mono">stops</span> stops moving at {STOPS.distinct}, and
          <span class="mono">hour</span> lands on {HOUR.edges[255]} because one repeated value takes a
          boundary with it.
        </p>
      {/if}
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
    font-size: 0.74rem;
    color: #718096;
  }

  .pair {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .mini-label {
    display: block;
    font-family: var(--font-mono, monospace);
    font-size: 0.7rem;
    color: #718096;
    margin-bottom: 0.2rem;
  }

  .mini-note {
    font-family: var(--font-main);
    font-size: 9.5px;
    font-weight: 700;
    fill: #df2a5d;
  }

  .edge {
    stroke: var(--violet);
    stroke-width: 1;
    opacity: 0.55;
  }

  .axis {
    stroke: #b6bfcc;
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    fill: #9aa5b1;
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 10.5px;
    font-weight: 600;
    fill: #718096;
  }

  table.bins {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-main);
    font-size: 0.82rem;
  }

  table.bins th {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #9aa5b1;
    font-weight: 600;
    text-align: right;
    padding: 0.3rem 0.35rem;
    border-bottom: 1px solid #e2e8f0;
  }

  table.bins td {
    text-align: right;
    padding: 0.32rem 0.35rem;
    border-bottom: 1px solid #f2f4f7;
    color: var(--squidink);
  }

  table.bins .lft {
    text-align: left;
  }

  table.bins tr.capped td {
    color: #df2a5d;
    font-weight: 700;
  }

  .table-note {
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #718096;
    margin: 0.5rem 0 0 0;
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
