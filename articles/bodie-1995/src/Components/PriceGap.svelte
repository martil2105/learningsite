<script>
  /*
    The price of the insurance against the payout we'd expect from it with
    real-world odds, both as a share of the stake. The gap is what we pay for
    the insurance paying out in bad times. At a zero premium the payout line
    lands on the price line: the price is the average payout in a world where
    stocks earn no premium.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { insuranceCost, expectedPayout, SIGMA, YEARS } from "../insurance.js";
  import { pathOf, bandOf } from "../chart.js";
  import { pct, fixed } from "../format.js";

  let { width, T = 30, premium = $bindable(0.06) } = $props();

  const H = 250;
  const m = { top: 12, right: 16, bottom: 42, left: 58 };
  let x = $derived(linear([0, YEARS], [m.left, width - m.right]));
  const y = linear([0, 0.5], [H - m.bottom, m.top]);
  const ts = Array.from({ length: YEARS * 4 + 1 }, (_, i) => i / 4);
  const cost = (t) => (t === 0 ? 0 : insuranceCost(t, SIGMA));
  const pay = (t, p) => (t === 0 ? 0 : expectedPayout(t, p, SIGMA));
  let costD = $derived(pathOf(ts.map((t) => [x(t), y(cost(t))])));
  let payD = $derived(pathOf(ts.map((t) => [x(t), y(pay(t, premium))])));
  let gapD = $derived(bandOf(ts.map((t) => x(t)), ts.map((t) => y(pay(t, premium))), ts.map((t) => y(cost(t)))));
  let ratio = $derived(cost(T) / pay(T, premium));
</script>

<div class="controls">
  <Segmented label="Expected premium over bonds" id="pg-premium" bind:value={premium}
    options={[0, 0.02, 0.04, 0.06, 0.08].map((v) => ({ value: v, label: pct(v, 0) }))} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Price of the insurance against its expected payout" class="price-gap">
  <path class="gap" d={gapD} fill="var(--c1-soft)" opacity="0.7" />
  <AxisY scale={y} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="share of the stake" />
  <AxisX scale={x} ticks={[0, 10, 20, 30, 40]} y={H - m.bottom} title="years insured" />
  <path class="price-line" d={costD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="payout-line" d={payD} fill="none" stroke="var(--c2)" stroke-width="2.4" stroke-dasharray={premium === 0 ? "6 5" : ""} />
  <line class="t-marker" x1={x(T)} x2={x(T)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" opacity="0.5" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>price of the insurance</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>payout we'd expect, with real-world odds</span>
</p>
<div class="readouts">
  <Readout id="pg-r-T" label="Horizon" value={`${T} ${T === 1 ? "year" : "years"}`} />
  <Readout id="pg-r-cost" label="Price" value={pct(cost(T), 1)} color="var(--c1)" />
  <Readout id="pg-r-pay" label="Expected payout" value={pct(pay(T, premium), 1)} color="var(--c2)" />
  <Readout id="pg-r-ratio" label="Price ÷ payout" value={`${fixed(ratio, 1)}×`} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
