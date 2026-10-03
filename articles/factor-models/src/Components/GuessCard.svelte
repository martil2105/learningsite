<script>
  /* A guess before the lab. The answer is short; the lab carries the working. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    From 1963 to 2026, a portfolio long cheap shares and short expensive ones beat the CAPM's prediction by 4.5% a year. Now we add two
    more factors to the model, one for profitability and one for investment. What happens to that 4.5%?
  </p>
  <div class="buttons">
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>About the same</button>
    <button type="button" data-g="less" class:on={picked === "less"} onclick={() => (picked = "less")}>It shrinks a little</button>
    <button type="button" data-g="gone" class:on={picked === "gone"} onclick={() => (picked = "gone")}>It disappears</button>
    <button type="button" data-g="more" class:on={picked === "more"} onclick={() => (picked = "more")}>It grows</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "gone" ? "Right, it disappears." : "It disappears."}
      In the bigger model the alpha is −0.3% a year, which is nothing at all. The lab below shows where the 4.5% went.
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
