<script>
  /* MarginalCross.svelte: The Envelope Theorem — SRMC and LRMC cross at the tangency output */
  import { linear, clampW } from "../chart.js";
  import { SRMC, LRMC, qTangency, qCheapest, kStar } from "../cost.js";

  let presetChoice = $state(50); // Output target q = 50 or q = 15
  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  const M = { top: 20, right: 24, bottom: 36, left: 52 };
  const height = 300;

  const Q_MAX = 60;
  const Y_MAX = 35;

  let x = $derived(linear(0, Q_MAX, M.left, W - M.right));
  let y = $derived(linear(0, Y_MAX, height - M.bottom, M.top));

  let activeK = $derived(kStar(presetChoice));
  let qTan = $derived(qTangency(activeK));
  let qMin = $derived(qCheapest(activeK));
  let mcCrossingVal = $derived(LRMC(qTan));

  // LRMC path
  let lrmcPath = $derived.by(() => {
    let pts = [];
    for (let q = 0.5; q <= Q_MAX; q += 0.5) {
      const val = LRMC(q);
      if (val <= Y_MAX + 5) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  });

  // Active SRMC path
  let srmcPath = $derived.by(() => {
    let pts = [];
    for (let q = 1; q <= Q_MAX; q += 0.5) {
      const val = SRMC(q, activeK);
      if (val <= Y_MAX + 10) {
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
      <h3 class="card-title">Where the marginal costs cross</h3>
      <div class="btn-group">
        <button
          type="button"
          class="btn-tab"
          class:active={presetChoice === 15}
          onclick={() => (presetChoice = 15)}
        >
          Built for q = 15
        </button>
        <button
          type="button"
          class="btn-tab"
          class:active={presetChoice === 50}
          onclick={() => (presetChoice = 50)}
        >
          Built for q = 50
        </button>
      </div>
    </div>
    <p class="card-sub">
      For q = {presetChoice}, the best plant has k = {activeK.toFixed(1)}. Its short-run marginal cost (pink) crosses the long-run one (dark) at q = {qTan.toFixed(1)}, while the dashed blue line marks the plant's own cheapest output, q = {qMin.toFixed(1)}.
    </p>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} {height} viewBox="0 0 {W} {height}" role="img" aria-label="SRMC and LRMC crossing chart">
      <!-- Grid & axes -->
      <line x1={M.left} y1={height - M.bottom} x2={W - M.right} y2={height - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={height - M.bottom} stroke="#d4dada" />

      <!-- LRMC curve (dark) -->
      <path class="curve lrmc" d={lrmcPath} fill="none" stroke="#232f3e" stroke-width="2.5" />
      <!-- SRMC curve (pink) -->
      <path class="curve srmc active" d={srmcPath} fill="none" stroke="#df2a5d" stroke-width="2" />

      <!-- Vertical line at tangency / crossing -->
      <line
        x1={x(qTan)}
        y1={height - M.bottom}
        x2={x(qTan)}
        y2={y(mcCrossingVal)}
        stroke="#7c5aed"
        stroke-dasharray="3 3"
        stroke-width="1.5"
      />
      <circle class="dot marginal-crossing" cx={x(qTan)} cy={y(mcCrossingVal)} r="6" fill="#7c5aed" />

      <!-- Vertical marker at SRAC minimum for contrast -->
      <line
        x1={x(qMin)}
        y1={height - M.bottom}
        x2={x(qMin)}
        y2={M.top}
        stroke="#2074d5"
        stroke-dasharray="2 2"
        stroke-width="1"
        stroke-opacity="0.6"
      />

      <text x={x(qTan) - 10} y={y(mcCrossingVal) - 10} text-anchor="end" font-size="11" font-weight="700" fill="#7c5aed">
        cross at q = {qTan.toFixed(0)}
      </text>
      <text x={x(qMin) - 4} y={height - M.bottom - 10} text-anchor="end" font-size="10" font-weight="600" fill="#2074d5">
        cheapest ({qMin.toFixed(1)})
      </text>

      <!-- Curve labels -->
      <text x={x(8)} y={y(LRMC(8)) - 8} fill="#232f3e" font-size="11" font-weight="700">
        LRMC
      </text>
      <text x={x(qTan * 0.6)} y={y(SRMC(qTan * 0.6, activeK)) + 16} text-anchor="middle" fill="#df2a5d" font-size="11" font-weight="700">
        SRMC
      </text>

      <!-- Ticks -->
      <text x={x(0)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">0</text>
      <text x={x(15)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">15</text>
      <text x={x(30)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">30</text>
      <text x={x(45)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">45</text>
      <text x={x(60)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">60</text>
      <text x={W - M.right} y={height - 6} font-size="11" text-anchor="end" font-weight="700" fill="#232f3e">
        Output, q
      </text>

      <text x={M.left - 8} y={y(0) + 4} font-size="11" text-anchor="end" fill="#232f3e">0</text>
      <text x={M.left - 8} y={y(10) + 4} font-size="11" text-anchor="end" fill="#232f3e">10</text>
      <text x={M.left - 8} y={y(20) + 4} font-size="11" text-anchor="end" fill="#232f3e">20</text>
      <text x={M.left - 8} y={y(30) + 4} font-size="11" text-anchor="end" fill="#232f3e">30</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">
        Marginal cost
      </text>
    </svg>
  </div>

  <p class="caption">
    The firm is running the right plant away from that plant's own lowest cost. At the output it was built for, one more unit costs the same whether the plant can change or not.
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
  .btn-group {
    display: flex;
    gap: 0.4rem;
  }
  .btn-tab {
    padding: 0.35rem 0.7rem;
    font-size: 0.78rem;
    font-weight: 700;
    border: 1px solid var(--squidink, #232f3e);
    background: transparent;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .btn-tab.active {
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
