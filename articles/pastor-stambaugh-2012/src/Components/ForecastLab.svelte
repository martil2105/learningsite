<script>
  /*
    The hook. One history of N years gives us an estimate of stocks' yearly
    growth over bonds. We forecast the next k years with it and draw two 90%
    bands: one that treats the estimate as the truth (blue), and one that
    allows for the error in it (pink, 1 + k/N times the variance per year).
    The grey paths are futures drawn from the true trend, which we can't see.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath, clampedBand } from "../clip.js";
  import { history, futures, meanOnlyRatio, GROWTH, SIGMA, HORIZON } from "../longrun.js";
  import { pct, fixed } from "../format.js";

  let { width, N = $bindable(100), k = $bindable(30), seed = $bindable(1) } = $props();

  const Z90 = 1.6448536269514722;
  const PATHS = 100;
  const height = 330;
  const m = { top: 14, right: 16, bottom: 46, left: 62 };
  const lo = Math.log(0.05), hi = Math.log(1000);
  const paths = futures(7, PATHS);

  let est = $derived(history(seed, N));
  let x = $derived(linear([0, HORIZON], [m.left, width - m.right]));
  const y = linear([lo, hi], [height - m.bottom, m.top]);
  const ts = Array.from({ length: HORIZON * 2 + 1 }, (_, i) => i / 2);

  let naiveLo = $derived(ts.map((t) => est * t - Z90 * SIGMA * Math.sqrt(t)));
  let naiveHi = $derived(ts.map((t) => est * t + Z90 * SIGMA * Math.sqrt(t)));
  let fullLo = $derived(ts.map((t) => est * t - Z90 * SIGMA * Math.sqrt(t + (t * t) / N)));
  let fullHi = $derived(ts.map((t) => est * t + Z90 * SIGMA * Math.sqrt(t + (t * t) / N)));
  let naiveD = $derived(clampedBand(ts, naiveLo, naiveHi, x, y, lo, hi));
  let fullD = $derived(clampedBand(ts, fullLo, fullHi, x, y, lo, hi));
  let pathDs = $derived(paths.map((p) => clippedPath(p.map((v, t) => [t, v]), x, y, lo, hi)).filter((d) => d.length));
  let estD = $derived(clippedPath(ts.map((t) => [t, est * t]), x, y, lo, hi));
  let truthD = $derived(clippedPath(ts.map((t) => [t, GROWTH * t]), x, y, lo, hi));

  const halfNaive = (t) => Z90 * SIGMA * Math.sqrt(t);
  const halfFull = (t, n) => Z90 * SIGMA * Math.sqrt(t + (t * t) / n);
  let outNaive = $derived(paths.filter((p) => Math.abs(p[k] - est * k) > halfNaive(k)).length);
  let outFull = $derived(paths.filter((p) => Math.abs(p[k] - est * k) > halfFull(k, N)).length);

  const yTicks = [0.1, 1, 10, 100, 1000].map(Math.log);
  const fmtY = (v) => { const r = Math.exp(v); return `${r >= 1 ? Math.round(r) : +r.toPrecision(1)}×`; };
  let nLabel = $derived(`${N} years`);
</script>

<div class="controls">
  <Segmented label="Years of data" id="fl-N" bind:value={N}
    options={[50, 100, 206].map((v) => ({ value: v, label: `${v}` }))} />
  <Slider label="Horizon" id="fl-k" min={1} max={HORIZON} step={1} bind:value={k} format={(v) => `${v} ${v === 1 ? "year" : "years"}`} width={220} />
  <div class="btn-wrap">
    <span class="lab">History</span>
    <button type="button" id="fl-new" onclick={() => (seed += 1)}>Draw another</button>
  </div>
</div>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="Forecast bands for stocks against bonds" class="forecast-lab">
  <path class="band-full" d={fullD} fill="var(--c2-soft)" opacity="0.85" />
  <path class="band-naive" d={naiveD} fill="var(--c1-soft)" opacity="0.95" />
  <AxisY scale={y} ticks={yTicks} x0={m.left} x1={width - m.right} format={fmtY} title="stocks ÷ bonds" />
  <AxisX scale={x} ticks={width < 500 ? [0, 10, 20, 30, 40, 50] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]} y={height - m.bottom} title="years ahead" />
  <g class="paths">
    {#each pathDs as d, i (i)}
      <path {d} fill="none" stroke="#8a94a2" stroke-opacity="0.3" stroke-width="0.9" />
    {/each}
  </g>
  <path class="truth-line" d={truthD} fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="6 4" />
  <path class="estimate-line" d={estD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <line class="horizon-marker" x1={x(k)} x2={x(k)} y1={m.top} y2={height - m.bottom} stroke="var(--ink)" stroke-width="1" opacity="0.55" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch grey"></span>futures from the true trend</span>
  <span class="key"><span class="swatch dashed"></span>the true trend</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>our estimate</span>
  <span class="key"><span class="block" style="background:var(--c1-soft)"></span>90% band, estimate taken as true</span>
  <span class="key"><span class="block" style="background:var(--c2-soft)"></span>90% band, allowing for its error</span>
</p>
<div class="readouts">
  <Readout id="fl-r-est" label={`Estimate from ${nLabel}`} value={`${pct(est, 1)} a year`} color="var(--c1)" />
  <Readout id="fl-r-ratio" label="Variance per year, vs a known mean" value={`${fixed(meanOnlyRatio(k, N), 2)}×`} />
  <Readout id="fl-r-out-naive" label="Paths outside the blue band" value={`${outNaive} of ${PATHS}`} />
  <Readout id="fl-r-out-full" label="Paths outside the pink band" value={`${outFull} of ${PATHS}`} color="var(--c2)" />
</div>

<style>
  .btn-wrap { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
  .lab { color: var(--muted); }
  button { font: inherit; font-size: 0.82rem; border: 1px solid var(--ink); background: white; color: var(--ink);
    padding: 4px 12px; border-radius: 999px; cursor: pointer; }
  button:hover { background: var(--panel); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .block { display: inline-block; width: 14px; height: 10px; }
  .swatch.grey { background: #8a94a2; opacity: 0.6; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
</style>
