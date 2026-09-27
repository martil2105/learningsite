<script>
  /*
    The tradeoff, measured on held-out data - which is the only way any of this
    could be measured. On the training set more bins always wins and the chart
    would be a straight line saying nothing.

    Two panels because there are two quantities and conflating them is exactly
    the mistake the surrounding prose is about: what coarse bins cost (accuracy)
    and what they buy (gain evaluations, and almost no row work at all).

    Four leaf floors are drawn at once rather than switched between, because the
    argument IS the four curves together: the looser the floor, the further left
    the curve flattens. The selector picks which one to annotate.
  */
  import { scaleLog, scaleLinear } from "d3-scale";
  import {
    BIN_SWEEP, LEAF_FLOOR, FLOOR_BINS, firstWithin, PRE, CONFIG,
    compact, pct, rmse, int,
  } from "../experiments.js";
  import { BIN_RAMP, EXACT, HIST, THIRD, ACCENT, MUTED } from "../palette.js";

  const TOL = 0.03;
  // The two lightest ramp steps disappear at 35% opacity, so start one in.
  const RAMP = [BIN_RAMP[1], BIN_RAMP[2], BIN_RAMP[3], BIN_RAMP[5]];
  let floorIdx = 1; // min_data_in_leaf = 20, the default
  $: chosen = LEAF_FLOOR[floorIdx];

  let width = 320;
  /*
    A measured width can arrive as 0 - the binding fires before layout, and a
    sticky panel that is momentarily zero-width reports zero. Every scale built
    from it then has an inverted range, which shows up as a negative <rect>
    width in the console and, in the worst case, as a chart drawn backwards.
    Clamp once, here, and use the clamped value everywhere below.
  */
  $: W = Math.max(260, width);
  $: narrow = W < 560;
  $: pw = narrow ? W : Math.floor((W - 16) / 2);
  const PH = 250;
  $: margin = { top: 24, right: 12, bottom: 44, left: narrow ? 42 : 50 };
  $: plotW = Math.max(100, pw - margin.left - margin.right);
  $: plotH = PH - margin.top - margin.bottom;

  $: xBin = scaleLog().domain([7, 300]).range([margin.left, margin.left + plotW]);
  // Floor below the smallest value (0.4%), or the best point sits ON the axis
  // and reads as zero.
  $: yExcess = scaleLog().domain([0.0022, 1.8]).range([margin.top + plotH, margin.top]);
  // Reactive: closes over the scales, which move with the measured W.
  $: excessPath = (row) =>
    row.bins
      .map((b, i) => (i ? "L" : "M") + " " + xBin(b.maxBin) + " " + yExcess(Math.max(0.0025, b.excess)))
      .join(" ");

  $: xCost = scaleLog().domain([1.7, 300]).range([margin.left, margin.left + plotW]);
  $: yCost = scaleLog().domain([1e3, 1.6e7]).range([margin.top + plotH, margin.top]);
  $: costPath = (pick) =>
    BIN_SWEEP.map((r, i) => (i ? "L" : "M") + " " + xCost(r.maxBin) + " " + yCost(pick(r))).join(" ");

  /*
    Built here rather than in the template. Svelte strips the leading whitespace
    from an {#if} block's contents, so an inline version rendered "255bins" -
    the same trim that produced "26,231\u00b7 silhouette" in the k-means article.
  */
  $: footText = (() => {
    const b = firstWithin(chosen, TOL);
    const head =
      "With min_data_in_leaf = " + chosen.minDataInLeaf + ", the exact model scores " +
      rmse(chosen.exact) + " and the coarsest binning that stays within " + pct(TOL, 0) + " of it is ";
    return b === null
      ? head + "none of the settings tried."
      : head + b + " bins \u2014 about " + int(CONFIG.N_TRAIN / b) + " rows apiece.";
  })();

  $: sweep255 = BIN_SWEEP[BIN_SWEEP.length - 1];
  $: sweep32 = BIN_SWEEP.find((r) => r.maxBin === 32);
</script>

<h1 class="body-header">So how many bins do you need?</h1>

<p class="body-text">
  The obvious way to go faster is to use fewer bins, and the folklore says you
  can drop to 63 or 31 for nearly nothing. On this problem that is not what
  happens. Against the exact model, <span class="mono">max_bin = 255</span> gives
  up {pct(BIN_SWEEP[BIN_SWEEP.length - 1].excess, 1)} of held-out error;
  <span class="mono">max_bin = 32</span> gives up
  <span class="bold">{pct(sweep32.excess, 0)}</span>.
</p>

<p class="body-text">
  And look at what the coarser setting bought. Gain evaluations fall from
  {compact(sweep255.gainEvals)} to {compact(sweep32.gainEvals)} — a real
  reduction. Rows touched fall from {compact(sweep255.rowTouches)} to
  {compact(sweep32.rowTouches)}, which is to say they do not fall at all,
  because building a histogram is a pass over the rows no matter how many
  buckets you are dropping them into. Turning <span class="mono">max_bin</span>
  down trades away accuracy to save the operation that was already cheap.
</p>

<div class="card">
  <div class="measure" bind:clientWidth={width} />

  <div class="card-head">
    <span class="card-title">Held-out cost, and what it saves</span>
    <div class="toggle">
      {#each LEAF_FLOOR as r, i}
        <button class="pill" class:on={floorIdx === i} on:click={() => (floorIdx = i)}>
          {r.minDataInLeaf}
        </button>
      {/each}
      <span class="toggle-label">min_data_in_leaf</span>
    </div>
  </div>

  <div class="panels">
    <svg viewBox="0 0 {pw} {PH}" W={pw} height={PH}>
      <text class="p-title" x={margin.left} y="12">held-out error above the exact model</text>
      {#each [0.01, 0.03, 0.1, 0.3, 1] as t}
        <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={yExcess(t)} y2={yExcess(t)} />
        <text class="tick" x={margin.left - 6} y={yExcess(t) + 3.5} text-anchor="end">{pct(t, 0)}</text>
      {/each}

      <line class="tol" x1={margin.left} x2={margin.left + plotW} y1={yExcess(TOL)} y2={yExcess(TOL)} />

      {#each LEAF_FLOOR as row, i}
        <path
          class="ln"
          d={excessPath(row)}
          stroke={RAMP[i]}
          stroke-W={i === floorIdx ? 2.6 : 1.4}
          opacity={i === floorIdx ? 1 : 0.5}
        />
      {/each}
      {#each chosen.bins as b}
        <circle cx={xBin(b.maxBin)} cy={yExcess(Math.max(0.0025, b.excess))} r="3.4" fill={RAMP[floorIdx]} stroke="#fff" stroke-W="1.2" />
      {/each}
      {#if firstWithin(chosen, TOL)}
        <line
          class="hit"
          x1={xBin(firstWithin(chosen, TOL))}
          x2={xBin(firstWithin(chosen, TOL))}
          y1={margin.top}
          y2={margin.top + plotH}
        />
        <text class="hit-label" x={xBin(firstWithin(chosen, TOL))} y={margin.top - 4} text-anchor="middle">
          {firstWithin(chosen, TOL)} bins
        </text>
      {/if}

      <line class="axis" x1={margin.left} x2={margin.left + plotW} y1={margin.top + plotH} y2={margin.top + plotH} />
      {#each FLOOR_BINS as b}
        <text class="tick" x={xBin(b)} y={margin.top + plotH + 15} text-anchor="middle">{b}</text>
      {/each}
      <text class="axis-title" x={margin.left + plotW / 2} y={PH - 8} text-anchor="middle">max_bin</text>
    </svg>

    <svg viewBox="0 0 {pw} {PH}" W={pw} height={PH}>
      <text class="p-title" x={margin.left} y="12">what the bins cost to search</text>
      {#each [1e3, 1e4, 1e5, 1e6, 1e7] as t}
        <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={yCost(t)} y2={yCost(t)} />
        <text class="tick" x={margin.left - 6} y={yCost(t) + 3.5} text-anchor="end">{compact(t)}</text>
      {/each}

      <path class="ln" d={costPath((r) => r.rowTouches)} stroke={HIST} stroke-W="2.4" />
      <path class="ln" d={costPath((r) => r.gainEvals)} stroke={EXACT} stroke-W="2.4" />
      {#each BIN_SWEEP as r}
        <circle cx={xCost(r.maxBin)} cy={yCost(r.rowTouches)} r="2.6" fill={HIST} />
        <circle cx={xCost(r.maxBin)} cy={yCost(r.gainEvals)} r="2.6" fill={EXACT} />
      {/each}

      <text class="ln-label" x={margin.left + plotW} y={yCost(sweep255.rowTouches) - 8} text-anchor="end" fill={HIST}>
        rows touched
      </text>
      <text class="ln-label" x={margin.left + plotW} y={yCost(sweep255.gainEvals) + 22} text-anchor="end" fill={EXACT}>
        gain evaluations
      </text>

      <line class="axis" x1={margin.left} x2={margin.left + plotW} y1={margin.top + plotH} y2={margin.top + plotH} />
      {#each [2, 8, 32, 128, 255] as b}
        <text class="tick" x={xCost(b)} y={margin.top + plotH + 15} text-anchor="middle">{b}</text>
      {/each}
      <text class="axis-title" x={margin.left + plotW / 2} y={PH - 8} text-anchor="middle">max_bin</text>
    </svg>
  </div>

  <p class="card-foot">{footText}</p>
</div>

<p class="body-text">
  The four curves are the interesting part. As
  <span class="mono">min_data_in_leaf</span> rises the whole curve slides left:
  at a floor of {LEAF_FLOOR[0].minDataInLeaf} even 255 bins is
  {pct(LEAF_FLOOR[0].bins[LEAF_FLOOR[0].bins.length - 1].excess, 1)} short of
  exact, while at a floor of
  {LEAF_FLOOR[LEAF_FLOOR.length - 1].minDataInLeaf} you are within
  {pct(TOL, 0)} by {firstWithin(LEAF_FLOOR[LEAF_FLOOR.length - 1], TOL)} bins.
</p>

<p class="body-text">
  Which makes sense once you say what a bin is <em>for</em>. It is a grid for
  placing a boundary, and the boundaries being placed are the edges of leaves.
  There is no value in resolving a cut point to a hundredth of the data when
  every leaf is required to hold a fiftieth of it — the leaf's own prediction is
  already an average over far more rows than the bin edge is uncertain by. So
  <span class="mono">max_bin</span> and
  <span class="mono">min_data_in_leaf</span> are one knob wearing two labels, and
  tuning either without the other is tuning half a parameter.
</p>

<p class="body-text">
  That is one problem, one target and one noise level, so read the direction and
  not the digits. But the direction is mechanical rather than empirical, and it
  is a better rule of thumb than a number copied off a forum.
</p>

<style>
  .card {
    max-W: 640px;
    margin: 1.6rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .measure {
    W: 100%;
    height: 0;
  }

  svg {
    max-W: 100%;
    display: block;
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .card-title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--squidink);
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.28rem;
  }

  .toggle-label {
    font-family: var(--font-mono, monospace);
    font-size: 0.68rem;
    color: #9aa5b1;
    margin-left: 0.2rem;
  }

  .pill {
    font-family: var(--font-mono, monospace);
    font-size: 0.74rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    border: 1px solid #cbd5e0;
    background: #ffffff;
    color: #4a5568;
    cursor: pointer;
  }

  .pill:hover {
    border-color: var(--violet);
  }

  .pill.on {
    background: #efeafe;
    border-color: var(--violet);
    color: #4a3592;
    font-weight: 700;
  }

  .panels {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .grid {
    stroke: #eef1f5;
  }

  .axis {
    stroke: #b6bfcc;
  }

  .ln {
    fill: none;
    stroke-linejoin: round;
  }

  .ln-label {
    font-family: var(--font-main);
    font-size: 10px;
    font-weight: 700;
  }

  .tol {
    stroke: #9aa5b1;
    stroke-dasharray: 3 3;
  }

  .hit {
    stroke: var(--violet);
    stroke-W: 1.2;
    stroke-dasharray: 4 3;
  }

  .hit-label {
    font-family: var(--font-main);
    font-size: 10px;
    font-weight: 700;
    fill: var(--violet);
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    fill: #9aa5b1;
  }

  .p-title {
    font-family: var(--font-main);
    font-size: 10.5px;
    font-weight: 700;
    fill: var(--squidink);
  }

  .axis-title {
    font-family: var(--font-mono, monospace);
    font-size: 10.5px;
    fill: #718096;
  }

  .card-foot {
    font-family: var(--font-main);
    font-size: 0.79rem;
    color: #718096;
    margin: 0.55rem 0 0 0;
  }

  @media screen and (max-W: 950px) {
    .card {
      max-W: 92%;
      padding: 0.75rem;
    }
  }
</style>
