<script>
  /* Conclusion.svelte */
</script>

<section class="prose-section" id="conclusion">
  <h2>The Identified Set and Its Limits</h2>

  <p>
    When we look at market data, it is tempting to believe that collecting more transactions will eventually uncover the true demand curve. But this is not a sample-size problem. A million observations will merely estimate the confounded mixture of demand and supply with exquisite precision.
  </p>

  <p>
    Instead, the range of demand curves compatible with observed market moments forms an <strong>identified set</strong>, which is the set of parameter values that could have generated the population distribution under our assumptions. This set is fundamentally different from a confidence interval: sampling error shrinks towards zero as data grows, but the identification bracket remains wide, bounded strictly by the forward regression and the reverse regression.
  </p>

  <p>
    This result rests on several explicit assumptions that define its boundaries. First, we assumed linear demand and supply curves with additive, uncorrelated shocks. If demand and supply shocks are correlated — for instance, if macroeconomic expansions boost consumer purchasing power while simultaneously inflating input costs — the true slope can fall outside the two-regression bracket entirely. Second, we examined a single market in static equilibrium without inventory cycles or forward-looking price expectations. Finally, our recovery of the demand slope relied on an instrument that shifts supply while being strictly excluded from demand, an assumption that must be justified on institutional grounds rather than statistical tests alone.
  </p>

  <p>
    Understanding market equilibrium requires recognising what transaction data can and cannot say on its own. When both sides of the market are in motion, a line of best fit describes neither buyer valuation nor seller cost. Goodness of fit measures how still one curve was relative to the other, and its reciprocal is the exact factor of ambiguity that remains.
  </p>

  <p class="closer">Thanks for reading!</p>
</section>

<style>
  .prose-section {
    max-width: 680px;
    margin: 3rem auto;
    padding: 0 1rem;
    font-size: 1.05rem;
    line-height: 1.7;
    color: var(--squidink, #232f3e);
  }
  h2 {
    font-size: 1.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 1.2rem 0;
  }
  p {
    margin: 0 0 1.2rem 0;
  }
  .closer {
    font-weight: 700;
    margin-top: 2rem;
    color: var(--violet, #7c5aed);
  }
</style>
