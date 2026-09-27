<script>
  /* FreeRideFigure.svelte - The n = 5 worked case showing member vs outsider payoffs */
  import { piN, member, outsider } from "../cournot.js";

  const n = 5;
  const pi0 = piN(5); // 225

  const rows = [2, 3, 4, 5].map((k) => {
    const mem = member(5, k);
    const out = k < 5 ? outsider(5, k) : null;
    return {
      k,
      memVal: mem.toFixed(2),
      memRatio: (mem / pi0).toFixed(2),
      memStatus: mem > pi0 ? "Profitable" : mem === pi0 ? "Break-even" : "Loss",
      outVal: out !== null ? out.toFixed(2) : "—",
      outRatio: out !== null ? (out / pi0).toFixed(2) + "×" : "—",
    };
  });
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">The Worked Run: Collusion in a 5-Firm Market</h3>
    <p class="card-sub">
      Competitive baseline profit is <strong>$225.00</strong> per firm. Notice how cartels with 2 or 3 firms lose money, 4 firms break even, and outsiders capture extraordinary windfalls.
    </p>
  </div>

  <div class="table-wrap">
    <table class="run-table">
      <thead>
        <tr>
          <th>Cartel Size (k)</th>
          <th>Member Profit</th>
          <th>Member / Baseline</th>
          <th>Cartel Status</th>
          <th>Outsider Profit</th>
          <th>Outsider / Baseline</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr class:knife-edge={r.k === 4} class:monopoly={r.k === 5}>
            <td class="font-bold">{r.k} of 5</td>
            <td class="font-mono">${r.memVal}</td>
            <td class="font-mono font-bold" class:text-pink={r.memRatio < 1} class:text-green={r.memRatio > 1}>
              {r.memRatio}&times;
            </td>
            <td>
              <span class="badge" class:badge-loss={r.memRatio < 1} class:badge-even={r.k === 4} class:badge-gain={r.k === 5}>
                {r.memStatus}
              </span>
            </td>
            <td class="font-mono text-purple">{r.outVal !== "—" ? "$" + r.outVal : "—"}</td>
            <td class="font-mono font-bold text-purple">{r.outRatio}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="caption">
    <strong>Figure 2. The Knife-Edge at k = 4.</strong> When 4 of 5 firms collude, members earn exactly $225.00 — identical to pure competition. But the solitary firm that remained outside enjoys a 300% profit surge to $900.00. Because <code>900 &gt; 225</code>, every member wishes it were the outsider.
  </p>
</div>

<style>
  .card {
    border: 2px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2rem 0;
    background: #fff;
  }
  .card-header {
    margin-bottom: 1.25rem;
  }
  .card-title {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0 0 0.4rem 0;
  }
  .card-sub {
    font-size: 0.95rem;
    color: var(--squidink, #232f3e);
    opacity: 0.8;
    margin: 0;
  }
  .table-wrap {
    overflow-x: auto;
  }
  .run-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  .run-table th,
  .run-table td {
    padding: 0.75rem 0.85rem;
    text-align: left;
    border-bottom: 1px solid var(--stone, #d4dada);
  }
  .run-table th {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: var(--paper, #f1f3f3);
    color: var(--squidink, #232f3e);
  }
  .knife-edge {
    background: rgba(124, 90, 237, 0.06);
  }
  .monopoly {
    background: rgba(43, 108, 176, 0.05);
  }
  .badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-loss {
    background: #fed7d7;
    color: #c53030;
  }
  .badge-even {
    background: #e2e8f0;
    color: #4a5568;
  }
  .badge-gain {
    background: #c6f6d5;
    color: #2f855a;
  }
  .font-mono {
    font-family: monospace;
  }
  .font-bold {
    font-weight: 700;
  }
  .text-pink {
    color: #c53030;
  }
  .text-green {
    color: #2f855a;
  }
  .text-purple {
    color: var(--violet, #7c5aed);
  }
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 1rem 0 0 0;
    border-top: 1px solid var(--stone, #d4dada);
    padding-top: 0.5rem;
  }
</style>
