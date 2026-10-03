<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Kenneth R. French Data Library, "Portfolios formed on beta" and "Fama/French 3 factors", Tuck School of Business at Dartmouth,
      202608 CRSP vintage, retrieved 3 October 2026. Every US number on this page comes from these two files.
    </li>
    <li>
      Sharpe, W. F. (1964), "Capital asset prices: a theory of market equilibrium under conditions of risk", <em>Journal of Finance</em>,
      19(3), 425–442; and Lintner, J. (1965), "The valuation of risk assets and the selection of risky investments in stock portfolios and
      capital budgets", <em>Review of Economics and Statistics</em>, 47(1), 13–37. The CAPM.
    </li>
    <li>
      Black, F., Jensen, M. C. and Scholes, M. (1972), "The capital asset pricing model: some empirical tests", in M. C. Jensen (ed.),
      <em>Studies in the Theory of Capital Markets</em>, Praeger, 79–121. Sorting into beta portfolios, and the first flat line.
    </li>
    <li>
      Fama, E. F. and MacBeth, J. D. (1973), "Risk, return, and equilibrium: empirical tests", <em>Journal of Political Economy</em>, 81(3),
      607–636. Refitting the line every month.
    </li>
    <li>
      Blume, M. E. (1975), "Betas and their regression tendencies", <em>Journal of Finance</em>, 30(3), 785–795. Why sorted betas drift back
      towards 1.
    </li>
    <li>
      Roll, R. (1977), "A critique of the asset pricing theory's tests", <em>Journal of Financial Economics</em>, 4(2), 129–176.
    </li>
    <li>
      Frazzini, A. and Pedersen, L. H. (2014), "Betting against beta", <em>Journal of Financial Economics</em>, 111(1), 1–25.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li><a href="../mean-variance-optimisation/">Mean-variance optimisation</a>, the article before this one in the finance sequence.</li>
    <li><a href="../diversification/">Diversification</a>, on why only the risk that moves with the market is left after diversifying.</li>
    <li><a href="../factor-models/">Factor models</a>, the next article, on what an alpha is measured against.</li>
  </ul>
  <p>
    The simulated world, the analysis and every number on this page are ours; the data are Kenneth French's, and the model is Sharpe's and
    Lintner's. The page is built on the scaffold and design system of Amazon's MLU-Explain, used under CC BY-SA 4.0.
  </p>
</section>

<style>
  .resources-list { padding-left: 1.1rem; margin: 0 0 1.2rem 0; }
  .resources-list li { font-size: 0.95rem; line-height: 1.55; margin-bottom: 0.6rem; }
  #resources { margin-bottom: 4rem; }
</style>
