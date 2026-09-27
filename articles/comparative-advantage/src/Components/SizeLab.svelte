<script>
  /*
    The hook. One control: how many workers the Coast has for each Valley
    worker. The market sets the price from that, and the two frontier panels
    show what it does to each economy.

    The claim check-browser.mjs defends in rendered pixels: at equal size the
    Valley's trading line lies ON its own frontier and its basket sits on it,
    while the Coast's lies outside; at 8× it is the other way round. The
    product readout must say 1.500 wherever the slider is.
  */
  import { VALLEY, COAST, SHARE_TOOLS, VALLEY_WORKERS, SIZE_MIN, SIZE_MAX } from "../datasets.js";
  import { market, capacityTest, autarkyBasket } from "../trade.js";
  import { SERIES } from "../palette.js";
  import { clampW } from "../chart.js";
  import Frontier from "./Frontier.svelte";

  const PRESETS = [1, 2, 3, 4.5, 8];

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth - 2));
  let inner = $derived(W - 32); // the lab card's horizontal padding
  let twoUp = $derived(inner >= 560);
  let panelW = $derived(twoUp ? Math.floor((inner - 24 - 2) / 2) : inner);

  let k = $state(1);
  let m = $derived(market(VALLEY, COAST, k, SHARE_TOOLS));
  let cap = $derived(capacityTest(VALLEY, COAST, k, SHARE_TOOLS));

  const autV = autarkyBasket(VALLEY, SHARE_TOOLS);
  const autC = autarkyBasket(COAST, SHARE_TOOLS);

  const two = (v) => v.toFixed(2);
  const pct = (g) => `+${((g - 1) * 100).toFixed(1)}%`;
  const workers = (v) => Math.round(v * VALLEY_WORKERS).toLocaleString("en-GB");

  let sizeLine = $derived(`${workers(k)} Coast workers for every ${workers(1)} in the Valley`);

  let toolsLine = $derived(
    `Tools: the Valley could make ${workers(cap.aTools)} a day and the Coast ${workers(cap.bTools)}. ` +
    (cap.bGains
      ? "The Valley is the bigger tool maker, so the Coast gains."
      : "The Coast is the bigger tool maker, so the Coast gains nothing.")
  );
  let grainLine = $derived(
    `Grain: the Coast could grow ${workers(cap.bGrain)} sacks a day and the Valley ${workers(cap.aGrain)}. ` +
    (cap.aGains
      ? "The Coast is the bigger grain grower, so the Valley gains."
      : "The Valley is the bigger grain grower, so the Valley gains nothing.")
  );

  let verdict = $derived.by(() => {
    if (m.regime === "a makes both") {
      return `The Coast can't grow enough grain for the Valley to stop farming, so ${Math.round(m.aFarm * 100)}% of Valley workers stay on the land and a tool sells for the Valley's own cost of 2 sacks.`;
    }
    if (m.regime === "b makes both") {
      return `The Valley can't make enough tools for the Coast to stop making them, so ${Math.round((m.bToolsPerA / k) * 100)}% of Coast workers stay in the workshops and a tool sells for the Coast's own cost of 4.5 sacks.`;
    }
    return `Each economy is the bigger producer of what it sells, so both specialise completely, and a tool sells for ${two(m.p)} sacks, strictly between the two costs.`;
  });

  function onSlide(e) {
    k = Math.pow(2, +e.currentTarget.value);
  }
</script>

<div class="fig" id="size-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <div class="lab">
    <!-- Controls first, and sticky on a phone: the panels stack there, and a
         slider below them would scroll away from what it moves. -->
    <div class="controls-bar">
      <p class="lab-title">{sizeLine}</p>
      <label class="slider">
        <span class="s-name">Coast workers per Valley worker <b>{two(k)}×</b></span>
        <input type="range" min={Math.log2(SIZE_MIN)} max={Math.log2(SIZE_MAX)} step="0.01"
          value={Math.log2(k)} oninput={onSlide} />
      </label>
      <div class="presets">
        <span class="ctl-label">jump to</span>
        {#each PRESETS as v}
          <button class="pill" class:active={k === v} onclick={() => (k = v)}>{v}×</button>
        {/each}
        <span class="s-hint">log scale, ¼× to 16×</span>
      </div>
    </div>

    <div class="pair" class:two-up={twoUp}>
      <div class="cell">
        <Frontier title="The Valley" tag="valley" country={VALLEY} colour={SERIES[0]} corner="tools"
          p={m.p} basket={m.basketA} autarky={autV} W={panelW} />
        <p class="readout">Valley worker <b class="gain valley">{pct(m.gainA)}</b></p>
      </div>
      <div class="cell">
        <Frontier title="The Coast" tag="coast" country={COAST} colour={SERIES[1]} corner="grain"
          p={m.p} basket={m.basketB} autarky={autC} W={panelW} />
        <p class="readout">Coast worker <b class="gain coast">{pct(m.gainB)}</b></p>
      </div>
    </div>

    <div class="tests">
      <p class="test tools" class:pass={cap.bGains}><span class="mark">{cap.bGains ? "✓" : "✗"}</span>{toolsLine}</p>
      <p class="test grain" class:pass={cap.aGains}><span class="mark">{cap.aGains ? "✓" : "✗"}</span>{grainLine}</p>
    </div>

    <div class="numbers">
      <div class="num"><span class="n-label">price of a tool</span><b class="n-price">{two(m.p)} sacks</b></div>
      <div class="num"><span class="n-label">a Valley wage buys</span><b class="n-wage">{two(m.wageRatio)} Coast wages</b></div>
      <div class="num"><span class="n-label">gain factors multiplied</span><b class="n-product">{(m.gainA).toFixed(3)} × {(m.gainB).toFixed(3)} = {(m.gainA * m.gainB).toFixed(3)}</b></div>
    </div>

    <p class="verdict">{verdict}</p>
  </div>
</div>

<style>
  .fig {
    max-width: 760px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .lab {
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 1.1rem 16px 1rem 16px;
  }

  .lab-title {
    font-family: var(--font-main);
    font-size: 1rem;
    font-weight: 600;
    color: var(--squid-ink);
    text-align: center;
    margin: 0 0 0.5rem 0;
  }

  .controls-bar {
    background: #fff;
    padding: 0.3rem 0 0.6rem 0;
    margin-bottom: 0.6rem;
    border-bottom: 1px solid #eef1f3;
  }

  @media screen and (max-width: 700px) {
    .controls-bar {
      position: sticky;
      top: 0;
      z-index: 5;
    }
  }

  .pair {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pair.two-up {
    flex-direction: row;
    gap: 24px;
  }

  .cell {
    min-width: 0;
  }

  .readout {
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: #61707d;
    margin: 0.2rem 0 0 0;
  }

  .readout b {
    font-family: var(--font-mono);
    color: var(--squid-ink);
  }

  .tests {
    margin-top: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .test {
    display: flex;
    gap: 0.55rem;
    align-items: baseline;
    font-family: var(--font-main);
    font-size: 0.86rem;
    line-height: 1.5;
    color: #61707d;
    margin: 0;
  }

  .test.pass {
    color: var(--squid-ink);
  }

  .mark {
    flex: 0 0 1.1rem;
    font-weight: 700;
    text-align: center;
  }

  .numbers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.4rem;
    justify-content: center;
    margin-top: 0.9rem;
    padding-top: 0.8rem;
    border-top: 1px solid #eef1f3;
  }

  .num {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .n-label {
    font-family: var(--font-main);
    font-size: 0.74rem;
    color: #8a94a2;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .num b {
    font-family: var(--font-mono);
    font-size: 0.92rem;
    color: var(--squid-ink);
  }

  .verdict {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--squid-ink);
    min-height: 3.2em;
    margin: 0.8rem 0 0 0;
    text-align: center;
  }

  .slider {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .s-name {
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: var(--squid-ink);
  }

  .s-name b {
    font-family: var(--font-mono);
    float: right;
  }

  .s-hint {
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #8a94a2;
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--violet);
  }

  .presets {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 0.4rem;
  }

  .presets .s-hint {
    margin-left: auto;
  }

  .ctl-label {
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #8a94a2;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .pill {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    padding: 4px 10px;
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
