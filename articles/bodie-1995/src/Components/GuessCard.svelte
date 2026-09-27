<script>
  /* A two-button guess before the lab. The answer is one sentence with no
     figures in it; the lab carries the numbers. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">Which costs more: insuring one year of stocks against ending behind bonds, or insuring thirty years?</p>
  <div class="buttons">
    <button type="button" data-g="one" class:on={picked === "one"} onclick={() => (picked = "one")}>One year</button>
    <button type="button" data-g="thirty" class:on={picked === "thirty"} onclick={() => (picked = "thirty")}>Thirty years</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "thirty" ? "Right, and by a wide margin." : "It's the other way round, and by a wide margin."}
      Thirty years of insurance costs about five times as much as one. The lab below shows why.
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
