<script>
  /* Conclusion.svelte */
</script>

<section class="conclusion-section">
  <h2>Conclusion</h2>

  <p>
    Economists have long debated whether deadweight losses from market interventions are large enough to worry about. By treating supply disruptions solely through the lens of Harberger triangles, standard textbooks have systematically underestimated the stakes:
  </p>

  <ol class="takeaways-list">
    <li>
      <strong>The textbook triangle is genuinely small.</strong> Because trade halts closest to the margin where private gains are thinnest, deadweight loss from missing transactions scales quadratically: a cut of fraction <em>d</em> costs only <em>d</em>² of total surplus. A 10% cut costs just 1% of the gains from trade.
    </li>
    <li>
      <strong>Rationing is first order.</strong> When shortages are resolved by queues, lotteries, or bureaucratic rationing rather than prices, units no longer flow to the consumers who value them most. That misallocation loss scales as <em>d</em>(1 − <em>d</em>) and dominates the triangle for every cut under 50%. At a 10% cut, rationing costs nine times the triangle.
    </li>
    <li>
      <strong>The total loss equals the cut itself.</strong> In any linear market with random rationing, the two losses sum to an exact identity: <em>d</em>² + <em>d</em>(1 − <em>d</em>) = <em>d</em>. A 27% quantity shortfall destroys exactly 27% of the total potential surplus.
    </li>
    <li>
      <strong>The policy instrument decides the cost.</strong> Holding quantity down by quota costs <em>d</em>²; holding it down by price ceiling costs <em>d</em>. The ceiling multiplies total economic destruction by exactly 1/<em>d</em>. At a 10% cut, the price ceiling is ten times more expensive than the quota.
    </li>
  </ol>

  <p class="final-word">
    Thanks for reading!
  </p>
</section>

<style>
  .conclusion-section {
    max-width: 680px;
    margin: 2.5rem auto 1.5rem auto;
    padding: 0 1rem;
  }
  h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--squidink, #232f3e);
    margin-bottom: 1rem;
  }
  p {
    font-size: 1.05rem;
    line-height: 1.68;
    color: #2d3748;
    margin-bottom: 1.25rem;
  }
  .takeaways-list {
    margin: 1rem 0 1.5rem 1.25rem;
    padding: 0;
  }
  .takeaways-list li {
    font-size: 1rem;
    line-height: 1.6;
    color: #334155;
    margin-bottom: 0.85rem;
  }
  .takeaways-list strong {
    color: var(--squidink, #232f3e);
  }
  .final-word {
    font-weight: 700;
    color: var(--violet, #7c5aed);
    font-size: 1.1rem;
    margin-top: 2rem;
  }
</style>
