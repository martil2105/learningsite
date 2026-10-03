<script>
  /*
    How far each figure is off, by horizon. The reported Sharpe ratio over q
    months divided by the true one: the square-root rule on reported monthly
    returns (flat), and Lo's correction with the true correlations (falling
    towards 1, because smoothing hides a fixed number of months of variance).
  */
  import { linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { loInflationAt, hiddenMonths } from "../smoothing.js";
  import { fixed, signedPct } from "../format.js";

  let { width } = $props();
  let a = $state(0.6);
  const H = 260, QMAX = 120, YMAX = 3.6;
  const m = { top: 26, right: 18, bottom: 46, left: 44 };
  let x = $derived(linear([0, QMAX], [m.left, width - m.right]));
  const y = linear([0.8, YMAX], [H - m.bottom, m.top]);
  let naive = $derived(Math.sqrt((1 + a) / (1 - a)));
  let lo = $derived(path(Array.from({ length: QMAX }, (_, i) => [x(i + 1), y(loInflationAt(a, i + 1))])));
  let at12 = $derived(loInflationAt(a, 12));
  let at60 = $derived(loInflationAt(a, 60));
</script>

<div class="controls">
  <Slider label="Smoothing, a" id="hc-a" min={0} max={0.85} step={0.05} bind:value={a} format={(u) => fixed(+u, 2)} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Reported Sharpe ratio divided by the true one, against the horizon" class="horizon-panel">
  <AxisY scale={y} ticks={[1, 1.5, 2, 2.5, 3, 3.5]} x0={m.left} x1={width - m.right} format={(t) => fixed(t, 1) + "×"} />
  <AxisX scale={x} ticks={width < 500 ? [0, 24, 48, 72, 96, 120] : [0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120]} y={H - m.bottom} format={(t) => String(t / 12)} title="Horizon, years" />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">Reported ÷ true Sharpe ratio</text>
  <line class="one" x1={x(0)} x2={x(QMAX)} y1={y(1)} y2={y(1)} stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="2 3" />
  <line class="naive" x1={x(1)} x2={x(QMAX)} y1={y(naive)} y2={y(naive)} stroke="var(--c2)" stroke-width="3" />
  <path class="lo" d={lo} fill="none" stroke="var(--c1)" stroke-width="3" />
  <circle class="pt12" cx={x(12)} cy={y(at12)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.5" />
  <circle class="pt60" cx={x(60)} cy={y(at60)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.5" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>the square-root rule</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>Lo's correction</span>
</p>

<div class="readouts">
  <Readout id="hc-r-naive" label="Square-root rule, any horizon" value={signedPct(naive - 1, 0)} color="var(--c2)" />
  <Readout id="hc-r-12" label="Lo's correction, one year" value={signedPct(at12 - 1, 0)} color="var(--c1)" />
  <Readout id="hc-r-60" label="Lo's correction, five years" value={signedPct(at60 - 1, 0)} color="var(--c1)" />
  <Readout id="hc-r-h" label="Months of variance hidden in a year" value={fixed(hiddenMonths(a, 12), 2)} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
