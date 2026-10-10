<script>
  /* A guess before the race: how often is the Kelly investor ahead of a half-Kelly one after 30 years? */
  import { raceStocks, KELLY } from "../kelly.js";
  import { pct, bigPct } from "../format.js";
  let picked = $state("");
  const p30 = raceStocks(0.5, 30);
</script>

<div class="guess" id="guess">
  <p class="q">
    Two investors put their savings into the same stock market. One holds the Kelly share, {bigPct(KELLY)} of her money, and the other holds
    half of that. After 30 years, how often is the Kelly investor ahead?
  </p>
  <div class="buttons">
    <button type="button" data-g="99" class:on={picked === "99"} onclick={() => (picked = "99")}>About 99% of the time</button>
    <button type="button" data-g="90" class:on={picked === "90"} onclick={() => (picked = "90")}>About 90%</button>
    <button type="button" data-g="65" class:on={picked === "65"} onclick={() => (picked = "65")}>About two thirds</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "65" ? "That's right, about two thirds." : "It's only about two thirds."}
      The Kelly investor is ahead {pct(p30, 0)} of the time after 30 years, so in about one future in three the investor who bet half as
      much has more money. Let's see why it takes so long.
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
