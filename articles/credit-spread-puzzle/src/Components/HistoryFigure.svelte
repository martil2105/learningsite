<script>
  /*
    A century of Moody's Baa yield minus its Aaa yield, monthly, with the gap
    that expected default losses explain as a dashed line. The period buttons
    shade a stretch and the readouts average over it.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { SPREAD, N, yearOf, stretch, PERIODS, ratings, monthName } from "../credit.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let period = $state("all");
  const lossGap = 100 * ratings(0).lossGap;
  const H = 260, m = { top: 12, right: 16, bottom: 44, left: 40 };
  let X = $derived(linear(1919, 2027, m.left, width - m.right));
  const Y = linear(0, 6, H - m.bottom, m.top);
  let line = $derived(SPREAD.map((v, i) => `${i ? "L" : "M"}${X(yearOf(i) + 1 / 24).toFixed(2)},${Y(v).toFixed(2)}`).join(""));
  let p = $derived(PERIODS.find((q) => q.key === period));
  let w = $derived(stretch(p.from, p.to));
</script>

<div class="controls">
  <Segmented id="hf-period" label="Average over" options={PERIODS.map((q) => ({ value: q.key, label: q.label }))} bind:value={period} />
</div>

<p class="panel-title">Baa yield minus Aaa yield, points a year</p>
<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Baa yield minus Aaa yield, every month since 1919" class="history-panel">
  <rect class="window" x={X(yearOf(w.a))} y={m.top} width={X(yearOf(w.b + 1)) - X(yearOf(w.a))} height={H - m.bottom - m.top} fill="var(--c1-soft)" opacity="0.6" />
  <AxisY scale={Y} ticks={[0, 1, 2, 3, 4, 5, 6]} x0={m.left} x1={width - m.right} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [1920, 1940, 1960, 1980, 2000, 2020] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
  </g>
  <path class="spread" d={line} fill="none" stroke="var(--ink)" stroke-width="1.1" />
  <line class="mean" x1={X(yearOf(w.a))} x2={X(yearOf(w.b + 1))} y1={Y(w.mean)} y2={Y(w.mean)} stroke="var(--c1)" stroke-width="2.4" />
  <line class="loss" x1={m.left} x2={width - m.right} y1={Y(lossGap)} y2={Y(lossGap)} stroke="var(--c2)" stroke-width="2" stroke-dasharray="6 4" />
</svg>
<div class="legend">
  <span><i style="background:var(--ink)"></i>each month</span>
  <span><i style="background:var(--c1)"></i>the average over the shaded years</span>
  <span><i class="dash"></i>what expected defaults explain</span>
</div>

<div class="readouts">
  <Readout id="hf-mean" label="Average" value={fixed(w.mean, 2) + " points"} />
  <Readout id="hf-max" label="Widest" value={fixed(w.max, 2) + ", " + monthName(w.maxAt)} />
  <Readout id="hf-loss" label="Defaults explain" value={fixed(lossGap, 2) + " points"} />
  <Readout id="hf-mult" label="Paid, as a multiple" value={fixed(w.mean / lossGap, 1) + "×"} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.85rem; font-weight: 700; color: var(--ink-soft); margin: 0.4rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--c2) 0 6px, transparent 6px 10px); }
</style>
