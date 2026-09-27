<script>
  /*
    TwoPointsFigure.svelte — Two observations, four defensible answers.
    Points: (20, 57) and (30, 33).
    Answers:
      1. Point ε at (20, 57) = 0.842 (48/57)
      2. Point ε at (30, 33) = 2.182 (24/11)
      3. Midpoint formula = 1.333 (4/3, exact point ε at p=25 on the line)
      4. Log-difference formula = 1.348 (exact exponent on CES curve)
    Toggle straight line vs CES curve through both points.
  */
  import { linear, clampW } from "../chart.js";
  import { midpointFormula, logDifferenceFormula } from "../demand.js";

  const p1 = 20, q1 = 57;
  const p2 = 30, q2 = 33;

  // Straight line: q = 105 - 2.4p
  const slopeLin = (q2 - q1) / (p2 - p1); // -2.4
  const aLin = q1 - slopeLin * p1; // 105
  const qLin = (p) => aLin + slopeLin * p;

  // Constant-elasticity curve: q = k * p^(-alpha)
  const alphaCes = (Math.log(q1) - Math.log(q2)) / (Math.log(p2) - Math.log(p1)); // 1.347942...
  const kCes = q1 * Math.pow(p1, alphaCes);
  const qCes = (p) => kCes * Math.pow(p, -alphaCes);

  // Four answers
  const ans1 = Math.abs((slopeLin * p1) / q1); // 48/57 = 0.842105...
  const ans2 = Math.abs((slopeLin * p2) / q2); // 72/33 = 2.181818...
  const ansMid = midpointFormula(p1, q1, p2, q2); // 4/3 = 1.333333...
  const ansLog = logDifferenceFormula(p1, q1, p2, q2); // 1.347942...

  let boxWidth = $state(600);
  let W = $derived(clampW(boxWidth, 320));
  const H = 280;
  const M = { top: 20, right: 25, bottom: 35, left: 45 };

  let activeCurve = $state("both"); // "lin", "ces", "both"

  let x = $derived(linear(10, 40, M.left, W - M.right));
  let y = $derived(linear(15, 80, H - M.bottom, M.top));

  // Paths
  let linPath = $derived.by(() => {
    let s = "";
    for (let p = 12; p <= 38; p += 1) {
      const q = qLin(p);
      s += `${p === 12 ? "M" : "L"} ${x(p).toFixed(2)} ${y(q).toFixed(2)} `;
    }
    return s;
  });

  let cesPath = $derived.by(() => {
    let s = "";
    for (let p = 12; p <= 38; p += 0.5) {
      const q = qCes(p);
      s += `${p === 12 ? "M" : "L"} ${x(p).toFixed(2)} ${y(q).toFixed(2)} `;
    }
    return s;
  });
</script>

<div class="two-card" id="two-points-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <div class="card-header">
    <h3 class="card-title">Two observations, four different answers</h3>
    <p class="card-sub">
      Two observations and four ways to turn them into an elasticity. Toggle the curves to see which curve each formula assumes.
    </p>
  </div>

  <div class="answers-grid">
    <div class="ans-col">
      <span class="ans-badge">At the first point (20, 57)</span>
      <span class="ans-val" id="ans-pt1">{ans1.toFixed(3)}</span>
      <span class="ans-sub">Inelastic (48/57)</span>
    </div>
    <div class="ans-col">
      <span class="ans-badge">At the second point (30, 33)</span>
      <span class="ans-val" id="ans-pt2">{ans2.toFixed(3)}</span>
      <span class="ans-sub">Elastic (24/11)</span>
    </div>
    <div class="ans-col highlight-col">
      <span class="ans-badge">Midpoint formula</span>
      <span class="ans-val" id="ans-mid">{ansMid.toFixed(3)}</span>
      <span class="ans-sub">Exact for a straight line at p = 25 (4/3)</span>
    </div>
    <div class="ans-col highlight-col">
      <span class="ans-badge">Log difference</span>
      <span class="ans-val" id="ans-log">{ansLog.toFixed(3)}</span>
      <span class="ans-sub">Exact for a constant-elasticity curve</span>
    </div>
  </div>

  <div class="curve-toggle-bar">
    <span class="toggle-lbl">Fitted demand curve:</span>
    <div class="btn-group">
      <button
        type="button"
        class="btn-tab {activeCurve === 'lin' ? 'active' : ''}"
        onclick={() => (activeCurve = "lin")}>Straight line (q = 105 − 2.4p)</button
      >
      <button
        type="button"
        class="btn-tab {activeCurve === 'ces' ? 'active' : ''}"
        onclick={() => (activeCurve = "ces")}>Constant elasticity (q = k·p^(−1.35))</button
      >
      <button
        type="button"
        class="btn-tab {activeCurve === 'both' ? 'active' : ''}"
        onclick={() => (activeCurve = "both")}>Compare both curves</button
      >
    </div>
  </div>

  <div class="plot-box">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Two points and fitted curves">
      <!-- Grid -->
      {#each [10, 20, 25, 30, 40] as pt}
        <line class="grid-line" x1={x(pt)} y1={M.top} x2={x(pt)} y2={H - M.bottom} />
        <text class="axis-num" x={x(pt)} y={H - M.bottom + 16} text-anchor="middle">{pt}</text>
      {/each}
      {#each [20, 40, 60, 80] as qt}
        <line class="grid-line" x1={M.left} y1={y(qt)} x2={W - M.right} y2={y(qt)} />
        <text class="axis-num" x={M.left - 6} y={y(qt) + 4} text-anchor="end">{qt}</text>
      {/each}
      <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
      <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">Price (p)</text>
      <text
        class="axis-title"
        transform={`rotate(-90) translate(${-(M.top + H - M.bottom) / 2}, 14)`}
        text-anchor="middle">Quantity (q)</text
      >

      <!-- Fitted Curves -->
      {#if activeCurve === 'lin' || activeCurve === 'both'}
        <path class="fit-curve lin-fit" d={linPath} />
        <text class="curve-lbl lin-lbl" x={x(13)} y={y(qLin(13)) - 8}>Straight line</text>
      {/if}

      {#if activeCurve === 'ces' || activeCurve === 'both'}
        <path class="fit-curve ces-fit" d={cesPath} />
        <text class="curve-lbl ces-lbl" x={x(36)} y={y(qCes(36)) + 14}>Constant-ε curve</text>
      {/if}

      <!-- Midpoint Point (25, 45) on the line -->
      {#if activeCurve === 'lin' || activeCurve === 'both'}
        <circle class="mid-dot" cx={x(25)} cy={y(45)} r="4" />
        <text class="mid-lbl" x={x(25) + 6} y={y(45) - 6}>Midpoint (25, 45): ε = 1.333</text>
      {/if}

      <!-- Observed Points -->
      <g class="obs-point" transform={`translate(${x(p1)}, ${y(q1)})`}>
        <circle class="obs-dot" r="5.5" />
        <text class="obs-lbl" x="8" y="-4">(20, 57) · |ε| = 0.842</text>
      </g>
      <g class="obs-point" transform={`translate(${x(p2)}, ${y(q2)})`}>
        <circle class="obs-dot" r="5.5" />
        <text class="obs-lbl" x="8" y="-4">(30, 33) · |ε| = 2.182</text>
      </g>
    </svg>
  </div>

  <p class="caption">
    The midpoint formula matches the straight line through the two points, and the log-difference formula matches the constant-elasticity curve. Neither is more objective than the other, because each one commits to a shape for the curve.
  </p>
</div>

<style>
  .two-card {
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
    margin-bottom: 1.25rem;
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
  .answers-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }
  @media (max-width: 550px) {
    .answers-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .ans-col {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.65rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .ans-col.highlight-col {
    background: #fdf4ff;
    border-color: #e9d5ff;
  }
  .ans-badge {
    font-family: var(--font-mono, monospace);
    font-size: 0.65rem;
    color: #64748b;
    margin-bottom: 0.25rem;
  }
  .ans-val {
    font-family: var(--font-mono, monospace);
    font-size: 1.25rem;
    font-weight: 800;
    color: #1e293b;
  }
  .highlight-col .ans-val {
    color: var(--violet, #7c5aed);
  }
  .ans-sub {
    font-family: var(--font-mono, monospace);
    font-size: 0.65rem;
    color: #94a3b8;
    margin-top: 0.2rem;
  }

  .curve-toggle-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }
  .toggle-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
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
    padding: 0.3rem 0.55rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    color: #475569;
    cursor: pointer;
    border-right: 1px solid #cbd5e1;
    transition: all 0.15s;
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
  .fit-curve {
    fill: none;
    stroke-width: 2.5;
  }
  .lin-fit {
    stroke: #2563eb;
  }
  .ces-fit {
    stroke: #7c5aed;
    stroke-dasharray: 5 3;
  }
  .curve-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    font-weight: 600;
  }
  .lin-lbl {
    fill: #2563eb;
  }
  .ces-lbl {
    fill: #7c5aed;
  }
  .mid-dot {
    fill: #2563eb;
  }
  .mid-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 9px;
    fill: #2563eb;
  }
  .obs-dot {
    fill: #df2a5d;
    stroke: #ffffff;
    stroke-width: 2;
  }
  .obs-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    font-weight: 700;
    fill: #1e293b;
    paint-order: stroke;
    stroke: #ffffff;
    stroke-width: 2.5px;
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
