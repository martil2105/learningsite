<script>
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { portfolioVariance } from "../diversify.js";
  import { pct } from "../format.js";

  // The covariance matrix of an equal-weighted portfolio. Its variance is the
  // plain average of all n x n cells: n variances on the diagonal and n^2 - n
  // covariances off it.
  let { width, sigma, rho } = $props();
  let n = $state(6);
  let size = $derived(Math.min(width - 20, 360));
  let cell = $derived(size / n);
  const shade = (v, vmax) => `rgba(32, 116, 213, ${0.12 + 0.88 * Math.max(0, v) / vmax})`;
  let vmax = $derived(sigma * sigma);
</script>

<div class="controls">
  <Slider label="Stocks" id="cg-n" min={1} max={24} step={1} bind:value={n} width={220} />
</div>
<svg width={width} height={size + 8} role="img" aria-label="Covariance grid" class="cov-grid" viewBox="0 0 {width} {size + 8}">
  <g transform="translate({(width - size) / 2},4)">
    {#each Array.from({ length: n }) as _, i (i)}
      {#each Array.from({ length: n }) as __, j (j)}
        <rect class={i === j ? "var-cell" : "cov-cell"} x={j * cell} y={i * cell} width={cell - (n > 16 ? 0.5 : 1.5)} height={cell - (n > 16 ? 0.5 : 1.5)}
          fill={i === j ? "var(--c2)" : shade(rho * sigma * sigma, vmax)} />
      {/each}
    {/each}
  </g>
</svg>
<div class="readouts">
  <Readout id="cg-cells" label="Cells" value={`${n * n}: ${n} variances, ${n * n - n} covariances`} />
  <Readout id="cg-covshare" label="Share of cells that are covariances" value={pct(1 - 1 / n, 1)} />
  <Readout id="cg-var" label="Average cell, the portfolio variance" value={(portfolioVariance(n, sigma, rho)).toFixed(4)} />
  <Readout id="cg-vol" label="Its square root, the volatility" value={pct(Math.sqrt(portfolioVariance(n, sigma, rho)), 1)} />
</div>
