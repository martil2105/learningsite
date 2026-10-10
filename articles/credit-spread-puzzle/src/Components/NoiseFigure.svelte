<script>
  /*
    How sure is a ten-year default rate measured over 32 years? In a
    one-factor world where Baa firms really default 4.89% of the time within
    ten years, 2,000 seeded 32-year records each average 23 overlapping
    cohorts. The histogram is their estimates; the ink line is the truth and
    the blue band is the middle 90% of records.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { records, summary, modelSpread, DEFAULTS } from "../credit.js";
  import { normals } from "../random.js";
  import { pct, fixed } from "../format.js";

  let { width, theta = 0.215 } = $props();
  let rho = $state(0.15);
  const H = 250, m = { top: 12, right: 16, bottom: 44, left: 44 };
  let X = $derived(linear(0, 0.2, m.left, width - m.right));
  const BIN = 0.0025, NB = 80;
  let est = $derived(records(rho, { draws: normals(11) }));
  let s = $derived(summary(est));
  let counts = $derived.by(() => { const c = new Array(NB).fill(0); for (const v of est) c[Math.min(NB - 1, Math.floor(v / BIN))]++; return c; });
  const Y = linear(0, 200, H - m.bottom, m.top);
  const P = DEFAULTS.Baa[10];
</script>

<div class="controls">
  <Slider id="nf-rho" label="How much firms' fortunes move together" min={0.05} max={0.3} step={0.05} bind:value={rho} format={(v) => v.toFixed(2)} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Default rates estimated from 2,000 simulated 32-year records" class="noise-panel">
  <rect class="band" x={X(s.lo)} y={m.top} width={X(s.hi) - X(s.lo)} height={H - m.bottom - m.top} fill="var(--c1-soft)" opacity="0.7" />
  <AxisY scale={Y} ticks={[0, 50, 100, 150, 200]} x0={m.left} x1={width - m.right} />
  {#each counts as c, i (i)}
    {#if c > 0}<rect class="bin" x={X(i * BIN) + 0.5} y={Y(Math.min(c, 200))} width={Math.max(0, X(BIN) - X(0) - 1)} height={Y(0) - Y(Math.min(c, 200))} fill="var(--c1)" />{/if}
  {/each}
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 0.05, 0.1, 0.15, 0.2] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">the ten-year default rate a record would show</text>
  </g>
  <line class="truth" x1={X(P)} x2={X(P)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" stroke-width="2" stroke-dasharray="5 3" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>records, by what they show</span>
  <span><i class="dash"></i>the true rate, 4.89%</span>
  <span><i class="soft"></i>the middle 90% of records</span>
</div>

<div class="readouts">
  <Readout id="nf-range" label="Middle 90% of records" value={pct(s.lo, 1) + " to " + pct(s.hi, 1)} />
  <Readout id="nf-median" label="The typical record" value={pct(s.median, 2)} />
  <Readout id="nf-below" label="Records below the truth" value={pct(s.below, 0)} />
  <Readout id="nf-spread" label="Model Baa spread, over that range" value={fixed(100 * modelSpread(s.lo, theta), 2) + " to " + fixed(100 * modelSpread(s.hi, theta), 2) + " points"} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 8px; margin-right: 6px; vertical-align: 0; }
  .legend i.dash { height: 3px; vertical-align: 3px; background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
  .legend i.soft { background: var(--c1-soft); }
</style>
