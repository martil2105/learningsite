<script>
  /*
    The case: NYMEX WTI settlements for delivery in May and in June 2020, on
    Friday 17 April and Monday 20 April 2020 (quoted). Bars above and below
    zero, with the June-minus-May gap as a bracket.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { WTI } from "../forwards.js";
  import { money } from "../format.js";

  let { width } = $props();
  let day = $state("mon");
  const H = 240, m = { top: 14, right: 16, bottom: 30, left: 52 };
  const Y = linear(-40, 30, H - m.bottom, m.top);
  let X = $derived(linear(0, 2, m.left, width - m.right));
  let d = $derived(WTI[day]);
  const BW = 0.5;
  let bars = $derived([{ k: "may", label: "May delivery", v: d.may, i: 0 }, { k: "june", label: "June delivery", v: d.june, i: 1 }]);
</script>

<div class="controls">
  <Segmented id="of-day" label="Settlement prices on" options={[{ value: "fri", label: "Friday 17 April 2020" }, { value: "mon", label: "Monday 20 April 2020" }]} bind:value={day} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The prices of oil for delivery in May and in June 2020" class="oil-panel">
  <AxisY scale={Y} ticks={[-40, -20, 0, 20]} x0={m.left} x1={width - m.right} format={(t) => (t < 0 ? "−$" + -t : "$" + t)} />
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-width="1.2" />
  {#each bars as b (b.k)}
    <rect class="bar {b.k}" x={X(b.i + 0.5 - BW / 2)} y={Math.min(Y(b.v), Y(0))} width={X(BW) - X(0)} height={Math.abs(Y(b.v) - Y(0))} fill={b.v < 0 ? "var(--c2)" : "var(--c1)"} />
    <text class="bar-label" x={X(b.i + 0.5)} y={H - 10} text-anchor="middle">{b.label}</text>
  {/each}
</svg>

<div class="readouts">
  <Readout id="of-may" label="Oil for May" value={money(d.may, 2)} />
  <Readout id="of-june" label="Oil for June" value={money(d.june, 2)} />
  <Readout id="of-gap" label="June minus May" value={money(d.june - d.may, 2)} />
</div>

<style>
  svg { display: block; }
  .bar-label { font-size: 12px; font-weight: 600; fill: var(--ink-soft); }
</style>
