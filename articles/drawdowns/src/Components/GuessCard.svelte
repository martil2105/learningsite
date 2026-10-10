<script>
  /* The backtest-against-live question before anything else. */
  import P from "../precomputed.js";
  import { pct } from "../format.js";
  let picked = $state("");
  const half = P.BEAT[0.5][10][P.LIVE.indexOf(10)];
</script>

<div class="guess" id="guess">
  <p class="q">
    Our strategy has a Sharpe ratio of 0.5 and a ten-year backtest. Nothing about it changes when it goes live. What's the chance that its
    first ten live years bring a deeper drawdown than the worst one in the backtest?
  </p>
  <div class="buttons">
    <button type="button" data-g="5" class:on={picked === "5"} onclick={() => (picked = "5")}>About 5%</button>
    <button type="button" data-g="20" class:on={picked === "20"} onclick={() => (picked = "20")}>About 20%</button>
    <button type="button" data-g="50" class:on={picked === "50"} onclick={() => (picked = "50")}>About 50%</button>
  </div>
  {#if picked}
    <p class="a" id="guess-answer">
      {picked === "50" ? "That's right, it's a coin toss." : "It's a coin toss."}
      The chance is {pct(half, 0)}. Before either decade happens, each is as likely as the other to hold the deeper fall.
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
