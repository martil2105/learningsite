<script>
  import { log10Scale, linear, ticks, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { portfolioVol, floorVol, removedShare } from "../diversify.js";
  import { pct } from "../format.js";

  // Volatility of an equal-weighted portfolio against the number of stocks.
  let { width, sigma = $bindable(0.4), rho = $bindable(0.2), n = $bindable(10) } = $props();
  const height = 290;
  const m = { top: 16, right: 20, bottom: 46, left: 58 };
  let x = $derived(log10Scale([1, 100], [m.left, width - m.right]));
  const y = linear([0, 0.6], [height - m.bottom, m.top]);
  let curve = $derived(path(Array.from({ length: 121 }, (_, i) => { const k = Math.pow(100, i / 120); return [x(k), y(portfolioVol(k, sigma, rho))]; })));
  let dots = $derived([1, 2, 3, 5, 10, 20, 30, 50, 100].map((k) => ({ k, v: portfolioVol(k, sigma, rho) })));
  let fl = $derived(floorVol(sigma, rho));
</script>

<div class="controls">
  <Slider label="Volatility of each stock" id="rc-sigma" min={0.1} max={0.6} step={0.05} bind:value={sigma} format={(v) => pct(v, 0)} width={200} />
  <Slider label="Correlation between stocks" id="rc-rho" min={0} max={0.9} step={0.05} bind:value={rho} format={(v) => v.toFixed(2)} width={200} />
  <Slider label="Stocks in the portfolio" id="rc-n" min={1} max={100} step={1} bind:value={n} width={200} />
</div>
<svg {width} {height} role="img" aria-label="Portfolio volatility against number of stocks" class="risk-curve" viewBox="0 0 {width} {height}">
  <AxisY scale={y} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="portfolio volatility" />
  <AxisX scale={x} ticks={[1, 2, 5, 10, 20, 50, 100]} y={height - m.bottom} title="number of stocks (log scale)" />
  <rect class="floor-band" x={m.left} y={y(fl)} width={width - m.left - m.right} height={y(0) - y(fl)} fill="var(--c2-soft)" />
  <line class="floor-line" x1={m.left} x2={width - m.right} y1={y(fl)} y2={y(fl)} stroke="var(--c2)" stroke-dasharray="5 4" />
  <text x={width - m.right - 4} y={y(fl) + 16} text-anchor="end" font-size="11" fill="var(--c2)">floor {pct(fl, 1)}: risk no amount of stocks removes</text>
  <path class="risk-line" d={curve} fill="none" stroke="var(--c1)" stroke-width="2.2" />
  {#each dots as d (d.k)}<circle cx={x(d.k)} cy={y(d.v)} r="2.5" fill="var(--c1)" />{/each}
  <circle class="n-marker" cx={x(n)} cy={y(portfolioVol(n, sigma, rho))} r="6" fill="white" stroke="var(--c1)" stroke-width="2.2" />
</svg>
<div class="readouts">
  <Readout id="rc-vol" label={`Volatility with ${n} ${n === 1 ? "stock" : "stocks"}`} value={pct(portfolioVol(n, sigma, rho), 1)} color="var(--c1)" />
  <Readout id="rc-floor" label="Floor" value={pct(fl, 1)} color="var(--c2)" />
  <Readout id="rc-removed" label="Diversifiable variance removed" value={pct(removedShare(n), 1)} />
</div>
