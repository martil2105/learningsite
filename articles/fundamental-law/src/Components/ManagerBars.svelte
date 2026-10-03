<script>
  /*
    The two managers from the guess card, side by side. Each bar is her
    annual information ratio with the swing on the slider; the dashed tick is
    the same ratio in Grinold's world, with no swing.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { irAnnual, MANAGERS } from "../law.js";
  import { fixed, thousands } from "../format.js";

  let { width } = $props();
  let swing = $state(0);
  const L = [MANAGERS.A, MANAGERS.B];
  let v = $derived(L.map((g) => irAnnual(g.ic, g.n, swing)));
  const g0 = L.map((g) => irAnnual(g.ic, g.n));

  const H = 240, m = { top: 14, right: 14, bottom: 52, left: 44 };
  const Y = linear(0, 2.5, H - m.bottom, m.top);
  let inner = $derived(width - m.left - m.right);
  let bw = $derived(Math.min(110, inner * 0.28));
  let cx = $derived([m.left + inner * 0.3, m.left + inner * 0.72]);
  const colors = ["var(--c3)", "var(--c1)"];
</script>

<div class="controls">
  <Slider id="mb-swing" label="Month-to-month swing in the IC" min={0} max={0.1} step={0.01} bind:value={swing} format={(x) => fixed(x, 2)} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The two managers' information ratios" class="mgr-panel">
  <AxisY scale={Y} ticks={[0, 0.5, 1, 1.5, 2, 2.5]} x0={m.left} x1={width - m.right} format={(t) => fixed(t, 1)} />
  {#each L as g, i (g.id)}
    <rect class="bar bar-{g.id}" x={cx[i] - bw / 2} width={bw} y={Y(v[i])} height={Y(0) - Y(v[i])} fill={colors[i]} fill-opacity="0.8" />
    <line class="grinold g-{g.id}" x1={cx[i] - bw / 2 - 6} x2={cx[i] + bw / 2 + 6} y1={Y(g0[i])} y2={Y(g0[i])} stroke="var(--ink)" stroke-width="2" stroke-dasharray="5 3" />
    <text class="bar-label" x={cx[i]} y={H - m.bottom + 18} text-anchor="middle">Manager {g.id}</text>
    <text class="bar-sub" x={cx[i]} y={H - m.bottom + 34} text-anchor="middle">IC {fixed(g.ic, 2)} on {thousands(g.n)}</text>
  {/each}
  <line x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.6" />
</svg>

<div class="readouts">
  <Readout id="mb-r-a" label="Manager A's ratio" value={fixed(v[0], 2)} color="var(--c3)" />
  <Readout id="mb-r-b" label="Manager B's ratio" value={fixed(v[1], 2)} color="var(--c1)" />
  <Readout id="mb-r-lead" label="Ahead" value={v[0] > v[1] ? "A" : "B"} />
</div>

<style>
  .bar-label { font-size: 12px; font-weight: 700; fill: var(--ink-soft); }
  .bar-sub { font-size: 11px; fill: var(--muted); }
  svg { display: block; }
</style>
