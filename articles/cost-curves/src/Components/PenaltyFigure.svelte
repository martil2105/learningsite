<script>
  /* PenaltyFigure.svelte: the second-order cost of building the wrong plant size */
  import { plantPenalty } from "../cost.js";

  const levels = [0.01, 0.05, 0.1, 0.2, 0.5];
  const base = plantPenalty(0.01);
  const rows = levels.map((e) => {
    const pen = plantPenalty(e);
    return {
      label: `±${Math.round(100 * e)}%`,
      pen: `${(100 * pen).toFixed(4)}%`,
      mult: `${Math.round(pen / base).toLocaleString("en-GB")}×`,
    };
  });
  const p1 = plantPenalty(0.001);
  const p2 = plantPenalty(0.002);
</script>

<div class="card" id="penalty-figure">
  <div class="card-header">
    <h3 class="card-title">What a wrong plant costs</h3>
    <p class="card-sub">
      The extra cost of making 50 units with a plant that's too big or too
      small by the share in the first column.
    </p>
  </div>

  <div class="table-wrap">
    <table class="penalty-table">
      <thead>
        <tr>
          <th>Plant size error</th>
          <th>Extra total cost</th>
          <th>Compared with a 1% error</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row}
          <tr>
            <td class="font-mono font-bold">{row.label}</td>
            <td class="font-mono text-purple font-bold">{row.pen}</td>
            <td class="font-mono">{row.mult}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="callout">
    <div class="callout-tag">The halving test</div>
    <p class="callout-text">
      An error of 0.1% costs {(100 * p1).toFixed(6)}% extra, and an error of 0.2%
      costs {(100 * p2).toFixed(6)}%, which is {(p2 / p1).toFixed(2)} times as
      much. Double the mistake and the penalty roughly quadruples.
    </p>
  </div>
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
  .penalty-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    text-align: left;
  }
  th {
    padding: 0.6rem 0.8rem;
    border-bottom: 2px solid var(--squidink, #232f3e);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  td {
    padding: 0.6rem 0.8rem;
    border-bottom: 1px solid #d4dada;
  }
  .font-bold {
    font-weight: 700;
  }
  .text-purple {
    color: var(--violet, #7c5aed);
  }
  .callout {
    background: rgba(124, 90, 237, 0.08);
    border-left: 3px solid var(--violet, #7c5aed);
    padding: 0.85rem 1.1rem;
  }
  .callout-tag {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--violet, #7c5aed);
    margin-bottom: 0.3rem;
  }
  .callout-text {
    font-size: 0.88rem;
    line-height: 1.5;
    margin: 0;
    color: var(--squidink, #232f3e);
  }
</style>
