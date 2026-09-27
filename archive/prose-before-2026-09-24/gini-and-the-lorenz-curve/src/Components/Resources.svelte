<script>
  /* Resources.svelte */
</script>

<section class="resources-section">
  <div class="divider"></div>
  <h2>Further Reading &amp; References</h2>

  <ul class="resources-list">
    <li>
      <strong>Atkinson, Anthony B. (1970).</strong> "On the Measurement of Inequality", <em>Journal of Economic Theory</em> 2(3): 244–263. The landmark work proving that crossing Lorenz curves invalidate ranking without an explicit social welfare function and introducing the Atkinson index.
    </li>
    <li>
      <strong>Lorenz, Max O. (1905).</strong> "Methods of Measuring the Concentration of Wealth", <em>Publications of the American Statistical Association</em> 9(70): 209–219. The original presentation of the cumulative distribution curve.
    </li>
    <li>
      <strong>Engelmann, Bernd, Evelyn Hayden, and Dirk Tasche (2003).</strong> "Measuring the Discriminative Power of Rating Systems", <em>Deutsche Bundesbank Discussion Paper</em>. The definitive technical reference linking the ROC curve, AUC, CAP curve, and the Gini coefficient in credit risk modeling.
    </li>
    <li>
      <strong>Visual Explainers Series:</strong>
      <ul class="sub-list">
        <li>
          <a href="../tragedy-of-the-commons/">Tragedy of the Commons</a>: Why open access dissipates resource rents and how corrective pricing restores efficiency.
        </li>
        <li>
          <a href="../population-stability-index/">Population Stability Index</a>: How statistical divergence metrics monitor dataset drift and credit scorecard degradation.
        </li>
        <li>
          <a href="../f1-score/">F1 Score</a>: Why aggregate classification metrics mislead when class distributions are imbalanced.
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
