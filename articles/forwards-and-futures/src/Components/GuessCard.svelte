<script>
  /* Two forecasts, one forward price. */
  import { forward } from "../forwards.js";
  import { money } from "../format.js";
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    Two traders agree that the index is at $100 today, that the safe rate is 4% and that the index pays dividends of 1.5% a year. One
    expects it to end next year at $112 and the other at $97. What price for delivery in a year should each of them accept?
  </p>
  <div class="buttons">
    <button type="button" data-g="own" class:on={picked === "own"} onclick={() => (picked = "own")}>Each their own forecast</button>
    <button type="button" data-g="mid" class:on={picked === "mid"} onclick={() => (picked = "mid")}>Somewhere in between</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>The same price for both</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "same" ? "That's right." : "They should agree."}
      Both should accept {money(forward(), 2)}, the cost of buying the index today and carrying it for a year. Neither forecast comes into it.
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
