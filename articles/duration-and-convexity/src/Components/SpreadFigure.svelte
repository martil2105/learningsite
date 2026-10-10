<script>
  /*
    Three ways to hold $100 with the same average wait as the 30-year 8% bond
    (12.2 years), each sold at that wait: a single zero-coupon bond maturing
    then, the coupon bond itself, and a barbell of 2-year and 30-year zeros.
    The curves are each one's money against the promise, for every new rate.
    The more spread out the payment dates, the deeper the valley.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { dates, atHorizon, barbell, bullet } from "../duration.js";
  import { pct, signedPct } from "../format.js";

  let { width } = $props();
  const C = 0.08, T = 30, Y0 = 0.08;
  const d = dates(C, T, Y0);
  const bb = barbell(d.D, Y0), bu = bullet(d.D, Y0);
  const SETS = [
    { key: "bullet", label: "One zero", color: "#5f6b7a", sd: 0, gain: (r) => bu.atHorizon(d.D, r) - 1 },
    { key: "coupon", label: "The 8% bond", color: "var(--c1)", sd: Math.sqrt(d.V), gain: (r) => atHorizon(C, T, Y0, d.D, r) - 1 },
    { key: "barbell", label: "2-year and 30-year zeros", color: "var(--c2)", sd: Math.sqrt(bb.V), gain: (r) => bb.atHorizon(d.D, r) - 1 },
  ];
  let pick = $state("barbell");
  let s = $derived(SETS.find((o) => o.key === pick));
  const H = 260, m = { top: 12, right: 14, bottom: 44, left: 52 };
  let X = $derived(linear(0.04, 0.12, m.left, width - m.right));
  const Y = linear(-0.02, 0.16, H - m.bottom, m.top);
  const RS = Array.from({ length: 161 }, (_, i) => 0.04 + i * 0.0005);
  let lines = $derived(SETS.map((o) => ({ ...o, d: RS.map((r, i) => `${i ? "L" : "M"}${X(r).toFixed(2)},${Y(o.gain(r)).toFixed(2)}`).join("") })));
</script>

<div class="controls">
  <Segmented id="sp-set" label="Readouts for" options={SETS.map((o) => ({ value: o.key, label: o.label }))} bind:value={pick} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Three portfolios with the same average wait, sold at it" class="spread-panel">
  <AxisY scale={Y} ticks={[0, 0.05, 0.1, 0.15]} x0={m.left} x1={width - m.right} format={(t) => signedPct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0.04, 0.06, 0.08, 0.1, 0.12] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">the new rate, just after we buy</text>
  </g>
  {#each lines as l (l.key)}
    <path class="gain {l.key}" class:dim={l.key !== pick} d={l.d} fill="none" stroke={l.color} stroke-width={l.key === pick ? 2.6 : 1.5} />
  {/each}
</svg>
<div class="legend">
  {#each SETS as o (o.key)}<span><i style="background:{o.color}"></i>{o.label}</span>{/each}
</div>

<div class="readouts">
  <Readout id="sp-sd" label="Spread of the payment dates" value={`${s.sd.toFixed(1)} years`} />
  <Readout id="sp-4" label="If rates fall to 4%" value={signedPct(s.gain(0.04), 2)} />
  <Readout id="sp-12" label="If rates rise to 12%" value={signedPct(s.gain(0.12), 2)} />
</div>

<style>
  svg { display: block; }
  .gain.dim { opacity: 0.5; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
