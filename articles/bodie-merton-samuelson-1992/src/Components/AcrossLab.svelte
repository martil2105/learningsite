<script>
  /*
    The gap between the two workers at every level of savings. Top: the stock
    dollars each holds, in years of pay, up to the savings at which a worker
    who spends evenly stops working. Bottom: the hours both of them work today.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath } from "../clip.js";
  import { today, retireAt } from "../flex.js";
  import { pct, fixed } from "../format.js";

  let { width, a = $bindable(0.5), g = $bindable(2), W = $bindable(1), n = $bindable(30) } = $props();

  const H1 = 230, H2 = 190, WMAX = 25;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  const ws = Array.from({ length: 251 }, (_, i) => i / 10);
  let x = $derived(linear([0, WMAX], [m.left, width - m.right]));
  let corner = $derived(retireAt(a, n));
  const at = (w) => today({ a, g, W: w, n });
  // the window grows to hold the flexible worker's line, in steps of ten years of pay
  let live = $derived(ws.filter((w) => !at(w).retired));
  let top = $derived(Math.max(20, Math.ceil(Math.max(...live.map((w) => at(w).flex)) / 10) * 10));
  let yS = $derived(linear([0, top], [H1 - m.bottom, m.top]));
  let yTicks = $derived(Array.from({ length: top / 10 + 1 }, (_, i) => 10 * i));
  let flexD = $derived(clippedPath(live.map((w) => [w, at(w).flex]), x, yS, 0, top));
  let fixedD = $derived(clippedPath(live.map((w) => [w, at(w).fixed]), x, yS, 0, top));
  const yH = linear([0, 1], [H2 - m.bottom, m.top]);
  let hoursD = $derived(clippedPath(live.map((w) => [w, at(w).hours]), x, yH, 0, 1));
  let now = $derived(at(W));
  const xt = [0, 5, 10, 15, 20, 25];
  let showCorner = $derived(corner <= WMAX);
</script>

<div class="controls">
  <Slider label="Savings (years of pay)" id="ac-w" min={0} max={WMAX} step={0.5} bind:value={W} format={(v) => fixed(v, 1)} width={200} />
  <Segmented label="Years of work left" id="ac-n" bind:value={n}
    options={[{ value: 10, label: "10" }, { value: 20, label: "20" }, { value: 30, label: "30" }, { value: 40, label: "40" }]} />
  <Slider label="Weight on consumption" id="ac-a" min={0.4} max={0.8} step={0.05} bind:value={a} format={(v) => v.toFixed(2)} width={170} />
  <Slider label="Risk aversion" id="ac-g" min={1.5} max={10} step={0.5} bind:value={g} format={(v) => fixed(v, 1)} width={170} />
</div>

<p class="panel-title">Stocks each worker holds, in years of pay</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Stock dollars held by a flexible and a fixed-hours worker at each level of savings" class="stock-panel">
  <AxisY scale={yS} ticks={yTicks} x0={m.left} x1={width - m.right} title="years of pay" />
  <AxisX scale={x} ticks={xt} y={H1 - m.bottom} title="savings, in years of pay" />
  {#if showCorner}
    <line class="corner" x1={x(corner)} x2={x(corner)} y1={m.top} y2={H1 - m.bottom} stroke="var(--ink)" stroke-dasharray="3 3" opacity="0.6" />
    <text class="corner-label" x={x(corner) - 5} y={m.top + 11} text-anchor="end">retires</text>
  {/if}
  <path class="stock flex" d={flexD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="stock fixed" d={fixedD} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  {#if !now.retired}
    <line class="w-marker" x1={x(W)} x2={x(W)} y1={m.top} y2={H1 - m.bottom} stroke="var(--ink)" opacity="0.5" />
    <circle class="dot stock-flex" cx={x(W)} cy={yS(now.flex)} r="4.5" fill="var(--c1)" stroke="#fff" stroke-width="1.5" />
    <circle class="dot stock-fixed" cx={x(W)} cy={yS(now.fixed)} r="4.5" fill="var(--c2)" stroke="#fff" stroke-width="1.5" />
  {/if}
</svg>

<p class="panel-title">Hours both of them work today, as a share of full time</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Hours worked today at each level of savings" class="hours-panel">
  <AxisY scale={yH} ticks={[0, 0.25, 0.5, 0.75, 1]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="hours" />
  <AxisX scale={x} ticks={xt} y={H2 - m.bottom} title="savings, in years of pay" />
  {#if showCorner}
    <line class="corner" x1={x(corner)} x2={x(corner)} y1={m.top} y2={H2 - m.bottom} stroke="var(--ink)" stroke-dasharray="3 3" opacity="0.6" />
  {/if}
  <path class="hours both" d={hoursD} fill="none" stroke="var(--ink)" stroke-width="2.4" />
  {#if !now.retired}
    <line class="w-marker" x1={x(W)} x2={x(W)} y1={m.top} y2={H2 - m.bottom} stroke="var(--ink)" opacity="0.5" />
    <circle class="dot hours-both" cx={x(W)} cy={yH(now.hours)} r="4.5" fill="var(--ink)" stroke="#fff" stroke-width="1.5" />
  {/if}
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>the worker who can change her hours</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>the worker stuck with hers</span>
</p>
<div class="readouts">
  <Readout id="ac-r-flex" label="Stocks held, flexible (years of pay)" value={now.retired ? "retired" : fixed(now.flex, 1)} color="var(--c1)" />
  <Readout id="ac-r-fixed" label="Stocks held, fixed (years of pay)" value={now.retired ? "retired" : fixed(now.fixed, 1)} color="var(--c2)" />
  <Readout id="ac-r-ratio" label="Flexible ÷ fixed" value={now.retired ? "retired" : fixed(now.ratio, 2)} />
  <Readout id="ac-r-hours" label="Hours today" value={now.retired ? "0%" : pct(now.hours, 0)} />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .corner-label { font-size: 11px; stroke: #fff; stroke-width: 3px; paint-order: stroke; }
</style>
