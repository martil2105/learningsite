<script>
  /*
    Subadditivity, as bars. For two positions A and B, each measure is shown
    twice: the two parts measured separately and added (grey), and the two
    held together (coloured). A coherent measure never has the coloured bar
    above the grey one. Two bonds break it for value at risk; two normal
    positions never do, at any correlation.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { pair } from "../risk.js";
  import { money, fixed } from "../format.js";

  let { width } = $props();
  let kind = $state("bonds");
  let rho = $state(0);
  let r = $derived(pair(kind, 0.95, rho));
  const H = 250, m = { top: 18, right: 12, bottom: 50, left: 50 };
  const Y = linear(0, 140, H - m.bottom, m.top);
  let inner = $derived(width - m.left - m.right);
  let bars = $derived([
    { key: "var-parts", group: 0, val: r.varA + r.varB, fill: "#8a94a2", label: "apart" },
    { key: "var-whole", group: 0, val: r.varAB, fill: "var(--c2)", label: "together" },
    { key: "es-parts", group: 1, val: r.esA + r.esB, fill: "#8a94a2", label: "apart" },
    { key: "es-whole", group: 1, val: r.esAB, fill: "var(--c1)", label: "together" },
  ]);
    const diff = (x) => (Math.abs(x) < 0.005 ? "$0.00" : (x > 0 ? "+" : "") + money(x, 2));

  let bw = $derived(Math.min(70, inner / 6));
  const gx = (g, j, inner, bw) => m.left + (inner / 2) * g + inner / 4 - bw - 4 + j * (bw + 8);
</script>

<div class="controls">
  <Segmented id="pf-kind" label="Two positions of $100" options={[{ value: "bonds", label: "Two bonds" }, { value: "normal", label: "Two normal losses" }]} bind:value={kind} />
  {#if kind === "normal"}
    <Slider id="pf-rho" label="Correlation" min={-1} max={1} step={0.1} bind:value={rho} format={(v) => fixed(+v, 1)} width={240} />
  {/if}
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Each measure for two positions apart and together" class="pair-panel">
  <AxisY scale={Y} ticks={[0, 20, 40, 60, 80, 100, 120, 140]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  {#each bars as b, i (b.key)}
    {@const x = gx(b.group, i % 2, inner, bw)}
    <rect class="bar {b.key}" x={x} width={bw} y={Y(b.val)} height={Y(0) - Y(b.val)} fill={b.fill} fill-opacity={b.fill === "#8a94a2" ? 0.55 : 0.9} />
    <text class="bar-label" x={x + bw / 2} y={Y(b.val) - 5} text-anchor="middle">{money(b.val, 0)}</text>
    <text class="tick-label" x={x + bw / 2} y={H - m.bottom + 16} text-anchor="middle">{b.label}</text>
  {/each}
  <text class="axis-title" x={m.left + inner / 4} y={H - 10} text-anchor="middle">value at risk</text>
  <text class="axis-title" x={m.left + (3 * inner) / 4} y={H - 10} text-anchor="middle">expected shortfall</text>
</svg>

<div class="readouts">
  <Readout id="pf-r-var" label="VaR: together minus apart" value={diff(r.varAB - r.varA - r.varB)} color="var(--c2)" />
  <Readout id="pf-r-es" label="ES: together minus apart" value={diff(r.esAB - r.esA - r.esB)} color="var(--c1)" />
</div>

<style>
  svg { display: block; }
  .bar-label { font-size: 12px; font-weight: 600; fill: var(--ink); }
</style>
