<script>
  import { onDestroy } from "svelte";
  import { scaleLinear } from "d3-scale";
  import { energyData, testData, BOUNDS, AXIS } from "../datasets.js";
  import { trainEnsemble, predictTree, rmseOn } from "../xgboost.js";
  import { INK, SURFACE, SKY, GHOST, COSMOS, VIOLET, SMILE, MUTED, JUNGLE } from "../palette.js";
  import katexify from "../katexify";

  // Editable copy of data
  let data = energyData.map((d) => ({ ...d }));

  // Hyperparameters. lambda is held fixed here — it gets its own figure
  // further up, where a single tree makes its effect legible.
  let nTrees = 80;
  let learningRate = 0.25;
  const lambda = 1.0;
  let maxDepth = 1;
  let currentRound = 1;

  // Playback state
  let isPlaying = false;
  let playInterval = null;

  function stopPlayback() {
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
    isPlaying = false;
  }

  function togglePlay() {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (currentRound >= nTrees) currentRound = 0;
      isPlaying = true;
      playInterval = setInterval(() => {
        if (currentRound < nTrees) {
          currentRound += 1;
        } else {
          stopPlayback();
        }
      }, 140);
    }
  }

  function stepForward() {
    stopPlayback();
    if (currentRound < nTrees) currentRound += 1;
  }

  function stepBack() {
    stopPlayback();
    if (currentRound > 0) currentRound -= 1;
  }

  function resetRounds() {
    stopPlayback();
    currentRound = 0;
  }

  function resetData() {
    stopPlayback();
    data = energyData.map((d) => ({ ...d }));
  }

  onDestroy(() => {
    stopPlayback();
  });

  // Re-train ensemble reactively when data or hyperparameters change
  $: model = trainEnsemble(data, {
    nTrees,
    learningRate,
    lambda,
    maxDepth,
  });

  $: roundInfo = model.rounds[Math.min(currentRound, model.rounds.length - 1)];

  // The same ensemble scored on days it was never fit to. Without this the
  // readout only ever goes down, which is the wrong lesson.
  $: trainRmse = roundInfo ? roundInfo.rmse : 0;
  $: testRmse = rmseOn(model, testData, currentRound);
  $: bestTest = (() => {
    let best = Infinity;
    let round = 0;
    for (let r = 1; r <= nTrees; r++) {
      const v = rmseOn(model, testData, r);
      if (v < best) {
        best = v;
        round = r;
      }
    }
    return { best, round };
  })();
  $: pastBest = currentRound > bestTest.round;
  $: prevRoundInfo =
    currentRound > 0
      ? model.rounds[currentRound - 1]
      : model.rounds[0];

  $: activeTree =
    currentRound > 0 && model.trees.length >= currentRound
      ? model.trees[currentRound - 1]
      : null;

  // Dimensions
  let width = 760;
  const topHeight = 310;
  const bottomHeight = 170;
  const margin = { top: 25, right: 30, bottom: 35, left: 60 };

  $: innerWidth = Math.max(260, width - margin.left - margin.right);

  $: xScale = scaleLinear()
    .domain([BOUNDS.x0, BOUNDS.x1])
    .range([margin.left, margin.left + innerWidth]);

  $: yScaleTop = scaleLinear()
    .domain([BOUNDS.y0, BOUNDS.y1])
    .range([topHeight - margin.bottom, margin.top]);

  // Residuals / Tree output scale for bottom chart
  $: residualDomain = (() => {
    if (!roundInfo) return [-25, 25];
    const maxRes = Math.max(15, ...roundInfo.residuals.map((r) => Math.abs(r)));
    return [-Math.ceil(maxRes * 1.1), Math.ceil(maxRes * 1.1)];
  })();

  $: yScaleBottom = scaleLinear()
    .domain(residualDomain)
    .range([bottomHeight - margin.bottom, margin.top]);

  // Continuous prediction curves
  $: currentCurve = model.predictCurve([BOUNDS.x0, BOUNDS.x1], 120, currentRound);
  $: prevCurve =
    currentRound > 0
      ? model.predictCurve([BOUNDS.x0, BOUNDS.x1], 120, currentRound - 1)
      : null;

  // Stepped path generators
  function makeStepPath(points, ySc) {
    if (!points || points.length === 0) return "";
    let d = `M ${xScale(points[0].x)} ${ySc(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      d += ` L ${xScale(curr.x)} ${ySc(curr.y)}`;
    }
    return d;
  }

  $: currentPathD = makeStepPath(currentCurve, yScaleTop);
  $: prevPathD = prevCurve ? makeStepPath(prevCurve, yScaleTop) : "";

  // Bottom chart: curve for the newly trained tree f_t(x)
  $: treeCurvePoints = (() => {
    if (!activeTree) return [];
    const steps = 120;
    const stepSize = (BOUNDS.x1 - BOUNDS.x0) / (steps - 1);
    const pts = [];
    for (let i = 0; i < steps; i++) {
      const x = BOUNDS.x0 + i * stepSize;
      pts.push({ x, y: predictTree(activeTree, x) });
    }
    return pts;
  })();
  $: treePathD = makeStepPath(treeCurvePoints, yScaleBottom);

  // Dragging logic for data points
  let draggingId = null;
  let svgTopNode;

  function onPointerDown(e, pointId) {
    e.preventDefault();
    stopPlayback();
    draggingId = pointId;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(e) {
    if (draggingId === null || !svgTopNode) return;
    const rect = svgTopNode.getBoundingClientRect();
    const clientY = e.clientY - rect.top;
    const newY = yScaleTop.invert(clientY);
    const clampedY = Math.max(BOUNDS.y0 + 1, Math.min(BOUNDS.y1 + 8, newY));

    data = data.map((p) => {
      if (p.id === draggingId) {
        return { ...p, y: Math.round(clampedY * 10) / 10 };
      }
      return p;
    });
  }

  function onPointerUp() {
    draggingId = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }

  // Hover state
  let hoveredPoint = null;
</script>

<h1 class="body-header">Interactive: The Gradient Boosting Engine</h1>

<p class="body-text">
  Here's the entire algorithm running live in your browser. The top panel shows
  the ensemble prediction
  <span class="bold" style="color: {SKY};">ŷ(x)</span> against the data, and the
  bottom panel shows the engine room: the residuals competing for attention, and
  the new tree <span class="bold" style="color: {VIOLET};">f_t(x)</span> that's
  fit to absorb them.
</p>

<p class="body-text">
  <span class="bold">Try dragging any point up or down</span> in the top chart,
  and watch every later tree re-fit around it. The chart reports two error
  numbers: one on the days the model was trained on, and one on held-out days it
  has never seen. If you drag a point far off the curve, the first number will
  happily keep falling while the second gets worse, which is exactly why it's
  worth watching both.
</p>

<div class="interactive-container" bind:clientWidth={width}>
  <!-- Control Header -->
  <div class="controls-panel">
    <div class="control-row playback-row">
      <div class="btn-group">
        <button
          class="ctrl-btn play-btn"
          on:click={togglePlay}
          title={isPlaying ? "Pause" : "Play rounds"}
        >
          {#if isPlaying}⏸ Pause{:else}▶ Play{/if}
        </button>
        <button
          class="ctrl-btn"
          on:click={stepBack}
          disabled={currentRound <= 0}
          title="Step back"
        >
          ❮
        </button>
        <button
          class="ctrl-btn"
          on:click={stepForward}
          disabled={currentRound >= nTrees}
          title="Step forward"
        >
          ❯
        </button>
        <button class="ctrl-btn" on:click={resetRounds} title="Reset to baseline">
          ↺ Reset
        </button>
      </div>

      <div class="round-display">
        <span class="round-label">Boosting Round:</span>
        <span class="round-num">{currentRound}</span>
        <span class="round-total">/ {nTrees}</span>
      </div>

      <div class="metrics-pill">
        <span class="metric-name">RMSE train:</span>
        <span class="metric-val">{trainRmse.toFixed(2)}</span>
        <span class="metric-sep">·</span>
        <span class="metric-name">held out:</span>
        <span class="metric-val" class:worsening={pastBest}>{testRmse.toFixed(2)}</span>
        <span class="metric-unit">kWh</span>
        {#if pastBest}
          <span class="metric-warn">past its best ({bestTest.best.toFixed(2)} @ {bestTest.round})</span>
        {/if}
      </div>

      <div class="action-buttons">
        <button class="ctrl-btn action-btn text-btn" on:click={resetData}>
          Reset points
        </button>
      </div>
    </div>

    <!-- Scrubber Slider -->
    <div class="slider-row scrubber-row">
      <label for="round-scrubber" class="slider-label">Timeline:</label>
      <input
        id="round-scrubber"
        type="range"
        min="0"
        max={nTrees}
        bind:value={currentRound}
        on:input={stopPlayback}
        class="range-slider main-scrubber"
      />
    </div>

    <!-- Hyperparameters -->
    <div class="hyperparams-grid">
      <div class="param-box">
        <div class="param-label-row">
          <span class="param-name">Learning Rate (Shrinkage η):</span>
          <span class="param-val">{learningRate.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.05"
          max="1.0"
          step="0.05"
          bind:value={learningRate}
          class="range-slider"
        />
        <div class="param-hint">
          {learningRate > 0.6
            ? "Big steps: fast at first, then the held-out number turns around early"
            : "Small steps: slower, but it keeps improving for longer"}
        </div>
      </div>

      <div class="param-box depth-box">
        <div class="param-label-row">
          <span class="param-name">Tree Depth:</span>
          <span class="param-val">{maxDepth === 1 ? "Depth 1 (stumps)" : "Depth 2 (up to 4 leaves)"}</span>
        </div>
        <div class="btn-group depth-toggle">
          <button
            class="ctrl-btn {maxDepth === 1 ? 'selected' : ''}"
            on:click={() => (maxDepth = 1)}
          >
            Depth 1
          </button>
          <button
            class="ctrl-btn {maxDepth === 2 ? 'selected' : ''}"
            on:click={() => (maxDepth = 2)}
          >
            Depth 2
          </button>
        </div>
        <div class="param-hint">
          {maxDepth === 1 ? "One threshold per tree" : "Finer steps within each region — with a single feature there is no interaction to capture"}
        </div>
      </div>
    </div>
  </div>

  <!-- Top Chart: Ensemble Prediction -->
  <div class="chart-wrapper">
    <div class="chart-title-row">
      <span class="chart-title">Ensemble Output: ŷ⁽ᵗ⁾(x)</span>
      <div class="legend-items">
        <span class="legend-item">
          <span class="legend-line" style="background: {SKY}; height: 3px;"></span>
          Current ŷ⁽{currentRound}⁾
        </span>
        {#if currentRound > 0}
          <span class="legend-item">
            <span class="legend-line" style="background: {GHOST}; height: 2px; border: 1px dashed {GHOST};"></span>
            Previous ŷ⁽{currentRound - 1}⁾
          </span>
        {/if}
        <span class="legend-item">
          <span class="legend-dot" style="background: {INK};"></span>
          Data Point (Drag Me!)
        </span>
      </div>
    </div>

    <svg
      bind:this={svgTopNode}
      {width}
      height={topHeight}
      viewBox="0 0 {width} {topHeight}"
      class="chart-svg"
    >
      <!-- Grid -->
      {#each yScaleTop.ticks(6) as tick}
        <line
          x1={margin.left}
          x2={margin.left + innerWidth}
          y1={yScaleTop(tick)}
          y2={yScaleTop(tick)}
          stroke="#edf2f7"
          stroke-dasharray="3,3"
        />
        <text
          x={margin.left - 10}
          y={yScaleTop(tick) + 4}
          text-anchor="end"
          class="axis-label">{tick}</text
        >
      {/each}

      {#each xScale.ticks(8) as tick}
        <line
          x1={xScale(tick)}
          x2={xScale(tick)}
          y1={margin.top}
          y2={topHeight - margin.bottom}
          stroke="#edf2f7"
          stroke-dasharray="3,3"
        />
        <text
          x={xScale(tick)}
          y={topHeight - margin.bottom + 18}
          text-anchor="middle"
          class="axis-label">{tick}°C</text
        >
      {/each}

      <text
        transform="rotate(-90)"
        x={-(margin.top + (topHeight - margin.top - margin.bottom) / 2)}
        y={margin.left - 42}
        text-anchor="middle"
        class="axis-title">Demand (kWh)</text
      >

      <!-- Ghosted Previous Curve -->
      {#if prevPathD}
        <path
          d={prevPathD}
          fill="none"
          stroke={GHOST}
          stroke-width="2"
          stroke-dasharray="4,4"
        />
      {/if}

      <!-- Current Ensemble Step Curve -->
      <path
        d={currentPathD}
        fill="none"
        stroke={SKY}
        stroke-width="3.5"
        stroke-linecap="round"
      />

      <!-- Data Points (Draggable) -->
      {#each data as p}
        <g
          class="point-group"
          class:is-dragging={draggingId === p.id}
          class:is-outlier={p.id === "outlier"}
          on:pointerdown={(e) => onPointerDown(e, p.id)}
          on:mouseenter={() => (hoveredPoint = p)}
          on:mouseleave={() => (hoveredPoint = null)}
        >
          <!-- Hit area for easy grabbing -->
          <circle
            cx={xScale(p.x)}
            cy={yScaleTop(p.y)}
            r="14"
            fill="transparent"
            cursor="ns-resize"
          />
          <!-- Outer halo when active or hovered -->
          {#if draggingId === p.id || (hoveredPoint && hoveredPoint.id === p.id)}
            <circle
              cx={xScale(p.x)}
              cy={yScaleTop(p.y)}
              r="10"
              fill={SMILE}
              opacity="0.3"
            />
          {/if}
          <!-- Point body -->
          <circle
            cx={xScale(p.x)}
            cy={yScaleTop(p.y)}
            r={p.id === "outlier" ? "7" : "5"}
            fill={p.id === "outlier" ? COSMOS : draggingId === p.id ? SMILE : INK}
            stroke="#ffffff"
            stroke-width="1.8"
            cursor="ns-resize"
          />
        </g>
      {/each}
    </svg>
  </div>

  <!-- Bottom Chart: Residuals & New Tree -->
  <div class="chart-wrapper bottom-wrapper">
    <div class="chart-title-row">
      <span class="chart-title">
        Residuals & New Tree Step: f_{currentRound > 0 ? currentRound : 1}(x)
      </span>
      <div class="legend-items">
        <span class="legend-item">
          <span class="legend-line" style="background: {COSMOS};"></span>
          Residuals (Target - ŷ)
        </span>
        {#if activeTree}
          <span class="legend-item">
            <span class="legend-line" style="background: {VIOLET}; height: 3px;"></span>
            New Tree Leaf Outputs
          </span>
        {/if}
      </div>
    </div>

    <svg
      {width}
      height={bottomHeight}
      viewBox="0 0 {width} {bottomHeight}"
      class="chart-svg"
    >
      <!-- Zero Line -->
      <line
        x1={margin.left}
        x2={margin.left + innerWidth}
        y1={yScaleBottom(0)}
        y2={yScaleBottom(0)}
        stroke="#cbd5e0"
        stroke-width="1.5"
      />
      <text
        x={margin.left - 10}
        y={yScaleBottom(0) + 4}
        text-anchor="end"
        class="axis-label"
        font-weight="bold">0</text
      >

      {#each yScaleBottom.ticks(4) as tick}
        {#if tick !== 0}
          <line
            x1={margin.left}
            x2={margin.left + innerWidth}
            y1={yScaleBottom(tick)}
            y2={yScaleBottom(tick)}
            stroke="#edf2f7"
            stroke-dasharray="3,3"
          />
          <text
            x={margin.left - 10}
            y={yScaleBottom(tick) + 4}
            text-anchor="end"
            class="axis-label">{tick > 0 ? `+${tick}` : tick}</text
          >
        {/if}
      {/each}

      {#each xScale.ticks(8) as tick}
        <text
          x={xScale(tick)}
          y={bottomHeight - margin.bottom + 18}
          text-anchor="middle"
          class="axis-label">{tick}°C</text
        >
      {/each}

      <text
        x={margin.left + innerWidth / 2}
        y={bottomHeight - 5}
        text-anchor="middle"
        class="axis-title">{AXIS.x}</text
      >

      <!-- Residual Stems from 0 line -->
      {#if prevRoundInfo}
        {#each prevRoundInfo.residuals as res, i}
          <line
            x1={xScale(data[i].x)}
            x2={xScale(data[i].x)}
            y1={yScaleBottom(0)}
            y2={yScaleBottom(res)}
            stroke={COSMOS}
            stroke-width="2"
            opacity="0.8"
          />
          <circle
            cx={xScale(data[i].x)}
            cy={yScaleBottom(res)}
            r="3"
            fill={COSMOS}
          />
        {/each}
      {/if}

      <!-- Newly Fit Tree f_t(x) -->
      {#if treePathD}
        <path
          d={treePathD}
          fill="none"
          stroke={VIOLET}
          stroke-width="3"
          stroke-linecap="round"
        />
      {/if}
    </svg>
  </div>
</div>

<style>
  .interactive-container {
    max-width: 820px;
    margin: 2rem auto;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }

  .controls-panel {
    background: var(--paper);
    padding: 1.2rem 1.4rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .control-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .btn-group {
    display: flex;
    gap: 4px;
  }

  .ctrl-btn {
    font-family: var(--font-main);
    font-size: 0.9rem;
    font-weight: 600;
    padding: 6px 12px;
    border: 1px solid #cbd5e0;
    background: #ffffff;
    color: var(--squidink);
    border-radius: 6px;
    cursor: pointer;
    transition: all 150ms ease;
  }

  .ctrl-btn:hover:not(:disabled) {
    background: #edf2f7;
    border-color: #a0aec0;
  }

  .ctrl-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .play-btn {
    background: var(--violet);
    color: #ffffff;
    border-color: var(--violet);
    min-width: 90px;
  }

  .play-btn:hover:not(:disabled) {
    background: #6845d4;
    border-color: #6845d4;
  }

  .round-display {
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-family: var(--font-main);
  }

  .round-label {
    font-size: 0.95rem;
    color: #4a5568;
    font-weight: 500;
  }

  .round-num {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--violet);
    font-family: var(--font-mono, monospace);
  }

  .round-total {
    font-size: 0.9rem;
    color: #718096;
  }

  .metrics-pill {
    background: #ffffff;
    border: 1px solid #cbd5e0;
    padding: 5px 12px;
    border-radius: 20px;
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 0.9rem;
  }

  .metric-name {
    color: #718096;
    font-weight: 600;
  }

  .metric-val {
    font-weight: 800;
    font-family: var(--font-mono, monospace);
    color: var(--squidink);
  }

  .metric-val.worsening {
    color: #c02a52;
  }

  .metric-sep {
    color: #cbd5e0;
  }

  .metric-unit {
    color: #718096;
    font-size: 0.8rem;
  }

  .metric-warn {
    color: #c02a52;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .text-btn {
    border: none;
    background: transparent;
    color: #4a5568;
    text-decoration: underline;
    padding: 6px 8px;
  }

  .scrubber-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 0.8rem;
    border-top: 1px solid #e2e8f0;
  }

  .slider-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #4a5568;
    white-space: nowrap;
  }

  .range-slider {
    flex: 1;
    cursor: pointer;
    accent-color: var(--violet);
  }

  .hyperparams-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.2rem;
    margin-top: 1.2rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
  }

  .param-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .param-label-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--squidink);
  }

  .param-val {
    font-family: var(--font-mono, monospace);
    color: var(--violet);
    font-weight: 700;
  }

  .param-hint {
    font-size: 0.75rem;
    color: #718096;
    line-height: 1.3;
  }

  .depth-toggle {
    margin-top: 2px;
  }

  .depth-toggle .ctrl-btn {
    flex: 1;
    font-size: 0.8rem;
    padding: 4px 8px;
  }

  .depth-toggle .selected {
    background: var(--violet);
    color: #ffffff;
    border-color: var(--violet);
  }

  .chart-wrapper {
    padding: 1rem 1.4rem 0.5rem 1.4rem;
  }

  .bottom-wrapper {
    border-top: 1px solid #edf2f7;
    background: #fafbfc;
    padding-bottom: 1rem;
  }

  .chart-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .chart-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--squidink);
  }

  .legend-items {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: #4a5568;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .legend-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }

  .legend-line {
    width: 14px;
    height: 2px;
    border-radius: 1px;
  }

  .chart-svg {
    display: block;
    width: 100%;
    overflow: visible;
  }

  .axis-label {
    font-size: 10px;
    fill: #718096;
    font-family: var(--font-mono, monospace);
  }

  .axis-title {
    font-size: 11px;
    fill: var(--squidink);
    font-weight: 600;
    font-family: var(--font-main);
  }

  .point-group {
    touch-action: none;
  }

  .point-group:hover circle:last-child {
    stroke-width: 2.5;
  }

  .point-group.is-dragging circle:last-child {
    fill: var(--smile);
    stroke-width: 3;
  }

  @media screen and (max-width: 768px) {
    .hyperparams-grid {
      grid-template-columns: 1fr;
      gap: 0.8rem;
    }

    .playback-row {
      flex-direction: column;
      align-items: stretch;
    }

    .btn-group {
      justify-content: center;
    }

    .round-display {
      justify-content: center;
    }

    .metrics-pill {
      justify-content: center;
    }

    .action-buttons {
      justify-content: center;
    }

    .chart-title-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
  }
</style>