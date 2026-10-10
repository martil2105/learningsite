<script>
  /* The question before anything else: a model with twice the exceptions it promises. */
  import { zoneChances } from "../backtest.js";
  import { pct } from "../format.js";
  let picked = $state("");
  const bad = zoneChances(0.02), good = zoneChances(0.01);
</script>

<div class="guess" id="guess">
  <p class="q">
    Suppose our model is too optimistic. The number it reports each evening is really the loss we'll beat on 2% of days, not 1%, so it
    has twice as many exceptions as it promises. In what share of years does it still come out green?
  </p>
  <div class="buttons">
    <button type="button" data-g="20" class:on={picked === "20"} onclick={() => (picked = "20")}>About 1 in 20</button>
    <button type="button" data-g="5" class:on={picked === "5"} onclick={() => (picked = "5")}>About 1 in 5</button>
    <button type="button" data-g="half" class:on={picked === "half"} onclick={() => (picked = "half")}>Almost half</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "half" ? "That's right, almost half." : "It's almost half."}
      The model is green in {pct(bad.green, 1)} of years. A right model is green in {pct(good.green, 1)}.
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
