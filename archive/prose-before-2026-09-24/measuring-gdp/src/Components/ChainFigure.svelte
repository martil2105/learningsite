<script>
  /*
    Why adding up sales overcounts. A chain of k firms each adds the same
    value on the way to €100 of bread, so firm j sells for j/k of €100, and
    every euro of value added is counted once for every sale it passes
    through. Total sales = GDP × (k + 1) / 2, which the readout states and
    check-browser.mjs compares against the bars it can measure.
  */
  import { chain } from "../accounts.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { linear, ticks, clampW } from "../chart.js";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 230;
  const M = { top: 16, right: 10, bottom: 34, left: 40 };
  const K_MAX = 8;

  let k = $state(3);
  let c = $derived(chain(k));
  let x0 = $derived(M.left);
  let band = $derived((W - M.left - M.right) / K_MAX);
  let y = $derived(linear(0, 100, H - M.bottom, M.top));
  let yTicks = $derived(ticks(0, 100, 4));

  const euro = (v) => `€${Number.isInteger(Math.round(v * 100) / 100) ? Math.round(v) : v.toFixed(1)}`;
  let ratio = $derived((k + 1) / 2);
  let readout = $derived(
    `${k} ${k === 1 ? "firm" : "firms"}: all sales add up to ${euro(c.total)}, which is ${ratio} times the €100 of bread that households actually buy.`
  );
</script>

<div class="fig" id="chain-figure">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>
    <div class="controls">
      <span class="ctl-label">firms in the chain</span>
      <button class="step" aria-label="fewer firms" disabled={k <= 1} onclick={() => (k = Math.max(1, k - 1))}>−</button>
      <b class="k">{k}</b>
      <button class="step" aria-label="more firms" disabled={k >= K_MAX} onclick={() => (k = Math.min(K_MAX, k + 1))}>+</button>
    </div>
    <p class="fig-title">{readout}</p>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each yTicks as t}
          <line class="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
          <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">each firm's sales, in order along the chain</text>
      </g>
      {#each c.sales as s, j}
        <rect
          class="sale"
          data-value={s}
          x={x0 + band * j + band * 0.12}
          y={y(s)}
          width={band * 0.76}
          height={y(0) - y(s)}
          fill={BACKGROUND_CLASS}
          opacity="0.45"
        />
        <rect
          class="added"
          x={x0 + band * j + band * 0.12}
          y={y(s)}
          width={band * 0.76}
          height={y(0) - y(c.perStage)}
          fill={SERIES[0]}
          opacity="0.9"
        />
      {/each}
      <line class="gdp-line" x1={M.left} x2={W - M.right} y1={y(100)} y2={y(100)} />
    </svg>
    <p class="legend">
      <span class="key"><span class="swatch added-sw"></span>value added by that firm</span>
      <span class="key"><span class="swatch carried"></span>value it bought from the firm before it</span>
    </p>
  </div>
</div>

<style>
  .fig {
    max-width: 680px;
    margin: 1.8rem auto;
    padding: 0 1rem;
  }

  .card {
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 0.9rem 16px;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }

  .ctl-label {
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #8a94a2;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .step {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid #c9d1d8;
    background: #fff;
    font-size: 1.05rem;
    cursor: pointer;
    color: var(--squid-ink);
  }

  .step:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .k {
    font-family: var(--font-mono);
    font-size: 1rem;
    min-width: 1.2rem;
    text-align: center;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    line-height: 1.5;
    margin: 0 0 0.4rem 0;
    min-height: 2.8em;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }

  .axis .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
  }

  .grid {
    stroke: #eef1f3;
  }

  .gdp-line {
    stroke: var(--squid-ink);
    stroke-width: 1.2;
    stroke-dasharray: 5 4;
  }

  .legend {
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #61707d;
    margin: 0.4rem 0 0 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 0.5rem;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-right: 0.8rem;
  }

  .swatch {
    display: inline-block;
    flex: 0 0 12px;
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .added-sw {
    background: #2074d5;
  }

  .carried {
    background: #8a94a2;
    opacity: 0.45;
  }
</style>
