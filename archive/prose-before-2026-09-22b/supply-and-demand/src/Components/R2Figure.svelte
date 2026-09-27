<script>
  /*
    R2Figure.svelte
    R² against w: 1 at both ends (w = 0 and w = 1) and 0 at w* = 0.6.
  */
  import { linear, clampW } from "../chart.js";
  import { populationMoments } from "../market.js";

  const H = 240;
  const M = { top: 20, right: 24, bottom: 38, left: 45 };

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let scrubW = $state(0.35);

  let x = $derived(linear(0, 1, M.left, W - M.right));
  let y = $derived(linear(0, 1.05, H - M.bottom, M.top));

  function r2At(wVal) {
    const pop = populationMoments(wVal * 100, (1 - wVal) * 100);
    return pop.r2;
  }

  let curR2 = $derived(r2At(scrubW));

  // Generate curve points
  let pathD = $derived(() => {
    const pts = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const wVal = i / steps;
      const r2 = r2At(wVal);
      pts.push(`${i === 0 ? "M" : "L"} ${x(wVal)} ${y(r2)}`);
    }
    return pts.join(" ");
  });

  const wTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const rTicks = [0, 0.25, 0.5, 0.75, 1.0];

  function onPointerMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const rawW = (clientX - M.left) / (W - M.left - M.right);
    scrubW = Math.max(0, Math.min(1, rawW));
  }
</script>

<div class="figure-wrap" id="r2-figure">
  <div class="card-header">
    <h3 class="figure-title">A perfect fit at both ends</h3>
    <p class="figure-desc">
      We usually learn to trust a regression with a high R². In market data, though, R² = 1 at both extremes: when you're estimating true demand (w = 0) <em>and</em> when you're estimating true supply (w = 1). So a high R² tells you that one curve stood still, but it can't tell you which one.
    </p>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="plot-container"
    role="application"
    tabindex="0"
    aria-label="R² curve against demand shock share interactive chart"
    onpointermove={onPointerMove}
    onkeydown={(e) => {
      if (e.key === "ArrowLeft") scrubW = Math.max(0, scrubW - 0.05);
      if (e.key === "ArrowRight") scrubW = Math.min(1, scrubW + 0.05);
    }}
  >
    <div class="measure" bind:clientWidth={boxWidth}></div>

    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img">
      {#each wTicks as wt}
        <line class="grid-line" x1={x(wt)} y1={M.top} x2={x(wt)} y2={H - M.bottom} />
        <text class="tick-label" x={x(wt)} y={H - M.bottom + 15} text-anchor="middle">{wt.toFixed(1)}</text>
      {/each}
      {#each rTicks as rt}
        <line class="grid-line" x1={M.left} y1={y(rt)} x2={W - M.right} y2={y(rt)} />
        <text class="tick-label" x={M.left - 6} y={y(rt) + 4} text-anchor="end">{rt.toFixed(2)}</text>
      {/each}

      <!-- The R² curve -->
      <path class="line r2-curve" d={pathD()} stroke="#2074d5" stroke-width="3" fill="none" />

      <!-- Markers at endpoints and minimum -->
      <circle cx={x(0)} cy={y(1)} r="4" fill="#2074d5" />
      <circle cx={x(0.6)} cy={y(0)} r="4" fill="#df2a5d" />
      <circle cx={x(1)} cy={y(1)} r="4" fill="#2074d5" />

      <text class="point-label" x={x(0) + 6} y={y(1) + 14} fill="#2074d5">R² = 1 (Demand)</text>
      <text class="point-label" x={x(0.6)} y={y(0) - 8} fill="#df2a5d" text-anchor="middle">R² = 0 (w* = 0.6)</text>
      <text class="point-label" x={x(1) - 6} y={y(1) + 14} fill="#2074d5" text-anchor="end">R² = 1 (Supply)</text>

      <!-- Scrubber -->
      <line class="scrubber" x1={x(scrubW)} y1={M.top} x2={x(scrubW)} y2={H - M.bottom} stroke="#7c5aed" stroke-width="1.5" />
      <circle cx={x(scrubW)} cy={y(curR2)} r="6" fill="#7c5aed" stroke="#ffffff" stroke-width="2" />

      <!-- Axis titles -->
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">demand-shock share, w</text>
      <text
        class="axis-title"
        x={12}
        y={(M.top + H - M.bottom) / 2}
        text-anchor="middle"
        transform={`rotate(-90 12 ${(M.top + H - M.bottom) / 2})`}
      >
        R²
      </text>
    </svg>
  </div>

  <div class="figure-caption">
    <p class="readout-text">
      At w = {scrubW.toFixed(2)}, R² = <strong>{curR2.toFixed(3)}</strong>.
      {#if Math.abs(curR2 - 1) < 1e-3}
        The fit is perfect, but without outside information, you can't know whether you estimated demand (w = 0) or supply (w = 1).
      {:else if curR2 < 0.05}
        R² is almost zero, and yet both demand and supply are straight lines that nothing but the random shocks moves.
      {:else}
        As R² falls, the range of demand slopes that fit the data gets wider.
      {/if}
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
