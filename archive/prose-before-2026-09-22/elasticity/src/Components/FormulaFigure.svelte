<script>
  /*
    FormulaFigure.svelte — Drift chart.
    Error against price gap on log-x axis (1% to 100%).
    Both formulas understate when applied to the other curve family:
      1. Midpoint on Constant Elasticity (truth 1.6)
      2. Log-difference on Linear Line (truth = point ε at midpoint)
  */
  import { log, linear, clampW } from "../chart.js";

  let boxWidth = $state(600);
  let W = $derived(clampW(boxWidth, 320));
  const H = 260;
  const M = { top: 22, right: 30, bottom: 38, left: 55 };

  // The 5 key data points from the spec
  const driftData = [
    { gap: 1, midErr: -0.0013, logErr: -0.0005 },
    { gap: 10, midErr: -0.1299, logErr: -0.0464 },
    { gap: 25, midErr: -0.8072, logErr: -0.2918 },
    { gap: 50, midErr: -3.1663, logErr: -1.1975 },
    { gap: 100, midErr: -11.7672, logErr: -5.3605 },
  ];

  // Log scale for x: 1% to 100%
  let x = $derived(log(1, 100, M.left, W - M.right));
  // Linear scale for y: 0% down to -14%
  let y = $derived(linear(0, -13, M.top, H - M.bottom));

  let hoveredPoint = $state(null);

  // Generate continuous curve paths
  let midPts = $derived(driftData.map((d) => [x(d.gap), y(d.midErr)]));
  let logPts = $derived(driftData.map((d) => [x(d.gap), y(d.logErr)]));

  let midPath = $derived(
    midPts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`).join(" ")
  );
  let logPath = $derived(
    logPts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`).join(" ")
  );

  const xTicks = [1, 2, 5, 10, 25, 50, 100];
  const yTicks = [0, -2, -4, -6, -8, -10, -12];
</script>

<div class="drift-card" id="formula-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <div class="card-header">
    <h3 class="card-title">Formula Drift: How Two-Point Approximations Understate</h3>
    <p class="card-sub">
      Textbooks teach both the midpoint formula and log differences as interchangeable ways to compute elasticity between two prices. In reality, each formula is exact for only one functional form — and both systematically understate when applied to the wrong curve.
    </p>
  </div>

  <div class="legend-row">
    <div class="legend-item">
      <span class="line-swatch mid-swatch"></span>
      <span class="legend-text">Midpoint formula on Constant Elasticity (truth = 1.6)</span>
    </div>
    <div class="legend-item">
      <span class="line-swatch log-swatch"></span>
      <span class="legend-text">Log formula on Linear Demand (truth = point ε at midpoint)</span>
    </div>
  </div>

  <div class="plot-box">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Drift of elasticity formulas vs price gap">
      <!-- Grid -->
      {#each xTicks as t}
        <line class="grid-line" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
        <text class="axis-num" x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}%</text>
      {/each}
      {#each yTicks as t}
        <line class="grid-line" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
        <text class="axis-num" x={M.left - 6} y={y(t) + 4} text-anchor="end">{t}%</text>
      {/each}

      <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
      <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">Price Gap (Δp / p₁)</text>
      <text
        class="axis-title"
        transform={`rotate(-90) translate(${-(M.top + H - M.bottom) / 2}, 16)`}
        text-anchor="middle">Formula Error (%)</text
      >

      <!-- Drift Curves -->
      <path class="drift-curve mid-curve" d={midPath} />
      <path class="drift-curve log-curve" d={logPath} />

      <!-- Data Dots -->
      {#each driftData as d}
        <circle
          role="presentation"
          class="data-dot mid-dot"
          cx={x(d.gap)}
          cy={y(d.midErr)}
          r="4.5"
          onpointerenter={() => (hoveredPoint = { ...d, type: "mid" })}
          onpointerleave={() => (hoveredPoint = null)}
        />
        <circle
          role="presentation"
          class="data-dot log-dot"
          cx={x(d.gap)}
          cy={y(d.logErr)}
          r="4.5"
          onpointerenter={() => (hoveredPoint = { ...d, type: "log" })}
          onpointerleave={() => (hoveredPoint = null)}
        />
      {/each}

      <!-- Labels at 100% -->
      <text class="curve-lbl mid-lbl" x={x(100) - 6} y={y(-11.7672) + 14} text-anchor="end">−11.77% (Midpoint)</text>
      <text class="curve-lbl log-lbl" x={x(100) - 6} y={y(-5.3605) - 6} text-anchor="end">−5.36% (Log)</text>
    </svg>
  </div>

  <div class="table-wrap">
    <table class="drift-table">
      <thead>
        <tr>
          <th>Price Gap</th>
          <th>Midpoint Formula on CES (truth 1.6)</th>
          <th>Log Formula on Line (truth = midpoint ε)</th>
        </tr>
      </thead>
      <tbody>
        {#each driftData as row}
          <tr>
            <td class="tbl-gap">{row.gap}%</td>
            <td class="tbl-mid">{row.midErr.toFixed(4)}%</td>
            <td class="tbl-log">{row.logErr.toFixed(4)}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="jensen-note">
    <strong>The hidden geometric cause:</strong> On a straight line, the arithmetic mean of two quantities (q₁ + q₂) / 2 is <em>strictly identical</em> to the quantity at the average price q((p₁ + p₂) / 2). But on the convex constant elasticity curve, Jensen's inequality kicks in: the average quantity differs from the quantity at the average price by 0.52% at a 10% price gap, 14.2% at 50%, and 77.7% at 100%.
  </div>

  <p class="caption">
    <strong>Figure 5. Approximation drift across price gaps.</strong> Both formulas are completely innocuous at small gaps (&lt; 10%, where errors are under 0.15%), explaining why the discrepancy is rarely noticed in classroom exercises. At larger price shocks, the midpoint formula underestimates constant elasticity by over 11%.
  </p>
</div>

<style>
  .drift-card {
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
  .card-header {
    margin-bottom: 1rem;
  }
  .card-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--squidink, #232f3e);
    margin: 0 0 0.4rem 0;
  }
  .card-sub {
    font-size: 0.88rem;
    color: #475569;
    line-height: 1.5;
    margin: 0;
  }

  .legend-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 0.85rem;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .line-swatch {
    width: 14px;
    height: 3px;
    border-radius: 2px;
  }
  .mid-swatch {
    background: #2563eb;
  }
  .log-swatch {
    background: #df2a5d;
  }
  .legend-text {
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    color: #475569;
  }

  .plot-box svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .grid-line {
    stroke: #f1f5f9;
    stroke-width: 1;
  }
  .rule {
    stroke: #cbd5e1;
    stroke-width: 1.25;
  }
  .axis-num {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    fill: #64748b;
  }
  .axis-title {
    font-family: var(--font-mono, monospace);
    font-size: 10.5px;
    font-weight: 600;
    fill: #475569;
  }
  .drift-curve {
    fill: none;
    stroke-width: 2.5;
  }
  .mid-curve {
    stroke: #2563eb;
  }
  .log-curve {
    stroke: #df2a5d;
  }
  .data-dot {
    cursor: pointer;
    transition: r 0.15s;
  }
  .data-dot:hover {
    r: 6.5;
  }
  .mid-dot {
    fill: #2563eb;
    stroke: #ffffff;
    stroke-width: 1.5;
  }
  .log-dot {
    fill: #df2a5d;
    stroke: #ffffff;
    stroke-width: 1.5;
  }
  .curve-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    font-weight: 700;
  }
  .mid-lbl {
    fill: #2563eb;
  }
  .log-lbl {
    fill: #df2a5d;
  }

  .table-wrap {
    margin-top: 1rem;
    overflow-x: auto;
  }
  .drift-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
  }
  .drift-table th {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    padding: 0.45rem 0.6rem;
    text-align: right;
    color: #475569;
    font-weight: 600;
  }
  .drift-table th:first-child {
    text-align: left;
  }
  .drift-table td {
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid #f1f5f9;
    text-align: right;
  }
  .drift-table td:first-child {
    text-align: left;
    font-weight: 600;
  }
  .tbl-mid {
    color: #2563eb;
  }
  .tbl-log {
    color: #df2a5d;
  }

  .jensen-note {
    margin-top: 0.85rem;
    background: #f8fafc;
    border-left: 3px solid var(--violet, #7c5aed);
    padding: 0.65rem 0.85rem;
    font-size: 0.82rem;
    color: #334155;
    line-height: 1.5;
  }

  .caption {
    font-size: 0.85rem;
    color: #64748b;
    line-height: 1.5;
    margin: 0.75rem 0 0 0;
    border-top: 1px solid #f1f5f9;
    padding-top: 0.75rem;
  }
</style>
