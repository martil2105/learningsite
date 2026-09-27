<script>
  /* LakeLab.svelte - Interactive commons lab */
  import {
    closedEffort,
    effEffort,
    rent,
    effRent,
    dissipatedRent,
    effortRatio,
    pigouvianTax,
    A_DEFAULT as A,
    W_DEFAULT as w,
  } from "../commons.js";

  let n = $state(4);
  let theta = $state(0.5);

  const E = $derived(closedEffort(n, theta, A, w));
  const Es = $derived(effEffort(theta, A, w));
  const R = $derived(rent(E, theta, A, w));
  const Rs = $derived(effRent(theta, A, w));
  const D = $derived(dissipatedRent(n, theta, A, w));
  const eOvershoot = $derived(((E - Es) / Es) * 100);
  const tax = $derived(pigouvianTax(theta, A, w));
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">The Common-Pool Resource Laboratory</h3>
    <p class="card-sub">
      Experiment with user numbers and resource biology to observe how rents are dissipated and how corrective Pigouvian taxes restore efficiency.
    </p>
  </div>

  <div class="controls-grid">
    <div class="ctrl-group">
      <label for="lab-n-slider" class="ctrl-label">
        Number of Users (<em>n</em>): <strong>{n}</strong>
      </label>
      <input
        id="lab-n-slider"
        type="range"
        min="1"
        max="20"
        step="1"
        bind:value={n}
        class="slider"
      />
    </div>

    <div class="ctrl-group">
      <label for="lab-theta-slider" class="ctrl-label">
        Production Curvature (<em>&theta;</em>): <strong>{theta.toFixed(2)}</strong>
      </label>
      <input
        id="lab-theta-slider"
        type="range"
        min="0.2"
        max="0.8"
        step="0.05"
        bind:value={theta}
        class="slider"
      />
    </div>
  </div>

  <div class="panels-grid">
    <div class="panel-box">
      <div class="panel-tag">Effort Overshoot</div>
      <div class="panel-metric">
        <span class="p-num">{E.toFixed(0)} hrs</span>
        <span class="p-sub">actual effort</span>
      </div>
      <div class="panel-metric">
        <span class="p-num text-purple">{Es.toFixed(0)} hrs</span>
        <span class="p-sub">efficient effort (E*)</span>
      </div>
      <div class="panel-status">
        Overshoot: <strong class="text-pink">+{eOvershoot.toFixed(1)}%</strong>
        {#if theta === 0.5}
          <span class="math-sub">Exact: ((2<em>n</em> &minus; 1)/<em>n</em>)<sup>2</sup></span>
        {/if}
      </div>
    </div>

    <div class="panel-box">
      <div class="panel-tag">Rent Dissipation</div>
      <div class="panel-metric">
        <span class="p-num font-bold" class:text-green={n === 1} class:text-pink={n > 1}>
          ${R.toFixed(1)}
        </span>
        <span class="p-sub">surviving rent</span>
      </div>
      <div class="panel-metric">
        <span class="p-num text-purple">${Rs.toFixed(1)}</span>
        <span class="p-sub">maximum rent (R*)</span>
      </div>
      <div class="panel-status">
        Rent Destroyed: <strong class="text-pink">{(D * 100).toFixed(1)}%</strong>
        {#if theta === 0.5}
          <span class="math-sub">Exact: ((<em>n</em> &minus; 1)/<em>n</em>)<sup>2</sup></span>
        {/if}
      </div>
    </div>

    <div class="panel-box">
      <div class="panel-tag">Pigouvian Remedy</div>
      <div class="panel-metric">
        <span class="p-num text-purple">${tax.toFixed(3)}</span>
        <span class="p-sub">per fishing hour</span>
      </div>
      <div class="panel-desc">
        A corrective fee of <code>AP(E*) &minus; MP(E*) = ${tax.toFixed(2)}</code> forces every boat to internalize its congestion cost, restoring effort to exactly <strong>{Es.toFixed(0)} hours</strong>.
      </div>
    </div>
  </div>

  <p class="caption">
    <strong>The Half-Rent Threshold:</strong> For a square-root resource (&theta; = 0.5), exactly 50% of the rent is destroyed when <code>n = 2 + &radic;2 &approx; 3.414</code> users arrive. Just four boats wipe out over 56% of the lake's potential wealth.
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
  .controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.25rem;
    background: var(--paper, #f1f3f3);
    padding: 1rem;
    border-radius: 4px;
  }
  .ctrl-group {
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
  .panels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  .panel-box {
    border: 1px solid var(--stone, #d4dada);
    padding: 1rem;
    border-radius: 4px;
    background: #fafafa;
  }
  .panel-tag {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--stone, #d4dada);
    padding-bottom: 0.35rem;
  }
  .panel-metric {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }
  .p-num {
    font-family: monospace;
    font-size: 1.3rem;
    font-weight: 700;
  }
  .p-sub {
    font-size: 0.8rem;
    opacity: 0.7;
  }
  .text-purple {
    color: var(--violet, #7c5aed);
  }
  .text-pink {
    color: #c53030;
  }
  .text-green {
    color: #2f855a;
  }
  .panel-status {
    margin-top: 0.75rem;
    font-size: 0.85rem;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--stone, #d4dada);
  }
  .math-sub {
    display: block;
    font-size: 0.75rem;
    color: var(--squidink, #232f3e);
    opacity: 0.7;
    margin-top: 0.2rem;
  }
  .panel-desc {
    font-size: 0.85rem;
    line-height: 1.45;
    margin-top: 0.5rem;
  }
  .panel-desc code {
    background: var(--paper, #f1f3f3);
    padding: 1px 4px;
    border-radius: 2px;
    font-family: monospace;
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
