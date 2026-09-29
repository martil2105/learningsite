<script>
  /*
    The hook. Thirty-nine identical markets run for 130 years: the same true
    growth, the same volatility, independent years. The one that ended richest
    is blue. Below, what each record says about the chance of losing to
    inflation over each horizon: the truth, the luckiest record alone, and all
    39 records pooled.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { pathOf } from "../chart.js";
  import { clippedPath } from "../clip.js";
  import { simulateWorld, lossChance, MARKETS, YEARS, GROWTH, SIGMA, HORIZON } from "../markets.js";
  import { pct } from "../format.js";

  let { width, seed = $bindable(3), T = $bindable(30) } = $props();

  const H1 = 300, H2 = 210;
  const m = { top: 14, right: 16, bottom: 46, left: 62 };
  const lo = Math.log(0.1), hi = Math.log(1e6);
  let world = $derived(simulateWorld(seed));
  let best = $derived(world.markets[world.best]);
  let x = $derived(linear([0, YEARS], [m.left, width - m.right]));
  const y = linear([lo, hi], [H1 - m.bottom, m.top]);
  let others = $derived(world.markets.filter((_, i) => i !== world.best).map((k) => clippedPath(k.wealth.map((v, t) => [t, v]), x, y, lo, hi)));
  let bestD = $derived(clippedPath(best.wealth.map((v, t) => [t, v]), x, y, lo, hi));
  let truthD = $derived(clippedPath([[0, 0], [YEARS, GROWTH * YEARS]], x, y, lo, hi));
  const yTicks = [0.1, 1, 10, 100, 1e3, 1e4, 1e5, 1e6].map(Math.log);
  const fmtW = (v) => { const r = Math.round(Math.exp(v) * 10) / 10; return r >= 1e6 ? "1M×" : r >= 1000 ? `${r / 1000}k×` : `${r}×`; };

  // the second panel: loss chance by horizon
  let x2 = $derived(linear([0, HORIZON], [m.left, width - m.right]));
  const y2 = linear([0, 0.5], [H2 - m.bottom, m.top]);
  const ts = Array.from({ length: HORIZON }, (_, i) => i + 1);
  const truthP = (t) => lossChance(GROWTH, SIGMA, t);
  let bestP = $derived((t) => lossChance(best.avg, best.vol, t));
  let poolP = $derived((t) => lossChance(world.pooled.avg, world.pooled.vol, t));
  let truthCurve = $derived(pathOf(ts.map((t) => [x2(t), y2(truthP(t))])));
  let bestCurve = $derived(pathOf(ts.map((t) => [x2(t), y2(bestP(t))])));
  let poolCurve = $derived(pathOf(ts.map((t) => [x2(t), y2(poolP(t))])));
</script>

<div class="controls">
  <Slider label="Horizon" id="ml-T" min={1} max={HORIZON} step={1} bind:value={T} format={(v) => `${v} ${v === 1 ? "year" : "years"}`} width={220} />
  <div class="btn-wrap">
    <span class="lab">World</span>
    <button type="button" id="ml-new" onclick={() => (seed += 1)}>Draw a new world</button>
  </div>
</div>

<p class="panel-title">Real wealth in {MARKETS} identical markets</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Real wealth paths of 39 markets" class="markets">
  <AxisY scale={y} ticks={yTicks} x0={m.left} x1={width - m.right} format={fmtW} title="real wealth" />
  <AxisX scale={x} ticks={width < 500 ? [0, 25, 50, 75, 100, 125] : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130]} y={H1 - m.bottom} title="years" />
  <g class="others">
    {#each others as d, i (i)}
      <path {d} fill="none" stroke="#8a94a2" stroke-opacity="0.45" stroke-width="1" />
    {/each}
  </g>
  <path class="truth-line" d={truthD} fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="6 4" />
  <path class="best-line" d={bestD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
</svg>

<p class="panel-title">Chance of losing to inflation over each horizon</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Loss chance by horizon from each record" class="loss-panel">
  <AxisY scale={y2} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <AxisX scale={x2} ticks={[0, 10, 20, 30, 40, 50]} y={H2 - m.bottom} title="horizon, years" />
  <path class="truth-curve" d={truthCurve} fill="none" stroke="var(--ink)" stroke-width="2" />
  <path class="pool-curve" d={poolCurve} fill="none" stroke="var(--c2)" stroke-width="2" stroke-dasharray="5 4" />
  <path class="best-curve" d={bestCurve} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <line class="t-marker" x1={x2(T)} x2={x2(T)} y1={m.top} y2={H2 - m.bottom} stroke="var(--ink)" opacity="0.5" />
  <circle class="best-dot" cx={x2(T)} cy={y2(bestP(T))} r="4.5" fill="var(--c1)" />
  <circle class="truth-dot" cx={x2(T)} cy={y2(truthP(T))} r="4.5" fill="var(--ink)" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--ink)"></span>the truth, for every market</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>the luckiest market's record</span>
  <span class="key"><span class="swatch dashed2"></span>all {MARKETS} records pooled</span>
</p>
<div class="readouts">
  <Readout id="ml-r-best" label="Luckiest market's growth" value={`${pct(best.avg, 1)} a year`} color="var(--c1)" />
  <Readout id="ml-r-truth" label={`True loss chance, ${T} years`} value={pct(truthP(T), 1)} />
  <Readout id="ml-r-bestp" label="From the luckiest record" value={pct(bestP(T), 1)} color="var(--c1)" />
  <Readout id="ml-r-pool" label="From all records pooled" value={pct(poolP(T), 1)} color="var(--c2)" />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
  .btn-wrap { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
  .lab { color: var(--muted); }
  button { font: inherit; font-size: 0.82rem; border: 1px solid var(--ink); background: white; color: var(--ink);
    padding: 4px 12px; border-radius: 999px; cursor: pointer; }
  button:hover { background: var(--panel); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed2 { background: repeating-linear-gradient(90deg, var(--c2) 0 5px, transparent 5px 8px); }
</style>
