<script>
  /* Conclusion.svelte */
</script>

<section class="conclusion-section">
  <h2>Conclusion</h2>

  <p>
    Monopolistic competition bridges the wide chasm between pure price-taking competition and isolated single-firm monopoly. By integrating product differentiation and free entry, the Dixit-Stiglitz framework reveals four precise principles:
  </p>

  <ol class="takeaways-list">
    <li>
      <strong>Elasticity depends on market share.</strong> When an industry contains <em>n</em> varieties, a single firm's true price elasticity is <code>&sigma; &minus; (&sigma; &minus; 1)/n</code>. In concentrated markets, firms recognize their weight in the aggregate price index, softening price competition.
    </li>
    <li>
      <strong>The scale shortfall is exactly <code>1/n</code>.</strong> Each firm produces <code>1 &minus; 1/n</code> of the asymptotic large-group output. As market size expands, individual firms expand up to their capacity bound <code>f(&sigma; &minus; 1)/c</code>.
    </li>
    <li>
      <strong>Market variety is remarkably close to optimal.</strong> The free market creates at most <code>(&sigma; &minus; 1)/&sigma;</code> excess varieties compared to a social planner. Because <code>(&sigma; &minus; 1)/&sigma; &lt; 1</code>, decentralized entry overprovides by less than a single whole firm!
    </li>
    <li>
      <strong>"Excess capacity" is not wasted efficiency.</strong> Real industries face overhead costs and relatively constant marginal costs. Average cost slopes downward everywhere. The sacrifice in firm scale is the price society willingly pays for the richness of consumer choice.
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
