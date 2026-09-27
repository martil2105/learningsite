<script>
  /*
    Two theories, one answer. The rows are impatience-rate pairs; the columns
    are the strategic route (alternating offers, evaluated at a fine period)
    and the axiomatic route (the Nash product, maximised by golden section in
    src/bargain.js, sharing no code with the closed form). A matrix is
    tabular, so this is an HTML table, not an SVG — and the columns are kept
    narrow enough to hold a 390px phone without scrolling.
  */
  import { rubinstein, discount, nashShare } from "../bargain.js";

  const PAIRS = [
    { rA: 0.05, rB: 0.15 },
    { rA: 0.1, rB: 0.1 },
    { rA: 0.02, rB: 0.18 },
    { rA: 0.12, rB: 0.04 },
  ];
  const DT = 0.001;

  const rows = PAIRS.map(({ rA, rB }) => {
    const strategic = rubinstein(discount(rA, DT), discount(rB, DT));
    const axiomatic = nashShare(rA, rB);
    return { rA, rB, strategic, axiomatic, diff: Math.abs(strategic - axiomatic) };
  });

  let worst = $derived(Math.max(...rows.map((r) => r.diff)));
</script>

<div class="fig" id="nash-check">
  <p class="fig-title">
    The two routes agree to {worst.toExponential(1)} — a theorem, not a tuning choice.
  </p>

  <table class="grid-table">
    <thead>
      <tr>
        <th scope="col">r_A</th>
        <th scope="col">r_B</th>
        <th scope="col">offers</th>
        <th scope="col">Nash</th>
        <th scope="col">gap</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr>
          <td>{row.rA}</td>
          <td>{row.rB}</td>
          <td>{(row.strategic * 100).toFixed(2)}%</td>
          <td>{(row.axiomatic * 100).toFixed(2)}%</td>
          <td>{row.diff.toExponential(1)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .fig { max-width: 640px; margin: 1.5rem auto; padding: 0 1rem; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .grid-table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.82rem; }
  .grid-table th, .grid-table td { padding: 7px 10px; text-align: right; border-bottom: 1px solid #e3e7ea; }
  .grid-table th { color: #5a6672; font-weight: 600; font-size: 0.75rem; }
  .grid-table td:first-child, .grid-table td:nth-child(2) { color: #5a6672; }
</style>