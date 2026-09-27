<script>
  /*
    The hook. Two panels sharing the horizon axis: what it costs to insure
    stocks against ending behind bonds (Bodie's put, 2N(s/2) - 1 of the stake),
    and the real-world chance that the insurance pays anything. The premium
    moves only the second panel.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { insuranceCost, chanceBehind, YEARS } from "../insurance.js";
  import { pathOf } from "../chart.js";
  import { pct } from "../format.js";

  let { width, T = $bindable(1), sigma = $bindable(0.2), premium = $bindable(0.06) } = $props();

  const H = 200;
  const m = { top: 12, right: 16, bottom: 42, left: 58 };
  let x = $derived(linear([0, YEARS], [m.left, width - m.right]));
  const yC = linear([0, 0.8], [H - m.bottom, m.top]);
  const yP = linear([0, 0.8], [H - m.bottom, m.top]);
  const ts = Array.from({ length: YEARS * 4 }, (_, i) => 0.25 + i / 4);
  let costD = $derived(pathOf([[x(0), yC(0)], ...ts.map((t) => [x(t), yC(insuranceCost(t, sigma))])]));
  let chanceD = $derived(pathOf(ts.map((t) => [x(t), yP(chanceBehind(t, premium, sigma))])));
  const yt = [0, 0.2, 0.4, 0.6, 0.8];
  const xt = [0, 10, 20, 30, 40];
</script>

<div class="controls">
  <Slider label="Horizon" id="pl-T" min={1} max={YEARS} step={1} bind:value={T} format={(v) => `${v} ${v === 1 ? "year" : "years"}`} width={220} />
  <Segmented label="Stock volatility" id="pl-sigma" bind:value={sigma} options={[0.15, 0.2, 0.25].map((v) => ({ value: v, label: pct(v, 0) }))} />
  <Slider label="Expected premium over bonds" id="pl-premium" min={0} max={0.1} step={0.01} bind:value={premium} format={(v) => pct(v, 0)} width={220} />
</div>

<p class="panel-title">Cost of the insurance, as a share of the money insured</p>
<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Cost of insurance by horizon" class="cost-panel">
  <AxisY scale={yC} ticks={yt} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <AxisX scale={x} ticks={xt} y={H - m.bottom} title="years insured" />
  <path class="cost-line" d={costD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <line class="t-marker" x1={x(T)} x2={x(T)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" opacity="0.5" />
  <circle class="cost-dot" cx={x(T)} cy={yC(insuranceCost(T, sigma))} r="5" fill="var(--c1)" />
</svg>

<p class="panel-title">Chance that stocks end behind bonds</p>
<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Chance the insurance pays, by horizon" class="chance-panel">
  <AxisY scale={yP} ticks={yt} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <AxisX scale={x} ticks={xt} y={H - m.bottom} title="years insured" />
  <path class="chance-line" d={chanceD} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <line class="t-marker" x1={x(T)} x2={x(T)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" opacity="0.5" />
  <circle class="chance-dot" cx={x(T)} cy={yP(chanceBehind(T, premium, sigma))} r="5" fill="var(--c2)" />
</svg>

<div class="readouts">
  <Readout id="pl-r-cost" label="Insurance costs" value={pct(insuranceCost(T, sigma), 1)} color="var(--c1)" />
  <Readout id="pl-r-chance" label="Chance it pays out" value={pct(chanceBehind(T, premium, sigma), 0)} color="var(--c2)" />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
</style>
