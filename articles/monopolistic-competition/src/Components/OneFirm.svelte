<script>
  /* OneFirm.svelte - Interactive demand & elasticity for a single CES variety */
  import { demandCES, C_DEFAULT } from "../ces.js";

  let boxWidth = $state(600);
  let pi = $state(1.35);
  let sigma = $state(4);
  let n = $state(5);
  let E = 1000;
  let f = 5;
  let c = C_DEFAULT;
  let p0 = 1.35; // competitor price

  const W = $derived(Math.max(320, Math.min(boxWidth, 700)));
  const H = 280;
  const M = { top: 25, right: 30, bottom: 40, left: 55 };

  // Calculate current point
  const currentPrices = $derived.by(() => {
    const arr = new Array(n).fill(p0);
    arr[0] = pi;
    return arr;
  });

  const qi = $derived(demandCES(currentPrices, 0, sigma, E));
  const share = $derived((pi * qi) / E);
  const eps = $derived(sigma - (sigma - 1) * share);
  const profit = $derived((pi - c) * qi - f);

  // Demand curve points over p in [1.05, 2.5]
  const pMin = 1.05;
  const pMax = 2.5;

  const curveData = $derived.by(() => {
    const pts = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const p = pMin + (i * (pMax - pMin)) / steps;
      const ps = new Array(n).fill(p0);
      ps[0] = p;
      const q = demandCES(ps, 0, sigma, E);
      pts.push({ p, q });
    }
    return pts;
  });

  const maxQ = $derived(Math.max(...curveData.map((d) => d.q), 1));

  function x(p) {
    return M.left + ((p - pMin) / (pMax - pMin)) * (W - M.left - M.right);
  }
  function y(q) {
    return H - M.bottom - (q / maxQ) * (H - M.top - M.bottom);
  }

  const pathD = $derived.by(() => {
    return curveData.map((d, i) => `${i === 0 ? "M" : "L"} ${x(d.p)} ${y(d.q)}`).join(" ");
  });
</script>

<div class="card">
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">One café's demand</h3>
    <p class="card-sub">
      Drag this café's price while the other <em>n</em> &minus; 1 cafés keep theirs at 1.35, and compare the elasticity with σ.
    </p>
  </div>

  <div class="controls-grid">
    <div class="ctrl-group">
      <label for="p-slider" class="ctrl-label">
        Price (<em>p</em><sub>i</sub>): <strong>{pi.toFixed(2)}</strong>
      </label>
      <input
        id="p-slider"
        type="range"
        min="1.05"
        max="2.5"
        step="0.01"
        bind:value={pi}
        class="slider"
      />
    </div>

    <div class="ctrl-group">
      <label for="sigma-slider" class="ctrl-label">
        Substitution (<em>&sigma;</em>): <strong>{sigma.toFixed(1)}</strong>
      </label>
      <input
        id="sigma-slider"
        type="range"
        min="1.5"
        max="8"
        step="0.5"
        bind:value={sigma}
        class="slider"
      />
    </div>

    <div class="ctrl-group">
      <label for="n-slider" class="ctrl-label">
        Firms (<em>n</em>): <strong>{n}</strong>
      </label>
      <input
        id="n-slider"
        type="range"
        min="2"
        max="20"
        step="1"
        bind:value={n}
        class="slider"
      />
    </div>
  </div>

  <div class="metrics-row">
    <div class="metric-box">
      <div class="metric-label">Sales (q<sub>i</sub>)</div>
      <div class="metric-val">{qi.toFixed(1)}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Share of spending (s<sub>i</sub>)</div>
      <div class="metric-val">{(100 * share).toFixed(1)}%</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Elasticity (|&epsilon;|)</div>
      <div class="metric-val highlight">{eps.toFixed(3)}</div>
      <div class="metric-sub">σ = {sigma.toFixed(1)}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Profit (&pi;)</div>
      <div class="metric-val" class:profit-pos={profit > 0} class:profit-neg={profit < 0}>
        {profit >= 0 ? "+" : "−"}{Math.abs(profit).toFixed(1)}
      </div>
    </div>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="CES demand curve">
      <!-- Grid lines -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- Demand curve -->
      <path d={pathD} fill="none" stroke="#7c5aed" stroke-width="3" />

      <!-- Current point -->
      <circle cx={x(pi)} cy={y(qi)} r="6" fill="#232f3e" stroke="#fff" stroke-width="2" />
      <line x1={x(pi)} y1={y(qi)} x2={x(pi)} y2={H - M.bottom} stroke="#232f3e" stroke-dasharray="3 3" />
      <line x1={M.left} y1={y(qi)} x2={x(pi)} y2={y(qi)} stroke="#232f3e" stroke-dasharray="3 3" />

      <!-- Axes ticks and labels -->
      <text x={x(1.2)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">1.20</text>
      <text x={x(1.6)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">1.60</text>
      <text x={x(2.0)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">2.00</text>
      <text x={x(2.4)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">2.40</text>
      <text x={W - M.right} y={H - M.bottom - 6} font-size="11" text-anchor="end" fill="#232f3e">Price, pᵢ</text>

      <text x={M.left - 8} y={y(maxQ * 0.9)} font-size="11" text-anchor="end" fill="#232f3e">{(maxQ * 0.9).toFixed(0)}</text>
      <text x={M.left - 8} y={y(maxQ * 0.5)} font-size="11" text-anchor="end" fill="#232f3e">{(maxQ * 0.5).toFixed(0)}</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">Quantity, qᵢ</text>
    </svg>
  </div>

  <p class="caption">
    As this café raises its price, its share of spending falls and its elasticity climbs towards σ. With fewer firms, each one has a bigger share, and the elasticity sits further below σ.
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
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0 0 0.4rem 0;
  }
  .card-sub {
    font-size: 0.95rem;
    color: var(--squidink, #232f3e);
    opacity: 0.8;
    margin: 0;
  }
  .controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1.25rem;
    background: var(--paper, #f1f3f3);
    padding: 1rem;
    border-radius: 4px;
  }
  .ctrl-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .ctrl-label {
    font-size: 0.85rem;
    color: var(--squidink, #232f3e);
  }
  .slider {
    width: 100%;
    accent-color: var(--violet, #7c5aed);
  }
  .metrics-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .metric-box {
    border: 1px solid var(--stone, #d4dada);
    padding: 0.75rem;
    border-radius: 4px;
    text-align: center;
  }
  .metric-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
    margin-bottom: 0.25rem;
  }
  .metric-val {
    font-family: monospace;
    font-size: 1.2rem;
    font-weight: 700;
  }
  .metric-val.highlight {
    color: var(--violet, #7c5aed);
  }
  .metric-sub {
    font-size: 0.75rem;
    opacity: 0.6;
    margin-top: 0.2rem;
  }
  .profit-pos {
    color: var(--blue, #2b6cb0);
  }
  .profit-neg {
    color: var(--crimson, #c53030);
  }
  .svg-wrap {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
    overflow-x: auto;
  }
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 0.75rem 0 0 0;
    border-top: 1px solid var(--stone, #d4dada);
    padding-top: 0.5rem;
  }
</style>
