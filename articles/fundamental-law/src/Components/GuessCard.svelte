<script>
  /* A guess before anything else. The answer is Grinold's; the page then asks what it leaves out. */
  import { irAnnual, MANAGERS } from "../law.js";
  import { fixed } from "../format.js";
  let picked = $state("");
  const { A, B } = MANAGERS;
  const a = irAnnual(A.ic, A.n), b = irAnnual(B.ic, B.n);
</script>

<div class="guess" id="guess">
  <p class="q">
    Manager A ranks 50 stocks every month, and her forecasts have a correlation of {fixed(A.ic, 2)} with the returns that follow. Manager B
    ranks 1,000 stocks, with a correlation of only {fixed(B.ic, 2)}. Each runs a portfolio built on her own forecasts. Which one has the
    better return for the risk she takes?
  </p>
  <div class="buttons">
    <button type="button" data-g="A" class:on={picked === "A"} onclick={() => (picked = "A")}>Manager A</button>
    <button type="button" data-g="B" class:on={picked === "B"} onclick={() => (picked = "B")}>Manager B</button>
    <button type="button" data-g="same" class:on={picked === "same"} onclick={() => (picked = "same")}>About the same</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "B" ? "That's the textbook answer, B." : "The textbook answer is B."}
      Her information ratio comes out at {fixed(b, 1)} a year against A's {fixed(a, 1)}, because she makes twenty times as many bets. Hold
      on to your guess, though, because by the end of the page the answer will depend on one more number.
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
