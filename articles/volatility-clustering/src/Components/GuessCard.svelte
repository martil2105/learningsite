<script>
  /* Which day was the bigger surprise? The answer needs the model the page builds. */
  import { Z_GARCH, Z_RAW } from "../garch.js";
  import { RET, dayIndex } from "../market.js";
  import { fixed, pct } from "../format.js";
  let picked = $state("");
  const a = dayIndex(19871019), b = dayIndex(19550926);
</script>

<div class="guess" id="guess">
  <p class="q">
    On 19 October 1987 the US market fell {pct(-RET[a], 1)}. On 26 September 1955, the first trading day after President Eisenhower's heart
    attack, it fell {pct(-RET[b], 1)}. Which day was the bigger surprise to investors at the time?
  </p>
  <div class="buttons">
    <button type="button" data-g="1987" class:on={picked === "1987"} onclick={() => (picked = "1987")}>1987, by far</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>About the same</button>
    <button type="button" data-g="1955" class:on={picked === "1955"} onclick={() => (picked = "1955")}>1955</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "1955" ? "That's right, 1955." : "It was 1955."}
      Against the century's ordinary spread, 1987 was {fixed(-Z_RAW[a], 1)} standard deviations and 1955 only {fixed(-Z_RAW[b], 1)}. But
      measured against how much the market had been moving in the days just before, 1955 was {fixed(-Z_GARCH[b], 1)} and 1987
      {fixed(-Z_GARCH[a], 1)}. Let's see where that second ruler comes from.
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
