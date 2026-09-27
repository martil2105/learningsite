<script>
  /*
    A stockpiling quarter: firms import €40 of finished goods ahead of a tariff
    and keep them in stock. The conventional release and the import-adjusted one,
    side by side, both computed by accounts.stockpile().
  */
  import { stockpile } from "../accounts.js";
  import { STOCKPILE } from "../datasets.js";

  const q = stockpile(STOCKPILE);
  const signed = (v) => (v > 0 ? `+€${v}` : v < 0 ? `−€${-v}` : "€0");
  const rows = [
    ["Consumption", "consumption"],
    ["Inventories", "inventories"],
    ["Net exports", "netExports"],
  ];
</script>

<div class="fig" id="release-table">
  <table>
    <thead>
      <tr><th></th><th class="num">As published</th><th class="num">Net of own imports</th></tr>
    </thead>
    <tbody>
      {#each rows as [label, key]}
        <tr><td>{label}</td><td class="num">{signed(q.conventional[key])}</td><td class="num">{signed(q.adjusted[key])}</td></tr>
      {/each}
      <tr class="total"><td>GDP</td><td class="num">{signed(q.dGDP)}</td><td class="num">{signed(q.dGDP)}</td></tr>
    </tbody>
  </table>
</div>

<style>
  .fig {
    max-width: 520px;
    margin: 1.5rem auto;
    padding: 0 1rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-main);
    font-size: 0.9rem;
    background: #fff;
    border: 1px solid #e3e7ea;
  }

  th {
    font-size: 0.82rem;
    color: #61707d;
    font-weight: 600;
    padding: 6px 10px;
    border-bottom: 1px solid #e3e7ea;
  }

  td {
    padding: 6px 10px;
    border-bottom: 1px solid #f0f2f4;
  }

  .num {
    text-align: right;
    font-family: var(--font-mono);
  }

  tr.total td {
    font-weight: 700;
  }
</style>
