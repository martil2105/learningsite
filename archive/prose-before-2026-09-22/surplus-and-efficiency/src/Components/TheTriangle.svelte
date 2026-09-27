<script>
  /*
    TheTriangle.svelte — The Left Channel in detail:
    The closed-form DWL triangle ½k(q* - q)², why it is second order (d²),
    and why total surplus is maximised at q* = 60.
  */
  import MarketPanel from "./MarketPanel.svelte";
  import { q0, TS0, triangleLoss } from "../market.js";

  const dTable = [
    { cutPct: "1%", d: 0.01, lossPct: "0.01%", lossVal: (TS0 * 0.0001).toFixed(2) },
    { cutPct: "5%", d: 0.05, lossPct: "0.25%", lossVal: (TS0 * 0.0025).toFixed(2) },
    { cutPct: "10%", d: 0.10, lossPct: "1.00%", lossVal: (TS0 * 0.0100).toFixed(1) },
    { cutPct: "20%", d: 0.20, lossPct: "4.00%", lossVal: (TS0 * 0.0400).toFixed(1) },
    { cutPct: "30%", d: 0.30, lossPct: "9.00%", lossVal: (TS0 * 0.0900).toFixed(1) },
    { cutPct: "50%", d: 0.50, lossPct: "25.00%", lossVal: (TS0 * 0.2500).toFixed(1) },
  ];

  let activeCut = $state(0.10); // 10% cut default
  let qCurr = $derived(q0 * (1 - activeCut));
  let lossCurr = $derived(triangleLoss(qCurr));
  let shareCurr = $derived((lossCurr / TS0) * 100);
</script>

<div class="triangle-card" id="the-triangle">
  <div class="card-head">
    <h3>The Textbook Triangle: A Strictly Quadratic Loss</h3>
    <p class="head-sub">
      Whenever quantity falls short of the competitive optimum <em>q</em>* = 60, mutually beneficial trades are prevented. Because the gap between buyer valuation and seller cost shrinks to zero at the crossing, the resulting deadweight loss is <strong>second order</strong>: the fraction of surplus lost is identically <em>d</em>².
    </p>
  </div>

  <div class="content-row">
    <div class="panel-box">
      <div class="cut-selector">
        <span class="sel-lbl">Select Quantity Cut (<em>d</em>):</span>
        <div class="btn-group">
          {#each [0.05, 0.10, 0.20, 0.30, 0.50] as cv}
            <button
              type="button"
              class="btn-tab {activeCut === cv ? 'active' : ''}"
              onclick={() => (activeCut = cv)}>{(cv * 100).toFixed(0)}%</button
            >
          {/each}
        </div>
      </div>

      <MarketPanel
        shading={{ triangle: true, q: qCurr }}
        height={260}
        ariaLabel="Deadweight loss triangle at chosen quantity cut"
      />

      <div class="panel-stat">
        At <em>q</em> = {qCurr.toFixed(1)} (cut <em>d</em> = {(activeCut * 100).toFixed(0)}%):
        triangle loss = <strong>{lossCurr.toFixed(1)}</strong> ({shareCurr.toFixed(2)}% of <em>TS</em>*)
      </div>
    </div>

    <div class="table-box">
      <table class="d2-table">
        <thead>
          <tr>
            <th>Quantity Cut (<em>d</em>)</th>
            <th>Loss Share (<em>d</em>²)</th>
            <th>Surplus Lost</th>
          </tr>
        </thead>
        <tbody>
          {#each dTable as row}
            <tr class={Math.abs(row.d - activeCut) < 0.001 ? 'row-active' : ''}>
              <td>{row.cutPct}</td>
              <td class="cell-d2">{row.lossPct}</td>
              <td>£{row.lossVal}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      <div class="insight-box">
        <strong>Why Harberger's triangle is small:</strong> A 10% quantity shock eliminates trades whose private gains were already near the margin. The resulting loss is not 10%, but 10% of 10% — just 1.0% of total economic welfare.
      </div>
    </div>
  </div>

  <p class="caption">
    <strong>Figure 2. Identity A: Loss ÷ TS* = <em>d</em>².</strong> This quadratic relationship holds exactly across all linear markets, regardless of elasticities, intercepts, or market scale. 
  </p>
</div>

<style>
  .triangle-card {
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
  .content-row {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
  }
  @media (max-width: 650px) {
    .content-row {
      flex-direction: column;
    }
  }
  .panel-box {
    flex: 1 1 320px;
    min-width: 0;
  }
  .cut-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }
  .sel-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    color: #64748b;
  }
  .btn-group {
    display: flex;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    overflow: hidden;
  }
  .btn-tab {
    background: #f8fafc;
    border: none;
    padding: 0.25rem 0.5rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
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
    background: #df2a5d;
    color: #ffffff;
    font-weight: 600;
  }
  .panel-stat {
    margin-top: 0.4rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    color: #334155;
    text-align: center;
  }
  .panel-stat strong {
    color: #df2a5d;
  }

  .table-box {
    flex: 1 1 240px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .d2-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
  }
  .d2-table th {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    padding: 0.4rem 0.5rem;
    text-align: right;
    color: #475569;
  }
  .d2-table th:first-child {
    text-align: left;
  }
  .d2-table td {
    padding: 0.35rem 0.5rem;
    border-bottom: 1px solid #f1f5f9;
    text-align: right;
  }
  .d2-table td:first-child {
    text-align: left;
  }
  .row-active {
    background: #fff1f2;
    font-weight: 700;
  }
  .cell-d2 {
    color: #df2a5d;
    font-weight: 600;
  }
  .insight-box {
    background: #f8fafc;
    border-left: 3px solid #df2a5d;
    padding: 0.6rem 0.75rem;
    font-size: 0.8rem;
    color: #334155;
    line-height: 1.45;
  }

  .caption {
    font-size: 0.85rem;
    color: #64748b;
    line-height: 1.5;
    margin: 1rem 0 0 0;
    border-top: 1px solid #f1f5f9;
    padding-top: 0.75rem;
  }
</style>
