<script>
  /*
    What the real chance does set: the expected return over the year of the
    share (grey) and the call (blue) against the real chance of the up move.
    Both are straight lines; they cross at the safe 5% where p is the
    risk-neutral 0.5, and the call's line is seven times as steep.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { returns, onePeriod } from "../binomial.js";
  import { pct, money, signedPct } from "../format.js";

  let { width } = $props();
  let p = $state(0.9);
  const o = onePeriod();
  const H = 270, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X = $derived(linear(0, 1, m.left, width - m.right));
  const Y = linear(-1, 1.2, H - m.bottom, m.top);
  let r = $derived(returns(p));
  let shareD = $derived(`M${X(0)},${Y(returns(0).share)}L${X(1)},${Y(returns(1).share)}`);
  let callD = $derived(`M${X(0)},${Y(returns(0).call)}L${X(1)},${Y(returns(1).call)}`);
</script>

<div class="controls">
  <Slider id="rf-p" label="Real chance the share rises" min={0} max={1} step={0.05} bind:value={p} format={(v) => pct(v, 0)} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Expected returns of the share and the call against the real chance of a rise" class="return-panel">
  <AxisY scale={Y} ticks={[-1, -0.5, 0, 0.5, 1]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 0.25, 0.5, 0.75, 1] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">real chance the share rises</text>
  </g>
  <line class="safe" x1={m.left} x2={width - m.right} y1={Y(0.05)} y2={Y(0.05)} stroke="#8a94a2" stroke-width="1.2" stroke-dasharray="4 3" />
  <path class="share" d={shareD} fill="none" stroke="var(--ink)" stroke-width="2.2" />
  <path class="call" d={callD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <circle class="dot-share" cx={X(p)} cy={Y(r.share)} r="5" fill="var(--ink)" stroke="white" stroke-width="1.2" />
  <circle class="dot-call" cx={X(p)} cy={Y(r.call)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
</svg>
<div class="legend">
  <span><i style="background:var(--ink)"></i>the share</span>
  <span><i style="background:var(--c1)"></i>the call</span>
  <span><i class="dash"></i>the safe rate, 5%</span>
</div>

<div class="readouts">
  <Readout id="rf-share" label="The share's expected return" value={signedPct(r.share, 0)} />
  <Readout id="rf-call" label="The call's" value={signedPct(r.call, 0)} />
  <Readout id="rf-price" label="The call's price" value={money(o.price, 2)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #8a94a2 0 4px, transparent 4px 7px); }
</style>
