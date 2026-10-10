<script>
  /* Conclusion.svelte */
</script>

<section class="body-text" id="conclusion">
  <h3 class="body-header">Three curves and a price</h3>
  <p>
    A yield curve is three curves. Spot rates say what money at each date is worth today, and bootstrapping digs them out of coupon bond
    prices one maturity at a time. Yields to maturity are averages of spot rates, weighted by when each bond's money arrives, so they depend on
    the coupon. Forward rates are the break-even rates that today's prices lock in, and since they're differences between spot rates, they
    magnify every error in them.
  </p>
  <p>
    A forward rate is a price, not a forecast. Even in a world where investors expect rates to stay put and ask nothing for risk, convexity
    pulls long forward rates below the expected rate, and a premium for risk can push them above it. So when the curve slopes upwards, it's
    telling us about expected rates, premiums and volatility all at once, and on its own it can't tell us which.
  </p>
  <p>Thanks for reading!</p>
</section>
