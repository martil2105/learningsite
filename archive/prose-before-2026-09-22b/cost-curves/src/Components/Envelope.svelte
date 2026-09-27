<script>
  /* Envelope.svelte: Build-up 3 — Short-run curves family on sequential ramp and the long-run lower envelope */
  import { linear, clampW } from "../chart.js";
  import { SRAC, LRAC, qMin, minLRAC } from "../cost.js";

  const plantSizes = [25, 50, 100, 200, 400, 800];
  const rampColors = ["#a79eea", "#8c82d2", "#7366b9", "#5b4ba1", "#45308a", "#311072"];

  let revealedCount = $state(6);
  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  const M = { top: 20, right: 24, bottom: 36, left: 50 };
  const height = 320;

  const Q_MAX = 60;
  const Y_MAX = 35;

  let x = $derived(linear(0, Q_MAX, M.left, W - M.right));
  let y = $derived(linear(0, Y_MAX, height - M.bottom, M.top));

  // Path for long-run lower envelope (LRAC)
  let lracPath = $derived.by(() => {
    let pts = [];
    for (let q = 4; q <= Q_MAX; q += 0.5) {
      const val = LRAC(q);
      if (val <= Y_MAX + 5) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  });

  // Paths for short-run curves
  function sracCurvePath(k) {
    let pts = [];
    for (let q = 2; q <= Q_MAX; q += 0.5) {
      const val = SRAC(q, k);
      if (val <= Y_MAX + 10) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  }
</script>

<div class="card" bind:clientWidth={boxWidth}>
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <div class="header-row">
      <h3 class="card-title">The Long-Run Lower Envelope</h3>
      <div class="reveal-controls">
        <span class="ctrl-tag">Plant family:</span>
        {#each plantSizes as k, i}
          <button
            type="button"
            class="pill-btn"
            class:active={revealedCount >= i + 1}
            onclick={() => (revealedCount = i + 1)}
          >
            k={k}
          </button>
        {/each}
      </div>
    </div>
    <p class="card-sub">
      In the long run, firms can adjust capital scale $k$. The long-run average cost curve (thick dark curve) forms the lower envelope of all short-run curves: for any target output $q$, it identifies the minimum possible unit cost by choosing the optimal plant size.
    </p>
  </div>

  <div class="svg-wrap">
    <svg width={W} {height} viewBox="0 0 {W} {height}" role="img" aria-label="Envelope of short-run cost curves">
      <!-- Grid & axes -->
      <line x1={M.left} y1={height - M.bottom} x2={W - M.right} y2={height - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={height - M.bottom} stroke="#d4dada" />

      <!-- Faint short-run family curves on sequential ramp -->
      {#each plantSizes.slice(0, revealedCount) as k, idx}
        <path
          class="curve srac faint"
          d={sracCurvePath(k)}
          fill="none"
          stroke={rampColors[idx]}
          stroke-width="1.8"
          stroke-opacity="0.85"
        />
        <text
          x={x(Math.min(Q_MAX - 3, Math.pow(k, 2/3) + 4))}
          y={y(SRAC(Math.min(Q_MAX - 3, Math.pow(k, 2/3) + 4), k)) - 6}
          font-size="10"
          font-weight="700"
          fill={rampColors[idx]}
        >
          k={k}
        </text>
      {/each}

      <!-- Long-run average cost (LRAC) lower envelope -->
      <path class="curve lrac" d={lracPath} fill="none" stroke="#232f3e" stroke-width="3" />

      <!-- Overall minimum point -->
      <circle class="dot lrac-min" cx={x(qMin)} cy={y(minLRAC)} r="5" fill="#232f3e" />
      <text x={x(qMin) + 8} y={y(minLRAC) + 14} font-size="11" font-weight="700" fill="#232f3e">
        Overall min LRAC = {minLRAC.toFixed(1)} (q = {qMin.toFixed(1)})
      </text>

      <!-- Labels & Ticks -->
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
        Average Cost
      </text>
    </svg>
  </div>

  <p class="caption">
    <strong>Figure 3. The lower envelope.</strong> Every short-run curve sits strictly on or above the thick black long-run curve. But look closely at where each short-run curve touches the envelope: does it touch at its own lowest point?
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
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .card-sub {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    opacity: 0.85;
  }
  .reveal-controls {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .ctrl-tag {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--squidink, #232f3e);
    opacity: 0.7;
    margin-right: 0.2rem;
  }
  .pill-btn {
    padding: 0.25rem 0.55rem;
    font-size: 0.75rem;
    font-weight: 700;
    border: 1px solid #d4dada;
    background: #fff;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .pill-btn.active {
    background: var(--squidink, #232f3e);
    color: #fff;
    border-color: var(--squidink, #232f3e);
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
