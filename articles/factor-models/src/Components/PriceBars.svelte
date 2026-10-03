<script>
  /*
    Each factor's own alpha against the CAPM, a year: the price a loading on
    that factor is charged when the factor joins a model.
  */
  import { linear } from "../scale.js";
  import AxisY from "./AxisY.svelte";
  import { FACTORS, NAMES, SHORT, ownCapmAlpha, fit } from "../factors.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  const P = FACTORS.map((f) => ({ f, a: ownCapmAlpha(f), se: fit(f, []).se }));
  const H = 230, YL = -2, YH = 12;
  const m = { top: 22, right: 12, bottom: 40, left: 44 };
  let slot = $derived((width - m.left - m.right) / P.length);
  let bw = $derived(Math.min(46, slot * 0.55));
  const Y = linear([YL, YH], [H - m.bottom, m.top]);
  const cx = (i) => m.left + slot * (i + 0.5);
</script>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Each factor's own alpha against the CAPM" class="price-panel">
  <AxisY scale={Y} ticks={[-2, 0, 2, 4, 6, 8, 10, 12]} x0={m.left} x1={width - m.right} format={(t) => t + "%"} />
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.6" />
  {#each P as p, i (p.f)}
    <rect class="bar k-{p.f}" x={cx(i) - bw / 2} y={Y(Math.max(0, p.a))} width={bw} height={Math.abs(Y(p.a) - Y(0))} fill="var(--c1)" />
    <line class="whisker" x1={cx(i)} x2={cx(i)} y1={Y(p.a + 2 * p.se)} y2={Y(p.a - 2 * p.se)} stroke="var(--ink)" stroke-width="1.2" />
    <text class="val" x={cx(i)} y={Y(p.a + 2 * p.se) - 5} text-anchor="middle">{fixed(p.a, 1)}%</text>
    <text class="bar-label" x={cx(i)} y={H - m.bottom + 16} text-anchor="middle">{width < 520 ? SHORT[p.f] : NAMES[p.f]}</text>
  {/each}
</svg>

<style>
  .bar-label { font-size: 11px; fill: var(--ink-soft); }
  .val { font-size: 11px; fill: var(--ink); }
</style>
