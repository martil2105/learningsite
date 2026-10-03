<script>
  /* A guess before the frequency figure. The answer is short; the figure carries the working. */
  import { band, FIRST_YEAR, LAST_YEAR } from "../premium.js";
  import { fixed } from "../format.js";
  let picked = $state("");
  const y = band(FIRST_YEAR, LAST_YEAR, "yearly"), m = band(FIRST_YEAR, LAST_YEAR, "monthly");
</script>

<div class="guess" id="guess">
  <p class="q">
    Monthly returns give us twelve times as many observations as yearly ones over the same century. How much narrower does that make the
    band around the average premium?
  </p>
  <div class="buttons">
    <button type="button" data-g="third" class:on={picked === "third"} onclick={() => (picked = "third")}>About a third as wide</button>
    <button type="button" data-g="half" class:on={picked === "half"} onclick={() => (picked = "half")}>About half as wide</button>
    <button type="button" data-g="little" class:on={picked === "little"} onclick={() => (picked = "little")}>Only a little narrower</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "little" ? "Right, only a little narrower." : "Only a little narrower."}
      The standard error goes from {fixed(y.se, 1)} points with yearly returns to {fixed(m.se, 1)} with monthly ones, nowhere near the
      {fixed(y.se / Math.sqrt(12), 1)} that twelve times as many independent years would give. The figure below shows why.
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
