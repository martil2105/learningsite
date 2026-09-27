<script>
  /* Resources.svelte */
</script>

<section class="resources-section">
  <div class="divider"></div>
  <h2>Further Reading &amp; References</h2>

  <ul class="resources-list">
    <li>
      <strong>Harberger, Arnold C. (1954).</strong> "Monopoly and Resource Allocation." <em>The American Economic Review</em>, 44(2), 77–87. The foundational paper establishing that deadweight loss triangles are second-order small.
    </li>
    <li>
      <strong>Weitzman, Martin L. (1977).</strong> "Is the Price System or Rationing More Effective in Getting a Commodity to Those Who Need It Most?" <em>The Bell Journal of Economics</em>, 8(2), 517–524. The classic microeconomic analysis comparing price allocation against rationing in the presence of income dispersion.
    </li>
    <li>
      <strong>Glaeser, Edward L., and Erzo F. P. Luttmer (2003).</strong> "The Misallocation of Housing Under Rent Control." <em>The American Economic Review</em>, 93(4), 1027–1046. An empirical study showing that the misallocation of apartments among consumers under New York rent control dwarfs the classic deadweight loss from reduced construction.
    </li>
    <li>
      <strong>CORE Econ (2017).</strong> <em>The Economy</em>, Unit 8: "Supply and Demand: Price-Taking and Competitive Markets". An exposition of Pareto efficiency, gains from trade, and total surplus.
    </li>
    <li>
      <strong>Visual Explainers Series:</strong>
      <ul class="sub-list">
        <li>
          <a href="../supply-and-demand/">Supply &amp; Demand</a>: Why market data never draws the demand curve, and how 1/R² brackets the identification failure.
        </li>
        <li>
          <a href="../elasticity/">Elasticity</a>: Why sensitivity is not a property of a good, and how tangents cut demand into exact length ratios.
        </li>
        <li>
          <a href="../tax-incidence/">Tax Incidence</a>: Why the economic burden of a tax cannot be legislated, and how elasticity ratios govern who pays.
        </li>
      </ul>
    </li>
  </ul>
</section>

<style>
  .resources-section {
    max-width: 680px;
    margin: 2rem auto 3rem auto;
    padding: 0 1rem;
  }
  .divider {
    height: 1px;
    background: #e2e8f0;
    margin-bottom: 2rem;
  }
  h2 {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--squidink, #232f3e);
    margin-bottom: 1rem;
  }
  .resources-list {
    margin: 0;
    padding-left: 1.25rem;
  }
  .resources-list li {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #475569;
    margin-bottom: 0.85rem;
  }
  .sub-list {
    margin-top: 0.4rem;
    padding-left: 1.2rem;
  }
  .sub-list li {
    margin-bottom: 0.35rem;
  }
  a {
    color: var(--violet, #7c5aed);
    text-decoration: underline;
    font-weight: 600;
  }
  a:hover {
    color: #6028c6;
  }
  strong {
    color: #1e293b;
  }
</style>
