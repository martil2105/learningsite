<script>
  /*
    The hook. Each year's market return above bills as a bar, with the
    average over the chosen years and its 95% band drawn across them, and a
    ruler underneath that shows the band at a readable scale. The faint
    outline on the ruler is the band for every year from yearly returns, so a
    change of window or frequency can be read against it.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { YEARS, PREMIUM, FIRST_YEAR, LAST_YEAR, band } from "../premium.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  const MIN = 20; // the shortest window, in years
  let from = $state(FIRST_YEAR);
  let to = $state(LAST_YEAR);
  let freq = $state("yearly");

  // The window actually used: at least MIN years, inside the data.
  let lo = $derived(Math.min(from, LAST_YEAR - MIN + 1));
  let hi = $derived(Math.max(to, lo + MIN - 1));
  $effect(() => { if (to !== hi) to = hi; });

  let b = $derived(band(lo, hi, freq));
  const ALL = band();
  const PRESETS = [
    { id: "all", label: "Every year", from: FIRST_YEAR, to: LAST_YEAR },
    { id: "first", label: "1927 to 1975", from: 1927, to: 1975 },
    { id: "second", label: "1976 to 2025", from: 1976, to: 2025 },
  ];
  const setPreset = (p) => { from = p.from; to = p.to; };

  const H = 230, m = { top: 12, right: 12, bottom: 30, left: 44 };
  let slot = $derived((width - m.left - m.right) / YEARS.length);
  let X = $derived(linear([FIRST_YEAR - 0.5, LAST_YEAR + 0.5], [m.left, width - m.right]));
  const Y = linear([-50, 60], [H - m.bottom, m.top]);
  const yticks = [-40, -20, 0, 20, 40, 60];
  const xticks = [1930, 1950, 1970, 1990, 2010];

  const RH = 64, rm = { top: 20, bottom: 26 };
  let R = $derived(linear([-10, 30], [m.left, width - m.right]));
  const rticks = [-10, 0, 10, 20, 30];
  const cy = rm.top + (RH - rm.top - rm.bottom) / 2;
  const pctStr = (v) => fixed(v, 1) + "%";
</script>

<div class="controls">
  <Slider id="bl-from" label="First year" min={FIRST_YEAR} max={LAST_YEAR - MIN + 1} bind:value={from} width={210} />
  <Slider id="bl-to" label="Last year" min={FIRST_YEAR + MIN - 1} max={LAST_YEAR} bind:value={to} width={210} />
  <Segmented id="bl-freq" label="Returns used" options={[{ value: "yearly", label: "Yearly" }, { value: "monthly", label: "Monthly" }]} bind:value={freq} />
  <div class="presets" id="bl-presets">
    {#each PRESETS as p (p.id)}
      <button type="button" data-p={p.id} class:on={lo === p.from && hi === p.to} onclick={() => setPreset(p)}>{p.label}</button>
    {/each}
  </div>
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Yearly market return above bills since 1927, with the average and its 95% band" class="bars-panel">
  <AxisY scale={Y} ticks={yticks} x0={m.left} x1={width - m.right} format={(t) => t + "%"} />
  {#each YEARS as y, i (y)}
    {@const v = PREMIUM[i]}
    <rect class="bar" class:in={y >= lo && y <= hi} data-year={y} x={X(y) - Math.max(0.6, slot * 0.38)} width={Math.max(1.2, slot * 0.76)}
      y={Y(Math.max(0, v))} height={Math.abs(Y(v) - Y(0))} fill={y >= lo && y <= hi ? (v >= 0 ? "var(--c4)" : "var(--c2)") : "#d3d7de"} />
  {/each}
  <rect class="band" x={X(lo - 0.5)} width={X(hi + 0.5) - X(lo - 0.5)} y={Y(b.hi)} height={Y(b.lo) - Y(b.hi)} fill="var(--c1)" fill-opacity="0.3" />
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.5" />
  <line class="mean" x1={X(lo - 0.5)} x2={X(hi + 0.5)} y1={Y(b.mean)} y2={Y(b.mean)} stroke="var(--c1)" stroke-width="2.5" />
  <AxisX scale={X} ticks={xticks} y={H - m.bottom} />
</svg>

<svg {width} height={RH} viewBox="0 0 {width} {RH}" role="img" aria-label="The 95% band for the average premium on a ruler" class="ruler-panel">
  <text class="ruler-title" x={m.left} y="12">The average premium and its 95% band</text>
  <rect class="ghost" x={R(ALL.lo)} width={R(ALL.hi) - R(ALL.lo)} y={cy - 9} height="18" fill="none" stroke="var(--ink)" stroke-opacity="0.45" stroke-dasharray="3 3" />
  <rect class="rband" x={R(Math.max(-10, b.lo))} width={R(Math.min(30, b.hi)) - R(Math.max(-10, b.lo))} y={cy - 6} height="12" fill="var(--c1)" fill-opacity="0.35" />
  <circle class="rmean" cx={R(b.mean)} {cy} r="5" fill="var(--c1)" />
  <line x1={R.range[0]} x2={R.range[1]} y1={RH - rm.bottom + 4} y2={RH - rm.bottom + 4} stroke="var(--ink)" stroke-opacity="0.4" />
  {#each rticks as t (t)}
    <line x1={R(t)} x2={R(t)} y1={RH - rm.bottom + 4} y2={RH - rm.bottom + 8} stroke="var(--ink)" stroke-opacity="0.4" />
    <text class="tick-label" x={R(t)} y={RH - 4} text-anchor="middle">{t}%</text>
  {/each}
</svg>

<div class="readouts">
  <Readout id="bl-r-mean" label="Average premium" value={pctStr(b.mean)} color="var(--c1)" />
  <Readout id="bl-r-se" label="Standard error" value={fixed(b.se, 1)} />
  <Readout id="bl-r-band" label="95% band" value={pctStr(b.lo) + " to " + pctStr(b.hi)} />
  <Readout id="bl-r-n" label={freq === "yearly" ? "Years" : "Months"} value={String(b.n)} />
</div>

<style>
  .presets { display: flex; flex-wrap: wrap; gap: 6px; align-items: flex-end; }
  .presets button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; }
  .presets button.on { background: var(--ink); color: white; border-color: var(--ink); }
  .ruler-title { font-size: 11px; font-weight: 700; fill: var(--ink-soft); }
  svg { display: block; }
</style>
