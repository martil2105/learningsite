<script>
  /* A guess before the lab. The answer has no working; the lab carries it. */
  let picked = $state("");
</script>

<div class="guess" id="guess">
  <p class="q">
    We buy $10,000 of stock with $5,000 of our own money and $5,000 borrowed from our broker. The broker will call us if our own money in
    the account falls below 25% of what the shares are worth. How far can the price fall before the call comes?
  </p>
  <div class="buttons">
    <button type="button" data-g="quarter" class:on={picked === "quarter"} onclick={() => (picked = "quarter")}>A quarter</button>
    <button type="button" data-g="third" class:on={picked === "third"} onclick={() => (picked = "third")}>A third</button>
    <button type="button" data-g="half" class:on={picked === "half"} onclick={() => (picked = "half")}>A half</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "third" ? "Right: a third, to $66.67 a share." : "It's a third, to $66.67 a share."}
      By then two thirds of our own money is gone. The lab below shows how a 25% rule turns into those two numbers.
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
