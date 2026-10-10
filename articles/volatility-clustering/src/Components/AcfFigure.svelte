<script>
  /*
    The autocorrelation of daily returns (pink) and of their sizes, the
        absolute returns (blue), against the lag in days on a log axis. The grey
    band is two standard errors of a return autocorrelation for days with no
    memory in their direction, allowing for a spread that changes (robust).
  */
  import { linear, log, bandOf } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { ACF } from "../garch.js";
  
  import { fixed, thousands } from "../format.js";

  let { width } = $props();
  let li = $state(0);
  const H = 270, m = { top: 12, right: 18, bottom: 44, left: 48 };
  let X = $derived(log(1, 500, m.left, width - m.right));
  const Y = linear(-0.1, 0.4, H - m.bottom, m.top);
  
  const line = (key, X) => ACF.map((p, i) => (i ? "L" : "M") + X(p.k).toFixed(2) + "," + Y(p[key]).toFixed(2)).join("");
  let rPath = $derived(line("r", X)), aPath = $derived(line("abs", X));
    let p = $derived(ACF[li]);
  let band = $derived(bandOf(ACF.map((q) => X(q.k)), ACF.map((q) => Y(-2 * q.se)), ACF.map((q) => Y(2 * q.se))));
</script>

<div class="controls">
  <Slider id="af-lag" label="Days apart" min={0} max={ACF.length - 1} step={1} bind:value={li} format={(i) => thousands(ACF[i].k)} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Autocorrelation of returns and of their sizes, by lag" class="acf-panel">
  <AxisY scale={Y} ticks={[-0.1, 0, 0.1, 0.2, 0.3, 0.4]} x0={m.left} x1={width - m.right} format={(v) => fixed(v, 1)} />
  <path class="band" d={band} fill="#8a94a2" fill-opacity="0.25" />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [1, 2, 5, 10, 21, 63, 252, 500] as t (t)}
      {#if width >= 560 || [1, 10, 63, 500].includes(t)}
        <g transform="translate({X(t)},{H - m.bottom})">
          <line y2="5" />
          <text class="tick-label" y="18" text-anchor="middle">{t}</text>
        </g>
      {/if}
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 8} text-anchor="middle">days apart (log scale)</text>
  </g>
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.5" />
  <path class="abs" d={aPath} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="ret" d={rPath} fill="none" stroke="var(--c2)" stroke-width="2.2" />
  <line class="scrub" x1={X(p.k)} x2={X(p.k)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" stroke-opacity="0.45" />
  <circle class="dot-abs" cx={X(p.k)} cy={Y(p.abs)} r="4.5" fill="var(--c1)" />
  <circle class="dot-ret" cx={X(p.k)} cy={Y(p.r)} r="4.5" fill="var(--c2)" />
</svg>
<div class="legend">
  <span><i style="background:var(--c2)"></i>returns</span>
  <span><i style="background:var(--c1)"></i>sizes of returns</span>
  <span><i style="background:#8a94a2;opacity:0.5;height:10px;vertical-align:0"></i>no memory in direction, two standard errors</span>
</div>

<div class="readouts">
  <Readout id="af-r-lag" label="Days apart" value={thousands(p.k)} />
  <Readout id="af-r-ret" label="Returns" value={fixed(p.r, 3)} color="var(--c2)" />
  <Readout id="af-r-abs" label="Sizes" value={fixed(p.abs, 3)} color="var(--c1)" />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
