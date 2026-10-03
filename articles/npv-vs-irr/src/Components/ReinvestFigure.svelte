<script>
  /*
    What Quick's $150 grows to by year five at a reinvestment rate R, against
    the $300 Slow pays then. They match at the crossover rate.
  */
  import { linear } from "../scale.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { reinvested, crossover, PAIRS } from "../projects.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let R = $state(0.1);
  let q = $derived(reinvested(150, 4, R));
  const even = crossover(PAIRS.timing.A.cf, PAIRS.timing.B.cf);
  const H = 240, YMAX = 450;
  const m = { top: 16, right: 18, bottom: 40, left: 50 };
  const y = linear([0, YMAX], [H - m.bottom, m.top]);
  let slot = $derived((width - m.left - m.right) / 2);
  let bw = $derived(Math.min(90, slot * 0.5));
  const cx = (i) => m.left + slot * (i + 0.5);
</script>

<div class="controls">
  <Slider label="Rate earned on Quick's $150" id="rf-r" min={0} max={0.3} step={0.005} bind:value={R} format={(u) => pct(+u, 1)} width={280} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Quick's payout reinvested for four years against Slow's payout in year five" class="reinvest-panel">
  <AxisY scale={y} ticks={[0, 100, 200, 300, 400]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <rect class="bar quick" x={cx(0) - bw / 2} y={y(q)} width={bw} height={y(0) - y(q)} fill="var(--c1)" />
  <rect class="bar slow" x={cx(1) - bw / 2} y={y(300)} width={bw} height={y(0) - y(300)} fill="var(--c2)" />
  <text class="bar-label" x={cx(0)} y={H - m.bottom + 18} text-anchor="middle">Quick, reinvested</text>
  <text class="bar-label" x={cx(1)} y={H - m.bottom + 18} text-anchor="middle">Slow</text>
</svg>

<div class="readouts">
  <Readout id="rf-r-q" label="Quick's money in year 5" value={"$" + fixed(q, 2)} color="var(--c1)" />
  <Readout id="rf-r-s" label="Slow's money in year 5" value="$300.00" color="var(--c2)" />
  <Readout id="rf-r-even" label="They match at" value={pct(even, 1)} />
</div>

<style>
  .bar-label { font-size: 11.5px; fill: var(--ink-soft); }
</style>
