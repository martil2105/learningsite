<script>
  /*
    RationLab.svelte — The Hook:
    Interactive lab with ceiling price pBar (or quantity cut d)
    and allocation efficiency parameter θ ∈ [0, 1].
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
    ceilingPrice,
    willingBuyers,
    triangleLoss,
    misallocationLoss,
    combinedLoss,
  } from "../market.js";

  // Controls
  let pBar = $state(12); // Ceiling price
  let theta = $state(0.0); // 0 = fully random, 1 = perfectly efficient

  let q = $derived(C + S * pBar);
  let N = $derived(willingBuyers(pBar));
  let dCut = $derived((q0 - q) / q0);

  // Losses
  let triLoss = $derived(triangleLoss(q));
  let triShare = $derived((triLoss / TS0) * 100);

  let misLoss = $derived(misallocationLoss(q, pBar, theta));
  let misShare = $derived((misLoss / TS0) * 100);

  let totLoss = $derived(triLoss + misLoss);
  let totShare = $derived((totLoss / TS0) * 100);

  let mult = $derived(triLoss > 0 ? misLoss / triLoss : 0);
</script>

<div class="lab-card" id="ration-lab">
  <div class="card-head">
    <h3>The rationing lab</h3>
    <p class="head-sub">
      Move the price ceiling <em>p̄</em> to change the size of the shortage, and change the sorting efficiency <em>θ</em> to see how well-sorted rationing changes the total loss.
    </p>
  </div>

  <div class="controls-grid">
    <div class="ctrl-col">
      <div class="ctrl-header">
        <label for="pbar-slider" class="ctrl-lbl">Price ceiling (<em>p̄</em>):</label>
        <span class="ctrl-val">£{pBar.toFixed(1)}</span>
      </div>
      <input
        id="pbar-slider"
        type="range"
        min="6"
        max="19.5"
        step="0.5"
        bind:value={pBar}
      />
      <div class="ctrl-sub">Quantity: {q.toFixed(0)} units (cut: {(dCut * 100).toFixed(1)}%)</div>
    </div>

    <div class="ctrl-col">
      <div class="ctrl-header">
        <label for="theta-slider" class="ctrl-lbl">Sorting efficiency (<em>θ</em>):</label>
        <span class="ctrl-val">{(theta * 100).toFixed(0)}%</span>
      </div>
      <input
        id="theta-slider"
        type="range"
        min="0.0"
        max="1.0"
        step="0.05"
        bind:value={theta}
      />
      <div class="ctrl-sub">
        {theta === 0 ? "Fully random lottery" : theta === 1 ? "Perfect allocation (top values)" : "Partially sorted queue"}
      </div>
    </div>
  </div>

  <div class="theta-presets">
    <span class="pre-lbl">Presets (p̄ = 12):</span>
    <button type="button" class="btn-pre" onclick={() => { pBar = 12; theta = 0.0; }}>θ = 0.00 (Random)</button>
    <button type="button" class="btn-pre" onclick={() => { pBar = 12; theta = 0.25; }}>θ = 0.25</button>
    <button type="button" class="btn-pre" onclick={() => { pBar = 12; theta = 0.50; }}>θ = 0.50</button>
    <button type="button" class="btn-pre" onclick={() => { pBar = 12; theta = 0.75; }}>θ = 0.75</button>
    <button type="button" class="btn-pre" onclick={() => { pBar = 12; theta = 1.00; }}>θ = 1.00 (Quota)</button>
  </div>

  <div class="metrics-grid">
    <div class="metric-box box-tri">
      <span class="m-title">Triangle loss</span>
      <span class="m-val" id="lab-tri-val">£{triLoss.toFixed(1)}</span>
      <span class="m-sub">{triShare.toFixed(2)}% of total surplus</span>
    </div>

    <div class="metric-box box-mis">
      <span class="m-title">Misallocation loss</span>
      <span class="m-val" id="lab-mis-val">£{misLoss.toFixed(1)}</span>
      <span class="m-sub">{misShare.toFixed(2)}% of total surplus ({mult.toFixed(2)}× triangle)</span>
    </div>

    <div class="metric-box box-tot">
      <span class="m-title">Total loss</span>
      <span class="m-val highlight" id="lab-tot-val">£{totLoss.toFixed(1)}</span>
      <span class="m-sub">{totShare.toFixed(2)}% of total surplus</span>
    </div>
  </div>

  <div class="panel-wrap">
    <MarketPanel
      shading={{ triangle: true, misalloc: theta < 1, q, pBar }}
      height={300}
      ariaLabel="Rationing lab: market panel showing triangle and misallocation shading"
    />
  </div>

  <p class="caption">
    At a ceiling of £12, where <em>q</em> = 44, the triangle alone costs £106.67. With purely random allocation (<em>θ</em> = 0), misallocation adds £293.33, which is 2.75× the triangle, for a total loss of £400.00. The triangle only becomes the bigger of the two losses once <em>θ</em> is above 0.64.
  </p>
</div>

<style>
  .lab-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.25rem;
    margin: 2rem auto;
    max-width: 680px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .card-head {
    margin-bottom: 1rem;
  }
  .card-head h3 {
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

  .controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    margin-bottom: 0.85rem;
  }
  @media (max-width: 540px) {
    .controls-grid {
      grid-template-columns: 1fr;
    }
  }
  .ctrl-col {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .ctrl-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ctrl-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 0.78rem;
    color: #475569;
    font-weight: 600;
  }
  .ctrl-val {
    font-family: var(--font-mono, monospace);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--violet, #7c5aed);
  }
  input[type="range"] {
    accent-color: var(--violet, #7c5aed);
    cursor: pointer;
  }
  .ctrl-sub {
    font-family: var(--font-mono, monospace);
    font-size: 0.68rem;
    color: #64748b;
  }

  .theta-presets {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid #f1f5f9;
  }
  .pre-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 0.7rem;
    color: #64748b;
    margin-right: 0.2rem;
  }
  .btn-pre {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    color: #334155;
    padding: 0.2rem 0.45rem;
    border-radius: 4px;
    font-family: var(--font-mono, monospace);
    font-size: 0.68rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-pre:hover {
    background: #e2e8f0;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
    margin-bottom: 1.25rem;
  }
  @media (max-width: 540px) {
    .metrics-grid {
      grid-template-columns: 1fr;
    }
  }
  .metric-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .box-tri { border-left: 3px solid #df2a5d; }
  .box-mis { border-left: 3px solid #2074d5; }
  .box-tot { border-left: 3px solid var(--violet, #7c5aed); }

  .m-title {
    font-family: var(--font-mono, monospace);
    font-size: 0.65rem;
    color: #64748b;
    text-transform: uppercase;
  }
  .m-val {
    font-family: var(--font-mono, monospace);
    font-size: 1.15rem;
    font-weight: 700;
    color: #1e293b;
  }
  .box-tri .m-val { color: #df2a5d; }
  .box-mis .m-val { color: #2074d5; }
  .box-tot .m-val { color: var(--violet, #7c5aed); }

  .m-sub {
    font-family: var(--font-mono, monospace);
    font-size: 0.68rem;
    color: #94a3b8;
  }

  .panel-wrap {
    width: 100%;
    margin-bottom: 0.5rem;
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
