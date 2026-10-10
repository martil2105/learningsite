<script>
  /*
    The average wait against maturity, at an 8% yield, for a bond with no
    coupon, one with a 2% coupon and one with an 8% coupon. The dashed line is
    a perpetuity's wait, (1 + y)/y = 13.5 years, which every coupon bond
    approaches; a bond whose coupon is below its yield overshoots it first.
  */
  import { linear } from "../chart.js";
  import { clipTop } from "../clip.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { macaulay, perpetuityWait } from "../duration.js";
  import { pct } from "../format.js";

  let { width } = $props();
  const Y0 = 0.08, TMAX = 100, DMAX = 20;
  const COUPONS = [
    { c: 0, label: "No coupon", color: "#5f6b7a", cls: "c0" },
    { c: 0.02, label: "2% coupon", color: "var(--c2)", cls: "c2" },
    { c: 0.08, label: "8% coupon", color: "var(--c1)", cls: "c8" },
  ];
  let pick = $state(0.02);
  const H = 260, m = { top: 12, right: 14, bottom: 44, left: 44 };
  let X = $derived(linear(0, TMAX, m.left, width - m.right));
  const Y = linear(0, DMAX, H - m.bottom, m.top);
  const TS = Array.from({ length: TMAX }, (_, i) => i + 1);
  const waits = Object.fromEntries(COUPONS.map((o) => [o.c, TS.map((t) => macaulay(o.c, t, Y0))]));
  let lines = $derived(COUPONS.map((o) => ({ ...o, d: clipTop(TS.map((t, i) => [t, waits[o.c][i]]), DMAX).map(([t, w], i) => `${i ? "L" : "M"}${X(t).toFixed(2)},${Y(w).toFixed(2)}`).join("") })));
  let peak = $derived.by(() => { const w = waits[pick]; let k = 0; for (let i = 1; i < w.length; i++) if (w[i] > w[k]) k = i; return { t: TS[k], w: w[k] }; });
  const perp = perpetuityWait(Y0);
</script>

<div class="controls">
  <Segmented id="hf-c" label="Readouts for" options={COUPONS.map((o) => ({ value: o.c, label: o.label }))} bind:value={pick} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The average wait against maturity" class="hump-panel">
  <AxisY scale={Y} ticks={[0, 5, 10, 15, 20]} x0={m.left} x1={width - m.right} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 20, 40, 60, 80, 100] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">years to maturity</text>
  </g>
  <line class="perp" x1={m.left} x2={width - m.right} y1={Y(perp)} y2={Y(perp)} stroke="#8a94a2" stroke-width="1.4" stroke-dasharray="6 4" />
  {#each lines as l (l.cls)}
    <path class="wait {l.cls}" class:dim={l.c !== pick} d={l.d} fill="none" stroke={l.color} stroke-width={l.c === pick ? 2.6 : 1.5} />
  {/each}
  {#if peak.t < TMAX}
    <circle class="peak" cx={X(peak.t)} cy={Y(peak.w)} r="5" fill={COUPONS.find((o) => o.c === pick).color} stroke="white" stroke-width="1.2" />
  {/if}
</svg>
<div class="legend">
  {#each COUPONS as o (o.cls)}<span><i style="background:{o.color}"></i>{o.label}</span>{/each}
  <span><i class="dash"></i>a bond that never matures</span>
</div>

<div class="readouts">
  <Readout id="hf-peak" label="Longest wait" value={peak.t < TMAX ? `${peak.w.toFixed(1)} years, at ${peak.t} years to maturity` : "keeps growing"} />
  <Readout id="hf-100" label="At 100 years to maturity" value={`${waits[pick][TMAX - 1].toFixed(1)} years`} />
</div>

<style>
  svg { display: block; }
  .wait.dim { opacity: 0.5; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #8a94a2 0 6px, transparent 6px 10px); }
</style>
