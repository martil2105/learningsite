<script>
  /* Conclusion.svelte */
</script>

<section class="conclusion-section">
  <h2>Conclusion</h2>

  <p>
    Cartels are often imagined as omnipotent conspiracies that quietly dictate prices. In reality, non-cooperative game theory exposes why cartels are fragile, self-sabotaging institutions:
  </p>

  <ol class="takeaways-list">
    <li>
      <strong>The Merger Paradox:</strong> Unless a cartel commands an overwhelming majority of the market, restricting output benefits outsiders far more than members. When a cartel cuts production, uncommitted rivals expand along their reaction curves, capturing market share and suppressing the price increase.
    </li>
    <li>
      <strong>The Outsider Identity:</strong> In any industry with <em>k</em> colluding firms, an outside firm earns <strong>exactly <em>k</em> times</strong> the profit of a cartel member. The larger the cartel, the greater the reward for refusing to join.
    </li>
    <li>
      <strong>The Prisoner's Dilemma of Collusion:</strong> Every cartel member knows that if it quietly cheats on its quota or walks away, its profits will multiply. In the absence of binding, legally enforceable contracts—which antitrust laws strictly forbid—the dominant strategy is defection.
    </li>
    <li>
      <strong>Modern Antitrust:</strong> Competition authorities do not need to patrol every warehouse. Corporate leniency programs—which grant full immunity to the first conspirator to confess—exploit this exact prisoner's dilemma, triggering an irresistible race to the courthouse.
    </li>
  </ol>

  <p class="final-word">Thanks for reading!</p>
</section>

<style>
  .conclusion-section {
    margin: 3.5rem 0 2rem 0;
    padding-top: 2rem;
    border-top: 1px solid var(--stone, #d4dada);
  }
  h2 {
    font-size: 1.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 1.25rem 0;
  }
  p {
    font-size: 1.05rem;
    line-height: 1.65;
    margin: 0 0 1.25rem 0;
  }
  .takeaways-list {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
  }
  .takeaways-list li {
    font-size: 1rem;
    line-height: 1.65;
    margin-bottom: 1rem;
  }
  .final-word {
    font-weight: 700;
    margin-top: 2rem;
  }
</style>
