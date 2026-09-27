<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Marshall, A. (1890), <em>Principles of Economics</em>, Book III,
      chapter iv, and the Mathematical Appendix, Note III. The original
      definition of point elasticity, including the tangent construction.
    </li>
    <li>
      CORE Econ (2017), <em>The Economy</em>, Unit 7.5, "The elasticity of
      demand". A modern introduction to elasticity and to how revenue responds
      to price.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li>
      <a href="../supply-and-demand/">Supply and demand</a>, on why market
      data can't draw the demand curve without an outside shift in supply.
    </li>
    <li>
      <a href="../markup-and-elasticity/">Markup and elasticity</a>, on how a
      firm with pricing power turns the demand elasticity into its markup,
      through the Lerner rule.
    </li>
    <li>
      <a href="../surplus-and-efficiency/">Surplus and efficiency</a>, on why
      the area under the demand curve measures what buyers gain from trade.
    </li>
  </ul>
  <p>
    The five demand curves, the worked examples and every number on this page
    are ours, computed from <span class="mono">src/demand.js</span> and checked
    in <span class="mono">verify/check-numbers.mjs</span>. The page is built on
    the scaffold and design system of Amazon's MLU-Explain, used under
    CC BY-SA 4.0.
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
