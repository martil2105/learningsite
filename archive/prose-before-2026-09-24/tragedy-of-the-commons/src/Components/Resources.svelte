<script>
  /* Resources.svelte */
</script>

<section class="resources-section">
  <div class="divider"></div>
  <h2>Further Reading &amp; References</h2>

  <ul class="resources-list">
    <li>
      <strong>Gordon, H. Scott (1954).</strong> "The Economic Theory of a Common-Property Resource: The Fishery", <em>Journal of Political Economy</em> 62(2): 124–142. The foundational economic paper establishing that open access drives effort until average product equals opportunity cost, fully dissipating natural resource rent.
    </li>
    <li>
      <strong>Hardin, Garrett (1968).</strong> "The Tragedy of the Commons", <em>Science</em> 162(3859): 1243–1248. The widely cited essay popularizing the dilemma of freedom in a commons.
    </li>
    <li>
      <strong>Ostrom, Elinor (1990).</strong> <em>Governing the Commons: The Evolution of Institutions for Collective Action</em>. Cambridge University Press. The Nobel Prize-winning empirical analysis of how real-world communities overcome the tragedy through bottom-up polycentric governance without centralized state ownership.
    </li>
    <li>
      <strong>Visual Explainers Series:</strong>
      <ul class="sub-list">
        <li>
          <a href="../cartels-and-the-prisoners-dilemma/">Cartels &amp; The Prisoner's Dilemma</a>: How non-cooperative game theory dismantles agreements when outsiders can free-ride.
        </li>
        <li>
          <a href="../gini-and-the-lorenz-curve/">Gini &amp; The Lorenz Curve</a>: Measuring structural inequality, distributional concentration, and score-matching metrics.
        </li>
        <li>
          <a href="../bargaining-and-the-surplus/">Bargaining &amp; The Surplus</a>: How cooperative surplus is negotiated and divided when property rights are clearly defined.
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
