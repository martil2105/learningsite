<script>
  /*
    The hook: one margin account, long or short. Our equity (green) and the
    broker's requirement, k times the shares' value (pink), both against the
    price. Both are straight lines, the call comes where they cross, and the
    shaded side is where the account is under the requirement. The marker is
    the price you've chosen.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { account, callPrice, wipePrice, RULES, P0, Q } from "../margin.js";
  import { pct, fixed } from "../format.js";

  let { width, side = $bindable("long") } = $props();

  let price = $state(100);
  let m = $state(RULES.m);
  let kUser = $state({ long: null, short: null });
  let k = $derived(kUser[side] ?? (side === "long" ? RULES.kLong : RULES.kShort));
  let a = $derived(account(side, price, m, k));
  let cp = $derived(callPrice(side, m, k));
  let wp = $derived(wipePrice(side, m));

  const H = 280;
  const m0 = { top: 14, right: 16, bottom: 46, left: 64 };
  const PLO = 40, PHI = 160, YLO = -6000, YHI = 12000;
  let x = $derived(linear([PLO, PHI], [m0.left, width - m0.right]));
  const y = linear([YLO, YHI], [H - m0.bottom, m0.top]);
  const eqAt = (P) => account(side, P, m, k).equity;
  const reqAt = (P) => k * Q * P;
  const seg = (f) => {
    // a straight line, clipped to the window by sampling
    let s = "", open = false;
    for (let i = 0; i <= 120; i++) {
      const P = PLO + ((PHI - PLO) * i) / 120, v = f(P);
      if (v >= YLO && v <= YHI) { s += `${open ? "L" : "M"}${x(P).toFixed(2)},${y(v).toFixed(2)}`; open = true; } else open = false;
    }
    return s;
  };
  let eqPath = $derived(seg(eqAt));
  let reqPath = $derived(seg(reqAt));
  // the called side of the chart: below the call price for a long, above it for a short
  let band = $derived.by(() => {
    const lo = side === "long" ? PLO : Math.max(PLO, Math.min(PHI, cp));
    const hi = side === "long" ? Math.max(PLO, Math.min(PHI, cp)) : PHI;
    return hi > lo ? { x: x(lo), w: x(hi) - x(lo) } : null;
  });
  const money = (v) => (v < 0 ? "−" : "") + "$" + Math.round(Math.abs(v)).toLocaleString("en-GB");
  const STATUS = { fine: "Fine", call: "Margin call", wiped: "Wiped out" };
  const setK = (v) => (kUser = { ...kUser, [side]: +v });
</script>

<div class="controls">
  <Segmented label="Position" id="al-side" bind:value={side} options={[{ value: "long", label: "Long, bought on margin" }, { value: "short", label: "Short" }]} />
  <Slider label="Price of a share" id="al-p" min={PLO} max={PHI} step={1} bind:value={price} format={(v) => "$" + v} width={220} />
</div>
<div class="controls second">
  <Slider label="Initial margin, our own money" id="al-m" min={0.3} max={1} step={0.05} bind:value={m} format={(v) => pct(+v, 0)} width={220} />
  <label class="slider">
    <span class="top"><span class="lab">Maintenance margin</span><span class="val">{pct(k, 0)}</span></span>
    <input type="range" id="al-k" min="0.1" max="0.45" step="0.01" value={k} oninput={(e) => setK(e.currentTarget.value)} />
  </label>
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Our equity and the broker's requirement against the price" class="account-panel" data-side={side}>
  {#if band}
    <rect class="called" x={band.x} y={m0.top} width={band.w} height={H - m0.bottom - m0.top} fill="var(--c2-soft)" opacity="0.55" />
  {/if}
  <AxisY scale={y} ticks={[-5000, 0, 5000, 10000]} x0={m0.left} x1={width - m0.right} format={money} />
  <AxisX scale={x} ticks={[40, 60, 80, 100, 120, 140, 160]} y={H - m0.bottom} format={(v) => "$" + v} title="price of a share" />
  <line class="zero" x1={m0.left} x2={width - m0.right} y1={y(0)} y2={y(0)} stroke="var(--ink)" stroke-opacity="0.5" />
  <path class="req" d={reqPath} fill="none" stroke="var(--c2)" stroke-width="2.2" stroke-dasharray="7 4" />
  <path class="equity" d={eqPath} fill="none" stroke="var(--c3)" stroke-width="2.8" />
  {#if cp >= PLO && cp <= PHI}
    <circle class="call-dot" cx={x(cp)} cy={y(reqAt(cp))} r="5" fill="white" stroke="var(--c2)" stroke-width="2" />
  {/if}
  <line class="p-marker" x1={x(price)} x2={x(price)} y1={m0.top} y2={H - m0.bottom} stroke="var(--ink)" stroke-opacity="0.55" />
  {#if a.equity >= YLO && a.equity <= YHI}
    <circle class="eq-dot" cx={x(price)} cy={y(a.equity)} r="5" fill="var(--c3)" stroke="white" stroke-width="1.2" />
  {/if}
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c3)"></span>our equity</span>
  <span class="key"><span class="swatch dashed"></span>the broker's requirement</span>
  <span class="key"><span class="block" style="background:var(--c2-soft)"></span>margin call</span>
</p>

<div class="readouts">
  <Readout id="al-r-shares" label={side === "long" ? "Shares we hold" : "Shares we owe"} value={money(a.shares)} />
  <Readout id="al-r-other" label={side === "long" ? "Loan" : "Cash held"} value={money(side === "long" ? a.loan : a.cash)} />
  <Readout id="al-r-equity" label="Our equity" value={money(a.equity)} color="var(--c3)" />
  <Readout id="al-r-ratio" label="Equity over shares" value={pct(a.ratio, 1)} />
  <Readout id="al-r-lev" label="Leverage" value={a.equity > 0 ? fixed(a.leverage, 2) + "×" : "none left"} />
  <Readout id="al-r-status" label="Status" value={STATUS[a.status]} color={a.status === "fine" ? "" : "var(--c2)"} />
  <Readout id="al-r-call" label="The call comes at" value={cp > 0 ? "$" + cp.toFixed(2) : "never"} />
  <Readout id="al-r-lost" label="Our money lost" value={pct(Math.max(0, Math.min(1, a.lost)), 1)} />
  {#if a.status === "call"}
    <Readout id="al-r-add" label="To meet it, add" value={money(a.shortfall)} color="var(--c2)" />
    <Readout id="al-r-trade" label={side === "long" ? "Or sell" : "Or buy back"} value={money(a.trade)} color="var(--c2)" />
  {/if}
</div>

<style>
  .controls.second { margin-top: -0.6rem; }
  .slider { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; width: min(220px, 100%); }
  .top { display: flex; justify-content: space-between; gap: 10px; }
  .lab { color: var(--muted); }
  .val { font-family: var(--font-mono); color: var(--ink); }
  input { width: 100%; accent-color: var(--c1); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .block { display: inline-block; width: 14px; height: 10px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--c2) 0 5px, transparent 5px 8px); }
</style>
