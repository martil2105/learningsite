<script>
  /* Resources.svelte */
</script>

<section class="resources-section">
  <div class="divider"></div>
  <h2>Further Reading &amp; References</h2>

  <ul class="resources-list">
    <li>
      <strong>Viner, Jacob (1931).</strong> "Cost Curves and Supply Curves", <em>Zeitschrift für Nationalökonomie</em> 3(1):23–46. The classic paper detailing the envelope of short-run cost curves and Viner's famous instruction to his draughtsman, Dr. Y.K. Wong, to draw the envelope through the minima of the short-run curves — which Wong rightly protested was mathematically impossible.
    </li>
    <li>
      <strong>CORE Econ (2023).</strong> <em>The Economy 2.0: Microeconomics</em>, Unit 7: "The Firm: Customers and Costs". An intuitive exposition of short-run cost functions, fixed vs variable costs, and economies of scale.
    </li>
    <li>
      <strong>Visual Explainers Series:</strong>
      <ul class="sub-list">
        <li>
          <a href="../supply-and-demand/">Supply &amp; Demand</a>: How market prices clear competitive exchange and why naive price-quantity regressions fail.
        </li>
        <li>
          <a href="../tax-incidence/">Tax Incidence</a>: Why legal tax liability is completely irrelevant to economic burden.
        </li>
        <li>
          <a href="../perfect-competition/">Perfect Competition</a>: How free entry drives prices toward minimum average cost in discrete whole-firm increments.
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
