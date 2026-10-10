<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Kelly, J. L. (1956), "A new interpretation of information rate", <em>Bell System Technical Journal</em>, 35(4), 917–926. The rule.
    </li>
    <li>
      Breiman, L. (1961), "Optimal gambling systems for favorable games", <em>Proceedings of the Fourth Berkeley Symposium on Mathematical
      Statistics and Probability</em>, 1, 65–78. Kelly's bet eventually beats every other fixed bet.
    </li>
    <li>
      Haghani, V. and Dewey, R. (2016), "Rational decision-making under uncertainty: observed betting patterns on a biased coin", working paper,
      SSRN 2856963. The coin game, its 61 players and their results.
    </li>
    <li>
      Thorp, E. O. (2006), "The Kelly criterion in blackjack, sports betting and the stock market", in <em>Handbook of Asset and Liability
      Management</em>, volume 1, Elsevier, 385–428. Fractional Kelly and the chance of falling to a fraction of our money.
    </li>
    <li>
      MacLean, L. C., Thorp, E. O. and Ziemba, W. T. (2010), "Long-term capital growth: the good and bad properties of the Kelly and
      fractional Kelly capital growth criteria", <em>Quantitative Finance</em>, 10(7), 681–687.
    </li>
    <li>
      Samuelson, P. A. (1979), "Why we should not make mean log of wealth big though years to act are long", <em>Journal of Banking and
      Finance</em>, 3(4), 305–307. The objection, in words of one syllable.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li><a href="../fundamental-law/">The fundamental law of active management</a>, the article before this one in the finance sequence.</li>
    <li><a href="../volatility-drag/">Volatility drag</a>, where the growth rate and its σ²/2 first appear.</li>
    <li><a href="../merton-share/">Merton's share</a>, of which Kelly's share is the case with a risk aversion of 1.</li>
    <li><a href="../cost-of-leverage/">The cost of leverage</a>, on borrowing at more than the safe rate.</li>
    <li><a href="../efficient-markets/">Efficient markets</a>, the next article.</li>
  </ul>
  <p>
    The simulations, the analysis and every number on this page are ours, except the experiment's results, which are Haghani and Dewey's. The
    rule is Kelly's and the first-passage formula is a standard result for Brownian motion with drift. The page is built on the scaffold and
    design system of Amazon's MLU-Explain, used under CC BY-SA 4.0.
  </p>
</section>

<style>
  .resources-list { padding-left: 1.1rem; margin: 0 0 1.2rem 0; }
  .resources-list li { font-size: 0.95rem; line-height: 1.55; margin-bottom: 0.6rem; }
  #resources { margin-bottom: 4rem; }
</style>
