<script>
  /*
    The second half of the procedure the reader was taught: a price in sacks per
    tool, and whether each economy would take the deal. They drag it, and the
    textbook result holds exactly: both gain strictly inside (2, 4.5), and at
    each end one side's trading line lies on its own frontier.

    Nothing here is wrong. That's the point: the reader should leave this
    figure convinced, because the next one is where the procedure breaks.
  */
  import { VALLEY, COAST, SHARE_TOOLS, PRICE_MIN, PRICE_MAX, PRICE_STEP } from "../datasets.js";
  import { deal, oppCost, autarkyBasket } from "../trade.js";
  import { SERIES } from "../palette.js";
  import { linear, clampW } from "../chart.js";
  import Frontier from "./Frontier.svelte";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let twoUp = $derived(W >= 560);
  let panelW = $derived(twoUp ? Math.floor((W - 24 - 2) / 2) : W);

  let raw = $state(3);
  // Snap to the slider's 0.05 grid so the two ends are exactly 2 and 4.5.
  // Multiply by 20 rather than divide by 0.05: 1 / 0.05 is not exactly 20 in
  // floating point, and 40 / 20 is exactly 2.
  let p = $derived(Math.round(raw * 20) / 20);
  let d = $derived(deal(VALLEY, COAST, p, SHARE_TOOLS));

  const autV = autarkyBasket(VALLEY, SHARE_TOOLS);
  const autC = autarkyBasket(COAST, SHARE_TOOLS);
  const pv = oppCost(VALLEY);
  const pc = oppCost(COAST);

  // A worker's basket after trading at p: the Valley sells tools, so its income
  // is VALLEY.tools · p sacks; the Coast sells grain, so its income is COAST.grain.
  let basketV = $derived(d.accepted ? { tools: (SHARE_TOOLS * VALLEY.tools * p) / p, grain: (1 - SHARE_TOOLS) * VALLEY.tools * p } : null);
  let basketC = $derived(d.accepted ? { tools: (SHARE_TOOLS * COAST.grain) / p, grain: (1 - SHARE_TOOLS) * COAST.grain } : null);

  const fmtP = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, ""));
  const pct = (g) => `${((g - 1) * 100).toFixed(1)}%`;

  let verdict = $derived.by(() => {
    if (p < pv) {
      return `At ${fmtP(p)} sacks per tool, the Valley would be selling a tool for less than the 2 sacks it could grow instead, so there's no deal.`;
    }
    if (p > pc) {
      return `At ${fmtP(p)} sacks per tool, the Coast would rather make its own tools for 4.5 sacks each, so there's no deal.`;
    }
    if (p === pv) {
      return `At exactly 2 sacks per tool, the Valley's trading line lies on its own frontier, so it gains nothing, while the Coast gains ${pct(d.gainB)}.`;
    }
    if (p === pc) {
      return `At exactly 4.5 sacks per tool it's the other way round: the Coast gains nothing, and the Valley gains ${pct(d.gainA)}.`;
    }
    return `At ${fmtP(p)} sacks per tool both economies gain: a Valley worker's basket is ${pct(d.gainA)} bigger and a Coast worker's is ${pct(d.gainB)} bigger.`;
  });

  let readV = $derived(d.okA && d.accepted ? `+${pct(d.gainA)}` : "no deal");
  let readC = $derived(d.okB && d.accepted ? `+${pct(d.gainB)}` : "no deal");

  // The strip under the panels: the price axis with the deal range shaded.
  const SH = 38;
  const SM = { left: 16, right: 16 };
  let sx = $derived(linear(PRICE_MIN, PRICE_MAX, SM.left, W - SM.right));
  // 4 and 5 are left unlabelled: on a phone "4" and "4.5" collide.
  const STRIP_TICKS = [1, 2, 3, 4, 5, 6];
  const STRIP_LABELS = [1, 2, 3, 4.5, 6];
</script>

<div class="fig" id="price-test">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">One worker's day in each economy, and what trading at your price adds</p>

  <!-- The controls come first and stick to the top of the screen on a phone,
       where the two panels stack and would otherwise scroll the slider away
       from the thing it moves. -->
  <div class="controls-bar">
    <label class="slider">
      <span class="s-name">price of a tool <b>{fmtP(p)} sacks</b></span>
      <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} bind:value={raw} />
    </label>

    <svg class="strip" width={W} height={SH} viewBox={`0 0 ${W} ${SH}`} role="img"
      aria-label="The price axis, with the range in which both economies accept the deal shaded">
      <rect class="deal-range" x={sx(pv)} y="4" width={sx(pc) - sx(pv)} height="14" />
      <line class="strip-rule" x1={sx(PRICE_MIN)} y1="18" x2={sx(PRICE_MAX)} y2="18" />
      {#each STRIP_TICKS as t}
        <line class="strip-tick" x1={sx(t)} y1="18" x2={sx(t)} y2="22" />
      {/each}
      {#each STRIP_LABELS as t}
        <text class="strip-label" x={sx(t)} y="33" text-anchor="middle">{t}</text>
      {/each}
      <line class="price-mark" x1={sx(p)} y1="1" x2={sx(p)} y2="22" />
    </svg>

    <div class="presets">
      <span class="ctl-label">jump to</span>
      {#each [2, 3, 4.5] as v}
        <button class="pill" class:active={p === v} onclick={() => (raw = v)}>p = {v}</button>
      {/each}
      <span class="s-hint">shaded: between the two costs</span>
    </div>
  </div>

  <div class="pair" class:two-up={twoUp}>
    <div class="cell">
      <Frontier title="The Valley" tag="valley" country={VALLEY} colour={SERIES[0]} corner="tools"
        p={d.accepted ? p : null} basket={basketV} autarky={autV} W={panelW} />
      <p class="readout valley">Valley worker <b>{readV}</b></p>
    </div>
    <div class="cell">
      <Frontier title="The Coast" tag="coast" country={COAST} colour={SERIES[1]} corner="grain"
        p={d.accepted ? p : null} basket={basketC} autarky={autC} W={panelW} />
      <p class="readout coast">Coast worker <b>{readC}</b></p>
    </div>
  </div>

  <p class="verdict">{verdict}</p>

  <p class="legend">
    <span class="key"><span class="swatch line"></span>what a worker can make</span>
    <span class="key"><span class="swatch dash"></span>what trading at this price can reach</span>
    <span class="key"><span class="swatch hollow"></span>basket without trade</span>
    <span class="key"><span class="swatch dot"></span>basket with trade</span>
  </p>
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

  .controls-bar {
    background: var(--bg, #f1f3f3);
    padding: 0.2rem 0 0.5rem 0;
    margin-bottom: 0.8rem;
  }

  @media screen and (max-width: 700px) {
    .controls-bar {
      position: sticky;
      top: 0;
      z-index: 5;
      border-bottom: 1px solid #e3e7ea;
    }
  }

  .strip {
    display: block;
    max-width: 100%;
    height: auto;
    margin-top: 0.3rem;
  }

  .deal-range {
    fill: #e8e3fb;
  }

  .strip-rule,
  .strip-tick {
    stroke: #8a94a2;
    stroke-width: 1;
  }

  .strip-label {
    font-family: var(--font-mono);
    font-size: 10.5px;
    fill: #8a94a2;
  }

  .price-mark {
    stroke: #232f3e;
    stroke-width: 2.5;
  }

  .slider {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 0.2rem;
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
    margin-top: 0.3rem;
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

  .verdict {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--squid-ink);
    min-height: 3.2em;
    margin: 0.8rem 0 0.4rem 0;
    text-align: center;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    justify-content: center;
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #61707d;
    margin: 0.4rem 0 0 0;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .swatch {
    display: inline-block;
    width: 18px;
    height: 10px;
  }

  .swatch.line {
    border-bottom: 2.5px solid #61707d;
    height: 6px;
  }

  .swatch.dash {
    border-bottom: 1.5px dashed #232f3e;
    height: 6px;
  }

  .swatch.hollow {
    width: 10px;
    border-radius: 50%;
    border: 2px solid #61707d;
    background: #fff;
  }

  .swatch.dot {
    width: 10px;
    border-radius: 50%;
    background: #61707d;
  }
</style>
