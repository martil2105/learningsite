<script>
  /* A call costs $12; what does the put cost? */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    A share stands at $100. Interest rates are zero and the share pays no dividends. A call and a put on it, both struck at $100 and both
    expiring in a year, trade on the same exchange, and the call costs $12. What does the put cost?
  </p>
  <div class="buttons">
    <button type="button" data-g="less" class:on={picked === "less"} onclick={() => (picked = "less")}>Less, since shares tend to rise</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>$12</button>
    <button type="button" data-g="more" class:on={picked === "more"} onclick={() => (picked = "more")}>More, since crashes are bigger than rallies</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "same" ? "That's right, $12." : "It's $12."}
      The call minus the put pays the share price minus $100, so it's worth $100 minus $100 today, whatever anyone thinks the share will do.
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
