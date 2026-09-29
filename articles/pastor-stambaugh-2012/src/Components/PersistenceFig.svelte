<script>
  /*
    Why doubt about persistence matters. The curve is the investor's per-year
    variance at 30 years if she knew the persistence exactly, for every value
    from 0.5 to almost 1. The shaded band is the range she thinks it could be
    in, and the flat line is the curve's average over that band, which is what
    her doubt makes her variance. The curve bends up sharply near 1, so the
    average sits above the curve's value at the middle of the band.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { pathOf } from "../chart.js";
  import { investorPieces, doubtedPieces, perYear, REVERSION, DOUBT, BETA } from "../longrun.js";
  import { fixed } from "../format.js";

  let { width, reversion = $bindable("moderate"), doubt = $bindable("unsure"), K = 30 } = $props();

  const height = 280;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  const B0 = 0.5, B1 = 1;
  const bs = Array.from({ length: 250 }, (_, i) => B0 + ((B1 - B0) * (i + 0.5)) / 250);
  let rho = $derived(REVERSION[reversion]);
  let curve = $derived(bs.map((b) => perYear(investorPieces(K, b, rho).total, K)));
  let band = $derived(DOUBT[doubt]);
  let avg = $derived(perYear(doubtedPieces(K, band, rho).total, K));
  let atMid = $derived(perYear(investorPieces(K, BETA, rho).total, K));
  let yMax = $derived(Math.max(1.4, Math.ceil(Math.max(...curve) * 5) / 5));
  let x = $derived(linear([B0, B1], [m.left, width - m.right]));
  let y = $derived(linear([0, yMax], [height - m.bottom, m.top]));
  let curveD = $derived(pathOf(bs.map((b, i) => [x(b), y(curve[i])])));
  let yTicks = $derived(Array.from({ length: Math.round(yMax / 0.2) + 1 }, (_, i) => +(i * 0.2).toFixed(1)));
</script>

<div class="controls">
  <Segmented label="Mean reversion" id="pf-rev" bind:value={reversion}
    options={[{ value: "strong", label: "Strong" }, { value: "moderate", label: "Moderate" }, { value: "weak", label: "Weak" }]} />
  <Segmented label="Persistence of expected returns" id="pf-doubt" bind:value={doubt}
    options={[{ value: "known", label: "Known: 0.83" }, { value: "fair", label: "0.75 to 0.91" }, { value: "unsure", label: "0.66 to 1" }]} />
</div>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="Thirty-year variance per year against persistence" class="persistence">
  {#if band[1] > band[0]}
    <rect class="doubt-band" x={x(band[0])} y={m.top} width={x(band[1]) - x(band[0])} height={height - m.bottom - m.top} fill="var(--c2-soft)" opacity="0.6" />
  {/if}
  <AxisY scale={y} ticks={yTicks} x0={m.left} x1={width - m.right} format={(v) => fixed(v, 1)} title="variance per year" />
  <AxisX scale={x} ticks={[0.5, 0.6, 0.7, 0.8, 0.9, 1]} y={height - m.bottom} format={(v) => fixed(v, 1)} title="persistence of expected returns" />
  <line class="one-line" x1={m.left} x2={width - m.right} y1={y(1)} y2={y(1)} stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.7" />
  <path class="curve" d={curveD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  {#if band[1] > band[0]}
    <line class="avg-line" x1={x(band[0])} x2={x(band[1])} y1={y(avg)} y2={y(avg)} stroke="var(--c2)" stroke-width="2.6" />
  {/if}
  <circle class="mid-dot" cx={x(BETA)} cy={y(atMid)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.5" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>if we knew the persistence</span>
  <span class="key"><span class="block" style="background:var(--c2-soft)"></span>where we think it lies</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>the average over that range</span>
</p>
<div class="readouts">
  <Readout id="pf-r-mid" label="Known to be 0.83" value={fixed(atMid, 2)} color="var(--c1)" />
  <Readout id="pf-r-avg" label="Averaged over our doubt" value={fixed(avg, 2)} color="var(--c2)" />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .block { display: inline-block; width: 14px; height: 10px; }
</style>
