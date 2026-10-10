<script>
  /*
    The hook. The model's spreads for Aaa and Baa bonds over ten years: the
    part that pays for expected losses (grey) and the part that pays for when
    defaults happen (blue), set by theta = correlation x the market's Sharpe
    ratio. The third bar is the model's Baa-over-Aaa gap, against what Baa
    paid over Aaa in the same years the default rates come from (pink).
  */
  import { linear } from "../chart.js";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { ratings, stretch } from "../credit.js";
  import { fixed, pct } from "../format.js";

  let { width, corr = $bindable(0.5), sharpe = $bindable(0.43) } = $props();
  const paid = stretch("1970-01", "2001-12").mean;
  let theta = $derived(corr * sharpe);
  let r = $derived(ratings(theta));
  const ROW = 58, top = 8, H = top + ROW * 3 + 40, m = { left: 12, right: 18 };
  let X = $derived(linear(0, 5, m.left, width - m.right));
  const yOf = (i) => top + i * ROW + 22;
  const BH = 18;
</script>

<div class="controls">
  <Slider id="ml-corr" label="Correlation with the market" min={0} max={1} step={0.05} bind:value={corr} format={(v) => v.toFixed(2)} width={260} />
  <Slider id="ml-sharpe" label="The market's Sharpe ratio" min={0} max={0.7} step={0.01} bind:value={sharpe} format={(v) => v.toFixed(2)} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Model spreads for Aaa and Baa bonds, and the gap between them" class="model-panel">
  {#each [0, 1, 2, 3, 4, 5] as t (t)}
    <line class="grid" x1={X(t)} x2={X(t)} y1={top} y2={top + ROW * 3} stroke="#e6e9ea" />
  {/each}
  {#each ["Aaa", "Baa"] as k, i (k)}
    <text class="bar-label" x={X(0)} y={yOf(i) - 6}>{k}: {fixed(100 * r[k].spread, 2)} points a year</text>
    <rect class="loss {k}" x={X(0)} y={yOf(i)} width={X(100 * r[k].loss) - X(0)} height={BH} fill="#8a94a2" />
    <rect class="premium {k}" x={X(100 * r[k].loss)} y={yOf(i)} width={Math.max(0, X(Math.min(5, 100 * r[k].spread)) - X(100 * r[k].loss))} height={BH} fill="var(--c1)" />
  {/each}
  <text class="bar-label" x={X(0)} y={yOf(2) - 6}>Baa minus Aaa: {fixed(100 * r.gap, 2)} points</text>
  <rect class="gap" x={X(0)} y={yOf(2)} width={X(Math.min(5, 100 * r.gap)) - X(0)} height={BH} fill="var(--c1)" />
  <line class="paid" x1={X(paid)} x2={X(paid)} y1={yOf(2) - 4} y2={yOf(2) + BH + 4} stroke="var(--c2)" stroke-width="3" />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={top + ROW * 3} y2={top + ROW * 3} />
    {#each [0, 1, 2, 3, 4, 5] as t (t)}
      <g transform="translate({X(t)},{top + ROW * 3})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 4} text-anchor="middle">points a year, over ten years</text>
  </g>
</svg>
<div class="legend">
  <span><i style="background:#8a94a2"></i>pays for expected losses</span>
  <span><i style="background:var(--c1)"></i>pays for when they happen</span>
  <span><i style="background:var(--c2)"></i>what Baa paid over Aaa, 1970 to 2001</span>
</div>

<div class="readouts">
  <Readout id="ml-theta" label="Correlation × Sharpe" value={theta.toFixed(3)} />
  <Readout id="ml-gap" label="Baa minus Aaa, the model" value={fixed(100 * r.gap, 2) + " points"} />
  <Readout id="ml-paid" label="Paid, 1970 to 2001" value={fixed(paid, 2) + " points"} />
  <Readout id="ml-share" label="The model explains" value={pct(100 * r.gap / paid, 0)} />
</div>

<style>
  svg { display: block; }
  .bar-label { font-size: 12px; font-weight: 600; fill: var(--ink-soft); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 8px; margin-right: 6px; vertical-align: 0; }
</style>
