<script>
  import precomputed from "../precomputed.js";
  import katexify from "../katexify.js";
  import { SKY, COSMOS, GREEN, NEUTRAL, ACCENT, HANDLE, CARD, FAINT, GRID, AXIS, LABEL, INK } from "../palette.js";

  const scenarios = precomputed.drift;

  // Selected scenario index: 0, 1, 2, 3 (default index 1 is base fleet 3.24%)
  let selectedIdx = 1;
  $: active = scenarios[selectedIdx];

  // Sizing
  let boxWidth = 600;
  $: BW = Math.max(280, boxWidth);

  // Layouts
  const pad = { top: 20, right: 24, bottom: 38, left: 42 };
  const hPlot = 190;
  $: plotW = Math.max(100, BW - pad.left - pad.right);
  $: plotH = hPlot - pad.top - pad.bottom;

  // PR Curve scale
  $: xPR = (r) => pad.left + r * plotW;
  $: yPR = (p) => pad.top + (1 - p) * plotH;

  // PR curve path
  $: activePrPath = (() => {
    if (!active.curve || active.curve.length === 0) return "";
    return active.curve.reduce((acc, pt, i) => {
      const x = xPR(pt.recall);
      const y = yPR(pt.precision);
      return i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, "");
  })();

  // Operating peak on active PR curve
  $: peakPt = (() => {
    let best = active.curve[0];
    for (const r of active.curve) {
      if (r.f1 > best.f1) best = r;
    }
    return best;
  })();

  $: peakX = xPR(peakPt ? peakPt.recall : 0.5);
  $: peakY = yPR(peakPt ? peakPt.precision : 0.5);
</script>

<h1 class="body-header">The Drift: How Prevalence Re-weights the Objective</h1>

<p class="body-text">
  Teams routinely report {@html katexify("F_1")} in quarterly reviews or track it in dashboards to monitor
  whether a deployed model is decaying over time.
</p>

<p class="body-text">
  Here's the catch: <span class="bold">F1 isn't a property of the model alone</span>. It depends
  heavily on the base rate (or prevalence) of the positive class.
</p>

<p class="body-text">
  In the simulation below, <span class="bold">the model is frozen</span>. Neither the risk score
  distribution of healthy pumps nor that of degrading pumps moves. The only thing that changes is
  the weather: during a summer heatwave, a larger percentage of the fleet begins to degrade. Try
  switching between the scenarios to see what happens.
</p>

<div class="lab-container" id="drift-figure">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>

    <div class="drift-controls">
      <span class="control-title">Fleet Degradation Scenario:</span>
      <div class="scenario-buttons">
        {#each scenarios as sc, i}
          <button
            class="scenario-btn {i === selectedIdx ? 'active' : ''}"
            on:click={() => (selectedIdx = i)}
          >
            <span class="sc-label">{(sc.prevalence * 100).toFixed(2)}% prevalence</span>
            <span class="sc-sub">{(sc.degraded * 100).toFixed(1)}% degraded fleet</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Impact Cards -->
    <div class="impact-grid">
      <div class="impact-card">
        <div class="impact-label">FLEET PREVALENCE</div>
        <div class="impact-val text-dark">{(active.prevalence * 100).toFixed(2)}%</div>
        <div class="impact-hint">Model untouched</div>
      </div>

      <div class="impact-card highlight">
        <div class="impact-label">MAX ACHIEVABLE F1</div>
        <div class="impact-val text-green">{active.f1max.toFixed(4)}</div>
        <div class="impact-hint">Swings 0.399 → 0.590</div>
      </div>

      <div class="impact-card">
        <div class="impact-label">OPTIMAL THRESHOLD (F1/2)</div>
        <div class="impact-val text-handle">{active.tStar.toFixed(4)}</div>
        <div class="impact-hint">Moves 0.1996 → 0.2948</div>
      </div>

      <div class="impact-card">
        <div class="impact-label">IMPLIED COST RATIO</div>
        <div class="impact-val text-purple">{active.costRatio.toFixed(2)}×</div>
        <div class="impact-hint">Swings 4.01× → 2.39×</div>
      </div>
    </div>

    <!-- Live PR Curve Under Shifted Prevalence -->
    <div class="chart-wrapper">
      <div class="chart-title">
        <span>Live Precision-Recall Curve at {(active.prevalence * 100).toFixed(2)}% Prevalence</span>
        <span class="chart-sub">F1max peak marked in green</span>
      </div>
      <svg viewBox="0 0 {BW} {hPlot}" width={BW} height={hPlot} class="plot-svg">
        <!-- Grid -->
        {#each [0.25, 0.5, 0.75] as tick}
          <line x1={xPR(0)} x2={xPR(1)} y1={yPR(tick)} y2={yPR(tick)} stroke={GRID} stroke-width="1" />
          <line x1={xPR(tick)} x2={xPR(tick)} y1={yPR(0)} y2={yPR(1)} stroke={GRID} stroke-width="1" />
          <text x={pad.left - 6} y={yPR(tick) + 4} fill={LABEL} font-size="10" text-anchor="end">
            {(tick * 100).toFixed(0)}%
          </text>
          <text x={xPR(tick)} y={hPlot - pad.bottom + 16} fill={LABEL} font-size="10" text-anchor="middle">
            {(tick * 100).toFixed(0)}%
          </text>
        {/each}

        <!-- Axes -->
        <line x1={xPR(0)} x2={xPR(1)} y1={yPR(0)} y2={yPR(0)} stroke={AXIS} stroke-width="1.5" />
        <line x1={xPR(0)} x2={xPR(0)} y1={yPR(0)} y2={yPR(1)} stroke={AXIS} stroke-width="1.5" />

        <!-- Ghost reference curve (base scenario 3.24%) -->
        {#if selectedIdx !== 1}
          <path
            d={scenarios[1].curve.reduce((acc, pt, i) => {
              const x = xPR(pt.recall);
              const y = yPR(pt.precision);
              return i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
            }, "")}
            fill="none"
            stroke={NEUTRAL}
            stroke-width="1.5"
            stroke-dasharray="3,3"
            opacity="0.6"
          />
        {/if}

        <!-- Active PR Curve -->
        <path d={activePrPath} fill="none" stroke={SKY} stroke-width="2.5" />

        <!-- Peak Point Marker -->
        <circle cx={peakX} cy={peakY} r="6" fill={GREEN} stroke="#ffffff" stroke-width="2" />
        <text
          x={peakX + 10}
          y={peakY - 10}
          fill={INK}
          font-size="11"
          font-weight="bold"
          class="dot-label"
        >
          F1max = {active.f1max.toFixed(3)}
        </text>

        <!-- Labels -->
        <text x={BW - pad.right} y={hPlot - 6} fill={LABEL} font-size="11" text-anchor="end">
          Recall
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
  </div>
</div>

<p class="body-text">
  Notice what happens as prevalence rises from <span class="mono">1.95%</span> to <span class="mono">12.32%</span>:
</p>

<ul class="body-list">
  <li>The maximum achievable {@html katexify("F_1")} leaps from <span class="mono bold">0.3992</span> to <span class="mono bold">0.5897</span>, making the model look nearly 50% "better" without improving a single prediction.</li>
  <li>The optimal threshold shifts from <span class="mono bold">0.1996</span> to <span class="mono bold">0.2948</span>.</li>
  <li>The implied cost ratio falls from <span class="mono bold">4.01×</span> to <span class="mono bold">2.39×</span>.</li>
</ul>

<p class="body-text">
  In other words, when prevalence drifts,
  <span class="bold">F1 silently re-weights your engineering objective</span>. A metric that
  changes which trade-off you make, simply because rare events became slightly more frequent,
  isn't a neutral benchmark.
</p>

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
  }

  .measure {
    width: 100%;
    height: 0;
    pointer-events: none;
  }

  .drift-controls {
    margin-bottom: 1.25rem;
  }

  .control-title {
    display: block;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #718096;
    margin-bottom: 0.5rem;
  }

  .scenario-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.5rem;
  }

  .scenario-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.55rem 0.6rem;
    cursor: pointer;
    text-align: left;
    display: flex;
    flex-direction: column;
    transition: all 0.15s ease;
  }

  .scenario-btn:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  .scenario-btn.active {
    background: #eef2ff;
    border-color: var(--violet, #7c5aed);
    box-shadow: 0 0 0 1px var(--violet, #7c5aed);
  }

  .sc-label {
    font-size: 0.88rem;
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    color: #1e293b;
  }

  .sc-sub {
    font-size: 0.72rem;
    color: #718096;
    margin-top: 0.15rem;
  }

  .impact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .impact-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .impact-card.highlight {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }

  .impact-label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #718096;
  }

  .impact-val {
    font-size: 1.45rem;
    font-family: var(--font-heavy);
    margin: 0.3rem 0;
  }

  .impact-hint {
    font-size: 0.72rem;
    color: #718096;
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

  .body-list {
    max-width: 600px;
    margin: 1rem auto;
    padding-left: 1.5rem;
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--squid-ink, #232f3e);
  }

  .body-list li {
    margin-bottom: 0.5rem;
  }

  .text-dark { color: #1e293b; }
  .text-green { color: #16a34a; }
  .text-handle { color: #d97706; }
  .text-purple { color: #7c5aed; }
  .mono { font-family: var(--font-mono, monospace); }
  .bold { font-weight: bold; }
</style>
