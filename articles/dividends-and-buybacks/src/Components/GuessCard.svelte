<script>
  /* A guess before the lab. The answer has no working; the lab carries it. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    Our firm is handing $10 a share back to its shareholders. As a buyback at the fair price, it raises earnings per share by 6.1%. As a
    dividend, it lowers them by 4.5%. Before tax, which leaves the shareholders better off?
  </p>
  <div class="buttons">
    <button type="button" data-g="buyback" class:on={picked === "buyback"} onclick={() => (picked = "buyback")}>The buyback</button>
    <button type="button" data-g="dividend" class:on={picked === "dividend"} onclick={() => (picked = "dividend")}>The dividend</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>Neither</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "same" ? "Right: neither." : "Neither."}
      Every shareholder ends up with $100 of wealth for each share they had, either way. The lab below shows where the gap in earnings per
      share goes.
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
