<script>
  /*
    One panel of the window chart.

    Two curves against minPts: the eps at which the first two stops fall into
    one cluster, and the eps at which the loosest stop finally holds together.
    Every eps that works has to be above the second and below the first, so the
    space between them IS the window - and when the curves cross, the window is
    not narrow, it is empty, and the shading says which.
  */
  import { INK, GOOD, BAD, LABEL, TICK, ACCENT } from "../palette.js";

  export let rows;          // [{ m, merge, cohere, gap }]
  export let title;
  export let sub;
  export let maxEps = 40;
  export let width = 240;
  export let height = 190;

  const margin = { top: 8, right: 10, bottom: 30, left: 34 };
  $: plotW = Math.max(60, width - margin.left - margin.right);
  $: plotH = Math.max(60, height - margin.top - margin.bottom);
  $: ms = rows.map((r) => r.m);
  $: mLo = Math.min(...ms);
  $: mHi = Math.max(...ms);
  $: X = (m) => margin.left + ((m - mLo) / (mHi - mLo)) * plotW;
  $: Y = (e) => margin.top + plotH - (Math.min(e, maxEps) / maxEps) * plotH;
  $: pathOf = (key) => rows.map((r, i) => (i ? "L " : "M ") + X(r.m).toFixed(2) + " " + Y(r[key]).toFixed(2)).join(" ");
  /* The band between the two curves, as one closed shape. It is filled green
     where a window exists and red where the curves have crossed, so the panel
     reads before any of its labels do. */
  $: bandPath =
    rows.map((r, i) => (i ? "L " : "M ") + X(r.m).toFixed(2) + " " + Y(r.cohere).toFixed(2)).join(" ") +
    " " + rows.slice().reverse().map((r) => "L " + X(r.m).toFixed(2) + " " + Y(r.merge).toFixed(2)).join(" ") + " Z";
  $: anyWindow = rows.some((r) => r.gap !== null && r.gap < 0);
  $: allMissing = rows.every((r) => r.gap !== null && r.gap > 0);
  $: epsTicks = [0, 10, 20, 30, 40].filter((t) => t <= maxEps);
  $: mTicks = ms.filter((m) => [2, 4, 8, 16, 30].includes(m));
</script>

<div class="cell" style="width:{width}px">
  <div class="ptitle">{title}</div>
  <div class="psub" class:bad={allMissing}>{sub}</div>
  <svg viewBox="0 0 {width} {height}" {width} {height} aria-hidden="true">
    {#each epsTicks as t}
      <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={Y(t)} y2={Y(t)} />
      <text class="tick" x={margin.left - 5} y={Y(t) + 3.2} text-anchor="end">{t}</text>
    {/each}
    <path class="band" class:missing={allMissing} d={bandPath} />
    <path class="ln merge" d={pathOf("merge")} />
    <path class="ln cohere" d={pathOf("cohere")} />
    {#each mTicks as t}
      <text class="tick" x={X(t)} y={height - 14} text-anchor="middle">{t}</text>
    {/each}
    <text class="axis-title" x={margin.left + plotW / 2} y={height - 3} text-anchor="middle">minPts</text>
    <text class="axis-title" transform="translate(9 {margin.top + plotH / 2}) rotate(-90)" text-anchor="middle">eps, m</text>
  </svg>
</div>

<style>
  /* A fixed width, because .ptitle is HTML and will happily make the cell as
     wide as the longest title, which pushes the whole row past its container
     with every check still green. */
  .cell { flex: 0 0 auto; max-width: 100%; }
  .ptitle {
    font-family: var(--font-main); font-size: 0.8rem; font-weight: 700;
    color: var(--squidink); line-height: 1.25;
  }
  .psub {
    font-family: var(--font-main); font-size: 0.72rem; color: #2f7d32;
    font-weight: 600; margin-bottom: 0.2rem; line-height: 1.3;
  }
  .psub.bad { color: #df2a5d; }
  svg { display: block; max-width: 100%; }
  .grid { stroke: #eef1f5; }
  .band { fill: rgba(47, 125, 50, 0.16); stroke: none; }
  .band.missing { fill: rgba(223, 42, 93, 0.14); }
  .ln { fill: none; stroke-width: 1.8; }
  .ln.merge { stroke: #df2a5d; }
  .ln.cohere { stroke: #2074d5; }
  .tick { font-family: var(--font-mono, monospace); font-size: 9px; fill: #9aa5b1; }
  .axis-title { font-family: var(--font-main); font-size: 9.5px; font-weight: 600; fill: #718096; }
</style>
