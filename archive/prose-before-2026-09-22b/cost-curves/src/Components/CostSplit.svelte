<script>
  /* CostSplit.svelte: Build-up 1 — Fixed and variable parts of total cost */
  import { linear, clampW } from "../chart.js";
  import { f, r, w, C } from "../cost.js";

  const kFixed = 100;
  let qVal = $state(20);
  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  const M = { top: 20, right: 24, bottom: 36, left: 54 };
  const height = 300;

  const Q_MAX = 40;
  const C_MAX = 850;

  let x = $derived(linear(0, Q_MAX, M.left, W - M.right));
  let y = $derived(linear(0, C_MAX, height - M.bottom, M.top));

  let fixedCost = $derived(f + r * kFixed);
  let variableCost = $derived((w * qVal * qVal * qVal) / kFixed);
  let totalCost = $derived(C(qVal, kFixed));

  // Path for total cost curve
  let totalPath = $derived.by(() => {
    let pts = [];
    for (let q = 0; q <= Q_MAX; q += 0.5) {
      pts.push(`${q === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(C(q, kFixed)).toFixed(1)}`);
    }
    return pts.join(" ");
  });

  // Path for variable cost curve (starting from 0)
  let variablePath = $derived.by(() => {
    let pts = [];
    for (let q = 0; q <= Q_MAX; q += 0.5) {
      const v = (w * q * q * q) / kFixed;
      pts.push(`${q === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(v).toFixed(1)}`);
    }
    return pts.join(" ");
  });
</script>

<div class="card" bind:clientWidth={boxWidth}>
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">Fixed and Variable Costs</h3>
    <p class="card-sub">
      Total cost splits into a fixed component ($F = {fixedCost}$) that must be paid regardless of volume, and a cubic variable component that rises sharply as plant capacity is strained.
    </p>
  </div>

  <div class="controls-bar">
    <label for="cost-q-slider" class="ctrl-label">
      Output (q): <strong>{qVal.toFixed(1)}</strong>
    </label>
    <input
      id="cost-q-slider"
      type="range"
      min="1"
      max="38"
      step="0.5"
      bind:value={qVal}
    />
  </div>

  <div class="readout-grid">
    <div class="readout-item">
      <span class="lbl">Fixed Cost</span>
      <span class="val font-mono">{fixedCost.toFixed(0)}</span>
      <span class="sub">licence + capital</span>
    </div>
    <div class="readout-item">
      <span class="lbl">Variable Cost</span>
      <span class="val font-mono text-pink">{variableCost.toFixed(1)}</span>
      <span class="sub">w·q³ / k</span>
    </div>
    <div class="readout-item highlight">
      <span class="lbl">Total Cost C(q)</span>
      <span class="val font-mono">{totalCost.toFixed(1)}</span>
      <span class="sub">fixed + variable</span>
    </div>
  </div>

  <div class="svg-wrap">
    <svg width={W} {height} viewBox="0 0 {W} {height}" role="img" aria-label="Total cost split chart">
      <!-- Grid & axes -->
      <line x1={M.left} y1={height - M.bottom} x2={W - M.right} y2={height - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={height - M.bottom} stroke="#d4dada" />

      <!-- Fixed cost horizontal line -->
      <line
        x1={M.left}
        y1={y(fixedCost)}
        x2={W - M.right}
        y2={y(fixedCost)}
        stroke="#8a94a2"
        stroke-dasharray="4 3"
        stroke-width="1.5"
      />
      <text x={W - M.right} y={y(fixedCost) - 6} text-anchor="end" fill="#8a94a2" font-size="11" font-weight="600">
        Fixed cost = {fixedCost}
      </text>

      <!-- Variable curve -->
      <path d={variablePath} fill="none" stroke="#df2a5d" stroke-width="2" stroke-dasharray="3 3" />

      <!-- Total cost curve -->
      <path class="curve total-cost" d={totalPath} fill="none" stroke="#232f3e" stroke-width="2.5" />

      <!-- Active output line & markers -->
      <line
        x1={x(qVal)}
        y1={height - M.bottom}
        x2={x(qVal)}
        y2={y(totalCost)}
        stroke="#7c5aed"
        stroke-width="1.5"
        stroke-dasharray="2 2"
      />
      <circle cx={x(qVal)} cy={y(totalCost)} r="5" fill="#232f3e" />
      <circle cx={x(qVal)} cy={y(fixedCost)} r="4" fill="#8a94a2" />

      <!-- Axis ticks & labels -->
      <text x={x(0)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">0</text>
      <text x={x(10)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">10</text>
      <text x={x(20)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">20</text>
      <text x={x(30)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">30</text>
      <text x={x(40)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">40</text>
      <text x={W - M.right} y={height - 6} font-size="11" text-anchor="end" font-weight="700" fill="#232f3e">
        Output, q
      </text>

      <text x={M.left - 8} y={y(0) + 4} font-size="11" text-anchor="end" fill="#232f3e">0</text>
      <text x={M.left - 8} y={y(200) + 4} font-size="11" text-anchor="end" fill="#232f3e">200</text>
      <text x={M.left - 8} y={y(400) + 4} font-size="11" text-anchor="end" fill="#232f3e">400</text>
      <text x={M.left - 8} y={y(600) + 4} font-size="11" text-anchor="end" fill="#232f3e">600</text>
      <text x={M.left - 8} y={y(800) + 4} font-size="11" text-anchor="end" fill="#232f3e">800</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">
        Cost, C(q)
      </text>
    </svg>
  </div>

  <p class="caption">
    <strong>Figure 1. The anatomy of short-run cost.</strong> Total cost (solid dark line) starts at fixed overhead ({fixedCost}) and curves upward as output rises. At small outputs, fixed overhead dominates; at large outputs, the variable term drives costs upward.
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
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .card-sub {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    opacity: 0.85;
  }
  .controls-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: var(--paper, #f1f3f3);
    margin-bottom: 1rem;
  }
  .ctrl-label {
    font-size: 0.85rem;
    font-weight: 600;
    min-width: 7rem;
  }
  input[type="range"] {
    flex: 1;
    accent-color: var(--violet, #7c5aed);
  }
  .readout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .readout-item {
    border: 1px solid #d4dada;
    padding: 0.6rem 0.8rem;
    display: flex;
    flex-direction: column;
  }
  .readout-item.highlight {
    border-color: var(--violet, #7c5aed);
    background: rgba(124, 90, 237, 0.05);
  }
  .lbl {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--squidink, #232f3e);
    opacity: 0.8;
  }
  .val {
    font-size: 1.3rem;
    font-weight: 800;
    margin: 0.2rem 0;
  }
  .text-pink {
    color: #df2a5d;
  }
  .sub {
    font-size: 0.75rem;
    opacity: 0.6;
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
