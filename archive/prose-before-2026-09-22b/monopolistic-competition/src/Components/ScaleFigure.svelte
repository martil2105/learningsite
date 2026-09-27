<script>
  /* ScaleFigure.svelte - The convergence table across market sizes */
  import { nOf, pOf, scaleOf, scaleDS, scaleShortfall, C_DEFAULT as c } from "../ces.js";

  const f = 5;
  const sigma = 4;
  const xDS = scaleDS(f, sigma, c); // 15.000

  const data = [
    { E: 100, label: "$100" },
    { E: 200, label: "$200" },
    { E: 400, label: "$400" },
    { E: 1000, label: "$1,000" },
    { E: 10000, label: "$10,000" },
    { E: 1000000, label: "$1,000,000" },
  ].map(({ E, label }) => {
    const n = nOf(E, f, sigma);
    const p = pOf(n, sigma, c);
    const x = scaleOf(n, E, sigma, c);
    const shortfall = scaleShortfall(n);
    return {
      E,
      label,
      n: n.toFixed(2),
      p: p.toFixed(4),
      x: x.toFixed(3),
      shortfall: (100 * shortfall).toFixed(3) + "%",
    };
  });
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">Scale Convergence Across Market Sizes</h3>
    <p class="card-sub">
      Parameters: Fixed cost <em>f</em> = $5, Substitutability <em>&sigma;</em> = 4, Marginal cost <em>c</em> = $1. Large-group limit scale is <em>x</em><sub>DS</sub> = 15.000 units.
    </p>
  </div>

  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Market Size (E)</th>
          <th>Varieties (n)</th>
          <th>Firm Output (x)</th>
          <th>Shortfall (1/n)</th>
          <th>Price (p)</th>
        </tr>
      </thead>
      <tbody>
        {#each data as row}
          <tr>
            <td class="font-bold">{row.label}</td>
            <td class="font-mono">{row.n}</td>
            <td class="font-mono text-purple font-bold">{row.x}</td>
            <td class="font-mono">{row.shortfall}</td>
            <td class="font-mono">${row.p}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="caption">
    <strong>Figure 3. The 1/n scale shortfall.</strong> At small market size ($E = 100$), each firm operates at only 12.39 units — 17.4% below asymptotic capacity. In a million-dollar market, 50,000 varieties emerge and individual firms produce 14.9997 units, matching large-group theory to four decimal places.
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
