<script>
  /* A guess before the lab. The answer has no figures in it; the lab
     carries the numbers. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    A saver puts 1 into stocks at the start of each of 40 years, and doesn't touch the account until the end. Which decade of stock returns
    matters most for how much she finishes with?
  </p>
  <div class="buttons">
    <button type="button" data-g="first" class:on={picked === "first"} onclick={() => (picked = "first")}>The first decade</button>
    <button type="button" data-g="middle" class:on={picked === "middle"} onclick={() => (picked = "middle")}>One of the middle two</button>
    <button type="button" data-g="last" class:on={picked === "last"} onclick={() => (picked = "last")}>The last decade</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "last" ? "Right: the last." : "It's the last."}
      The lab below shows how far ahead of the others it is, and it's not as far as you might expect.
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
