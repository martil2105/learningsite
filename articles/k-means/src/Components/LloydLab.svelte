<script>
  /*
    The hook. One manipulable object: the three centroids.

    Everything else on screen is a consequence of where they are. The shaded
    regions are the Voronoi cells - exactly the territory the assignment step
    will hand to each centroid - and the number underneath is the objective,
    which is the only thing the algorithm is trying to make small.

    The two buttons are deliberately separate rather than one "iterate" button.
    Lloyd's algorithm is two exact minimisations of the SAME objective over two
    different arguments, and if you run them together you can never see that
    each one on its own is already optimal. Separated, the reader can watch the
    number fall twice per round, for two different reasons.

    Dragging is the third thing you can do, and it is the one that is not a
    minimisation of anything. That is why it is the only move that can push the
    number up - which is the fastest way to understand what the other two are.
  */
  import { onDestroy } from "svelte";
  import { MAIN, MAIN_K, extent } from "../datasets.js";
  import { assign, centroidsFrom, inertia, counts } from "../kmeans.js";
  import { initRandom } from "../init.js";
  import { mulberry32 } from "../rng.js";
  import { voronoiCells, polygonPath } from "../voronoi.js";
  import { fitEqual } from "../plot.js";
  import { PRESETS } from "../experiments.js";
  import { CLUSTER_COLORS, CLUSTER_WASH, INK, MUTED, FAINT, ACCENT, SMILE } from "../palette.js";

  const EXT = extent(MAIN, 0.08);
  const PHASE_COLOR = { assign: CLUSTER_COLORS[0], update: CLUSTER_COLORS[1], drag: SMILE };

  // ------------------------------------------------------------- state
  let centroids = PRESETS[0].centroids.map((c) => ({ ...c }));
  let labels = null; // null = nothing assigned yet
  let next = "assign";
  let history = []; // {phase, inertia}
  let converged = false;
  let round = 0;
  let presetKey = PRESETS[0].key;
  let seed = 1;
  let dragging = null;
  let dragFrom = null;
  let running = null;

  $: cells = voronoiCells(centroids, EXT);
  $: current = labels ? inertia(MAIN, labels, centroids) : null;
  $: sizes = labels ? counts(labels, MAIN_K) : null;
  $: last = history.length ? history[history.length - 1] : null;
  $: delta = history.length > 1 ? last.inertia - history[history.length - 2].inertia : null;

  const fmt = (x) => Math.round(x).toLocaleString("en-US");

  // ------------------------------------------------------------- the algorithm
  function record(phase, value) {
    history = [...history, { phase, inertia: value }];
  }

  function doAssign() {
    const proposed = assign(MAIN, centroids);
    const settled = labels !== null && proposed.every((v, i) => v === labels[i]);
    labels = proposed;
    record("assign", inertia(MAIN, labels, centroids));
    converged = settled;
    if (settled) stopRun();
    next = "update";
  }

  function doUpdate() {
    centroids = centroidsFrom(MAIN, labels, MAIN_K, centroids);
    record("update", inertia(MAIN, labels, centroids));
    round += 1;
    next = "assign";
  }

  function step() {
    if (converged) return;
    if (next === "assign" || labels === null) doAssign();
    else doUpdate();
  }

  function stopRun() {
    if (running) clearInterval(running);
    running = null;
  }

  function toggleRun() {
    if (running) return stopRun();
    if (converged) return;
    running = setInterval(() => {
      if (converged) stopRun();
      else step();
    }, 420);
  }

  onDestroy(stopRun);

  function reset(centres, key) {
    stopRun();
    centroids = centres.map((c) => ({ ...c }));
    labels = null;
    next = "assign";
    history = [];
    converged = false;
    round = 0;
    presetKey = key;
  }

  const applyPreset = (p) => reset(p.centroids, p.key);
  function randomStart() {
    seed += 1;
    reset(initRandom(MAIN, MAIN_K, mulberry32(4000 + seed * 977)), null);
  }

  // ------------------------------------------------------------- layout
  // Small on purpose: if the measurement is slow or never arrives, a narrow
  // chart is a survivable failure and a clipped one is not.
  let width = 320;
  /*
    A measured width can arrive as 0 - the binding fires before layout, and a
    sticky panel that is momentarily zero-width reports zero. Every scale built
    from it then has an inverted range, which shows up as a negative <rect>
    width in the console and, in the worst case, as a chart drawn backwards.
    Clamp once, here, and use the clamped value everywhere below.
  */
  $: W = Math.max(260, width);
  let svgNode;
  $: narrow = W < 520;
  $: H = narrow ? Math.max(260, Math.round(W * 0.86)) : 380;
  $: margin = { top: 10, right: 10, bottom: 10, left: 10 };
  $: p = fitEqual(EXT, W, H, margin);
  $: r = narrow ? 2.5 : 3.1;
  $: cr = narrow ? 8 : 10;

  // ------------------------------------------------------------- dragging
  function toData(event) {
    const rect = svgNode.getBoundingClientRect();
    // The viewBox may be scaling the drawing down under max-width, so client
    // pixels are not user units. Convert before inverting the plot transform.
    const k = rect.width > 0 && W > 0 ? rect.width / W : 1;
    return { x: p.invX((event.clientX - rect.left) / k), y: p.invY((event.clientY - rect.top) / k) };
  }

  function onPointerDown(i, event) {
    stopRun();
    dragging = i;
    dragFrom = current;
    event.target.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (dragging === null) return;
    const d = toData(event);
    const nextC = centroids.slice();
    nextC[dragging] = {
      x: Math.min(EXT.x1, Math.max(EXT.x0, d.x)),
      y: Math.min(EXT.y1, Math.max(EXT.y0, d.y)),
    };
    centroids = nextC;
    converged = false;
    next = "assign";
    presetKey = null;
  }

  function onPointerUp() {
    if (dragging === null) return;
    dragging = null;
    // One history entry for the whole drag, not one per pointermove - and only
    // if there was an assignment for the objective to be defined against.
    if (labels && dragFrom !== null) {
      const now = inertia(MAIN, labels, centroids);
      if (Math.abs(now - dragFrom) > 1e-6) record("drag", now);
    }
    dragFrom = null;
  }

  function onKey(i, event) {
    const s = event.shiftKey ? 5 : 1.5;
    const d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] }[event.key];
    if (!d) return;
    event.preventDefault();
    const before = labels ? inertia(MAIN, labels, centroids) : null;
    const nextC = centroids.slice();
    nextC[i] = {
      x: Math.min(EXT.x1, Math.max(EXT.x0, centroids[i].x + d[0])),
      y: Math.min(EXT.y1, Math.max(EXT.y0, centroids[i].y + d[1])),
    };
    centroids = nextC;
    converged = false;
    next = "assign";
    presetKey = null;
    if (labels && before !== null) {
      const now = inertia(MAIN, labels, centroids);
      if (Math.abs(now - before) > 1e-6) record("drag", now);
    }
  }

  // ------------------------------------------------------------- history strip
  // 64, not 58: the caption sits at y=11 and the plot band starts at y=26, so
  // the first point of a run - always the highest one - cannot land on the text.
  const SH = 64;
  $: stripW = Math.max(120, W - 12);
  $: hVals = history.map((h) => h.inertia);
  // Log scale: a run from a bad start spans more than an order of magnitude,
  // and on a linear axis every step after the first would sit on the floor.
  $: hMax = hVals.length ? Math.max(...hVals) : 1;
  $: hMin = hVals.length ? Math.min(...hVals) : 1;
  $: logLo = Math.log(Math.max(1, hMin)) - 0.06;
  $: logHi = Math.log(Math.max(2, hMax)) + 0.06;
  $: hY = (v) => SH - 10 - ((Math.log(Math.max(1, v)) - logLo) / Math.max(1e-9, logHi - logLo)) * (SH - 36);
  $: hX = (i) => 6 + (history.length > 1 ? (i * (stripW - 12)) / (history.length - 1) : 0);
  $: hPath = history.map((h, i) => (i ? "L" : "M") + " " + hX(i) + " " + hY(h.inertia) + " ").join("");
</script>

<div class="lab">
  <div class="measure" bind:clientWidth={width} />

  <div class="lab-head">
    <span class="lab-title">Lloyd's algorithm, one half-step at a time</span>
    <span class="lab-phase" class:done={converged}>
      {#if converged}
        converged after {round} round{round === 1 ? "" : "s"}
      {:else if labels === null}
        round 0 · nothing assigned yet
      {:else}
        round {round} · next: {next === "assign" ? "assign" : "move centroids"}
      {/if}
    </span>
  </div>

  <svg
    bind:this={svgNode}
    viewBox="0 0 {W} {H}"
    width={W}
    height={H}
    on:pointermove={onPointerMove}
    on:pointerup={onPointerUp}
    on:pointercancel={onPointerUp}
  >
    <rect x={p.box.x} y={p.box.y} width={p.box.w} height={p.box.h} fill="#fbfcfd" stroke={FAINT} />

    <!-- The territory each centroid owns. This IS the assignment step, drawn:
         a point joins whichever cell it is standing in. -->
    {#each cells as poly, j}
      <path
        d={polygonPath(poly, p)}
        fill={labels ? CLUSTER_WASH[j] : "#f4f6f8"}
        stroke={labels ? CLUSTER_COLORS[j] : MUTED}
        stroke-opacity="0.45"
        stroke-width="1"
      />
    {/each}

    {#each MAIN as d, i}
      <circle
        cx={p.X(d.x)}
        cy={p.Y(d.y)}
        {r}
        fill={labels ? CLUSTER_COLORS[labels[i]] : MUTED}
        fill-opacity={labels ? 0.85 : 0.6}
      />
    {/each}

    {#each centroids as c, j}
      <g
        class="centroid"
        class:active={dragging === j}
        role="button"
        tabindex="0"
        aria-label="Centroid {j + 1}. Arrow keys to move."
        on:pointerdown={(e) => onPointerDown(j, e)}
        on:keydown={(e) => onKey(j, e)}
      >
        <!-- A generous invisible target: the visible marker is small and this
             has to work with a fingertip. -->
        <circle cx={p.X(c.x)} cy={p.Y(c.y)} r={cr + 12} fill="transparent" />
        <path
          d="M {p.X(c.x)} {p.Y(c.y) - cr} L {p.X(c.x) + cr} {p.Y(c.y)} L {p.X(c.x)} {p.Y(c.y) + cr} L {p.X(c.x) - cr} {p.Y(c.y)} Z"
          fill={CLUSTER_COLORS[j]}
          stroke={dragging === j ? SMILE : "#ffffff"}
          stroke-width={dragging === j ? 3 : 2.2}
        />
        <circle cx={p.X(c.x)} cy={p.Y(c.y)} r="1.9" fill="#ffffff" />
      </g>
    {/each}
  </svg>

  <div class="readout">
    <div class="metric">
      <span class="metric-label">inertia</span>
      <span class="metric-value">{current === null ? "—" : fmt(current)}</span>
      {#if delta !== null && last}
        <span class="metric-delta" style="color:{delta > 0 ? SMILE : delta < 0 ? '#2f7d32' : MUTED}">
          {delta > 0 ? "▲ +" : delta < 0 ? "▼ −" : "±"}{fmt(Math.abs(delta))}
        </span>
      {/if}
    </div>
    <div class="sizes">
      {#if sizes}
        {#each sizes as n, j}
          <span class="size-chip" style="background:{CLUSTER_COLORS[j]}">{n}</span>
        {/each}
      {:else}
        <span class="hint">press <em>assign</em> to start</span>
      {/if}
    </div>
  </div>

  <svg class="strip" viewBox="0 0 {stripW} {SH}" width={stripW} height={SH}>
    <text class="strip-label" x="6" y="11">objective, half-step by half-step (log scale)</text>
    {#if history.length}
      <path d={hPath} fill="none" stroke={MUTED} stroke-width="1.4" />
      {#each history as h, i}
        <circle cx={hX(i)} cy={hY(h.inertia)} r="3.4" fill={PHASE_COLOR[h.phase]} stroke="#fff" stroke-width="1.2" />
      {/each}
    {:else}
      <text class="strip-empty" x={stripW / 2} y={SH / 2 + 8} text-anchor="middle">no steps yet</text>
    {/if}
  </svg>

  <div class="legend">
    <span class="lg"><span class="sw" style="background:{PHASE_COLOR.assign}" />assign</span>
    <span class="lg"><span class="sw" style="background:{PHASE_COLOR.update}" />move centroids</span>
    <span class="lg"><span class="sw" style="background:{PHASE_COLOR.drag}" />you dragged one</span>
  </div>

  <div class="controls">
    <button class="primary" on:click={step} disabled={converged}>
      {#if converged}nothing left to do{:else if next === "assign" || labels === null}Assign points{:else}Move centroids{/if}
    </button>
    <button class="ghost" on:click={toggleRun} disabled={converged && !running}>
      {running ? "Stop" : "Run to the end"}
    </button>
    <button class="ghost" on:click={randomStart}>New random start</button>
  </div>

  <div class="presets">
    {#each PRESETS as pr}
      <button class="pill" class:on={presetKey === pr.key} on:click={() => applyPreset(pr)} title={pr.note}>
        {pr.label}
      </button>
    {/each}
  </div>

  <p class="caption">
    When you drag a centroid, its shaded territory follows it right away. The
    points, however, keep the colours they were last given, so the number can go
    up. Only the algorithm's own steps (assigning points and moving centroids)
    are guaranteed never to increase it.
  </p>
</div>

<style>
  .lab {
    max-width: 620px;
    margin: 2rem auto 1rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1rem 1rem 0.9rem 1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .measure {
    width: 100%;
    height: 0;
  }

  svg {
    max-width: 100%;
    display: block;
    touch-action: none;
  }

  .lab-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.45rem;
  }

  .lab-title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--squidink);
  }

  .lab-phase {
    font-family: var(--font-mono, monospace);
    font-size: 0.73rem;
    color: #718096;
  }

  .lab-phase.done {
    color: #2f7d32;
    font-weight: 700;
  }

  .centroid {
    cursor: grab;
  }

  .centroid.active {
    cursor: grabbing;
  }

  .centroid:focus {
    outline: none;
  }

  .centroid:focus-visible > path {
    stroke: var(--violet);
    stroke-width: 3.2;
  }

  .readout {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.55rem;
  }

  .metric {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
  }

  .metric-label {
    font-family: var(--font-main);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9aa5b1;
  }

  .metric-value {
    font-family: var(--font-mono, monospace);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--squidink);
    font-variant-numeric: tabular-nums;
  }

  .metric-delta {
    font-family: var(--font-mono, monospace);
    font-size: 0.8rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .sizes {
    display: flex;
    gap: 0.3rem;
    align-items: center;
  }

  .size-chip {
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    font-weight: 700;
    color: #ffffff;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .hint {
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #9aa5b1;
  }

  .strip {
    margin-top: 0.15rem;
  }

  .strip-label,
  .strip-empty {
    font-family: var(--font-main);
    font-size: 10px;
    fill: #9aa5b1;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 0.1rem 0 0.7rem 0;
  }

  .lg {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-family: var(--font-main);
    font-size: 0.72rem;
    color: #718096;
  }

  .sw {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: inline-block;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  button {
    font-family: var(--font-main);
    font-size: 0.82rem;
    border-radius: 6px;
    cursor: pointer;
    padding: 0.42rem 0.8rem;
    border: 1px solid #cbd5e0;
    background: #ffffff;
    color: var(--squidink);
    transition: background 120ms ease, border-color 120ms ease;
  }

  button:hover:not(:disabled) {
    border-color: var(--violet);
  }

  button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .primary {
    background: var(--violet);
    border-color: var(--violet);
    color: #ffffff;
    font-weight: 700;
    min-width: 9.5rem;
  }

  .primary:hover:not(:disabled) {
    background: #6a49dd;
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.5rem;
  }

  .pill {
    font-size: 0.74rem;
    padding: 0.24rem 0.6rem;
    border-radius: 999px;
    color: #4a5568;
  }

  .pill.on {
    background: #efeafe;
    border-color: var(--violet);
    color: #4a3592;
    font-weight: 700;
  }

  .caption {
    font-family: var(--font-main);
    font-size: 0.8rem;
    line-height: 1.5;
    color: #718096;
    margin: 0.75rem 0 0.2rem 0;
  }

  @media screen and (max-width: 950px) {
    .lab {
      max-width: 92%;
      padding: 0.75rem;
    }

    .metric-value {
      font-size: 1.25rem;
    }

    .primary {
      min-width: 8.5rem;
    }
  }
</style>
