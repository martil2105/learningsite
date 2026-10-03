<script>
  /* A guess before the lab. The answer is short; the lab carries the working. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    Fund A and Fund B hold the same kind of assets, and their true returns are the same. Fund A's prices come from the market every day.
    Fund B's are appraisals that lean on last month's values, and it reports a yearly Sharpe ratio of 0.80 against Fund A's 0.40. Which fund
    earns more for its risk?
  </p>
  <div class="buttons">
    <button type="button" data-g="a" class:on={picked === "a"} onclick={() => (picked = "a")}>Fund A</button>
    <button type="button" data-g="b" class:on={picked === "b"} onclick={() => (picked = "b")}>Fund B</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>Neither</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "same" ? "Right, neither." : "Neither."}
      Both earn the same returns for the same risk. Fund B's higher ratio comes from the way its prices are set, and the lab below shows how.
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
