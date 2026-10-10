<script>
  /* Which bond's spread is the bigger multiple of its expected loss? */
  import { ratings, CORR, SHARPE } from "../credit.js";
  let picked = $state("");
  const r = ratings(CORR * SHARPE);
</script>

<div class="guess" id="guess">
  <p class="q">
    Aaa bonds lose about 0.035 points a year to defaults, and Baa bonds about 0.27. Suppose lenders are paid for default risk the way the previous
    article's model says they should be. Which bond's spread is the bigger multiple of what its defaults cost?
  </p>
  <div class="buttons">
    <button type="button" data-g="baa" class:on={picked === "baa"} onclick={() => (picked = "baa")}>Baa's, since it's riskier</button>
    <button type="button" data-g="aaa" class:on={picked === "aaa"} onclick={() => (picked = "aaa")}>Aaa's</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>The same multiple</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "aaa" ? "That's right, Aaa's." : "It's Aaa's."}
      The model pays Aaa bonds {r.Aaa.multiple.toFixed(1)} times their expected loss and Baa bonds {r.Baa.multiple.toFixed(1)} times.
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
