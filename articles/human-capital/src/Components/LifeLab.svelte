<script>
  /*
    The hook, and the first lifetime exposure timeline. Top: our wealth in
    years of pay, savings stacked under future pay, with the stock dollars the
    rule asks for and the dollars a saver with a borrowing limit can hold.
    Bottom: the same as a share of savings, on a window from -100% to 300%, so
    the rule's early values run off the top.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { areaOf, bandOf } from "../chart.js";
  import { clippedPath } from "../clip.js";
  import { savings, futurePay, ruleShare, ruleDollars, cappedShare, MERTON, START, END } from "../lifecycle.js";
  import { pct, fixed } from "../format.js";

  let { width, age = $bindable(25), beta = $bindable(0), cap = $bindable("none") } = $props();

  const CAPS = { none: Infinity, two: 2, one: 1 };
  const H1 = 250, H2 = 240;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  const ages = Array.from({ length: (END - START) * 4 + 1 }, (_, i) => START + i / 4);
  let capV = $derived(CAPS[cap]);
  let x = $derived(linear([START, END], [m.left, width - m.right]));
  const yW = linear([0, 30], [H1 - m.bottom, m.top]);
  let wD = $derived(areaOf(ages.map((a) => [x(a), yW(savings(a))]), yW(0)));
  let hD = $derived(bandOf(ages.map((a) => x(a)), ages.map((a) => yW(savings(a))), ages.map((a) => yW(savings(a) + futurePay(a)))));
  let ruleDD = $derived(clippedPath(ages.map((a) => [a, ruleDollars(a, beta)]), x, yW, 0, 30));
  let capDD = $derived(clippedPath(ages.map((a) => [a, cappedShare(a, capV, beta) * savings(a)]), x, yW, 0, 30));

  const lo = -1, hi = 3;
  const yS = linear([lo, hi], [H2 - m.bottom, m.top]);
  let ruleSD = $derived(clippedPath(ages.map((a) => [a, ruleShare(a, beta)]), x, yS, lo, hi));
  let capSD = $derived(clippedPath(ages.map((a) => [a, cappedShare(a, capV, beta)]), x, yS, lo, hi));
  const xt = [25, 35, 45, 55, 65];
  let share = $derived(ruleShare(age, beta));
  let held = $derived(cappedShare(age, capV, beta));
  const big = (v) => (Math.abs(v) >= 10 ? `${Math.round(100 * v).toLocaleString("en-GB")}%` : pct(v, 0));
</script>

<div class="controls">
  <Slider label="Age" id="hl-age" min={START} max={END} step={1} bind:value={age} format={(v) => `${v}`} width={200} />
  <Slider label="Pay that moves with stocks" id="hl-beta" min={0} max={1} step={0.01} bind:value={beta} format={(v) => pct(v, 0)} width={200} />
  <Segmented label="Borrowing limit" id="hl-cap" bind:value={cap}
    options={[{ value: "none", label: "No limit" }, { value: "two", label: "Up to 200%" }, { value: "one", label: "No borrowing" }]} />
</div>

<p class="panel-title">Our wealth, in years of pay</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Savings and future pay over a working life" class="wealth-panel">
  <path class="future-pay" d={hD} fill="#e1e4e8" />
  <path class="savings" d={wD} fill="var(--c1-soft)" />
  <AxisY scale={yW} ticks={[0, 5, 10, 15, 20, 25, 30]} x0={m.left} x1={width - m.right} title="years of pay" />
  <AxisX scale={x} ticks={xt} y={H1 - m.bottom} title="age" />
  <path class="rule-dollars" d={ruleDD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="capped-dollars" d={capDD} fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 4" />
  <line class="age-marker" x1={x(age)} x2={x(age)} y1={m.top} y2={H1 - m.bottom} stroke="var(--ink)" opacity="0.5" />
</svg>
<p class="legend">
  <span class="key"><span class="block" style="background:var(--c1-soft)"></span>savings</span>
  <span class="key"><span class="block" style="background:#e1e4e8"></span>future pay, valued like a bond</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>stocks the rule asks for</span>
  <span class="key"><span class="swatch dashed"></span>stocks we can hold, within the limit</span>
</p>

<p class="panel-title">The same, as a share of savings</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Share of savings in stocks over a working life" class="share-panel">
  <AxisY scale={yS} ticks={[-1, 0, 1, 2, 3]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="share of savings" />
  <AxisX scale={x} ticks={xt} y={H2 - m.bottom} title="age" />
  <line class="merton-line" x1={m.left} x2={width - m.right} y1={yS(MERTON)} y2={yS(MERTON)} stroke="var(--ink)" stroke-width="1" stroke-dasharray="2 3" />
  <line class="zero-line" x1={m.left} x2={width - m.right} y1={yS(0)} y2={yS(0)} stroke="var(--ink)" stroke-width="1" opacity="0.6" />
  <path class="rule-share" d={ruleSD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="capped-share" d={capSD} fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 4" />
  <line class="age-marker" x1={x(age)} x2={x(age)} y1={m.top} y2={H2 - m.bottom} stroke="var(--ink)" opacity="0.5" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>the rule</span>
  <span class="key"><span class="swatch dashed"></span>within the limit</span>
  <span class="key"><span class="swatch dotted"></span>the Merton share, {pct(MERTON, 0)}</span>
</p>
<div class="readouts">
  <Readout id="hl-r-ratio" label={`Future pay ÷ savings at ${age}`} value={fixed(futurePay(age) / savings(age), 1)} />
  <Readout id="hl-r-rule" label="The rule's share" value={big(share)} color="var(--c1)" />
  <Readout id="hl-r-held" label="Within the limit" value={big(held)} />
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
