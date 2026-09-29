<script>
  /*
    The knife-edge. The share the rule asks of a 25-year-old against the
    half-life of the gap, one line for each risk aversion. Each line crosses
    zero at its own half-life, marked with a ring.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath } from "../clip.js";
  import { phiOf, share, breakEven } from "../coint.js";
  import { fixed, bigPct } from "../format.js";

  let { width, h = $bindable(5), g = $bindable(2) } = $props();

  const GS = [2, 3, 4];
  const COLOR = { 2: "var(--c1)", 3: "var(--c2)", 4: "var(--c3)" };
  const H1 = 270;
  const m = { top: 14, right: 16, bottom: 46, left: 62 };
  const HMAX = 25, lo = -30, hi = 25;
  let x = $derived(linear([0, HMAX], [m.left, width - m.right]));
  const yS = linear([lo, hi], [H1 - m.bottom, m.top]);
  const grid = Array.from({ length: (HMAX - 1) * 4 + 1 }, (_, i) => 1 + i / 4);
  const BE = Object.fromEntries(GS.map((gg) => [gg, breakEven(gg)]));
  let lines = $derived(GS.map((gg) => ({ g: gg, d: clippedPath(grid.map((hh) => [hh, share(25, phiOf(hh), gg)]), x, yS, lo, hi), be: BE[gg] })));
  const yt = [-30, -20, -10, 0, 10, 20];
  const bigTick = (v) => bigPct(v);
</script>

<div class="controls">
  <Slider label="Half-life of the gap (years)" id="ed-h" min={2} max={20} step={0.5} bind:value={h} format={(v) => fixed(v, 1)} width={220} />
  <Segmented label="Risk aversion" id="ed-g" bind:value={g} options={[{ value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }]} />
</div>

<p class="panel-title">Share of savings asked of a 25-year-old</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="The share of savings asked of a 25-year-old against the half-life of the gap, for three risk aversions" class="edge-panel">
  <AxisY scale={yS} ticks={yt} x0={m.left} x1={width - m.right} format={bigTick} />
  <AxisX scale={x} ticks={[0, 5, 10, 15, 20, 25]} y={H1 - m.bottom} title="half-life of the gap, in years" />
  <line class="zero-line" x1={m.left} x2={width - m.right} y1={yS(0)} y2={yS(0)} stroke="var(--ink)" stroke-width="1" opacity="0.6" />
  <line class="h-marker" x1={x(h)} x2={x(h)} y1={m.top} y2={H1 - m.bottom} stroke="var(--ink)" opacity="0.5" />
  {#each lines as l (l.g)}
    <path class="edge-line" data-g={l.g} d={l.d} fill="none" stroke={COLOR[l.g]} stroke-width={l.g === g ? 3 : 1.8} opacity={l.g === g ? 1 : 0.6} />
    <circle class="edge-ring" data-g={l.g} cx={x(l.be)} cy={yS(0)} r="5" fill="white" stroke={COLOR[l.g]} stroke-width="2" />
  {/each}
</svg>
<p class="legend">
  {#each GS as gg (gg)}
    <span class="key"><span class="swatch" style="background:{COLOR[gg]}"></span>risk aversion {gg}</span>
  {/each}
</p>

<div class="readouts">
  {#each GS as gg (gg)}
    <Readout id="ed-r-{gg}" label="Share at 25, risk aversion {gg}" value={bigPct(share(25, phiOf(h), gg))} color={COLOR[gg]} />
  {/each}
  <Readout id="ed-r-be" label="Half-life at which the share at 25 is zero" value={fixed(lines.find((l) => l.g === g).be, 1)} />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
