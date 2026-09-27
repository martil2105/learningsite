<script>
  /*
    RulerLab.svelte — The hook.
    One curve family selector, one draggable price point along the curve,
    the tangent line drawn to both axes, and the upper and lower segments.
    The ratio of segment lengths identically equals |ε|.
  */
  import { families, pointElasticity, rulerSegments, P0, Q0 } from "../demand.js";
  import { linear, clampW } from "../chart.js";
  import katexify from "../katexify.js";

  const P_MAX = 75;
  const Q_MAX = 130;
  const H = 360;
  const M = { top: 22, right: 28, bottom: 44, left: 55 };

  let boxWidth = $state(600);
  let W = $derived(clampW(boxWidth, 320));

  let famId = $state("lin");
  let fam = $derived(families[famId]);

  // Family price ranges ensuring both intercepts fall neatly onto the axes
  const pRanges = {
    lin: { min: 5, max: 58, step: 0.5, defaultP: 25 },
    ces: { min: 24, max: 46, step: 0.5, defaultP: 25 },
    exp: { min: 18, max: 50, step: 0.5, defaultP: 25 },
    quad: { min: 10, max: 55, step: 0.5, defaultP: 25 },
    logit: { min: 15, max: 52, step: 0.5, defaultP: 25 },
  };

  let currentRange = $derived(pRanges[famId]);
  let p = $state(25);

  // Clamp p whenever family changes
  $effect(() => {
    const r = pRanges[famId];
    if (p < r.min) p = r.min;
    if (p > r.max) p = r.max;
  });

  // Scales
  let x = $derived(linear(0, P_MAX, M.left, W - M.right));
  let y = $derived(linear(0, Q_MAX, H - M.bottom, M.top));

  // Current curve points
  let curvePts = $derived.by(() => {
    const pts = [];
    const step = 0.5;
    for (let pv = 0.5; pv <= P_MAX; pv += step) {
      const qv = fam.q(pv);
      if (qv >= 0 && qv <= Q_MAX * 1.5) {
        pts.push([x(pv), y(qv)]);
      }
    }
    return pts;
  });

  let curvePath = $derived.by(() => {
    let s = "";
    for (let i = 0; i < curvePts.length; i++) {
      s += `${i === 0 ? "M" : "L"} ${curvePts[i][0].toFixed(2)} ${curvePts[i][1].toFixed(2)} `;
    }
    return s;
  });

  // Ruler calculations
  let seg = $derived(rulerSegments(fam, p));
  let qVal = $derived(fam.q(p));
  let epsVal = $derived(pointElasticity(fam, p));

  // Screen coordinates
  let ptX = $derived(x(p));
  let ptY = $derived(y(qVal));

  let qIntY = $derived(y(seg.qIntercept));
  let pIntX = $derived(x(seg.pIntercept));

  // Screen lengths
  let screenLenUpper = $derived(Math.hypot(ptX - x(0), ptY - qIntY));
  let screenLenLower = $derived(Math.hypot(pIntX - ptX, y(0) - ptY));
  let screenRatio = $derived(screenLenLower > 0 ? screenLenUpper / screenLenLower : 0);

  // Unit invariance demonstration state
  let showUnits = $state(false);

  // Dragging interaction
  let isDragging = $state(false);
  let svgEl;

  function handlePointerDown(e) {
    isDragging = true;
    updatePFromPointer(e);
  }

  function handlePointerMove(e) {
    if (!isDragging) return;
    updatePFromPointer(e);
  }

  function handlePointerUp() {
    isDragging = false;
  }

  function updatePFromPointer(e) {
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const newP = x.invert(mouseX);
    const r = pRanges[famId];
    p = Math.max(r.min, Math.min(r.max, Math.round(newP * 2) / 2));
  }
</script>

<svelte:window onpointermove={handlePointerMove} onpointerup={handlePointerUp} />

<div class="fig-card" id="ruler-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <div class="controls-bar">
    <div class="fam-selector">
      <span class="ctrl-label">Curve family:</span>
      <div class="btn-group">
        <button
          type="button"
          class="btn-tab {famId === 'lin' ? 'active' : ''}"
          onclick={() => (famId = "lin")}>Linear</button
        >
        <button
          type="button"
          class="btn-tab {famId === 'ces' ? 'active' : ''}"
          onclick={() => (famId = "ces")}>Constant ε</button
        >
        <button
          type="button"
          class="btn-tab {famId === 'exp' ? 'active' : ''}"
          onclick={() => (famId = "exp")}>Exponential</button
        >
        <button
          type="button"
          class="btn-tab {famId === 'quad' ? 'active' : ''}"
          onclick={() => (famId = "quad")}>Quadratic</button
        >
        <button
          type="button"
          class="btn-tab {famId === 'logit' ? 'active' : ''}"
          onclick={() => (famId = "logit")}>Logistic</button
        >
      </div>
    </div>

    <div class="presets">
      <button
        type="button"
        class="btn-preset"
        onclick={() => (p = 25)}>Pin (p = 25)</button
      >
      {#if famId === "lin"}
        <button
          type="button"
          class="btn-preset"
          onclick={() => (p = 31.25)}>Unit ε (p = 31.25)</button
        >
      {:else if famId === "exp"}
        <button
          type="button"
          class="btn-preset"
          onclick={() => (p = 20)}>Unit ε (p = 20.0)</button
        >
      {:else if famId === "quad"}
        <button
          type="button"
          class="btn-preset"
          onclick={() => (p = 26.5)}>Unit ε (p ≈ 26.67)</button
        >
      {:else if famId === "logit"}
        <button
          type="button"
          class="btn-preset"
          onclick={() => (p = 27)}>Unit ε (p ≈ 27.18)</button
        >
      {/if}
    </div>
  </div>

  <div class="readout-grid">
    <div class="metric-col upper-metric">
      <span class="m-label">Upper segment (to the q-axis)</span>
      <span class="m-val" id="ruler-len-upper">{seg.lenUpper.toFixed(2)}</span>
      <span class="m-sub">intercept Q = {seg.qIntercept.toFixed(1)}</span>
    </div>
    <div class="metric-col lower-metric">
      <span class="m-label">Lower segment (to the p-axis)</span>
      <span class="m-val" id="ruler-len-lower">{seg.lenLower.toFixed(2)}</span>
      <span class="m-sub">intercept P = {seg.pIntercept.toFixed(1)}</span>
    </div>
    <div class="metric-col ratio-metric">
      <span class="m-label">Segment ratio (upper ÷ lower)</span>
      <span class="m-val highlight" id="ruler-ratio">{seg.ratio.toFixed(4)}</span>
      <span class="m-sub">length ratio on screen</span>
    </div>
    <div class="metric-col formula-metric">
      <span class="m-label">Formula |(dq/dp) · (p/q)|</span>
      <span class="m-val highlight" id="ruler-formula-eps">{epsVal.toFixed(4)}</span>
      <span class="m-sub">algebraic point elasticity</span>
    </div>
  </div>

  <div class="plot-container">
    <svg
      bind:this={svgEl}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Ruler lab showing demand curve, tangent line, and segment ratio equal to elasticity"
      onpointerdown={handlePointerDown}
    >
      <defs>
        <clipPath id="plot-clip">
          <rect x={M.left} y={M.top} width={W - M.left - M.right} height={H - M.top - M.bottom} />
        </clipPath>
      </defs>

      <!-- Axes and Gridlines -->
      <g class="grid-layer">
        {#each [0, 15, 30, 45, 60, 75] as pt}
          <line class="grid-line" x1={x(pt)} y1={M.top} x2={x(pt)} y2={H - M.bottom} />
          <text class="axis-num" x={x(pt)} y={H - M.bottom + 16} text-anchor="middle">{pt}</text>
        {/each}
        {#each [0, 30, 60, 90, 120] as qt}
          <line class="grid-line" x1={M.left} y1={y(qt)} x2={W - M.right} y2={y(qt)} />
          <text class="axis-num" x={M.left - 8} y={y(qt) + 4} text-anchor="end">{qt}</text>
        {/each}
        <!-- Solid Axis Rules -->
        <line class="rule-line" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule-line" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <!-- Axis Titles -->
        <text class="axis-lbl" x={(M.left + W - M.right) / 2} y={H - 6} text-anchor="middle">Price (p)</text>
        <text
          class="axis-lbl"
          transform={`rotate(-90) translate(${-(M.top + H - M.bottom) / 2}, 16)`}
          text-anchor="middle">Quantity (q)</text
        >
      </g>

      <!-- Demand Curve -->
      <g clip-path="url(#plot-clip)">
        <path class="curve {fam.id}" d={curvePath} />
      </g>

      <!-- Pinned Reference Dot at (25, 45) -->
      <circle class="pin-dot" cx={x(P0)} cy={y(Q0)} r="5.5" />
      <text class="pin-lbl" x={x(P0) + 9} y={y(Q0) - 9}>Pin (25, 45)</text>

      <!-- Tangent Segments -->
      <!-- Upper Segment: Point to Q-intercept -->
      <line
        id="seg-upper"
        class="seg upper"
        x1={ptX}
        y1={ptY}
        x2={x(0)}
        y2={qIntY}
      />
      <!-- Lower Segment: Point to P-intercept -->
      <line
        id="seg-lower"
        class="seg lower"
        x1={ptX}
        y1={ptY}
        x2={pIntX}
        y2={y(0)}
      />

      <!-- Segment Labels along lines -->
      <g class="seg-labels">
        <circle cx={x(0)} cy={qIntY} r="3.5" fill="#2074d5" />
        <text class="intercept-lbl upper" x={x(0) + 8} y={qIntY + 4}>Q-int: {seg.qIntercept.toFixed(1)}</text>

        <circle cx={pIntX} cy={y(0)} r="3.5" fill="#df2a5d" />
        <text class="intercept-lbl lower" x={pIntX - 4} y={y(0) - 8} text-anchor="end">P-int: {seg.pIntercept.toFixed(1)}</text>
      </g>

      <!-- Current Draggable Point -->
      <g class="drag-handle" transform={`translate(${ptX}, ${ptY})`}>
        <circle class="handle-halo" r="14" />
        <circle class="handle-core" r="6" />
        <text class="handle-lbl" x="9" y="-9">p = {p.toFixed(1)}, q = {qVal.toFixed(1)}</text>
      </g>
    </svg>
  </div>

  <div class="slider-row">
    <label for="ruler-p-slider" class="slider-lbl">Drag the point, or set the price p:</label>
    <input
      id="ruler-p-slider"
      type="range"
      min={currentRange.min}
      max={currentRange.max}
      step={currentRange.step}
      bind:value={p}
    />
    <span class="slider-val">p = {p.toFixed(1)}</span>
  </div>

  <div class="unit-toggle-box">
    <button
      type="button"
      class="btn-unit-toggle"
      onclick={() => (showUnits = !showUnits)}
    >
      {showUnits ? "Hide the units demo" : "Show that the units don't matter"}
    </button>
    {#if showUnits}
      <div class="unit-demo-content">
        <p>
          The slope <em>isn't</em> free of units: measured in pounds and units, it's <code>{fam.dq(p).toFixed(4)}</code>.
          If we measure price in pence instead (×100) and quantity in tenths of a unit (×10), the slope becomes <code>{(fam.dq(p) / 10).toFixed(5)}</code>.
        </p>
        <p>
          The elasticity, though, is exactly the same:
          <code>|ε| = {epsVal.toFixed(6)}</code> in pounds and units, and <code>|ε| = {epsVal.toFixed(6)}</code> in pence and tenths,
          because the units cancel out of the ratio.
        </p>
      </div>
    {/if}
  </div>

  <p class="caption">
    On every smooth demand curve, the tangent at the point (p, q) meets the quantity axis at (0, q − p · q′) and the price axis at (p − q/q′, 0). The upper segment (blue) divided by the lower segment (red) is always exactly the point elasticity, |ε| = |q′ · p / q|, and when |ε| = 1, the point cuts the tangent exactly in half.
  </p>
</div>

<style>
  .fig-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.25rem;
    margin: 2rem auto;
    max-width: 680px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .measure {
    width: 100%;
    height: 0;
  }
  .controls-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .fam-selector {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
    width: 100%;
  }
  .ctrl-label {
    font-family: var(--font-mono, monospace);
    font-size: 0.8rem;
    color: #4a5568;
    font-weight: 600;
  }
  .btn-group {
    display: flex;
    flex-wrap: wrap;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
    max-width: 100%;
  }
  .btn-tab {
    background: #f8fafc;
    border: none;
    padding: 0.35rem 0.5rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    color: #475569;
    cursor: pointer;
    border-right: 1px solid #cbd5e1;
    border-bottom: 1px solid #cbd5e1;
    transition: all 0.15s ease;
    flex: 1 1 auto;
    text-align: center;
  }
  .btn-tab:last-child {
    border-right: none;
  }
  .btn-tab:hover {
    background: #f1f5f9;
  }
  .btn-tab.active {
    background: var(--squidink, #232f3e);
    color: #ffffff;
    font-weight: 600;
  }
  .presets {
    display: flex;
    gap: 0.4rem;
  }
  .btn-preset {
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #4338ca;
    padding: 0.25rem 0.55rem;
    border-radius: 4px;
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-preset:hover {
    background: #e0e7ff;
  }

  .readout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.6rem;
    background: #f8fafc;
    padding: 0.85rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    border: 1px solid #e2e8f0;
  }
  .metric-col {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .m-label {
    font-family: var(--font-mono, monospace);
    font-size: 0.68rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .m-val {
    font-family: var(--font-mono, monospace);
    font-size: 1.15rem;
    font-weight: 700;
    color: #1e293b;
  }
  .m-val.highlight {
    color: var(--violet, #7c5aed);
  }
  .upper-metric .m-val {
    color: #2074d5;
  }
  .lower-metric .m-val {
    color: #df2a5d;
  }
  .m-sub {
    font-family: var(--font-mono, monospace);
    font-size: 0.68rem;
    color: #94a3b8;
  }

  .plot-container {
    width: 100%;
    margin-bottom: 0.75rem;
    user-select: none;
    touch-action: none;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .grid-line {
    stroke: #f1f5f9;
    stroke-width: 1;
  }
  .rule-line {
    stroke: #94a3b8;
    stroke-width: 1.25;
  }
  .axis-num {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    fill: #64748b;
  }
  .axis-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    font-weight: 600;
    fill: #475569;
  }
  .curve {
    fill: none;
    stroke: #1e293b;
    stroke-width: 2.5;
  }
  .pin-dot {
    fill: none;
    stroke: #94a3b8;
    stroke-width: 1.5;
    stroke-dasharray: 2 2;
  }
  .pin-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    fill: #94a3b8;
  }

  /* Tangent Segments */
  .seg.upper {
    stroke: #2074d5;
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  .seg.lower {
    stroke: #df2a5d;
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  .intercept-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    font-weight: 600;
  }
  .intercept-lbl.upper {
    fill: #2074d5;
  }
  .intercept-lbl.lower {
    fill: #df2a5d;
  }

  /* Draggable Handle */
  .drag-handle {
    cursor: grab;
  }
  .drag-handle:active {
    cursor: grabbing;
  }
  .handle-halo {
    fill: #7c5aed;
    fill-opacity: 0.15;
  }
  .handle-core {
    fill: #7c5aed;
    stroke: #ffffff;
    stroke-width: 2;
  }
  .handle-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 10.5px;
    font-weight: 700;
    fill: #1e293b;
    paint-order: stroke;
    stroke: #ffffff;
    stroke-width: 3px;
    stroke-linecap: butt;
    stroke-linejoin: miter;
  }

  .slider-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    width: 100%;
  }
  .slider-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 0.78rem;
    color: #475569;
  }
  input[type="range"] {
    flex: 1 1 120px;
    accent-color: var(--violet, #7c5aed);
    cursor: pointer;
    min-width: 80px;
  }
  .slider-val {
    font-family: var(--font-mono, monospace);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--violet, #7c5aed);
    text-align: right;
  }

  .unit-toggle-box {
    margin-bottom: 0.75rem;
  }
  .btn-unit-toggle {
    background: transparent;
    border: none;
    color: var(--violet, #7c5aed);
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }
  .unit-demo-content {
    background: #f1f5f9;
    border-left: 3px solid var(--violet, #7c5aed);
    padding: 0.6rem 0.85rem;
    margin-top: 0.4rem;
    font-size: 0.8rem;
    color: #334155;
    line-height: 1.45;
  }
  .unit-demo-content code {
    font-family: var(--font-mono, monospace);
    background: #e2e8f0;
    padding: 0.1rem 0.25rem;
    border-radius: 3px;
  }

  .caption {
    font-size: 0.85rem;
    color: #64748b;
    line-height: 1.5;
    margin: 0.5rem 0 0 0;
    border-top: 1px solid #f1f5f9;
    padding-top: 0.75rem;
  }
</style>
