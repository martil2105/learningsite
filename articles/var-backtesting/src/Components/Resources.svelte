<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Basel Committee on Banking Supervision (1996), <em>Supervisory framework for the use of "backtesting" in conjunction with the internal
      models approach to market risk capital requirements</em>. The traffic light, its zones and the plus factors.
    </li>
    <li>
      Kupiec, P. (1995), "Techniques for verifying the accuracy of risk measurement models", <em>Journal of Derivatives</em>, 3(2), 73–84.
      The likelihood-ratio test on the count.
    </li>
    <li>
      Christoffersen, P. (1998), "Evaluating interval forecasts", <em>International Economic Review</em>, 39(4), 841–862. Testing whether an
      exception makes the next one more likely.
    </li>
    <li>J.P. Morgan and Reuters (1996), <em>RiskMetrics: Technical Document</em>, 4th edition. The exponentially weighted volatility with 0.94.</li>
    <li>
      Barone-Adesi, G., Giannopoulos, K. and Vosper, L. (1999), "VaR without correlations for portfolios of derivative securities",
      <em>Journal of Futures Markets</em>, 19(5), 583–602; and Hull, J. and White, A. (1998), "Incorporating volatility updating into the
      historical simulation method for value-at-risk", <em>Journal of Risk</em>, 1(1), 5–19. Filtered historical simulation.
    </li>
    <li>
      Pérignon, C. and Smith, D. R. (2010), "The level and quality of Value-at-Risk disclosure by commercial banks", <em>Journal of Banking
      and Finance</em>, 34(2), 362–377. How common historical simulation is.
    </li>
    <li>
      Basel Committee on Banking Supervision (2019), <em>Minimum capital requirements for market risk</em>, the backtesting chapter (MAR32).
      The same zones, multipliers from 1.5 to 2, and the desk-level counts.
    </li>
    <li>
      Kenneth R. French, <em>Data Library</em>: the daily Fama/French factors (the market's return above bills, and the bill rate), built
      from the 202608 CRSP database.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li><a href="../volatility-clustering/">Volatility clustering</a>, the article before this one in the finance sequence, on why bad days come together.</li>
    <li><a href="../value-at-risk/">Value at risk</a>, on what the number measures and what it misses.</li>
    <li><a href="../efficient-markets/">Efficient markets</a>, where the same bracket turns daily correlations into the variance ratio.</li>
    <li><a href="../drawdowns/">Drawdowns</a>, the next article.</li>
  </ul>
  <p>
    The analysis, the four models and every number on this page are ours. The page is built on the scaffold and design system of Amazon's
    MLU-Explain, used under CC BY-SA 4.0.
  </p>
</section>

<style>
  .resources-list { padding-left: 1.1rem; margin: 0 0 1.2rem 0; }
  .resources-list li { font-size: 0.95rem; line-height: 1.55; margin-bottom: 0.6rem; }
  #resources { margin-bottom: 4rem; }
</style>
