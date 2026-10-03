<script>
  /*
    What the tax saving adds. Firm value against the size of the loan, for an
    all-equity firm worth $100 after tax: a permanent loan adds tax x D, and a
    loan kept at a fixed share of the firm's value adds tax x rD x D / rA.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { shieldPermanent, shieldRebalanced } from "../firm.js";
  import { pct, fixed } from "../format.js";

  let { width } = $props();
  let tax = $state(0.22);
  let D = $state(50);
  const H = 250, XMAX = 60, Y0 = 100, YMAX = 125;
  const m = { top: 26, right: 18, bottom: 46, left: 48 };
  let x = $derived(linear([0, XMAX], [m.left, width - m.right]));
  const y = linear([Y0, YMAX], [H - m.bottom, m.top]);
  let perm = $derived(shieldPermanent(D, tax));
  let reb = $derived(shieldRebalanced(D, tax));
</script>

<div class="controls">
  <Slider label="Tax rate" id="tf-tax" min={0} max={0.4} step={0.01} bind:value={tax} format={(u) => pct(+u, 0)} width={220} />
  <Slider label="Loan" id="tf-d" min={0} max={XMAX} step={1} bind:value={D} format={(u) => "$" + u} width={220} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="What the firm is worth against the size of its loan, with a permanent loan and with a loan kept at a fixed share of value" class="tax-panel">
  <AxisY scale={y} ticks={[100, 105, 110, 115, 120, 125]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <AxisX scale={x} ticks={[0, 10, 20, 30, 40, 50, 60]} y={H - m.bottom} format={(t) => "$" + t} title="Size of the loan" />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">What the firm is worth</text>
  <line class="none" x1={x(0)} x2={x(XMAX)} y1={y(100)} y2={y(100)} stroke="#8a94a2" stroke-width="1.5" stroke-dasharray="2 3" />
  <line class="perm" x1={x(0)} y1={y(100)} x2={x(XMAX)} y2={y(100 + shieldPermanent(XMAX, tax))} stroke="var(--c1)" stroke-width="3" />
  <line class="reb" x1={x(0)} y1={y(100)} x2={x(XMAX)} y2={y(100 + shieldRebalanced(XMAX, tax))} stroke="var(--c2)" stroke-width="3" />
  <circle class="pt-perm" cx={x(D)} cy={y(100 + perm)} r="5.5" fill="var(--c1)" stroke="white" stroke-width="1.5" />
  <circle class="pt-reb" cx={x(D)} cy={y(100 + reb)} r="5.5" fill="var(--c2)" stroke="white" stroke-width="1.5" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>a permanent loan</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>a loan kept at a fixed share of the firm's value</span>
</p>

<div class="readouts">
  <Readout id="tf-r-perm" label="A permanent loan adds" value={"$" + fixed(perm, 2)} color="var(--c1)" />
  <Readout id="tf-r-reb" label="A loan kept at a fixed share adds" value={"$" + fixed(reb, 2)} color="var(--c2)" />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
