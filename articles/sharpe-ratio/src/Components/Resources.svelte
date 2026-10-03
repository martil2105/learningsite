<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Sharpe, W. F. (1966), "Mutual fund performance", <em>Journal of Business</em>, 39(1), 119–138. The ratio of a fund's excess return
      to its volatility.
    </li>
    <li>
      Lo, A. W. (2002), "The statistics of Sharpe ratios", <em>Financial Analysts Journal</em>, 58(4), 36–52. The yearly Sharpe ratio when
      monthly returns are correlated, and the standard error of an estimated ratio.
    </li>
    <li>
      Getmansky, M., Lo, A. W. and Makarov, I. (2004), "An econometric model of serial correlation and illiquidity in hedge fund returns",
      <em>Journal of Financial Economics</em>, 74(3), 529–609. Smoothing as a weighted average of past true returns, fitted to hedge funds.
    </li>
    <li>
      Geltner, D. (1993), "Estimating market values from appraised values without assuming an efficient market", <em>Journal of Real Estate
      Research</em>, 8(3), 325–346. Unsmoothing an index built from appraisals.
    </li>
    <li>
      Asness, C., Krail, R. and Liew, J. (2001), "Do hedge funds hedge?", <em>Journal of Portfolio Management</em>, 28(1), 6–19. How stale
      prices understate hedge funds' exposure to the market.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li><a href="../npv-vs-irr/">NPV versus IRR</a>, the article before this one.</li>
    <li><a href="../volatility-drag/">Volatility drag</a>, on how volatility enters the growth of a fund.</li>
    <li><a href="../diversification/">Diversification</a>, the next article, on what holding many shares does to risk.</li>
    <li><a href="../mean-variance-optimisation/">Mean-variance optimisation</a>, where the best Sharpe ratio has to be estimated from history.</li>
  </ul>
  <p>
    The funds and every number on this page are ours; the correction for correlated returns is Lo's, and the unsmoothing is Geltner's. The
    page is built on the scaffold and design system of Amazon's MLU-Explain, used under CC BY-SA 4.0.
  </p>
</section>

<style>
  .resources-list { padding-left: 1.1rem; margin: 0 0 1.2rem 0; }
  .resources-list li { font-size: 0.95rem; line-height: 1.55; margin-bottom: 0.6rem; }
  #resources { margin-bottom: 4rem; }
</style>
