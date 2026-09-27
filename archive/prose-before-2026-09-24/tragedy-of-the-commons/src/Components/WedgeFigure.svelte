<script>
  /* WedgeFigure.svelte - The weighting between AP and MP across n */
  let boxWidth = $state(600);
  let n = $state(2);

  const apWeight = $derived((n - 1) / n);
  const mpWeight = $derived(1 / n);
</script>

<div class="card" bind:clientWidth={boxWidth}>
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">The First-Order Wedge</h3>
    <p class="card-sub">
      Every user in an <em>n</em>-player commons equates the wage <em>w</em> to a convex combination of average product and marginal product:
    </p>
  </div>

  <div class="formula-box">
    <code>w = (1 &minus; 1/n) &middot; AP(E) + (1/n) &middot; MP(E)</code>
  </div>

  <div class="controls-bar">
    <label for="wedge-n-slider" class="ctrl-label">
      Number of Users (<em>n</em>): <strong>{n}</strong>
    </label>
    <input
      id="wedge-n-slider"
      type="range"
      min="1"
      max="20"
      step="1"
      bind:value={n}
      class="slider"
    />
  </div>

  <div class="bar-container">
    <div class="bar-segment bar-ap" style="width: {apWeight * 100}%;">
      {#if apWeight > 0.15}
        <span>Average Product: {(apWeight * 100).toFixed(1)}%</span>
      {/if}
    </div>
    <div class="bar-segment bar-mp" style="width: {mpWeight * 100}%;">
      {#if mpWeight > 0.15}
        <span>Marginal Product: {(mpWeight * 100).toFixed(1)}%</span>
      {/if}
    </div>
  </div>

  <p class="caption">
    <strong>Figure 2. From social optimum to complete tragedy.</strong> At <em>n</em> = 1, the user internalizes 100% of the marginal product. But with just 5 users, 80% of the decision is driven by average product. By <em>n</em> = 20, 95% of the decision is based on average product, pushing effort until economic rent is completely wiped out.
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
  .formula-box {
    background: var(--paper, #f1f3f3);
    padding: 0.85rem;
    text-align: center;
    border-radius: 4px;
    font-family: monospace;
    font-size: 1.1rem;
    margin-bottom: 1.25rem;
    border-left: 3px solid var(--violet, #7c5aed);
  }
  .controls-bar {
    background: var(--paper, #f1f3f3);
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-bottom: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .ctrl-label {
    font-size: 0.85rem;
  }
  .slider {
    width: 100%;
    accent-color: var(--violet, #7c5aed);
  }
  .bar-container {
    height: 40px;
    display: flex;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1rem;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .bar-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    color: #fff;
    transition: width 0.2s ease;
  }
  .bar-ap {
    background: #2b6cb0;
  }
  .bar-mp {
    background: #7c5aed;
  }
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 0.75rem 0 0 0;
    border-top: 1px solid var(--stone, #d4dada);
    padding-top: 0.5rem;
  }
</style>
