<script>
  /*
    A ten-year bond's yield against the spot curve it's priced off. Top: the
    spot curve, the 10-year spot rate (blue dot) and the bond's yield (pink
    dot). Bottom: how much of the bond's average wait each year's payment
    carries, which is the weight each year's spot rate gets in the yield.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { spot, couponBond } from "../curve.js";
  import { pct } from "../format.js";

  let { width } = $props();
  let c = $state(0.1);
  let bond = $derived(couponBond(c, 10));
  const H1 = 200, H2 = 150, m = { top: 12, right: 16, bottom: 36, left: 46 };
  let X = $derived(linear(0, 10.5, m.left, width - m.right));
  const Y = linear(0.02, 0.05, H1 - m.bottom, m.top);
  const TS = Array.from({ length: 101 }, (_, i) => 0.25 + i * 0.1).filter((t) => t <= 10.25);
  let curve = $derived(TS.map((t, i) => `${i ? "L" : "M"}${X(t).toFixed(2)},${Y(spot(t)).toFixed(2)}`).join(""));
  const YW = linear(0, 1, H2 - 24, 8);
  let bw = $derived((X(1) - X(0)) * 0.6);
</script>

<div class="controls">
  <Slider id="cf-c" label="The ten-year bond's coupon" min={0} max={0.12} step={0.005} bind:value={c} format={(v) => pct(v, 1)} width={300} />
</div>

<p class="panel-title">Spot rates, and the bond's yield</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="The spot curve with a ten-year bond's yield" class="coupon-panel">
  <AxisY scale={Y} ticks={[0.02, 0.03, 0.04, 0.05]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H1 - m.bottom} y2={H1 - m.bottom} />
    {#each [0, 2, 4, 6, 8, 10] as t (t)}
      <g transform="translate({X(t)},{H1 - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
  </g>
  <path class="spot-curve" d={curve} fill="none" stroke="var(--c1)" stroke-width="2.2" />
  <line class="rule" x1={X(9.5)} x2={X(10.5)} y1={Y(bond.rule)} y2={Y(bond.rule)} stroke="#5f6b7a" stroke-width="1.6" stroke-dasharray="4 3" />
  <circle class="spot10" cx={X(10)} cy={Y(bond.spot)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
  <circle class="yield10" cx={X(10)} cy={Y(bond.yield)} r="5.5" fill="var(--c2)" stroke="white" stroke-width="1.2" />
</svg>

<p class="panel-title">Each year's share of the bond's average wait</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The weight of each year's spot rate in the yield" class="weights-panel">
  <AxisY scale={YW} ticks={[0, 0.5, 1]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H2 - 24} y2={H2 - 24} />
    {#each bond.weights as w (w.t)}
      <g transform="translate({X(w.t)},{H2 - 24})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{w.t}</text></g>
    {/each}
  </g>
  {#each bond.weights as w (w.t)}
    <rect class="wbar t{w.t}" x={X(w.t) - bw / 2} width={bw} y={YW(w.w)} height={YW(0) - YW(w.w)} fill="#8a94a2" />
  {/each}
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>spot rate</span>
  <span><i style="background:var(--c2)"></i>the bond's yield</span>
  <span><i class="dash"></i>the spot rates averaged with those weights</span>
</div>

<div class="readouts">
  <Readout id="cf-y" label="The bond's yield" value={pct(bond.yield, 3)} color="var(--c2)" />
  <Readout id="cf-s" label="10-year spot rate" value={pct(bond.spot, 3)} color="var(--c1)" />
  <Readout id="cf-r" label="Weighted average of the spot rates" value={pct(bond.rule, 3)} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; color: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #5f6b7a 0 4px, transparent 4px 7px); }
</style>
