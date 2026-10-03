<script>
  /*
    Each US decile's alpha against the CAPM, a year, with a whisker of two
    standard errors either side. Above zero: more return than its beta earns.
  */
  import { linear } from "../scale.js";
  import AxisY from "./AxisY.svelte";
  import Readout from "./Readout.svelte";
  import { usDeciles, lowMinusHigh } from "../capm.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  const D = usDeciles();
  const L = lowMinusHigh();
  const H = 260, YL = -8, YH = 6;
  const m = { top: 16, right: 12, bottom: 40, left: 44 };
  let slot = $derived((width - m.left - m.right) / 10);
  let bw = $derived(Math.min(30, slot * 0.6));
  const Y = linear([YL, YH], [H - m.bottom, m.top]);
  const cx = (i) => m.left + slot * (i + 0.5);
  const signed = (v) => (v > 0.005 ? "+" : v < -0.005 ? "−" : "") + fixed(Math.abs(v), 1) + "%";
</script>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Alpha against the CAPM for each beta decile" class="alpha-panel">
  <AxisY scale={Y} ticks={[-8, -6, -4, -2, 0, 2, 4, 6]} x0={m.left} x1={width - m.right} format={(t) => t + "%"} />
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.6" />
  {#each D as d, i (i)}
    <rect class="bar b{i}" x={cx(i) - bw / 2} y={Y(Math.max(0, d.alpha))} width={bw} height={Math.abs(Y(d.alpha) - Y(0))} fill={d.alpha >= 0 ? "var(--c3)" : "var(--c2)"} />
    <line class="whisker w{i}" x1={cx(i)} x2={cx(i)} y1={Y(d.alpha + 2 * d.alphaSE)} y2={Y(d.alpha - 2 * d.alphaSE)} stroke="var(--ink)" stroke-width="1.2" />
    <text class="bar-label" x={cx(i)} y={H - m.bottom + 16} text-anchor="middle">{i + 1}</text>
  {/each}
  <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">Beta decile, lowest to highest</text>
</svg>

<div class="readouts">
  <Readout id="ab-r-lo" label="Lowest decile's alpha" value={signed(D[0].alpha)} color="var(--c3)" />
  <Readout id="ab-r-hi" label="Highest decile's alpha" value={signed(D[9].alpha)} color="var(--c2)" />
  <Readout id="ab-r-lmh" label="Lowest minus highest" value={signed(L.alpha)} />
  <Readout id="ab-r-t" label="Its t-statistic" value={fixed(L.t, 1)} />
</div>

<style>
  .bar-label { font-size: 11px; fill: var(--ink-soft); }
</style>
