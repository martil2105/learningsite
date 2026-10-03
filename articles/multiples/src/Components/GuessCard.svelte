<script>
  /* A guess before the lab. The answer is short; the lab carries the working. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    Two firms will each earn $1 a share next year, and their shareholders want 8% a year from both. Firm A pays out everything and never
    grows. Firm B reinvests half its earnings at a return of 8% and grows 4% a year. Which one trades at the higher P/E?
  </p>
  <div class="buttons">
    <button type="button" data-g="a" class:on={picked === "a"} onclick={() => (picked = "a")}>Firm A</button>
    <button type="button" data-g="b" class:on={picked === "b"} onclick={() => (picked = "b")}>Firm B</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>The same</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "same" ? "Right, they're the same." : "They're the same."}
      Both shares are worth $12.50, which is 12.5 times next year's earnings. Firm B's growth costs it exactly as much as it's worth,
      and the lab below shows why.
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
