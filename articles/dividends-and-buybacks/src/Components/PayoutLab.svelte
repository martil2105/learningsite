<script>
  /*
    The hook, a comparison spine: the same payout as a dividend and as a
    buyback. The first chart is what each kind of shareholder gains or loses
    against the $100 a share was worth before, as bars from zero; the second
    is earnings per share before and after each. Drag the buyback price away
    from fair to see the buyback become a dividend plus a trade between the
    shareholders who sell and the ones who stay.
  */
  import { linear } from "../scale.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { before, dividend, buyback, FIRM } from "../payout.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let d = $state(10);
  let prem = $state(0);
  let V = before().V;
  let Pb = $derived(V * (1 + prem));
  let dv = $derived(dividend(d));
  let bb = $derived(buyback(d, Pb));
  let b0 = before();

  const GAP = 16;
  let wide = $derived(width >= 560);
  let pw = $derived(wide ? Math.floor((width - GAP - 2) / 2) : width);
  const H = 250;
  const m = { top: 16, right: 10, bottom: 62, left: 50 };
  const yG = linear([-22, 22], [H - m.bottom, m.top]);
  const yE = linear([0, 9], [H - m.bottom, m.top]);
  let slot = $derived((pw - m.left - m.right) / 3);
  let bw = $derived(Math.min(54, slot * 0.55));
  const cx = (i) => m.left + slot * (i + 0.5);
  let gains = $derived([
    { key: "div", label: ["Dividend:", "any holder"], v: dv.wealth - V, color: "#8a94a2" },
    { key: "stay", label: ["Buyback:", "a share kept"], v: bb.stay - V, color: "var(--c1)" },
    { key: "sold", label: ["Buyback:", "a share sold"], v: bb.sold - V, color: "var(--c2)" },
  ]);
  let eps = $derived([
    { key: "before", label: ["Before", ""], v: b0.EPS, color: "#8a94a2" },
    { key: "div", label: ["After a", "dividend"], v: dv.EPS, color: "var(--ink)" },
    { key: "buy", label: ["After a", "buyback"], v: bb.EPS, color: "var(--c1)" },
  ]);
  const money = (v) => (v < -0.004 ? "−" : v > 0.004 ? "+" : "") + "$" + fixed(Math.abs(v), 2);
  const pctS = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + fixed(Math.abs(100 * v), 0) + "%";
</script>

<div class="controls">
  <Slider label="Cash handed back, a share" id="pl-d" min={0} max={20} step={1} bind:value={d} format={(v) => "$" + v} width={220} />
  <Slider label="Buyback price against what a share is worth" id="pl-prem" min={-0.2} max={0.2} step={0.01} bind:value={prem} format={(v) => pctS(+v)} width={260} />
</div>

<div class="panels" style="gap:{GAP}px">
  <div class="panel" style="width:{pw}px">
    <p class="ptitle">Gain or loss for each share held before</p>
    <svg width={pw} height={H} viewBox="0 0 {pw} {H}" role="img" aria-label="What each kind of shareholder gains or loses" class="gain-panel">
      <AxisY scale={yG} ticks={[-20, -10, 0, 10, 20]} x0={m.left} x1={pw - m.right} format={(v) => (v < 0 ? "−$" : "$") + Math.abs(v)} />
      <line class="zero" x1={m.left} x2={pw - m.right} y1={yG(0)} y2={yG(0)} stroke="var(--ink)" stroke-opacity="0.6" />
      {#each gains as g, i (g.key)}
        <rect class="bar {g.key}" x={cx(i) - bw / 2} y={yG(Math.max(0, g.v))} width={bw} height={Math.abs(yG(g.v) - yG(0))} fill={g.color} />
        <text class="bar-label" x={cx(i)} y={H - m.bottom + 18} text-anchor="middle">{g.label[0]}</text>
        <text class="bar-label" x={cx(i)} y={H - m.bottom + 32} text-anchor="middle">{g.label[1]}</text>
      {/each}
    </svg>
  </div>
  <div class="panel" style="width:{pw}px">
    <p class="ptitle">Earnings per share</p>
    <svg width={pw} height={H} viewBox="0 0 {pw} {H}" role="img" aria-label="Earnings per share before, after a dividend and after a buyback" class="eps-panel">
      <AxisY scale={yE} ticks={[0, 2, 4, 6, 8]} x0={m.left} x1={pw - m.right} format={(v) => "$" + v} />
      {#each eps as g, i (g.key)}
        <rect class="bar {g.key}" x={cx(i) - bw / 2} y={yE(g.v)} width={bw} height={yE(0) - yE(g.v)} fill={g.color} opacity={g.key === "before" ? 0.7 : 1} />
        <text class="bar-label" x={cx(i)} y={H - m.bottom + 18} text-anchor="middle">{g.label[0]}</text>
        <text class="bar-label" x={cx(i)} y={H - m.bottom + 32} text-anchor="middle">{g.label[1]}</text>
      {/each}
    </svg>
  </div>
</div>

<div class="readouts">
  <Readout id="pl-r-price" label="Buyback price" value={"$" + fixed(Pb, 2)} />
  <Readout id="pl-r-stay" label="A share kept is worth" value={"$" + fixed(bb.stay, 2)} color="var(--c1)" />
  <Readout id="pl-r-sold" label="A share sold gains" value={money(bb.sold - V)} color="var(--c2)" />
  <Readout id="pl-r-div" label="Share plus dividend" value={"$" + fixed(dv.wealth, 2)} />
  <Readout id="pl-r-epsd" label="EPS after a dividend" value={"$" + fixed(dv.EPS, 2)} />
  <Readout id="pl-r-epsb" label="EPS after a buyback" value={"$" + fixed(bb.EPS, 2)} color="var(--c1)" />
  <Readout id="pl-r-pe" label="P/E after either, at a fair price" value={fixed(dividend(d).price / dividend(d).EPS, 1)} />
  <Readout id="pl-r-q" label="Shares bought back" value={fixed(100 * bb.bought / FIRM.N, 1) + "%"} />
</div>

<style>
  .panels { display: flex; flex-wrap: wrap; }
  .ptitle { font-size: 0.92rem; font-weight: 700; margin: 0 0 0.2rem; color: var(--ink); }
  .bar-label { font-size: 11px; fill: var(--ink-soft); }
</style>
