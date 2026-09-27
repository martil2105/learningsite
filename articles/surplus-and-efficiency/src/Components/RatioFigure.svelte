<script>
  /*
    RatioFigure.svelte — The ratio of the two channels against the cut d:
    misallocation ÷ triangle = q / (q* - q) = (1 - d) / d.
    Plots Triangle (d²), Misallocation (d(1 - d)), and Total (d) against d.
    Highlights the crossing at d = 0.5 (where misallocation peaks at 25%).
  */
  import { linear, clampW } from "../chart.js";

  let boxWidth = $state(600);
  let W = $derived(clampW(boxWidth, 320));
  const H = 280;
  const M = { top: 22, right: 30, bottom: 38, left: 55 };

  const dSteps = [
    { d: 0.01, tri: 0.0001, mis: 0.0099, ratio: 99.0 },
    { d: 0.05, tri: 0.0025, mis: 0.0475, ratio: 19.0 },
    { d: 0.10, tri: 0.0100, mis: 0.0900, ratio: 9.0 },
    { d: 0.20, tri: 0.0400, mis: 0.1600, ratio: 4.0 },
    { d: 0.30, tri: 0.0900, mis: 0.2100, ratio: 2.33 },
    { d: 0.50, tri: 0.2500, mis: 0.2500, ratio: 1.0 },
    { d: 0.80, tri: 0.6400, mis: 0.1600, ratio: 0.25 },
  ];

  let x = $derived(linear(0, 0.8, M.left, W - M.right));
  let y = $derived(linear(0, 0.7, H - M.bottom, M.top));

  // Curves
  let triPts = $derived.by(() => {
    const pts = [];
    for (let dv = 0; dv <= 0.8; dv += 0.01) {
      pts.push([x(dv), y(dv * dv)]);
    }
    return pts;
  });
  let triPath = $derived(
    triPts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`).join(" ")
  );

  let misPts = $derived.by(() => {
    const pts = [];
    for (let dv = 0; dv <= 0.8; dv += 0.01) {
      pts.push([x(dv), y(dv * (1 - dv))]);
    }
    return pts;
  });
  let misPath = $derived(
    misPts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`).join(" ")
  );

  let totPts = $derived.by(() => {
    const pts = [];
    for (let dv = 0; dv <= 0.7; dv += 0.01) {
      pts.push([x(dv), y(dv)]);
    }
    return pts;
  });
  let totPath = $derived(
    totPts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`).join(" ")
  );
</script>

<div class="ratio-card" id="ratio-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <div class="card-head">
    <h3 class="card-title">Misallocation against the triangle</h3>
    <p class="head-sub">
      The ratio of the two losses is (1 − <em>d</em>)/<em>d</em>, the units that still trade divided by the units that no longer do. At a 10% cut, rationing costs 9× the triangle, and at a 1% cut, it costs 99×.
    </p>
  </div>

  <div class="legend-strip">
    <div class="leg-item"><span class="line-swatch sw-tot"></span> Total loss = <em>d</em></div>
    <div class="leg-item"><span class="line-swatch sw-mis"></span> Misallocation = <em>d</em>(1 − <em>d</em>)</div>
    <div class="leg-item"><span class="line-swatch sw-tri"></span> Triangle loss = <em>d</em>²</div>
  </div>

  <div class="plot-box">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Loss shares and crossing point vs quantity cut">
      <!-- Gridlines -->
      {#each [0, 0.2, 0.4, 0.6, 0.8] as dv}
        <line class="grid-line" x1={x(dv)} y1={M.top} x2={x(dv)} y2={H - M.bottom} />
        <text class="axis-num" x={x(dv)} y={H - M.bottom + 16} text-anchor="middle">{(dv * 100).toFixed(0)}%</text>
      {/each}
      {#each [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6] as sv}
        <line class="grid-line" x1={M.left} y1={y(sv)} x2={W - M.right} y2={y(sv)} />
        <text class="axis-num" x={M.left - 6} y={y(sv) + 4} text-anchor="end">{(sv * 100).toFixed(0)}%</text>
      {/each}

      <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
      <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">Quantity Cut (<tspan font-style="italic">d</tspan>)</text>
      <text
        class="axis-title"
        transform={`rotate(-90) translate(${-(M.top + H - M.bottom) / 2}, 16)`}
        text-anchor="middle">Share of Total Surplus (TS*)</text
      >

      <!-- Curves -->
      <path class="curve-path line-tot" d={totPath} />
      <path class="curve-path line-mis" d={misPath} />
      <path class="curve-path line-tri" d={triPath} />

      <!-- Crossing Point at d = 0.50 (where tri = mis = 25%) -->
      <line class="guide-line" x1={x(0.5)} y1={y(0.25)} x2={x(0.5)} y2={H - M.bottom} />
      <line class="guide-line" x1={M.left} y1={y(0.25)} x2={x(0.5)} y2={y(0.25)} />
      <circle class="crossing-dot" cx={x(0.5)} cy={y(0.25)} r="5.5" />
      <text class="crossing-lbl" x={x(0.5) + 8} y={y(0.25) - 4}>
        Crossing: d = 50%, both = 25%
      </text>

      <!-- Labels on lines -->
      <text class="curve-tag tag-tot" x={x(0.68)} y={y(0.68) - 6}>Total: d</text>
      <text class="curve-tag tag-mis" x={x(0.35)} y={y(0.35 * 0.65) - 8}>Misalloc: d(1−d)</text>
      <text class="curve-tag tag-tri" x={x(0.72)} y={y(0.72 * 0.72) + 16}>Triangle: d²</text>
    </svg>
  </div>

  <div class="ratio-table-wrap">
    <table class="ratio-table">
      <thead>
        <tr>
          <th>Cut (<em>d</em>)</th>
          <th>Triangle (<em>d</em>²)</th>
          <th>Misallocation (<em>d</em>(1−<em>d</em>))</th>
          <th>Misallocation ÷ triangle</th>
        </tr>
      </thead>
      <tbody>
        {#each dSteps as r}
          <tr class={r.d === 0.5 ? 'crossing-row' : ''}>
            <td>{(r.d * 100).toFixed(0)}%</td>
            <td class="tri-cell">{(r.tri * 100).toFixed(2)}%</td>
            <td class="mis-cell">{(r.mis * 100).toFixed(2)}%</td>
            <td class="ratio-cell"><strong>{r.ratio.toFixed(2)}×</strong></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="caption">
    The three losses as shares of the total surplus, for each size of cut. The misallocation curve peaks where it crosses the triangle, at <em>d</em> = 0.5.
  </p>
</div>

<style>
  .ratio-card {
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
  .card-head {
    margin-bottom: 1rem;
  }
  .card-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--squidink, #232f3e);
    margin: 0 0 0.4rem 0;
  }
  .head-sub {
    font-size: 0.88rem;
    color: #475569;
    line-height: 1.5;
    margin: 0;
  }

  .legend-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    margin-bottom: 0.75rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    color: #475569;
  }
  .leg-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .line-swatch {
    width: 14px;
    height: 3px;
    border-radius: 2px;
  }
  .sw-tot { background: #7c5aed; }
  .sw-mis { background: #2074d5; }
  .sw-tri { background: #df2a5d; }

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
  .curve-path {
    fill: none;
    stroke-width: 2.5;
  }
  .line-tot { stroke: #7c5aed; stroke-dasharray: 4 3; }
  .line-mis { stroke: #2074d5; }
  .line-tri { stroke: #df2a5d; }

  .guide-line {
    stroke: #94a3b8;
    stroke-dasharray: 3 3;
    stroke-width: 1;
  }
  .crossing-dot {
    fill: #7c5aed;
    stroke: #ffffff;
    stroke-width: 2;
  }
  .crossing-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    font-weight: 700;
    fill: #7c5aed;
    paint-order: stroke;
    stroke: #ffffff;
    stroke-width: 2.5px;
  }
  .curve-tag {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    font-weight: 600;
  }
  .tag-tot { fill: #7c5aed; }
  .tag-mis { fill: #2074d5; }
  .tag-tri { fill: #df2a5d; }

  .ratio-table-wrap {
    margin-top: 1rem;
    overflow-x: auto;
  }
  .ratio-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
  }
  .ratio-table th {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    padding: 0.4rem 0.5rem;
    text-align: right;
    color: #475569;
  }
  .ratio-table th:first-child {
    text-align: left;
  }
  .ratio-table td {
    padding: 0.35rem 0.5rem;
    border-bottom: 1px solid #f1f5f9;
    text-align: right;
  }
  .ratio-table td:first-child {
    text-align: left;
    font-weight: 600;
  }
  .crossing-row {
    background: #f5f3ff;
    font-weight: 700;
  }
  .tri-cell { color: #df2a5d; }
  .mis-cell { color: #2074d5; }
  .ratio-cell { color: var(--squidink, #232f3e); }

  .caption {
    font-size: 0.85rem;
    color: #64748b;
    line-height: 1.5;
    margin: 1rem 0 0 0;
    border-top: 1px solid #f1f5f9;
    padding-top: 0.75rem;
  }
</style>
