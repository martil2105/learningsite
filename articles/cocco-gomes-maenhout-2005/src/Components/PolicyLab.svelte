<script>
  /*
    The hook. A working life of a small model, solved backwards ahead of time:
    the share of savings in stocks by age for the median worker and a band of the
    middle 80% of 4,000 simulated workers, with the limit drawn as a dashed line,
    and under it the median worker's savings in years of pay.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath, clampedBand } from "../clip.js";
  import { AGES, START, LAST, RETIRE, get, medianAt, atCapAt, leavesLimit } from "../policy.js";
  import { pct, fixed } from "../format.js";

  let { width, g = $bindable(5), cap = $bindable(1), rho = $bindable(0) } = $props();

  const H1 = 260, H2 = 200;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  let e = $derived(get(g, cap, rho));
  let x = $derived(linear([START, LAST], [m.left, width - m.right]));
  const hi = 2.1;
  const yS = linear([0, hi], [H1 - m.bottom, m.top]);
  let medD = $derived(clippedPath(AGES.map((a, i) => [a, e.median[i]]), x, yS, 0, hi));
  let bandD = $derived(clampedBand(AGES, AGES.map((a, i) => e.p10[i]), AGES.map((a, i) => e.p90[i]), x, yS, 0, hi));
  let top = $derived(Math.max(5, Math.ceil(Math.max(...AGES.map((a, i) => e.wealth[i])) / 5) * 5));
  let yW = $derived(linear([0, top], [H2 - m.bottom, m.top]));
  let yWt = $derived(Array.from({ length: top / 5 + 1 }, (_, i) => 5 * i));
  let wealthD = $derived(clippedPath(AGES.map((a, i) => [a, e.wealth[i]]), x, yW, 0, top));
  const xt = [25, 35, 45, 55, 65, 75, 85];
  let leave = $derived(leavesLimit(e, cap));
</script>

<div class="controls">
  <Segmented label="Risk aversion" id="pl-g" bind:value={g} options={[{ value: 3, label: "3" }, { value: 5, label: "5" }, { value: 10, label: "10" }]} />
  <Segmented label="Limit on stocks" id="pl-cap" bind:value={cap} options={[{ value: 1, label: "No borrowing" }, { value: 2, label: "2 to 1" }]} />
  <Segmented label="Pay and stocks" id="pl-rho" bind:value={rho} options={[{ value: 0, label: "Unrelated" }, { value: 0.3, label: "Correlation 0.3" }]} />
</div>

<p class="panel-title">Share of savings in stocks, by age</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Share of savings in stocks by age for the median worker and the middle 80% of workers" class="share-panel">
  <AxisY scale={yS} ticks={[0, 0.5, 1, 1.5, 2]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="share of savings" />
  <AxisX scale={x} ticks={xt} y={H1 - m.bottom} title="age" />
  <line class="retire-line" x1={x(RETIRE)} x2={x(RETIRE)} y1={m.top} y2={H1 - m.bottom} stroke="var(--ink)" stroke-dasharray="2 3" opacity="0.5" />
  <path class="band" d={bandD} fill="var(--c1-soft)" />
  <line class="limit-line" x1={m.left} x2={width - m.right} y1={yS(cap)} y2={yS(cap)} stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="6 4" />
  <path class="median" d={medD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>the median worker</span>
  <span class="key"><span class="block" style="background:var(--c1-soft)"></span>the middle 80% of workers</span>
  <span class="key"><span class="swatch dashed"></span>the limit</span>
  <span class="key"><span class="swatch dotted"></span>retirement, at 65</span>
</p>

<p class="panel-title">The median worker's savings, in years of pay</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Median savings by age, in years of pay" class="wealth-panel">
  <AxisY scale={yW} ticks={yWt} x0={m.left} x1={width - m.right} title="years of pay" />
  <AxisX scale={x} ticks={xt} y={H2 - m.bottom} title="age" />
  <line class="retire-line" x1={x(RETIRE)} x2={x(RETIRE)} y1={m.top} y2={H2 - m.bottom} stroke="var(--ink)" stroke-dasharray="2 3" opacity="0.5" />
  <path class="wealth" d={wealthD} fill="none" stroke="var(--ink)" stroke-width="2.4" />
</svg>
<div class="readouts">
  <Readout id="pl-r-25" label="Median share at 25" value={pct(medianAt(e, 25), 0)} color="var(--c1)" />
  <Readout id="pl-r-45" label="Median share at 45" value={pct(medianAt(e, 45), 0)} color="var(--c1)" />
  <Readout id="pl-r-65" label="Median share at 65" value={pct(medianAt(e, 65), 0)} color="var(--c1)" />
  <Readout id="pl-r-cap45" label="At the limit at 45" value={pct(atCapAt(e, 45), 0)} />
  <Readout id="pl-r-leave" label="Median leaves the limit at" value={leave === null ? "never" : `${leave}`} />
  <Readout id="pl-r-w65" label="Median savings at 65 (years of pay)" value={fixed(e.wealth[65 - START], 1)} />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .block { display: inline-block; width: 14px; height: 10px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
  .swatch.dotted { background: repeating-linear-gradient(90deg, var(--ink) 0 2px, transparent 2px 5px); }
</style>
