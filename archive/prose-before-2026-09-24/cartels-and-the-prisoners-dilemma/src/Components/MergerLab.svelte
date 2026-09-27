<script>
  /* MergerLab.svelte - Interactive cartel and merger explorer */
  import {
    piN,
    member,
    outsider,
    isProfitable,
    price,
    A_DEFAULT as a,
    C_DEFAULT as c,
  } from "../cournot.js";

  let n = $state(5);
  let k = $state(4);

  // Keep k valid if n changes
  $effect(() => {
    if (k > n) k = n;
    if (k < 2) k = 2;
  });

  const pi0 = $derived(piN(n, a, c));
  const piMem = $derived(member(n, k, a, c));
  const piOut = $derived(outsider(n, k, a, c));
  const p = $derived(price(n, k, a, c));
  const profitable = $derived(isProfitable(n, k));
  const ratio = $derived(piOut / piMem);
  const memPct = $derived(((piMem - pi0) / pi0) * 100);
  const outPct = $derived(((piOut - pi0) / pi0) * 100);
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">The Cartel &amp; Merger Laboratory</h3>
    <p class="card-sub">
      Select the total number of firms (<em>n</em>) and the number of firms colluding in the cartel (<em>k</em>) to inspect payoffs, free-rider windfalls, and stability.
    </p>
  </div>

  <div class="controls-grid">
    <div class="ctrl-group">
      <label for="lab-n-slider" class="ctrl-label">
        Industry Firms (<em>n</em>): <strong>{n}</strong>
      </label>
      <input
        id="lab-n-slider"
        type="range"
        min="3"
        max="20"
        step="1"
        bind:value={n}
        class="slider"
      />
    </div>

    <div class="ctrl-group">
      <label for="lab-k-slider" class="ctrl-label">
        Cartel Members (<em>k</em>): <strong>{k}</strong>
      </label>
      <input
        id="lab-k-slider"
        type="range"
        min="2"
        max={n}
        step="1"
        bind:value={k}
        class="slider"
      />
    </div>
  </div>

  <div class="status-banner" class:banner-profit={profitable} class:banner-loss={!profitable}>
    {#if k === n}
      <span><strong>Complete Monopoly (k = n):</strong> All firms collude. Members earn {memPct.toFixed(1)}% above competition.</span>
    {:else if profitable}
      <span><strong>Profitable Cartel:</strong> Members gain {memPct.toFixed(1)}% over non-cooperation.</span>
    {:else if Math.abs(memPct) < 0.001}
      <span><strong>Knife-Edge Break-Even:</strong> Member profit matches competition to four decimals ($225.00).</span>
    {:else}
      <span><strong>Unprofitable Cartel:</strong> Members lose {Math.abs(memPct).toFixed(1)}% of their baseline profit!</span>
    {/if}
  </div>

  <div class="cards-grid">
    <div class="stat-card">
      <div class="card-tag">Competitive Baseline</div>
      <div class="stat-num font-mono">${pi0.toFixed(2)}</div>
      <div class="stat-desc">Per-firm profit without collusion</div>
    </div>

    <div class="stat-card" class:border-green={profitable} class:border-pink={!profitable}>
      <div class="card-tag">Cartel Member ({k} firms)</div>
      <div class="stat-num font-mono" class:text-green={profitable} class:text-pink={!profitable}>
        ${piMem.toFixed(2)}
      </div>
      <div class="stat-desc font-mono">
        {memPct >= 0 ? "+" : ""}{memPct.toFixed(1)}% vs baseline
      </div>
    </div>

    {#if k < n}
      <div class="stat-card highlight-card">
        <div class="card-tag">Outsider ({n - k} firms)</div>
        <div class="stat-num font-mono text-purple">${piOut.toFixed(2)}</div>
        <div class="stat-desc font-mono">+{outPct.toFixed(1)}% vs baseline</div>
        <div class="stat-ratio">
          <strong>Free-rider windfall:</strong> Outsider earns exactly <strong>{ratio.toFixed(1)}&times;</strong> a cartel member!
        </div>
      </div>
    {/if}
  </div>

  <div class="details-row">
    <div class="detail-item">
      Market Price: <strong>${p.toFixed(2)}</strong> (baseline: ${price(n, 1).toFixed(2)})
    </div>
    <div class="detail-item">
      Cartel Condition: <code>k(n &minus; k + 2)<sup>2</sup> &lt; (n + 1)<sup>2</sup></code> &rarr;
      <strong>{profitable ? "Holds" : "Fails"}</strong>
    </div>
  </div>

  <p class="caption">
    <strong>The Core Vulnerability:</strong> Notice that whenever a cartel is formed, any individual member has an overwhelming incentive to defect. If a member defects to become an outsider, its profit instantly jumps by a factor of <em>k</em>.
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
    margin-bottom: 1rem;
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
  .status-banner {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-size: 0.95rem;
    margin-bottom: 1.25rem;
  }
  .banner-profit {
    background: #ebf8ff;
    color: #2b6cb0;
    border: 1px solid #bee3f8;
  }
  .banner-loss {
    background: #fff5f5;
    color: #c53030;
    border: 1px solid #fed7d7;
  }
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1.25rem;
  }
  .stat-card {
    border: 1px solid var(--stone, #d4dada);
    padding: 1rem;
    border-radius: 4px;
    background: #fafafa;
  }
  .card-tag {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
    margin-bottom: 0.5rem;
  }
  .stat-num {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }
  .stat-desc {
    font-size: 0.85rem;
    opacity: 0.8;
  }
  .highlight-card {
    border: 2px solid var(--violet, #7c5aed);
    background: #faf9ff;
  }
  .stat-ratio {
    margin-top: 0.75rem;
    font-size: 0.8rem;
    line-height: 1.4;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--stone, #d4dada);
  }
  .font-mono {
    font-family: monospace;
  }
  .text-green {
    color: #2f855a;
  }
  .text-pink {
    color: #c53030;
  }
  .text-purple {
    color: var(--violet, #7c5aed);
  }
  .border-green {
    border-color: #2f855a;
  }
  .border-pink {
    border-color: #c53030;
  }
  .details-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 0.75rem;
    background: var(--paper, #f1f3f3);
    border-radius: 4px;
    font-size: 0.85rem;
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
