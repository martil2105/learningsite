<script>
  /* ElasticityFigure.svelte - True elasticity vs textbook approximation */
  import { epsOf } from "../ces.js";

  let boxWidth = $state(600);
  let sigma = $state(4);

  const W = $derived(Math.max(320, Math.min(boxWidth, 700)));
  const H = 260;
  const M = { top: 25, right: 30, bottom: 40, left: 50 };

  const nMax = 15;
  const points = $derived.by(() => {
    const pts = [];
    for (let n = 2; n <= nMax; n++) {
      pts.push({ n, eps: epsOf(n, sigma) });
    }
    return pts;
  });

  const yMax = $derived(sigma * 1.15);

  function x(n) {
    return M.left + ((n - 2) / (nMax - 2)) * (W - M.left - M.right);
  }
  function y(e) {
    return H - M.bottom - (e / yMax) * (H - M.top - M.bottom);
  }

  const pathD = $derived.by(() => {
    return points.map((d, i) => `${i === 0 ? "M" : "L"} ${x(d.n)} ${y(d.eps)}`).join(" ");
  });
</script>

<div class="card">
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">The elasticity with n firms</h3>
    <p class="card-sub">
      Drag σ and watch the elasticity each firm faces climb towards it as we add firms.
    </p>
  </div>

  <div class="controls-bar">
    <label for="elasticity-sigma-slider" class="ctrl-label">
      Substitution (<em>&sigma;</em>): <strong>{sigma.toFixed(1)}</strong>
    </label>
    <input
      id="elasticity-sigma-slider"
      type="range"
      min="2"
      max="8"
      step="0.5"
      bind:value={sigma}
      class="slider"
    />
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="Elasticity vs firm count">
      <!-- Grid & axes -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- Textbook asymptote line -->
      <line
        x1={M.left}
        y1={y(sigma)}
        x2={W - M.right}
        y2={y(sigma)}
        stroke="#232f3e"
        stroke-dasharray="4 3"
        stroke-width="1.5"
      />
      <text x={W - M.right - 4} y={y(sigma) - 6} font-size="11" text-anchor="end" font-weight="bold" fill="#232f3e">
        large-group value, σ = {sigma.toFixed(1)}
      </text>

      <!-- Curve -->
      <path d={pathD} fill="none" stroke="#7c5aed" stroke-width="2.5" />

      <!-- Data points -->
      {#each points as pt}
        <circle cx={x(pt.n)} cy={y(pt.eps)} r="4" fill="#7c5aed" />
      {/each}

      <!-- Ticks -->
      {#each [2, 4, 6, 8, 10, 12, 14] as nVal}
        <text x={x(nVal)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">{nVal}</text>
      {/each}
      <text x={W - M.right} y={H - M.bottom - 6} font-size="11" text-anchor="end" fill="#232f3e">Firms (n)</text>

      <text x={M.left - 6} y={y(1)} font-size="11" text-anchor="end" fill="#232f3e">1.0</text>
      <text x={M.left - 6} y={y(sigma * 0.5)} font-size="11" text-anchor="end" fill="#232f3e">{(sigma * 0.5).toFixed(1)}</text>
      <text x={M.left - 6} y={y(sigma)} font-size="11" text-anchor="end" fill="#232f3e">{sigma.toFixed(1)}</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">Elasticity |&epsilon;|</text>
    </svg>
  </div>

  <p class="caption">
    The gap below σ is (σ − 1)/n, so it halves every time the number of firms doubles.
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
  .controls-bar {
    background: var(--paper, #f1f3f3);
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .ctrl-label {
    font-size: 0.85rem;
  }
  .slider {
    width: 100%;
    accent-color: var(--violet, #7c5aed);
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
