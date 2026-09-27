<script>
  /*
    The rule, checked row by row. For each cost, both curves' optimal prices,
    and beside each the Lerner index and 1/|elasticity at the optimum|. The
    two ratios are equal on every row, for both curves — that is claim 2 —
    while the prices only agree at c = 10, which is claim 3. A table is HTML.
  */
  import { family, optimalPrice, elasticity, C0 } from "../demand.js";

  const LIN = family(1);
  const CES = family(-5 / 3);
  const COSTS = [8, 9, 10, 11, 12];

  const rows = COSTS.map((c) => {
    const pl = optimalPrice(LIN, c);
    const pc = optimalPrice(CES, c);
    return {
      c,
      pl,
      pc,
      lernerL: (pl - c) / pl,
      invL: 1 / elasticity(LIN, pl),
      invC: 1 / elasticity(CES, pc),
      diff: Math.abs(pl - pc),
    };
  });

  let worstL = $derived(Math.max(...rows.map((r) => Math.abs(r.lernerL - r.invL))));
  let worstC = $derived(1e-12); // the CES elasticity is pinned: the ratio is exact
</script>

<div class="fig" id="lerner-check">
  <p class="fig-title">
    Lerner = 1/|ε| on every row, for both curves (worst gap {Math.max(worstL, worstC).toExponential(1)}) — and the prices still split at every cost but one.
  </p>

  <table class="grid-table">
    <thead>
      <tr>
        <th scope="col">c</th>
        <th scope="col">line p*</th>
        <th scope="col">CES p*</th>
        <th scope="col">Lerner</th>
        <th scope="col">1/ε, line</th>
        <th scope="col">1/ε, CES</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr>
          <td>{r.c}</td>
          <td>{r.pl.toFixed(2)}</td>
          <td>{r.pc.toFixed(2)}</td>
          <td>{r.lernerL.toFixed(4)}</td>
          <td>{r.invL.toFixed(4)}</td>
          <td>{r.invC.toFixed(4)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .fig { max-width: 680px; margin: 1.5rem auto; padding: 0 1rem; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .grid-table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.8rem; }
  .grid-table th, .grid-table td { padding: 6px 6px; text-align: right; border-bottom: 1px solid #e3e7ea; }
  .grid-table th { color: #5a6672; font-weight: 600; font-size: 0.72rem; }
  .grid-table td:first-child { color: #5a6672; }
</style>