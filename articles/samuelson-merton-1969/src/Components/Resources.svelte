<script>
  /* Resources.svelte */
</script>

<section class="body-text" id="resources">
  <h3 class="body-header">Sources and further reading</h3>
  <ul class="resources-list">
    <li>
      Samuelson, P. A. (1969), "Lifetime portfolio selection by dynamic stochastic programming", <em>Review of Economics and Statistics</em>,
      51(3), 239–246. The discrete-time paper rebuilt here: solved backwards, the best share for an isoelastic investor doesn't depend on age.
    </li>
    <li>
      Merton, R. C. (1969), "Lifetime portfolio selection under uncertainty: the continuous-time case", <em>Review of Economics and
      Statistics</em>, 51(3), 247–257. The same problem in continuous time, with the share in closed form.
    </li>
    <li>
      Merton, R. C. (1971), "Optimum consumption and portfolio rules in a continuous-time model", <em>Journal of Economic Theory</em>, 3(4),
      373–413; and Merton, R. C. (1973), "An intertemporal capital asset pricing model", <em>Econometrica</em>, 41(5), 867–887. Wider
      families of utility, and the extra demand that changing investment opportunities create.
    </li>
    <li>
      Samuelson, P. A. (1979), "Why we should not make mean log of wealth big though years to act are long", <em>Journal of Banking and
      Finance</em>, 3(4), 305–307. The argument against maximising growth over long horizons, written in words of one syllable.
    </li>
    <li>
      Campbell, J. Y. and Viceira, L. M. (1999), "Consumption and portfolio decisions when expected returns are time varying",
      <em>Quarterly Journal of Economics</em>, 114(2), 433–495. How much returns that revert change the long-horizon share.
    </li>
    <li>
      Bodie, Z., Merton, R. C. and Samuelson, W. F. (1992), "Labor supply flexibility and portfolio choice in a life cycle model",
      <em>Journal of Economic Dynamics and Control</em>, 16(3–4), 427–449. Wages as part of wealth.
    </li>
  </ul>
  <p>Related articles on this site:</p>
  <ul class="resources-list">
    <li><a href="../merton-share/">The Merton share</a>, the one-year answer that this article shows holds at every horizon.</li>
    <li><a href="../samuelson-1963/">Samuelson's fallacy of large numbers</a>, the earlier argument that repeating a risk doesn't shrink it.</li>
    <li><a href="../pastor-stambaugh-2012/">Pástor and Stambaugh's long-run volatility</a>, on returns that revert and how sure we can be of it.</li>
  </ul>
  <p>
    The lab and every number on this page are ours; the problem, the method and the result are Samuelson's and Merton's. The page is built on
    the scaffold and design system of Amazon's MLU-Explain, used under CC BY-SA 4.0.
  </p>
</section>

<style>
  .resources-list { padding-left: 1.1rem; margin: 0 0 1.2rem 0; }
  .resources-list li { font-size: 0.95rem; line-height: 1.55; margin-bottom: 0.6rem; }
  #resources { margin-bottom: 4rem; }
</style>
