<script>
  /* Resources.svelte */
</script>

<section class="resources-section">
  <div class="divider"></div>
  <h2>Further Reading &amp; References</h2>

  <ul class="resources-list">
    <li>
      <strong>Viner, Jacob (1931).</strong> "Cost Curves and Supply Curves", <em>Zeitschrift für Nationalökonomie</em> 3(1):23–46. The foundational geometry connecting competitive supply curves to firm-level marginal cost curves and long-run free entry.
    </li>
    <li>
      <strong>CORE Econ (2023).</strong> <em>The Economy 2.0: Microeconomics</em>, Unit 8: "Supply and Demand: Price-Taking and Competitive Markets". An intuitive treatment of competitive price determination, short-run rent, and zero-profit long-run equilibrium.
    </li>
    <li>
      <strong>Visual Explainers Series:</strong>
      <ul class="sub-list">
        <li>
          <a href="../cost-curves/">Cost Curves</a>: Why the long-run envelope does not touch short-run curves at their minimum unit cost.
        </li>
        <li>
          <a href="../monopolistic-competition/">Monopolistic Competition</a>: How product differentiation and love-of-variety trade off against scale efficiency.
        </li>
        <li>
          <a href="../cartels-and-the-prisoners-dilemma/">Cartels &amp; The Prisoner's Dilemma</a>: Why agreements between competitors unravel when free entry and non-cooperative incentives collide.
        </li>
      </ul>
    </li>
  </ul>
</section>

<style>
  .resources-section {
    margin: 3rem 0;
  }
  .divider {
    height: 1px;
    background: var(--stone, #d4dada);
    margin-bottom: 2rem;
  }
  h2 {
    font-size: 1.3rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 1.25rem 0;
  }
  .resources-list {
    margin: 0;
    padding-left: 1.25rem;
  }
  .resources-list li {
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
  .sub-list {
    margin-top: 0.5rem;
    padding-left: 1.25rem;
  }
  .sub-list li {
    margin-bottom: 0.4rem;
  }
  a {
    color: var(--violet, #7c5aed);
    text-decoration: underline;
    font-weight: 600;
  }
</style>
