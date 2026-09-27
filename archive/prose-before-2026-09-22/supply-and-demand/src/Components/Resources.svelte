<script>
  /* Resources.svelte */
</script>

<footer class="resources-section" id="resources">
  <h2>References &amp; Further Reading</h2>
  <ul class="citation-list">
    <li>
      <strong>CORE Econ (2023).</strong> <em>The Economy 2.0: Microeconomics</em>, Unit 8: Supply and demand: Price-taking and competitive markets. Open-access textbook on competitive equilibrium and market dynamics.
    </li>
    <li>
      <strong>Working, E. J. (1927).</strong> "What Do Statistical 'Demand Curves' Show?" <em>The Quarterly Journal of Economics</em>, 41(2), 212–235. The foundational paper establishing the identification problem in market data.
    </li>
    <li>
      <strong>Gini, C. (1921).</strong> "Sull'interpolazione di una striscia bivariata." <em>Metron</em>, 1, 63–82; and <strong>Frisch, R. (1934).</strong> <em>Statistical Confluence Analysis by Means of Complete Regression Systems</em>. Early formulations of reverse-regression bounds under errors in variables.
    </li>
    <li>
      <strong>Leamer, E. E. (1978).</strong> <em>Specification Searches: Ad Hoc Inference with Nonexperimental Data</em>. John Wiley &amp; Sons. Comprehensive treatment of bounding sets in econometrics.
    </li>
    <li>
      <strong>Klepper, S., &amp; Leamer, E. E. (1984).</strong> "Consistent Sets of Estimates for Regressions with Errors in All Variables." <em>Econometrica</em>, 52(1), 163–183. Proving the diagnostic bounds formed by forward and reverse regressions.
    </li>
  </ul>
</footer>

<style>
  .resources-section {
    max-width: 680px;
    margin: 3rem auto 5rem auto;
    padding: 2rem 1rem 0 1rem;
    border-top: 2px solid var(--squidink, #232f3e);
    color: var(--squidink, #232f3e);
  }
  h2 {
    font-size: 1.25rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 0 0 1.2rem 0;
  }
  .citation-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  li {
    font-size: 0.9rem;
    line-height: 1.55;
  }
</style>
