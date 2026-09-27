<script>
  /* WelfareFigure.svelte - Deadweight loss and consumer surplus destruction from collusion */
  import { price, consumerSurplus, totalSurplus, member, outsider } from "../cournot.js";

  const cs5 = consumerSurplus(5, 1); // 2812.5
  const cs4 = consumerSurplus(5, 4); // 1800.0
  const p5 = price(5, 1); // 25
  const p4 = price(5, 4); // 40

  const ts5 = totalSurplus(5, 1); // 2812.5 + 1125 = 3937.5
  const ts4 = totalSurplus(5, 4); // 1800 + 4*225 + 900 = 3600
  const dwl4 = ts5 - ts4; // 337.5
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">Welfare Impact: Who Pays for Collusion?</h3>
    <p class="card-sub">
      Comparing standard 5-firm competition against a 4-firm cartel (<em>n</em> = 5, <em>k</em> = 4).
    </p>
  </div>

  <div class="comparison-grid">
    <div class="comp-col">
      <div class="col-head">Standard Competition (n = 5)</div>
      <div class="comp-metric">Market Price: <strong>${p5.toFixed(2)}</strong></div>
      <div class="comp-metric">Consumer Surplus: <strong class="text-blue">${cs5.toFixed(1)}</strong></div>
      <div class="comp-metric">Industry Profits: <strong>$1,125.0</strong></div>
      <div class="comp-metric total-metric">Total Surplus: <strong>${ts5.toFixed(1)}</strong></div>
    </div>

    <div class="comp-col highlight-col">
      <div class="col-head">4-Firm Cartel (k = 4, 1 Outsider)</div>
      <div class="comp-metric">Market Price: <strong class="text-pink">${p4.toFixed(2)} (+60%)</strong></div>
      <div class="comp-metric">Consumer Surplus: <strong class="text-pink">${cs4.toFixed(1)} (&minus;36%)</strong></div>
      <div class="comp-metric">Industry Profits: <strong>$1,800.0</strong></div>
      <div class="comp-metric total-metric">
        Deadweight Loss: <strong class="text-pink">${dwl4.toFixed(1)}</strong>
      </div>
    </div>
  </div>

  <p class="caption">
    <strong>Figure 4. The social destruction of collusion.</strong> The price jumps from $25 to $40, destroying $1,012.50 of consumer surplus. The four cartel members earn nothing extra ($225 each). Almost all transferred surplus ($675) is captured by the single outsider, leaving a deadweight loss of $337.50.
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
  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
    margin: 1rem 0;
  }
  .comp-col {
    border: 1px solid var(--stone, #d4dada);
    padding: 1.25rem;
    border-radius: 4px;
    background: #fafafa;
  }
  .highlight-col {
    border-color: var(--violet, #7c5aed);
    background: #faf9ff;
  }
  .col-head {
    font-size: 0.85rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.85rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid var(--stone, #d4dada);
  }
  .comp-metric {
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }
  .total-metric {
    margin-top: 0.85rem;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--stone, #d4dada);
    font-size: 1rem;
  }
  .text-blue {
    color: #2b6cb0;
  }
  .text-pink {
    color: #c53030;
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
