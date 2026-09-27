<script>
  /* TheLake.svelte: the efficient benchmark, a lake with one owner */
  import { ap, mp, effEffort, effRent, output, A_DEFAULT as A, W_DEFAULT as w } from "../commons.js";

  let boxWidth = $state(320);
  const W = $derived(Math.max(260, Math.min(boxWidth, 700)));
  const H = 260;
  const M = { top: 25, right: 16, bottom: 40, left: 48 };

  const maxE = 6000;
  const maxP = 3.0;
  const fmt = (v) => v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const Es = effEffort(); // 2500
  const Rs = effRent(); // 2500
  const fish = output(Es); // 5000

  const x = $derived((e) => M.left + (e / maxE) * (W - M.left - M.right));
  const y = (p) => H - M.bottom - (p / maxP) * (H - M.top - M.bottom);

  // Start each curve where it enters the chart, at a product of maxP.
  const eTop = (scale) => Math.pow(scale / maxP, 2);
  const curve = (f, e0) => {
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const e = e0 + (i * (maxE - e0)) / 80;
      pts.push(`${i === 0 ? "M" : "L"} ${x(e).toFixed(1)} ${y(f(e)).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const apPath = $derived(curve((e) => ap(e), eTop(A)));
  const mpPath = $derived(curve((e) => mp(e), eTop(A / 2)));
  const legendX = $derived(W - M.right - 150);
</script>

<div class="card" id="lake-figure">
  <div class="card-header">
    <h3 class="card-title">Where the owner stops</h3>
    <p class="card-sub">
      The owner adds hours until the next hour's catch is worth no more than
      the hour costs.
    </p>
  </div>

  <div class="metrics-row">
    <div class="metric-box">
      <div class="metric-label">Hours fished (E*)</div>
      <div class="metric-val text-purple" id="lake-hours">{fmt(Es)}</div>
      <div class="metric-sub">where MP = w</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Catch</div>
      <div class="metric-val">{fmt(fish)} fish</div>
      <div class="metric-sub">worth £{fmt(fish)}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Cost of time</div>
      <div class="metric-val">£{fmt(w * Es)}</div>
      <div class="metric-sub">{fmt(Es)} hours × £{w}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Rent (R*)</div>
      <div class="metric-val text-green" id="lake-rent">£{fmt(Rs)}</div>
      <div class="metric-sub">the most the lake can earn</div>
    </div>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="Average and marginal product of fishing, with the wage">
      <!-- Axes -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- Wage line -->
      <line class="wage" x1={M.left} y1={y(w)} x2={W - M.right} y2={y(w)} stroke="#232f3e" stroke-dasharray="3 3" stroke-width="1.5" />

      <!-- Curves -->
      <path class="ap-curve" d={apPath} fill="none" stroke="#2b6cb0" stroke-width="2.5" />
      <path class="mp-curve" d={mpPath} fill="none" stroke="#7c5aed" stroke-width="2.5" />

      <!-- E* -->
      <line x1={x(Es)} y1={y(w)} x2={x(Es)} y2={H - M.bottom} stroke="#7c5aed" stroke-dasharray="3 3" />
      <circle class="e-star" cx={x(Es)} cy={y(w)} r="5" fill="#7c5aed" stroke="#fff" stroke-width="2" />
      <text x={x(Es)} y={H - M.bottom + 16} font-size="11" font-weight="bold" fill="#7c5aed" text-anchor="middle">E* = {fmt(Es)}</text>

      <!-- Legend, in the empty top-right corner -->
      <line x1={legendX} y1={M.top + 1} x2={legendX + 14} y2={M.top + 1} stroke="#2b6cb0" stroke-width="2.5" />
      <text x={legendX + 20} y={M.top + 5} font-size="11" font-weight="bold" fill="#2b6cb0">Average product (AP)</text>
      <line x1={legendX} y1={M.top + 18} x2={legendX + 14} y2={M.top + 18} stroke="#7c5aed" stroke-width="2.5" />
      <text x={legendX + 20} y={M.top + 22} font-size="11" font-weight="bold" fill="#7c5aed">Marginal product (MP)</text>
      <line x1={legendX} y1={M.top + 35} x2={legendX + 14} y2={M.top + 35} stroke="#232f3e" stroke-width="1.5" stroke-dasharray="3 3" />
      <text x={legendX + 20} y={M.top + 39} font-size="11" fill="#232f3e">Wage (w = £{w})</text>

      <!-- Ticks -->
      <text x={x(0)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">0</text>
      <text x={x(4000)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">4,000</text>
      <text x={x(6000)} y={H - M.bottom + 16} font-size="11" text-anchor="end" fill="#232f3e">6,000</text>
      <text x={W - M.right} y={H - 5} font-size="11" text-anchor="end" fill="#232f3e">Hours fished (E)</text>

      {#each [1, 2, 3] as t}
        <text x={M.left - 6} y={y(t) + 4} font-size="11" text-anchor="end" fill="#232f3e">£{t}</text>
      {/each}
      <text x={M.left} y={M.top - 10} font-size="11" font-weight="700" fill="#232f3e">Catch per hour, in £</text>
    </svg>
  </div>

  <p class="caption">
    The owner stops where the purple curve meets the wage line. Notice that
    the blue curve, the average catch, is still well above the wage there.
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
    font-size: 0.8rem;
    font-weight: 700;
    opacity: 0.75;
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
    width: 100%;
    margin: 1rem 0;
  }
  .svg-wrap svg {
    display: block;
    margin: 0 auto;
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
