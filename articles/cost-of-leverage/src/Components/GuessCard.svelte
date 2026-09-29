<script>
  /* A guess before the lab. The answer has no figures in it; the lab
     carries the numbers. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    Stocks earn 5 points over the safe rate, with a volatility of 18%. A saver with a risk aversion of 1 who could borrow at the safe rate would
    hold 154% of her wealth in stocks. Now borrowing costs 2 points more than the safe rate. How much does she hold?
  </p>
  <div class="buttons">
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>Still about 154%</button>
    <button type="button" data-g="between" class:on={picked === "between"} onclick={() => (picked = "between")}>Between 100% and 154%</button>
    <button type="button" data-g="exact" class:on={picked === "exact"} onclick={() => (picked = "exact")}>Exactly 100%</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "exact" ? "Right: exactly 100%." : "It's exactly 100%."}
      She would like to borrow at the safe rate, but not at this price, and she doesn't want to sell any stock either. The lab below shows how many
      savers are like her.
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
