<script>
  /* The horizon question before anything else. */
  import { atHorizon, dates } from "../duration.js";
  import { signedPct } from "../format.js";
  let picked = $state("");
  const D = dates(0.08, 30, 0.08).D;
  const down = atHorizon(0.08, 30, 0.08, D, 0.04) - 1, up = atHorizon(0.08, 30, 0.08, D, 0.12) - 1;
</script>

<div class="guess" id="guess">
  <p class="q">
    We buy a 30-year bond with an 8% coupon at $100, hold it for {D.toFixed(1)} years and then sell it. Just after we buy, rates either fall
    to 4% or rise to 12%, and stay there. Compared with the promise of 8% a year, which of the two leaves us with more money?
  </p>
  <div class="buttons">
    <button type="button" data-g="fall" class:on={picked === "fall"} onclick={() => (picked = "fall")}>Only the fall</button>
    <button type="button" data-g="rise" class:on={picked === "rise"} onclick={() => (picked = "rise")}>Only the rise</button>
    <button type="button" data-g="both" class:on={picked === "both"} onclick={() => (picked = "both")}>Both of them</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "both" ? "That's right, both of them." : "Both of them."}
      A fall to 4% leaves us {signedPct(down, 2)} against the promise, and a rise to 12% leaves us {signedPct(up, 2)}.
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
