<script>
  /* TheQuestion.svelte - Interactive thought experiment on the merger paradox */
  import { piN, member, outsider, price } from "../cournot.js";

  let chosen = $state(null);
  const correct = "falls";

  const pBefore = price(5, 1); // 25
  const piBefore = piN(5); // 225
  const pAfter = price(5, 2); // (100 + 4*10)/5 = 28
  const piMemberAfter = member(5, 2); // 162
  const piOutsiderAfter = outsider(5, 2); // 324
</script>

<div class="card">
  <div class="card-header">
    <div class="card-badge">The Thought Experiment</div>
    <h3 class="card-title">The Cartel Paradox</h3>
    <p class="card-sub">
      Imagine an industry with <strong>5 identical competing firms</strong>. Market demand is <em>P</em> = 100 &minus; <em>Q</em>, and each unit costs $10 to produce. In standard competition, each firm produces 15 units, the price is $25, and each earns <strong>$225 in profit</strong>.
    </p>
  </div>

  <div class="prompt-box">
    <p>
      Two of the five firms decide to join forces, forming a <strong>2-firm cartel</strong> to restrict their combined output and elevate the market price. What happens to the profit earned by each of the two cartel members?
    </p>

    <div class="choices-row">
      <button
        type="button"
        class="choice-btn"
        class:selected={chosen === "rises"}
        onclick={() => (chosen = "rises")}
      >
        <strong>It Rises</strong><br />
        <span class="btn-sub">Market power raises margins</span>
      </button>

      <button
        type="button"
        class="choice-btn"
        class:selected={chosen === "unchanged"}
        onclick={() => (chosen = "unchanged")}
      >
        <strong>Unchanged</strong><br />
        <span class="btn-sub">Volume and margin cancel out</span>
      </button>

      <button
        type="button"
        class="choice-btn"
        class:selected={chosen === "falls"}
        onclick={() => (chosen = "falls")}
      >
        <strong>It Falls</strong><br />
        <span class="btn-sub">Colluding members lose money</span>
      </button>
    </div>
  </div>

  {#if chosen}
    <div class="reveal-box" class:reveal-correct={chosen === correct}>
      {#if chosen === correct}
        <div class="reveal-title correct-title">✓ Exactly right: The colluding firms lose 28% of their profit!</div>
      {:else}
        <div class="reveal-title wrong-title">✗ Surprising, but false: The colluding firms lose money!</div>
      {/if}

      <div class="reveal-grid">
        <div class="reveal-col">
          <div class="col-label">Before Cartel (Each of 5)</div>
          <div class="col-stat">Price: <strong>${pBefore.toFixed(2)}</strong></div>
          <div class="col-stat">Output: <strong>15.0 units</strong></div>
          <div class="col-stat highlight-blue">Profit: <strong>${piBefore.toFixed(2)}</strong></div>
        </div>

        <div class="reveal-col">
          <div class="col-label">After Cartel: Member</div>
          <div class="col-stat">Price: <strong>${pAfter.toFixed(2)}</strong></div>
          <div class="col-stat">Output: <strong>9.0 units</strong></div>
          <div class="col-stat highlight-pink">Profit: <strong>${piMemberAfter.toFixed(2)} (&minus;28%)</strong></div>
        </div>

        <div class="reveal-col">
          <div class="col-label">After Cartel: Outsider</div>
          <div class="col-stat">Price: <strong>${pAfter.toFixed(2)}</strong></div>
          <div class="col-stat">Output: <strong>18.0 units</strong></div>
          <div class="col-stat highlight-green">Profit: <strong>${piOutsiderAfter.toFixed(2)} (+44%)</strong></div>
        </div>
      </div>

      <p class="reveal-text">
        The cartel successfully elevated the market price from $25 to $28 by slashing its own output from 30 units to 18 units. But the three non-cartel outsiders reacted by <em>expanding</em> production. The cartel bore 100% of the sacrifice while capturing only a fraction of the reward!
      </p>
    </div>
  {/if}
</div>

<style>
  .card {
    border: 3px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2rem 0;
    background: #fff;
  }
  .card-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: var(--paper, #f1f3f3);
    padding: 0.2rem 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 2px;
  }
  .card-title {
    font-size: 1.3rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
  }
  .card-sub {
    font-size: 1rem;
    line-height: 1.6;
    margin: 0;
  }
  .prompt-box {
    margin: 1.25rem 0;
    padding: 1.25rem;
    background: var(--paper, #f1f3f3);
    border-radius: 4px;
  }
  .prompt-box p {
    font-size: 1.05rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }
  .choices-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }
  .choice-btn {
    background: #fff;
    border: 2px solid var(--stone, #d4dada);
    padding: 0.85rem;
    text-align: left;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.15s ease;
  }
  .choice-btn:hover {
    border-color: var(--violet, #7c5aed);
  }
  .choice-btn.selected {
    border-color: var(--squidink, #232f3e);
    background: rgba(35, 47, 62, 0.05);
  }
  .btn-sub {
    font-size: 0.8rem;
    opacity: 0.7;
  }
  .reveal-box {
    margin-top: 1.25rem;
    padding: 1.25rem;
    border: 2px solid var(--violet, #7c5aed);
    border-radius: 4px;
    background: #faf9ff;
  }
  .reveal-title {
    font-size: 1.1rem;
    font-weight: 800;
    margin-bottom: 1rem;
  }
  .correct-title {
    color: #2b6cb0;
  }
  .wrong-title {
    color: #c53030;
  }
  .reveal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .reveal-col {
    background: #fff;
    border: 1px solid var(--stone, #d4dada);
    padding: 0.85rem;
    border-radius: 4px;
  }
  .col-label {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
    margin-bottom: 0.5rem;
  }
  .col-stat {
    font-size: 0.9rem;
    margin-bottom: 0.35rem;
  }
  .highlight-blue {
    color: #2b6cb0;
  }
  .highlight-pink {
    color: #c53030;
  }
  .highlight-green {
    color: #2f855a;
  }
  .reveal-text {
    font-size: 0.95rem;
    line-height: 1.6;
    margin: 0;
  }
</style>
