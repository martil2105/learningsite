<script>
  /*
    Labour demand never enters the wage. The table wants 1, 10, 100 and
    1000 workers; the solver in src/effort.js takes L as an argument and
    minimises total cost L·w/e(w) — it reads L — and returns one wage for
    all of them. A table is HTML.
  */
  import { WR, optimalWage, closedWage } from "../effort.js";

  const LS = [1, 10, 100, 1000];
  const rows = LS.map((L) => ({ L, wage: optimalWage(WR, 1, L) }));
  const closed = closedWage(WR, 1);
  let worst = $derived(Math.max(...rows.map((r) => Math.abs(r.wage - closed))));
  let spread = $derived(Math.max(...rows.map((r) => r.wage)) - Math.min(...rows.map((r) => r.wage)));
</script>

<div class="fig" id="size-check">
  <p class="fig-title">
    One firm wants {LS[0]} worker, another wants {LS[3]}: the solver reads the
    number and returns the same wage within {spread.toExponential(1)} of itself
    across all four — the closed form is {closed.toFixed(6)}.
  </p>

  <table class="grid-table">
    <thead>
      <tr>
        <th scope="col">workers wanted (L)</th>
        <th scope="col">wage the solver returns</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr>
          <td>{r.L}</td>
          <td>{r.wage.toFixed(4)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .fig { max-width: 480px; margin: 1.5rem auto; padding: 0 1rem; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .grid-table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.82rem; }
  .grid-table th, .grid-table td { padding: 6px 10px; text-align: right; border-bottom: 1px solid #e3e7ea; }
  .grid-table th { color: #5a6672; font-weight: 600; font-size: 0.72rem; text-align: right; }
</style>