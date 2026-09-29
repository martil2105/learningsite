<script>
  /* A guess before the lab. The answer has no figures in it; the lab
     carries the numbers. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    A 25-year-old's pay follows company dividends with a lag: when dividends fall, her pay eventually follows. Compared with a worker whose
    pay is as safe as a bond, how much stock should she hold in her savings?
  </p>
  <div class="buttons">
    <button type="button" data-g="more" class:on={picked === "more"} onclick={() => (picked = "more")}>More</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>About the same</button>
    <button type="button" data-g="less" class:on={picked === "less"} onclick={() => (picked = "less")}>Less</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "less" ? "Right: less." : "In the model we're about to build, it's less."}
      The lab below shows how much less, and how it changes as she ages.
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
