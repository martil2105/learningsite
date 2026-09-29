<script>
  /*
    The hook. Top: the share of savings the rule asks for at each age when pay
    follows dividends with a lag, against the rule for pay that is as safe as a
    bond (dashed). Bottom: how much of future pay behaves like stock (the
    loading), against the level above which the rule says to hold none.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath } from "../clip.js";
  import { AGES, START, END, phiOf, share, shareBond, betaH, shortAbove, peakAge } from "../coint.js";
  import { pct, fixed, bigPct } from "../format.js";

  let { width, h = $bindable(5), g = $bindable(2) } = $props();

  const H1 = 260, H2 = 190;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  let phi = $derived(phiOf(h));
  let x = $derived(linear([START, END], [m.left, width - m.right]));
  const lo = -2, hi = 3;
  const yS = linear([lo, hi], [H1 - m.bottom, m.top]);
  let shareD = $derived(clippedPath(AGES.map((a) => [a, share(a, phi, g)]), x, yS, lo, hi));
  let bondD = $derived(clippedPath(AGES.map((a) => [a, shareBond(a, g)]), x, yS, lo, hi));
  const yB = linear([0, 1], [H2 - m.bottom, m.top]);
  let loadD = $derived(clippedPath(AGES.map((a) => [a, betaH(a, phi)]), x, yB, 0, 1));
  let threshD = $derived(clippedPath(AGES.map((a) => [a, shortAbove(a, g)]), x, yB, 0, 1));
  const xt = [25, 35, 45, 55, 65];
  let peak = $derived(peakAge(phi, g));
</script>

<div class="controls">
  <Slider label="Half-life of the gap (years)" id="hl-h" min={2} max={20} step={0.5} bind:value={h} format={(v) => fixed(v, 1)} width={220} />
  <Segmented label="Risk aversion" id="hl-g" bind:value={g} options={[{ value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }]} />
</div>

<p class="panel-title">Share of savings in stocks, by age</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Share of savings in stocks by age, when pay follows dividends with a lag and when pay is as safe as a bond" class="share-panel">
  <AxisY scale={yS} ticks={[-2, -1, 0, 1, 2, 3]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="share of savings" />
  <AxisX scale={x} ticks={xt} y={H1 - m.bottom} title="age" />
  <line class="zero-line" x1={m.left} x2={width - m.right} y1={yS(0)} y2={yS(0)} stroke="var(--ink)" stroke-width="1" opacity="0.6" />
  <path class="bond" d={bondD} fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 4" />
  <path class="coint" d={shareD} fill="none" stroke="var(--c1)" stroke-width="2.6" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>pay follows dividends with a lag</span>
  <span class="key"><span class="swatch dashed"></span>pay as safe as a bond</span>
</p>

<p class="panel-title">How much of our future pay behaves like stock</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The loading of future pay on stocks by age, and the level above which the rule holds no stock" class="load-panel">
  <AxisY scale={yB} ticks={[0, 0.25, 0.5, 0.75, 1]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="loading" />
  <AxisX scale={x} ticks={xt} y={H2 - m.bottom} title="age" />
  <path class="thresh" d={threshD} fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="2 4" />
  <path class="load" d={loadD} fill="none" stroke="var(--c1)" stroke-width="2.6" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>the loading of future pay</span>
  <span class="key"><span class="swatch dotted"></span>above this, the rule holds no stock</span>
</p>

<div class="readouts">
  <Readout id="hl-r-25" label="Share at 25" value={bigPct(share(25, phi, g))} color="var(--c1)" />
  <Readout id="hl-r-45" label="Share at 45" value={bigPct(share(45, phi, g))} color="var(--c1)" />
  <Readout id="hl-r-65" label="Share at 65" value={bigPct(share(65, phi, g))} color="var(--c1)" />
  <Readout id="hl-r-bond" label="Share at 25 if pay were a bond" value={bigPct(shareBond(25, g))} />
  <Readout id="hl-r-peak" label="Highest share between 25 and 64, at age" value={`${peak}`} />
  <Readout id="hl-r-load" label="Loading of future pay at 25" value={pct(betaH(25, phi), 0)} />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
  .swatch.dotted { background: repeating-linear-gradient(90deg, var(--ink) 0 2px, transparent 2px 5px); }
</style>
