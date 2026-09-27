<script>
  /* LakeLab.svelte: the lake lab */
  import {
    closedEffort,
    effEffort,
    rent,
    effRent,
    dissipatedRent,
    pigouvianTax,
    A_DEFAULT as A,
    W_DEFAULT as w,
  } from "../commons.js";

  let n = $state(4);
  let theta = $state(0.5);

  const fmt = (v, d = 0) => v.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const E = $derived(closedEffort(n, theta, A, w));
  const Es = $derived(effEffort(theta, A, w));
  const R = $derived(rent(E, theta, A, w));
  const Rs = $derived(effRent(theta, A, w));
  const D = $derived(dissipatedRent(n, theta, A, w));
  const eOvershoot = $derived(((E - Es) / Es) * 100);
  const tax = $derived(pigouvianTax(theta, A, w));
  // The fee that brings n boats back to E*: each already counts 1/n of its crowding.
  const taxN = $derived((1 - 1 / n) * tax);
</script>

<div class="card" id="lake-lab">
  <div class="card-header">
    <h3 class="card-title">The lake lab</h3>
    <p class="card-sub">
      Drag the number of boats and the shape of the lake, and watch how much of
      the rent survives and what fee would bring the hours back to E*.
    </p>
  </div>

  <div class="controls-grid">
    <div class="ctrl-group">
      <label for="lab-n-slider" class="ctrl-label">
        Number of boats (<em>n</em>): <strong id="lab-n">{n}</strong>
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
        Shape of the lake (<em>&theta;</em>): <strong id="lab-theta">{theta.toFixed(2)}</strong>
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
      <div class="panel-tag">Hours fished</div>
      <div class="panel-metric">
        <span class="p-num" id="lab-hours">{fmt(E)}</span>
        <span class="p-sub">with {n} {n === 1 ? "boat" : "boats"}</span>
      </div>
      <div class="panel-metric">
        <span class="p-num text-purple" id="lab-hours-eff">{fmt(Es)}</span>
        <span class="p-sub">efficient (E*)</span>
      </div>
      <div class="panel-status">
        Above E* by <strong class="text-pink" id="lab-overshoot">{eOvershoot.toFixed(1)}%</strong>
        {#if theta === 0.5}
          <span class="math-sub">Hours ÷ E* = ((2<em>n</em> − 1)/<em>n</em>)<sup>2</sup></span>
        {/if}
      </div>
    </div>

    <div class="panel-box">
      <div class="panel-tag">Rent</div>
      <div class="panel-metric">
        <span class="p-num font-bold" id="lab-rent" class:text-green={n === 1} class:text-pink={n > 1}>
          £{fmt(R, 1)}
        </span>
        <span class="p-sub">left</span>
      </div>
      <div class="panel-metric">
        <span class="p-num text-purple" id="lab-rent-max">£{fmt(Rs, 1)}</span>
        <span class="p-sub">most possible (R*)</span>
      </div>
      <div class="panel-status">
        Lost: <strong class="text-pink" id="lab-lost">{(D * 100).toFixed(1)}%</strong>
        {#if theta === 0.5}
          <span class="math-sub">Share lost = ((<em>n</em> − 1)/<em>n</em>)<sup>2</sup></span>
        {/if}
      </div>
    </div>

    <div class="panel-box">
      <div class="panel-tag">Fee per hour</div>
      <div class="panel-metric">
        <span class="p-num text-purple" id="lab-fee-n">£{taxN.toFixed(2)}</span>
        <span class="p-sub">for {n} {n === 1 ? "boat" : "boats"}</span>
      </div>
      <div class="panel-metric">
        <span class="p-num" id="lab-fee-open">£{tax.toFixed(2)}</span>
        <span class="p-sub">open access</span>
      </div>
      <div class="panel-desc">
        The first fee brings {n} {n === 1 ? "boat" : "boats"} back to
        {fmt(Es)} hours, and the second does the same for a lake open to
        everyone.
      </div>
    </div>
  </div>

  <p class="caption">
    Set θ to 0.5 and step the boats up from one. More than half the rent is
    gone by the fourth boat.
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
    font-size: 0.85rem;
    font-weight: 800;
    opacity: 0.75;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--stone, #d4dada);
    padding-bottom: 0.35rem;
  }
  .panel-metric {
    display: flex;
    flex-wrap: wrap;
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
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 1.25rem 0 0 0;
    border-top: 1px solid var(--stone, #d4dada);
    padding-top: 0.5rem;
  }
</style>
