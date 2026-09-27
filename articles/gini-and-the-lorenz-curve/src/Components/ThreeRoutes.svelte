<script>
  /* ThreeRoutes.svelte - Three ways of computing the same Gini coefficient */
  import { giniPairs, giniCov, giniLorenz, mean } from "../inequality.js";

  let incomeStr = $state("3, 5, 8, 14, 30");

  const incomes = $derived.by(() => {
    const vals = incomeStr
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((v) => !isNaN(v) && v > 0);
    return vals.length >= 2 ? vals : [3, 5, 8, 14, 30];
  });

  const mu = $derived(mean(incomes));
  const g1 = $derived(giniPairs(incomes));
  const g2 = $derived(giniCov(incomes));
  const g3 = $derived(giniLorenz(incomes));

  // The average gap between two people picked at random
  const expDiff = $derived(g1 * 2 * mu);
</script>

<div class="card" id="three-routes">
  <div class="card-header">
    <h3 class="card-title">Three ways to the same number</h3>
    <p class="card-sub">
      Type in any list of positive incomes. Each box works out the Gini in its
      own way.
    </p>
  </div>

  <div class="input-bar">
    <label for="income-input" class="input-label">
      Incomes, separated by commas
    </label>
    <input
      id="income-input"
      type="text"
      bind:value={incomeStr}
      class="text-input"
    />
  </div>

  <div class="routes-grid">
    <div class="route-box">
      <div class="route-tag">Average gap between pairs</div>
      <div class="route-metric font-mono" id="route-pairs">{g1.toFixed(4)}</div>
      <div class="route-formula">
        <code>E|x<sub>i</sub> − x<sub>j</sub>| / (2μ)</code>
      </div>
      <div class="route-desc" id="route-pairs-desc">
        Two people picked at random differ by {expDiff.toFixed(1)} on average, which is {(g1 * 200).toFixed(1)}% of the mean income, {mu.toFixed(1)}.
      </div>
    </div>

    <div class="route-box">
      <div class="route-tag">Covariance with rank</div>
      <div class="route-metric font-mono" id="route-cov">{g2.toFixed(4)}</div>
      <div class="route-formula">
        <code>2 · Cov(x, rank) / (n · μ)</code>
      </div>
      <div class="route-desc">
        How closely income climbs with each person's rank.
      </div>
    </div>

    <div class="route-box">
      <div class="route-tag">Area under the Lorenz curve</div>
      <div class="route-metric font-mono" id="route-lorenz">{g3.toFixed(4)}</div>
      <div class="route-formula">
        <code>1 − 2 · ∫ L(p) dp</code>
      </div>
      <div class="route-desc">
        The gap between the line of equality and the Lorenz curve, as a share
        of the triangle under the line.
      </div>
    </div>
  </div>

  <p class="caption">
    Change the list however you like. The three boxes always agree, because
    they're three ways of writing one number.
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
  .input-bar {
    margin-bottom: 1.25rem;
    background: var(--paper, #f1f3f3);
    padding: 0.85rem;
    border-radius: 4px;
  }
  .input-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 700;
    margin-bottom: 0.35rem;
  }
  .text-input {
    width: 100%;
    padding: 0.5rem;
    font-family: monospace;
    font-size: 1rem;
    border: 1px solid var(--stone, #d4dada);
    border-radius: 4px;
    box-sizing: border-box;
  }
  .routes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  .route-box {
    border: 1px solid var(--stone, #d4dada);
    padding: 1rem;
    border-radius: 4px;
    background: #fafafa;
  }
  .route-tag {
    font-size: 0.8rem;
    font-weight: 700;
    opacity: 0.75;
    margin-bottom: 0.5rem;
  }
  .route-metric {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--violet, #7c5aed);
    margin-bottom: 0.35rem;
  }
  .route-formula {
    font-size: 0.8rem;
    margin-bottom: 0.6rem;
  }
  .route-formula code {
    background: var(--paper, #f1f3f3);
    padding: 1px 4px;
    border-radius: 2px;
  }
  .route-desc {
    font-size: 0.85rem;
    line-height: 1.45;
    margin: 0;
    opacity: 0.85;
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
