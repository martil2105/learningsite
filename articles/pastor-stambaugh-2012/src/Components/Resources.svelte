<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Pástor, Ľ. and Stambaugh, R. F. (2012), "Are stocks really less volatile in the long run?", <em>Journal of Finance</em>, 67(2), 431–478.
      The paper rebuilt here. The predictive system, the five-part split of the investor's variance (their equation 12) and the example of
      fifty years ahead with 206 years of data are theirs. The results quoted in the section on what the paper found are from its benchmark
      case, as reported in the 2011 working-paper version.
    </li>
    <li>
      Siegel, J. J., <em>Stocks for the Long Run</em>, McGraw-Hill, several editions. The best-known statement of the measurement that long
      horizons are calmer per year.
    </li>
    <li>
      Carvalho, C. M., Lopes, H. F. and McCulloch, R. E. (2018), "On the long-run volatility of stocks", <em>Journal of the American
      Statistical Association</em>, 113(523), 1050–1069. Similar models, reaching the opposite conclusion under the priors they prefer.
    </li>
    <li>
      Avramov, D., Cederburg, S. and Lučivjanská, K. (2018), "Are stocks riskier over the long run? Taking cues from economic theory",
      <em>Review of Financial Studies</em>, 31(2), 556–594. Priors taken from asset-pricing models, and how much they decide the answer.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li><a href="../time-diversification/">Time diversification</a>, the same world without any mean reversion, and three ways to measure its risk.</li>
    <li><a href="../bodie-1995/">Bodie's shortfall insurance</a>, the price of removing the long-run shortfall.</li>
    <li><a href="../mean-variance-optimisation/">Mean-variance optimisation</a>, where the blur in an estimated mean return first came up.</li>
  </ul>
  <p>
    The labs, the charts and every number on this page are ours, apart from the paper's own results where we say so. The page is built on the
    scaffold and design system of Amazon's MLU-Explain, used under CC BY-SA 4.0.
  </p>
</section>

<style>
  .resources-list { padding-left: 1.1rem; margin: 0 0 1.2rem 0; }
  .resources-list li { font-size: 0.95rem; line-height: 1.55; margin-bottom: 0.6rem; }
  #resources { margin-bottom: 4rem; }
</style>
