<script>
  /* ExcessCapacityFigure.svelte - Debunking the Chamberlin excess capacity myth */
  import { scaleDS, C_DEFAULT as c } from "../ces.js";

  let boxWidth = $state(600);
  let f = $state(5);
  let sigma = $state(4);

  const W = $derived(Math.max(320, Math.min(boxWidth, 700)));
  const H = 260;
  const M = { top: 25, right: 30, bottom: 40, left: 55 };

  const xMax = 40;
  const yMax = 4.0;

  function x(q) {
    return M.left + (q / xMax) * (W - M.left - M.right);
  }
  function y(p) {
    return H - M.bottom - (p / yMax) * (H - M.top - M.bottom);
  }

  // AC curve: AC(q) = f/q + c
  const acPoints = $derived.by(() => {
    const pts = [];
    for (let q = 1; q <= xMax; q += 0.5) {
      pts.push({ q, ac: f / q + c });
    }
    return pts;
  });

  const acPath = $derived.by(() => {
    return acPoints.map((d, i) => `${i === 0 ? "M" : "L"} ${x(d.q)} ${y(d.ac)}`).join(" ");
  });

  const xEquil = $derived(scaleDS(f, sigma, c)); // f * (sigma - 1) / c = 15
  const acEquil = $derived(f / xEquil + c); // 5/15 + 1 = 1.333
</script>

<div class="card">
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">Average cost with a fixed cost</h3>
    <p class="card-sub">
      Average cost for a firm with a fixed cost f and a constant marginal cost c, and the output each firm makes in the large-group market.
    </p>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="Average cost under fixed cost and constant marginal cost">
      <!-- Grid & axes -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- Asymptote c -->
      <line
        x1={M.left}
        y1={y(c)}
        x2={W - M.right}
        y2={y(c)}
        stroke="#232f3e"
        stroke-dasharray="3 3"
      />
      <text x={W - M.right - 4} y={y(c) - 6} font-size="11" text-anchor="end" fill="#232f3e">
        Marginal cost floor (c = ${c.toFixed(2)})
      </text>

      <!-- AC Curve -->
      <path d={acPath} fill="none" stroke="#7c5aed" stroke-width="2.5" />

      <!-- Equilibrium marker -->
      <circle cx={x(xEquil)} cy={y(acEquil)} r="5" fill="#232f3e" stroke="#fff" stroke-width="1.5" />
      <line x1={x(xEquil)} y1={y(acEquil)} x2={x(xEquil)} y2={H - M.bottom} stroke="#232f3e" stroke-dasharray="3 3" />
      <line x1={M.left} y1={y(acEquil)} x2={x(xEquil)} y2={y(acEquil)} stroke="#232f3e" stroke-dasharray="3 3" />

      <text x={x(xEquil)} y={y(acEquil) - 10} font-size="11" font-weight="bold" fill="#232f3e" text-anchor="middle">
        Equilibrium (x = {xEquil.toFixed(0)}, AC = ${acEquil.toFixed(2)})
      </text>

      <!-- Ticks -->
      {#each [10, 20, 30, 40] as qVal}
        <text x={x(qVal)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">{qVal}</text>
      {/each}
      <text x={W - M.right} y={H - M.bottom - 6} font-size="11" text-anchor="end" fill="#232f3e">Output (q)</text>

      <text x={M.left - 6} y={y(1)} font-size="11" text-anchor="end" fill="#232f3e">1.00</text>
      <text x={M.left - 6} y={y(2)} font-size="11" text-anchor="end" fill="#232f3e">2.00</text>
      <text x={M.left - 6} y={y(3)} font-size="11" text-anchor="end" fill="#232f3e">3.00</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">Average cost</text>
    </svg>
  </div>

  <p class="caption">
    Average cost falls towards c at every output, so there's no bottom of a U for the firm to fall short of.
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
