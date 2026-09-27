<script>
  /* MarginalUserFigure.svelte - Front-loaded marginal damage per entrant */
  import { dissipatedRent } from "../commons.js";

  let boxWidth = $state(600);
  const W = $derived(Math.max(320, Math.min(boxWidth, 700)));
  const H = 240;
  const M = { top: 25, right: 30, bottom: 40, left: 55 };

  const bars = [];
  for (let n = 2; n <= 12; n++) {
    const dNow = dissipatedRent(n, 0.5);
    const dPrev = dissipatedRent(n - 1, 0.5);
    bars.push({ n, inc: (dNow - dPrev) * 100 });
  }

  const maxInc = 28;

  function x(n) {
    return M.left + ((n - 2) / (12 - 2)) * (W - M.left - M.right);
  }
  function y(val) {
    return H - M.bottom - (val / maxInc) * (H - M.top - M.bottom);
  }
</script>

<div class="card" bind:clientWidth={boxWidth}>
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">The Front-Loaded Damage</h3>
    <p class="card-sub">
      How much incremental resource rent does each new entrant destroy? The <strong>second user</strong> is the most destructive human in the entire commons.
    </p>
  </div>

  <div class="svg-wrap">
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="Incremental damage per entrant">
      <!-- Grid & axes -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- Bars -->
      {#each bars as b}
        {@const bw = Math.max(12, (W - M.left - M.right) / 16)}
        {@const bx = x(b.n) - bw / 2}
        {@const by = y(b.inc)}
        {@const bh = H - M.bottom - by}
        <rect
          x={bx}
          y={by}
          width={bw}
          height={bh}
          fill={b.n === 2 ? "#c53030" : "#7c5aed"}
          rx="2"
        />
        <text
          x={x(b.n)}
          y={by - 5}
          font-size="10"
          font-weight="bold"
          text-anchor="middle"
          fill={b.n === 2 ? "#c53030" : "#232f3e"}
        >
          {b.inc.toFixed(1)}%
        </text>
        <text x={x(b.n)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">
          #{b.n}
        </text>
      {/each}

      <text x={W - M.right} y={H - M.bottom - 6} font-size="11" text-anchor="end" fill="#232f3e">Entrant</text>
      <text x={M.left - 6} y={y(10)} font-size="11" text-anchor="end" fill="#232f3e">10%</text>
      <text x={M.left - 6} y={y(20)} font-size="11" text-anchor="end" fill="#232f3e">20%</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">Rent Destroyed (%)</text>
    </svg>
  </div>

  <p class="caption">
    <strong>Figure 4. The 25-point blow.</strong> Entrant #2 destroys 25.0% of total wealth. Entrant #3 destroys 19.4%, and entrant #4 destroys 11.8%. The second user alone inflicts more cumulative damage than entrants 6 through 13 combined (25.0% vs 21.2%).
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
