<script>
  /* Conclusion.svelte */
</script>

<section class="body-text" id="conclusion">
  <h3 class="body-header">The formula is right, the inputs aren't</h3>
  <p>
    Markowitz's formula does what it says, and its inputs are the problem. An
    average return's error shrinks only with the square root of the length of
    the history, so for real markets it's measured in whole points rather than
    decimals. With the covariances known, the optimiser's Sharpe ratio is the best one times the cosine of an angle. That angle depends only on the
    number of assets and on the Sharpe ratio times the square root of the years.
  </p>
  <p>
    That gives us a useful habit for any model that trades on estimated
    averages. Before trusting the weights it hands us, we can ask how many years
    it would take to tell its signal from noise, and compare that with the
    history we actually have.
  </p>
  <p>Thanks for reading!</p>
</section>
