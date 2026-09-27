<script>
  /* TwoPopulations.svelte - The crossing Lorenz curves */
  import { twoPointPop, giniCov, share, SOC_P, SOC_Q, lorenzTwo, lorenzCross } from "../inequality.js";

  let boxWidth = $state(300);
  const W = $derived(Math.max(260, Math.min(boxWidth, 700)));
  const H = 280;
  const M = { top: 25, right: 16, bottom: 40, left: 44 };

  const P = twoPointPop(SOC_P.p, SOC_P.a, SOC_P.b);
  const Q = twoPointPop(SOC_Q.p, SOC_Q.a, SOC_Q.b);

  const gP = giniCov(P);

  const pBottomP = share(P, 0.3, false) * 100;
  const pBottomQ = share(Q, 0.3, false) * 100;

  const pTopP = share(P, 0.15, true) * 100;
  const pTopQ = share(Q, 0.15, true) * 100;

  function x(p) {
    return M.left + p * (W - M.left - M.right);
  }
  function y(L) {
    return H - M.bottom - L * (H - M.top - M.bottom);
  }

  // Each curve is two straight pieces, with its kink where the income level changes.
  const pathP = $derived(`M ${x(0)} ${y(0)} L ${x(SOC_P.p)} ${y(lorenzTwo(SOC_P.p, SOC_P))} L ${x(1)} ${y(1)}`);
  const pathQ = $derived(`M ${x(0)} ${y(0)} L ${x(SOC_Q.p)} ${y(lorenzTwo(SOC_Q.p, SOC_Q))} L ${x(1)} ${y(1)}`);
  const crossY = lorenzTwo(lorenzCross, SOC_P);
</script>

<div class="card" id="two-populations">
  <div class="card-header">
    <h3 class="card-title">Same Gini, different societies</h3>
    <p class="card-sub">
      Both societies have a Gini of {gP.toFixed(4)}. Compare the two boxes under
      the chart: one looks at the poorest, the other at the richest.
    </p>
  </div>

  <div class="legend-row">
    <div class="legend-item">
      <span class="swatch blue"></span>
      <span><strong>Society P:</strong> 30% on £4k, 70% on £10k</span>
    </div>
    <div class="legend-item">
      <span class="swatch purple"></span>
      <span><strong>Society Q:</strong> 85% on £8k, 15% on £{SOC_Q.b.toFixed(1)}k</span>
    </div>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="Two Lorenz curves that cross">
      <!-- Grid & axes -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- 45-degree line of perfect equality -->
      <line
        class="equality"
        x1={x(0)}
        y1={y(0)}
        x2={x(1)}
        y2={y(1)}
        stroke="#a0aec0"
        stroke-dasharray="3 3"
      />
      <text x={x(0.42)} y={y(0.42) - 10} font-size="10" fill="#8a94a2" text-anchor="middle" transform="rotate({-Math.atan2(y(0) - y(1), x(1) - x(0)) * 180 / Math.PI}, {x(0.42)}, {y(0.42) - 10})">
        Line of equality
      </text>

      <path class="lorenz lorenz-p" d={pathP} fill="none" stroke="#2b6cb0" stroke-width="3" />
      <path class="lorenz lorenz-q" d={pathQ} fill="none" stroke="#7c5aed" stroke-width="3" />

      <circle class="cross-dot" cx={x(lorenzCross)} cy={y(crossY)} r="5" fill="#c53030" stroke="#fff" stroke-width="1.5" />
      <text x={x(lorenzCross) + 8} y={y(crossY) + 14} font-size="11" font-weight="bold" fill="#c53030">
        The curves cross
      </text>

      {#each [0, 0.2, 0.4, 0.6, 0.8, 1.0] as pVal}
        <text x={x(pVal)} y={H - M.bottom + 16} font-size="11" text-anchor={pVal === 1 ? "end" : "middle"} fill="#232f3e">
          {(pVal * 100).toFixed(0)}%
        </text>
        <text x={M.left - 6} y={y(pVal) + 4} font-size="11" text-anchor="end" fill="#232f3e">
          {(pVal * 100).toFixed(0)}%
        </text>
      {/each}
      <text x={W - M.right} y={H - M.bottom - 6} font-size="11" text-anchor="end" fill="#232f3e">Share of people, poorest first</text>
      <text x={M.left} y={M.top - 10} font-size="11" font-weight="700" fill="#232f3e">Share of income</text>
    </svg>
  </div>

  <div class="stats-split">
    <div class="split-col">
      <div class="split-tag">Poorest 30%'s share of income</div>
      <div class="split-val">
        P: <strong class="text-blue" id="bottom-p">{pBottomP.toFixed(1)}%</strong>, Q: <strong class="text-purple" id="bottom-q">{pBottomQ.toFixed(1)}%</strong>
      </div>
      <div class="split-sub">Q's poorest are better off.</div>
    </div>

    <div class="split-col">
      <div class="split-tag">Richest 15%'s share of income</div>
      <div class="split-val">
        P: <strong class="text-blue" id="top-p">{pTopP.toFixed(1)}%</strong>, Q: <strong class="text-purple" id="top-q">{pTopQ.toFixed(1)}%</strong>
      </div>
      <div class="split-sub">P's richest hold less.</div>
    </div>
  </div>

  <p class="caption">
    Left of the red dot, P's curve sags further below the line of equality, and
    to the right of it, Q's does. The two gaps enclose the same area, so the
    Gini can't tell the societies apart.
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
    gap: 0.5rem 1.25rem;
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
    flex-shrink: 0;
  }
  .blue {
    background: #2b6cb0;
  }
  .purple {
    background: #7c5aed;
  }
  .svg-wrap {
    margin: 1rem 0;
  }
  .svg-wrap svg {
    display: block;
    max-width: 100%;
    height: auto;
  }
  .stats-split {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    font-size: 0.8rem;
    font-weight: 700;
    opacity: 0.75;
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
