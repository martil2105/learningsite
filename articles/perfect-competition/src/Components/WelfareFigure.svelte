<script>
  /* WelfareFigure.svelte: Free entry vs social welfare optimum */
  import { linear, clampW } from "../chart.js";
  import { createMarket } from "../entry.js";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  const M = { top: 20, right: 24, bottom: 36, left: 45 };
  const height = 280;

  const B = 10;
  const A_MIN = 250;
  const A_MAX = 550;

  let x = $derived(linear(A_MIN, A_MAX, M.left, W - M.right));
  let y = $derived(linear(15, 45, height - M.bottom, M.top));

  // Compute step paths for free entry (nStar) and welfare optimal count
  let entryStepPath = $derived.by(() => {
    let pts = [];
    for (let A = A_MIN; A <= A_MAX; A += 4) {
      const m = createMarket(A, B);
      pts.push(`${pts.length === 0 ? "M" : "L"} ${x(A).toFixed(1)} ${y(m.nStar).toFixed(1)}`);
    }
    return pts.join(" ");
  });

  let welfareStepPath = $derived.by(() => {
    let pts = [];
    for (let A = A_MIN; A <= A_MAX; A += 4) {
      const m = createMarket(A, B);
      let bestW = -Infinity;
      let bestN = m.nStar;
      for (let k = Math.max(1, m.nStar - 5); k <= m.nStar + 5; k++) {
        const wVal = m.welfare(k);
        if (wVal > bestW) {
          bestW = wVal;
          bestN = k;
        }
      }
      pts.push(`${pts.length === 0 ? "M" : "L"} ${x(A).toFixed(1)} ${y(bestN).toFixed(1)}`);
    }
    return pts.join(" ");
  });
</script>

<div class="card" id="welfare-figure">
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">Free entry against a planner</h3>
    <p class="card-sub">
      The number of firms that free entry lets in, and the number a planner would choose, as the size of demand grows.
    </p>
  </div>

  <div class="legend-row">
    <div class="legend-item">
      <span class="swatch dark"></span>
      <span>Firms under free entry</span>
    </div>
    <div class="legend-item">
      <span class="swatch purple"></span>
      <span>The planner's choice</span>
    </div>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} {height} viewBox="0 0 {W} {height}" role="img" aria-label="Free entry vs welfare optimum step comparison">
      <!-- Grid & axes -->
      <line x1={M.left} y1={height - M.bottom} x2={W - M.right} y2={height - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={height - M.bottom} stroke="#d4dada" />

      <!-- Step curves -->
      <path class="curve welfare-step" d={welfareStepPath} fill="none" stroke="#7c5aed" stroke-width="2.5" stroke-dasharray="4 2" />
      <path class="curve entry-step" d={entryStepPath} fill="none" stroke="#232f3e" stroke-width="2" />

      <!-- Ticks -->
      <text x={x(300)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">300</text>
      <text x={x(400)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">400</text>
      <text x={x(500)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">500</text>
      <text x={W - M.right} y={height - 6} font-size="11" text-anchor="end" font-weight="700" fill="#232f3e">
        Size of demand, A
      </text>

      <text x={M.left - 8} y={y(20) + 4} font-size="11" text-anchor="end" fill="#232f3e">20</text>
      <text x={M.left - 8} y={y(30) + 4} font-size="11" text-anchor="end" fill="#232f3e">30</text>
      <text x={M.left - 8} y={y(40) + 4} font-size="11" text-anchor="end" fill="#232f3e">40</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">
        Firms
      </text>
    </svg>
  </div>

  <p class="caption">
    The dark line is never above the violet one, and it's never more than one firm below it.
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
  .card-title {
    font-size: 1.3rem;
    font-weight: 800;
    margin: 0 0 0.4rem 0;
  }
  .card-sub {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    opacity: 0.85;
  }
  .legend-row {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .swatch {
    width: 14px;
    height: 3px;
    display: inline-block;
  }
  .swatch.dark {
    background: #232f3e;
  }
  .swatch.purple {
    background: #7c5aed;
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
