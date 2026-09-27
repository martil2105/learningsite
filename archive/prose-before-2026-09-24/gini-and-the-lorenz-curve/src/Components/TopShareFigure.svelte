<script>
  /* TopShareFigure.svelte - Pareto vs Lognormal with same Gini */
  import { topPareto, topLognormal } from "../inequality.js";

  const G = 0.4;
  const alpha = 1.75;
  const sig = 0.741614;

  const rows = [
    { p: 0.1, label: "Top 10%" },
    { p: 0.05, label: "Top 5%" },
    { p: 0.01, label: "Top 1%" },
    { p: 0.001, label: "Top 0.1%" },
  ].map(({ p, label }) => {
    const par = topPareto(p, alpha) * 100;
    const ln = topLognormal(p, sig, 100000) * 100;
    const ratio = par / ln;
    return {
      label,
      par: par.toFixed(2) + "%",
      ln: ln.toFixed(2) + "%",
      ratio: ratio.toFixed(2) + "×",
    };
  });
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">The Fat-Tail Blind Spot: Pareto vs. Lognormal</h3>
    <p class="card-sub">
      Both distributions below have an identical Gini coefficient of <strong>G = 0.400</strong>. But look at where the wealth resides in the extreme upper tail.
    </p>
  </div>

  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Income Bracket</th>
          <th>Pareto Tail (&alpha; = 1.75)</th>
          <th>Lognormal Tail (&sigma; = 0.74)</th>
          <th>Concentration Ratio</th>
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
    <strong>Figure 3. The Piketty-Saez tail divergence.</strong> At the top 1%, the power-law Pareto distribution concentrates 13.90% of all income — nearly 2.5 times the lognormal's 5.65%. At the ultra-rich top 0.1%, the Pareto concentration is <strong>5.50 times higher</strong>! A policy maker looking solely at Gini would conclude both economies are equally unequal.
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
