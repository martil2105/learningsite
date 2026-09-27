<script>
  import precomputed from "../precomputed.js";
  import { sample } from "../datasets.js";
  import { SKY, COSMOS, GREEN, NEUTRAL, ACCENT, HANDLE, CARD, FAINT, GRID, AXIS, LABEL, INK } from "../palette.js";

  const { totalPositives } = precomputed.hook;
  const curve = precomputed.hook.curve;

  // We also load the 6,000 raw validation rows for instantaneous exact evaluation
  const baseRows = sample(6000, 0.055, 20260908);

  // User interactive state
  let threshold = 0.45; // Open slightly off-peak so reader gets to slide
  let userBestT = null;
  let userBestF1 = 0;

  // Sizing
  let boxWidth = 600;
  $: BW = Math.max(280, boxWidth);
  $: isNarrow = BW < 560;

  // Evaluate current metrics reactively from the rows
  $: current = (() => {
    const t = threshold;
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (let i = 0; i < baseRows.length; i++) {
      const r = baseRows[i];
      if (r.score >= t) {
        if (r.y === 1) tp++;
        else fp++;
      } else {
        if (r.y === 1) fn++;
        else tn++;
      }
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    const recall = totalPositives > 0 ? tp / totalPositives : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const ratio = t > 0 && t < 1 ? (1 - t) / t : 999;
    return { t, tp, fp, fn, tn, precision, recall, f1, ratio, flagged: tp + fp };
  })();

  // Track the best F1 the user has discovered
  $: if (current.f1 > userBestF1) {
    userBestF1 = current.f1;
    userBestT = current.t;
  }

  function recordBest() {
    userBestF1 = current.f1;
    userBestT = current.t;
  }

  function setPreset(t) {
    threshold = t;
  }

  // Chart layouts
  const pad = { top: 20, right: 24, bottom: 36, left: 44 };
  const hPR = 220;
  const hF1 = 150;

  // Scales for PR curve: Recall in [0, 1], Precision in [0, 1]
  $: prPlotW = Math.max(100, BW - pad.left - pad.right);
  $: prPlotH = hPR - pad.top - pad.bottom;
  $: xPR = (r) => pad.left + r * prPlotW;
  $: yPR = (p) => pad.top + (1 - p) * prPlotH;

  // Scales for F1 vs Threshold curve: t in [0, 0.70], F1 in [0, 0.60]
  $: maxT = 0.70;
  $: maxF1Scale = 0.60;
  $: f1PlotW = Math.max(100, BW - pad.left - pad.right);
  $: f1PlotH = hF1 - pad.top - pad.bottom;
  $: xF1 = (t) => pad.left + (Math.min(maxT, Math.max(0, t)) / maxT) * f1PlotW;
  $: yF1 = (f) => pad.top + (1 - Math.min(maxF1Scale, Math.max(0, f)) / maxF1Scale) * f1PlotH;

  // SVG Paths
  $: prPathD = (() => {
    if (!curve || curve.length === 0) return "";
    return curve.reduce((acc, pt, i) => {
      const x = xPR(pt.recall);
      const y = yPR(pt.precision);
      return i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, "");
  })();

  $: f1PathD = (() => {
    if (!curve || curve.length === 0) return "";
    const pts = curve.filter((pt) => pt.t <= maxT);
    return pts.reduce((acc, pt, i) => {
      const x = xF1(pt.t);
      const y = yF1(pt.f1);
      return i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, "");
  })();

  // Current position on PR curve and F1 curve
  $: currentPRPos = { x: xPR(current.recall), y: yPR(current.precision) };
  $: currentF1Pos = { x: xF1(current.t), y: yF1(current.f1) };

  // Formatted display strings
  $: f1Display = current.f1.toFixed(3);
  /*
    Decimals, not percentages. These three cards sit side by side and the whole
    point of the figure is that F1 is the harmonic mean of the other two — with
    precision at "53.8%" and F1 at "0.392" the reader cannot see that F1 lies
    between them at all, and the prose talks in decimals throughout.
  */
  $: precDisplay = current.precision.toFixed(3);
  $: recDisplay = current.recall.toFixed(3);
  $: ratioDisplay = current.ratio.toFixed(2);
  $: bestF1Display = userBestF1 > 0 ? userBestF1.toFixed(3) : "—";
  $: bestTDisplay = userBestT !== null ? userBestT.toFixed(3) : "—";
</script>

<div class="lab-container" id="threshold-hunt">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>

    <div class="lab-header">
      <div class="title-group">
        <span class="badge">Live Hunt</span>
        <h2 class="lab-title">Find the Maximum F1 Threshold</h2>
      </div>
      <div class="preset-group">
        <span class="preset-label">Jump to:</span>
        <!-- Coarse navigation only. Two of these used to be 0.255 and
             "0.158 (Empirical peak)" — which handed the reader the answer to
             the exercise the whole article is built on before they had made a
             single move. Neutral values, none of them the peak. -->
        <button class="chip" on:click={() => setPreset(0.50)}>0.50 (the usual default)</button>
        <button class="chip" on:click={() => setPreset(0.20)}>0.20</button>
        <button class="chip" on:click={() => setPreset(0.05)}>0.05</button>
      </div>
    </div>

    <!-- Main Slider Control -->
    <div class="slider-control">
      <div class="slider-labels">
        <label for="f1-threshold-slider" class="control-label">
          Decision Threshold <span class="mono bold text-handle">{threshold.toFixed(3)}</span>
        </label>
        <span class="cost-hint">
          Asserting: 1 missed failure is worth <span class="mono bold">{ratioDisplay}</span> false alarms
        </span>
      </div>
      <input
        id="f1-threshold-slider"
        type="range"
        min="0.02"
        max="0.65"
        step="0.002"
        bind:value={threshold}
        class="custom-slider"
      />
      <div class="slider-ticks">
        <span>0.05 (Aggressive alerts)</span>
        <span>0.25</span>
        <span>0.50</span>
        <span>0.65 (Strict)</span>
      </div>
    </div>

    <!-- Live Readouts Panel -->
    <div class="metrics-grid">
      <div class="metric-card f1-box">
        <div class="metric-meta">F1 SCORE</div>
        <div class="metric-value text-green">{f1Display}</div>
        <div class="metric-sub">
          Best found: <span class="mono bold">{bestF1Display}</span> at t=<span class="mono">{bestTDisplay}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-meta">PRECISION</div>
        <div class="metric-value text-sky">{precDisplay}</div>
        <div class="metric-sub">{current.tp} true / {current.flagged} inspections</div>
      </div>

      <div class="metric-card">
        <div class="metric-meta">RECALL</div>
        <div class="metric-value text-cosmos">{recDisplay}</div>
        <div class="metric-sub">{current.tp} caught / {totalPositives} failures</div>
      </div>

      <div class="metric-card">
        <div class="metric-meta">FLEET OUTCOME</div>
        <div class="metric-outcome">
          <span class="outcome-pill good"><b>{current.tp}</b> caught</span>
          <span class="outcome-pill bad"><b>{current.fn}</b> missed</span>
          <span class="outcome-pill warn"><b>{current.fp}</b> alarms</span>
        </div>
        <div class="metric-sub">{current.tn} clean pumps untouched</div>
      </div>
    </div>

    <!-- Charts Container -->
    <div class="charts-stack">
      <!-- Chart 1: Precision-Recall Curve -->
      <div class="chart-wrapper">
        <div class="chart-title">
          <span>Precision-Recall Curve</span>
          <span class="chart-sub">Orange marker moves as threshold changes</span>
        </div>
        <svg viewBox="0 0 {BW} {hPR}" width={BW} height={hPR} class="plot-svg">
          <!-- Grid Lines -->
          {#each [0.25, 0.5, 0.75] as tick}
            <line
              x1={xPR(0)}
              x2={xPR(1)}
              y1={yPR(tick)}
              y2={yPR(tick)}
              stroke={GRID}
              stroke-width="1"
            />
            <line
              x1={xPR(tick)}
              x2={xPR(tick)}
              y1={yPR(0)}
              y2={yPR(1)}
              stroke={GRID}
              stroke-width="1"
            />
            <text x={pad.left - 8} y={yPR(tick) + 4} fill={LABEL} font-size="10" text-anchor="end">
              {tick.toFixed(2)}
            </text>
            <text x={xPR(tick)} y={hPR - pad.bottom + 16} fill={LABEL} font-size="10" text-anchor="middle">
              {tick.toFixed(2)}
            </text>
          {/each}

          <!-- Axes -->
          <line x1={xPR(0)} x2={xPR(1)} y1={yPR(0)} y2={yPR(0)} stroke={AXIS} stroke-width="1.5" />
          <line x1={xPR(0)} x2={xPR(0)} y1={yPR(0)} y2={yPR(1)} stroke={AXIS} stroke-width="1.5" />

          <!-- PR Curve Line -->
          <path d={prPathD} fill="none" stroke={SKY} stroke-width="2.5" />

          <!-- Current Operating Dot -->
          <circle
            cx={currentPRPos.x}
            cy={currentPRPos.y}
            r="6.5"
            fill={HANDLE}
            stroke="#ffffff"
            stroke-width="2.5"
          />
          <text
            x={currentPRPos.x + (currentPRPos.x > BW - 80 ? -12 : 12)}
            y={currentPRPos.y - 10}
            fill={INK}
            font-size="11"
            font-weight="bold"
            text-anchor={currentPRPos.x > BW - 80 ? "end" : "start"}
            class="dot-label"
          >
            t={current.t.toFixed(3)}
          </text>

          <!-- Axis Titles -->
          <text x={BW - pad.right} y={hPR - 6} fill={LABEL} font-size="11" text-anchor="end">
            Recall (failures caught)
          </text>
          <text
            transform="rotate(-90)"
            x={-pad.top}
            y={12}
            fill={LABEL}
            font-size="11"
            text-anchor="end"
          >
            Precision
          </text>
        </svg>
      </div>

      <!-- Chart 2: F1 Score vs Threshold Curve -->
      <div class="chart-wrapper">
        <div class="chart-title">
          <span>F1 Score as a Function of Threshold</span>
          <span class="chart-sub">The top is almost flat — every threshold from 0.148 to 0.265 scores within 0.005 of the best</span>
        </div>
        <svg viewBox="0 0 {BW} {hF1}" width={BW} height={hF1} class="plot-svg">
          <!-- Grid Lines -->
          {#each [0.2, 0.4] as tick}
            <line
              x1={xF1(0)}
              x2={xF1(maxT)}
              y1={yF1(tick)}
              y2={yF1(tick)}
              stroke={GRID}
              stroke-width="1"
            />
            <text x={pad.left - 8} y={yF1(tick) + 4} fill={LABEL} font-size="10" text-anchor="end">
              {tick.toFixed(1)}
            </text>
          {/each}
          {#each [0.1, 0.2, 0.3, 0.4, 0.5, 0.6] as tick}
            <line
              x1={xF1(tick)}
              x2={xF1(tick)}
              y1={yF1(0)}
              y2={yF1(maxF1Scale)}
              stroke={GRID}
              stroke-width="1"
            />
            <text x={xF1(tick)} y={hF1 - pad.bottom + 16} fill={LABEL} font-size="10" text-anchor="middle">
              {tick.toFixed(1)}
            </text>
          {/each}

          <!-- Axes -->
          <line x1={xF1(0)} x2={xF1(maxT)} y1={yF1(0)} y2={yF1(0)} stroke={AXIS} stroke-width="1.5" />
          <line x1={xF1(0)} x2={xF1(0)} y1={yF1(0)} y2={yF1(maxF1Scale)} stroke={AXIS} stroke-width="1.5" />

          <!-- F1 Curve -->
          <path d={f1PathD} fill="none" stroke={GREEN} stroke-width="2.5" />

          <!-- Current Threshold Vertical Cursor -->
          <line
            x1={currentF1Pos.x}
            x2={currentF1Pos.x}
            y1={yF1(0)}
            y2={yF1(maxF1Scale)}
            stroke={HANDLE}
            stroke-width="2"
            stroke-dasharray="3,3"
          />

          <!-- Intersection Dot -->
          <circle
            cx={currentF1Pos.x}
            cy={currentF1Pos.y}
            r="5.5"
            fill={HANDLE}
            stroke="#ffffff"
            stroke-width="2"
          />

          <!-- Axis Titles -->
          <text x={BW - pad.right} y={hF1 - 6} fill={LABEL} font-size="11" text-anchor="end">
            Threshold, t
          </text>
          <text
            transform="rotate(-90)"
            x={-pad.top}
            y={12}
            fill={LABEL}
            font-size="11"
            text-anchor="end"
          >
            F1
          </text>
        </svg>
      </div>
    </div>
  </div>
</div>

<style>
  .lab-container {
    max-width: 760px;
    margin: 2rem auto;
    padding: 0 0.5rem;
  }

  .card {
    background: var(--white, #ffffff);
    border: 1px solid var(--faint, #e2e8f0);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    position: relative;
  }

  .measure {
    width: 100%;
    height: 0;
    pointer-events: none;
  }

  .lab-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .badge {
    background: #eef2ff;
    color: var(--violet, #7c5aed);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 0.2rem 0.55rem;
    border-radius: 4px;
  }

  .lab-title {
    font-family: var(--font-heavy);
    font-size: 1.25rem;
    margin: 0;
    color: var(--squid-ink, #232f3e);
  }

  .preset-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .preset-label {
    font-size: 0.82rem;
    color: #718096;
  }

  .chip {
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.25rem 0.6rem;
    font-size: 0.8rem;
    font-family: var(--font-mono, monospace);
    color: #2d3748;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .chip:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  .slider-control {
    background: #f8fafc;
    border: 1px solid #edf2f7;
    border-radius: 8px;
    padding: 1rem 1.1rem;
    margin-bottom: 1.25rem;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .control-label {
    font-size: 0.95rem;
    font-family: var(--font-main);
    color: #1a202c;
  }

  .cost-hint {
    font-size: 0.85rem;
    color: #4a5568;
  }

  .custom-slider {
    width: 100%;
    margin: 0.4rem 0;
    cursor: pointer;
    accent-color: #ff9900;
  }

  .slider-ticks {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    color: #a0aec0;
    font-family: var(--font-mono, monospace);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .metric-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.75rem 0.85rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .metric-card.f1-box {
    border-color: #bbf7d0;
    background: #f0fdf4;
  }

  .metric-meta {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #718096;
    margin-bottom: 0.25rem;
  }

  .metric-value {
    font-size: 1.6rem;
    font-family: var(--font-heavy);
    line-height: 1.1;
    margin-bottom: 0.35rem;
  }

  .metric-sub {
    font-size: 0.75rem;
    color: #4a5568;
    line-height: 1.3;
  }

  .metric-outcome {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
    margin-bottom: 0.35rem;
  }

  .outcome-pill {
    font-size: 0.72rem;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
  }
  .outcome-pill.good { background: #dcfce7; color: #166534; }
  .outcome-pill.bad { background: #fee2e2; color: #991b1b; }
  .outcome-pill.warn { background: #fef3c7; color: #92400e; }

  .text-green { color: #16a34a; }
  .text-sky { color: #2074d5; }
  .text-cosmos { color: #df2a5d; }
  .text-handle { color: #d97706; }

  .charts-stack {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .chart-wrapper {
    background: #fafbfc;
    border: 1px solid #edf2f7;
    border-radius: 8px;
    padding: 0.75rem 0.75rem 0.25rem 0.75rem;
  }

  .chart-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.25rem;
    padding: 0 0.5rem;
    flex-wrap: wrap;
  }

  .chart-sub {
    font-size: 0.75rem;
    color: #718096;
    font-weight: normal;
  }

  .plot-svg {
    display: block;
    width: 100%;
    overflow: visible;
  }

  .dot-label {
    stroke: #ffffff;
    stroke-width: 3px;
    paint-order: stroke;
  }

  .mono {
    font-family: var(--font-mono, monospace);
  }

  .bold {
    font-weight: bold;
  }

  @media (max-width: 600px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .slider-labels {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
