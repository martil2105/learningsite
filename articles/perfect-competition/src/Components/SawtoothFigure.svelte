<script>
  /* SawtoothFigure.svelte: The Long-Run Supply Sawtooth and Zoom Interaction */
  import { linear, clampW } from "../chart.js";
  import { F, acMin, createMarket } from "../entry.js";

  let isZoomedIn = $state(true);
  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  const M = { top: 20, right: 24, bottom: 36, left: 52 };
  const height = 300;

  const B = 10;

  // Zoom extents
  let aMin = $derived(isZoomedIn ? 260 : 250);
  let aMax = $derived(isZoomedIn ? 420 : 2500);

  let pMinAxis = $derived(isZoomedIn ? 23.8 : 23.5);
  let pMaxAxis = $derived(isZoomedIn ? 25.4 : 26.5);

  let x = $derived(linear(aMin, aMax, M.left, W - M.right));
  let y = $derived(linear(pMinAxis, pMaxAxis, height - M.bottom, M.top));

  // Compute sawtooth path
  let sawtoothPath = $derived.by(() => {
    let pts = [];
    const step = isZoomedIn ? 1 : 10;
    for (let A = aMin; A <= aMax; A += step) {
      const m = createMarket(A, B);
      const nStar = m.nStar;
      if (nStar < 1) continue;
      const p = m.price(nStar);
      pts.push(`${pts.length === 0 ? "M" : "L"} ${x(A).toFixed(1)} ${y(p).toFixed(1)}`);
    }
    return pts.join(" ");
  });
</script>

<div class="card" id="sawtooth-figure">
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <div class="header-row">
      <h3 class="card-title">The long-run supply curve</h3>
      <div class="zoom-controls">
        <button
          type="button"
          class="btn-zoom"
          class:active={isZoomedIn}
          onclick={() => (isZoomedIn = true)}
        >
          Small markets
        </button>
        <button
          type="button"
          class="btn-zoom"
          class:active={!isZoomedIn}
          onclick={() => (isZoomedIn = false)}
        >
          Large markets
        </button>
      </div>
    </div>
    <p class="card-sub">
      {#if isZoomedIn}
        The long-run price as the size of demand, A, grows. In small markets the teeth are easy to see, and the price only touches the dashed line where a whole number of firms fits exactly.
      {:else}
        Across much larger markets the teeth get smaller and smaller, and the curve starts to look like a flat line.
      {/if}
    </p>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} {height} viewBox="0 0 {W} {height}" role="img" aria-label="Sawtooth long run supply curve">
      <!-- Grid & axes -->
      <line x1={M.left} y1={height - M.bottom} x2={W - M.right} y2={height - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={height - M.bottom} stroke="#d4dada" />

      <!-- Horizontal line at min AC -->
      <line
        class="min-ac-baseline"
        x1={M.left}
        y1={y(acMin)}
        x2={W - M.right}
        y2={y(acMin)}
        stroke="#df2a5d"
        stroke-dasharray="3 3"
        stroke-width="1.8"
      />
      <text x={W - M.right} y={y(acMin) + 14} text-anchor="end" fill="#df2a5d" font-size="11" font-weight="700">
        lowest AC = {acMin.toFixed(2)}
      </text>

      <!-- Sawtooth path -->
      <path class="curve sawtooth" d={sawtoothPath} fill="none" stroke="#232f3e" stroke-width="2" />

      <!-- Axis ticks -->
      {#if isZoomedIn}
        <text x={x(280)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">280</text>
        <text x={x(320)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">320</text>
        <text x={x(360)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">360</text>
        <text x={x(400)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">400</text>
      {:else}
        <text x={x(500)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">500</text>
        <text x={x(1000)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">1,000</text>
        <text x={x(1500)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">1,500</text>
        <text x={x(2000)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">2,000</text>
      {/if}
      <text x={W - M.right} y={height - 6} font-size="11" text-anchor="end" font-weight="700" fill="#232f3e">
        Size of demand, A
      </text>

      <text x={M.left - 8} y={y(24) + 4} font-size="11" text-anchor="end" fill="#232f3e">24.0</text>
      <text x={M.left - 8} y={y(24.5) + 4} font-size="11" text-anchor="end" fill="#232f3e">24.5</text>
      <text x={M.left - 8} y={y(25) + 4} font-size="11" text-anchor="end" fill="#232f3e">25.0</text>
      {#if !isZoomedIn}
        <text x={M.left - 8} y={y(26) + 4} font-size="11" text-anchor="end" fill="#232f3e">26.0</text>
      {/if}
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">
        Long-run price
      </text>
    </svg>
  </div>

  <p class="caption">
    Each tooth ends where demand has grown enough for one more firm to break even. It enters, and the price drops back towards the dashed line.
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
  .zoom-controls {
    display: flex;
    gap: 0.4rem;
  }
  .btn-zoom {
    padding: 0.35rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 700;
    border: 1px solid var(--squidink, #232f3e);
    background: transparent;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .btn-zoom.active {
    background: var(--squidink, #232f3e);
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
