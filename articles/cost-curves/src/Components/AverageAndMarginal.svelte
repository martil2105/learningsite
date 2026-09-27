<script>
  /* AverageAndMarginal.svelte: Build-up 2 — Average and Marginal Cost crossing, with constant MC toggle */
  import { linear, clampW } from "../chart.js";
  import { SRAC, SRMC, ACFlat, qCheapest } from "../cost.js";

  const kFixed = 100;
  let showConstantMC = $state(false);
  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  const M = { top: 20, right: 24, bottom: 36, left: 50 };
  const height = 300;

  const Q_MAX = 36;
  const Y_MAX = 40;

  let x = $derived(linear(0, Q_MAX, M.left, W - M.right));
  let y = $derived(linear(0, Y_MAX, height - M.bottom, M.top));

  const qMinU = qCheapest(kFixed); // ~21.5443
  const acMinU = SRAC(qMinU, kFixed); // ~13.9248

  // Curves for standard model
  let sracPath = $derived.by(() => {
    let pts = [];
    for (let q = 2; q <= Q_MAX; q += 0.5) {
      const val = SRAC(q, kFixed);
      if (val <= Y_MAX + 5) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  });

  let srmcPath = $derived.by(() => {
    let pts = [];
    for (let q = 0.5; q <= Q_MAX; q += 0.5) {
      const val = SRMC(q, kFixed);
      if (val <= Y_MAX + 5) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  });

  // Curves for constant MC benchmark (f=100, MC=5)
  let flatAcPath = $derived.by(() => {
    let pts = [];
    for (let q = 3; q <= Q_MAX; q += 0.5) {
      const val = ACFlat(q, 5);
      if (val <= Y_MAX + 5) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  });
</script>

<div class="card">
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <div class="header-row">
      <h3 class="card-title">Average and marginal cost</h3>
      <button
        type="button"
        class="toggle-btn"
        class:active={showConstantMC}
        onclick={() => (showConstantMC = !showConstantMC)}
      >
        {showConstantMC ? "Rising marginal cost" : "Constant marginal cost"}
      </button>
    </div>
    <p class="card-sub">
      {#if !showConstantMC}
        Marginal cost crosses average cost at the bottom of the U, at q = {qMinU.toFixed(1)}. Switch to a constant marginal cost to see what happens without the crowding.
      {:else}
        With a constant marginal cost of 5, average cost is 100/q + 5, which falls at every output and never turns up. The U needs a fixed cost <em>and</em> a rising marginal cost.
      {/if}
    </p>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} {height} viewBox="0 0 {W} {height}" role="img" aria-label="Average and marginal cost curve chart">
      <!-- Grid & axes -->
      <line x1={M.left} y1={height - M.bottom} x2={W - M.right} y2={height - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={height - M.bottom} stroke="#d4dada" />

      {#if !showConstantMC}
        <!-- SRAC curve (blue) -->
        <path class="curve srac" d={sracPath} fill="none" stroke="#2074d5" stroke-width="2.5" />
        <!-- SRMC curve (pink) -->
        <path class="curve srmc" d={srmcPath} fill="none" stroke="#df2a5d" stroke-width="2.5" />

        <!-- Crossing dot -->
        <circle class="dot crossing" cx={x(qMinU)} cy={y(acMinU)} r="5.5" fill="#232f3e" />
        <line
          x1={x(qMinU)}
          y1={height - M.bottom}
          x2={x(qMinU)}
          y2={y(acMinU)}
          stroke="#232f3e"
          stroke-dasharray="3 3"
        />

        <text x={x(qMinU) - 8} y={y(acMinU) + 20} text-anchor="end" font-size="12" font-weight="700" fill="#232f3e">
          lowest AC = {acMinU.toFixed(1)}
        </text>

        <!-- Curve labels -->
        <text x={x(32)} y={y(SRAC(32, kFixed)) - 8} fill="#2074d5" font-size="12" font-weight="700">
          AC
        </text>
        <text x={x(28)} y={y(SRMC(28, kFixed)) - 8} fill="#df2a5d" font-size="12" font-weight="700">
          MC
        </text>
      {:else}
        <!-- Flat MC line -->
        <line
          x1={M.left}
          y1={y(5)}
          x2={W - M.right}
          y2={y(5)}
          stroke="#df2a5d"
          stroke-width="2.5"
        />
        <text x={W - M.right} y={y(5) - 6} text-anchor="end" fill="#df2a5d" font-size="12" font-weight="700">
          MC = 5 (constant)
        </text>

        <!-- Monotonically falling AC -->
        <path class="curve srac-flat" d={flatAcPath} fill="none" stroke="#2074d5" stroke-width="2.5" />
        <text x={x(25)} y={y(ACFlat(25, 5)) - 8} fill="#2074d5" font-size="12" font-weight="700">
          AC = 100/q + 5 (falls forever)
        </text>
      {/if}

      <!-- Axis ticks -->
      <text x={x(0)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">0</text>
      <text x={x(10)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">10</text>
      <text x={x(20)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">20</text>
      <text x={x(30)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">30</text>
      <text x={W - M.right} y={height - 6} font-size="11" text-anchor="end" font-weight="700" fill="#232f3e">
        Output, q
      </text>

      <text x={M.left - 8} y={y(0) + 4} font-size="11" text-anchor="end" fill="#232f3e">0</text>
      <text x={M.left - 8} y={y(10) + 4} font-size="11" text-anchor="end" fill="#232f3e">10</text>
      <text x={M.left - 8} y={y(20) + 4} font-size="11" text-anchor="end" fill="#232f3e">20</text>
      <text x={M.left - 8} y={y(30) + 4} font-size="11" text-anchor="end" fill="#232f3e">30</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">
        Per-unit cost
      </text>
    </svg>
  </div>

  <p class="caption">
    While the next unit costs less than the average, the average falls, and once it costs more, the average rises, so the pink line crosses the blue one at the bottom of the U.
  </p>
</div>

<style>
  .card {
    border: 2px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2rem 0;
    background: #fff;
  }
  .card-header {
    margin-bottom: 1.25rem;
  }
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 0.4rem;
  }
  .card-title {
    font-size: 1.3rem;
    font-weight: 800;
    margin: 0;
  }
  .card-sub {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    opacity: 0.85;
  }
  .toggle-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 700;
    border: 2px solid var(--squidink, #232f3e);
    background: transparent;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .toggle-btn:hover {
    background: var(--squidink, #232f3e);
    color: #fff;
  }
  .toggle-btn.active {
    background: var(--violet, #7c5aed);
    border-color: var(--violet, #7c5aed);
    color: #fff;
  }
  .svg-wrap {
    width: 100%;
    margin-bottom: 0.75rem;
  }
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 0;
  }
</style>
