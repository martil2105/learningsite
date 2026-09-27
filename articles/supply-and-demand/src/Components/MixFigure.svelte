<script>
  /*
    MixFigure.svelte
    The mechanism: fitted slope b against w.
    A straight line from -B (-3) to S (+2), crossing zero at w* = 0.6.
  */
  import { linear, clampW } from "../chart.js";
  import { B, S } from "../market.js";

  const H = 240;
  const M = { top: 20, right: 24, bottom: 38, left: 45 };

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let scrubW = $state(0.35);

  let x = $derived(linear(0, 1, M.left, W - M.right));
  let y = $derived(linear(-3.5, 2.5, H - M.bottom, M.top));

  const slopeAt = (w) => w * S - (1 - w) * B;
  let curSlope = $derived(slopeAt(scrubW));

  const wTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const sTicks = [-3, -2, -1, 0, 1, 2];

  function onPointerMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const rawW = (clientX - M.left) / (W - M.left - M.right);
    scrubW = Math.max(0, Math.min(1, rawW));
  }
</script>

<div class="figure-wrap" id="mix-figure">
  <div class="card-header">
    <h3 class="figure-title">The fitted slope moves in a straight line</h3>
    <p class="figure-desc">
      With unlimited data, the fitted slope moves in a straight line from the demand slope at <em>w</em> = 0 to the supply slope at <em>w</em> = 1. Move your cursor across the chart to trace it for every shock share.
    </p>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="plot-container"
    role="application"
    tabindex="0"
    aria-label="Fitted slope against demand shock share interactive chart"
    onpointermove={onPointerMove}
    onkeydown={(e) => {
      if (e.key === "ArrowLeft") scrubW = Math.max(0, scrubW - 0.05);
      if (e.key === "ArrowRight") scrubW = Math.min(1, scrubW + 0.05);
    }}
  >
    <div class="measure" bind:clientWidth={boxWidth}></div>

    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img">
      <!-- Grid lines -->
      {#each wTicks as wt}
        <line class="grid-line" x1={x(wt)} y1={M.top} x2={x(wt)} y2={H - M.bottom} />
        <text class="tick-label" x={x(wt)} y={H - M.bottom + 15} text-anchor="middle">{wt.toFixed(1)}</text>
      {/each}
      {#each sTicks as st}
        <line class="grid-line" x1={M.left} y1={y(st)} x2={W - M.right} y2={y(st)} />
        <text class="tick-label" x={M.left - 6} y={y(st) + 4} text-anchor="end">{st}</text>
      {/each}

      <!-- Zero slope baseline -->
      <line class="zero-line" x1={M.left} y1={y(0)} x2={W - M.right} y2={y(0)} stroke="#8a94a2" stroke-dasharray="3 3" />

      <!-- The theoretical line from (0, -3) to (1, 2) -->
      <line
        class="line slope-curve"
        x1={x(0)}
        y1={y(-B)}
        x2={x(1)}
        y2={y(S)}
        stroke="#2f7d32"
        stroke-width="3"
      />

      <!-- Flat point marker at w = 0.6 -->
      <circle cx={x(0.6)} cy={y(0)} r="4" fill="#df2a5d" />
      <text class="point-label" x={x(0.6) + 6} y={y(0) - 8} fill="#df2a5d">w* = 0.6 (flat cloud)</text>

      <!-- Scrubber line and live marker -->
      <line class="scrubber" x1={x(scrubW)} y1={M.top} x2={x(scrubW)} y2={H - M.bottom} stroke="#7c5aed" stroke-width="1.5" />
      <circle cx={x(scrubW)} cy={y(curSlope)} r="6" fill="#7c5aed" stroke="#ffffff" stroke-width="2" />

      <!-- Axis titles -->
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">demand-shock share, w</text>
      <text
        class="axis-title"
        x={12}
        y={(M.top + H - M.bottom) / 2}
        text-anchor="middle"
        transform={`rotate(-90 12 ${(M.top + H - M.bottom) / 2})`}
      >
        fitted slope
      </text>
    </svg>
  </div>

  <div class="figure-caption">
    <p class="readout-text">
      At w = {scrubW.toFixed(2)}, the fitted slope is <strong>{curSlope.toFixed(2).replace(/^-/, "−")}</strong>.
      It divides the interval [−{B}, +{S}] in exactly the ratio of the shock variances,
      τd²/τs² = {(scrubW / Math.max(1e-4, 1 - scrubW)).toFixed(2)}.
    </p>
  </div>
</div>

<style>
  .figure-wrap {
    background: #ffffff;
    border: 3px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2.5rem 0;
  }
  .card-header {
    margin-bottom: 1rem;
  }
  .figure-title {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 0;
    margin: 0 0 0.5rem 0;
    color: var(--squidink, #232f3e);
  }
  .figure-desc {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    color: var(--squidink, #232f3e);
    opacity: 0.85;
  }
  .plot-container {
    background: var(--paper, #f1f3f3);
    border: 1px solid #e5e9e9;
    padding: 0.75rem 0.5rem 0.25rem 0.5rem;
    cursor: crosshair;
    outline: none;
  }
  .measure {
    width: 100%;
    height: 0;
  }
  svg {
    display: block;
  }
  .grid-line {
    stroke: #e5e9e9;
    stroke-width: 1px;
    shape-rendering: crispEdges;
  }
  .tick-label {
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    fill: #232f3e;
    opacity: 0.75;
  }
  .axis-title {
    font-family: var(--font-main, sans-serif);
    font-size: 0.8rem;
    font-weight: 700;
    fill: #232f3e;
  }
  .point-label {
    font-family: var(--font-main, sans-serif);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .figure-caption {
    margin-top: 1rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  .readout-text {
    font-family: var(--font-mono, monospace);
    font-size: 0.85rem;
    margin: 0;
    background: rgba(124, 90, 237, 0.08);
    padding: 0.4rem 0.6rem;
    border-left: 3px solid var(--violet, #7c5aed);
  }
</style>
