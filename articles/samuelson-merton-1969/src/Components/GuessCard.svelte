<script>
  /* A guess before the lab. The answer is one sentence with no figures in
     it; the lab carries the numbers. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    Two savers care only about their wealth at the end, and each year in the market is independent of the last. Who should hold a larger share
    of their savings in stocks?
  </p>
  <div class="buttons">
    <button type="button" data-g="thirty" class:on={picked === "thirty"} onclick={() => (picked = "thirty")}>Thirty years to go</button>
    <button type="button" data-g="one" class:on={picked === "one"} onclick={() => (picked = "one")}>One year to go</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>The same share</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "same" ? "Right, as long as their dislike of risk is in proportion to their wealth." : "For the investor Samuelson and Merton had in mind, it's the same share."}
      The lab below solves the problem year by year to show why.
    </p>
  {/if}
</div>

<style>
  .guess { border: 2px solid var(--ink); background: white; padding: 1.1rem 1.3rem; margin: 1.8rem 0; }
  .q { font-weight: 700; margin: 0 0 0.8rem 0; font-size: 1.05rem; line-height: 1.45; }
  .buttons { display: flex; gap: 8px; flex-wrap: wrap; }
  button { font: inherit; font-size: 0.9rem; border: 1px solid #cfd3db; background: white; padding: 6px 14px; border-radius: 999px; cursor: pointer; color: var(--ink-soft); }
  button.on { background: var(--ink); color: white; border-color: var(--ink); }
  .a { margin: 0.9rem 0 0 0; font-size: 0.98rem; line-height: 1.5; }
</style>
