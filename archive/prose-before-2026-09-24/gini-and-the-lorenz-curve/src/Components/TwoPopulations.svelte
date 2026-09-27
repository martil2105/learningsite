<script>
  /* TwoPopulations.svelte - The crossing Lorenz curves */
  import { twoPointPop, giniCov, share } from "../inequality.js";

  let boxWidth = $state(600);
  const W = $derived(Math.max(320, Math.min(boxWidth, 700)));
  const H = 280;
  const M = { top: 25, right: 30, bottom: 40, left: 50 };

  const P = twoPointPop(0.3, 4, 10);
  const Q = twoPointPop(0.85, 8, 19.7688);

  const gP = giniCov(P); // 0.1537
  const gQ = giniCov(Q); // 0.1537

  const pBottomP = share(P, 0.3, false) * 100; // 14.63%
  const pBottomQ = share(Q, 0.3, false) * 100; // 24.58%

  const pTopP = share(P, 0.15, true) * 100; // 18.29%
  const pTopQ = share(Q, 0.15, true) * 100; // 30.37%

  function x(p) {
    return M.left + p * (W - M.left - M.right);
  }
  function y(L) {
    return H - M.bottom - L * (H - M.top - M.bottom);
  }

  // Curve P: two linear segments from (0,0) to (0.30, 0.1463) to (1,1)
  const pathP = `M ${x(0)} ${y(0)} L ${x(0.3)} ${y(0.1463)} L ${x(1)} ${y(1)}`;

  // Curve Q: two linear segments from (0,0) to (0.85, 0.6963) to (1,1)
  const pathQ = `M ${x(0)} ${y(0)} L ${x(0.85)} ${y(0.6963)} L ${x(1)} ${y(1)}`;
</script>

<div class="card" bind:clientWidth={boxWidth}>
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">The Crossing: Same Gini, Opposite Worlds</h3>
    <p class="card-sub">
      Two societies with the exact same Gini coefficient of <strong>{gP.toFixed(4)}</strong> can have completely contradictory social realities.
    </p>
  </div>

  <div class="legend-row">
    <div class="legend-item">
      <span class="swatch blue"></span>
      <span><strong>Society P:</strong> 30% at $4k, 70% at $10k (Inequality at the bottom)</span>
    </div>
    <div class="legend-item">
      <span class="swatch purple"></span>
      <span><strong>Society Q:</strong> 85% at $8k, 15% at $19.8k (Inequality at the top)</span>
    </div>
  </div>

  <div class="svg-wrap">
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="Crossing Lorenz curves">
      <!-- Grid & axes -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- 45-degree line of perfect equality -->
      <line
        x1={x(0)}
        y1={y(0)}
        x2={x(1)}
        y2={y(1)}
        stroke="#a0aec0"
        stroke-dasharray="3 3"
      />
      <text x={x(0.5)} y={y(0.5) - 10} font-size="10" fill="#a0aec0" text-anchor="middle" transform="rotate(-30, {x(0.5)}, {y(0.5)})">
        Line of perfect equality (45°)
      </text>

      <!-- Curve P -->
      <path d={pathP} fill="none" stroke="#2b6cb0" stroke-width="3" />

      <!-- Curve Q -->
      <path d={pathQ} fill="none" stroke="#7c5aed" stroke-width="3" />

      <!-- The Crossing Point annotation -->
      <circle cx={x(0.56)} cy={y(0.43)} r="5" fill="#c53030" stroke="#fff" stroke-width="1.5" />
      <text x={x(0.56) + 8} y={y(0.43) + 4} font-size="11" font-weight="bold" fill="#c53030">
        Curves Cross Here
      </text>

      <!-- Ticks -->
      {#each [0, 0.2, 0.4, 0.6, 0.8, 1.0] as pVal}
        <text x={x(pVal)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">
          {(pVal * 100).toFixed(0)}%
        </text>
        <text x={M.left - 6} y={y(pVal)} font-size="11" text-anchor="end" fill="#232f3e">
          {(pVal * 100).toFixed(0)}%
        </text>
      {/each}
      <text x={W - M.right} y={H - M.bottom - 6} font-size="11" text-anchor="end" fill="#232f3e">Cumulative Population</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">Cumulative Income Share</text>
    </svg>
  </div>

  <div class="stats-split">
    <div class="split-col">
      <div class="split-tag">Bottom 30% Income Share</div>
      <div class="split-val">
        Society P: <strong class="text-blue">{pBottomP.toFixed(1)}%</strong> vs Society Q: <strong class="text-purple">{pBottomQ.toFixed(1)}%</strong>
      </div>
      <div class="split-sub">Society Q protects its poorest citizens far better.</div>
    </div>

    <div class="split-col">
      <div class="split-tag">Top 15% Income Share</div>
      <div class="split-val">
        Society P: <strong class="text-blue">{pTopP.toFixed(1)}%</strong> vs Society Q: <strong class="text-purple">{pTopQ.toFixed(1)}%</strong>
      </div>
      <div class="split-sub">Society P has far less elite concentration at the top.</div>
    </div>
  </div>

  <p class="caption">
    <strong>Figure 1. When Lorenz curves cross.</strong> Because the area between each curve and the 45-degree line is identical, both distributions have G = 0.1537. But is Society P better than Society Q? That depends entirely on whether your ethical concern is eliminating poverty or curbing extreme wealth.
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
  .legend-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    margin-bottom: 1rem;
    font-size: 0.85rem;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 2px;
  }
  .blue {
    background: #2b6cb0;
  }
  .purple {
    background: #7c5aed;
  }
  .svg-wrap {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
    overflow-x: auto;
  }
  .stats-split {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  .split-col {
    border: 1px solid var(--stone, #d4dada);
    padding: 0.85rem;
    border-radius: 4px;
    background: #fafafa;
  }
  .split-tag {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
    margin-bottom: 0.35rem;
  }
  .split-val {
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }
  .split-sub {
    font-size: 0.8rem;
    opacity: 0.7;
  }
  .text-blue {
    color: #2b6cb0;
  }
  .text-purple {
    color: var(--violet, #7c5aed);
  }
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 1rem 0 0 0;
    border-top: 1px solid var(--stone, #d4dada);
    padding-top: 0.5rem;
  }
</style>
