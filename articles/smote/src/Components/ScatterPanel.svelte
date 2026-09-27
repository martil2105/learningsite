<script>
  /*
    The shared picture: amount against time of day, equal scale on both axes,
    with any of the layers this article needs switched on.

    Equal scale is not a preference here. Every claim on the page is about which
    points are near which other points - k nearest neighbours, segments between
    them, a decision boundary. Stretch one axis against the other and the chart
    is quietly showing a geometry the algorithm is not using.
  */
  import { EXTENT, AMOUNT_TICKS, HOUR_TICKS, smote, normalTerritory } from "../experiments.js";
  import { fitEqual } from "../plot.js";
  import { mulberry32 } from "../rng.js";
  import { LEGIT, FRAUD, SYNTH, INK, FRAUD_WASH, FRAUD_EDGE } from "../palette.js";

  export let sc;
  export let k = 5;
  export let showSegments = false;
  export let showChildren = false;
  export let nChildren = 700;
  export let showHull = false;
  export let showTerritory = true;
  export let showMajority = true;
  export let boundaries = [];
  export let maxHeight = 400;
  export let seed = 91;

  let boxWidth = 320; // the bind target, and only that
  $: BW = Math.max(260, boxWidth); // what every scale and layout uses
  $: narrow = BW < 520;
  $: margin = { top: 8, right: 10, bottom: 30, left: narrow ? 38 : 44 };
  $: plotW = Math.max(150, BW - margin.left - margin.right);
  $: plotH = Math.min(maxHeight, Math.max(210, plotW / 1.196));
  $: H = plotH + margin.top + margin.bottom;
  $: plot = fitEqual(EXTENT, BW, H, margin);

  // All reactive: every one reads `plot`.
  $: X = (p) => plot.X(p[0]);
  $: Y = (p) => plot.Y(p[1]);
  $: ring = (rings) =>
    rings
      .map((r) => r.map((p, i) => (i ? "L" : "M") + " " + plot.X(p[0]).toFixed(2) + " " + plot.Y(p[1]).toFixed(2)).join(" ") + " Z")
      .join(" ");
  $: open = (lines) =>
    lines
      .map((r) => r.map((p, i) => (i ? "L" : "M") + " " + plot.X(p[0]).toFixed(2) + " " + plot.Y(p[1]).toFixed(2)).join(" "))
      .join(" ");

  $: nbrs = showSegments || showChildren ? sc.pre.sweep && kNbrs(sc.minority, k) : null;
  function kNbrs(points, kk) {
    // Local import-free copy of the neighbour table, so the panel does not need
    // to know about the sweep's caching.
    const n = points.length;
    const K = Math.max(1, Math.min(kk, n - 1));
    const out = [];
    for (let i = 0; i < n; i++) {
      const order = [];
      for (let j = 0; j < n; j++)
        if (j !== i) order.push([(points[i][0] - points[j][0]) ** 2 + (points[i][1] - points[j][1]) ** 2, j]);
      order.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      out.push(order.slice(0, K).map((e) => e[1]));
    }
    return out;
  }

  $: kids = showChildren
    ? smote(sc.minority, k, nChildren, mulberry32(seed)).map((c) => ({ p: c.p, bad: normalTerritory(c.p, sc) }))
    : [];
  $: badKids = kids.filter((c) => c.bad).length;
  export let onStats = null;
  $: if (onStats) onStats({ bad: badKids, total: kids.length });
</script>

<div class="panel">
  <div class="measure" bind:clientWidth={boxWidth} />
  <svg viewBox="0 0 {BW} {H}" width={BW} height={H} aria-label="transactions by amount and time of day">
    {#if showTerritory}
      <path class="wash" d={ring(sc.territory)} fill={FRAUD_WASH} stroke={FRAUD_EDGE} />
    {/if}

    {#each AMOUNT_TICKS as t}
      <line class="grid" x1={plot.X(t.v)} x2={plot.X(t.v)} y1={plot.box.y} y2={plot.box.y + plot.box.h} />
      <text class="tick" x={plot.X(t.v)} y={plot.box.y + plot.box.h + 14} text-anchor="middle">{t.t}</text>
    {/each}
    {#each HOUR_TICKS as t}
      <line class="grid" x1={plot.box.x} x2={plot.box.x + plot.box.w} y1={plot.Y(t.v)} y2={plot.Y(t.v)} />
      <text class="tick" x={plot.box.x - 5} y={plot.Y(t.v) + 3.5} text-anchor="end">{t.t}</text>
    {/each}

    {#if showMajority}
      {#each sc.majority as p}
        <circle cx={X(p)} cy={Y(p)} r="1.6" fill={LEGIT} opacity="0.45" />
      {/each}
    {/if}

    {#if showHull}
      <path class="hull" d={ring([sc.hull])} />
    {/if}

    {#if showSegments && nbrs}
      {#each sc.minority as a, i}
        {#each nbrs[i] as j}
          <line class="seg" x1={X(a)} y1={Y(a)} x2={X(sc.minority[j])} y2={Y(sc.minority[j])} stroke={INK} />
        {/each}
      {/each}
    {/if}

    {#each kids as c}
      <circle cx={X(c.p)} cy={Y(c.p)} r={c.bad ? 2.6 : 2} fill={SYNTH} stroke={c.bad ? INK : "none"} stroke-width={c.bad ? 1.1 : 0} opacity="0.82" />
    {/each}

    {#each boundaries as b}
      <path class="bnd" d={open(b.rings)} stroke={b.color} stroke-dasharray={b.dash || "none"} />
    {/each}

    {#each sc.minority as p}
      <circle class="fraud" cx={X(p)} cy={Y(p)} r="3.4" fill={FRAUD} />
    {/each}

    <text class="axis-title" x={plot.box.x + plot.box.w / 2} y={H - 3} text-anchor="middle">transaction amount</text>
    <text
      class="axis-title"
      transform="translate(10 {plot.box.y + plot.box.h / 2}) rotate(-90)"
      text-anchor="middle">time of day</text>
  </svg>
</div>

<style>
  .measure { width: 100%; height: 0; }
  .panel { width: 100%; }
  svg { max-width: 100%; display: block; }
  .grid { stroke: #eef1f5; }
  .wash { stroke-width: 1; fill-rule: evenodd; }
  .seg { stroke-width: 0.9; opacity: 0.22; }
  .hull { fill: none; stroke: #232f3e; stroke-width: 1.2; stroke-dasharray: 5 4; opacity: 0.55; }
  .bnd { fill: none; stroke-width: 2.1; stroke-linejoin: round; }
  .fraud { stroke: #ffffff; stroke-width: 1.1; }
  .tick { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }
  .axis-title { font-family: var(--font-main); font-size: 10.5px; font-weight: 600; fill: var(--squidink); }
</style>
