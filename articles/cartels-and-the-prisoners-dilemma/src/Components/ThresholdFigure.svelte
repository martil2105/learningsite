<script>
  /* ThresholdFigure.svelte: the smallest cartel that pays, by market size */
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

<div class="card" id="threshold-table">
  <div class="card-header">
    <h3 class="card-title">How big a cartel has to be</h3>
    <p class="card-sub">
      Each row is one size of market. Notice how few firms can stay out, even
      in a big market.
    </p>
  </div>

  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Firms in the market (n)</th>
          <th>Smallest cartel that pays</th>
          <th>Share of the market</th>
          <th>Most firms that can stay out (m)</th>
        </tr>
      </thead>
      <tbody>
        {#each benchmarks as row}
          <tr>
            <td class="font-bold">{row.n.toLocaleString("en-GB")}</td>
            <td class="font-mono text-purple font-bold">{row.k.toLocaleString("en-GB")}</td>
            <td class="font-mono">{row.pct}%</td>
            <td class="font-mono font-bold">{row.m}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="caption">
    The last column grows only about as fast as the square root of the first,
    so in a big market nearly every firm has to join.
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
    font-size: 0.85rem;
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
