<script>
  /* ThresholdFigure.svelte - Required cartel size vs industry size */
  import { kMin, maxOutsiders } from "../cournot.js";

  const benchmarks = [
    { n: 5 },
    { n: 6 },
    { n: 10 },
    { n: 20 },
    { n: 50 },
    { n: 100 },
    { n: 1000 },
  ].map(({ n }) => {
    const k = kMin(n);
    const m = maxOutsiders(n);
    const pct = ((100 * k) / n).toFixed(1);
    return { n, k, m, pct };
  });
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">The Free-Rider Ceiling: &lfloor;&radic;n&rfloor; &minus; 2</h3>
    <p class="card-sub">
      How large must a cartel be to earn even a single penny above uncoordinated competition? As an industry expands, almost <em>everyone</em> must collude.
    </p>
  </div>

  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Industry Size (n)</th>
          <th>Min Cartel Size (k<sub>min</sub>)</th>
          <th>Industry Share Required</th>
          <th>Max Permissible Outsiders (m)</th>
        </tr>
      </thead>
      <tbody>
        {#each benchmarks as row}
          <tr>
            <td class="font-bold">{row.n} firms</td>
            <td class="font-mono text-purple font-bold">{row.k} firms</td>
            <td class="font-mono">{row.pct}%</td>
            <td class="font-mono font-bold">{row.m} {row.m === 1 ? "firm" : "firms"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="caption">
    <strong>Figure 3. The square-root bound.</strong> The number of firms that can stay out and free-ride scales only as <code>&lfloor;&radic;n&rfloor; &minus; 2</code>. In an industry of 100 firms, at most 8 firms can free-ride (92 must join). In an industry of 1,000 firms, 970 must collude. Partial cartels in fragmented markets are mathematically doomed to fail.
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
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  .data-table th,
  .data-table td {
    padding: 0.75rem 0.85rem;
    text-align: left;
    border-bottom: 1px solid var(--stone, #d4dada);
  }
  .data-table th {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: var(--paper, #f1f3f3);
    color: var(--squidink, #232f3e);
  }
  .data-table tbody tr:hover {
    background: rgba(124, 90, 237, 0.04);
  }
  .font-mono {
    font-family: monospace;
  }
  .font-bold {
    font-weight: 700;
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
