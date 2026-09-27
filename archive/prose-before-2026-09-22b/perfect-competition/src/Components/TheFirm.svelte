<script>
  /* TheFirm.svelte: Setup — Single price-taking firm's cost curves */
  import { linear, clampW } from "../chart.js";
  import { F, c, d, acMin, qEfficient, acFirm, mcFirm } from "../entry.js";

  let pVal = $state(28);
  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  const M = { top: 20, right: 24, bottom: 36, left: 50 };
  const height = 300;

  const Q_MAX = 16;
  const P_MAX = 42;

  let x = $derived(linear(0, Q_MAX, M.left, W - M.right));
  let y = $derived(linear(0, P_MAX, height - M.bottom, M.top));

  let qChoice = $derived(Math.max(0, (pVal - c) / d));
  let acChoice = $derived(acFirm(qChoice));
  let profitChoice = $derived(Math.pow(pVal - c, 2) / (2 * d) - F);

  let acPath = $derived.by(() => {
    let pts = [];
    for (let q = 1.5; q <= Q_MAX; q += 0.25) {
      const val = acFirm(q);
      if (val <= P_MAX + 5) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  });

  let mcPath = $derived.by(() => {
    let pts = [];
    for (let q = 0.5; q <= Q_MAX; q += 0.5) {
      const val = mcFirm(q);
      if (val <= P_MAX + 5) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  });
</script>

<div class="card" bind:clientWidth={boxWidth}>
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">The Price-Taking Firm</h3>
    <p class="card-sub">
      Each firm faces cost <em>C</em>(<em>q</em>) = 50 + 10<em>q</em> + <em>q</em><sup>2</sup>. Efficient scale is <em>q</em><sub>e</sub> = {qEfficient.toFixed(2)}, where minimum average cost is min <em>AC</em> = {acMin.toFixed(2)}. When the market price exceeds this floor, the firm produces along its marginal cost curve and earns positive economic profit.
    </p>
  </div>

  <div class="controls-bar">
    <label for="firm-p-slider" class="ctrl-label">
      Market Price (p): <strong>{pVal.toFixed(1)}</strong>
    </label>
    <input
      id="firm-p-slider"
      type="range"
      min="20"
      max="38"
      step="0.5"
      bind:value={pVal}
    />
  </div>

  <div class="readout-grid">
    <div class="readout-item">
      <span class="lbl">Firm Output (q = (p-c)/d)</span>
      <span class="val font-mono text-purple">{qChoice.toFixed(2)}</span>
      <span class="sub">profit-maximising scale</span>
    </div>
    <div class="readout-item">
      <span class="lbl">Unit Cost (AC)</span>
      <span class="val font-mono">{acChoice.toFixed(2)}</span>
      <span class="sub">min AC = {acMin.toFixed(2)}</span>
    </div>
    <div class="readout-item highlight">
      <span class="lbl">Economic Profit (π)</span>
      <span class="val font-mono" class:text-pink={profitChoice < 0}>
        {profitChoice > 0 ? "+" : ""}{profitChoice.toFixed(2)}
      </span>
      <span class="sub">{profitChoice >= 0 ? "attracts entry" : "forces exit"}</span>
    </div>
  </div>

  <div class="svg-wrap">
    <svg width={W} {height} viewBox="0 0 {W} {height}" role="img" aria-label="Individual firm cost curves and market price">
      <!-- Grid & axes -->
      <line x1={M.left} y1={height - M.bottom} x2={W - M.right} y2={height - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={height - M.bottom} stroke="#d4dada" />

      <!-- Minimum AC reference line -->
      <line
        x1={M.left}
        y1={y(acMin)}
        x2={W - M.right}
        y2={y(acMin)}
        stroke="#8a94a2"
        stroke-dasharray="3 3"
        stroke-width="1.5"
      />
      <text x={W - M.right} y={y(acMin) - 5} text-anchor="end" fill="#8a94a2" font-size="11" font-weight="600">
        min AC = {acMin.toFixed(2)}
      </text>

      <!-- Cost curves -->
      <path class="curve ac" d={acPath} fill="none" stroke="#2074d5" stroke-width="2.5" />
      <path class="curve mc" d={mcPath} fill="none" stroke="#df2a5d" stroke-width="2.5" />

      <!-- Active price line -->
      <line
        x1={M.left}
        y1={y(pVal)}
        x2={W - M.right}
        y2={y(pVal)}
        stroke="#7c5aed"
        stroke-width="2"
      />
      <circle cx={x(qChoice)} cy={y(pVal)} r="5.5" fill="#7c5aed" />

      <!-- Curve labels -->
      <text x={x(13)} y={y(acFirm(13)) - 8} fill="#2074d5" font-size="11" font-weight="700">AC</text>
      <text x={x(12.5)} y={y(mcFirm(12.5)) - 8} fill="#df2a5d" font-size="11" font-weight="700">MC</text>
      <text x={x(1)} y={y(pVal) - 6} fill="#7c5aed" font-size="11" font-weight="700">p = {pVal.toFixed(1)}</text>

      <!-- Ticks -->
      <text x={x(0)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">0</text>
      <text x={x(4)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">4</text>
      <text x={x(8)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">8</text>
      <text x={x(12)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">12</text>
      <text x={x(16)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">16</text>
      <text x={W - M.right} y={height - 6} font-size="11" text-anchor="end" font-weight="700" fill="#232f3e">
        Firm output, q
      </text>

      <text x={M.left - 8} y={y(10) + 4} font-size="11" text-anchor="end" fill="#232f3e">10</text>
      <text x={M.left - 8} y={y(20) + 4} font-size="11" text-anchor="end" fill="#232f3e">20</text>
      <text x={M.left - 8} y={y(30) + 4} font-size="11" text-anchor="end" fill="#232f3e">30</text>
      <text x={M.left - 8} y={y(40) + 4} font-size="11" text-anchor="end" fill="#232f3e">40</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">
        Price &amp; cost
      </text>
    </svg>
  </div>

  <p class="caption">
    <strong>Figure 1. The firm's supply decision.</strong> A competitive price-taker produces where $p = MC$. If market price sits above minimum average cost ($p &gt; 24.14$), the firm earns excess profits, motivating new entrants to enter the industry.
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
    min-width: 9rem;
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
  .text-purple {
    color: var(--violet, #7c5aed);
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
