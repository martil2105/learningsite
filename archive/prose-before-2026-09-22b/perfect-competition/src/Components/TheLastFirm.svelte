<script>
  /* TheLastFirm.svelte: Breakdown of the worked run and the integer constraint */
  import { F, acMin } from "../entry.js";

  const rows = [
    { n: 48, p: 24.705882, profit: 4.065744, status: "Profitable" },
    { n: 49, p: 24.492754, profit: 2.509977, status: "Profitable" },
    { n: 50, p: 24.285714, profit: 1.020408, status: "Equilibrium (stops here)", active: true },
    { n: 51, p: 24.084507, profit: -0.406665, status: "Stays out (loss)", loss: true },
    { n: 52, p: 23.888889, profit: -1.774691, status: "Loss", loss: true }
  ];
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">The Worked Run: Why Entry Halts at 50</h3>
    <p class="card-sub">
      In our baseline market (<em>A</em> = 600, <em>B</em> = 10), continuous zero-profit arithmetic would require <em>n̄</em> = 50.71 firms. But factories cannot arrive in decimal fractions.
    </p>
  </div>

  <div class="table-wrap">
    <table class="run-table">
      <thead>
        <tr>
          <th>Firms (n)</th>
          <th>Market Price p(n)</th>
          <th>Profit Per Firm π(n)</th>
          <th>% of Fixed Cost F</th>
          <th>Outcome</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr class:highlight-row={r.active} class:loss-row={r.loss}>
            <td class="font-mono font-bold">{r.n}</td>
            <td class="font-mono">{r.p.toFixed(4)}</td>
            <td class="font-mono font-bold" class:text-pink={r.profit < 0} class:text-blue={r.profit > 0}>
              {r.profit > 0 ? "+" : ""}{r.profit.toFixed(4)}
            </td>
            <td class="font-mono">{((100 * r.profit) / F).toFixed(3)}%</td>
            <td>
              <span class="badge" class:badge-active={r.active} class:badge-loss={r.loss}>
                {r.status}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="caption">
    Minimum average cost is min <em>AC</em> = {acMin.toFixed(4)}. The 50th firm leaves the market price at $24.2857 — exactly $0.1436 above minimum average cost. The 51st firm would push the price below $24.1421, inflicting a private loss of $0.4067. Because entry is voluntary, firm 51 refuses to enter. The incumbent 50 firms retain their profit perpetually.
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
    font-size: 1.3rem;
    font-weight: 800;
    margin: 0 0 0.4rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .card-sub {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    opacity: 0.85;
  }
  .table-wrap {
    overflow-x: auto;
    margin-bottom: 1.25rem;
  }
  .run-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    text-align: left;
  }
  th {
    padding: 0.6rem 0.8rem;
    border-bottom: 2px solid var(--squidink, #232f3e);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  td {
    padding: 0.6rem 0.8rem;
    border-bottom: 1px solid #d4dada;
  }
  .highlight-row {
    background: rgba(124, 90, 237, 0.08);
  }
  .loss-row {
    opacity: 0.65;
  }
  .font-bold {
    font-weight: 700;
  }
  .text-blue {
    color: #2074d5;
  }
  .text-pink {
    color: #df2a5d;
  }
  .badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 3px;
    background: #e5e9e9;
  }
  .badge-active {
    background: var(--violet, #7c5aed);
    color: #fff;
  }
  .badge-loss {
    background: rgba(223, 42, 93, 0.15);
    color: #df2a5d;
  }
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 0;
  }
</style>
