<script>
  /* TheSecondBoat.svelte: the lake with one owner, next to the lake shared by two boats */
  import { closedEffort, rent, output, effEffort, effRent, W_DEFAULT as w } from "../commons.js";

  const fmt = (v, d = 0) => v.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const E1 = effEffort(); // 2500
  const R1 = effRent(); // 2500
  const E2 = closedEffort(2); // 5625
  const R2 = rent(E2); // 1875
  const loss2 = R1 - R2; // 625
  const pctLoss2 = (loss2 / R1) * 100; // 25.0
  const hoursUp = ((E2 - E1) / E1) * 100; // 125
</script>

<div class="card" id="second-boat">
  <div class="card-header">
    <h3 class="card-title">A second boat arrives</h3>
    <p class="card-sub">
      Here's our lake with one owner, next to the same lake shared by two
      boats. Compare the hours with the catch.
    </p>
  </div>

  <div class="comparison-grid">
    <div class="comp-col">
      <div class="col-head">One owner (n = 1)</div>
      <div class="comp-stat">Hours fished: <strong>{fmt(E1)}</strong></div>
      <div class="comp-stat">Catch worth: <strong>£{fmt(output(E1))}</strong></div>
      <div class="comp-stat">Cost of time: <strong>£{fmt(w * E1)}</strong></div>
      <div class="comp-stat highlight-green">Rent: <strong class="sb-rent">£{fmt(R1, 2)}</strong></div>
      <div class="comp-sub">All of the rent the lake can earn</div>
    </div>

    <div class="comp-col highlight-col">
      <div class="col-head">Two boats (n = 2)</div>
      <div class="comp-stat">Hours fished: <strong class="text-pink sb-hours">{fmt(E2)}</strong> (+{fmt(hoursUp)}%)</div>
      <div class="comp-stat">Catch worth: <strong>£{fmt(output(E2))}</strong></div>
      <div class="comp-stat">Cost of time: <strong class="text-pink">£{fmt(w * E2)}</strong></div>
      <div class="comp-stat highlight-pink">Rent: <strong class="sb-rent">£{fmt(R2, 2)}</strong></div>
      <div class="comp-sub text-pink">
        <strong class="sb-loss">−£{fmt(loss2)} ({pctLoss2.toFixed(1)}%)</strong> of the rent lost
      </div>
    </div>
  </div>

  <div class="insight-box">
    <strong>Why do the hours more than double?</strong><br />
    Each boat feels only its own share of the crowding it causes, so both
    boats keep fishing past the point where the last hour pays for itself.
  </div>
</div>

<style>
  .card {
    border: 3px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2rem 0;
    background: #fff;
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
    font-size: 0.95rem;
    font-weight: 800;
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
