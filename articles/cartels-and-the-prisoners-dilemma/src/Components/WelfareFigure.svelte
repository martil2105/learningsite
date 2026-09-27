<script>
  /* WelfareFigure.svelte: who pays for a cartel of four in the five-firm market */
  import { price, consumerSurplus, totalSurplus } from "../cournot.js";

  const fmt = (v, d = 1) => v.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const p5 = price(5, 1); // 25
  const p4 = price(5, 4); // 40
  const cs5 = consumerSurplus(5, 1); // 2812.5
  const cs4 = consumerSurplus(5, 4); // 1800
  const ts5 = totalSurplus(5, 1); // 3937.5
  const ts4 = totalSurplus(5, 4); // 3600
  const prof5 = ts5 - cs5; // 1125
  const prof4 = ts4 - cs4; // 1800
  const dwl4 = ts5 - ts4; // 337.5
  const pUp = Math.round(100 * (p4 / p5 - 1)); // 60
  const csDown = Math.round(100 * (1 - cs4 / cs5)); // 36
</script>

<div class="card" id="welfare-figure">
  <div class="card-header">
    <h3 class="card-title">Before and after a cartel of four</h3>
    <p class="card-sub">
      Here are our five firms competing, next to a cartel of four with one
      outsider.
    </p>
  </div>

  <div class="comparison-grid">
    <div class="comp-col">
      <div class="col-head">Competition (n = 5)</div>
      <div class="comp-metric">Price: <strong class="w-price">{fmt(p5, 2)}</strong></div>
      <div class="comp-metric">Consumer surplus: <strong class="text-blue w-cs">{fmt(cs5)}</strong></div>
      <div class="comp-metric">Profit, all firms: <strong class="w-profit">{fmt(prof5)}</strong></div>
      <div class="comp-metric total-metric">Total surplus: <strong class="w-total">{fmt(ts5)}</strong></div>
    </div>

    <div class="comp-col highlight-col">
      <div class="col-head">Cartel of four (k = 4)</div>
      <div class="comp-metric">Price: <strong class="text-pink w-price">{fmt(p4, 2)}</strong> (+{pUp}%)</div>
      <div class="comp-metric">Consumer surplus: <strong class="text-pink w-cs">{fmt(cs4)}</strong> (−{csDown}%)</div>
      <div class="comp-metric">Profit, all firms: <strong class="w-profit">{fmt(prof4)}</strong></div>
      <div class="comp-metric total-metric">Total surplus: <strong class="w-total">{fmt(ts4)}</strong></div>
      <div class="comp-metric">Deadweight loss: <strong class="text-pink w-dwl">{fmt(dwl4)}</strong></div>
    </div>
  </div>

  <p class="caption">
    Read the two columns row by row. Consumers lose more than the firms gain,
    and the gap between the two is the deadweight loss.
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
    font-size: 0.95rem;
    font-weight: 800;
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
