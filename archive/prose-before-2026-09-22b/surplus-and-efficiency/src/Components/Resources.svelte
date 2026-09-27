<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Harberger, A. C. (1954), "Monopoly and Resource Allocation",
      <em>The American Economic Review</em>, 44(2), 77–87. The paper that made
      the case that deadweight loss triangles are small.
    </li>
    <li>
      Weitzman, M. L. (1977), "Is the Price System or Rationing More Effective
      in Getting a Commodity to Those Who Need It Most?",
      <em>The Bell Journal of Economics</em>, 8(2), 517–524. A classic
      comparison of allocating by price and by rationing when buyers' incomes
      differ.
    </li>
    <li>
      Glaeser, E. L., and Luttmer, E. F. P. (2003), "The Misallocation of
      Housing Under Rent Control", <em>The American Economic Review</em>,
      93(4), 1027–1046. An empirical study showing that the misallocation of
      apartments under New York's rent control far outweighs the classic
      deadweight loss from reduced construction.
    </li>
    <li>
      CORE Econ (2017), <em>The Economy</em>, Unit 8, "Supply and demand:
      Price-taking and competitive markets". An introduction to Pareto
      efficiency, gains from trade and total surplus.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li>
      <a href="../supply-and-demand/">Supply and demand</a>, on why market
      data never draws the demand curve, and how 1/R² sets the width of the
      bracket around it.
    </li>
    <li>
      <a href="../elasticity/">Elasticity</a>, on why elasticity isn't a
      property of a good, and how a point cuts its tangent into two pieces
      whose ratio is the elasticity.
    </li>
    <li>
      <a href="../tax-incidence/">Tax incidence</a>, on why the law can't
      decide who bears a tax, and how the elasticities do.
    </li>
  </ul>
  <p>
    The market, the rationing model, the worked examples and every number on
    this page are ours, computed from <span class="mono">src/market.js</span>
    and checked in <span class="mono">verify/check-numbers.mjs</span>. The page
    is built on the scaffold and design system of Amazon's MLU-Explain, used
    under CC BY-SA 4.0.
  </p>
</section>

<style>
  .resources-list {
    padding-left: 1.1rem;
    margin: 0 0 1.2rem 0;
  }
  .resources-list li {
    font-size: 0.95rem;
    line-height: 1.55;
    margin-bottom: 0.6rem;
  }
  #resources {
    margin-bottom: 4rem;
  }
</style>
