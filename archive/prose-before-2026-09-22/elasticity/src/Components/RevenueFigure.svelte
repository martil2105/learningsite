<script>
  /*
    RevenueFigure.svelte
    Top plot: Revenue R(p) = p * q(p) vs price p, with peak marker at |ε| = 1.
    Bottom plot: d ln R / d ln p = 1 - |ε| vs price p, crossing zero at the exact same price.
    Family selector: lin, exp, quad, logit, ces.
    On ces (|ε| = 1.6 everywhere), there is no peak and neither marker is drawn.
  */
  import { families, pointElasticity, revenue, peakPrice } from "../demand.js";
  import { linear, clampW } from "../chart.js";
  import katexify from "../katexify.js";

  let boxWidth = $state(600);
  let W = $derived(clampW(boxWidth, 320));

  let famId = $state("lin");
  let fam = $derived(families[famId]);

  const pConfig = {
    lin: { pMax: 62.5, rMax: 1300 },
    ces: { pMax: 60, rMax: 1600 },
    exp: { pMax: 60, rMax: 1000 },
    quad: { pMax: 65, rMax: 1300 },
    logit: { pMax: 60, rMax: 1200 },
  };

  let cfg = $derived(pConfig[famId]);

  const H_TOP = 170;
  const H_BOT = 140;
  const M = { top: 18, right: 25, bottom: 25, left: 55 };

  let x = $derived(linear(0, cfg.pMax, M.left, W - M.right));
  let yTop = $derived(linear(0, cfg.rMax, H_TOP - M.bottom, M.top));
  let yBot = $derived(linear(-2.5, 1.5, H_BOT - M.bottom, M.top));

  let pPeak = $derived(peakPrice(fam));
  let maxR = $derived(pPeak ? revenue(fam, pPeak) : null);

  // Curves
  let topCurvePts = $derived.by(() => {
    const pts = [];
    const step = cfg.pMax / 200;
    for (let p = step; p <= cfg.pMax; p += step) {
      const r = revenue(fam, p);
      if (r >= 0 && r <= cfg.rMax * 1.5) {
        pts.push([x(p), yTop(r)]);
      }
    }
    return pts;
  });

  let topPath = $derived.by(() => {
    let s = "";
    for (let i = 0; i < topCurvePts.length; i++) {
      s += `${i === 0 ? "M" : "L"} ${topCurvePts[i][0].toFixed(2)} ${topCurvePts[i][1].toFixed(2)} `;
    }
    return s;
  });

  let botCurvePts = $derived.by(() => {
    const pts = [];
    const step = cfg.pMax / 200;
    for (let p = step; p <= cfg.pMax; p += step) {
      const eps = pointElasticity(fam, p);
      const slope = 1 - eps;
      if (slope >= -5 && slope <= 5) {
        pts.push([x(p), yBot(slope)]);
      }
    }
    return pts;
  });

  let botPath = $derived.by(() => {
    let s = "";
    for (let i = 0; i < botCurvePts.length; i++) {
      s += `${i === 0 ? "M" : "L"} ${botCurvePts[i][0].toFixed(2)} ${botCurvePts[i][1].toFixed(2)} `;
    }
    return s;
  });
</script>

<div class="rev-card" id="revenue-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <div class="card-header">
    <div class="fam-selector">
      <span class="ctrl-lbl">Demand Curve:</span>
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

    <div class="peak-summary">
      {#if pPeak}
        <span class="summary-text" id="rev-peak-summary">
          Peak revenue at <strong>p = {pPeak.toFixed(2)}</strong> (R = {maxR.toFixed(1)}, |ε| = 1.000)
        </span>
      {:else}
        <span class="summary-text muted" id="rev-no-peak">
          No peak: |ε| = 1.6 &gt; 1 everywhere, revenue falls continuously in price
        </span>
      {/if}
    </div>
  </div>

  <!-- Top Plot: Revenue R(p) -->
  <div class="plot-sub">
    <div class="plot-lbl">Total Revenue <em>R(p)</em> = <em>p</em> · <em>q(p)</em></div>
    <svg width={W} height={H_TOP} viewBox={`0 0 ${W} ${H_TOP}`} role="img" aria-label="Revenue vs price">
      <!-- Grid -->
      <line class="rule" x1={M.left} y1={H_TOP - M.bottom} x2={W - M.right} y2={H_TOP - M.bottom} />
      <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H_TOP - M.bottom} />
      <text class="axis-t" x={M.left - 6} y={yTop(0) + 4} text-anchor="end">0</text>
      <text class="axis-t" x={M.left - 6} y={yTop(cfg.rMax) + 8} text-anchor="end">{cfg.rMax}</text>

      <!-- Curve -->
      <path class="rev-curve" d={topPath} />

      <!-- Peak Marker -->
      {#if pPeak}
        <line
          id="rev-peak-line"
          class="peak-marker-top"
          x1={x(pPeak)}
          y1={M.top}
          x2={x(pPeak)}
          y2={H_TOP - M.bottom}
        />
        <circle
          id="rev-peak-dot"
          class="peak-dot-top"
          cx={x(pPeak)}
          cy={yTop(maxR)}
          r="5"
        />
        <text class="marker-lbl" x={x(pPeak) + 8} y={yTop(maxR) + 4}>
          Peak: p = {pPeak.toFixed(1)}
        </text>
      {/if}
    </svg>
  </div>

  <!-- Bottom Plot: d ln R / d ln p = 1 - |ε| -->
  <div class="plot-sub">
    <div class="plot-lbl">Marginal Revenue Elasticity {@html katexify("\\frac{d \\ln R}{d \\ln p} = 1 - |\\varepsilon|")}</div>
    <svg width={W} height={H_BOT} viewBox={`0 0 ${W} ${H_BOT}`} role="img" aria-label="Log-log slope vs price">
      <!-- Zero baseline -->
      <line class="zero-line" x1={M.left} y1={yBot(0)} x2={W - M.right} y2={yBot(0)} />
      <text class="zero-lbl" x={W - M.right + 4} y={yBot(0) + 3}>0</text>

      <!-- Axes -->
      <line class="rule" x1={M.left} y1={H_BOT - M.bottom} x2={W - M.right} y2={H_BOT - M.bottom} />
      <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H_BOT - M.bottom} />
      <text class="axis-t" x={M.left - 6} y={yBot(1) + 4} text-anchor="end">+1</text>
      <text class="axis-t" x={M.left - 6} y={yBot(-2) + 4} text-anchor="end">−2</text>
      <text class="axis-t" x={x(cfg.pMax)} y={H_BOT - M.bottom + 16} text-anchor="middle">Price ({cfg.pMax})</text>

      <!-- Curve -->
      <path class="slope-curve" d={botPath} />

      <!-- Zero-crossing marker -->
      {#if pPeak}
        <line
          id="rev-zero-line"
          class="zero-crossing-bottom"
          x1={x(pPeak)}
          y1={M.top}
          x2={x(pPeak)}
          y2={H_BOT - M.bottom}
        />
        <circle
          id="rev-zero-dot"
          class="zero-crossing-dot"
          cx={x(pPeak)}
          cy={yBot(0)}
          r="4.5"
        />
        <text class="marker-lbl" x={x(pPeak) + 8} y={yBot(0) - 8}>
          Zero Crossing (|ε| = 1)
        </text>
      {/if}
    </svg>
  </div>

  <p class="caption">
    <strong>Figure 3. Revenue peaks where |ε| = 1.</strong> Because <em>d</em> ln <em>R</em> / <em>d</em> ln <em>p</em> = 1 − |ε| identically, the price where revenue peaks aligns exactly (&lt; 1px) with the zero crossing of the percentage revenue derivative. On the constant elasticity curve (CES), |ε| = 1.6 &gt; 1 everywhere, so revenue falls monotonically and no peak exists.
  </p>
</div>

<style>
  .rev-card {
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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .fam-selector {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
    width: 100%;
  }
  .ctrl-lbl {
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
    transition: all 0.15s;
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
  .summary-text {
    font-family: var(--font-mono, monospace);
    font-size: 0.82rem;
    color: #1e293b;
  }
  .summary-text.muted {
    color: #64748b;
  }

  .plot-sub {
    margin-bottom: 1rem;
  }
  .plot-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.25rem;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .rule {
    stroke: #cbd5e1;
    stroke-width: 1.25;
  }
  .zero-line {
    stroke: #94a3b8;
    stroke-width: 1;
    stroke-dasharray: 4 3;
  }
  .axis-t, .zero-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    fill: #64748b;
  }
  .rev-curve {
    fill: none;
    stroke: #2563eb;
    stroke-width: 2.5;
  }
  .slope-curve {
    fill: none;
    stroke: #7c5aed;
    stroke-width: 2.5;
  }
  .peak-marker-top, .zero-crossing-bottom {
    stroke: #df2a5d;
    stroke-width: 1.75;
    stroke-dasharray: 4 3;
  }
  .peak-dot-top, .zero-crossing-dot {
    fill: #df2a5d;
    stroke: #ffffff;
    stroke-width: 1.5;
  }
  .marker-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    font-weight: 700;
    fill: #df2a5d;
    paint-order: stroke;
    stroke: #ffffff;
    stroke-width: 2.5px;
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
