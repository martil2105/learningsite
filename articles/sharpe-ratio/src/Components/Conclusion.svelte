<script>
  /* Conclusion.svelte */
</script>

<section class="body-text" id="conclusion">
  <h3 class="body-header">A ratio that depends on the pricing</h3>
  <p>
    When we multiply a monthly Sharpe ratio by the square root of twelve, we're assuming the months don't remember each other. When a fund's
    prices are smoothed, they do, and the reported ratio is inflated by a factor set by how much each month leans on the last, double at a smoothing of
    0.6. Lo's correction brings back most of the volatility we lost. At a one-year horizon it still leaves a couple of months of variance out,
    though, because the yearly returns are smoothed as well.
  </p>
  <p>
    So when we see a high Sharpe ratio from a fund whose assets rarely trade, it's worth asking how its prices are set. Undoing the smoothing
    gets us back to the true figure, as long as we can estimate how strong the smoothing is.
  </p>
  <p>Thanks for reading!</p>
</section>
