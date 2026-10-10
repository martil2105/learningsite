<script>
  /*
    The forecast doesn't enter. The middle 90% of where the index could be
    over the year (shaded) and its expected path (pink), for an expected
    return on the slider, against the forward price (blue dot) and the carry
    line, which don't move.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { S0, R, Q, forward, expected, band } from "../forwards.js";
  import { pct, money } from "../format.js";

  let { width } = $props();
  let mu = $state(0.08);
  const H = 260, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X = $derived(linear(0, 1, m.left, width - m.right));
  const Y = linear(60, 160, H - m.bottom, m.top);
  const TS = Array.from({ length: 51 }, (_, i) => i / 50);
  const F = forward();
  let area = $derived(TS.map((t, i) => `${i ? "L" : "M"}${X(t).toFixed(2)},${Y(band(mu, t)[1]).toFixed(2)}`).join("") + TS.slice().reverse().map((t) => `L${X(t).toFixed(2)},${Y(band(mu, t)[0]).toFixed(2)}`).join("") + "Z");
  let exp = $derived(TS.map((t, i) => `${i ? "L" : "M"}${X(t).toFixed(2)},${Y(expected(mu, t)).toFixed(2)}`).join(""));
  let carry = $derived(TS.map((t, i) => `${i ? "L" : "M"}${X(t).toFixed(2)},${Y(S0 * Math.exp((R - Q) * t)).toFixed(2)}`).join(""));
</script>

<div class="controls">
  <Slider id="ff-mu" label="Return investors expect, a year" min={-0.05} max={0.15} step={0.005} bind:value={mu} format={(v) => pct(v, 1)} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Where the index could go, against the forward price" class="forecast-panel">
  <path class="band" d={area} fill="var(--c2-soft)" opacity="0.7" />
  <AxisY scale={Y} ticks={[60, 80, 100, 120, 140, 160]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 0.25, 0.5, 0.75, 1] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t * 12}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">months from now</text>
  </g>
  <path class="expected" d={exp} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <path class="carry" d={carry} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <circle class="fwd" cx={X(1)} cy={Y(F)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
  <circle class="exp-end" cx={X(1)} cy={Y(expected(mu))} r="5" fill="var(--c2)" stroke="white" stroke-width="1.2" />
</svg>
<div class="legend">
  <span><i style="background:var(--c2)"></i>where investors expect the index to be</span>
  <span><i class="soft"></i>the middle 90% of where it could be</span>
  <span><i style="background:var(--c1)"></i>buying now and carrying</span>
</div>

<div class="readouts">
  <Readout id="ff-exp" label="Expected in a year" value={money(expected(mu), 2)} />
  <Readout id="ff-fwd" label="The forward price" value={money(F, 2)} />
  <Readout id="ff-gain" label="Buying forward expects to make" value={money(expected(mu) - F, 2)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.soft { height: 10px; vertical-align: -1px; background: var(--c2-soft); }
</style>
