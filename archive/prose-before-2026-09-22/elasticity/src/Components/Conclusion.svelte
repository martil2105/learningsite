<script>
  /* Conclusion.svelte */
</script>

<section class="conclusion-section">
  <h2>Conclusion</h2>

  <p>
    Price elasticity of demand is almost universally introduced as an abstract sensitivity coefficient, but its true nature is geometric:
  </p>

  <ol class="takeaways-list">
    <li>
      <strong>It is not a property of a good.</strong> On a single straight demand curve, elasticity takes every value from zero to infinity. At low prices (<em>p</em> = 5), the good is deeply inelastic (|ε| = 0.087); at high prices (<em>p</em> = 60), the exact same good is deeply elastic (|ε| = 24.0). Calling an item "an elastic good" mistakes the point for the curve.
    </li>
    <li>
      <strong>It is a ratio of two lengths.</strong> On any demand curve ever drawn, a point cuts its own tangent line into an upper segment (to the quantity axis) and a lower segment (to the price axis). The elasticity is identically the upper length divided by the lower length. When the two pieces are equal, elasticity is exactly one and revenue is maximised.
    </li>
    <li>
      <strong>Two-point formulas silently commit to curves.</strong> There is no purely objective way to calculate elasticity between two observations without choosing a model. The midpoint formula is the exact point elasticity of a straight line; the log-difference formula is the exact exponent of a constant-elasticity curve. Choosing a formula means choosing a demand curve.
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
