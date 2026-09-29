<script>
  /*
    One age at a time. Each dot is a payday still to come: how far it has
    followed a stock market surprise (up the page) against how many years away it
    is (along), sized by what it is worth today. The dashed line is the average
    over the dots, weighted by size, which is the loading of the whole stream.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath } from "../clip.js";
  import { START, END, R, phiOf, beta, betaH, shortAbove, share } from "../coint.js";
  import { pct, fixed, bigPct } from "../format.js";

  let { width, h = $bindable(5), g = $bindable(2), age = $bindable(25) } = $props();

  const HZ = END - START; // the furthest payday, 40 years away
  const H1 = 250;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  let phi = $derived(phiOf(h));
  let n = $derived(END - age);
  let x = $derived(linear([0, HZ], [m.left, width - m.right]));
  const yB = linear([0, 1], [H1 - m.bottom, m.top]);
  const grid = Array.from({ length: HZ * 4 + 1 }, (_, i) => i / 4);
  let allD = $derived(clippedPath(grid.map((s) => [s, beta(s, phi)]), x, yB, 0, 1));
  let leftD = $derived(clippedPath(grid.filter((s) => s <= n).map((s) => [s, beta(s, phi)]), x, yB, 0, 1));
  let dots = $derived(Array.from({ length: n }, (_, i) => {
    const s = i + 1;
    return { s, cx: x(s), cy: yB(beta(s, phi)), r: 6.5 * Math.sqrt(Math.pow(1 + R, -(s - 1))) };
  }));
  let bH = $derived(betaH(age, phi));
  let thr = $derived(shortAbove(age, g));
</script>

<div class="controls">
  <Slider label="Age" id="hz-age" min={START} max={END - 1} step={1} bind:value={age} format={(v) => `${v}`} width={200} />
  <Slider label="Half-life of the gap (years)" id="hz-h" min={2} max={20} step={0.5} bind:value={h} format={(v) => fixed(v, 1)} width={220} />
  <Segmented label="Risk aversion" id="hz-g" bind:value={g} options={[{ value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }]} />
</div>

<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="How far each payday still to come has followed a stock market surprise, by years until it is paid" class="horizon-panel">
  <AxisY scale={yB} ticks={[0, 0.25, 0.5, 0.75, 1]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="followed the surprise" />
  <AxisX scale={x} ticks={[0, 10, 20, 30, 40]} y={H1 - m.bottom} title="years until the payday" />
  <path class="curve-all" d={allD} fill="none" stroke="#c4c9d1" stroke-width="2" />
  <path class="curve-left" d={leftD} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  {#if thr <= 1}
    <line class="thresh" x1={m.left} x2={width - m.right} y1={yB(thr)} y2={yB(thr)} stroke="var(--ink)" stroke-width="2" stroke-dasharray="2 4" />
  {/if}
  <line class="average" x1={m.left} x2={width - m.right} y1={yB(bH)} y2={yB(bH)} stroke="var(--c1)" stroke-width="1.8" stroke-dasharray="7 4" />
  {#each dots as d (d.s)}
    <circle class="dot" cx={d.cx} cy={d.cy} r={d.r} fill="var(--c1)" fill-opacity="0.55" stroke="white" stroke-width="0.8" />
  {/each}
</svg>
<p class="legend">
  <span class="key"><span class="swatch dashed"></span>the average, weighted by what each payday is worth</span>
  <span class="key"><span class="swatch dotted"></span>above this, the rule holds no stock</span>
</p>

<div class="readouts">
  <Readout id="hz-r-n" label="Paydays left" value={`${n}`} />
  <Readout id="hz-r-load" label="Loading of future pay" value={pct(bH, 1)} color="var(--c1)" />
  <Readout id="hz-r-thr" label="Holds no stock above" value={thr > 1 ? "never" : pct(thr, 1)} />
  <Readout id="hz-r-share" label="Share of savings" value={bigPct(share(age, phi, g))} color="var(--c1)" />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--c1) 0 6px, transparent 6px 10px); }
  .swatch.dotted { background: repeating-linear-gradient(90deg, var(--ink) 0 2px, transparent 2px 5px); }
</style>
