<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Lorenz, M. O. (1905), "Methods of Measuring the Concentration of Wealth",
      <em>Publications of the American Statistical Association</em>, 9(70),
      209–219. The paper that introduced the curve.
    </li>
    <li>
      Gini, C. (1912), <em>Variabilità e mutabilità</em>, Bologna. Where the
      mean difference between every pair of incomes, and the coefficient built
      from it, first appear.
    </li>
    <li>
      Atkinson, A. B. (1970), "On the Measurement of Inequality",
      <em>Journal of Economic Theory</em>, 2(3), 244–263. The index with an
      inequality aversion parameter, and the result that crossing Lorenz curves
      can only be ranked once we choose how to weight incomes.
    </li>
    <li>
      Engelmann, B., Hayden, E. and Tasche, D. (2003), "Measuring the
      Discriminative Power of Rating Systems", <em>Deutsche Bundesbank
      Discussion Paper</em>. Links the CAP curve, the ROC curve and the accuracy
      ratio, and shows that the accuracy ratio equals 2·AUC − 1.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li>
      <a href="../population-stability-index/">Population Stability Index</a>, on
      telling whether a scorecard's population has drifted.
    </li>
    <li>
      <a href="../f1-score/">F1 Score</a>, on why a single summary of a
      classifier can mislead when one class is rare.
    </li>
  </ul>
  <p>
    The two societies, the two scorecards, the worked examples and every number
    on this page are ours. The page is built on the scaffold and design system
    of Amazon's MLU-Explain, used under CC BY-SA 4.0.
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
