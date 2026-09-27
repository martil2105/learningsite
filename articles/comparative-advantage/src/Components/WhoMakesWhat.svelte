<script>
  /*
    The opening question, and the first half of the procedure the reader was
    taught. It asks about GRAIN on purpose: the Valley is better at grain too,
    so the tempting answer is the absolute-advantage one, and the verdict can
    teach opportunity cost by correcting it rather than by announcing it.
  */
  import { VALLEY, COAST } from "../datasets.js";
  import { oppCost } from "../trade.js";
  import { SERIES } from "../palette.js";

  let pick = $state(null);
  let showCosts = $state(false);

  const toolCost = { valley: oppCost(VALLEY), coast: oppCost(COAST) }; // sacks per tool
  const sackCost = { valley: 1 / oppCost(VALLEY), coast: 1 / oppCost(COAST) }; // tools per sack

  // Two-ninths is the only one that isn't a short decimal; say it as a fraction.
  const sackWords = (v) => (Math.abs(v - 2 / 9) < 1e-12 ? "two-ninths of a tool" : v === 0.5 ? "half a tool" : `${v} tools`);

  let verdict = $derived.by(() => {
    if (pick === "valley") {
      return `Not quite. The Valley grows grain faster, but every sack it grows costs it ${sackWords(sackCost.valley)}, while a sack costs the Coast only ${sackWords(sackCost.coast)}. The Coast gives up less for each sack, so the Coast should grow the grain and the Valley should make the tools.`;
    }
    if (pick === "coast") {
      return `Right. A sack of grain costs the Valley ${sackWords(sackCost.valley)} and the Coast only ${sackWords(sackCost.coast)}, so the Coast gives up less for every sack it grows, even though it grows fewer of them. That leaves the tools to the Valley.`;
    }
    return "Pick one. There's no trick in the numbers.";
  });

  function choose(who) {
    pick = who;
    showCosts = true;
  }

  const fmt = (v) => (Math.abs(v - 2 / 9) < 1e-12 ? "0.22" : String(v));
</script>

<div class="fig" id="who-makes-what">
  <p class="fig-title">What one worker makes in a day, working on one good</p>

  <table class="output">
    <thead>
      <tr><th></th><th>tools</th><th>sacks of grain</th></tr>
    </thead>
    <tbody>
      <tr class="valley"><th><span class="dot" style:background={SERIES[0]}></span>the Valley</th><td>{VALLEY.tools}</td><td>{VALLEY.grain}</td></tr>
      <tr class="coast"><th><span class="dot" style:background={SERIES[1]}></span>the Coast</th><td>{COAST.tools}</td><td>{COAST.grain}</td></tr>
    </tbody>
  </table>

  <p class="question">The Valley is better at both. So who should grow the grain?</p>
  <div class="choices">
    <button class="choice" class:chosen={pick === "valley"} onclick={() => choose("valley")}>The Valley</button>
    <button class="choice" class:chosen={pick === "coast"} onclick={() => choose("coast")}>The Coast</button>
  </div>

  <p class="verdict" class:right={pick === "coast"}>{verdict}</p>

  {#if showCosts}
    <table class="costs">
      <thead>
        <tr><th></th><th>a tool costs</th><th>a sack costs</th></tr>
      </thead>
      <tbody>
        <tr class="valley"><th>the Valley</th><td>{fmt(toolCost.valley)} sacks</td><td>{fmt(sackCost.valley)} tools</td></tr>
        <tr class="coast"><th>the Coast</th><td>{fmt(toolCost.coast)} sacks</td><td>{fmt(sackCost.coast)} tools</td></tr>
      </tbody>
    </table>
  {/if}

  <div class="controls">
    <button class="pill" class:active={showCosts} onclick={() => (showCosts = !showCosts)}>
      {showCosts ? "Hide the opportunity costs" : "Show the opportunity costs"}
    </button>
  </div>
</div>

<style>
  .fig {
    max-width: 680px;
    margin: 1.8rem auto;
    padding: 0 1rem;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    margin: 0 0 0.8rem 0;
    color: var(--squid-ink);
    text-align: center;
  }

  table {
    margin: 0 auto;
    border-collapse: collapse;
    font-family: var(--font-main);
    font-size: 0.95rem;
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
  }

  th,
  td {
    padding: 0.45rem 0.9rem;
    text-align: right;
  }

  thead th {
    font-weight: 500;
    font-size: 0.8rem;
    color: #61707d;
    border-bottom: 1px solid #e3e7ea;
  }

  tbody th {
    text-align: left;
    font-weight: 600;
    color: var(--squid-ink);
  }

  td {
    font-family: var(--font-mono);
    color: var(--squid-ink);
  }

  .dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 0.45rem;
  }

  .costs {
    margin-top: 0.9rem;
  }

  .question {
    font-family: var(--font-main);
    font-size: 1rem;
    font-weight: 600;
    color: var(--squid-ink);
    text-align: center;
    margin: 1.2rem 0 0.6rem 0;
  }

  .choices {
    display: flex;
    gap: 0.6rem;
    justify-content: center;
  }

  .choice {
    font-family: var(--font-main);
    font-size: 0.95rem;
    padding: 8px 18px;
    border-radius: 6px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .choice:hover {
    border-color: var(--violet);
  }

  .choice.chosen {
    border-color: var(--violet);
    box-shadow: inset 0 0 0 1px var(--violet);
  }

  .verdict {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.55;
    color: #3c4b57;
    max-width: 520px;
    min-height: 3.2em;
    margin: 0.9rem auto 0 auto;
    text-align: center;
  }

  .verdict.right {
    color: var(--squid-ink);
  }

  .controls {
    display: flex;
    justify-content: center;
    margin-top: 0.8rem;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.85rem;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill:hover {
    border-color: var(--violet);
  }

  .pill.active {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }
</style>
