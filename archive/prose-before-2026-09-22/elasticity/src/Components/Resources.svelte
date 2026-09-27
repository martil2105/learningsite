<script>
  /* Resources.svelte */
</script>

<section class="resources-section">
  <div class="divider"></div>
  <h2>Further Reading &amp; References</h2>

  <ul class="resources-list">
    <li>
      <strong>Marshall, Alfred (1890).</strong> <em>Principles of Economics</em>, Book III, Chapter iv and Mathematical Appendix Note III. The original geometric definition of point elasticity and the tangent-segment bisection ruler.
    </li>
    <li>
      <strong>CORE Econ (2017).</strong> <em>The Economy</em>, Unit 7.5: "The Elasticity of Demand". An intuitive modern exposition of elasticity, revenue responsiveness, and price sensitivity.
    </li>
    <li>
      <strong>Visual Explainers Series:</strong>
      <ul class="sub-list">
        <li>
          <a href="../supply-and-demand/">Supply &amp; Demand</a>: Why market observations fail to draw the demand curve without an exogenous supply shifter.
        </li>
        <li>
          <a href="../markup-and-elasticity/">Markup &amp; Elasticity</a>: How monopolists translate demand elasticity into profit-maximising markups via the Lerner rule.
        </li>
        <li>
          <a href="../surplus-and-efficiency/">Surplus &amp; Efficiency</a>: Why the area under the demand curve measures consumer surplus and total economic welfare.
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
