<script>
  /* MarginalUserFigure.svelte: the extra share of the rent lost as each boat arrives */
  import { dissipatedRent } from "../commons.js";

  let boxWidth = $state(320);
  const W = $derived(Math.max(260, Math.min(boxWidth, 700)));
  const H = 240;
  const M = { top: 25, right: 16, bottom: 40, left: 40 };

  const bars = [];
  for (let n = 2; n <= 12; n++) {
    bars.push({ n, inc: (dissipatedRent(n, 0.5) - dissipatedRent(n - 1, 0.5)) * 100 });
  }

  const maxInc = 28;
  const step = $derived((W - M.left - M.right) / 11);
  const bw = $derived(Math.max(10, step * 0.6));
  const x = (n) => M.left + (n - 1.5) * step;
  const y = (val) => H - M.bottom - (val / maxInc) * (H - M.top - M.bottom);
  // On a phone the bars are too close for every value label, so only the
  // first few carry one there; the rest are read off the axis.
  const labelled = (n) => W >= 480 || n <= 5;
</script>

<div class="card" id="marginal-figure">
  <div class="card-header">
    <h3 class="card-title">Rent lost with each new boat</h3>
    <p class="card-sub">
      Each bar is the extra share of the rent that's lost when that boat
      arrives.
    </p>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="Share of the rent lost with each new boat">
      <!-- Axes -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- Bars -->
      {#each bars as b}
        <rect
          class="bar"
          data-n={b.n}
          x={x(b.n) - bw / 2}
          y={y(b.inc)}
          width={bw}
          height={H - M.bottom - y(b.inc)}
          fill={b.n === 2 ? "#c53030" : "#7c5aed"}
          rx="2"
        />
        {#if labelled(b.n)}
          <text
            class="bar-label"
            x={x(b.n)}
            y={y(b.inc) - 5}
            font-size="10"
            font-weight="bold"
            text-anchor="middle"
            fill={b.n === 2 ? "#c53030" : "#232f3e"}
          >
            {b.inc.toFixed(1)}
          </text>
        {/if}
        <text x={x(b.n)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">{b.n}</text>
      {/each}

      <text x={W - M.right} y={H - 5} font-size="11" text-anchor="end" fill="#232f3e">Boat number</text>
      {#each [10, 20] as t}
        <text x={M.left - 6} y={y(t) + 4} font-size="11" text-anchor="end" fill="#232f3e">{t}</text>
      {/each}
      <text x={M.left} y={M.top - 10} font-size="11" font-weight="700" fill="#232f3e">Share of the rent lost (points)</text>
    </svg>
  </div>

  <p class="caption">
    The red bar, the second boat, is the tallest, and each bar after it is
    shorter than the one before.
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
