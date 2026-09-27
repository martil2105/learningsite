<script>
  /*
    The map, shared by every figure that draws pings on the ground.

    A cluster is drawn as a REGION rather than as a colour on the points,
    because a region is what DBSCAN actually computes: the set of places you
    can reach without leaving some core point's eps-ball. Two clusters are then
    told apart by being two shapes with two outlines, which is a great deal
    more signal than two hues on a 2px dot - and it keeps the palette inside
    the house ceiling of three categorical colours no matter how many clusters
    the reader's eps produces.

    Equal aspect, always. Every claim on this page is about distance, and both
    axes are already metres, so a stretched axis would be showing a geometry
    the algorithm is not using.
  */
  import { fitEqual } from "../plot.js";
  import { EXTENT, MAP_TICKS, MAP_TICKS_Y, tickLabel, regionPaths } from "../experiments.js";
  import { INK, NOISE, GRID, TICK, hue, wash, ACCENT, HANDLE, LABEL } from "../palette.js";

  export let pts;
  export let labels = null;      // cluster id per point, -1 for noise
  export let core = null;        // core distances, needed to draw regions
  export let eps = null;         // null draws no regions
  export let roles = null;       // "core" | "border" | "noise", for the mechanism figure
  export let edges = null;       // [{a, b}] - tree edges to draw under the points
  export let rings = null;       // point indices to circle
  export let discs = null;       // point indices to draw a single eps-disc around
  /* Each listed ping's OWN core distance, drawn as a circle. This is the core
     distance made visible: tiny where the phone sat still, enormous along a
     route walked once. A sample rather than all of them - five hundred
     overlapping circles is a fog, not a figure. */
  export let coreFor = null;
  export let maxHeight = 380;
  export let minHeight = 200;
  export let dim = false;        // draw everything at low emphasis
  /* Where there is no eps there are no regions to carry cluster identity, so
     the points have to. Used by the condensed-tree figure, whose whole point
     is that HDBSCAN's answer is not a single radius. */
  export let colourByCluster = false;
  export let dotR = 2.1;
  /* A figure may bring its own window - the walkthrough works on a patch of
     seventy metres rather than the whole map. Its data is generated inside
     that window, so nothing needs clipping. */
  export let ext = EXTENT;
  export let ticks = null;
  export let ticksY = null;
  export let xTitle = "metres east";
  export let yTitle = "metres north";

  let boxWidth = 320;                     // the bind target, and only that
  $: BW = Math.max(260, boxWidth);        // what every scale and layout uses
  $: margin = { top: 8, right: 8, bottom: 26, left: BW < 420 ? 30 : 34 };
  $: plotW = Math.max(140, BW - margin.left - margin.right);
  $: H = Math.min(maxHeight + margin.top + margin.bottom,
                  Math.max(minHeight, (plotW * (ext.y1 - ext.y0)) / (ext.x1 - ext.x0)) + margin.top + margin.bottom);
  $: plot = fitEqual(ext, BW, H, margin);
  $: TX = ticks || MAP_TICKS;
  $: TY = ticksY || MAP_TICKS_Y;

  // Reactive, not const: every one of these reads `plot`, which moves with the
  // measured width, and a const helper is invisible to Svelte's dirty tracking.
  $: X = (p) => plot.X(p[0]);
  $: Y = (p) => plot.Y(p[1]);
  $: regions = eps != null && labels && core ? regionPaths(pts, core, labels, eps, plot, { ext }) : [];
  $: ringSet = rings ? new Set(rings) : null;
  $: discR = eps != null ? plot.len(eps) : 0;

  const ROLE_FILL = { core: INK, border: HANDLE, noise: NOISE };
</script>

<div class="wrap">
  <div class="measure" bind:clientWidth={boxWidth} />
  <svg viewBox="0 0 {BW} {H}" width={BW} height={H} class:dim aria-hidden="true">
    <!-- The first and last labels are anchored inward. A centred "300 m" on the
         right edge of the plot box hangs about seven pixels past the svg, which
         the outer svg clips so it looks fine and still widens the document. -->
    {#each TX as t, i}
      <line class="grid" x1={plot.X(t)} x2={plot.X(t)} y1={plot.box.y} y2={plot.box.y + plot.box.h} />
      <text
        class="tick"
        x={plot.X(t)}
        y={plot.box.y + plot.box.h + 14}
        text-anchor={i === 0 ? "start" : i === TX.length - 1 ? "end" : "middle"}>{tickLabel(t)}</text>
    {/each}
    {#each TY as t}
      <line class="grid" x1={plot.box.x} x2={plot.box.x + plot.box.w} y1={plot.Y(t)} y2={plot.Y(t)} />
      <text class="tick" x={plot.box.x - 5} y={plot.Y(t) + 3.5} text-anchor="end">{t}</text>
    {/each}

    <!-- the clusters, as the regions they are -->
    {#each regions as r}
      <path class="region" d={r.d} fill={wash(r.cluster)} stroke={hue(r.cluster)} fill-rule="nonzero" stroke-linejoin="round" />
    {/each}

    <!-- one point's own eps-ball, for the walkthrough -->
    {#if coreFor && core}
      {#each coreFor as i}
        <circle class="corecirc" cx={X(pts[i])} cy={Y(pts[i])} r={plot.len(core[i])} fill="none" stroke={ACCENT} />
      {/each}
    {/if}

    {#if discs}
      {#each discs as i}
        <circle class="disc" cx={X(pts[i])} cy={Y(pts[i])} r={discR} fill="none" stroke={ACCENT} />
      {/each}
    {/if}

    {#if edges}
      {#each edges as e}
        <line class="edge" x1={X(pts[e.a])} y1={Y(pts[e.a])} x2={X(pts[e.b])} y2={Y(pts[e.b])} stroke={INK} />
      {/each}
    {/if}

    {#each pts as p, i}
      <circle
        class="ping"
        class:noise={roles ? roles[i] === "noise" : labels && labels[i] < 0}
        cx={X(p)}
        cy={Y(p)}
        r={roles ? (roles[i] === "core" ? dotR + 0.5 : dotR) : labels && labels[i] < 0 ? dotR - 0.4 : dotR}
        fill={roles ? ROLE_FILL[roles[i]] : !labels || labels[i] < 0 ? (labels ? NOISE : INK) : colourByCluster ? hue(labels[i]) : INK}
      />
    {/each}

    {#if ringSet}
      {#each pts as p, i}
        {#if ringSet.has(i)}
          <circle class="ring" cx={X(p)} cy={Y(p)} r={dotR + 3.6} fill="none" stroke={HANDLE} />
        {/if}
      {/each}
    {/if}

    <text class="axis-title" x={plot.box.x + plot.box.w / 2} y={H - 3} text-anchor="middle">{xTitle}</text>
    <text class="axis-title" transform="translate(9 {plot.box.y + plot.box.h / 2}) rotate(-90)" text-anchor="middle">{yTitle}</text>
  </svg>
</div>

<style>
  .measure { width: 100%; height: 0; }
  .wrap { width: 100%; }

  svg { max-width: 100%; display: block; touch-action: none; }
  svg.dim { opacity: 0.55; }

  .grid { stroke: #eef1f5; }
  .region { stroke-width: 1.1; }
  .disc { stroke-width: 1.4; stroke-dasharray: 3 3; opacity: 0.9; }
  .corecirc { stroke-width: 1; opacity: 0.45; }
  .edge { stroke-width: 0.7; opacity: 0.32; }
  .ping { opacity: 0.92; }
  .ping.noise { opacity: 0.62; }
  .ring { stroke-width: 1.8; }

  .tick { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }
  .axis-title { font-family: var(--font-main); font-size: 10.5px; font-weight: 600; fill: var(--squidink); }
</style>
