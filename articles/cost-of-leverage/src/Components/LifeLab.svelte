<script>
  /*
    A working life with a borrowing spread. Top: the share of savings the rule
    asks for at each age, with the spread (solid) and without it (dashed), and
    the ages at which she sits at exactly 100% shaded. The readouts give the
    share at three ages and the ages at which the regime changes.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Readout from "./Readout.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import { clippedPath } from "../clip.js";
  import { lifeCurve, life, leverUntil, lendFrom, START, END } from "../kink.js";
  import { bigPct, fixed } from "../format.js";

  let { width, sp = $bindable(2), g = $bindable(1) } = $props();

  const H = 260, HI = 3.2;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  let x = $derived(linear([START, END], [m.left, width - m.right]));
  const y = linear([0, HI], [H - m.bottom, m.top]);
  let s = $derived(sp / 100);
  let ghost = $derived(clippedPath(lifeCurve(g, 0), x, y, 0, HI));
  let plan = $derived(clippedPath(lifeCurve(g, s), x, y, 0, HI));
  let borrowUntil = $derived(leverUntil(g, s));
  let lendAt = $derived(lendFrom(g, s));
  let pinned = $derived(lendAt - borrowUntil > 1e-6);
  const at = (age, spread) => life(age, g, spread).share;
  const age1 = (v) => (v <= START + 1e-6 ? "never" : fixed(v, 0));
</script>

<div class="controls">
  <Slider label="Spread over the safe rate, in points" id="lf-s" min={0} max={5} step={0.25} bind:value={sp} format={(v) => `${+(+v).toFixed(2)}`} width={220} />
  <Segmented label="Risk aversion" id="lf-g" bind:value={g} options={[{ value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }]} />
</div>

<p class="panel-title">Share of savings in stocks, by age</p>
<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Share of savings the rule asks for at each age, with and without a borrowing spread" class="life-panel">
  {#if pinned}
    <rect class="band" x={x(borrowUntil)} y={m.top} width={Math.max(0, x(lendAt) - x(borrowUntil))} height={H - m.bottom - m.top} fill="var(--c2-soft)" opacity="0.6" />
  {/if}
  <AxisY scale={y} ticks={[0, 1, 2, 3]} x0={m.left} x1={width - m.right} format={(v) => bigPct(v)} title="in stocks" />
  <AxisX scale={x} ticks={[25, 35, 45, 55, 65]} y={H - m.bottom} title="age" />
  <path class="ghost" d={ghost} fill="none" stroke="var(--ink)" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="6 4" />
  <path class="plan" d={plan} fill="none" stroke="var(--c1)" stroke-width="2.8" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch dashed"></span>borrowing at the safe rate</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>paying the spread</span>
  <span class="key"><span class="block" style="background:var(--c2-soft)"></span>held at exactly 100%</span>
</p>

<div class="readouts">
  <Readout id="lf-r-25" label="Share at 25" value={bigPct(at(25, s))} color="var(--c1)" />
  <Readout id="lf-r-25-free" label="Share at 25, at the safe rate" value={bigPct(at(25, 0))} />
  <Readout id="lf-r-45" label="Share at 45" value={bigPct(at(45, s))} color="var(--c1)" />
  <Readout id="lf-r-65" label="Share at 65" value={bigPct(at(65, s))} />
  <Readout id="lf-r-lever" label="Borrows until age" value={age1(borrowUntil)} />
  <Readout id="lf-r-lend" label="Lends from age" value={lendAt >= END - 1e-6 ? "never" : fixed(lendAt, 0)} />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .block { display: inline-block; width: 14px; height: 10px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); opacity: 0.6; }
</style>
