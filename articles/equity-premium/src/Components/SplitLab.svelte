<script>
  /*
    Shiller's S&P composite after inflation. The left bar is the average real
    return, split into the dividend yield and the growth in prices; the right
    bar keeps the dividend yield and swaps price growth for dividend growth,
    which is Fama and French's estimate. Whiskers are 95% bands.
  */
  import { linear } from "../scale.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { split, PERIODS, Z95 } from "../premium.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let period = $state("early");
  let p = $derived(PERIODS.find((q) => q.id === period));
  let s = $derived(split(p.from, p.to));

  const H = 270, m = { top: 14, right: 14, bottom: 46, left: 44 };
  const Y = linear([0, 16], [H - m.bottom, m.top]);
  let inner = $derived(width - m.left - m.right);
  let bw = $derived(Math.min(90, inner * 0.26));
  let cx = $derived([m.left + inner * 0.3, m.left + inner * 0.72]);
  let bars = $derived([
    { id: "real", label: "Realised", top: s.gP, topColor: "var(--c2)", mean: s.realised, se: s.realisedSE },
    { id: "div", label: "From dividends", top: s.gD, topColor: "var(--c3)", mean: s.dividends, se: s.dividendsSE },
  ]);
  const pctStr = (v) => fixed(v, 1) + "%";
</script>

<div class="controls">
  <Segmented id="sl-period" label="Period" options={PERIODS.map((q) => ({ value: q.id, label: q.label }))} bind:value={period} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Average real return against the dividend-based estimate" class="split-panel">
  <AxisY scale={Y} ticks={[0, 4, 8, 12, 16]} x0={m.left} x1={width - m.right} format={(t) => t + "%"} />
  {#each bars as b, i (b.id)}
    <g class="bar-{b.id}">
      <rect class="dp" x={cx[i] - bw / 2} width={bw} y={Y(s.dp)} height={Y(0) - Y(s.dp)} fill="var(--c4-soft)" stroke="var(--ink)" stroke-opacity="0.25" />
      <rect class="growth" x={cx[i] - bw / 2} width={bw} y={Y(s.dp + b.top)} height={Y(s.dp) - Y(s.dp + b.top)} fill={b.topColor} fill-opacity="0.75" />
      <line class="whisker" x1={cx[i]} x2={cx[i]} y1={Y(Math.min(16, b.mean + Z95 * b.se))} y2={Y(Math.max(0, b.mean - Z95 * b.se))} stroke="var(--ink)" stroke-width="1.5" />
      <line x1={cx[i] - 7} x2={cx[i] + 7} y1={Y(Math.min(16, b.mean + Z95 * b.se))} y2={Y(Math.min(16, b.mean + Z95 * b.se))} stroke="var(--ink)" stroke-width="1.5" />
      <line x1={cx[i] - 7} x2={cx[i] + 7} y1={Y(Math.max(0, b.mean - Z95 * b.se))} y2={Y(Math.max(0, b.mean - Z95 * b.se))} stroke="var(--ink)" stroke-width="1.5" />
      <text class="bar-label" x={cx[i]} y={H - m.bottom + 18} text-anchor="middle">{b.label}</text>
    </g>
  {/each}
  <line x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.6" />
</svg>

<div class="legend">
  <span><i style="background:var(--c4-soft);border:1px solid #b9bec7"></i>Dividend yield</span>
  <span><i style="background:var(--c2);opacity:0.75"></i>Price growth</span>
  <span><i style="background:var(--c3);opacity:0.75"></i>Dividend growth</span>
</div>

<div class="readouts">
  <Readout id="sl-r-real" label="Realised return" value={pctStr(s.realised) + " ± " + fixed(Z95 * s.realisedSE, 1)} color="var(--c2)" />
  <Readout id="sl-r-div" label="From dividends" value={pctStr(s.dividends) + " ± " + fixed(Z95 * s.dividendsSE, 1)} color="var(--c3)" />
  <Readout id="sl-r-dp" label="Dividend yield" value={pctStr(s.dp)} />
  <Readout id="sl-r-pd" label="Price per $1 of dividends" value={fixed(s.pdStart, 0) + " → " + fixed(s.pdEnd, 0)} />
</div>

<style>
  .bar-label { font-size: 12px; font-weight: 600; fill: var(--ink-soft); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 12px; height: 12px; margin-right: 6px; vertical-align: -1px; }
  svg { display: block; }
</style>
