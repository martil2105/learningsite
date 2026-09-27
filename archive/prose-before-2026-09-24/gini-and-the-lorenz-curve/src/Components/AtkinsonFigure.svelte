<script>
  /* AtkinsonFigure.svelte - Inequality aversion and ranking inversions */
  import { twoPointPop, atkinson } from "../inequality.js";

  let eps = $state(2.0);

  const P = twoPointPop(0.3, 4, 10);
  const Q = twoPointPop(0.85, 8, 19.7688);

  const aP = $derived(atkinson(P, eps));
  const aQ = $derived(atkinson(Q, eps));
  const diff = $derived(aP - aQ);
  const ratio = $derived(aP / aQ);
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">The Moral Inversion: The Atkinson Index</h3>
    <p class="card-sub">
      Anthony Atkinson (1970) proved that whenever Lorenz curves cross, any single summary number forces an implicit moral choice. The <strong>inequality aversion parameter &epsilon;</strong> controls how heavily we penalize poverty at the bottom versus luxury at the top.
    </p>
  </div>

  <div class="controls-bar">
    <label for="atk-eps-slider" class="ctrl-label">
      Inequality Aversion (<em>&epsilon;</em>): <strong>{eps.toFixed(2)}</strong>
    </label>
    <input
      id="atk-eps-slider"
      type="range"
      min="0.1"
      max="8.0"
      step="0.05"
      bind:value={eps}
      class="slider"
    />
  </div>

  <div class="banner" class:banner-p={diff > 0.005} class:banner-q={diff < -0.005} class:banner-even={Math.abs(diff) <= 0.005}>
    {#if eps < 0.46}
      <span><strong>&epsilon; &lt; 0.46:</strong> Focus on top concentration. Society Q is judged <strong>more unequal</strong>.</span>
    {:else if Math.abs(eps - 0.4633) < 0.05}
      <span><strong>&epsilon; &approx; 0.4633:</strong> The Knife Edge! Both societies are judged <strong>identically unequal</strong>.</span>
    {:else}
      <span><strong>&epsilon; &gt; 0.46:</strong> Focus on poverty relief. Society P is judged <strong>more unequal</strong>.</span>
    {/if}
  </div>

  <div class="metrics-grid">
    <div class="metric-box">
      <div class="box-tag">Society P Atkinson Index</div>
      <div class="box-val font-mono text-blue">{aP.toFixed(4)}</div>
      <div class="box-desc">Penalizes the bottom 30% stuck at $4k</div>
    </div>

    <div class="metric-box">
      <div class="box-tag">Society Q Atkinson Index</div>
      <div class="box-val font-mono text-purple">{aQ.toFixed(4)}</div>
      <div class="box-desc">Penalizes the top 15% taking $19.8k</div>
    </div>

    <div class="metric-box">
      <div class="box-tag">Ranking Verdict</div>
      <div class="box-val font-mono font-bold">
        {#if diff > 0.005}
          P is {ratio.toFixed(2)}&times; worse
        {:else if diff < -0.005}
          Q is {(1 / ratio).toFixed(2)}&times; worse
        {:else}
          Exact tie
        {/if}
      </div>
      <div class="box-desc">At &epsilon; = 8.0, P is judged 2.61&times; more unequal!</div>
    </div>
  </div>

  <p class="caption">
    <strong>Figure 2. Why Gini is morally incomplete.</strong> The Gini coefficient implicitly chooses a fixed, arbitrary weighting across the population. When Lorenz curves cross, quoting a single Gini hides the fundamental question: does society care more about pulling up the poorest or pulling down the richest?
  </p>
</div>

<style>
  .card {
    border: 3px solid var(--squidink, #232f3e);
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
  .controls-bar {
    background: var(--paper, #f1f3f3);
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
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
  .banner {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-size: 0.95rem;
    margin-bottom: 1.25rem;
  }
  .banner-p {
    background: #ebf8ff;
    color: #2b6cb0;
    border: 1px solid #bee3f8;
  }
  .banner-q {
    background: #faf5ff;
    color: #6b46c1;
    border: 1px solid #e9d8fd;
  }
  .banner-even {
    background: #f7fafc;
    color: #4a5568;
    border: 1px solid #e2e8f0;
  }
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }
  .metric-box {
    border: 1px solid var(--stone, #d4dada);
    padding: 1rem;
    border-radius: 4px;
    background: #fafafa;
  }
  .box-tag {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
    margin-bottom: 0.5rem;
  }
  .box-val {
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 0.35rem;
  }
  .text-blue {
    color: #2b6cb0;
  }
  .text-purple {
    color: var(--violet, #7c5aed);
  }
  .box-desc {
    font-size: 0.8rem;
    opacity: 0.75;
    line-height: 1.4;
  }
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 1.25rem 0 0 0;
    border-top: 1px solid var(--stone, #d4dada);
    padding-top: 0.5rem;
  }
</style>
