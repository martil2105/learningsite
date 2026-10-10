<script>
  /*
    The model's spread as a multiple of the expected-loss spread, against the
    real chance of default within the horizon (log axes), at the theta set in
    the lab above. Dots mark Aaa and Baa at that horizon.
  */
  import { log } from "../chart.js";
  import { bandPath } from "../clip.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { multiple, DEFAULTS, PhiInv, Phi, lossSpread } from "../credit.js";
  import { pct } from "../format.js";

  let { width, theta = 0.215 } = $props();
  let T = $state(10);
  const H = 270, m = { top: 12, right: 16, bottom: 44, left: 44 };
  let X = $derived(log(0.0001, 0.5, m.left, width - m.right));
  const Y = log(1, 30, H - m.bottom, m.top);
  const PS = Array.from({ length: 121 }, (_, i) => Math.pow(10, -4 + (i * Math.log10(5000)) / 120));
  const Z = PS.map(PhiInv);
  let curve = $derived(bandPath(PS.map((p, i) => [X(p), Y(lossSpread(Phi(Z[i] + theta * Math.sqrt(T)), T) / lossSpread(p, T))]), m.top, H - m.bottom));
  let aaa = $derived(multiple(DEFAULTS.Aaa[T], theta, T));
  let baa = $derived(multiple(DEFAULTS.Baa[T], theta, T));
</script>

<div class="controls">
  <Segmented id="mf-t" label="Horizon" options={[{ value: 4, label: "4 years" }, { value: 10, label: "10 years" }]} bind:value={T} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The model's spread as a multiple of expected losses, against the chance of default" class="mult-panel">
  <AxisY scale={Y} ticks={[1, 2, 5, 10, 20]} x0={m.left} x1={width - m.right} format={(t) => t + "×"} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0.0001, 0.001, 0.01, 0.1] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, t < 0.001 ? 2 : t < 0.01 ? 1 : 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">the real chance of default (log scale)</text>
  </g>
  <path class="mult" d={curve} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <circle class="dot-aaa" cx={X(DEFAULTS.Aaa[T])} cy={Y(aaa)} r="5.5" fill="white" stroke="var(--ink)" stroke-width="2" />
  <circle class="dot-baa" cx={X(DEFAULTS.Baa[T])} cy={Y(baa)} r="5.5" fill="var(--ink)" stroke="white" stroke-width="1.2" />
</svg>
<div class="legend">
  <span><i class="ring"></i>Aaa</span>
  <span><i class="dot"></i>Baa</span>
</div>

<div class="readouts">
  <Readout id="mf-aaa" label="Aaa, times its expected loss" value={aaa.toFixed(2) + "×"} />
  <Readout id="mf-baa" label="Baa" value={baa.toFixed(2) + "×"} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: -1px; }
  .legend i.dot { background: var(--ink); }
  .legend i.ring { background: white; border: 2px solid var(--ink); }
</style>
