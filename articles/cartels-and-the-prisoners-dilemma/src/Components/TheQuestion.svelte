<script>
  /* TheQuestion.svelte: guess first, then see what a cartel of two earns */
  import { piN, member, outsider, price, A_DEFAULT as a, C_DEFAULT as c } from "../cournot.js";

  let chosen = $state(null);
  const correct = "falls";

  const n = 5;
  const pBefore = price(n, 1); // 25
  const piBefore = piN(n); // 225
  const qBefore = (a - c) / (n + 1); // 15 each
  const pAfter = price(n, 2); // 28
  const qPlayer = (a - c) / (n - 2 + 2); // 18: what each of the four players makes
  const qMember = qPlayer / 2; // 9 each for the two members
  const piMemberAfter = member(n, 2); // 162
  const piOutsiderAfter = outsider(n, 2); // 324
  const memberPct = Math.round(100 * (1 - piMemberAfter / piBefore)); // 28
  const outsiderPct = Math.round(100 * (piOutsiderAfter / piBefore - 1)); // 44
</script>

<div class="card" id="cartel-question">
  <div class="card-header">
    <h3 class="card-title">Two firms join forces</h3>
    <p class="card-sub">
      Our market has five identical firms. Demand is P = {a} − Q, and each unit
      costs {c} to make. Competing on their own, each firm makes {qBefore}
      units, the price is {pBefore} and each firm earns a profit of {piBefore}.
    </p>
  </div>

  <div class="prompt-box">
    <p>
      Now two of the five agree to act as one firm, and they cut their combined
      output to push the price up. What happens to each member's profit?
    </p>

    <div class="choices-row">
      <button
        type="button"
        class="choice-btn"
        data-choice="rises"
        class:selected={chosen === "rises"}
        onclick={() => (chosen = "rises")}
      >
        <strong>It rises</strong><br />
        <span class="btn-sub">Market power raises margins</span>
      </button>

      <button
        type="button"
        class="choice-btn"
        data-choice="unchanged"
        class:selected={chosen === "unchanged"}
        onclick={() => (chosen = "unchanged")}
      >
        <strong>It stays the same</strong><br />
        <span class="btn-sub">Price and volume cancel out</span>
      </button>

      <button
        type="button"
        class="choice-btn"
        data-choice="falls"
        class:selected={chosen === "falls"}
        onclick={() => (chosen = "falls")}
      >
        <strong>It falls</strong><br />
        <span class="btn-sub">The members earn less</span>
      </button>
    </div>
  </div>

  {#if chosen}
    <div class="reveal-box" class:reveal-correct={chosen === correct}>
      {#if chosen === correct}
        <div class="reveal-title correct-title">Right. Each member's profit falls by {memberPct}%.</div>
      {:else}
        <div class="reveal-title wrong-title">Not quite. Each member's profit falls by {memberPct}%.</div>
      {/if}

      <div class="reveal-grid">
        <div class="reveal-col">
          <div class="col-label">Before, each of five</div>
          <div class="col-stat">Price: <strong>{pBefore.toFixed(2)}</strong></div>
          <div class="col-stat">Output: <strong>{qBefore.toFixed(1)} units</strong></div>
          <div class="col-stat highlight-blue">Profit: <strong class="q-before">{piBefore.toFixed(2)}</strong></div>
        </div>

        <div class="reveal-col">
          <div class="col-label">After, a member</div>
          <div class="col-stat">Price: <strong>{pAfter.toFixed(2)}</strong></div>
          <div class="col-stat">Output: <strong>{qMember.toFixed(1)} units</strong></div>
          <div class="col-stat highlight-pink">Profit: <strong class="q-member">{piMemberAfter.toFixed(2)}</strong> (−{memberPct}%)</div>
        </div>

        <div class="reveal-col">
          <div class="col-label">After, an outsider</div>
          <div class="col-stat">Price: <strong>{pAfter.toFixed(2)}</strong></div>
          <div class="col-stat">Output: <strong>{qPlayer.toFixed(1)} units</strong></div>
          <div class="col-stat highlight-green">Profit: <strong class="q-outsider">{piOutsiderAfter.toFixed(2)}</strong> (+{outsiderPct}%)</div>
        </div>
      </div>

      <p class="reveal-text">
        The cartel did push the price up, from {pBefore} to {pAfter}, by cutting
        its output from {2 * qBefore} units to {qPlayer}. But the three firms
        outside it made more, not less. So the cartel paid for the whole cut,
        and the outsiders sold more at the higher price.
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
    font-size: 0.85rem;
    font-weight: 700;
    opacity: 0.75;
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
