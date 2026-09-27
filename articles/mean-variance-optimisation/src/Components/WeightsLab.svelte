<script>
  import { linear } from "../scale.js";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { universeSpec, estimate, optimal, scaleToVol, sharpe } from "../mvo.js";
  import { pct } from "../format.js";

  // Ten assets. The optimiser sees a history of monthly returns, estimates
  // the inputs, and picks weights; we score them with the true inputs.
  let { width } = $props();
  const spec = universeSpec();
  const best = scaleToVol(optimal(spec.mu, spec.S), spec.S);
  let years = $state(30);
  let seed = $state(19);
  let mode = $state("both");
  let est = $derived(estimate(seed, years, spec));
  let raw = $derived(optimal(est.muHat, mode === "both" ? est.Shat : spec.S));
  let w = $derived(scaleToVol(raw, mode === "both" ? est.Shat : spec.S));
  let sr = $derived(sharpe(raw, spec.mu, spec.S));
  const height = 260;
  const m = { top: 14, right: 12, bottom: 50, left: 48 };
  let lim = $derived(Math.max(0.3, ...w.map(Math.abs), ...best.map(Math.abs)) * 1.1);
  let y = $derived(linear([-lim, lim], [height - m.bottom, m.top]));
  let x = $derived(linear([0, spec.N], [m.left, width - m.right]));
  let bw = $derived((x(1) - x(0)) * 0.34);
</script>

<div class="controls">
  <Slider label="Years of monthly data" id="wl-years" min={5} max={100} step={5} bind:value={years} width={220} />
  <Segmented label="What the optimiser estimates" id="wl-mode" bind:value={mode} options={[{ value: "both", label: "Means and covariances" }, { value: "means", label: "Means only" }]} />
  <div class="seed">
    <span class="lab">History</span>
    <button type="button" id="wl-seed" onclick={() => (seed = (seed % 997) + 1)}>Draw another</button>
  </div>
</div>
<svg {width} {height} role="img" aria-label="Optimal and estimated weights" class="weights-chart" viewBox="0 0 {width} {height}">
  {#each [-0.2, -0.1, 0, 0.1, 0.2, 0.3].filter((t) => Math.abs(t) <= lim) as t (t)}
    <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#9aa0ab" : "#e7e9ee"} />
    <text class="tick-label" x={m.left - 6} y={y(t) + 4} text-anchor="end">{t > 0 ? "+" : t < 0 ? "−" : ""}{Math.abs(t * 100).toFixed(0)}%</text>
  {/each}
  {#each spec.mu as mu, i (i)}
    <rect class="best-bar" x={x(i + 0.5) - bw - 1} y={Math.min(y(0), y(best[i]))} width={bw} height={Math.abs(y(best[i]) - y(0))} fill="var(--c3)" opacity="0.8" />
    <rect class="est-bar" x={x(i + 0.5) + 1} y={Math.min(y(0), y(w[i]))} width={bw} height={Math.abs(y(w[i]) - y(0))} fill="var(--c2)" />
    <text class="tick-label" x={x(i + 0.5)} y={height - m.bottom + 16} text-anchor="middle">{(mu * 100).toFixed(1)}</text>
  {/each}
  <text class="axis-title" x={(m.left + width - m.right) / 2} y={height - m.bottom + 36} text-anchor="middle">asset, labelled by its true expected excess return (%)</text>
  <text class="axis-title" transform="translate(12,{(m.top + height - m.bottom) / 2}) rotate(-90)" text-anchor="middle">weight</text>
</svg>
<div class="legend"><span class="sw" style="background:var(--c3)"></span>best weights <span class="sw" style="background:var(--c2)"></span>optimiser's weights</div>
<div class="readouts">
  <Readout id="wl-sr" label="Optimiser's Sharpe ratio, true inputs" value={sr.toFixed(2)} color="var(--c2)" />
  <Readout id="wl-1n" label="Equal weights" value="0.40" />
  <Readout id="wl-best" label="Best possible" value="0.50" color="var(--c3)" />
  <Readout id="wl-gross" label="Gross exposure at 10% volatility" value={pct(w.reduce((a, b) => a + Math.abs(b), 0), 0)} />
</div>

<style>
  .seed { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
  .lab { color: var(--muted); }
  button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; padding: 4px 12px; border-radius: 999px; cursor: pointer; }
  .legend { font-size: 0.8rem; color: var(--muted); display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .sw { width: 10px; height: 10px; display: inline-block; border-radius: 2px; margin-left: 6px; }
</style>
