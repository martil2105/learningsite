<script>
  /*
    Two ways to lend $100 for two years: buy the 2-year zero, or buy the
    1-year zero and lend again next year at whatever the 1-year rate is then.
    The flat line is the first, the rising line the second, against next
    year's rate; they cross at the forward rate.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { spot, twoYear, rolled, forwards } from "../curve.js";
  import { pct, money } from "../format.js";

  let { width } = $props();
  const s1 = spot(1), s2 = spot(2);
  const f = forwards([s1, s2])[1];
  let next = $state(0.02);
  const H = 250, m = { top: 12, right: 16, bottom: 44, left: 56 };
  let X = $derived(linear(0, 0.08, m.left, width - m.right));
  const Y = linear(102, 111, H - m.bottom, m.top);
  const fixedM = twoYear(s1, s2);
</script>

<div class="controls">
  <Slider id="be-next" label="Next year's 1-year rate" min={0} max={0.08} step={0.0005} bind:value={next} format={(v) => pct(v, 2)} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Two ways to lend for two years, against next year's rate" class="be-panel">
  <AxisY scale={Y} ticks={[102, 104, 106, 108, 110]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 0.02, 0.04, 0.06, 0.08] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">the 1-year rate a year from now</text>
  </g>
  <line class="fwd-mark" x1={X(f)} x2={X(f)} y1={m.top} y2={H - m.bottom} stroke="#8a94a2" stroke-width="1.2" stroke-dasharray="3 3" />
  <line class="two-year" x1={X(0)} x2={X(0.08)} y1={Y(fixedM)} y2={Y(fixedM)} stroke="var(--c1)" stroke-width="2.4" />
  <line class="roll" x1={X(0)} x2={X(0.08)} y1={Y(rolled(s1, 0))} y2={Y(rolled(s1, 0.08))} stroke="var(--c2)" stroke-width="2.4" />
  <circle class="cross" cx={X(f)} cy={Y(fixedM)} r="5" fill="white" stroke="var(--ink)" stroke-width="1.6" />
  <circle class="now" cx={X(next)} cy={Y(rolled(s1, next))} r="5.5" fill="var(--c2)" stroke="white" stroke-width="1.2" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>buy the 2-year zero</span>
  <span><i style="background:var(--c2)"></i>buy the 1-year zero, then lend again</span>
</div>

<div class="readouts">
  <Readout id="be-fixed" label="2-year zero, after two years" value={money(fixedM, 2)} />
  <Readout id="be-roll" label="Lending twice" value={money(rolled(s1, next), 2)} />
  <Readout id="be-f" label="Break-even, the forward rate" value={pct(f, 2)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
