<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Magdon-Ismail, M., Atiya, A. F., Pratap, A. and Abu-Mostafa, Y. S. (2004), "On the maximum drawdown of a Brownian motion",
      <em>Journal of Applied Probability</em>, 41(1), 147–161. The expected worst drawdown with and without drift, and its two ends.
    </li>
    <li>
      Taylor, H. M. (1975), "A stopped Brownian motion formula", <em>Annals of Probability</em>, 3(2), 234–246; and Lehoczky, J. P. (1977),
      "Formulas for stopped diffusion processes with stopping times based on the maximum", <em>Annals of Probability</em>, 5(4), 601–607. The
      distribution of the drawdown as a stopped process.
    </li>
    <li>
      Wald, A. (1944), "On cumulative sums of random variables", <em>Annals of Mathematical Statistics</em>, 15(3), 283–296. The identity
      behind the expected time to climb back.
    </li>
    <li>
      Kenneth R. French, <em>Data Library</em>: the daily Fama/French factors (the market's return above bills, and the bill rate), built
      from the 202608 CRSP database.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li><a href="../var-backtesting/">Backtesting VaR</a>, the article before this one in the finance sequence.</li>
    <li><a href="../kelly-criterion/">The Kelly criterion</a>, on the chance of ever falling to a share of today's money, and the long run in units of one over the Sharpe ratio squared.</li>
    <li><a href="../volatility-clustering/">Volatility clustering</a>, on why the bad days of 1929 to 1932 came together.</li>
    <li><a href="../sharpe-ratio/">The Sharpe ratio</a>, on how far a few years of data can be trusted.</li>
    <li><a href="../bond-pricing-and-yield/">Bond prices and yields</a>, the next article.</li>
  </ul>
  <p>
    The analysis, the simulated strategy and every number on this page are ours. The page is built on the scaffold and design system of
    Amazon's MLU-Explain, used under CC BY-SA 4.0.
  </p>
</section>

<style>
  .resources-list { padding-left: 1.1rem; margin: 0 0 1.2rem 0; }
  .resources-list li { font-size: 0.95rem; line-height: 1.55; margin-bottom: 0.6rem; }
  #resources { margin-bottom: 4rem; }
</style>
