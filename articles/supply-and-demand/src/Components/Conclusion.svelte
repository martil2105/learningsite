<script>
  /* Conclusion.svelte */
</script>

<section class="body-text" id="conclusion">
  <h3 class="body-header">What this costs you</h3>
  <p>
    This result rests on a few assumptions, and each one marks a boundary.
  </p>
  <p>
    First, we assumed straight demand and supply lines with additive shocks
    that are uncorrelated with each other. If the shocks are correlated, for
    instance because an economic boom raises buyers' incomes and sellers' input
    costs at the same time, the true slope can fall outside the two-regression
    bracket entirely.
  </p>
  <p>
    Second, we looked at a single market in a static equilibrium, with no
    inventory cycles and no expectations about future prices.
  </p>
  <p>
    And finally, recovering the demand slope relied on an instrument that
    shifts supply and is strictly excluded from demand. That assumption has to
    be defended with what we know about how the market works, because
    statistical tests alone can't establish it.
  </p>

  <h3 class="body-header">Where this leaves the fitted line</h3>
  <p>
    It's tempting to think that collecting more transactions will eventually
    uncover the true demand curve, but this isn't a sample-size problem. A
    million observations would only estimate the same mix of demand and supply
    very precisely.
  </p>
  <p>
    Instead, the demand slopes that fit the data form what's called an
    <span class="bold">identified set</span>, which is every value that could
    have produced the same population distribution under our assumptions.
    That's quite different from a confidence interval. As the data grows,
    sampling error shrinks towards zero, but the identified set stays as wide
    as the bracket between the forward and reverse regressions.
  </p>
  <p>
    So when both sides of a market are moving, a line of best fit describes
    neither what buyers are willing to pay nor what it costs sellers to
    produce. Its R² tells us how still one curve was compared with the other,
    and 1/R² is exactly how much ambiguity is left.
  </p>
  <p>Thanks for reading!</p>
</section>
