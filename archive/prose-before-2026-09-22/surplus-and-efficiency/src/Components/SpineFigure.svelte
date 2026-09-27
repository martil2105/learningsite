<script>
  /*
    SpineFigure.svelte — The comparison spine of the article.
    Two MarketPanels side by side:
      - Left: The Wrong Quantity (Triangle Loss, d²)
      - Right: The Wrong People (Misallocation Loss, d(1 - d))
    Center/Top: Stacked loss bar showing d² + d(1 - d) = d identically.
  */
  import MarketPanel from "./MarketPanel.svelte";
  import {
    A,
    B,
    C,
    S,
    p0,
    q0,
    TS0,
    k,
    triangleLoss,
    ceilingPrice,
    willingBuyers,
    misallocationLoss,
    combinedLoss,
    pDemand,
    pSupply,
  } from "../market.js";

  // Single cut slider: d in [0, 0.80]
  // Default to worked case: pBar = 12 -> q = 44 -> d = 16/60 = 0.266667
  let d = $state(0.2667);

  let q = $derived(q0 * (1 - d));
  let pBar = $derived(ceilingPrice(q));
  let N = $derived(willingBuyers(pBar));

  // Losses
  let triLoss = $derived(triangleLoss(q));
  let triShare = $derived(triLoss / TS0); // d²

  let misLoss = $derived(misallocationLoss(q, pBar, 0));
  let misShare = $derived(misLoss / TS0); // d(1 - d)

  let totLoss = $derived(triLoss + misLoss);
  let totShare = $derived(totLoss / TS0); // d

  let ratio = $derived(triLoss > 0 ? misLoss / triLoss : 0);
</script>

<div class="spine-card" id="spine-figure">
  <!-- Sticky controls bar under 700px -->
  <div class="controls-bar">
    <div class="slider-box">
      <label for="cut-slider" class="slider-lbl">Quantity Cut (<em>d</em>):</label>
      <input
        id="cut-slider"
        type="range"
        min="0.01"
        max="0.80"
        step="0.005"
        bind:value={d}
      />
      <span class="slider-val" id="cut-val">{(d * 100).toFixed(1)}%</span>
    </div>

    <div class="preset-group">
      <button
        type="button"
        class="btn-preset"
        onclick={() => (d = 0.10)}>10% Cut</button
      >
      <button
        type="button"
        class="btn-preset"
        onclick={() => (d = 0.2667)}>Worked Case (26.7%)</button
      >
      <button
        type="button"
        class="btn-preset"
        onclick={() => (d = 0.50)}>Equal Crossing (50%)</button
      >
    </div>
  </div>

  <!-- Headline Stacked Identity Bar -->
  <div class="identity-banner">
    <div class="banner-top">
      <span class="banner-title">The Exact Linear Identity:</span>
      <span class="banner-formula" id="identity-formula">
        <em>d</em>² ({(triShare * 100).toFixed(2)}%) + <em>d</em>(1 − <em>d</em>) ({(misShare * 100).toFixed(2)}%) = <strong>{(totShare * 100).toFixed(2)}%</strong> (cut <em>d</em>)
      </span>
    </div>

    <!-- Stacked progress bar representing total loss -->
    <div class="stacked-bar-track">
      <div
        id="stacked-total-bar"
        class="stacked-bar-fill"
        style={`width: ${Math.min(100, totShare * 100)}%;`}
      >
        <div
          id="bar-seg-triangle"
          class="bar-slice slice-triangle"
          style={`width: ${totShare > 0 ? (triShare / totShare) * 100 : 0}%;`}
          title={`Triangle Loss: ${(triShare * 100).toFixed(2)}%`}
        ></div>
        <div
          id="bar-seg-misalloc"
          class="bar-slice slice-misalloc"
          style={`width: ${totShare > 0 ? (misShare / totShare) * 100 : 0}%;`}
          title={`Misallocation Loss: ${(misShare * 100).toFixed(2)}%`}
        ></div>
      </div>
    </div>
    <div class="bar-legend">
      <span class="leg-item"><span class="swatch sw-tri"></span> Triangle Loss: {triLoss.toFixed(1)} ({(triShare * 100).toFixed(2)}%)</span>
      <span class="leg-item"><span class="swatch sw-mis"></span> Misallocation: {misLoss.toFixed(1)} ({(misShare * 100).toFixed(2)}%)</span>
      <span class="leg-item total-leg">Total Loss: {totLoss.toFixed(1)} ({(totShare * 100).toFixed(2)}%)</span>
    </div>
  </div>

  <!-- Two Comparison Panels -->
  <div class="spine-panels">
    <!-- Panel 1: The Wrong Quantity -->
    <div class="spine-col" id="col-quantity">
      <div class="col-head">
        <h4>1. The Wrong Quantity</h4>
        <span class="col-badge badge-tri">Triangle Loss: {(triShare * 100).toFixed(2)}% of TS*</span>
      </div>
      <p class="col-desc">
        Trade stops at <em>q</em> = {q.toFixed(1)}. The unconsumed gains from trade form the classic second-order deadweight loss triangle of size ½<em>k</em>(<em>q</em>* − <em>q</em>)².
      </p>
      <MarketPanel
        shading={{ triangle: true, q, pBar }}
        height={280}
        ariaLabel="Left panel: Triangle deadweight loss from quantity cut"
      />
    </div>

    <!-- Panel 2: The Wrong People -->
    <div class="spine-col" id="col-rationing">
      <div class="col-head">
        <h4>2. The Wrong People</h4>
        <span class="col-badge badge-mis">Misallocation: {(misShare * 100).toFixed(2)}% of TS*</span>
      </div>
      <p class="col-desc">
        At ceiling price <em>p̄</em> = {pBar.toFixed(1)}, {N.toFixed(0)} buyers compete for {q.toFixed(1)} units. Random rationing hands units to low-value buyers, costing <em>q</em>(<em>N</em> − <em>q</em>)/(2<em>B</em>).
      </p>
      <MarketPanel
        shading={{ misalloc: true, q, pBar }}
        height={280}
        ariaLabel="Right panel: Misallocation loss from random rationing under ceiling"
      />
    </div>
  </div>

  <p class="caption">
    <strong>Figure 1. The comparison spine.</strong> At every point on the slider, the total economic loss from a price ceiling is <em>identically</em> equal to the quantity cut itself: <em>d</em>² + <em>d</em>(1 − <em>d</em>) = <em>d</em>. The textbook triangle (left) is second order; the rationing misallocation (right) is first order. At small cuts, misallocation accounts for almost the entire loss.
  </p>
</div>

<style>
  .spine-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.25rem;
    margin: 2rem auto;
    max-width: 720px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .controls-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    background: #ffffff;
    padding: 0.5rem 0;
  }
  @media (max-width: 700px) {
    .controls-bar {
      position: sticky;
      top: 0;
      z-index: 20;
      background: #ffffff;
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
  }
  .slider-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1 1 240px;
  }
  .slider-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 0.78rem;
    color: #475569;
    white-space: nowrap;
  }
  input[type="range"] {
    flex: 1;
    accent-color: var(--violet, #7c5aed);
    cursor: pointer;
    min-width: 100px;
  }
  .slider-val {
    font-family: var(--font-mono, monospace);
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--violet, #7c5aed);
    min-width: 3.5rem;
    text-align: right;
  }
  .preset-group {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .btn-preset {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #334155;
    padding: 0.25rem 0.55rem;
    border-radius: 4px;
    font-family: var(--font-mono, monospace);
    font-size: 0.7rem;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-preset:hover {
    background: #e2e8f0;
  }

  .identity-banner {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.85rem;
    margin-bottom: 1.5rem;
  }
  .banner-top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.8rem;
  }
  .banner-title {
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.72rem;
  }
  .banner-formula {
    color: #1e293b;
  }
  .banner-formula strong {
    color: var(--violet, #7c5aed);
  }
  .stacked-bar-track {
    width: 100%;
    height: 16px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  .stacked-bar-fill {
    height: 100%;
    display: flex;
    transition: width 0.05s ease-out;
  }
  .bar-slice {
    height: 100%;
  }
  .slice-triangle {
    background: #df2a5d;
  }
  .slice-misalloc {
    background: #2074d5;
  }
  .bar-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    color: #475569;
  }
  .leg-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  .sw-tri { background: #df2a5d; }
  .sw-mis { background: #2074d5; }
  .total-leg {
    font-weight: 700;
    color: #1e293b;
    margin-left: auto;
  }

  .spine-panels {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  @media (max-width: 760px) {
    .spine-panels {
      flex-direction: column;
    }
  }
  .spine-col {
    flex: 1;
    min-width: 0;
    border: 1px solid #f1f5f9;
    border-radius: 6px;
    padding: 0.75rem;
    background: #ffffff;
  }
  .col-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }
  .col-head h4 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--squidink, #232f3e);
  }
  .col-badge {
    font-family: var(--font-mono, monospace);
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
  }
  .badge-tri {
    background: #ffe4e6;
    color: #be123c;
  }
  .badge-mis {
    background: #dbeafe;
    color: #1d4ed8;
  }
  .col-desc {
    font-size: 0.8rem;
    color: #64748b;
    line-height: 1.45;
    margin: 0 0 0.5rem 0;
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
