<script>
  /* TheLake.svelte - The efficient sole-owner benchmark */
  import { ap, mp, effEffort, effRent, output, rent } from "../commons.js";

  let boxWidth = $state(600);
  const W = $derived(Math.max(320, Math.min(boxWidth, 700)));
  const H = 260;
  const M = { top: 25, right: 30, bottom: 40, left: 55 };

  const maxE = 6000;
  const maxP = 3.0;

  function x(e) {
    return M.left + (e / maxE) * (W - M.left - M.right);
  }
  function y(p) {
    return H - M.bottom - (p / maxP) * (H - M.top - M.bottom);
  }

  const steps = 60;
  const apPts = [];
  const mpPts = [];
  for (let i = 1; i <= steps; i++) {
    const e = (i * maxE) / steps;
    apPts.push({ e, val: ap(e) });
    mpPts.push({ e, val: mp(e) });
  }

  const apPath = apPts.map((d, i) => `${i === 0 ? "M" : "L"} ${x(d.e)} ${y(d.val)}`).join(" ");
  const mpPath = mpPts.map((d, i) => `${i === 0 ? "M" : "L"} ${x(d.e)} ${y(d.val)}`).join(" ");
</script>

<div class="card" bind:clientWidth={boxWidth}>
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">The Efficient Baseline: Sole Ownership</h3>
    <p class="card-sub">
      A lake yields fish according to <em>F</em>(<em>E</em>) = 100&radic;<em>E</em>. Fishing labor costs $1.00 per hour.
    </p>
  </div>

  <div class="metrics-row">
    <div class="metric-box">
      <div class="metric-label">Efficient Effort (E*)</div>
      <div class="metric-val text-purple">2,500 hrs</div>
      <div class="metric-sub">Where MP(E) = $1.00</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Total Catch</div>
      <div class="metric-val">5,000 fish</div>
      <div class="metric-sub">Value: $5,000</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Total Labor Cost</div>
      <div class="metric-val">$2,500</div>
      <div class="metric-sub">2,500 hrs &times; $1.00</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Maximum Rent (R*)</div>
      <div class="metric-val text-green">$2,500</div>
      <div class="metric-sub">Pure resource wealth</div>
    </div>
  </div>

  <div class="svg-wrap">
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="Average vs Marginal Product curves">
      <!-- Grid & axes -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- Wage line w = 1.00 -->
      <line
        x1={M.left}
        y1={y(1.0)}
        x2={W - M.right}
        y2={y(1.0)}
        stroke="#232f3e"
        stroke-dasharray="3 3"
        stroke-width="1.5"
      />
      <text x={W - M.right - 4} y={y(1.0) - 6} font-size="11" text-anchor="end" fill="#232f3e">
        Wage (w = $1.00)
      </text>

      <!-- AP Curve -->
      <path d={apPath} fill="none" stroke="#2b6cb0" stroke-width="2.5" />
      <text x={x(5000)} y={y(ap(5000)) - 8} font-size="11" font-weight="bold" fill="#2b6cb0">
        Average Product (AP)
      </text>

      <!-- MP Curve -->
      <path d={mpPath} fill="none" stroke="#7c5aed" stroke-width="2.5" />
      <text x={x(3500)} y={y(mp(3500)) - 8} font-size="11" font-weight="bold" fill="#7c5aed">
        Marginal Product (MP)
      </text>

      <!-- E* point -->
      <circle cx={x(2500)} cy={y(1.0)} r="5" fill="#7c5aed" stroke="#fff" stroke-width="2" />
      <line x1={x(2500)} y1={y(1.0)} x2={x(2500)} y2={H - M.bottom} stroke="#7c5aed" stroke-dasharray="3 3" />
      <text x={x(2500)} y={H - M.bottom + 16} font-size="11" font-weight="bold" fill="#7c5aed" text-anchor="middle">
        E* = 2,500
      </text>

      <!-- Ticks -->
      <text x={x(0)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">0</text>
      <text x={x(4000)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">4,000</text>
      <text x={x(6000)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">6,000</text>
      <text x={W - M.right} y={H - M.bottom - 6} font-size="11" text-anchor="end" fill="#232f3e">Total Effort (E)</text>

      <text x={M.left - 6} y={y(1.0)} font-size="11" text-anchor="end" fill="#232f3e">$1.00</text>
      <text x={M.left - 6} y={y(2.0)} font-size="11" text-anchor="end" fill="#232f3e">$2.00</text>
      <text x={M.left - 6} y={y(3.0)} font-size="11" text-anchor="end" fill="#232f3e">$3.00</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">Return Per Hour ($)</text>
    </svg>
  </div>

  <p class="caption">
    <strong>Figure 1. The social optimum.</strong> A sole owner maximizes total profit by adding fishing hours until the last hour's catch equals the hourly wage (<em>MP</em> = $1.00 at <em>E*</em> = 2,500). At this point, the lake generates $2,500 of sustainable economic rent.
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
    background: #fafafa;
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
  .metric-val.text-purple {
    color: var(--violet, #7c5aed);
  }
  .metric-val.text-green {
    color: #2f855a;
  }
  .metric-sub {
    font-size: 0.75rem;
    opacity: 0.6;
    margin-top: 0.2rem;
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
