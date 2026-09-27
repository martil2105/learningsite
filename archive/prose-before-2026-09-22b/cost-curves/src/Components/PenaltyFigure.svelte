<script>
  /* PenaltyFigure.svelte: The second-order cost of building the wrong plant size */
  import { plantPenalty } from "../cost.js";

  const errorLevels = [
    { label: "±1%", e: 0.01, penStr: "0.0043%", mult: "1×" },
    { label: "±5%", e: 0.05, penStr: "0.1043%", mult: "24×" },
    { label: "±10%", e: 0.10, penStr: "0.3982%", mult: "92×" },
    { label: "±20%", e: 0.20, penStr: "1.4602%", mult: "336×" },
    { label: "±50%", e: 0.50, penStr: "7.3008%", mult: "1,682×" }
  ];
</script>

<div class="card" id="penalty-figure">
  <div class="card-header">
    <h3 class="card-title">Why Nobody Noticed: The Flat Maximum</h3>
    <p class="card-sub">
      If firms run plants off-peak, why does the textbook mistake persist? Because the envelope is locally flat: near the cost minimum, the penalty for building the wrong plant is strictly <strong>second-order ($O(e^2)$)</strong>.
    </p>
  </div>

  <div class="table-wrap">
    <table class="penalty-table">
      <thead>
        <tr>
          <th>Plant Size Error (e)</th>
          <th>Total Cost Penalty</th>
          <th>Penalty Multiplier</th>
          <th>Practical Impact</th>
        </tr>
      </thead>
      <tbody>
        {#each errorLevels as row}
          <tr>
            <td class="font-mono font-bold">{row.label}</td>
            <td class="font-mono text-purple font-bold">{row.penStr}</td>
            <td class="font-mono">{row.mult}</td>
            <td class="note-col">
              {#if row.e === 0.01}
                Practically zero (less than 1 part in 20,000)
              {:else if row.e === 0.05}
                One-tenth of one percent
              {:else if row.e === 0.10}
                Under 0.4% total cost increase
              {:else if row.e === 0.20}
                Modest 1.5% cost increase
              {:else}
                7.3% even with a 50% capacity miscalculation
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="callout">
    <div class="callout-tag">The Doubling Test</div>
    <p class="callout-text">
      Halving the error quarters the penalty: at $e = 0.001$, the penalty is $0.000043\%$; at $e = 0.002$, it is $0.000174\%$ ($3.996\times$). The envelope's mathematical flatness is what makes the drawing error invisible and the managerial decision remarkably forgiving at the same time.
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
  .note-col {
    color: #555;
    font-size: 0.85rem;
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
