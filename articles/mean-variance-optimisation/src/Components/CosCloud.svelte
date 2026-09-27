<script>
  import { linear } from "../scale.js";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { drawsFor } from "../mvo.js";
  import { pct } from "../format.js";

  // Estimates in whitened coordinates. Across: along the best direction.
  // Up: the combined size of the error in every other direction. The angle
  // from the horizontal sets the Sharpe ratio: best x cos(angle).
  let { width } = $props();
  const SR = 0.5, K = 0.8;
  let N = $state(10);
  let years = $state(30);
  let draws = $derived(drawsFor(N, 300, 777));
  let a = $derived(SR * Math.sqrt(years));
  let pts = $derived(Array.from({ length: draws.M }, (_, k) => { const u = a + draws.g1[k], v = Math.sqrt(draws.X[k]); return { u, v, c: u / Math.sqrt(u * u + v * v) }; }));
  let meanCos = $derived(pts.reduce((s, p) => s + p.c, 0) / pts.length);
  let beat = $derived(pts.filter((p) => p.c > K).length / pts.length);
  // equal units on both axes, so angles on screen are true angles
  let D = $derived(Math.max(a + 4, Math.sqrt(N) + 4, 6));
  const m = { top: 12, right: 14, bottom: 40, left: 40 };
  let side = $derived(Math.min(width - m.left - m.right, 420));
  let x = $derived(linear([-3, D], [m.left, m.left + side]));
  let unit = $derived(x(1) - x(0));
  let height = $derived(Math.min(360, Math.ceil(unit * (D * 0.75)) + m.top + m.bottom));
  let yTop = $derived((height - m.top - m.bottom) / unit);
  let y = $derived(linear([0, yTop], [height - m.bottom, m.top]));
  let ray = $derived([x(0), y(0), x(Math.min(D, yTop / Math.tan(Math.acos(K)))), y(Math.min(yTop, D * Math.tan(Math.acos(K))))]);
</script>

<div class="controls">
  <Slider label="Assets N" id="cc-n" min={2} max={50} step={1} bind:value={N} width={200} />
  <Slider label="Years of data" id="cc-years" min={1} max={300} step={1} bind:value={years} width={220} />
</div>
<svg {width} {height} role="img" aria-label="Estimated directions in whitened coordinates" class="cos-cloud" viewBox="0 0 {width} {height}">
  <line x1={x(-3)} x2={x(D)} y1={y(0)} y2={y(0)} stroke="#9aa0ab" />
  <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(yTop)} stroke="#c4c8d0" />
  <line class="ray" x1={ray[0]} y1={ray[1]} x2={ray[2]} y2={ray[3]} stroke="var(--c2)" stroke-dasharray="5 4" />
  <text x={ray[2] - 4} y={ray[3] + 14} text-anchor="end" font-size="11" fill="var(--c2)">beats equal weights below this line</text>
  {#each pts as p, k (k)}
    <circle cx={x(Math.max(-3, Math.min(D, p.u)))} cy={y(Math.min(yTop, p.v))} r="2.3" fill={p.c > K ? "var(--c3)" : "#9aa0ab"} opacity="0.7" />
  {/each}
  <circle class="truth" cx={x(a)} cy={y(0)} r="5.5" fill="var(--ink)" />
  <text x={x(a)} y={y(0) + 16} text-anchor="middle" font-size="11" fill="var(--ink)">truth</text>
  <text class="axis-title" x={x(D)} y={height - 6} text-anchor="end">along the best portfolio →</text>
  <text class="axis-title" transform="translate({x(-3) - 8},{y(yTop / 2)}) rotate(-90)" text-anchor="middle">error in all other directions</text>
</svg>
<div class="readouts">
  <Readout id="cc-a" label="Signal, SR × √years" value={a.toFixed(2)} />
  <Readout id="cc-sr" label="Average Sharpe achieved" value={(SR * meanCos).toFixed(2)} color="var(--c2)" />
  <Readout id="cc-beat" label="Histories beating equal weights" value={pct(beat, 0)} color="var(--c3)" />
</div>
