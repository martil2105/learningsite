<script>
  import { linear, path } from "../scale.js";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { meanSE } from "../mvo.js";
  import { pct, thousands } from "../format.js";

  // The spread of an estimated average return around the true one (5%).
  let { width } = $props();
  let years = $state(50);
  let sigma = $state(0.16);
  let freq = $state(12);
  const TRUE = 0.05, height = 230;
  const m = { top: 12, right: 16, bottom: 44, left: 16 };
  let x = $derived(linear([-0.1, 0.2], [m.left, width - m.right]));
  let se = $derived(meanSE(sigma, years));
  let peak = $derived(1 / (se * Math.sqrt(2 * Math.PI)));
  const ymax = 1 / (0.01 * Math.sqrt(2 * Math.PI));
  let y = $derived(linear([0, Math.min(ymax, Math.max(peak, 20))], [height - m.bottom, m.top]));
  let curve = $derived(path(Array.from({ length: 301 }, (_, i) => { const v = -0.1 + (0.3 * i) / 300; return [x(v), y(Math.exp(-0.5 * ((v - TRUE) / se) ** 2) * peak)]; })));
  let band = $derived([x(TRUE - se), x(TRUE + se)]);
</script>

<div class="controls">
  <Slider label="Years of data" id="mb-years" min={1} max={100} step={1} bind:value={years} width={220} />
  <Slider label="Volatility" id="mb-sigma" min={0.05} max={0.4} step={0.01} bind:value={sigma} format={(v) => pct(v, 0)} width={180} />
  <Segmented label="Observations" id="mb-freq" bind:value={freq} options={[{ value: 1, label: "Yearly" }, { value: 12, label: "Monthly" }, { value: 252, label: "Daily" }]} />
</div>
<svg {width} {height} role="img" aria-label="Spread of an estimated mean" class="blur-chart" viewBox="0 0 {width} {height}">
  <rect class="se-band" x={band[0]} y={m.top} width={band[1] - band[0]} height={height - m.bottom - m.top} fill="var(--c1-soft)" />
  <path d={curve} fill="none" stroke="var(--c1)" stroke-width="2" />
  <line x1={x(TRUE)} x2={x(TRUE)} y1={m.top} y2={height - m.bottom} stroke="var(--ink)" stroke-dasharray="3 3" />
  <line x1={m.left} x2={width - m.right} y1={height - m.bottom} y2={height - m.bottom} stroke="#c4c8d0" />
  {#each [-0.1, -0.05, 0, 0.05, 0.1, 0.15, 0.2].filter((t) => width > 500 || Math.round(t * 100) % 10 === 0) as t (t)}
    <text class="tick-label" x={x(t)} y={height - m.bottom + 16} text-anchor="middle">{(t < 0 ? "−" : "") + Math.abs(Math.round(t * 100))}%</text>
  {/each}
  <text class="axis-title" x={(m.left + width - m.right) / 2} y={height - 8} text-anchor="middle">estimated average return (true value 5%)</text>
</svg>
<div class="readouts">
  <Readout id="mb-se" label="Standard error" value={"±" + pct(se, 1)} color="var(--c1)" />
  <Readout id="mb-n" label="Observations used" value={thousands(years * freq)} />
  <Readout id="mb-need" label="Years for ±1 point" value={thousands((sigma / 0.01) ** 2)} />
</div>
