<script>
  /*
    The yield is a promise. The cost of capital worked out with the loan's
    promised yield in place of what lenders expect, against the
    debt-to-equity ratio, next to the true cost of capital, flat at 8%.
  */
  import { linear, path } from "../scale.js";
  import { clipTop } from "../clip.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { atDE, RA } from "../firm.js";
  import { pct, fixed } from "../format.js";

  let { width } = $props();
  let s = $state(0.25);
  let de = $state(3);
  let o = $derived(atDE(de, s));
  const H = 260, XMAX = 4, YMAX = 0.16;
  const m = { top: 26, right: 18, bottom: 46, left: 44 };
  let x = $derived(linear([0, XMAX], [m.left, width - m.right]));
  const y = linear([0.06, YMAX], [H - m.bottom, m.top]);
  let yieldD = $derived.by(() => {
    const pts = [];
    for (let i = 0; i <= 80; i++) { const d = (XMAX * i) / 80; pts.push([d, atDE(d, s).waccYield]); }
    return path(clipTop(pts, YMAX).map(([a, b]) => [x(a), y(b)]));
  });
</script>

<div class="controls">
  <Segmented label="Volatility of the assets" id="yc-s" options={[{ value: 0.15, label: "15%" }, { value: 0.25, label: "25%" }, { value: 0.4, label: "40%" }]} bind:value={s} />
  <Slider label="Debt to equity" id="yc-de" min={0} max={4} step={0.05} bind:value={de} format={(u) => fixed(+u, 2)} width={240} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The cost of capital worked out with the bond's yield, against the true cost of capital" class="yield-panel">
  <AxisY scale={y} ticks={[0.06, 0.08, 0.1, 0.12, 0.14, 0.16]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <AxisX scale={x} ticks={[0, 1, 2, 3, 4]} y={H - m.bottom} title="Debt to equity, by value" />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">Cost of capital</text>
  <line class="marker" x1={x(de)} x2={x(de)} y1={y(0.06)} y2={y(YMAX)} stroke="#8a94a2" stroke-width="1" stroke-dasharray="2 3" />
  <line class="wacc" x1={x(0)} x2={x(XMAX)} y1={y(RA)} y2={y(RA)} stroke="var(--ink)" stroke-width="2.2" />
  <path class="with-yield" d={yieldD} fill="none" stroke="var(--c2)" stroke-width="3" />
  {#if o.waccYield <= YMAX}<circle class="pt-y" cx={x(de)} cy={y(o.waccYield)} r="5.5" fill="var(--c2)" stroke="white" stroke-width="1.5" />{/if}
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--ink)"></span>the cost of capital</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>worked out with the loan's yield</span>
</p>

<div class="readouts">
  <Readout id="yc-r-y" label="Loan's promised yield" value={pct(o.y, 1)} />
  <Readout id="yc-r-d" label="Lenders expect" value={pct(o.rD, 1)} />
  <Readout id="yc-r-wy" label="Cost of capital with the yield" value={pct(o.waccYield, 2)} color="var(--c2)" />
  <Readout id="yc-r-w" label="The real cost of capital" value={pct(o.wacc, 2)} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
