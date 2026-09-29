<script>
  /*
    The hook. Top: the share of her wealth the saver holds in stocks in each of
    forty years, for the rule chosen. Bottom: the dollars riding on the market
    in each year as a share of her final wealth, with the last k years
    highlighted and the level an even spread would have.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath } from "../clip.js";
  import { N, exposure, lastShare, allStocks, glide, flatCap } from "../expo.js";
  import { DATA } from "../precomputed.js";
  import { pct, fixed } from "../format.js";

  let { width, rule = $bindable("all"), k = $bindable(10) } = $props();

  const SCHED = { all: allStocks(), glide: glide(), c15: flatCap(1.5), c2: flatCap(2), c3: flatCap(3) };
  const KEY = { all: "1", glide: "glide", c15: "1.5", c2: "2", c3: "3" };
  const H1 = 190, H2 = 230;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  let e = $derived(SCHED[rule]);
  let ex = $derived(exposure(e));
  let mc = $derived(DATA[KEY[rule]]);
  let x = $derived(linear([0.5, N + 0.5], [m.left, width - m.right]));
  let step = $derived(x(2) - x(1));
  const hiA = 3.2;
  const yA = linear([0, hiA], [H1 - m.bottom, m.top]);
  let levD = $derived(clippedPath(e.map((v, i) => [i + 1, v]), x, yA, 0, hiA));
  const yB = linear([0, 1], [H2 - m.bottom, m.top]);
  const xt = [1, 10, 20, 30, 40];
  let level = $derived(ex.sumE / N);
  let bandX = $derived(x(N - k + 0.5));
  let bandW = $derived(x(N + 0.5) - bandX);
</script>

<div class="controls">
  <Segmented label="Rule" id="el-rule" bind:value={rule}
    options={[{ value: "all", label: "All stocks" }, { value: "glide", label: "Glide path 90 to 40" }, { value: "c15", label: "Cap 1.5" }, { value: "c2", label: "Cap 2" }, { value: "c3", label: "Cap 3" }]} />
  <Slider label="Last years to highlight" id="el-k" min={5} max={20} step={1} bind:value={k} format={(v) => `${v}`} width={200} />
</div>

<p class="panel-title">Share of her wealth in stocks, by year of saving</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Share of wealth held in stocks in each of forty years of saving" class="lev-panel">
  <rect class="band" x={bandX} y={m.top} width={bandW} height={H1 - m.bottom - m.top} fill="var(--c2-soft)" opacity="0.6" />
  <AxisY scale={yA} ticks={[0, 1, 2, 3]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="in stocks" />
  <AxisX scale={x} ticks={xt} y={H1 - m.bottom} title="year of saving" />
  <path class="lev" d={levD} fill="none" stroke="var(--c1)" stroke-width="2.6" />
</svg>

<p class="panel-title">Dollars riding on the market, as a share of her final wealth</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The dollars exposed to the market in each year as a share of final wealth" class="exp-panel">
  <rect class="band" x={bandX} y={m.top} width={bandW} height={H2 - m.bottom - m.top} fill="var(--c2-soft)" opacity="0.6" />
  <AxisY scale={yB} ticks={[0, 0.25, 0.5, 0.75, 1]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="exposure" />
  <AxisX scale={x} ticks={xt} y={H2 - m.bottom} title="year of saving" />
  {#each ex.E as v, i (i)}
    <rect class="bar" data-year={i + 1} x={x(i + 1) - step * 0.36} y={yB(v)} width={step * 0.72} height={Math.max(0, yB(0) - yB(v))} fill={i >= N - k ? "var(--c2)" : "var(--c1)"} />
  {/each}
  <line class="even" x1={m.left} x2={width - m.right} y1={yB(level)} y2={yB(level)} stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="6 4" />
</svg>
<p class="legend">
  <span class="key"><span class="block" style="background:var(--c1)"></span>earlier years</span>
  <span class="key"><span class="block" style="background:var(--c2)"></span>the last {k} years</span>
  <span class="key"><span class="swatch dashed"></span>the level of an even spread</span>
</p>

<div class="readouts">
  <Readout id="el-r-neff" label="Effective years, of 40" value={fixed(ex.neff, 1)} color="var(--c1)" />
  <Readout id="el-r-var" label="Share of the variance in the last {k} years" value={pct(lastShare(ex.E, k, 2), 0)} color="var(--c2)" />
  <Readout id="el-r-exp" label="Share of the exposure in the last {k} years" value={pct(lastShare(ex.E, k, 1), 0)} />
  <Readout id="el-r-sum" label="Total exposure, in years of final wealth" value={fixed(ex.sumE, 1)} />
  <Readout id="el-r-sd" label="Spread of final wealth (sd of ln W)" value={fixed(mc.sd, 3)} />
  <Readout id="el-r-med" label="Median final wealth, in years of deposits" value={fixed(mc.median, 1)} />
  <Readout id="el-r-p5" label="5th percentile, in years of deposits" value={fixed(mc.p5, 1)} />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .block { display: inline-block; width: 14px; height: 10px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
</style>
