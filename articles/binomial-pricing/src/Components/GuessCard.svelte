<script>
  /* An optimist and a pessimist price the same call. */
  import { onePeriod } from "../binomial.js";
  import { money } from "../format.js";
  let picked = $state("");
  const o = onePeriod();
</script>

<div class="guess" id="guess">
  <p class="q">
    A share at $100 will be worth either $120 or $90 in a year, and money in the bank earns 5%. Ann thinks the rise is 90% likely, and Ben
    thinks it's 10% likely. Both can trade the share and borrow at 5%. What should each of them pay for a call that lets them buy the share
    for $100 in a year?
  </p>
  <div class="buttons">
    <button type="button" data-g="ann" class:on={picked === "ann"} onclick={() => (picked = "ann")}>Ann should pay more</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>The same price</button>
    <button type="button" data-g="dep" class:on={picked === "dep"} onclick={() => (picked = "dep")}>It depends on how they feel about risk</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "same" ? "That's right." : "They should pay the same."}
      Each of them can copy the call with shares and a loan for {money(o.price, 2)}, so neither should pay more, and neither can buy it for
      less.
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
