<script>
  /* A guess before the first figure. The answer carries no working; the
     figure below it does. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    Our stock is worth either $99 or $101, and for now we think each is as likely as the other. One trader in ten knows which it is, and
    the rest buy or sell at random. What's the narrowest spread we can quote without losing money on average?
  </p>
  <div class="buttons">
    <button type="button" data-g="tick" class:on={picked === "tick"} onclick={() => (picked = "tick")}>One cent either side</button>
    <button type="button" data-g="twenty" class:on={picked === "twenty"} onclick={() => (picked = "twenty")}>20 cents</button>
    <button type="button" data-g="two" class:on={picked === "two"} onclick={() => (picked = "two")}>The whole $2</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "twenty" ? "Right: 20 cents, from $99.90 to $100.10." : "It's 20 cents, from $99.90 to $100.10."}
      A buy order is a small piece of evidence that the stock is worth $101, and the ask has to price that evidence in. The figure below
      shows how.
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
