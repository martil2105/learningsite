<script>
  /*
    Three ten-year bonds at the same 4% yield, with coupons of 0%, 4% and 8%.
    Top: each one's price over its life if the yield never moves. Bottom: for
    the chosen bond, each year's return split into the coupon (blue) and the
    change in price (pink), which always add up to the yield.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { priceAfter, yearReturn, currentYield, price, FACE } from "../bonds.js";
  import { pct, money } from "../format.js";

  let { width } = $props();
  const Y0 = 0.04, T = 10;
  const COUPONS = [
    { c: 0, label: "0%", cls: "c0", color: "var(--c3)" },
    { c: 0.04, label: "4%", cls: "c4", color: "#5f6b7a" },
    { c: 0.08, label: "8%", cls: "c8", color: "var(--c2)" },
  ];
  let c = $state(0.08);
  const H1 = 210, H2 = 200, m = { top: 12, right: 14, bottom: 36, left: 48 };
  let X = $derived(linear(0, T, m.left, width - m.right));
  const Y1 = linear(60, 140, H1 - m.bottom, m.top);
  // the price just after each coupon date, joined up
  let lines = $derived(COUPONS.map((o) => ({ ...o, d: Array.from({ length: T + 1 }, (_, t) => [X(t), Y1(priceAfter(o.c, T, Y0, t))]).map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(2)},${b.toFixed(2)}`).join("") })));
  const Y2 = linear(-0.04, 0.08, H2 - m.bottom, m.top);
  let bw = $derived((width - m.left - m.right) / T);
  let years = $derived(Array.from({ length: T }, (_, t) => { const p0 = priceAfter(c, T, Y0, t), p1 = priceAfter(c, T, Y0, t + 1); return { t, inc: (FACE * c) / p0, chg: (p1 - p0) / p0 }; }));
  const sel = (v) => COUPONS.find((o) => o.c === v);
</script>

<div class="controls">
  <Segmented id="pu-c" label="Coupon" options={COUPONS.map((o) => ({ value: o.c, label: o.label }))} bind:value={c} />
</div>

<p class="panel-title">Price after each coupon, if the yield stays at 4%</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Three bonds' prices over their lives" class="pull-panel">
  <AxisY scale={Y1} ticks={[60, 80, 100, 120, 140]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H1 - m.bottom} y2={H1 - m.bottom} />
    {#each [0, 2, 4, 6, 8, 10] as t (t)}
      <g transform="translate({X(t)},{H1 - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
  </g>
  {#each lines as l (l.cls)}
    <path class="price {l.cls}" class:dim={l.c !== c} d={l.d} fill="none" stroke={l.color} stroke-width={l.c === c ? 2.4 : 1.2} />
  {/each}
</svg>
<div class="legend">
  {#each COUPONS as o (o.cls)}<span><i style="background:{o.color}"></i>{o.label} coupon</span>{/each}
</div>

<p class="panel-title">Each year's return on the {sel(c).label} bond</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Each year's return, split into coupon and price change" class="split-panel">
  <AxisY scale={Y2} ticks={[-0.04, 0, 0.04, 0.08]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={Y2(0)} y2={Y2(0)} />
    {#each years as yr (yr.t)}
      <g transform="translate({m.left + (yr.t + 0.5) * bw},{H2 - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{yr.t + 1}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H2 - 4} text-anchor="middle">year</text>
  </g>
  {#each years as yr (yr.t)}
    {@const x0 = m.left + yr.t * bw + bw * 0.2}
    {@const w0 = bw * 0.6}
    <rect class="inc y{yr.t}" x={x0} width={w0} y={Y2(yr.inc)} height={Y2(0) - Y2(yr.inc)} fill="var(--c1)" />
    {#if yr.chg >= 0}
      <rect class="chg y{yr.t}" x={x0} width={w0} y={Y2(yr.inc + yr.chg)} height={Y2(yr.inc) - Y2(yr.inc + yr.chg)} fill="var(--c2)" />
    {:else}
      <rect class="chg neg y{yr.t}" x={x0} width={w0} y={Y2(0)} height={Y2(yr.chg) - Y2(0)} fill="var(--c2)" />
    {/if}
  {/each}
  <line class="yield" x1={m.left} x2={width - m.right} y1={Y2(Y0)} y2={Y2(Y0)} stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="5 4" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>the coupon</span>
  <span><i style="background:var(--c2)"></i>the change in price</span>
  <span><i class="dash"></i>the yield, 4%</span>
</div>

<div class="readouts">
  <Readout id="pu-price" label="Price today" value={money(price(c, T, Y0), 2)} />
  <Readout id="pu-cy" label="Coupon over price" value={pct(currentYield(c, T, Y0), 2)} />
  <Readout id="pu-ret" label="Return each year" value={pct(yearReturn(c, T, Y0, 0), 2)} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; color: var(--ink); }
  .price.dim { opacity: 0.4; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 9px); }
</style>
