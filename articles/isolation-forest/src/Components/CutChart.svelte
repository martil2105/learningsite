<script>
  /*
    A single reusable frame: the accounts, an optional score surface behind
    them, the cuts made so far, the box the highlighted point still lives in.
    Both scrollytelling sections draw through this.
  */
  import { scaleLinear } from "d3-scale";
  import { BOUNDS, AXIS } from "../datasets.js";
  import { SERIES, PROBE, ACCENT, rampColor } from "../palette.js";

  export let points = [];
  export let probe = null;
  export let cuts = [];
  export let region = null;
  export let sampleIds = null; // Set of ids in this tree's sample, or null
  export let heat = null; // { cells, nx, ny, min, max }
  export let bounds = BOUNDS;
  export let showAxisLabels = true;

  let boxWidth = 0;
  let boxHeight = 0;

  $: narrow = boxWidth > 0 && boxWidth < 520;
  $: margin = {
    top: 16,
    right: 16,
    bottom: showAxisLabels ? 44 : 26,
    left: narrow ? 42 : 58,
  };

  $: width = boxWidth;
  $: height = Math.max(220, boxHeight);

  $: xScale = scaleLinear()
    .domain([bounds.x0, bounds.x1])
    .range([margin.left, Math.max(margin.left + 10, width - margin.right)]);
  $: yScale = scaleLinear()
    .domain([bounds.y0, bounds.y1])
    .range([height - margin.bottom, margin.top]);

  const xTicks = [0, 10000, 20000, 30000, 40000, 50000];
  const yTicks = [0, 20, 40, 60];
  const tickLabel = (v) => (v === 0 ? "0" : `${v / 1000}k`);

  const inSample = (p) => !sampleIds || sampleIds.has(p.id);

  $: heatCells = heat
    ? Array.from({ length: heat.nx * heat.ny }, (_, k) => {
        const i = k % heat.nx;
        const j = Math.floor(k / heat.nx);
        const t = (heat.cells[k] - heat.min) / Math.max(1e-9, heat.max - heat.min);
        return {
          k,
          x: xScale(bounds.x0 + (i / heat.nx) * (bounds.x1 - bounds.x0)),
          y: yScale(bounds.y0 + ((j + 1) / heat.ny) * (bounds.y1 - bounds.y0)),
          w: (xScale(bounds.x1) - xScale(bounds.x0)) / heat.nx + 0.7,
          h: (yScale(bounds.y0) - yScale(bounds.y1)) / heat.ny + 0.7,
          fill: rampColor(t),
        };
      })
    : [];
</script>

<div class="frame" bind:offsetWidth={boxWidth} bind:offsetHeight={boxHeight}>
  {#if width > 0}
    <svg {width} {height}>
      {#if heat}
        {#each heatCells as c (c.k)}
          <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.fill} />
        {/each}
      {:else}
        {#each yTicks as t}
          <line
            class="grid"
            x1={margin.left}
            x2={width - margin.right}
            y1={yScale(t)}
            y2={yScale(t)}
          />
        {/each}
      {/if}

      {#if region}
        <rect
          class="region"
          x={xScale(region.x0)}
          y={yScale(region.y1)}
          width={Math.max(0, xScale(region.x1) - xScale(region.x0))}
          height={Math.max(0, yScale(region.y0) - yScale(region.y1))}
          fill={ACCENT}
          stroke={ACCENT}
        />
      {/if}

      {#each points as p (p.id)}
        <circle
          class="dot"
          class:faded={!inSample(p)}
          class:on-heat={!!heat}
          cx={xScale(p.x)}
          cy={yScale(p.y)}
          r={inSample(p) ? 4.5 : 3}
          fill={SERIES[p.kind]}
        />
      {/each}

      {#each cuts as cut, i}
        {#if cut.dim === 0}
          <line
            class="cut-halo"
            x1={xScale(cut.value)}
            x2={xScale(cut.value)}
            y1={yScale(cut.region.y1)}
            y2={yScale(cut.region.y0)}
          />
          <line
            class="cut"
            x1={xScale(cut.value)}
            x2={xScale(cut.value)}
            y1={yScale(cut.region.y1)}
            y2={yScale(cut.region.y0)}
            opacity={0.35 + 0.65 * ((i + 1) / Math.max(1, cuts.length))}
          />
        {:else}
          <line
            class="cut-halo"
            y1={yScale(cut.value)}
            y2={yScale(cut.value)}
            x1={xScale(cut.region.x0)}
            x2={xScale(cut.region.x1)}
          />
          <line
            class="cut"
            y1={yScale(cut.value)}
            y2={yScale(cut.value)}
            x1={xScale(cut.region.x0)}
            x2={xScale(cut.region.x1)}
            opacity={0.35 + 0.65 * ((i + 1) / Math.max(1, cuts.length))}
          />
        {/if}
      {/each}

      {#if probe}
        <circle class="probe-ring" cx={xScale(probe.x)} cy={yScale(probe.y)} r="11" />
        <circle
          class="probe-dot"
          cx={xScale(probe.x)}
          cy={yScale(probe.y)}
          r="7.5"
          fill={PROBE}
        />
      {/if}

      <line
        class="axis-line"
        x1={margin.left}
        x2={width - margin.right}
        y1={height - margin.bottom}
        y2={height - margin.bottom}
      />
      <line
        class="axis-line"
        x1={margin.left}
        x2={margin.left}
        y1={margin.top}
        y2={height - margin.bottom}
      />
      {#each xTicks as t}
        <text class="tick" x={xScale(t)} y={height - margin.bottom + 17} text-anchor="middle"
          >{tickLabel(t)}</text
        >
      {/each}
      {#each yTicks as t}
        <text
          class="tick"
          x={margin.left - 7}
          y={yScale(t)}
          text-anchor="end"
          dominant-baseline="middle">{t}</text
        >
      {/each}
      {#if showAxisLabels}
        <text
          class="axis-label"
          x={(width + margin.left) / 2}
          y={height - 6}
          text-anchor="middle">{AXIS.x}</text
        >
        <text
          class="axis-label"
          transform="rotate(-90)"
          x={-(height - margin.bottom + margin.top) / 2}
          y={13}
          text-anchor="middle">{AXIS.y}</text
        >
      {/if}
    </svg>
  {/if}
</div>

<style>
  .frame {
    width: 100%;
    height: 100%;
    position: relative;
  }

  svg {
    display: block;
  }

  .grid {
    stroke: var(--squidink);
    stroke-width: 1;
    opacity: 0.08;
  }

  .axis-line {
    stroke: var(--squidink);
    stroke-width: 1.5;
    opacity: 0.55;
  }

  .tick {
    font-size: 0.78rem;
    fill: var(--squidink);
    opacity: 0.7;
    font-family: var(--font-main);
  }

  .axis-label {
    font-size: 0.8rem;
    fill: var(--squidink);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: var(--font-main);
  }

  .region {
    fill-opacity: 0.12;
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
    stroke-opacity: 0.8;
  }

  .dot {
    stroke: #f1f3f3;
    stroke-width: 1.5;
  }

  .dot.faded {
    opacity: 0.3;
    stroke-width: 1;
  }

  .dot.on-heat {
    stroke: #f1f3f3;
    stroke-width: 1.6;
  }

  .cut-halo {
    stroke: #f1f3f3;
    stroke-width: 6;
    stroke-linecap: round;
  }

  .cut {
    stroke: var(--squidink);
    stroke-width: 2;
    stroke-linecap: round;
  }

  .probe-ring {
    fill: #f1f3f3;
    stroke: #f1f3f3;
    stroke-width: 2;
  }

  .probe-dot {
    stroke: var(--squidink);
    stroke-width: 2.5;
  }
</style>
