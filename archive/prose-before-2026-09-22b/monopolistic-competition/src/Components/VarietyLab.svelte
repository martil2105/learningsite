<script>
  /* VarietyLab.svelte - Interactive scale-variety tradeoff explorer */
  import {
    nOf,
    pOf,
    scaleOf,
    scaleDS,
    plannerCount,
    varietyExcess,
    scaleShortfall,
    markup,
    markupDS,
    C_DEFAULT as c,
  } from "../ces.js";

  let E = $state(1000);
  let f = $state(5);
  let sigma = $state(4);

  const n = $derived(nOf(E, f, sigma));
  const nP = $derived(plannerCount(E, f, sigma));
  const vExcess = $derived(varietyExcess(sigma));

  const p = $derived(pOf(n, sigma, c));
  const x = $derived(scaleOf(n, E, sigma, c));
  const xDS = $derived(scaleDS(f, sigma, c));
  const sShortfall = $derived(scaleShortfall(n));

  const m = $derived(markup(n, sigma));
  const mDS = $derived(markupDS(sigma));
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">The Scale-Variety Laboratory</h3>
    <p class="card-sub">
      Explore the free-entry equilibrium, the social planner's choice, and the four exact identities governing the monopolistic competition tradeoff.
    </p>
  </div>

  <div class="controls-grid">
    <div class="ctrl-group">
      <label for="lab-e-slider" class="ctrl-label">
        Market Expenditure (<em>E</em>): <strong>${E}</strong>
      </label>
      <input
        id="lab-e-slider"
        type="range"
        min="100"
        max="3000"
        step="100"
        bind:value={E}
        class="slider"
      />
    </div>

    <div class="ctrl-group">
      <label for="lab-f-slider" class="ctrl-label">
        Fixed Cost (<em>f</em>): <strong>${f}</strong>
      </label>
      <input
        id="lab-f-slider"
        type="range"
        min="1"
        max="20"
        step="1"
        bind:value={f}
        class="slider"
      />
    </div>

    <div class="ctrl-group">
      <label for="lab-s-slider" class="ctrl-label">
        Substitutability (<em>&sigma;</em>): <strong>{sigma.toFixed(1)}</strong>
      </label>
      <input
        id="lab-s-slider"
        type="range"
        min="1.5"
        max="8"
        step="0.5"
        bind:value={sigma}
        class="slider"
      />
    </div>
  </div>

  <div class="identities-grid">
    <div class="identity-panel">
      <div class="panel-tag">Variety Tradeoff</div>
      <div class="panel-metric">
        <span class="p-num">{n.toFixed(2)}</span>
        <span class="p-unit">market varieties (<em>n</em>)</span>
      </div>
      <div class="panel-metric">
        <span class="p-num text-purple">{nP.toFixed(2)}</span>
        <span class="p-unit">planner varieties (<em>n</em><sub>p</sub>)</span>
      </div>
      <div class="panel-box">
        <strong>Variety Excess:</strong> Exactly <code>(&sigma; &minus; 1)/&sigma;</code> = <strong>{vExcess.toFixed(3)}</strong> varieties.<br />
        <span class="subtext">The market never over-provides by more than one single variety!</span>
      </div>
    </div>

    <div class="identity-panel">
      <div class="panel-tag">Scale Tradeoff</div>
      <div class="panel-metric">
        <span class="p-num">{x.toFixed(2)}</span>
        <span class="p-unit">output per firm (<em>x</em>)</span>
      </div>
      <div class="panel-metric">
        <span class="p-num text-purple">{xDS.toFixed(2)}</span>
        <span class="p-unit">large-group scale (<em>x</em><sub>DS</sub>)</span>
      </div>
      <div class="panel-box">
        <strong>Scale Shortfall:</strong> Exactly <code>1/n</code> = <strong>{(100 * sShortfall).toFixed(2)}%</strong>.<br />
        <span class="subtext">Each firm produces slightly below large-group capacity because <em>n</em> is finite.</span>
      </div>
    </div>

    <div class="identity-panel">
      <div class="panel-tag">Pricing &amp; Markup</div>
      <div class="panel-metric">
        <span class="p-num">${p.toFixed(3)}</span>
        <span class="p-unit">market price (<em>p</em>)</span>
      </div>
      <div class="panel-metric">
        <span class="p-num text-purple">{m.toFixed(3)}&times;</span>
        <span class="p-unit">markup (over <em>c</em> = 1)</span>
      </div>
      <div class="panel-box">
        <strong>Markup Excess:</strong> Exactly <code>1/(&sigma;(n &minus; 1))</code> above textbook <code>{mDS.toFixed(3)}&times;</code>.<br />
        <span class="subtext">Excess markup over large-group level is {((m / mDS - 1) * 100).toFixed(3)}%.</span>
      </div>
    </div>
  </div>

  <p class="caption">
    <strong>Key takeaway:</strong> When market size <em>E</em> expands or fixed cost <em>f</em> contracts, <em>n</em> grows. As <em>n</em> grows, the scale shortfall <code>1/n</code> vanishes and the firm scale converges cleanly to <code>f(&sigma; &minus; 1)/c</code>.
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
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
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
  .identities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }
  .identity-panel {
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
    color: var(--squidink, #232f3e);
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
  .text-purple {
    color: var(--violet, #7c5aed);
  }
  .p-unit {
    font-size: 0.8rem;
    color: var(--squidink, #232f3e);
    opacity: 0.8;
  }
  .panel-box {
    margin-top: 0.75rem;
    font-size: 0.85rem;
    line-height: 1.45;
    background: #fff;
    padding: 0.6rem;
    border: 1px solid var(--stone, #d4dada);
    border-radius: 3px;
  }
  .panel-box code {
    background: var(--paper, #f1f3f3);
    padding: 1px 4px;
    border-radius: 2px;
    font-family: monospace;
  }
  .subtext {
    font-size: 0.75rem;
    color: var(--squidink, #232f3e);
    opacity: 0.7;
    display: block;
    margin-top: 0.25rem;
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
