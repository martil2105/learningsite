<script>
  /*
    The turn. Same two economies, 1,000 workers each, and this time the reader
    does not choose the price: the market does. One button, and the Valley's
    basket after trade comes out identical to its basket before, bar for bar.
  */
  import { VALLEY, COAST, SHARE_TOOLS, VALLEY_WORKERS } from "../datasets.js";
  import { market, autarkyBasket } from "../trade.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { linear, clampW } from "../chart.js";

  const K = 1; // equal workforces
  const m = market(VALLEY, COAST, K, SHARE_TOOLS);
  const before = { valley: autarkyBasket(VALLEY, SHARE_TOOLS), coast: autarkyBasket(COAST, SHARE_TOOLS) };
  const after = { valley: m.basketA, coast: m.basketB };
  const gain = { valley: m.gainA, coast: m.gainB };

  let open = $state(false);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let twoUp = $derived(W >= 560);
  let cardW = $derived(twoUp ? Math.floor((W - 20 - 2) / 2) : W);
  // The svg sits inside the card's 1px border.
  let svgW = $derived(cardW - 2);

  const CH = 104;
  const PAD = 12;
  const LABEL_W = 60;
  const VALUE_W = 40;
  const DOMAIN = { tools: 5, grain: 10 };
  const ROWS = [
    { good: "tools", label: "tools", y: 12 },
    { good: "grain", label: "sacks", y: 58 },
  ];
  let scale = $derived({
    tools: linear(0, DOMAIN.tools, LABEL_W, svgW - VALUE_W),
    grain: linear(0, DOMAIN.grain, LABEL_W, svgW - VALUE_W),
  });

  const CARDS = [
    { key: "valley", title: "A Valley worker", colour: SERIES[0] },
    { key: "coast", title: "A Coast worker", colour: SERIES[1] },
  ];

  const n = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));
  const thousands = (v) => Math.round(v * VALLEY_WORKERS).toLocaleString("en-GB");
  const pct = (g) => `${g >= 1 ? "+" : ""}${((g - 1) * 100).toFixed(1)}%`;

  const worldBefore = m.autarkyProduction;
  const worldAfter = m.production;

  let worldLine = $derived(
    open
      ? `The price settles at ${n(m.p)} sacks per tool. The world now makes ${thousands(worldAfter.tools)} tools and ${thousands(worldAfter.grain)} sacks a day, and ${thousands(m.aFarm)} of the Valley's ${VALLEY_WORKERS.toLocaleString("en-GB")} workers are still growing grain.`
      : `Without trade, the two economies make ${thousands(worldBefore.tools)} tools and ${thousands(worldBefore.grain)} sacks a day between them.`
  );
</script>

<div class="fig" id="market-reveal">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">1,000 workers in each economy, spending half their income on each good</p>

  <div class="cards" class:two-up={twoUp}>
    {#each CARDS as c}
      <div class={`card ${c.key}`}>
        <p class="card-title">
          <span class="dot" style:background={c.colour}></span>{c.title}
          <span class="gain">{open ? pct(gain[c.key]) : ""}</span>
        </p>
        <svg width={svgW} height={CH} viewBox={`0 0 ${svgW} ${CH}`} role="img"
          aria-label={`${c.title}: tools and sacks of grain per day, before and after trade`}>
          {#each ROWS as r}
            <text class="row-label" x={PAD} y={r.y + 15}>{r.label}</text>
            <rect class={`bar before ${r.good}`} x={LABEL_W} y={r.y}
              width={scale[r.good](before[c.key][r.good]) - LABEL_W} height="11" fill={BACKGROUND_CLASS} />
            <text class="value before" x={scale[r.good](before[c.key][r.good]) + 6} y={r.y + 10}>{n(before[c.key][r.good])}</text>
            {#if open}
              <rect class={`bar after ${r.good}`} x={LABEL_W} y={r.y + 15}
                width={scale[r.good](after[c.key][r.good]) - LABEL_W} height="11" fill={c.colour} />
              <text class="value after" x={scale[r.good](after[c.key][r.good]) + 6} y={r.y + 25}>{n(after[c.key][r.good])}</text>
            {/if}
          {/each}
        </svg>
      </div>
    {/each}
  </div>

  <p class="legend">
    <span class="key"><span class="swatch" style:background={BACKGROUND_CLASS}></span>without trade</span>
    <span class="key"><span class="swatch" style:background={SERIES[0]}></span><span class="swatch" style:background={SERIES[1]}></span>with trade</span>
  </p>

  <p class="world">{worldLine}</p>

  <div class="controls">
    <button class="pill" class:active={open} onclick={() => (open = !open)}>
      {open ? "Close the border" : "Open the border"}
    </button>
  </div>
</div>

<style>
  .fig {
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    margin: 0 0 0.8rem 0;
    color: var(--squid-ink);
    text-align: center;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .cards.two-up {
    flex-direction: row;
    gap: 20px;
  }

  .card {
    min-width: 0;
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 0.6rem 0 0.2rem 0;
    overflow: hidden;
  }

  .card svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .card-title {
    display: flex;
    align-items: center;
    font-family: var(--font-main);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--squid-ink);
    margin: 0 0.6rem 0.4rem 0.6rem;
  }

  .gain {
    margin-left: auto;
    font-family: var(--font-mono);
    font-weight: 700;
  }

  .dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 0.45rem;
  }

  .row-label {
    font-family: var(--font-main);
    font-size: 11.5px;
    fill: #61707d;
  }

  .bar {
    rx: 2px;
  }

  .value {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: var(--squid-ink);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    justify-content: center;
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #61707d;
    margin: 0.7rem 0 0 0;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .swatch {
    display: inline-block;
    width: 14px;
    height: 9px;
    border-radius: 2px;
  }

  .world {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--squid-ink);
    text-align: center;
    min-height: 3.1em;
    margin: 0.8rem auto 0 auto;
    max-width: 560px;
  }

  .controls {
    display: flex;
    justify-content: center;
    margin-top: 0.6rem;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.9rem;
    padding: 7px 16px;
    border-radius: 999px;
    border: 1px solid var(--violet);
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill.active {
    background: var(--violet);
    color: #fff;
  }
</style>
