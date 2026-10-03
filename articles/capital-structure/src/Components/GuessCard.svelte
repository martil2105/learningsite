<script>
  /* A guess before the lab. The answer is short; the lab carries the working. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    Our firm has no debt, and its shareholders expect 8% a year. It borrows half of its value at 3%, a rate it can get because the loan is
    safe, and pays the cash out to its shareholders. Before tax, what's its cost of capital now?
  </p>
  <div class="buttons">
    <button type="button" data-g="lower" class:on={picked === "lower"} onclick={() => (picked = "lower")}>5.5%</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>Still 8%</button>
    <button type="button" data-g="higher" class:on={picked === "higher"} onclick={() => (picked = "higher")}>More than 8%</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "same" ? "Right, it's still 8%." : "It's still 8%."}
      The shareholders now expect 13%, and half of 13% plus half of 3% is 8%. The next section shows where the extra 5 points come from.
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
