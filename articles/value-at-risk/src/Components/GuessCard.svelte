<script>
  /* The two-bond question before anything else. */
  import { bonds, P, LGD } from "../risk.js";
  import { pct } from "../format.js";
  let picked = $state("");
  const two = bonds(2, 0.95);
</script>

<div class="guess" id="guess">
  <p class="q">
    Two bonds each have a {pct(P, 0)} chance of defaulting within the year, independently, and a default loses {pct(LGD, 0)} of the money
    in the bond. With $100 in either bond alone, the 95% value at risk is zero. What is it with $50 in each?
  </p>
  <div class="buttons">
    <button type="button" data-g="zero" class:on={picked === "zero"} onclick={() => (picked = "zero")}>Still zero</button>
    <button type="button" data-g="lower" class:on={picked === "lower"} onclick={() => (picked = "lower")}>Lower than zero</button>
    <button type="button" data-g="30" class:on={picked === "30"} onclick={() => (picked = "30")}>$30</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "30" ? "That's right, $30." : "It's $30."}
      Spreading the money raises the value at risk from zero to ${two.var.toFixed(0)}, because the chance that at least one of the two
      bonds defaults is {pct(two.anyDefault, 2)}, which is more than 5%.
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
