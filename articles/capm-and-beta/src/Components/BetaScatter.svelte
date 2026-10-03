<script>
  /*
    A beta is a slope. Every month since July 1963 as a dot: the market's
    excess return across, one beta decile's excess return up. The blue line is
    the least-squares fit; its slope is the beta the portfolio had. The dashed
    line has slope 1, a portfolio that moves one for one with the market.
  */
  import { linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { LABELS, MKT, excessOf, ols, usDeciles } from "../capm.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let k = $state(10);
  const NAMES = ["lowest tenth", "2nd tenth", "3rd tenth", "4th tenth", "5th tenth", "6th tenth", "7th tenth", "8th tenth", "9th tenth", "highest tenth"];
  const ALL = usDeciles();
  let y = $derived(excessOf(k - 1));
  let fit = $derived(ols(MKT, y));
  let side = $derived(Math.min(width, 520));
  const LIM = 35;
  const m = { top: 26, right: 14, bottom: 46, left: 44 };
  let H = $derived(side);
  let X = $derived(linear([-LIM, LIM], [m.left, side - m.right]));
  let Y = $derived(linear([-LIM, LIM], [H - m.bottom, m.top]));
  // lines drawn only inside the square window
  const seg = (b, a = 0) => {
    const lo = Math.max(-LIM, (-LIM - a) / b), hi = Math.min(LIM, (LIM - a) / b);
    return [[Math.min(lo, hi), a + b * Math.min(lo, hi)], [Math.max(lo, hi), a + b * Math.max(lo, hi)]];
  };
  let fitD = $derived(path(seg(fit.b, fit.a).map(([u, v]) => [X(u), Y(v)])));
  let oneD = $derived(path(seg(1).map(([u, v]) => [X(u), Y(v)])));
  let inside = $derived(MKT.map((x, t) => [x, y[t]]).filter(([u, v]) => Math.abs(u) <= LIM && Math.abs(v) <= LIM));
</script>

<div class="controls">
  <Slider label="Beta decile" id="bs-k" min={1} max={10} step={1} bind:value={k} format={(u) => NAMES[u - 1]} width={260} />
</div>

<div class="wrap" style="width:{side}px">
  <svg width={side} height={H} viewBox="0 0 {side} {H}" role="img" aria-label="Monthly excess returns of one beta decile against the market's" class="scatter-panel">
    <AxisY scale={Y} ticks={[-30, -20, -10, 0, 10, 20, 30]} x0={m.left} x1={side - m.right} format={(t) => t + "%"} />
    <AxisX scale={X} ticks={[-30, -20, -10, 0, 10, 20, 30]} y={H - m.bottom} format={(t) => t + "%"} title="Market's excess return that month" />
    <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">Decile's excess return</text>
    {#each inside as [u, v], i (i)}
      <circle class="month" cx={X(u)} cy={Y(v)} r="2" fill="#8a94a2" fill-opacity="0.45" />
    {/each}
    <path class="one" d={oneD} fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4" />
    <path class="fit" d={fitD} fill="none" stroke="var(--c1)" stroke-width="3" />
  </svg>
</div>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>best straight line</span>
  <span class="key"><span class="swatch dash"></span>slope of 1</span>
</p>

<div class="readouts">
  <Readout id="bs-r-had" label="Beta it had (slope)" value={fixed(fit.b, 2)} color="var(--c1)" />
  <Readout id="bs-r-sorted" label="Beta it was sorted on" value={fixed(ALL[k - 1].sorted, 2)} />
  <Readout id="bs-r-n" label="Months" value={String(MKT.length)} />
</div>

<style>
  .wrap { margin: 0 auto; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 9px); height: 2px; }
</style>
