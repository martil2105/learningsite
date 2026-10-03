<script>
  /*
    Where the bend comes from. Top: next year's asset value split between
    lenders (pink, up to the face value of the loan) and shareholders (blue,
    the rest), stacked to the whole firm. Bottom, sharing the x axis: how
    likely each asset value is, with the values below the face value in pink.
    Volatility 25%, the article's default.
  */
  import { linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { atDE, density, V0, SIGMA } from "../firm.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let de = $state(3);
  let o = $derived(atDE(de, SIGMA));

  const XMAX = 220;
  const m = { top: 26, right: 18, bottom: 12, left: 48 };
  const H1 = 230, H2 = 120, mb = 46;
  let x = $derived(linear([0, XMAX], [m.left, width - m.right]));
  const y1 = linear([0, XMAX], [H1 - m.bottom, m.top]);
  const PMAX = 0.018;
  const y2 = linear([0, PMAX], [H2 - mb, 10]);
  const vs = Array.from({ length: 221 }, (_, i) => i);
  let lenders = $derived.by(() => {
    const top = vs.map((v) => [x(v), y1(Math.min(v, o.F))]);
    return path(top) + ` L${x(XMAX).toFixed(2)},${y1(0).toFixed(2)} L${x(0).toFixed(2)},${y1(0).toFixed(2)} Z`;
  });
  let owners = $derived.by(() => {
    const top = vs.map((v) => [x(v), y1(v)]);
    const bot = vs.map((v) => [x(v), y1(Math.min(v, o.F))]).reverse();
    return path(top) + " " + path(bot).replace(/^M/, "L") + " Z";
  });
  const dens = (lo, hi) => {
    const pts = [];
    for (let i = 0; i <= 200; i++) { const v = lo + ((hi - lo) * i) / 200; pts.push([x(v), y2(Math.min(PMAX, density(v)))]); }
    return path(pts) + ` L${x(hi).toFixed(2)},${y2(0).toFixed(2)} L${x(lo).toFixed(2)},${y2(0).toFixed(2)} Z`;
  };
  let below = $derived(o.F > 0 ? dens(0.01, Math.min(o.F, XMAX)) : "");
  let above = $derived(dens(Math.min(Math.max(o.F, 0.01), XMAX), XMAX));
</script>

<div class="controls">
  <Slider label="Debt to equity" id="sf-de" min={0} max={4} step={0.05} bind:value={de} format={(u) => fixed(+u, 2)} width={240} />
</div>

<p class="ptitle">What each group gets next year</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Next year's asset value split between lenders and shareholders" class="split-panel">
  <AxisY scale={y1} ticks={[0, 50, 100, 150, 200]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <path class="lenders" d={lenders} fill="var(--c2-soft)" stroke="none" />
  <path class="owners" d={owners} fill="var(--c1-soft)" stroke="none" />
  <line class="diag" x1={x(0)} y1={y1(0)} x2={x(XMAX)} y2={y1(XMAX)} stroke="var(--ink)" stroke-width="1.5" />
  {#if o.F > 0}
    <line class="face" x1={x(0)} x2={x(XMAX)} y1={y1(o.F)} y2={y1(o.F)} stroke="var(--c2)" stroke-width="2" />
    <text class="lab halo" x={x(XMAX) - 4} y={y1(o.F) + 16} text-anchor="end">lenders: up to {"$" + fixed(o.F, 2)}</text>
  {/if}
  <text class="lab halo" x={x(XMAX) - 4} y={y1(XMAX) + 30} text-anchor="end">shareholders: the rest</text>
</svg>
<p class="ptitle">How likely each asset value is</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The distribution of next year's asset value, with the values below the loan in pink" class="dens-panel">
  <path class="dens-above" d={above} fill="#8a94a2" opacity="0.45" />
  {#if below}<path class="dens-below" d={below} fill="var(--c2)" opacity="0.75" />{/if}
  <AxisX scale={x} ticks={[0, 50, 100, 150, 200]} y={H2 - mb} format={(t) => "$" + t} title="The firm's assets next year" />
</svg>

<div class="readouts">
  <Readout id="sf-r-f" label="Owed next year" value={"$" + fixed(o.F, 2)} color="var(--c2)" />
  <Readout id="sf-r-d" label="The loan is worth today" value={"$" + fixed(o.D0, 2)} />
  <Readout id="sf-r-e" label="The shares are worth today" value={"$" + fixed(o.E0, 2)} color="var(--c1)" />
  <Readout id="sf-r-v" label="Together" value={"$" + fixed(o.D0 + o.E0, 2)} />
  <Readout id="sf-r-p" label="Chance the assets fall short" value={pct(o.pDefault, 1)} />
</div>

<style>
  .ptitle { font-size: 0.92rem; font-weight: 700; margin: 0.4rem 0 0.2rem; color: var(--ink); }
  .halo { stroke: #fff; stroke-width: 3px; paint-order: stroke; font-size: 11.5px; fill: var(--ink); }
</style>
