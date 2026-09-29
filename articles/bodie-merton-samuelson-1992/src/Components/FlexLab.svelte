<script>
  /*
    The hook. Two workers with the same savings, hours and spending today, one
    who can change her hours and one who can't. The market's year moves along
    the x axis; the top panel draws what happens to each one's consumption and
    the bottom panel what happens to their hours. Savings are one year of pay
    and thirty years of work remain.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath } from "../clip.js";
  import { response, gammaC, merton } from "../flex.js";
  import { pct, signedPct, fixed } from "../format.js";

  let { width, a = $bindable(0.5), g = $bindable(2), ret = $bindable(-0.2) } = $props();

  const W = 1, N = 30;
  const H1 = 220, H2 = 220;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  const rets = Array.from({ length: 81 }, (_, i) => -0.4 + i * 0.01);
  let p = $derived({ a, g, W, n: N });
  let now = $derived(response(p, ret));
  let x = $derived(linear([-0.4, 0.4], [m.left, width - m.right]));

  const cLo = -0.6, cHi = 0.6;
  const yC = linear([cLo, cHi], [H1 - m.bottom, m.top]);
  let consFlexD = $derived(clippedPath(rets.map((r) => [r, response(p, r).consFlex]), x, yC, cLo, cHi));
  let consFixedD = $derived(clippedPath(rets.map((r) => [r, response(p, r).consFixed]), x, yC, cLo, cHi));

  const yH = linear([0, 1], [H2 - m.bottom, m.top]);
  let hoursFlexD = $derived(clippedPath(rets.map((r) => [r, response(p, r).hoursFlex]), x, yH, 0, 1));
  let hoursFixedD = $derived(clippedPath(rets.map((r) => [r, response(p, r).hoursFixed]), x, yH, 0, 1));
  const xt = [-0.4, -0.2, 0, 0.2, 0.4];
</script>

<div class="controls">
  <Slider label="Stocks against the safe rate" id="fl-ret" min={-0.4} max={0.4} step={0.01} bind:value={ret} format={(v) => signedPct(v, 0)} width={220} />
  <Slider label="Weight on consumption" id="fl-a" min={0.4} max={0.8} step={0.05} bind:value={a} format={(v) => v.toFixed(2)} width={170} />
  <Slider label="Risk aversion" id="fl-g" min={1.5} max={10} step={0.5} bind:value={g} format={(v) => fixed(v, 1)} width={170} />
</div>

<p class="panel-title">Consumption next year, against the plan</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Consumption against plan after a year in the market, for a flexible and a fixed-hours worker" class="cons-panel">
  <AxisY scale={yC} ticks={[-0.5, -0.25, 0, 0.25, 0.5]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="consumption" />
  <AxisX scale={x} ticks={xt} y={H1 - m.bottom} format={(v) => pct(v, 0)} title="stocks against the safe rate" />
  <line class="zero-line" x1={m.left} x2={width - m.right} y1={yC(0)} y2={yC(0)} stroke="var(--ink)" stroke-width="1" opacity="0.6" />
  <path class="cons flex" d={consFlexD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="cons fixed" d={consFixedD} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <line class="ret-marker" x1={x(ret)} x2={x(ret)} y1={m.top} y2={H1 - m.bottom} stroke="var(--ink)" opacity="0.5" />
  <circle class="dot cons-flex" cx={x(ret)} cy={yC(now.consFlex)} r="4.5" fill="var(--c1)" stroke="#fff" stroke-width="1.5" />
  <circle class="dot cons-fixed" cx={x(ret)} cy={yC(now.consFixed)} r="4.5" fill="var(--c2)" stroke="#fff" stroke-width="1.5" />
</svg>

<p class="panel-title">Hours worked next year, as a share of full time</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Hours worked after a year in the market, for a flexible and a fixed-hours worker" class="hours-panel">
  <AxisY scale={yH} ticks={[0, 0.25, 0.5, 0.75, 1]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="hours" />
  <AxisX scale={x} ticks={xt} y={H2 - m.bottom} format={(v) => pct(v, 0)} title="stocks against the safe rate" />
  <path class="hours flex" d={hoursFlexD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="hours fixed" d={hoursFixedD} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <line class="ret-marker" x1={x(ret)} x2={x(ret)} y1={m.top} y2={H2 - m.bottom} stroke="var(--ink)" opacity="0.5" />
  <circle class="dot hours-flex" cx={x(ret)} cy={yH(now.hoursFlex)} r="4.5" fill="var(--c1)" stroke="#fff" stroke-width="1.5" />
  <circle class="dot hours-fixed" cx={x(ret)} cy={yH(now.hoursFixed)} r="4.5" fill="var(--c2)" stroke="#fff" stroke-width="1.5" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>the worker who can change her hours</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>the worker stuck with hers</span>
</p>
<div class="readouts">
  <Readout id="fl-r-flex" label="Stocks held, flexible (years of pay)" value={fixed(now.flex, 1)} color="var(--c1)" />
  <Readout id="fl-r-fixed" label="Stocks held, fixed (years of pay)" value={fixed(now.fixed, 1)} color="var(--c2)" />
  <Readout id="fl-r-ratio" label="Flexible ÷ fixed" value={fixed(now.ratio, 2)} />
  <Readout id="fl-r-cf" label="Consumption, flexible" value={signedPct(now.consFlex, 1)} color="var(--c1)" />
  <Readout id="fl-r-cx" label="Consumption, fixed" value={signedPct(now.consFixed, 1)} color="var(--c2)" />
  <Readout id="fl-r-hf" label="Hours, flexible" value={pct(now.hoursFlex, 0)} color="var(--c1)" />
  <Readout id="fl-r-hx" label="Hours, fixed" value={pct(now.hoursFixed, 0)} color="var(--c2)" />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
