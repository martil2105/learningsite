<script>
  /*
    What we earn a year, held to maturity, against the rate the coupons are
    reinvested at, for four bonds bought at an 8% yield. The dashed line is
    the first-order rule: the yield on a share D/T of the life, the new rate
    on the rest, so its slope is 1 − D/T. A zero has slope 0; the longer the
    coupon bond, the closer it gets to the diagonal, where we'd simply earn
    the new rate.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { realised, realisedRule, macaulay } from "../bonds.js";
  import { pct } from "../format.js";

  let { width } = $props();
  const YB = 0.08;
  const BONDS = [
    { key: "zero30", c: 0, T: 30, label: "No coupon, 30 years" },
    { key: "c10", c: 0.08, T: 10, label: "8%, 10 years" },
    { key: "c30", c: 0.08, T: 30, label: "8%, 30 years" },
    { key: "c100", c: 0.08, T: 100, label: "8%, 100 years" },
  ];
  let key = $state("c30");
  let b = $derived(BONDS.find((o) => o.key === key));
  let D = $derived(macaulay(b.c, b.T, YB));
  const H = 280, m = { top: 12, right: 14, bottom: 44, left: 46 };
  let X = $derived(linear(0, 0.12, m.left, width - m.right));
  const Y = linear(0, 0.12, H - m.bottom, m.top);
  const RS = Array.from({ length: 121 }, (_, i) => i / 1000);
  const line = (f) => RS.map((r, i) => `${i ? "L" : "M"}${X(r).toFixed(2)},${Y(f(r)).toFixed(2)}`).join("");
  let curve = $derived(line((r) => realised(b.c, b.T, YB, r)));
  let rule = $derived(line((r) => Math.max(0, Math.min(0.12, realisedRule(b.c, b.T, YB, r)))));
  const T4 = [0, 0.04, 0.08, 0.12];
</script>

<div class="controls">
  <Segmented id="rf-bond" label="Bond, bought at an 8% yield" options={BONDS.map((o) => ({ value: o.key, label: o.label }))} bind:value={key} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="What we earn against the rate coupons are reinvested at" class="rule-panel">
  <AxisY scale={Y} ticks={T4} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each T4 as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">the new rate, after we buy</text>
  </g>
  <line class="diag" x1={X(0)} y1={Y(0)} x2={X(0.12)} y2={Y(0.12)} stroke="#8a94a2" stroke-width="1.2" stroke-dasharray="2 3" />
  <line class="flat" x1={X(0)} y1={Y(YB)} x2={X(0.12)} y2={Y(YB)} stroke="#8a94a2" stroke-width="1.2" stroke-dasharray="2 3" />
  <path class="rule" d={rule} fill="none" stroke="#5f6b7a" stroke-width="1.6" stroke-dasharray="6 4" />
  <path class="earned" d={curve} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <circle class="at4" cx={X(0.04)} cy={Y(realised(b.c, b.T, YB, 0.04))} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>what we earn a year</span>
  <span><i class="dash"></i>the rule: slope 1 − D/T</span>
  <span><i class="dot"></i>the yield, and the new rate itself</span>
</div>

<div class="readouts">
  <Readout id="rf-d" label="Average wait, D" value={`${D.toFixed(1)} years`} />
  <Readout id="rf-share" label="D over maturity" value={pct(D / b.T, 0)} />
  <Readout id="rf-4" label="Earned if rates fall to 4%" value={pct(realised(b.c, b.T, YB, 0.04), 2)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #5f6b7a 0 6px, transparent 6px 10px); }
  .legend i.dot { background: repeating-linear-gradient(90deg, #8a94a2 0 2px, transparent 2px 5px); }
</style>
