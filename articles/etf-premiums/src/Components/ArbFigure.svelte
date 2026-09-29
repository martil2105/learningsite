<script>
  /*
    What an authorised participant makes, per $100, on a creation (pink) and a
    redemption (blue), against the ETF's premium over what its bonds are worth.
    Both lose money inside the band of plus or minus the AP's cost, so nobody
    acts there. The marker is a premium the reader sets.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { createProfit, redeemProfit, afterArbitrage } from "../etf.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let c = $state(0.003);
  let x0 = $state(0.008);

  const H = 230;
  const m = { top: 12, right: 28, bottom: 44, left: 56 };
  const XL = 0.015;
  let x = $derived(linear([-XL, XL], [m.left, width - m.right]));
  const y = linear([-0.01, 0.015], [H - m.bottom, m.top]);
  const seg = (f) => {
    let s = "", open = false;
    for (let i = 0; i <= 100; i++) { const v = -XL + (2 * XL * i) / 100, w = f(v); if (w >= -0.01 && w <= 0.015) { s += `${open ? "L" : "M"}${x(v).toFixed(2)},${y(w).toFixed(2)}`; open = true; } else open = false; }
    return s;
  };
  let cr = $derived(seg((v) => createProfit(v, c)));
  let rd = $derived(seg((v) => redeemProfit(v, c)));
  let act = $derived(x0 > c ? "create" : x0 < -c ? "redeem" : "none");
  const pc = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + fixed(Math.abs(100 * v), 2) + "%";
  const perHundred = (v) => (v < 0 ? "−" : "") + "$" + fixed(Math.abs(100 * v), 2);
</script>

<div class="controls">
  <Slider label="Price over what the bonds are worth" id="af-x" min={-0.015} max={0.015} step={0.001} bind:value={x0} format={(v) => pc(+v)} width={240} />
  <Slider label="The AP's cost, there and back" id="af-c" min={0.001} max={0.01} step={0.001} bind:value={c} format={(v) => fixed(100 * +v, 1) + "%"} width={240} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="What an authorised participant makes on a creation and a redemption, against the premium" class="arb-panel">
  <rect class="band" x={x(-c)} y={m.top} width={x(c) - x(-c)} height={H - m.bottom - m.top} fill="#8a94a2" opacity="0.18" />
  <AxisY scale={y} ticks={[-0.01, -0.005, 0, 0.005, 0.01, 0.015]} x0={m.left} x1={width - m.right} format={(v) => perHundred(v)} />
  <AxisX scale={x} ticks={width < 480 ? [-0.01, 0, 0.01] : [-0.015, -0.01, -0.005, 0, 0.005, 0.01, 0.015]} y={H - m.bottom} format={(v) => (v === 0 ? "0" : (v > 0 ? "+" : "−") + fixed(Math.abs(100 * v), 1) + "%")} title="price over what the bonds are worth" />
  <line class="zero" x1={m.left} x2={width - m.right} y1={y(0)} y2={y(0)} stroke="var(--ink)" stroke-opacity="0.5" />
  <path class="create" d={cr} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <path class="redeem" d={rd} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <line class="x-marker" x1={x(x0)} x2={x(x0)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" stroke-opacity="0.55" />
  {#if act === "create"}<circle class="dot" cx={x(x0)} cy={y(createProfit(x0, c))} r="5" fill="var(--c2)" stroke="white" stroke-width="1.2" />{/if}
  {#if act === "redeem"}<circle class="dot" cx={x(x0)} cy={y(redeemProfit(x0, c))} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />{/if}
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>create: hand in bonds, sell new shares</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>redeem: buy shares, take out bonds</span>
  <span class="key"><span class="block"></span>nobody acts</span>
</p>

<div class="readouts">
  <Readout id="af-r-act" label="The AP" value={act === "create" ? "creates" : act === "redeem" ? "redeems" : "does nothing"} />
  <Readout id="af-r-profit" label="Profit per $100" value={act === "none" ? "$0.00" : perHundred(act === "create" ? createProfit(x0, c) : redeemProfit(x0, c))} />
  <Readout id="af-r-after" label="Price over the bonds, after" value={pc(afterArbitrage(x0, c))} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .block { display: inline-block; width: 14px; height: 10px; background: #8a94a2; opacity: 0.35; }
</style>
