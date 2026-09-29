<script>
  /*
    The hook. What a constant share in stocks is worth to us, as a safe return
    over the safe rate: pi (mu - r) - gamma pi^2 sigma^2 / 2. The dashed line
    is the premium alone and the gap under it is the cost of risk. The peak is
    the Merton share; past 100% the stocks are bought with borrowed money.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath } from "../clip.js";
  import { mertonShare, gain, bestGain } from "../merton.js";
  import { pct, fixed } from "../format.js";
  import { ticks } from "../chart.js";

  let { width, gamma = $bindable(2), premium = $bindable(0.05), sigma = $bindable(0.18) } = $props();

  const H = 300, P1 = 3;
  const m = { top: 14, right: 16, bottom: 46, left: 62 };
  let star = $derived(mertonShare(premium, sigma, gamma));
  let best = $derived(bestGain(premium, sigma, gamma));
  let top = $derived(Math.max(0.02, Math.ceil((best * 1.3) / 0.01) * 0.01));
  let lo = $derived(-top * 0.8);
  let x = $derived(linear([0, P1], [m.left, width - m.right]));
  let y = $derived(linear([lo, top], [H - m.bottom, m.top]));
  const ps = Array.from({ length: 301 }, (_, i) => (i * P1) / 300);
  let curveD = $derived(clippedPath(ps.map((p) => [p, gain(p, premium, sigma, gamma)]), x, y, lo, top));
  let premD = $derived(clippedPath(ps.map((p) => [p, p * premium]), x, y, lo, top));
  let yTicks = $derived(ticks(lo, top, 6));
  const inView = (v) => v >= lo && v <= top;
  let starIn = $derived(star <= P1);
  let at100 = $derived(gain(1, premium, sigma, gamma));
</script>

<div class="controls">
  <Segmented label="Risk aversion, γ" id="sl-gamma" bind:value={gamma} options={[1, 2, 4, 8].map((v) => ({ value: v, label: `${v}` }))} />
  <Slider label="Premium over the safe rate" id="sl-premium" min={0.01} max={0.08} step={0.001} bind:value={premium} format={(v) => pct(v, 1)} width={220} />
  <Segmented label="Volatility" id="sl-sigma" bind:value={sigma} options={[0.15, 0.18, 0.25].map((v) => ({ value: v, label: pct(v, 0) }))} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="What each share in stocks is worth" class="share-lab">
  <rect class="borrow-zone" x={x(1)} y={m.top} width={x(P1) - x(1)} height={H - m.bottom - m.top} fill="var(--panel)" />
  <AxisY scale={y} ticks={yTicks} x0={m.left} x1={width - m.right} format={(v) => pct(v, top <= 0.03 ? 1 : 0)} title="safe-equivalent gain" />
  <AxisX scale={x} ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3]} y={H - m.bottom} format={(v) => pct(v, 0)} title="share of savings in stocks" />
  <line class="zero-line" x1={m.left} x2={width - m.right} y1={y(0)} y2={y(0)} stroke="var(--ink)" stroke-width="1" opacity="0.6" />
  <path class="premium-line" d={premD} fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.8" />
  <path class="gain-curve" d={curveD} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  {#if starIn}
    <line class="star-line" x1={x(star)} x2={x(star)} y1={y(best)} y2={H - m.bottom} stroke="var(--c1)" stroke-width="1.2" stroke-dasharray="3 3" />
    <circle class="star-dot" cx={x(star)} cy={y(best)} r="5.5" fill="var(--c1)" stroke="white" stroke-width="1.5" />
  {/if}
  {#if inView(at100)}
    <circle class="full-dot" cx={x(1)} cy={y(at100)} r="4.5" fill="white" stroke="var(--c1)" stroke-width="2" />
  {/if}
  <text class="zone-label" x={x(1) + 6} y={m.top + 14}>borrowing</text>
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>what the share is worth to us</span>
  <span class="key"><span class="swatch dashed"></span>the premium alone</span>
  <span class="key"><span class="block"></span>more than 100%: borrowed money</span>
</p>
<div class="readouts">
  <Readout id="sl-r-share" label="The Merton share" value={pct(star, 0)} color="var(--c1)" />
  <Readout id="sl-r-best" label="Worth, at that share" value={`+${pct(best, 2)} a year`} color="var(--c1)" />
  <Readout id="sl-r-full" label="Worth, all in stocks" value={`${at100 < 0 ? "" : "+"}${pct(at100, 2)} a year`} />
  <Readout id="sl-r-kept" label="All in stocks keeps" value={`${fixed((100 * at100) / best, 0)}% of the best`} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
  .block { display: inline-block; width: 14px; height: 10px; background: var(--panel); border: 1px solid var(--rule); }
  :global(.share-lab .zone-label) { font-size: 11px; fill: var(--muted); }
</style>
