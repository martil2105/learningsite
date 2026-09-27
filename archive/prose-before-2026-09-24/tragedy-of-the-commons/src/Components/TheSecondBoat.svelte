<script>
  /* TheSecondBoat.svelte - The catastrophic entry of boat #2 */
  import { closedEffort, rent, effEffort, effRent } from "../commons.js";

  const E1 = effEffort(0.5); // 2500
  const R1 = effRent(0.5); // 2500
  const E2 = closedEffort(2, 0.5); // 5625
  const R2 = rent(E2, 0.5); // 1875
  const loss2 = R1 - R2; // 625
  const pctLoss2 = (loss2 / R1) * 100; // 25.0%
</script>

<div class="card">
  <div class="card-header">
    <div class="card-badge">The Critical Tipping Point</div>
    <h3 class="card-title">Enter Boat #2: The 25% Destruction</h3>
    <p class="card-sub">
      What happens when the lake becomes an open-access common pool and a second fisher arrives?
    </p>
  </div>

  <div class="comparison-grid">
    <div class="comp-col">
      <div class="col-head">Sole Owner (n = 1)</div>
      <div class="comp-stat">Total Fishing Effort: <strong>2,500 hrs</strong></div>
      <div class="comp-stat">Catch Value: <strong>$5,000</strong></div>
      <div class="comp-stat">Labor Cost: <strong>$2,500</strong></div>
      <div class="comp-stat highlight-green">Total Rent: <strong>$2,500.00</strong></div>
      <div class="comp-sub">100% of wealth captured</div>
    </div>

    <div class="comp-col highlight-col">
      <div class="col-head">Duopoly Commons (n = 2)</div>
      <div class="comp-stat">Total Fishing Effort: <strong class="text-pink">5,625 hrs (+125%)</strong></div>
      <div class="comp-stat">Catch Value: <strong>$7,500</strong></div>
      <div class="comp-stat">Labor Cost: <strong class="text-pink">$5,625</strong></div>
      <div class="comp-stat highlight-pink">Total Rent: <strong>$1,875.00</strong></div>
      <div class="comp-sub text-pink">
        <strong>&minus;${loss2.toFixed(0)} ({pctLoss2.toFixed(1)}%) dissipated!</strong>
      </div>
    </div>
  </div>

  <div class="insight-box">
    <strong>Why did effort explode from 2,500 to 5,625?</strong><br />
    Each fisher takes home the <em>average product</em> of their boat. When boat #2 drops its nets, it captures fish that boat #1 would have caught. Boat #2 gains a private catch, but inflicts a negative congestion externality on boat #1 that it completely ignores. In attempting to steal each other's catch, both fishers over-fish drastically.
  </div>
</div>

<style>
  .card {
    border: 3px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2rem 0;
    background: #fff;
  }
  .card-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: var(--paper, #f1f3f3);
    padding: 0.2rem 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 2px;
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
    margin: 1.25rem 0;
  }
  .comp-col {
    border: 1px solid var(--stone, #d4dada);
    padding: 1rem;
    border-radius: 4px;
    background: #fafafa;
  }
  .highlight-col {
    border-color: var(--crimson, #c53030);
    background: #fff5f5;
  }
  .col-head {
    font-size: 0.85rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.75rem;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid var(--stone, #d4dada);
  }
  .comp-stat {
    font-size: 0.9rem;
    margin-bottom: 0.35rem;
  }
  .highlight-green {
    color: #2f855a;
    font-weight: 700;
  }
  .highlight-pink {
    color: #c53030;
    font-weight: 700;
  }
  .comp-sub {
    font-size: 0.8rem;
    margin-top: 0.5rem;
  }
  .text-pink {
    color: #c53030;
  }
  .insight-box {
    background: var(--paper, #f1f3f3);
    padding: 1rem;
    border-radius: 4px;
    font-size: 0.9rem;
    line-height: 1.55;
    border-left: 3px solid var(--violet, #7c5aed);
  }
</style>
