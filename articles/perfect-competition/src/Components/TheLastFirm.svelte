<script>
  /* TheLastFirm.svelte: the last few steps of the worked run */
  import { F, createMarket } from "../entry.js";

  const market = createMarket(600, 10);
  const rows = [-2, -1, 0, 1, 2].map((i) => {
    const n = market.nStar + i;
    const profit = market.profit(n);
    return {
      n,
      p: market.price(n),
      profit,
      status: i < 0 ? "Enters" : i === 0 ? "Enters, the last one" : "Stays out",
      active: i === 0,
      loss: profit < 0,
    };
  });
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">The last few firms</h3>
    <p class="card-sub">
      The price and each firm's profit around the point where entry stops, in
      the market with A = 600 and B = 10.
    </p>
  </div>

  <div class="table-wrap">
    <table class="run-table">
      <thead>
        <tr>
          <th>Firms (n)</th>
          <th>Price p(n)</th>
          <th>Profit per firm</th>
          <th>Share of fixed cost</th>
          <th>Firm n</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr class:highlight-row={r.active} class:loss-row={r.loss}>
            <td class="font-mono font-bold">{r.n}</td>
            <td class="font-mono">{r.p.toFixed(4)}</td>
            <td class="font-mono font-bold" class:text-pink={r.profit < 0} class:text-blue={r.profit > 0}>
              {r.profit > 0 ? "+" : "−"}{Math.abs(r.profit).toFixed(4)}
            </td>
            <td class="font-mono">{((100 * r.profit) / F).toFixed(2)}%</td>
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
    Profit stays positive up to the highlighted row and turns negative on the
    next one, so that's where entry stops.
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
