<script>
  import { log10Scale, linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { universe, beatProbability } from "../diversify.js";
  import { pct } from "../format.js";

  // 400 simulated stocks over 30 years, the rebalanced equal-weighted
  // portfolio of all of them, and the stock in the middle.
  let { width, sigma, rho } = $props();
  const N = 400, YEARS = 30, height = 320;
  const m = { top: 16, right: 20, bottom: 46, left: 58 };
  let seed = $state(11);
  let T = $state(30);
  let u = $derived(universe(seed, N, sigma, rho, YEARS));
  let x = $derived(linear([0, YEARS], [m.left, width - m.right]));
  const y = log10Scale([0.01, 1000], [height - m.bottom, m.top]);
  const clampY = (v) => y(Math.min(1000, Math.max(0.01, v)));
  let shown = $derived(u.paths.slice(0, 80));
  let finalsT = $derived(u.paths.map((p) => p[T]));
  let portT = $derived(u.port[T]);
  let ahead = $derived(finalsT.filter((w) => w > portT).length / N);
  let median = $derived([...finalsT].sort((a, b) => a - b)[N / 2]);
  let medianPath = $derived.by(() => Array.from({ length: YEARS + 1 }, (_, t) => [...u.paths.map((p) => p[t])].sort((a, b) => a - b)[N / 2]));
</script>

<div class="controls">
  <Slider label="Years" id="uf-T" min={1} max={30} step={1} bind:value={T} width={220} />
  <div class="seed">
    <span class="lab">Universe</span>
    <button type="button" id="uf-seed" onclick={() => (seed = (seed % 997) + 1)}>Draw another</button>
  </div>
</div>
<svg {width} {height} role="img" aria-label="Simulated stocks and their portfolio" class="universe-fan" viewBox="0 0 {width} {height}">
  <defs><clipPath id="uf-clip"><rect x={m.left} y={m.top} width={width - m.left - m.right} height={height - m.top - m.bottom} /></clipPath></defs>
  <AxisY scale={y} ticks={[0.01, 0.1, 1, 10, 100, 1000]} x0={m.left} x1={width - m.right} format={(v) => (v < 1 ? "×" + v : "×" + v)} title="value of $1 (log scale)" />
  <AxisX scale={x} ticks={[0, 10, 20, 30]} y={height - m.bottom} title="years" />
  <g clip-path="url(#uf-clip)">
    {#each shown as p, i (i)}
      <path d={path(p.slice(0, T + 1).map((v, t) => [x(t), clampY(v)]))} fill="none" stroke={p[T] > portT ? "var(--c3)" : "#9aa0ab"} stroke-width="0.8" opacity="0.55" />
    {/each}
    <path class="median-path" d={path(medianPath.slice(0, T + 1).map((v, t) => [x(t), clampY(v)]))} fill="none" stroke="var(--c5)" stroke-width="2" stroke-dasharray="5 3" />
    <path class="port-path" d={path(u.port.slice(0, T + 1).map((v, t) => [x(t), clampY(v)]))} fill="none" stroke="var(--c1)" stroke-width="3" />
  </g>
</svg>
<div class="readouts">
  <Readout id="uf-port" label={`Portfolio after ${T} ${T === 1 ? "year" : "years"}`} value={"×" + portT.toFixed(2)} color="var(--c1)" />
  <Readout id="uf-median" label="Middle stock" value={"×" + median.toFixed(2)} color="var(--c5)" />
  <Readout id="uf-ahead" label="Stocks ahead of the portfolio" value={pct(ahead, 1)} color="var(--c3)" />
  <Readout id="uf-formula" label="Formula's chance of being ahead" value={pct(beatProbability(sigma, rho, T), 1)} />
</div>

<style>
  .seed { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
  .lab { color: var(--muted); }
  button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; padding: 4px 12px; border-radius: 999px; cursor: pointer; }
</style>
