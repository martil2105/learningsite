<script>
  /* A guess before the lab. The answer is one sentence with no figures in
     it; the lab carries the numbers. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    A 25-year-old with a steady job, a little saved and a fairly cautious outlook (a risk aversion of 5) can't borrow to buy stocks. Merton's rule
    for her savings alone gives about a third in stocks. What share of her savings should she hold?
  </p>
  <div class="buttons">
    <button type="button" data-g="third" class:on={picked === "third"} onclick={() => (picked = "third")}>About a third</button>
    <button type="button" data-g="twothirds" class:on={picked === "twothirds"} onclick={() => (picked = "twothirds")}>About two thirds</button>
    <button type="button" data-g="all" class:on={picked === "all"} onclick={() => (picked = "all")}>All of it</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "all" ? "Right: as much as the limit lets her hold." : "In the model we're about to solve, it's as much as the limit lets her hold."}
      The lab below shows how long that lasts, and what the limit costs.
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
