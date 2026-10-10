<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Moody's Seasoned Baa and Aaa Corporate Bond Yields (series BAA and AAA), monthly from January 1919, from FRED, Federal Reserve Bank of
      St. Louis. Pinned with their hashes in the article's data folder.
    </li>
    <li>
      Chen, L., Collin-Dufresne, P. and Goldstein, R. S. (2009), "On the relation between the credit spread puzzle and the equity premium
      puzzle", <em>Review of Financial Studies</em>, 22(9), 3367–3409. The default rates, recovery, correlation and Sharpe ratio we use, from
      Moody's data for 1970 to 2001, and the Black and Cox spreads we compare with.
    </li>
    <li>
      Huang, J.-Z. and Huang, M. (2012), "How much of the corporate-Treasury yield spread is due to credit risk?", <em>Review of Asset Pricing
      Studies</em>, 2(2), 153–202.
    </li>
    <li>
      Feldhütter, P. and Schaefer, S. M. (2018), "The myth of the credit spread puzzle", <em>Review of Financial Studies</em>, 31(8),
      2897–2942.
    </li>
    <li>
      Elton, E. J., Gruber, M. J., Agrawal, D. and Mann, C. (2001), "Explaining the rate spread on corporate bonds", <em>Journal of
      Finance</em>, 56(1), 247–277. Taxes and a risk premium.
    </li>
    <li>
      Vasicek, O. (2002), "The distribution of loan portfolio value", <em>Risk</em>, 15(12), 160–162. The one-factor model of defaults.
    </li>
    <li>
      Altman, E. I., Brady, B., Resti, A. and Sironi, A. (2005), "The link between default and recovery rates: theory, empirical evidence,
      and implications", <em>Journal of Business</em>, 78(6), 2203–2228.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li><a href="../merton-model/">The Merton model</a>, the article before this one, where the market's chance of default comes from.</li>
    <li><a href="../var-backtesting/">Backtesting VaR</a>, where rare events that bunch also made a short record misleading.</li>
    <li><a href="../forwards-and-futures/">Forwards and futures</a>, the next article.</li>
  </ul>
  <p>
    The yields are Moody's, through FRED. The default rates, the recovery and the Black and Cox spreads are as Chen, Collin-Dufresne and
    Goldstein report them, and the findings of Huang and Huang, Feldhütter and Schaefer, and Elton and his coauthors are theirs. The analysis,
    the simulated records and every other number on this page are ours. The page is built on the scaffold and design system of Amazon's
    MLU-Explain, used under CC BY-SA 4.0.
  </p>
</section>

<style>
  .resources-list { padding-left: 1.1rem; margin: 0 0 1.2rem 0; }
  .resources-list li { font-size: 0.95rem; line-height: 1.55; margin-bottom: 0.6rem; }
  #resources { margin-bottom: 4rem; }
</style>
