<script>
  /*
    The band around the average premium from yearly returns and from monthly
    returns over the same years, ending in 2025, with a third row showing what
    twelve times as many independent years would give. The slider sets how
    many years we have.
  */
  import { linear } from "../scale.js";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { band, LAST_YEAR } from "../premium.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let years = $state(99);
  let y = $derived(band(LAST_YEAR - years + 1, LAST_YEAR, "yearly"));
  let mo = $derived(band(LAST_YEAR - years + 1, LAST_YEAR, "monthly"));
  let rows = $derived([
    { id: "yearly", label: "Yearly returns", mean: y.mean, se: y.se, color: "var(--c4)" },
    { id: "monthly", label: "Monthly returns", mean: mo.mean, se: mo.se, color: "var(--c1)" },
    { id: "twelve", label: "Twelve times as many years (imagined)", mean: y.mean, se: y.se / Math.sqrt(12), color: "var(--c3)" },
  ]);

  const m = { left: 16, right: 16 }, ROW = 46, TOP = 6, AX = 30;
  const H = TOP + 3 * ROW + AX;
  let X = $derived(linear([-10, 30], [m.left, width - m.right]));
  const ticks = [-10, 0, 10, 20, 30];
  const Z = 1.959963984540054;
</script>

<div class="controls">
  <Slider id="fb-years" label="Years of data, up to 2025" min={20} max={99} bind:value={years} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The 95% band for the average premium from yearly and monthly returns" class="freq-panel">
  {#each ticks as t (t)}
    <line class="grid" x1={X(t)} x2={X(t)} y1={TOP} y2={H - AX} stroke="var(--ink)" stroke-opacity="0.08" />
  {/each}
  {#each rows as r, i (r.id)}
    {@const cy = TOP + i * ROW + 30}
    <g class="row row-{r.id}">
      <text class="row-label" x={m.left} y={cy - 12}>{r.label}</text>
      <rect class="rband" x={X(Math.max(-10, r.mean - Z * r.se))} width={X(Math.min(30, r.mean + Z * r.se)) - X(Math.max(-10, r.mean - Z * r.se))}
        y={cy - 6} height="12" fill={r.color} fill-opacity={r.id === "twelve" ? 0.18 : 0.3} stroke={r.id === "twelve" ? r.color : "none"} stroke-dasharray="3 2" />
      <circle cx={X(r.mean)} {cy} r="5" fill={r.color} />
    </g>
  {/each}
  <line x1={X.range[0]} x2={X.range[1]} y1={H - AX + 4} y2={H - AX + 4} stroke="var(--ink)" stroke-opacity="0.4" />
  {#each ticks as t (t)}
    <text class="tick-label" x={X(t)} y={H - AX + 20} text-anchor="middle">{t}%</text>
  {/each}
</svg>

<div class="readouts">
  <Readout id="fb-r-y" label="Yearly: standard error" value={fixed(y.se, 1)} color="var(--c4)" />
  <Readout id="fb-r-m" label="Monthly: standard error" value={fixed(mo.se, 1)} color="var(--c1)" />
  <Readout id="fb-r-n" label="Months used" value={String(mo.n)} />
</div>

<style>
  .row-label { font-size: 12px; font-weight: 600; fill: var(--ink-soft); }
  svg { display: block; }
</style>
