<script>
  /*
    Twenty five-year windows of US daily returns, 1927 to 2026. One view is
    the lag-1 autocorrelation of each window, with a grey band two standard
    errors either side of zero (what a random walk would usually stay inside).
    The other is the rule on paper: hold the market after a day it rose, bills
    after a day it fell, with a tick for simply holding the market.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { WINDOW_STATS, label } from "../history.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let view = $state("rho");
  let pick = $state(8);
  const n = WINDOW_STATS.length;
  const H = 270, m = { top: 14, right: 12, bottom: 34, left: 48 };
  let slot = $derived((width - m.left - m.right) / n);
  const xOf = (i, s) => m.left + s * i;
  let lo = $derived(view === "rho" ? -0.3 : -0.2), hi = $derived(view === "rho" ? 0.4 : 0.4);
  let Y = $derived(linear(lo, hi, H - m.bottom, m.top));
  let ticks = $derived(view === "rho" ? [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4] : [-0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4]);
  const val = (w, v) => (v === "rho" ? w.rho1 : w.rule);
  let w = $derived(WINDOW_STATS[pick]);
  
</script>

<div class="controls">
  <Segmented id="hb-view" label="Show" options={[{ value: "rho", label: "Lag-1 autocorrelation" }, { value: "rule", label: "The rule on paper" }]} bind:value={view} />
  <Slider id="hb-pick" label="Window" min={0} max={n - 1} step={1} bind:value={pick} format={(i) => label([WINDOW_STATS[i].a, WINDOW_STATS[i].b])} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Five-year windows of US daily returns" class="history-panel">
  <AxisY scale={Y} {ticks} x0={m.left} x1={width - m.right} format={(v) => (view === "rho" ? fixed(v, 1) : pct(v, 0))} />
    {#if view === "rho"}
    {#each WINDOW_STATS as s, i (i)}
      <rect class="band" data-i={i} x={xOf(i, slot)} width={slot} y={Y(2 * s.se)} height={Y(-2 * s.se) - Y(2 * s.se)} fill="#8a94a2" fill-opacity="0.22" />
    {/each}
  {/if}
  {#each WINDOW_STATS as s, i (i)}
    {@const v = val(s, view)}
    <rect class="bar" class:picked={i === pick} data-i={i} x={xOf(i, slot) + slot * 0.14} width={Math.max(1, slot * 0.72)} y={Y(Math.max(0, v))} height={Math.abs(Y(v) - Y(0))}
      fill={v >= 0 ? "var(--c1)" : "var(--c2)"} fill-opacity={i === pick ? 1 : 0.55} />
    {#if view === "rule"}
      <line class="mkt" data-i={i} x1={xOf(i, slot) + slot * 0.04} x2={xOf(i, slot) + slot * 0.96} y1={Y(s.market)} y2={Y(s.market)} stroke="var(--ink)" stroke-width="2.4" />
    {/if}
  {/each}
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.6" />
  <g class="axis axis-x">
    {#each [0, 4, 8, 12, 16] as i (i)}
      <g transform="translate({xOf(i, slot) + slot / 2},{H - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{WINDOW_STATS[i].a}</text>
      </g>
    {/each}
  </g>
</svg>

<div class="legend">
  {#if view === "rho"}
    <span><i style="background:#8a94a2;opacity:0.5;height:10px"></i>two standard errors of a random walk</span>
  {:else}
    <span><i style="background:var(--c1)"></i>the rule, a year</span>
    <span><i style="background:var(--ink)"></i>holding the market, a year</span>
  {/if}
</div>

<div class="readouts">
  <Readout id="hb-r-win" label="Window" value={label([w.a, w.b])} />
  <Readout id="hb-r-rho" label="Lag-1 autocorrelation" value={fixed(w.rho1, 2)} color={w.rho1 >= 0 ? "var(--c1)" : "var(--c2)"} />
  <Readout id="hb-r-rule" label="Rule on paper, a year" value={pct(w.rule, 1)} />
  <Readout id="hb-r-mkt" label="Market, a year" value={pct(w.market, 1)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 0; }
</style>
