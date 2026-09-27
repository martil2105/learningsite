<script>
  /*
    The hierarchy, drawn in metres, with a cut line the reader drags.

    A branch is a cluster, and it runs from the eps at which it comes apart
    (bottom) to the eps at which it merges with its sibling (top). Cutting at a
    height gives you whatever branches that horizontal line crosses - which is
    DBSCAN, exactly, and is the whole of what DBSCAN can say.

    Whether the article's claim is true is now something to look at: on the
    second day the three branches you want do not overlap in height, so no
    horizontal line crosses all three.
  */
  import { epsOf } from "../experiments.js";
  import { INK, ACCENT, GOOD, BAD, NOISE, hue } from "../palette.js";

  export let tree;
  export let eps;
  export let yMax = 40;
  export let height = 300;
  export let onEps = () => {};
  export let marks = null;   // per-branch label, e.g. which stop dominates it

  let boxWidth = 320;
  $: BW = Math.max(260, boxWidth);
  $: margin = { top: 14, right: 12, bottom: 26, left: 42 };
  $: plotW = Math.max(120, BW - margin.left - margin.right);
  $: plotH = height - margin.top - margin.bottom;
  $: X = (slot) => margin.left + ((slot + 0.5) / Math.max(1, tree.slots)) * plotW;
  $: Y = (e) => margin.top + plotH - (Math.min(e, yMax) / yMax) * plotH;

  // Reactive, not const: each reads `tree` and the measured width.
  $: segs = tree.nodes.map((nd) => {
    const top = Math.min(epsOf(nd.birth), yMax);
    const bot = Math.min(epsOf(nd.death), yMax);
    return { id: nd.id, x: X(nd.x), top, bot, size: nd.size, node: nd };
  });
  $: joins = tree.nodes
    .filter((nd) => nd.children.length)
    .map((nd) => {
      const xs = nd.children.map((k) => X(tree.byId.get(k).x));
      return { y: Math.min(epsOf(tree.byId.get(nd.children[0]).birth), yMax), x1: Math.min(...xs), x2: Math.max(...xs) };
    });
  $: crossed = segs.filter((s) => eps > s.bot && eps <= s.top);
  $: crossedIds = new Set(crossed.map((s) => s.id));
  $: yTicks = Array.from({ length: 5 }, (_, i) => Math.round((yMax * i) / 4));
  $: widthOf = (n) => Math.max(1.4, Math.min(9, 1.4 + 9 * Math.sqrt(n / tree.cond.n)));

  let node;
  let dragging = false;
  function toEps(ev) {
    const rect = node.getBoundingClientRect();
    const s = rect.width / BW;                 // the viewBox may be scaling
    const py = (ev.clientY - rect.top) / s;
    const e = ((margin.top + plotH - py) / plotH) * yMax;
    return Math.min(yMax, Math.max(0.2, Math.round(e * 10) / 10));
  }
  function down(ev) { dragging = true; onEps(toEps(ev)); node.setPointerCapture(ev.pointerId); ev.preventDefault(); }
  function move(ev) { if (dragging) onEps(toEps(ev)); }
  function up(ev) { if (!dragging) return; dragging = false; if (node.hasPointerCapture(ev.pointerId)) node.releasePointerCapture(ev.pointerId); }
</script>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth} />
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    class="stage"
    role="application"
    tabindex="0"
    aria-label="The cluster hierarchy. Up and down arrows move the cut; hold shift for larger steps."
    on:keydown={(ev) => {
      const step = ev.shiftKey ? 1 : 0.1;
      if (ev.key === "ArrowUp") { onEps(Math.min(yMax, Math.round((eps + step) * 10) / 10)); ev.preventDefault(); }
      if (ev.key === "ArrowDown") { onEps(Math.max(0.2, Math.round((eps - step) * 10) / 10)); ev.preventDefault(); }
    }}
  >
    <svg
      bind:this={node}
      viewBox="0 0 {BW} {height}"
      width={BW}
      height={height}
      aria-hidden="true"
      on:pointerdown={down}
      on:pointermove={move}
      on:pointerup={up}
      on:pointercancel={up}
    >
      {#each yTicks as t}
        <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={Y(t)} y2={Y(t)} />
        <text class="tick" x={margin.left - 6} y={Y(t) + 3.2} text-anchor="end">{t}</text>
      {/each}

      {#each joins as j}
        <line class="join" x1={j.x1} x2={j.x2} y1={Y(j.y)} y2={Y(j.y)} />
      {/each}

      {#each segs as s}
        <line
          class="branch"
          class:on={crossedIds.has(s.id)}
          x1={s.x}
          x2={s.x}
          y1={Y(s.top)}
          y2={Y(s.bot)}
          stroke-width={widthOf(s.size)}
        />
      {/each}

      <!-- Which stop each branch is mostly made of, as a swatch rather than
           as text: an <svg><text> does not wrap, and "market street" under a
           branch near the edge would be clipped with no error and no
           overflow. The names are in the legend below, in HTML. -->
      {#if marks}
        {#each marks as mk}
          <rect
            class="mark"
            x={X(tree.byId.get(mk.id).x) - 4}
            y={Y(Math.min(epsOf(tree.byId.get(mk.id).death), yMax)) + 3}
            width="8"
            height="8"
            rx="1.5"
            fill={mk.colour}
          />
        {/each}
      {/if}

      <line class="cut" x1={margin.left - 6} x2={margin.left + plotW} y1={Y(eps)} y2={Y(eps)} />
      <circle class="cutgrip" cx={margin.left - 6} cy={Y(eps)} r="5" />
      {#each crossed as c}
        <circle class="hit" cx={c.x} cy={Y(eps)} r="3.4" />
      {/each}

      <text class="axis-title" transform="translate(10 {margin.top + plotH / 2}) rotate(-90)" text-anchor="middle">eps, metres</text>
    </svg>
  </div>
</div>

<style>
  .measure { width: 100%; height: 0; }
  .fig { width: 100%; }
  .stage { outline: none; }
  .stage:focus-visible { box-shadow: 0 0 0 2px var(--violet); border-radius: 6px; }
  svg { display: block; max-width: 100%; touch-action: none; cursor: ns-resize; }

  .grid { stroke: #eef1f5; }
  .join { stroke: #b6bfcc; stroke-width: 1.1; }
  .branch { stroke: #b6bfcc; stroke-linecap: butt; }
  .branch.on { stroke: #232f3e; }
  .cut { stroke: #7c5aed; stroke-width: 2; }
  .cutgrip { fill: #7c5aed; stroke: #fff; stroke-width: 1.5; }
  .hit { fill: #7c5aed; stroke: #fff; stroke-width: 1.3; }
  .mark { stroke: #ffffff; stroke-width: 1; }
  .tick { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }
  .axis-title { font-family: var(--font-main); font-size: 10.5px; font-weight: 600; fill: var(--squidink); }
</style>
