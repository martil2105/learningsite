<script>
  /*
    A project with two IRRs: dig for $100, sell $520 of ore next year, pay
    $480 to restore the land the year after. Its NPV against the cost of
    capital, the two IRRs, and the identity applied at each of them.
  */
  import { linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { MINE, npv, irrs, capital } from "../projects.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let r = $state(0.1);
  const ks = irrs(MINE);
  let rows = $derived(ks.map((k) => { const c = capital(MINE, k, r); return { k, c, margin: k - r, product: c * (k - r) }; }));
  let v = $derived(npv(MINE, r));
  const H = 260, XMAX = 3.5;
  const m = { top: 16, right: 18, bottom: 46, left: 50 };
  let x = $derived(linear([0, XMAX], [m.left, width - m.right]));
  const y = linear([-70, 50], [H - m.bottom, m.top]);
  let d = $derived.by(() => { const p = []; for (let i = 0; i <= 350; i++) { const rr = (XMAX * i) / 350; p.push([x(rr), y(npv(MINE, rr))]); } return path(p); });
  const money = (u) => (u < -0.004 ? "−$" : "$") + fixed(Math.abs(u), 2);
  const signed = (u) => (u < -0.004 ? "−" : "") + fixed(Math.abs(u), 2);
  const pts = (u) => (u > 0.00005 ? "+" : u < -0.00005 ? "−" : "") + fixed(Math.abs(100 * u), 0) + " pts";
</script>

<div class="controls">
  <Slider label="Cost of capital" id="mf-r" min={0} max={3.5} step={0.01} bind:value={r} format={(u) => pct(+u, 0)} width={280} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The mine's NPV against the cost of capital, with its two IRRs" class="mine-panel">
  <AxisY scale={y} ticks={[-60, -40, -20, 0, 20, 40]} x0={m.left} x1={width - m.right} format={(t) => (t < 0 ? "−$" : "$") + Math.abs(t)} />
  <AxisX scale={x} ticks={width < 500 ? [0, 1, 2, 3] : [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]} y={H - m.bottom} format={(t) => pct(t, 0)} title="Cost of capital" />
  <line class="zero" x1={x(0)} x2={x(XMAX)} y1={y(0)} y2={y(0)} stroke="var(--ink)" stroke-opacity="0.6" />
  <line class="rline" x1={x(r)} x2={x(r)} y1={y(-70)} y2={y(50)} stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="4 3" />
  <path class="prof mine" d={d} fill="none" stroke="var(--c3)" stroke-width="3" />
  {#each ks as k, i (k)}
    <circle class="irr k{i}" cx={x(k)} cy={y(0)} r="5" fill="white" stroke="var(--c3)" stroke-width="2" />
  {/each}
  <circle class="at" cx={x(r)} cy={y(v)} r="5.5" fill="var(--c3)" stroke="white" stroke-width="1.5" />
</svg>

<div class="readouts">
  <Readout id="mf-r-npv" label="NPV" value={money(v)} color="var(--c3)" />
  {#each rows as row, i (row.k)}
    <Readout id={"mf-r-cap" + i} label={"At the " + pct(row.k, 0) + " IRR: money tied up"} value={signed(row.c)} />
    <Readout id={"mf-r-mar" + i} label={"At the " + pct(row.k, 0) + " IRR: margin"} value={pts(row.margin)} />
    <Readout id={"mf-r-pro" + i} label={"At the " + pct(row.k, 0) + " IRR: the product"} value={money(row.product)} />
  {/each}
</div>
