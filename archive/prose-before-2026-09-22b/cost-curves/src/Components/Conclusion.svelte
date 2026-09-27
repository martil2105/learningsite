<script>
  /* Conclusion.svelte */
</script>

<section class="conclusion-section">
  <h2>Conclusion</h2>

  <p>
    The classic diagram of short-run average cost curves sitting inside a long-run envelope is one of the most familiar pictures in microeconomics. Yet its textbook presentation conceals an exact geometric truth:
  </p>

  <ol class="takeaways-list">
    <li>
      <strong>The textbook picture holds at exactly one point.</strong> When a firm chooses plant size $k$ to minimise the cost of output $q$, the short-run curve is tangent to the long-run envelope at that output. But the plant is run at its own cheapest scale <em>only</em> when $k = f$ — the single plant that serves the global minimum of the long-run curve.
    </li>
    <li>
      <strong>The tangency offset has an exact closed form.</strong> The ratio of the tangency output to the plant's cheapest scale is $(2k/(f+k))^{1/3}$. Small plants ($k &lt; f$) touch the envelope on their falling segment, deliberately operating below their efficient scale; large plants ($k &gt; f$) touch on their rising segment, deliberately operating above it.
    </li>
    <li>
      <strong>The firm is running the right plant at the wrong scale.</strong> The envelope theorem ensures that marginal costs still align perfectly ($SRMC = LRMC$) at the tangency point. Because the envelope is locally flat, the cost penalty for operating off-peak is strictly second-order ($O(e^2)$) — explaining why Jacob Viner's draughtsman could not draw what his professor requested, and why the error remained innocuous for so long.
    </li>
  </ol>

  <p class="final-word">Thanks for reading!</p>
</section>

<style>
  .conclusion-section {
    margin: 3.5rem 0 2rem 0;
    padding-top: 2rem;
    border-top: 1px solid var(--stone, #d4dada);
  }
  h2 {
    font-size: 1.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 1.25rem 0;
  }
  p {
    font-size: 1.05rem;
    line-height: 1.65;
    margin: 0 0 1.25rem 0;
  }
  .takeaways-list {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
  }
  .takeaways-list li {
    font-size: 1rem;
    line-height: 1.65;
    margin-bottom: 1rem;
  }
  .final-word {
    font-weight: 700;
    margin-top: 2rem;
  }
</style>
