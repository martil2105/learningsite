<script>
  /*
    The average wait as a balance point. Each payment's value today stands on
    a beam at its date; the triangle under the beam is where the beam balances,
    which is Macaulay's duration. Coupon and maturity are on sliders; the yield
    is 8%.
  */
  import { linear } from "../chart.js";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { flows, dates } from "../duration.js";
  import { pct, money } from "../format.js";

  let { width } = $props();
  const Y0 = 0.08;
  let c = $state(0.08);
  let T = $state(30);
  let fs = $derived(flows(c, T, Y0));
  let d = $derived(dates(c, T, Y0));
  const H = 200, m = { top: 14, right: 14, bottom: 58, left: 14 };
  let X = $derived(linear(0, 30.5, m.left, width - m.right));
  let pmax = $derived(Math.max(...fs.map((f) => f.pv)));
  let Y = $derived(linear(0, Math.max(10, pmax) * 1.08, H - m.bottom, m.top));
  let bw = $derived(Math.max(2, (X(1) - X(0)) * 0.62));
  const beamY = H - m.bottom;
</script>

<div class="controls">
  <Slider id="ss-c" label="Coupon" min={0} max={0.12} step={0.005} bind:value={c} format={(v) => pct(v, 1)} width={240} />
  <Slider id="ss-t" label="Years to maturity" min={1} max={30} step={1} bind:value={T} format={(v) => String(v)} width={240} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Each payment's value today, balanced on a beam" class="seesaw-panel">
  {#each fs as f (f.t)}
    <rect class="pv t{f.t}" x={X(f.t) - bw / 2} width={bw} y={Y(f.pv)} height={Y(0) - Y(f.pv)} fill="var(--c1)" />
  {/each}
  <line class="beam" x1={X(0)} x2={X(30.5)} y1={beamY} y2={beamY} stroke="var(--ink)" stroke-width="3" />
  <path class="fulcrum" d="M{X(d.D).toFixed(2)},{beamY + 2}l-11,20h22z" fill="var(--c2)" />
  <g class="axis axis-x">
    {#each [0, 5, 10, 15, 20, 25, 30] as t (t)}
      <g transform="translate({X(t)},{beamY + 26})"><text class="tick-label" y="12" text-anchor="middle">{t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 4} text-anchor="middle">years until the payment</text>
  </g>
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>each payment's value today</span>
  <span><i style="background:var(--c2)"></i>the balance point</span>
</div>

<div class="readouts">
  <Readout id="ss-d" label="Balances at" value={`${d.D.toFixed(1)} years`} />
  <Readout id="ss-p" label="Price at 8%" value={money(d.P, 2)} />
  <Readout id="ss-last" label="The last payment's share of the price" value={pct(fs[fs.length - 1].pv / d.P, 0)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
