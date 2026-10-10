<script>
  /*
    The hook. Three years of daily returns as thin bars, with the band of
    two of GARCH's forecast standard deviations either side of zero: each
    day's forecast is made from the days before it. Bars that leave the band
    are pink. Readouts: the share outside the band, and the window's biggest
    day measured against the century's spread and against its own forecast.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { E, SD_T, Z_RAW, Z_GARCH, PERIODS, MEAN } from "../garch.js";
  import { DATES, RET, span } from "../market.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let key = $state("y1987");
  let ab = $derived(PERIODS[key]);
  let idx = $derived.by(() => { const [i0, i1] = span(ab[0], ab[1]); return { i0, i1 }; });
  const H = 300, m = { top: 12, right: 12, bottom: 30, left: 48 };
  let X = $derived(linear(idx.i0, idx.i1 - 1, m.left, width - m.right));
  let lim = $derived.by(() => {
    let mx = 0; for (let i = idx.i0; i < idx.i1; i++) mx = Math.max(mx, Math.abs(RET[i]), 2.2 * SD_T[i]);
    const steps = [0.02, 0.04, 0.06, 0.08, 0.1, 0.2]; return steps.find((s) => s >= mx * 1.02) ?? 0.2;
  });
  let Y = $derived(linear(-lim, lim, H - m.bottom, m.top));
  let ticks = $derived([-lim, -lim / 2, 0, lim / 2, lim]);
  let band = $derived.by(() => {
    const up = [], dn = [];
    for (let i = idx.i0; i < idx.i1; i++) { const x = X(i).toFixed(2); up.push(`${x},${Y(MEAN + 2 * SD_T[i]).toFixed(2)}`); dn.push(`${x},${Y(MEAN - 2 * SD_T[i]).toFixed(2)}`); }
    return "M" + up.join("L") + "L" + dn.reverse().join("L") + "Z";
  });
  let days = $derived.by(() => {
    const out = [];
    for (let i = idx.i0; i < idx.i1; i++) out.push({ i, x: X(i), y: Y(RET[i]), out: Math.abs(Z_GARCH[i]) > 2 });
    return out;
  });
  let outside = $derived(days.filter((d) => d.out).length);
  let big = $derived.by(() => { let b = idx.i0; for (let i = idx.i0; i < idx.i1; i++) if (Math.abs(RET[i]) > Math.abs(RET[b])) b = i; return b; });
  let years = $derived(Array.from({ length: ab[1] - ab[0] + 1 }, (_, j) => ab[0] + j));
  const firstOf = (y) => DATES.findIndex((d) => d >= y * 1e4);
  const dateOf = (d) => `${d % 100} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Math.floor(d / 100) % 100 - 1]} ${Math.floor(d / 1e4)}`;
</script>

<div class="controls">
  <Segmented id="vl-period" label="Three years around" options={[{ value: "y1955", label: "1955" }, { value: "calm", label: "1964, calm" }, { value: "y1987", label: "1987" }, { value: "y2008", label: "2008" }, { value: "y2020", label: "2020" }]} bind:value={key} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Three years of daily returns with GARCH's forecast band" class="vol-panel">
  <AxisY scale={Y} {ticks} x0={m.left} x1={width - m.right} format={(v) => (Math.abs(v) < 1e-12 ? "0%" : pct(v, 0))} />
  <path class="band" d={band} fill="var(--c1)" fill-opacity="0.16" />
  {#each days as d (d.i)}
    <line class="day" class:out={d.out} x1={d.x} x2={d.x} y1={Y(0)} y2={d.y} stroke={d.out ? "var(--c2)" : "#8a94a2"} stroke-width={d.out ? 1.4 : 1} />
  {/each}
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.5" />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each years as y (y)}
      <g transform="translate({X(firstOf(y))},{H - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="start">{y}</text>
      </g>
    {/each}
  </g>
</svg>
<div class="legend">
  <span><i style="background:var(--c1);opacity:0.35;height:10px;vertical-align:0"></i>two forecast standard deviations</span>
  <span><i style="background:var(--c2)"></i>a day outside it</span>
</div>

<div class="readouts">
  <Readout id="vl-r-out" label="Days outside the band" value={`${outside} of ${days.length} (${pct(outside / days.length, 1)})`} />
  <Readout id="vl-r-big" label="Biggest day" value={`${dateOf(DATES[big])}, ${pct(RET[big], 1)}`} />
  <Readout id="vl-r-raw" label="In the century's sd" value={fixed(Z_RAW[big], 1)} />
  <Readout id="vl-r-garch" label="In its forecast's sd" value={fixed(Z_GARCH[big], 1)} color="var(--c2)" />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
