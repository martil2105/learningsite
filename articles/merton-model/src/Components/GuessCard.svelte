<script>
  /* The question before the solver: how much do the assets move? */
  import { solve } from "../merton.js";
  import { pct } from "../format.js";
  let picked = $state("");
  const x = solve();
</script>

<div class="guess" id="guess">
  <p class="q">
    Our firm's shares are worth $30 and move about 60% a year. The firm owes $70, due in a year. How much do its assets move in a year?
  </p>
  <div class="buttons">
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>About 60%, like the shares</button>
    <button type="button" data-g="forty" class:on={picked === "forty"} onclick={() => (picked = "forty")}>About 40%</button>
    <button type="button" data-g="under" class:on={picked === "under"} onclick={() => (picked = "under")}>Under 20%</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "under" ? "That's right." : "Less than that."}
      The assets move {pct(x.s, 1)} a year, under a third as much as the shares.
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
