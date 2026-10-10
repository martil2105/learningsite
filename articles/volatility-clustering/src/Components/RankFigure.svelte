<script>
  /*
    The ten biggest days of the century, ranked two ways: in standard
    deviations of the whole century, or in standard deviations of GARCH's
    forecast for that day. Falls are pink and rises blue; each row's label
    sits above its bar.
  */
  import { linear } from "../chart.js";
  import Segmented from "./Segmented.svelte";
  import { Z_RAW, Z_GARCH, ranked } from "../garch.js";
  import { DATES, RET } from "../market.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let ruler = $state("garch");
  let z = $derived(ruler === "raw" ? Z_RAW : Z_GARCH);
  let rows = $derived(ranked(z, 10));
  const ROW = 34, m = { top: 6, right: 16, bottom: 26, left: 8 };
  const H = m.top + 10 * ROW + m.bottom;
  let X = $derived(linear(0, 18, m.left, width - m.right));
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateOf = (d) => `${d % 100} ${MONTHS[Math.floor(d / 100) % 100 - 1]} ${Math.floor(d / 1e4)}`;
</script>

<div class="controls">
  <Segmented id="rf-ruler" label="Measured in standard deviations of" options={[{ value: "raw", label: "the whole century" }, { value: "garch", label: "that day's forecast" }]} bind:value={ruler} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The ten biggest days, ranked" class="rank-panel">
  {#each rows as i, r (i)}
    {@const y = m.top + r * ROW}
    <text class="row-label" data-date={DATES[i]} x={m.left} y={y + 11}>{r + 1}. {dateOf(DATES[i])}, {pct(RET[i], 1)}: {fixed(Math.abs(z[i]), 1)} sd</text>
    <rect class="bar" data-date={DATES[i]} x={X(0)} y={y + 16} width={X(Math.abs(z[i])) - X(0)} height="11" fill={z[i] < 0 ? "var(--c2)" : "var(--c1)"} />
  {/each}
  <g class="axis axis-x">
    <line x1={X(0)} x2={X(18)} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 5, 10, 15] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{t}</text>
      </g>
    {/each}
  </g>
</svg>
<div class="legend">
  <span><i style="background:var(--c2)"></i>a fall</span>
  <span><i style="background:var(--c1)"></i>a rise</span>
</div>

<style>
  svg { display: block; }
  .row-label { font-size: 12px; fill: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
