<script>
  /* The forecast question before the model. */
  import { forwardV } from "../curve.js";
  import { pct } from "../format.js";
  let picked = $state("");
  const f30 = forwardV(30, 0.01, 0);
</script>

<div class="guess" id="guess">
  <p class="q">
    Investors expect the one-year rate to stay at 4% for the next 30 years, and they ask for no premium: every bond is priced so that its
    expected return over the next instant is the same as cash. Rates move by about a point a year and drift back towards 4%. What's the
    forward rate for 30 years from now?
  </p>
  <div class="buttons">
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>4%, the rate they expect</button>
    <button type="button" data-g="above" class:on={picked === "above"} onclick={() => (picked = "above")}>Above 4%</button>
    <button type="button" data-g="below" class:on={picked === "below"} onclick={() => (picked = "below")}>Below 4%</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "below" ? "That's right, below." : "It's below."}
      The forward rate is {pct(f30, 2)}, even though nobody expects rates to move.
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
