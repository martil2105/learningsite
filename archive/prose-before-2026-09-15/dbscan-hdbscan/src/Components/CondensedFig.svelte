<script>
  /*
    The condensed tree.

    Each cluster is a ribbon whose width is how many pings it still holds. It
    starts at its birth - the level where it split away from its sibling - and
    narrows as pings drop out of it, until either it splits again or it runs
    out. Selected clusters are filled.

    The point of the picture is where the fills START. They are not at one
    height, and they could not be: that is the whole difference between this
    and a horizontal line.
  */
  import { epsOf } from "../experiments.js";
  import { INK, ACCENT, NOISE, hue, wash } from "../palette.js";

  export let tree;
  export let yMax = 40;
  export let height = 330;
  export let showCuts = true;

  let boxWidth = 320;
  $: BW = Math.max(260, boxWidth);
  $: margin = { top: 14, right: 14, bottom: 24, left: 42 };
  $: plotW = Math.max(120, BW - margin.left - margin.right);
  $: plotH = height - margin.top - margin.bottom;
  $: slotW = plotW / Math.max(1, tree.slots);
  $: X = (slot) => margin.left + (slot + 0.5) * slotW;
  $: Y = (e) => margin.top + plotH - (Math.min(Math.max(e, 0), yMax) / yMax) * plotH;
  $: maxSize = Math.max(...tree.nodes.map((n) => n.size));
  $: halfW = (n) => Math.max(0.7, (Math.sqrt(n / maxSize) * slotW * 0.44));

  /* The ribbon: sample the level between birth and death and read off how many
     pings are still inside. Reactive, not const - it reads the measured width
     through X and Y. */
  $: ribbon = (nd) => {
    const top = Math.min(epsOf(nd.birth), yMax);
    const bot = Math.max(Math.min(epsOf(nd.death), yMax), 0.05);
    const steps = 26;
    const left = [];
    const right = [];
    for (let i = 0; i <= steps; i++) {
      const e = top + ((bot - top) * i) / steps;
      const lam = e > 0 ? 1 / e : Infinity;
      const n = Math.max(0, tree.remaining(nd, lam));
      const w = halfW(n);
      const y = Y(e);
      left.push([X(nd.x) - w, y]);
      right.push([X(nd.x) + w, y]);
    }
    const pts = left.concat(right.reverse());
    return pts.map((p, i) => (i ? "L " : "M ") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ") + " Z";
  };

  $: joins = tree.nodes
    .filter((nd) => nd.children.length)
    .map((nd) => {
      const xs = nd.children.map((k) => X(tree.byId.get(k).x));
      return { y: Y(Math.min(epsOf(tree.byId.get(nd.children[0]).birth), yMax)), x1: Math.min(...xs), x2: Math.max(...xs) };
    });
  /* Coloured by the cluster's position in tree.clusterIds, which is the same
     order labelsFromSelection numbered the labels in - so a ribbon here and a
     region on the map beside it are the same colour for the same cluster. */
  $: picked = tree.nodes.filter((nd) => nd.selected).sort((a, b) => a.id - b.id);
  $: idxOf = (nd) => tree.clusterIds.indexOf(nd.id);
  $: colourOf = (nd) => hue(idxOf(nd));
  $: yTicks = Array.from({ length: 5 }, (_, i) => Math.round((yMax * i) / 4));
</script>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth} />
  <svg viewBox="0 0 {BW} {height}" width={BW} height={height} aria-hidden="true">
    {#each yTicks as t}
      <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={Y(t)} y2={Y(t)} />
      <text class="tick" x={margin.left - 6} y={Y(t) + 3.2} text-anchor="end">{t}</text>
    {/each}

    {#each joins as j}
      <line class="join" x1={j.x1} x2={j.x2} y1={j.y} y2={j.y} />
    {/each}

    {#each tree.nodes as nd}
      <path
        class="rib"
        class:sel={nd.selected}
        d={ribbon(nd)}
        fill={nd.selected ? wash(idxOf(nd)) : "#dfe4ea"}
        stroke={nd.selected ? colourOf(nd) : "#c3cbd5"}
      />
    {/each}

    {#if showCuts}
      {#each picked as nd}
        <line
          class="cut"
          x1={X(nd.x) - Math.max(6, halfW(nd.size) * 1.5)}
          x2={X(nd.x) + Math.max(6, halfW(nd.size) * 1.5)}
          y1={Y(Math.min(epsOf(nd.birth), yMax))}
          y2={Y(Math.min(epsOf(nd.birth), yMax))}
          stroke={colourOf(nd)}
        />
      {/each}
    {/if}

    <text class="axis-title" transform="translate(10 {margin.top + plotH / 2}) rotate(-90)" text-anchor="middle">eps, metres</text>
  </svg>
</div>

<style>
  .measure { width: 100%; height: 0; }
  .fig { width: 100%; }
  svg { display: block; max-width: 100%; }
  .grid { stroke: #eef1f5; }
  .join { stroke: #b6bfcc; stroke-width: 1.1; }
  .rib { stroke-width: 1; }
  .rib.sel { stroke-width: 1.6; }
  .cut { stroke-width: 3; stroke-linecap: round; }
  .tick { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }
  .axis-title { font-family: var(--font-main); font-size: 10.5px; font-weight: 600; fill: var(--squidink); }
</style>
