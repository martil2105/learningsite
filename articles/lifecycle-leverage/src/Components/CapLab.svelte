<script>
  /*
    What early leverage buys. For each cap on the leverage, the change from a
    saver at 100% stocks in three things a simulation of 100,000 savers gives:
    the spread of final wealth (the standard deviation of ln W), the 5th
    percentile and the median. Every rule has the same total exposure.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { CAPS } from "../caps.js";
  import { DATA } from "../precomputed.js";
  import { pct, fixed, signedPct } from "../format.js";

  let { width, cap = $bindable(2) } = $props();

  const H1 = 260;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  const LO = -0.15, HI = 0.2;
  let x = $derived(linear([1, 4], [m.left, width - m.right]));
  const yS = linear([LO, HI], [H1 - m.bottom, m.top]);
  const rel = (key, field) => DATA[key][field] / DATA["1"][field] - 1;
  const SERIES = [
    { id: "sd", label: "spread of final wealth", field: "sd", color: "var(--c1)" },
    { id: "p5", label: "5th percentile", field: "p5", color: "var(--c3)" },
    { id: "med", label: "median", field: "median", color: "var(--c2)" },
  ];
  let lines = $derived(SERIES.map((s) => ({ ...s, d: "M " + CAPS.map((c) => `${x(c).toFixed(2)} ${yS(rel(String(c), s.field)).toFixed(2)}`).join(" L "), v: rel(String(cap), s.field) })));
  const capLabel = (c) => (c === 1 ? "None" : `${c} to 1`);
</script>

<div class="controls">
  <Segmented label="Cap on leverage" id="cl-cap" bind:value={cap}
    options={[{ value: 1, label: "None" }, { value: 1.5, label: "1.5 to 1" }, { value: 2, label: "2 to 1" }, { value: 3, label: "3 to 1" }, { value: 4, label: "4 to 1" }]} />
</div>

<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Change in the spread, the 5th percentile and the median of final wealth against the cap on leverage" class="cap-panel">
  <AxisY scale={yS} ticks={[-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15, 0.2]} x0={m.left} x1={width - m.right} format={(v) => signedPct(v, 0)} title="against 100% stocks" />
  <AxisX scale={x} ticks={[1, 1.5, 2, 2.5, 3, 3.5, 4]} y={H1 - m.bottom} title="cap on leverage, wealth in stocks as a multiple" />
  <line class="zero-line" x1={m.left} x2={width - m.right} y1={yS(0)} y2={yS(0)} stroke="var(--ink)" stroke-width="1" opacity="0.6" />
  <line class="cap-marker" x1={x(cap)} x2={x(cap)} y1={m.top} y2={H1 - m.bottom} stroke="var(--ink)" opacity="0.5" />
  {#each lines as l (l.id)}
    <path class="series" data-series={l.id} d={l.d} fill="none" stroke={l.color} stroke-width="2.6" />
    <circle class="dot" data-series={l.id} cx={x(cap)} cy={yS(l.v)} r="4.5" fill={l.color} stroke="white" stroke-width="1.2" />
  {/each}
</svg>
<p class="legend">
  {#each SERIES as s (s.id)}
    <span class="key"><span class="swatch" style="background:{s.color}"></span>{s.label}</span>
  {/each}
</p>

<div class="readouts">
  <Readout id="cl-r-e1" label="Leverage in year 1" value={`${fixed(DATA[String(cap)].e1, 1)} to 1`} />
  <Readout id="cl-r-neff" label="Effective years, of 40" value={fixed(DATA[String(cap)].neff, 1)} />
  <Readout id="cl-r-sd" label="Spread of final wealth" value={signedPct(rel(String(cap), "sd"), 0)} color="var(--c1)" />
  <Readout id="cl-r-p5" label="5th percentile" value={signedPct(rel(String(cap), "p5"), 0)} color="var(--c3)" />
  <Readout id="cl-r-med" label="Median" value={signedPct(rel(String(cap), "median"), 0)} color="var(--c2)" />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
