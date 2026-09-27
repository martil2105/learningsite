<script>
  /* ThreeRoutes.svelte - The three equivalent formulations of the Gini coefficient */
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

  // Expected pairwise absolute difference
  const expDiff = $derived(g1 * 2 * mu);
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">Three Routes to One Number</h3>
    <p class="card-sub">
      The Gini coefficient is not just an arbitrary geometric ratio. It is simultaneously an area, an expected distance between neighbors, and a covariance with social rank.
    </p>
  </div>

  <div class="input-bar">
    <label for="income-input" class="input-label">
      Sample Incomes (comma-separated):
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
      <div class="route-tag">Route 1: Pairwise Gap</div>
      <div class="route-metric font-mono">{g1.toFixed(4)}</div>
      <div class="route-formula">
        <code>E[|x<sub>i</sub> &minus; x<sub>j</sub>|] / (2&mu;)</code>
      </div>
      <p class="route-desc">
        Pick two random people. The expected income difference is <strong>${expDiff.toFixed(1)}</strong>, which is <strong>{(g1 * 200).toFixed(1)}%</strong> of the average income (${mu.toFixed(1)}).
      </p>
    </div>

    <div class="route-box">
      <div class="route-tag">Route 2: Rank Covariance</div>
      <div class="route-metric font-mono">{g2.toFixed(4)}</div>
      <div class="route-formula">
        <code>2 &middot; Cov(x, rank) / (n &middot; &mu;)</code>
      </div>
      <p class="route-desc">
        Measures how strongly income correlates with a person's percentile rank in society.
      </p>
    </div>

    <div class="route-box">
      <div class="route-tag">Route 3: Lorenz Area</div>
      <div class="route-metric font-mono">{g3.toFixed(4)}</div>
      <div class="route-formula">
        <code>1 &minus; 2 &middot; &int; L(p) dp</code>
      </div>
      <p class="route-desc">
        The normalized area between the 45-degree line of perfect equality and the cumulative income curve.
      </p>
    </div>
  </div>

  <p class="caption">
    <strong>Exact equivalence:</strong> All three formulations yield the exact same value ({g1.toFixed(4)}) to machine precision.
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
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
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
