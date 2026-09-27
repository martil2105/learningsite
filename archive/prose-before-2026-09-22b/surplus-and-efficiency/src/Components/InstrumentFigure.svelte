<script>
  /*
    InstrumentFigure.svelte — The Instrument, Not the Quantity:
    Compares a Quota (price rises, no misallocation, loss = d²)
    against a Price Ceiling (price frozen, random rationing, loss = d)
    at the exact same quantity.
    Ratio of losses: d / d² = 1/d.
    Includes the constant-elasticity comparison (the honest edge).
  */
  import MarketPanel from "./MarketPanel.svelte";
  import { q0, TS0, pDemand, ceilingPrice, willingBuyers, triangleLoss, misallocationLoss } from "../market.js";

  let d = $state(0.10); // 10% cut default -> ceiling costs 10x quota
  let instrument = $state("ceiling"); // "quota" or "ceiling"

  let q = $derived(q0 * (1 - d));
  let pQuota = $derived(pDemand(q));
  let pCeil = $derived(ceilingPrice(q));
  let nBuyers = $derived(willingBuyers(pCeil));

  let triLoss = $derived(triangleLoss(q));
  let misLoss = $derived(instrument === "ceiling" ? misallocationLoss(q, pCeil, 0) : 0);
  let totLoss = $derived(triLoss + misLoss);
  let totShare = $derived((totLoss / TS0) * 100);

  let costMultiplier = $derived(d > 0 ? 1 / d : 1);
</script>

<div class="inst-card" id="instrument-figure">
  <div class="card-head">
    <h3 class="card-title">A quota and a price ceiling at the same quantity</h3>
    <p class="head-sub">
      Both policies hold quantity to exactly <em>q</em> = {q.toFixed(0)} units, a {(d * 100).toFixed(0)}% cut. A quota lets the price clear the market, so there's no misallocation, while a price ceiling holds the price down, and the shortage and rationing that follow multiply the total loss by exactly 1/<em>d</em>.
    </p>
  </div>

  <div class="toolbar">
    <div class="inst-toggle">
      <span class="tb-lbl">Policy:</span>
      <div class="btn-group">
        <button
          id="btn-inst-quota"
          type="button"
          class="btn-tab {instrument === 'quota' ? 'active' : ''}"
          onclick={() => (instrument = "quota")}>Production quota (loss = <em>d</em>²)</button
        >
        <button
          id="btn-inst-ceiling"
          type="button"
          class="btn-tab {instrument === 'ceiling' ? 'active' : ''}"
          onclick={() => (instrument = "ceiling")}>Price ceiling (loss = <em>d</em>)</button
        >
      </div>
    </div>

    <div class="cut-select">
      <span class="tb-lbl">Quantity cut:</span>
      <div class="btn-group">
        <button
          type="button"
          class="btn-tab {d === 0.05 ? 'active' : ''}"
          onclick={() => (d = 0.05)}>5% (20× ratio)</button
        >
        <button
          type="button"
          class="btn-tab {d === 0.10 ? 'active' : ''}"
          onclick={() => (d = 0.10)}>10% (10× ratio)</button
        >
        <button
          type="button"
          class="btn-tab {d === 0.20 ? 'active' : ''}"
          onclick={() => (d = 0.20)}>20% (5× ratio)</button
        >
      </div>
    </div>
  </div>

  <div class="summary-banner {instrument}">
    <div class="banner-stat">
      <span class="stat-name">Policy:</span>
      <span class="stat-val">{instrument === "quota" ? "Production quota" : "Price ceiling"}</span>
    </div>
    <div class="banner-stat">
      <span class="stat-name">Price:</span>
      <span class="stat-val">£{(instrument === "quota" ? pQuota : pCeil).toFixed(2)}</span>
    </div>
    <div class="banner-stat">
      <span class="stat-name">Total surplus lost:</span>
      <span class="stat-val highlight" id="inst-loss-val">£{totLoss.toFixed(1)} ({totShare.toFixed(2)}%)</span>
    </div>
    <div class="banner-stat">
      <span class="stat-name">Cost relative to the quota:</span>
      <span class="stat-val multiplier" id="inst-multiplier">
        {instrument === "quota" ? "1.0× (baseline)" : `${costMultiplier.toFixed(1)}× (1/d)`}
      </span>
    </div>
  </div>

  <div class="panel-box">
    <MarketPanel
      shading={{
        triangle: true,
        misalloc: instrument === "ceiling",
        q,
        pBar: pCeil,
      }}
      height={300}
      ariaLabel={`Market panel showing ${instrument} at quantity ${q}`}
    />
  </div>

  <!-- The Honest Edge Callout: Constant Elasticity Comparison -->
  <div class="edge-callout">
    <h4>A straight demand line is the cautious case</h4>
    <p>
      The identity <em>d</em>² + <em>d</em>(1 − <em>d</em>) = <em>d</em> assumes straight demand lines. On a constant-elasticity demand curve, with ε = 1.6 and the same competitive crossing at £20 and 60 units, the buyers at the front of the queue value the good far more:
    </p>
    <ul class="edge-bullets">
      <li>At a 5% cut, the total loss is 5.0% with linear demand, but 11.4% with constant elasticity.</li>
      <li>With constant elasticity, the misallocation loss is 108× the triangle, against 19× in the linear case.</li>
    </ul>
    <p class="edge-foot">
      Curvature makes rationing more costly, so the linear formula isn't an overestimate: it's the lower bound.
    </p>
  </div>

  <p class="caption">
    At the same quantity, a price ceiling costs exactly 1/<em>d</em> times as much as a quota. For small shortfalls, almost all of the loss comes from how the units are allocated, not from the units that are missing.
  </p>
</div>

<style>
  .inst-card {
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

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .tb-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    color: #64748b;
    margin-right: 0.35rem;
  }
  .btn-group {
    display: flex;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
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

  .summary-banner {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.5rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    transition: all 0.2s;
  }
  .summary-banner.quota {
    border-left: 4px solid #df2a5d;
  }
  .summary-banner.ceiling {
    border-left: 4px solid #7c5aed;
  }
  .banner-stat {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .stat-name {
    font-family: var(--font-mono, monospace);
    font-size: 0.65rem;
    color: #64748b;
  }
  .stat-val {
    font-family: var(--font-mono, monospace);
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e293b;
  }
  .stat-val.highlight {
    color: var(--violet, #7c5aed);
  }
  .stat-val.multiplier {
    color: #b91c1c;
  }

  .panel-box {
    width: 100%;
    margin-bottom: 1.25rem;
  }

  .edge-callout {
    background: #fdf2f8;
    border: 1px solid #fbcfe8;
    border-left: 4px solid #db2777;
    border-radius: 6px;
    padding: 0.85rem 1rem;
    margin-bottom: 0.75rem;
  }
  .edge-callout h4 {
    margin: 0 0 0.35rem 0;
    font-size: 0.88rem;
    color: #9d174d;
    font-weight: 700;
  }
  .edge-callout p {
    font-size: 0.82rem;
    color: #475569;
    line-height: 1.45;
    margin: 0 0 0.4rem 0;
  }
  .edge-bullets {
    margin: 0.3rem 0 0.4rem 1.2rem;
    padding: 0;
    font-size: 0.8rem;
    color: #334155;
    line-height: 1.45;
  }
  .edge-foot {
    font-size: 0.78rem;
    font-style: italic;
    color: #831843;
    margin: 0;
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
