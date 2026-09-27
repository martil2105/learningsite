<script>
  /* AtkinsonFigure.svelte - Inequality aversion and the ranking of P and Q */
  import { atkinsonTwo, SOC_P, SOC_Q, epsTie } from "../inequality.js";

  let eps = $state(2.0);

  const aP = $derived(atkinsonTwo(eps, SOC_P));
  const aQ = $derived(atkinsonTwo(eps, SOC_Q));
  const ratio = $derived(aP / aQ);
  // "About even" only where the two indexes are within 1% of each other.
  const even = $derived(Math.abs(ratio - 1) < 0.01);
</script>

<div class="card" id="atkinson-figure">
  <div class="card-header">
    <h3 class="card-title">The Atkinson index for P and Q</h3>
    <p class="card-sub">
      Drag the inequality aversion ε. The higher it is, the more weight the
      index puts on the poorest incomes.
    </p>
  </div>

  <div class="controls-bar">
    <label for="atk-eps-slider" class="ctrl-label">
      Inequality aversion ε: <strong id="eps-value">{eps.toFixed(2)}</strong>
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

  <div class="banner" class:banner-p={!even && ratio > 1} class:banner-q={!even && ratio < 1} class:banner-even={even} id="atk-banner">
    {#if even}
      <span>About even: the two indexes meet near ε = {epsTie.toFixed(2)}.</span>
    {:else if ratio < 1}
      <span>At this ε, <strong>Q</strong> is judged more unequal.</span>
    {:else}
      <span>At this ε, <strong>P</strong> is judged more unequal.</span>
    {/if}
  </div>

  <div class="metrics-grid">
    <div class="metric-box">
      <div class="box-tag">Society P</div>
      <div class="box-val font-mono text-blue" id="atk-p">{aP.toFixed(4)}</div>
      <div class="box-desc">30% on £4k, 70% on £10k</div>
    </div>

    <div class="metric-box">
      <div class="box-tag">Society Q</div>
      <div class="box-val font-mono text-purple" id="atk-q">{aQ.toFixed(4)}</div>
      <div class="box-desc">85% on £8k, 15% on £{SOC_Q.b.toFixed(1)}k</div>
    </div>

    <div class="metric-box">
      <div class="box-tag">Verdict</div>
      <div class="box-val font-mono font-bold" id="atk-verdict">
        {#if even}
          About even
        {:else if ratio > 1}
          P is {ratio.toFixed(2)}× Q
        {:else}
          Q is {(1 / ratio).toFixed(2)}× P
        {/if}
      </div>
      <div class="box-desc">the larger index over the smaller</div>
    </div>
  </div>

  <p class="caption">
    Start at the far left of the slider and drag slowly to the right. Watch the
    verdict change sides as the weight moves from the top of the distribution to
    the bottom.
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
    font-size: 0.8rem;
    font-weight: 700;
    opacity: 0.75;
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
