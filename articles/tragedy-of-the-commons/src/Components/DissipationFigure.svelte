<script>
  /* DissipationFigure.svelte: rent lost and hours fished as boats arrive */
  import { dissipatedRent, effortRatio, closedEffort, rent } from "../commons.js";

  const fmt = (v, d = 0) => v.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const rows = [1, 2, 3, 4, 5, 10, 20, 100].map((n) => {
    const d = dissipatedRent(n, 0.5);
    const ratio = effortRatio(n, 0.5);
    const e = closedEffort(n, 0.5);
    const r = rent(e, 0.5);
    return {
      n,
      dPct: (d * 100).toFixed(2) + "%",
      effort: fmt(e),
      ratio: ratio.toFixed(2) + "×",
      rent: "£" + fmt(r, 1),
    };
  });
</script>

<div class="card" id="dissipation-table">
  <div class="card-header">
    <h3 class="card-title">Rent lost as boats arrive</h3>
    <p class="card-sub">
      Each row adds boats to our square-root lake.
    </p>
  </div>

  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Boats (n)</th>
          <th>Rent lost</th>
          <th>Rent left</th>
          <th>Hours fished</th>
          <th>Hours ÷ E*</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr class:highlight-2={r.n === 2}>
            <td class="font-bold">{r.n}{r.n === 1 ? " (one owner)" : ""}</td>
            <td class="font-mono font-bold text-pink">{r.dPct}</td>
            <td class="font-mono text-green">{r.rent}</td>
            <td class="font-mono">{r.effort}</td>
            <td class="font-mono text-purple font-bold">{r.ratio}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="caption">
    Notice how the hours level off while the rent keeps shrinking. The last
    column creeps up towards four, and the rent left heads towards nothing.
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
  .highlight-2 {
    background: rgba(197, 48, 48, 0.05);
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
