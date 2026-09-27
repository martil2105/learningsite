<script>
  /* TopShareFigure.svelte - Pareto vs lognormal with the same Gini */
  import { topPareto, topLognormalExact, TOP_G, paretoAlpha, lognormalSigma } from "../inequality.js";

  const alpha = paretoAlpha(TOP_G);
  const sig = lognormalSigma(TOP_G);

  const rows = [
    { p: 0.1, label: "Top 10%" },
    { p: 0.05, label: "Top 5%" },
    { p: 0.01, label: "Top 1%" },
    { p: 0.001, label: "Top 0.1%" },
  ].map(({ p, label }) => {
    const par = topPareto(p, alpha) * 100;
    const ln = topLognormalExact(p, sig) * 100;
    return {
      label,
      par: par.toFixed(2) + "%",
      ln: ln.toFixed(2) + "%",
      ratio: (par / ln).toFixed(2) + "×",
    };
  });
</script>

<div class="card" id="top-share-figure">
  <div class="card-header">
    <h3 class="card-title">Same Gini, different top shares</h3>
    <p class="card-sub">
      Both distributions have a Gini of {TOP_G.toFixed(1)}. Read down the table,
      towards smaller and richer groups.
    </p>
  </div>

  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Richest group</th>
          <th>Pareto (α = {alpha.toFixed(2)})</th>
          <th>Lognormal (σ = {sig.toFixed(2)})</th>
          <th>Ratio</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr class:extreme-row={r.label === "Top 0.1%"}>
            <td class="font-bold">{r.label}</td>
            <td class="font-mono text-pink font-bold">{r.par}</td>
            <td class="font-mono text-blue">{r.ln}</td>
            <td class="font-mono font-bold text-purple">{r.ratio}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="caption">
    Each cell is the share of all income that the group holds. Notice how the
    ratio column keeps growing as the group gets smaller.
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
    padding: 0.6rem 0.6rem;
    text-align: left;
    border-bottom: 1px solid var(--stone, #d4dada);
  }
  .data-table th {
    font-size: 0.8rem;
    background: var(--paper, #f1f3f3);
    color: var(--squidink, #232f3e);
  }
  .extreme-row {
    background: rgba(124, 90, 237, 0.05);
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
  .text-blue {
    color: #2b6cb0;
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
