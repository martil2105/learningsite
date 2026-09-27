<script>
  import { log10Scale, linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { drawsFor, expectedCos, yearsToReach } from "../mvo.js";
  import { pct, thousands } from "../format.js";

  // Expected share of the best Sharpe ratio the optimiser gets, with the
  // covariance known, against years of data, for four universe sizes.
  let { width } = $props();
  const SR = 0.5, NS = [2, 10, 25, 50];
  // Four sizes of one family: a single-hue sequential ramp (house-idioms), darker
  // for more assets, rather than four categorical colours.
  const COL = { 2: "#a79eea", 10: "#7366b9", 25: "#45308a", 50: "#311072" };
  let k = $state(0.8);
  const draws = Object.fromEntries(NS.map((N) => [N, drawsFor(N)]));
  const height = 300;
  const m = { top: 16, right: 16, bottom: 46, left: 56 };
  let x = $derived(log10Scale([1, 1000], [m.left, width - m.right]));
  const y = linear([0, 1], [height - m.bottom, m.top]);
  const grid = Array.from({ length: 61 }, (_, i) => Math.pow(1000, i / 60));
  const curves = Object.fromEntries(NS.map((N) => [N, grid.map((T) => [T, expectedCos(SR * Math.sqrt(T), draws[N])])]));
  let needed = $derived(Object.fromEntries(NS.map((N) => [N, yearsToReach(k, SR, draws[N])])));
</script>

<div class="controls">
  <Slider label="Equal weights' share of the best Sharpe" id="yc-k" min={0.5} max={0.95} step={0.05} bind:value={k} format={(v) => pct(v, 0)} width={260} />
</div>
<svg {width} {height} role="img" aria-label="Share of the best Sharpe ratio against years of data" class="years-chart" viewBox="0 0 {width} {height}">
  <AxisY scale={y} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="share of best Sharpe" />
  <AxisX scale={x} ticks={[1, 10, 100, 1000]} y={height - m.bottom} title="years of data (log scale)" />
  <line class="k-line" x1={m.left} x2={width - m.right} y1={y(k)} y2={y(k)} stroke="var(--ink)" stroke-dasharray="5 4" />
  {#each NS as N (N)}
    <path class="yc-line" data-n={N} d={path(curves[N].map(([T, c]) => [x(T), y(Math.max(0, c))]))} fill="none" stroke={COL[N]} stroke-width="2.2" />
    {#if needed[N] <= 1000}<circle class="yc-cross" data-n={N} cx={x(needed[N])} cy={y(k)} r="4.5" fill="white" stroke={COL[N]} stroke-width="2" /><text x={x(needed[N])} y={y(k) + 18} text-anchor="middle" font-size="11" fill={COL[N]}>N = {N}</text>{/if}
  {/each}
</svg>
<div class="readouts">
  {#each NS as N (N)}
    <Readout id={"yc-" + N} label={`${N} assets: years to match equal weights`} value={needed[N] > 1000 ? "over 1,000" : thousands(needed[N])} color={COL[N]} />
  {/each}
</div>
