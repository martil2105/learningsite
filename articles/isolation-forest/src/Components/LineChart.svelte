<script>
  /*
    The hook: drag one account around the plane and watch a single isolation
    tree cut the space until that account is the only thing left in its box.
  */
  import { onDestroy } from "svelte";
  import { select } from "d3-selection";
  import { drag } from "d3-drag";
  import { scaleLinear } from "d3-scale";

  import { accounts, BOUNDS, AXIS, mulberry32 } from "../datasets.js";
  import { isolationPath, makeStream, scorePoint } from "../isolation.js";
  import { FOREST, N_TREES, PSI, statsById } from "../forest.js";
  import { INK, SURFACE, ACCENT, PROBE, SERIES } from "../palette.js";

  let chartWidth = 0;
  let svgNode;
  let probeNode;

  $: narrow = chartWidth > 0 && chartWidth < 620;
  $: height = Math.max(300, Math.min(500, chartWidth * (narrow ? 0.92 : 0.62)));
  $: margin = {
    top: 22,
    right: narrow ? 14 : 24,
    bottom: 46,
    left: narrow ? 46 : 62,
  };

  $: xScale = scaleLinear()
    .domain([BOUNDS.x0, BOUNDS.x1])
    .range([margin.left, Math.max(margin.left + 10, chartWidth - margin.right)]);
  $: yScale = scaleLinear()
    .domain([BOUNDS.y0, BOUNDS.y1])
    .range([height - margin.bottom, margin.top]);

  // --- the tree on screen -------------------------------------------------
  let treeSeed = 0;

  // Each tree sees a random subsample of the accounts, never all of them.
  $: sampleIds = (() => {
    const rng = mulberry32(1009 + treeSeed * 131);
    const idx = accounts.map((_, i) => i);
    for (let k = 0; k < PSI; k++) {
      const j = k + Math.floor(rng() * (idx.length - k));
      const t = idx[k];
      idx[k] = idx[j];
      idx[j] = t;
    }
    return new Set(idx.slice(0, PSI));
  })();
  $: sample = accounts.filter((p) => sampleIds.has(p.id));
  // A fixed stream of random draws: the cuts then move with the point instead
  // of reshuffling every time it twitches.
  $: stream = makeStream(mulberry32(4211 + treeSeed * 977), 64);

  const clampProbe = (x, y) => ({
    x: Math.min(BOUNDS.x1, Math.max(BOUNDS.x0, x)),
    y: Math.min(BOUNDS.y1, Math.max(BOUNDS.y0, y)),
  });

  let probe = { x: 30500, y: 44 };

  $: path = isolationPath(probe, sample, BOUNDS, stream);
  $: stats = scorePoint(probe, FOREST);
  $: cuts = path.cuts.slice(0, reveal);
  $: shownRegion = cuts.length === path.cuts.length ? path.region : cutRegion(cuts);

  function cutRegion(cs) {
    if (!cs.length) return BOUNDS;
    const last = cs[cs.length - 1];
    const r = { ...last.region };
    const key = last.dim === 0 ? "x" : "y";
    const below = probe[key] < last.value;
    if (last.dim === 0) {
      if (below) r.x1 = last.value;
      else r.x0 = last.value;
    } else if (below) r.y1 = last.value;
    else r.y0 = last.value;
    return r;
  }

  // --- revealing the cuts one at a time -----------------------------------
  let reveal = 0;
  let timer;

  function replay() {
    clearInterval(timer);
    reveal = 0;
    timer = setInterval(() => {
      reveal += 1;
      if (reveal >= path.cuts.length) {
        reveal = path.cuts.length;
        clearInterval(timer);
      }
    }, 190);
  }

  function showAll() {
    clearInterval(timer);
    reveal = path.cuts.length;
  }

  function newTree() {
    treeSeed += 1;
    hovered = null;
    setTimeout(replay, 0);
  }

  let dragAttached = false;

  function attachDrag(node) {
    select(node).call(
      drag()
        .container(() => svgNode)
        .on("start", () => {
          dragging = true;
          showAll();
        })
        .on("drag", (event) => {
          probe = clampProbe(xScale.invert(event.x), yScale.invert(event.y));
          moved = true;
          reveal = Infinity;
        })
        .on("end", () => {
          dragging = false;
          showAll();
        })
    );
  }

  // The <svg> is inside an {#if} that waits for the container to be measured,
  // so neither node exists on mount.
  $: if (probeNode && svgNode && !dragAttached) {
    dragAttached = true;
    attachDrag(probeNode);
    replay();
  }

  onDestroy(() => clearInterval(timer));

  let dragging = false;
  let moved = false;
  let hovered = null;
  let showTable = false;

  function nudge(event) {
    const stepX = (BOUNDS.x1 - BOUNDS.x0) / 40;
    const stepY = (BOUNDS.y1 - BOUNDS.y0) / 40;
    const moves = {
      ArrowLeft: [-stepX, 0],
      ArrowRight: [stepX, 0],
      ArrowUp: [0, stepY],
      ArrowDown: [0, -stepY],
    };
    const m = moves[event.key];
    if (!m) return;
    event.preventDefault();
    probe = clampProbe(probe.x + m[0], probe.y + m[1]);
    moved = true;
    showAll();
  }

  // --- formatting ---------------------------------------------------------
  const kr = (v) => Math.round(v).toLocaleString("en-US").replace(/,/g, " ");
  const xTicks = [0, 10000, 20000, 30000, 40000, 50000];
  const yTicks = [0, 10, 20, 30, 40, 50, 60];
  const tickLabel = (v) => (v === 0 ? "0" : `${v / 1000}k`);

  $: verdict =
    stats.score > 0.68
      ? "easy to isolate — this looks anomalous"
      : stats.score > 0.52
      ? "somewhere in between"
      : "hard to isolate — this looks ordinary";

  $: topEight = [...accounts]
    .map((p) => statsById.get(p.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
</script>

<h1 class="body-header">Drag a point, count the cuts</h1>
<p class="body-text">
  Below are the accounts again, but this time one of them is
  <span class="bold" style="color: {PROBE}">yours to move</span>. Every time you
  let go of it, a fresh isolation tree grows around it, picking a random feature
  and a random split between the smallest and largest values left in the box,
  over and over, until nothing else shares the box with your point.
</p>
<p class="body-text">
  If you drop it in one of the empty corners, it's separated from the crowd in
  two or three cuts. If you drop it in the middle of a habit, the algorithm has
  to keep slicing. That number of cuts is the whole signal, and there's nothing
  more elaborate to it.
</p>

<div class="chart-shell">
  <div class="legend">
    <span class="legend-item">
      <span class="swatch" style="background: {SERIES.normal}" />One of the two
      ordinary habits
    </span>
    <span class="legend-item">
      <span class="swatch" style="background: {SERIES.anomaly}" />Planted oddity
    </span>
    <span class="legend-item">
      <span class="swatch probe-swatch" style="background: {PROBE}" />Your point
    </span>
    <span class="legend-item muted">Faded = not in this tree's sample</span>
  </div>

  <div class="chart-frame" bind:offsetWidth={chartWidth}>
    {#if chartWidth > 0}
      <svg
        bind:this={svgNode}
        width={chartWidth}
        {height}
        role="img"
        aria-label="Scatter plot of accounts by transfer size and transfers per week, with the random splits that isolate the point you drag"
      >
        <!-- gridlines -->
        {#each yTicks as t}
          <line
            class="grid"
            x1={margin.left}
            x2={chartWidth - margin.right}
            y1={yScale(t)}
            y2={yScale(t)}
          />
        {/each}
        {#each xTicks as t}
          <line
            class="grid"
            y1={margin.top}
            y2={height - margin.bottom}
            x1={xScale(t)}
            x2={xScale(t)}
          />
        {/each}

        <!-- the box the point currently lives in -->
        <rect
          class="region"
          x={xScale(shownRegion.x0)}
          y={yScale(shownRegion.y1)}
          width={Math.max(0, xScale(shownRegion.x1) - xScale(shownRegion.x0))}
          height={Math.max(0, yScale(shownRegion.y0) - yScale(shownRegion.y1))}
          fill={ACCENT}
          stroke={ACCENT}
        />

        <!-- points not in this tree's sample -->
        {#each accounts as p (p.id)}
          {#if !sampleIds.has(p.id)}
            <circle
              class="dot faded"
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r="3"
              fill={SERIES[p.kind]}
            />
          {/if}
        {/each}

        <!-- the 64 accounts this tree actually sees -->
        {#each accounts as p (p.id)}
          {#if sampleIds.has(p.id)}
            <circle
              class="dot"
              class:lit={hovered && hovered.id === p.id}
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r={hovered && hovered.id === p.id ? 6.5 : 4.5}
              fill={SERIES[p.kind]}
              on:mouseenter={() => (hovered = p)}
              on:mouseleave={() => (hovered = null)}
            />
          {/if}
        {/each}

        <!-- the cuts, oldest faintest -->
        {#each cuts as cut, i}
          {@const o = 0.35 + 0.65 * ((i + 1) / Math.max(1, cuts.length))}
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
              opacity={o}
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
              opacity={o}
            />
          {/if}
        {/each}

        <!-- axes -->
        <line
          class="axis-line"
          x1={margin.left}
          x2={chartWidth - margin.right}
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
          <text class="tick" x={xScale(t)} y={height - margin.bottom + 18} text-anchor="middle"
            >{tickLabel(t)}</text
          >
        {/each}
        {#each yTicks as t}
          <text class="tick" x={margin.left - 8} y={yScale(t)} text-anchor="end" dominant-baseline="middle"
            >{t}</text
          >
        {/each}
        <text class="axis-label" x={(chartWidth + margin.left) / 2} y={height - 8} text-anchor="middle"
          >{AXIS.x}</text
        >
        <text
          class="axis-label"
          transform="rotate(-90)"
          x={-(height - margin.bottom + margin.top) / 2}
          y={14}
          text-anchor="middle">{AXIS.y}</text
        >

        <!-- the draggable point -->
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <g
          bind:this={probeNode}
          class="probe"
          class:dragging
          transform="translate({xScale(probe.x)}, {yScale(probe.y)})"
          tabindex="0"
          role="application"
          aria-label="Draggable account at {kr(probe.x)} kroner and {probe.y.toFixed(
            0
          )} transfers per week. Anomaly score {stats.score.toFixed(
            2
          )}. Use the arrow keys to move it."
          on:keydown={nudge}
        >
          <circle class="probe-ring" r="11" />
          <circle class="probe-dot" r="7.5" fill={PROBE} />
        </g>
        {#if !dragging && !moved}
          <text
            class="probe-label"
            x={xScale(probe.x)}
            y={yScale(probe.y) - 18}
            text-anchor="middle">drag me</text
          >
        {/if}
      </svg>

      {#if hovered}
        <div
          class="tip"
          style="left: {xScale(hovered.x)}px; top: {yScale(hovered.y) - 14}px"
        >
          <strong>{kr(hovered.x)} kr</strong> · {hovered.y.toFixed(1)} transfers/week
          <br />
          score {statsById.get(hovered.id).score.toFixed(2)} · {hovered.kind ===
          "anomaly"
            ? "planted oddity"
            : "ordinary habit"}
        </div>
      {/if}
    {/if}
  </div>

  <div class="readout">
    <div class="stat">
      <span class="stat-value">{path.cuts.length}</span>
      <span class="stat-label">cuts in this tree</span>
    </div>
    <div class="stat">
      <span class="stat-value">{stats.avgDepth.toFixed(1)}</span>
      <span class="stat-label">average over {N_TREES} trees</span>
    </div>
    <div class="stat wide">
      <span class="stat-value">{stats.score.toFixed(2)}</span>
      <span class="stat-label">anomaly score — {verdict}</span>
    </div>
  </div>

  <div class="controls">
    <button on:click={newTree}>Grow a new tree</button>
    <button on:click={() => { probe = { x: 1500, y: 9 }; moved = true; showAll(); }}
      >Put it in the crowd</button
    >
    <button on:click={() => { probe = { x: 44000, y: 3 }; moved = true; showAll(); }}
      >Put it in the corner</button
    >
    <button class="ghost" on:click={() => (showTable = !showTable)}
      >{showTable ? "Hide" : "Show"} the numbers</button
    >
  </div>

  {#if showTable}
    <div class="table-scroll">
    <table class="score-table">
      <caption
        >The eight highest-scoring accounts out of {accounts.length}. Remember
        that the algorithm was never told which accounts were planted.</caption
      >
      <thead>
        <tr>
          <th scope="col">Transfer</th>
          <th scope="col">Per week</th>
          <th scope="col">Avg. cuts</th>
          <th scope="col">Score</th>
          <th scope="col">Planted?</th>
        </tr>
      </thead>
      <tbody>
        {#each topEight as s}
          <tr>
            <td>{kr(s.point.x)} kr</td>
            <td>{s.point.y.toFixed(1)}</td>
            <td>{s.avgDepth.toFixed(2)}</td>
            <td>{s.score.toFixed(3)}</td>
            <td>{s.point.kind === "anomaly" ? "yes" : "no"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    </div>
  {/if}
</div>

<p class="body-text">
  There are two things worth noticing as you drag. The first is how little the
  algorithm knows. It never measures a distance, never fits a density and never
  sees the labels; it only asks how much slicing a point can survive. The second
  is that a single tree is noisy. If you press
  <span class="bold">grow a new tree</span> without moving the point, the count
  jumps around, while the score underneath it barely moves, because the score is
  an average over {N_TREES} trees. That gap between one tree and many is what
  we'll look at next.
</p>

<style>
  .chart-shell {
    max-width: 780px;
    margin: 1.5rem auto 0.5rem auto;
  }

  .chart-frame {
    position: relative;
    width: 100%;
  }

  svg {
    display: block;
    overflow: visible;
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
    font-size: 0.8rem;
    fill: var(--squidink);
    opacity: 0.7;
    font-family: var(--font-main);
  }

  .axis-label {
    font-size: 0.85rem;
    fill: var(--squidink);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: var(--font-main);
  }

  .region {
    fill-opacity: 0.1;
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
    stroke-opacity: 0.75;
    pointer-events: none;
  }

  .dot {
    stroke: #f1f3f3;
    stroke-width: 1.5;
    cursor: crosshair;
  }

  .dot.faded {
    opacity: 0.3;
    stroke-width: 1;
    pointer-events: none;
  }

  .dot.lit {
    stroke: var(--squidink);
    stroke-width: 2;
  }

  .cut-halo {
    stroke: #f1f3f3;
    stroke-width: 6;
    stroke-linecap: round;
    pointer-events: none;
  }

  .cut {
    stroke: var(--squidink);
    stroke-width: 2;
    stroke-linecap: round;
    pointer-events: none;
  }

  .probe {
    cursor: grab;
    touch-action: none;
  }

  .probe.dragging {
    cursor: grabbing;
  }

  .probe:focus {
    outline: none;
  }

  .probe:focus .probe-ring {
    stroke: var(--squidink);
    stroke-width: 2.5;
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

  .probe-label {
    font-size: 0.78rem;
    fill: var(--squidink);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: var(--font-main);
    opacity: 0.65;
    pointer-events: none;
  }

  .tip {
    position: absolute;
    transform: translate(-50%, -100%);
    background: var(--squidink);
    color: #f1f3f3;
    font-size: 0.78rem;
    line-height: 1.35;
    padding: 0.35rem 0.55rem;
    border-radius: 2px;
    pointer-events: none;
    white-space: nowrap;
    font-family: var(--font-main);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1.1rem;
    justify-content: center;
    font-size: 0.85rem;
    font-family: var(--font-main);
    color: var(--squidink);
    margin-bottom: 0.6rem;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
  }

  .legend-item.muted {
    opacity: 0.6;
  }

  .swatch {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 0.4rem;
  }

  .probe-swatch {
    border: 2px solid var(--squidink);
    width: 13px;
    height: 13px;
  }

  .readout {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin: 1rem auto 0.75rem auto;
  }

  .stat {
    border-top: 3px solid var(--squidink);
    padding: 0.4rem 0.9rem 0.2rem 0;
    min-width: 8rem;
  }

  .stat.wide {
    min-width: 14rem;
  }

  .stat-value {
    display: block;
    font-family: var(--font-heavy);
    font-size: 1.9rem;
    line-height: 1.1;
    color: var(--squidink);
  }

  .stat-label {
    display: block;
    font-size: 0.82rem;
    font-family: var(--font-main);
    color: var(--squidink);
    opacity: 0.75;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  button {
    font-family: var(--font-mono);
    font-size: 0.82rem;
    background: #f1f3f3;
    border: 2px solid var(--squidink);
    color: var(--squidink);
    padding: 0.4rem 0.7rem;
    cursor: pointer;
  }

  button:hover {
    background: var(--squidink);
    color: #f1f3f3;
  }

  button.ghost {
    border-style: dashed;
  }

  .table-scroll {
    overflow-x: auto;
  }

  .score-table {
    border-collapse: collapse;
    margin: 1rem auto;
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: var(--squidink);
  }

  .score-table caption {
    caption-side: bottom;
    padding-top: 0.6rem;
    opacity: 0.75;
    max-width: 30rem;
    margin: 0 auto;
    text-align: left;
  }

  .score-table th,
  .score-table td {
    border-bottom: 1px solid rgba(35, 47, 62, 0.18);
    padding: 0.3rem 0.7rem;
    text-align: right;
  }

  .score-table th {
    font-family: var(--font-heavy);
    text-align: right;
  }

  @media screen and (max-width: 950px) {
    .chart-shell {
      max-width: 92%;
    }
    .stat-value {
      font-size: 1.6rem;
    }
  }
</style>
