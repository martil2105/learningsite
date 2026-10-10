<script>
  /* The buy-and-hold question before anything else. */
  import { realised } from "../bonds.js";
  import { pct } from "../format.js";
  let picked = $state("");
  const r = realised(0.08, 30, 0.08, 0.04);
</script>

<div class="guess" id="guess">
  <p class="q">
    We buy a 30-year bond with an 8% coupon at $100, so its yield is 8%. The next day, interest rates fall to 4% and stay there. We hold the
    bond to the end and reinvest every coupon. What do we earn a year?
  </p>
  <div class="buttons">
    <button type="button" data-g="8" class:on={picked === "8"} onclick={() => (picked = "8")}>8%, the yield we locked in</button>
    <button type="button" data-g="6" class:on={picked === "6"} onclick={() => (picked = "6")}>About 6%</button>
    <button type="button" data-g="4" class:on={picked === "4"} onclick={() => (picked = "4")}>4%, the new rate</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "6" ? "That's right, about 6%." : "It's about 6%."}
      We earn {pct(r, 2)} a year, closer to the new rate than to the yield we thought we'd locked in.
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
