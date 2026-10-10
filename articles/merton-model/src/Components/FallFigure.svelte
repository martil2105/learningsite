<script>
  /*
    The same firm at other asset values, with the asset volatility held where
    the solver put it. First panel: how much the shares move. Second: the
    market's chance of default, on a log axis. The grey ring is where our firm
    starts, the dot is where the slider puts it, and the dashed line is the debt.
  */
  import { linear, log } from "../chart.js";
  import { bandPath } from "../clip.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { solve, firm, F } from "../merton.js";
  import { pct, money, signedPct } from "../format.js";

  let { width } = $props();
  const base = solve();
  let change = $state(0);
  const H1 = 190, H2 = 210, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X = $derived(linear(64, 120, m.left, width - m.right));
  const Y1 = linear(0, 1.6, H1 - 12, m.top);
  const Y2 = log(0.001, 1, H2 - m.bottom, m.top);
  const VS = Array.from({ length: 113 }, (_, i) => 64 + i * 0.5);
  let at = $derived(firm(base.V * (1 + change), base.s));
  const path = (f, Y) => VS.map((v, i) => `${i ? "L" : "M"}${X(v).toFixed(2)},${Y(f(firm(v, base.s))).toFixed(2)}`).join("");
  let volLine = $derived(bandPath(VS.map((v) => [X(v), Y1(firm(v, base.s).sE)]), m.top, H1 - 12));
  let pdLine = $derived(path((x) => Math.max(x.pdQ, 0.001), Y2));
</script>

<div class="controls">
  <Slider id="ff-ch" label="Change in the assets" min={-0.3} max={0.2} step={0.01} bind:value={change} format={(v) => signedPct(v, 0)} width={300} />
</div>

<p class="panel-title">How much the shares move, a year</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Share volatility against the value of the assets" class="vol-panel">
  <AxisY scale={Y1} ticks={[0, 0.4, 0.8, 1.2, 1.6]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <line class="debt" x1={X(F)} x2={X(F)} y1={m.top} y2={H1 - 12} stroke="#8a94a2" stroke-width="1.2" stroke-dasharray="4 3" />
  <path class="vol-line" d={volLine} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <circle class="start" cx={X(base.V)} cy={Y1(base.sE)} r="6" fill="none" stroke="#8a94a2" stroke-width="2" />
  <circle class="now" cx={X(at.V)} cy={Y1(at.sE)} r="5" fill="var(--c2)" stroke="white" stroke-width="1.2" />
</svg>

<p class="panel-title">The market's chance of default (log scale)</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The chance of default against the value of the assets" class="pd-panel">
  <AxisY scale={Y2} ticks={[0.001, 0.01, 0.1, 1]} x0={m.left} x1={width - m.right} format={(t) => pct(t, t < 0.01 ? 1 : 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H2 - m.bottom} y2={H2 - m.bottom} />
    {#each [70, 80, 90, 100, 110, 120] as t (t)}
      <g transform="translate({X(t)},{H2 - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">${t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H2 - 6} text-anchor="middle">what the assets are worth</text>
  </g>
  <line class="debt" x1={X(F)} x2={X(F)} y1={m.top} y2={H2 - m.bottom} stroke="#8a94a2" stroke-width="1.2" stroke-dasharray="4 3" />
  <path class="pd-line" d={pdLine} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <circle class="start" cx={X(base.V)} cy={Y2(base.pdQ)} r="6" fill="none" stroke="#8a94a2" stroke-width="2" />
  <circle class="now" cx={X(at.V)} cy={Y2(at.pdQ)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
</svg>
<div class="legend"><span><i class="dash"></i>the debt, $70</span><span><i class="ring"></i>where our firm starts</span></div>

<div class="readouts">
  <Readout id="ff-e" label="The shares are worth" value={money(at.E, 2)} />
  <Readout id="ff-ech" label="Change in the shares" value={signedPct(at.E / base.E - 1, 1)} />
  <Readout id="ff-se" label="They move, a year" value={pct(at.sE, 1)} />
  <Readout id="ff-pd" label="The market's chance of default" value={pct(at.pdQ, 2)} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.85rem; font-weight: 700; color: var(--ink-soft); margin: 0.4rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #8a94a2 0 4px, transparent 4px 7px); }
  .legend i.ring { width: 10px; height: 10px; border: 2px solid #8a94a2; border-radius: 50%; vertical-align: -1px; }
</style>
