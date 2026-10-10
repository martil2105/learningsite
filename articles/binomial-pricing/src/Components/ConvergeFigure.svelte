<script>
  /*
    The tree's price against the number of steps, 1 to 100, with Black and
    Scholes's price as a line. Even numbers of steps land below it and odd
    numbers above, and the gap shrinks about in proportion to 1/n.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { crr, blackScholes } from "../binomial.js";
  import { money, fixed } from "../format.js";

  let { width } = $props();
  let n = $state(4);
  const NS = Array.from({ length: 100 }, (_, i) => i + 1);
  const P = NS.map((k) => crr(k));
  const BS = blackScholes();
  const H = 250, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X = $derived(linear(0, 100, m.left, width - m.right));
  const Y = linear(9.4, 12.4, H - m.bottom, m.top);
</script>

<div class="controls">
  <Slider id="cf-n" label="Steps in the tree" min={1} max={100} step={1} bind:value={n} format={(v) => String(v)} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The tree's price against its number of steps" class="converge-panel">
  <AxisY scale={Y} ticks={[9.5, 10, 10.5, 11, 11.5, 12]} x0={m.left} x1={width - m.right} format={(t) => "$" + t.toFixed(1)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 20, 40, 60, 80, 100] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">steps in the tree</text>
  </g>
  <line class="bs" x1={m.left} x2={width - m.right} y1={Y(BS)} y2={Y(BS)} stroke="var(--c2)" stroke-width="1.8" />
  {#each NS as k, i (k)}
    <circle class="pt {k % 2 ? 'odd' : 'even'}" cx={X(k)} cy={Y(P[i])} r={k === n ? 5 : 2.2} fill={k === n ? "var(--ink)" : "var(--c1)"} />
  {/each}
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>the tree's price</span>
  <span><i style="background:var(--c2)"></i>Black and Scholes</span>
</div>

<div class="readouts">
  <Readout id="cf-tree" label="The tree's price" value={money(P[n - 1], 2)} />
  <Readout id="cf-bs" label="Black and Scholes" value={money(BS, 2)} />
  <Readout id="cf-gap" label="The gap" value={(P[n - 1] >= BS ? "+" : "−") + fixed(Math.abs(P[n - 1] - BS), 3)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
