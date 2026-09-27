<script>
  /*
    TheQueue.svelte — The Right Channel in detail:
    The demand curve as a uniform distribution of buyer valuations,
    and the mechanics of handing 44 units to 84 willing buyers under a ceiling of 12.
  */
  import { A, B, C, S, p0, q0, willingBuyers, ceilingPrice } from "../market.js";

  const pBar = 12;
  const qSupplied = 44;
  const nWilling = 84; // 120 - 3 * 12
  const vMax = 40;     // 120 / 3
  const vMin = 12;

  // Efficient cutoff valuation: P_d(44) = (120 - 44)/3 = 25.333
  const vCutoffEff = (A - qSupplied) / B;
  const avgValEff = (vMax + vCutoffEff) / 2; // 32.667
  const avgValRand = (vMax + vMin) / 2;      // 26.000
  const lossPerUnit = avgValEff - avgValRand; // 6.667
  const misTotal = lossPerUnit * qSupplied;  // 293.333

  let mode = $state("compare"); // "efficient", "random", "compare"
</script>

<div class="queue-card" id="the-queue">
  <div class="card-head">
    <h3>The demand curve as a queue</h3>
    <p class="head-sub">
      Here are the buyers who want a unit at the ceiling price, lined up by how much they value it. Switch between the two ways of handing out the units that are supplied.
    </p>
  </div>

  <div class="allocation-toggle">
    <span class="toggle-lbl">How the units are handed out:</span>
    <div class="btn-group">
      <button
        type="button"
        class="btn-tab {mode === 'efficient' ? 'active' : ''}"
        onclick={() => (mode = "efficient")}>Efficient (top 44 values)</button
      >
      <button
        type="button"
        class="btn-tab {mode === 'random' ? 'active' : ''}"
        onclick={() => (mode = "random")}>Random rationing (lottery)</button
      >
      <button
        type="button"
        class="btn-tab {mode === 'compare' ? 'active' : ''}"
        onclick={() => (mode = "compare")}>Side by side</button
      >
    </div>
  </div>

  <div class="queue-visuals">
    <!-- Visual Spectrum: Willing Buyers from £12 to £40 -->
    <div class="spectrum-wrap">
      <div class="spectrum-labels">
        <span class="spec-lbl min-lbl">Ceiling price: £{vMin} (84th buyer)</span>
        <span class="spec-lbl cut-lbl">Efficient cut-off: £{vCutoffEff.toFixed(1)} (44th buyer)</span>
        <span class="spec-lbl max-lbl">Highest valuation: £{vMax} (1st buyer)</span>
      </div>

      <!-- Spectrum Bar -->
      <div class="spectrum-bar">
        <div class="spec-segment low-segment">
          <span class="seg-text">40 lower-value buyers (£12 to £25.3)</span>
        </div>
        <div class="spec-segment high-segment">
          <span class="seg-text">44 higher-value buyers (£25.3 to £40)</span>
        </div>
      </div>
    </div>

    <!-- Comparative Breakdown Cards -->
    <div class="cards-grid">
      <div class="alloc-card eff-card {mode === 'random' ? 'dimmed' : ''}">
        <div class="alloc-head">
          <span class="alloc-title">Efficient allocation (price or quota)</span>
          <span class="alloc-badge eff-badge">No misallocation</span>
        </div>
        <p class="alloc-desc">
          Only buyers willing to pay at least £{vCutoffEff.toFixed(1)} receive a unit.
        </p>
        <ul class="alloc-stats">
          <li>Average valuation: <strong>£{avgValEff.toFixed(2)}</strong> per unit</li>
          <li>Total value: <strong>£{(avgValEff * qSupplied).toFixed(1)}</strong></li>
          <li>Rationing loss: <strong>£0.00</strong></li>
        </ul>
      </div>

      <div class="alloc-card rand-card {mode === 'efficient' ? 'dimmed' : ''}">
        <div class="alloc-head">
          <span class="alloc-title">Random rationing (price ceiling)</span>
          <span class="alloc-badge rand-badge">First-order loss</span>
        </div>
        <p class="alloc-desc">
          The units go to buyers in the queue at random, as in a lottery.
        </p>
        <ul class="alloc-stats">
          <li>Average valuation: <strong>£{avgValRand.toFixed(2)}</strong> per unit</li>
          <li>Total value: <strong>£{(avgValRand * qSupplied).toFixed(1)}</strong></li>
          <li>Rationing loss: <strong class="loss-text">£{misTotal.toFixed(1)}</strong></li>
        </ul>
      </div>
    </div>
  </div>

  <p class="caption">
    Random rationing hands some of the units to buyers lower down the queue, so the average value per unit falls from £32.67 to £26.00.
  </p>
</div>

<style>
  .queue-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.25rem;
    margin: 2rem auto;
    max-width: 680px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .card-head {
    margin-bottom: 1.25rem;
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

  .allocation-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
  }
  .toggle-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    color: #4a5568;
    font-weight: 600;
  }
  .btn-group {
    display: flex;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
    flex-wrap: wrap;
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

  .spectrum-wrap {
    margin-bottom: 1.5rem;
  }
  .spectrum-labels {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono, monospace);
    font-size: 0.68rem;
    color: #64748b;
    margin-bottom: 0.35rem;
  }
  .spectrum-bar {
    display: flex;
    height: 32px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #cbd5e1;
  }
  .spec-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    font-weight: 600;
  }
  .low-segment {
    flex: 40;
    background: #f1f5f9;
    color: #64748b;
    border-right: 2px dashed #94a3b8;
  }
  .high-segment {
    flex: 44;
    background: #dbeafe;
    color: #1e40af;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  @media (max-width: 580px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }
  .alloc-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.85rem;
    transition: opacity 0.2s;
  }
  .alloc-card.dimmed {
    opacity: 0.35;
  }
  .alloc-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }
  .alloc-title {
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--squidink, #232f3e);
  }
  .alloc-badge {
    font-family: var(--font-mono, monospace);
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
  }
  .eff-badge {
    background: #dcfce7;
    color: #15803d;
  }
  .rand-badge {
    background: #fee2e2;
    color: #b91c1c;
  }
  .alloc-desc {
    font-size: 0.78rem;
    color: #64748b;
    margin: 0 0 0.6rem 0;
    line-height: 1.4;
  }
  .alloc-stats {
    list-style: none;
    margin: 0;
    padding: 0;
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .loss-text {
    color: #b91c1c;
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
