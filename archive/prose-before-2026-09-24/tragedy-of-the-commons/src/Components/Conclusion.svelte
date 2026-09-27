<script>
  /* Conclusion.svelte */
</script>

<section class="conclusion-section">
  <h2>Conclusion</h2>

  <p>
    The "tragedy of the commons" is often treated as a vague moral tale about human greed. Mathematical game theory reveals it to be a precise, structural failure of decentralized property rights:
  </p>

  <ol class="takeaways-list">
    <li>
      <strong>The Average vs. Marginal Wedge:</strong> Under open access, individuals expand their activity as long as the resource's <em>average product</em> exceeds their private opportunity cost. But the socially efficient stopping point requires equating cost to <em>marginal product</em>.
    </li>
    <li>
      <strong>Exact Quadratic Dissipation:</strong> In standard diminishing-returns environments, the fraction of economic wealth destroyed is exactly <code>((n &minus; 1)/n)<sup>2</sup></code>. Total effort overshoots by <code>((2n &minus; 1)/n)<sup>2</sup></code>, expanding toward four times the socially optimal level.
    </li>
    <li>
      <strong>Destruction is Heavily Front-Loaded:</strong> You do not need a crowded metropolis to ruin a common pool. The single most destructive entrant is the <strong>second one</strong>, wiping out 25% of the resource's potential wealth. By user 3.4, half the rent is gone forever.
    </li>
    <li>
      <strong>Pigouvian Restoration:</strong> When property rights cannot be assigned, a corrective Pigouvian access fee equal to <code>AP(E*) &minus; MP(E*)</code> precisely closes the wedge, forcing every user to pay for their congestion footprint and resurrecting the social optimum.
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
  code {
    background: var(--paper, #f1f3f3);
    padding: 1px 5px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
  }
  .final-word {
    font-weight: 700;
    margin-top: 2rem;
  }
</style>
