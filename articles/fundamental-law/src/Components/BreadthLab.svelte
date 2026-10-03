<script>
  /*
    The hook. The annual information ratio against the number of stocks, on a
    log axis: Grinold's curve (dashed), which rises with the square root of N
    for ever, and the curve when the IC swings from month to month (solid),
    which flattens towards the ceiling IC / swing. The dots mark the chosen N.
  */
  import { linear, log, logTicks, shortN } from "../chart.js";
  import { clipTop } from "../clip.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { irAnnual, ceiling, bets, betsCap } from "../law.js";
  import { fixed, thousands } from "../format.js";

  let { width } = $props();
  const NS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  let ic = $state(0.02);
  let swing = $state(0.05);
  let k = $state(5);
  let N = $derived(NS[k]);

  const H = 290, m = { top: 14, right: 16, bottom: 44, left: 44 }, YMAX = 4;
  let X = $derived(log(10, 10000, m.left, width - m.right));
  const Y = linear(0, YMAX, H - m.bottom, m.top);
  const grid = Array.from({ length: 121 }, (_, i) => Math.pow(10, 1 + (3 * i) / 120));
  const pathOf = (pts) => pts.map(([x, y], i) => (i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2)).join("");
  let gPath = $derived(pathOf(clipTop(grid.map((n) => [n, irAnnual(ic, n)]), YMAX).map(([n, v]) => [X(n), Y(v)])));
  let sPath = $derived(pathOf(clipTop(grid.map((n) => [n, irAnnual(ic, n, swing)]), YMAX).map(([n, v]) => [X(n), Y(v)])));
  let cap = $derived(ceiling(ic, swing));
  let g = $derived(irAnnual(ic, N)), s = $derived(irAnnual(ic, N, swing));
  const xt = logTicks(10, 10000, true);
</script>

<div class="controls">
  <Slider id="bl-ic" label="Information coefficient" min={0.01} max={0.1} step={0.01} bind:value={ic} format={(v) => fixed(v, 2)} width={200} />
  <Slider id="bl-swing" label="Month-to-month swing in the IC" min={0} max={0.1} step={0.01} bind:value={swing} format={(v) => fixed(v, 2)} width={200} />
  <Slider id="bl-n" label="Stocks" min={0} max={NS.length - 1} step={1} bind:value={k} format={(v) => thousands(NS[v])} width={200} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Information ratio against the number of stocks" class="breadth-panel">
  <AxisY scale={Y} ticks={[0, 1, 2, 3, 4]} x0={m.left} x1={width - m.right} />
  {#if Number.isFinite(cap) && cap <= YMAX}
    <line class="cap" x1={m.left} x2={width - m.right} y1={Y(cap)} y2={Y(cap)} stroke="var(--c3)" stroke-dasharray="2 4" stroke-width="2" />
    <text class="cap-label" x={width - m.right} y={Y(cap) - 6} text-anchor="end">ceiling</text>
  {/if}
  <path class="grinold" d={gPath} fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 4" />
  <path class="swing" d={sPath} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  {#if g <= YMAX}<circle class="gdot" cx={X(N)} cy={Y(g)} r="5" fill="white" stroke="var(--ink)" stroke-width="2" />{/if}
  <circle class="sdot" cx={X(N)} cy={Y(Math.min(YMAX, s))} r="5.5" fill="var(--c1)" />
  <g class="axis axis-x">
    <line x1={X.range[0]} x2={X.range[1]} y1={H - m.bottom} y2={H - m.bottom} />
    {#each xt as t (t)}
      {#if width >= 560 || [10, 100, 1000, 10000].includes(t)}
        <g transform="translate({X(t)},{H - m.bottom})">
          <line y2="5" />
          <text class="tick-label" y="18" text-anchor="middle">{shortN(t)}</text>
        </g>
      {:else}
        <line class="minor" x1={X(t)} x2={X(t)} y1={H - m.bottom} y2={H - m.bottom + 4} />
      {/if}
    {/each}
    <text class="axis-title" x={(X.range[0] + X.range[1]) / 2} y={H - 8} text-anchor="middle">Stocks forecast each month (log scale)</text>
  </g>
</svg>

<div class="legend">
  <span><i class="dash"></i>Grinold's law</span>
  <span><i style="background:var(--c1)"></i>With the swing</span>
</div>

<div class="readouts">
  <Readout id="bl-r-g" label="Grinold's ratio" value={fixed(g, 2)} />
  <Readout id="bl-r-s" label="With the swing" value={fixed(s, 2)} color="var(--c1)" />
  <Readout id="bl-r-bets" label="Independent bets a month" value={thousands(bets(ic, N, swing))} />
  <Readout id="bl-r-cap" label="Ceiling" value={Number.isFinite(cap) ? fixed(cap, 2) + " (" + thousands(betsCap(ic, swing)) + " bets)" : "none"} color="var(--c3)" />
</div>

<style>
  .cap-label { font-size: 11px; fill: var(--c3); font-weight: 600; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 6px, transparent 6px 10px); }
  svg { display: block; }
</style>
