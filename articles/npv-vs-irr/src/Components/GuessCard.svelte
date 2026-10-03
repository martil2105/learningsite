<script>
  /* A guess before the lab. The answer is short; the lab carries the working. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    We can do one of two projects, and money costs us 10% a year. Quick turns $100 into $150 in a year, an IRR of 50%. Slow turns $100 into
    $300 in five years, an IRR of 24.6%. Which should we choose?
  </p>
  <div class="buttons">
    <button type="button" data-g="quick" class:on={picked === "quick"} onclick={() => (picked = "quick")}>Quick</button>
    <button type="button" data-g="slow" class:on={picked === "slow"} onclick={() => (picked = "slow")}>Slow</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "slow" ? "Right, Slow." : "Slow."}
      At 10% it makes us $86.28 richer today, against Quick's $36.36. The rest of this article shows how the higher IRR can lose.
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
