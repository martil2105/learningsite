<script>
  /*
    The hook: a sell-off in a bond ETF's basket. Above, the basket's true value
    (dashed), the ETF's price (pink, which APs keep at the basket's value here)
    and the NAV (blue), which is built from each bond's last trade and so lags.
    Below, the reported premium of the price over the NAV as bars, with the
    arbitrage band shaded around zero. Bars far outside the band are not an
    arbitrage: the price is right and the NAV is late.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { sellOff } from "../etf.js";
  import { pct, fixed } from "../format.js";

  let { width, p = $bindable(0.2) } = $props();
  let fall = $state(0.1);
  const C = 0.003;
  const DAYS = 20;
  let s = $derived(sellOff({ fall, p, days: DAYS }));
  let worst = $derived(s.reduce((a, o) => (o.prem < a.prem ? o : a), s[0]));

  const H1 = 220, H2 = 170;
  const m = { top: 12, right: 16, bottom: 40, left: 52 };
  let x = $derived(linear([0, DAYS], [m.left, width - m.right]));
  const y1 = linear([78, 102], [H1 - m.bottom, m.top]);
  const y2 = linear([-0.17, 0.01], [H2 - m.bottom, m.top]);
  const line = (key) => s.map((o, i) => `${i ? "L" : "M"}${x(o.t).toFixed(2)},${y1(o[key]).toFixed(2)}`).join("");
  let navD = $derived(line("nav"));
  let pD = $derived(line("P"));
  let bw = $derived(Math.max(3, (x(1) - x(0)) * 0.6));
  const signed = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + fixed(Math.abs(100 * v), 1) + "%";
</script>

<div class="controls">
  <Slider label="The bonds fall over five days by" id="so-fall" min={0} max={0.2} step={0.01} bind:value={fall} format={(v) => pct(+v, 0)} width={240} />
  <Slider label="Share of the bonds that trade each day" id="so-p" min={0.1} max={1} step={0.05} bind:value={p} format={(v) => pct(+v, 0)} width={240} />
</div>

<p class="sub-title">Price and NAV, per share</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="The ETF's price, its NAV and what its bonds are worth during a sell-off" class="price-panel">
  <AxisY scale={y1} ticks={[80, 85, 90, 95, 100]} x0={m.left} x1={width - m.right} format={(v) => "$" + v} />
  <AxisX scale={x} ticks={[0, 5, 10, 15, 20]} y={H1 - m.bottom} title="days" />
  <path class="price" d={pD} fill="none" stroke="var(--c2)" stroke-width="2.6" stroke-opacity="0.85" />
  <path class="nav" d={navD} fill="none" stroke="var(--c1)" stroke-width="2.6" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>ETF price, which is what the bonds are worth here</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>NAV</span>
</p>

<p class="sub-title">Reported premium, price over NAV</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The reported premium or discount each day, with the arbitrage band" class="prem-panel">
  <rect class="band" x={m.left} y={y2(C)} width={width - m.left - m.right} height={y2(-C) - y2(C)} fill="#8a94a2" opacity="0.25" />
  <AxisY scale={y2} ticks={[-0.15, -0.1, -0.05, 0]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <AxisX scale={x} ticks={[0, 5, 10, 15, 20]} y={H2 - m.bottom} title="days" />
  {#each s as o (o.t)}
    {#if o.t > 0}
      <rect class="prem-bar" data-t={o.t} x={x(o.t) - bw / 2} y={y2(Math.max(0, o.prem))} width={bw} height={Math.abs(y2(o.prem) - y2(0))} fill="var(--c1)" opacity="0.85" />
    {/if}
  {/each}
</svg>
<p class="legend">
  <span class="key"><span class="block"></span>the arbitrage band, plus or minus 0.3%</span>
</p>

<div class="readouts">
  <Readout id="so-r-worst" label="Deepest discount" value={signed(worst.prem)} color="var(--c1)" />
  <Readout id="so-r-day" label="On day" value={String(worst.t)} />
  <Readout id="so-r-d10" label="Discount on day 10" value={signed(s[10].prem)} />
  <Readout id="so-r-lag" label="Average age of the NAV's prices" value={fixed((1 - p) / p, 1) + " days"} />
</div>

<style>
  .sub-title { font-size: 0.92rem; font-weight: 700; margin: 0.6rem 0 0.1rem; color: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .block { display: inline-block; width: 14px; height: 10px; background: #8a94a2; opacity: 0.4; }
</style>
