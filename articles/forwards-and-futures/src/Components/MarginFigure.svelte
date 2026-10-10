<script>
  /*
    Daily settlement. One seeded year of the index (three to choose from).
    First panel: the index and the futures price, which is the forward price
    for what's left of the year and so meets the index at the end. Second:
    the margin account of a long futures position, tailed (blue) and one
    contract all year (pink), with interest; the dot is what a forward agreed
    at the start pays at the end. The tailed account lands on it exactly.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { paths, settle } from "../forwards.js";
  import { normals } from "../random.js";
  import { money } from "../format.js";

  let { width } = $props();
  const SEEDS = { up: 29, down: 3, back: 10 };
  const RUNS = Object.fromEntries(Object.entries(SEEDS).map(([k, s]) => { const p = paths(normals(s), 1, 250, 0.08)[0]; return [k, { p, s: settle(p) }]; }));
  let which = $state("up");
  let run = $derived(RUNS[which]);
  const H1 = 200, H2 = 220, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X = $derived(linear(0, 250, m.left, width - m.right));
  const Y1 = linear(70, 150, H1 - 12, m.top);
  const Y2 = linear(-30, 30, H2 - 12, m.top);
  const H3 = 170;
  const Y3 = linear(-1, 1, H3 - m.bottom, m.top);
  let diff = $derived(run.s.cashU.map((v, i) => v - run.s.cash[i]));
  const line = (xs, Y) => xs.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(2)},${Y(v).toFixed(2)}`).join("");
</script>

<div class="controls">
  <Segmented id="mg-run" label="A year in which the index" options={[{ value: "up", label: "rises" }, { value: "down", label: "falls" }, { value: "back", label: "rises, then falls back" }]} bind:value={which} />
</div>

<p class="panel-title">The index and the futures price</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="The index and its futures price over the year" class="price-panel">
  <AxisY scale={Y1} ticks={[70, 90, 110, 130, 150]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <path class="index" d={line(run.p, Y1)} fill="none" stroke="#8a94a2" stroke-width="1.4" />
  <path class="futures" d={line(run.s.fut, Y1)} fill="none" stroke="var(--c1)" stroke-width="1.8" />
</svg>

<p class="panel-title">The margin account of the tailed position</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The margin account, tailed and untailed, against a forward's payoff" class="margin-panel">
  <AxisY scale={Y2} ticks={[-30, -15, 0, 15, 30]} x0={m.left} x1={width - m.right} format={(t) => (t < 0 ? "−$" + -t : "$" + t)} />
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y2(0)} y2={Y2(0)} stroke="var(--ink)" stroke-width="1" />
  <path class="tailed" d={line(run.s.cash, Y2)} fill="none" stroke="var(--c1)" stroke-width="2" />
  <circle class="fwd" cx={X(250)} cy={Y2(run.s.forward)} r="6" fill="none" stroke="var(--ink)" stroke-width="2" />
</svg>

<p class="panel-title">One contract all year, minus the tailed position</p>
<svg {width} height={H3} viewBox="0 0 {width} {H3}" role="img" aria-label="How far one contract held all year drifts from the tailed position" class="diff-panel">
  <AxisY scale={Y3} ticks={[-1, -0.5, 0, 0.5, 1]} x0={m.left} x1={width - m.right} format={(t) => (t < 0 ? "−$" + (-t).toFixed(2) : "$" + t.toFixed(2))} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H3 - m.bottom} y2={H3 - m.bottom} />
    {#each [0, 62.5, 125, 187.5, 250] as t (t)}
      <g transform="translate({X(t)},{H3 - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{(t / 250) * 12}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H3 - 6} text-anchor="middle">months from now</text>
  </g>
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y3(0)} y2={Y3(0)} stroke="var(--ink)" stroke-width="1" />
  <path class="untailed" d={line(diff, Y3)} fill="none" stroke="var(--c2)" stroke-width="2" />
</svg>
<div class="legend">
  <span><i style="background:#8a94a2"></i>the index</span>
  <span><i style="background:var(--c1)"></i>futures price, and the tailed position</span>
  <span><i style="background:var(--c2)"></i>one contract all year, against the tailed position</span>
  <span><i class="ring"></i>what a forward pays at the end</span>
</div>

<div class="readouts">
  <Readout id="mg-fwd" label="A forward pays at the end" value={money(run.s.forward, 2)} />
  <Readout id="mg-tailed" label="Tailed futures, at the end" value={money(run.s.cash[250], 2)} />
  <Readout id="mg-untailed" label="One contract all year" value={money(run.s.cashU[250], 2)} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.85rem; font-weight: 700; color: var(--ink-soft); margin: 0.4rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.ring { width: 10px; height: 10px; border: 2px solid var(--ink); border-radius: 50%; background: white; vertical-align: -1px; }
</style>
