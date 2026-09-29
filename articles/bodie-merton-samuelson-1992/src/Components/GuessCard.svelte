<script>
  /* A guess before the lab. The answer is one sentence with no figures in
     it; the lab carries the numbers. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    Two workers have the same savings, the same age and the same hours this year. One can change her hours whenever she likes, and the other
    is stuck with hers. Who should hold more of her savings in stocks?
  </p>
  <div class="buttons">
    <button type="button" data-g="flex" class:on={picked === "flex"} onclick={() => (picked = "flex")}>The one who can change her hours</button>
    <button type="button" data-g="fixed" class:on={picked === "fixed"} onclick={() => (picked = "fixed")}>The one who can't</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>The same for both</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "flex" ? "Right, and by more than most of us would guess." : "For the workers in the paper, it's the one who can change her hours."}
      The lab below puts the two side by side, so we can see where the gap comes from.
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
