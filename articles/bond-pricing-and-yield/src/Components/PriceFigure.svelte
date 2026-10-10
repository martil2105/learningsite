<script>
  /*
    Pricing a bond from one rate. A ten-year bond with a 5% coupon: each bar's
    outline is a payment, and the filled part is what that payment is worth
    today at the yield on the slider. The price is the filled parts added up.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { flows, price } from "../bonds.js";
  import { pct, money } from "../format.js";

  let { width } = $props();
  const C = 0.05, T = 10;
  let y = $state(0.04);
  let fs = $derived(flows(C, T, y));
  let p = $derived(price(C, T, y));
  const H = 230, m = { top: 12, right: 12, bottom: 40, left: 44 };
  let bw = $derived((width - m.left - m.right) / T);
  const Y = linear(0, 110, H - m.bottom, m.top);
  let kind = $derived(Math.abs(p - 100) < 0.005 ? "at par" : p > 100 ? "above par" : "below par");
</script>

<div class="controls">
  <Slider id="pf-y" label="Yield" min={0} max={0.12} step={0.0025} bind:value={y} format={(v) => pct(v, 2)} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Each payment of a ten-year bond and its value today" class="price-panel">
  <AxisY scale={Y} ticks={[0, 25, 50, 75, 100]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each fs as f (f.t)}
      <g transform="translate({m.left + (f.t - 0.5) * bw},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{f.t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 4} text-anchor="middle">year</text>
  </g>
  {#each fs as f (f.t)}
    <rect class="cf t{f.t}" x={m.left + (f.t - 1) * bw + bw * 0.18} width={bw * 0.64} y={Y(f.cf)} height={Y(0) - Y(f.cf)} fill="none" stroke="#8a94a2" stroke-width="1.2" />
    <rect class="pv t{f.t}" x={m.left + (f.t - 1) * bw + bw * 0.18} width={bw * 0.64} y={Y(f.pv)} height={Y(0) - Y(f.pv)} fill="var(--c1)" />
  {/each}
</svg>
<div class="legend">
  <span><i style="background:#8a94a2"></i>the payment</span>
  <span><i style="background:var(--c1)"></i>what it's worth today</span>
</div>

<div class="readouts">
  <Readout id="pf-price" label="Price, the blue added up" value={money(p, 2)} />
  <Readout id="pf-kind" label="Against $100" value={kind} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
