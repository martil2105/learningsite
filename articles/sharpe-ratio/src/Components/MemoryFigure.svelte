<script>
  /*
    How memory adds up over a year. The variance of a q-month return, in
    months' worth of variance, against q: a straight line when months are
    uncorrelated, and a curve when each month is correlated with the last by
    rho (and with the month k back by rho^k).
  */
  import { linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { qVarianceFactor, ar1Factor } from "../smoothing.js";
  import { fixed, signedPct } from "../format.js";

  let { width } = $props();
  let rho = $state(0.1);
  const H = 250, QMAX = 12, YMAX = 35;
  const m = { top: 26, right: 18, bottom: 46, left: 44 };
  let x = $derived(linear([0, QMAX], [m.left, width - m.right]));
  const y = linear([0, YMAX], [H - m.bottom, m.top]);
  const V = (q, r) => qVarianceFactor(q, (k) => Math.pow(r, k));
  let curve = $derived(path(Array.from({ length: QMAX }, (_, i) => [x(i + 1), y(V(i + 1, rho))])));
  let straight = $derived(path([[x(1), y(1)], [x(QMAX), y(QMAX)]]));
  let v12 = $derived(V(12, rho));
  let f = $derived(ar1Factor(rho));
</script>

<div class="controls">
  <Slider label="Correlation with last month" id="mf-rho" min={-0.5} max={0.5} step={0.05} bind:value={rho} format={(u) => fixed(+u, 2)} width={280} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The variance of a return over several months, with and without memory" class="memory-panel">
  <AxisY scale={y} ticks={[0, 5, 10, 15, 20, 25, 30, 35]} x0={m.left} x1={width - m.right} />
  <AxisX scale={x} ticks={[1, 3, 6, 9, 12]} y={H - m.bottom} title="Months added together" />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">Variance, in months' worth</text>
  <path class="straight" d={straight} fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="5 4" />
  <path class="curve mem" d={curve} fill="none" stroke="var(--c1)" stroke-width="3" />
  <circle class="pt" cx={x(12)} cy={y(v12)} r="5.5" fill="var(--c1)" stroke="white" stroke-width="1.5" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>months that remember</span>
  <span class="key"><span class="swatch dash"></span>months that don't</span>
</p>

<div class="readouts">
  <Readout id="mf-r-v" label="A year's variance" value={fixed(v12, 1) + " months"} color="var(--c1)" />
  <Readout id="mf-r-f" label="The √12 rule is off by" value={signedPct(f - 1, 1)} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 9px); height: 2px; }
</style>
