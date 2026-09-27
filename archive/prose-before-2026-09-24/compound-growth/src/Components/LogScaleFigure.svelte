<script>
  /*
    The build-up. Two economies from the same start, growing at 2% and 3% a
    year for a century. On a linear axis both curves bend upwards; on a
    logarithmic one both are straight, and the gap between them widens at a
    constant rate. check-browser.mjs asserts the straightness in pixels on the
    log axis, and the doubling markers' spacing.
  */
  import { doublingTime } from "../growth.js";
  import { RICH, FAST, YEARS } from "../datasets.js";
  import { SERIES } from "../palette.js";
  import { linear, log, clampW, pathOf } from "../chart.js";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 260;
  const M = { top: 12, right: 16, bottom: 38, left: 44 };
  let logAxis = $state(true);
  let year = $state(YEARS);

  const level = (g, t) => Math.pow(1 + g, t);
  let x = $derived(linear(0, YEARS, M.left, W - M.right));
  let y = $derived(logAxis ? log(1, 25, H - M.bottom, M.top) : linear(0, 20, H - M.bottom, M.top));
  let yTicks = $derived(logAxis ? [1, 2, 4, 8, 16] : [0, 5, 10, 15, 20]);
  const ts = Array.from({ length: YEARS + 1 }, (_, t) => t);
  let lines = $derived(
    [RICH, FAST].map((g, i) => ({ g, colour: SERIES[i], d: pathOf(ts.map((t) => [x(t), y(level(g, t))])) }))
  );
  const Td = doublingTime(RICH);
  const doublings = [1, 2].map((k) => k * Td);

  let ratio = $derived(level(FAST, year) / level(RICH, year));
  const two = (v) => v.toFixed(2);
  let readout = $derived(
    `Year ${year}: the 2% economy is ${two(level(RICH, year))} times as rich as at the start, the 3% economy ${two(level(FAST, year))} times, and the gap between them is ${two(ratio)}×.`
  );
</script>

<div class="fig" id="log-scale">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>
    <div class="controls">
      <button class="pill" class:active={!logAxis} onclick={() => (logAxis = false)}>ordinary axis</button>
      <button class="pill" class:active={logAxis} onclick={() => (logAxis = true)}>logarithmic axis</button>
    </div>
    <p class="fig-title">{readout}</p>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each yTicks as t}
          <line class="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
          <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{t}×</text>
        {/each}
        {#each [0, 25, 50, 75, 100] as t}
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">years</text>
      </g>
      {#each lines as l, i}
        <path class={`growth g${i}`} d={l.d} stroke={l.colour} />
      {/each}
      {#each doublings as t}
        <circle class="doubling" cx={x(t)} cy={y(level(RICH, t))} r="4" fill="#fff" stroke={SERIES[0]} stroke-width="2" />
      {/each}
      <line class="cursor" x1={x(year)} x2={x(year)} y1={M.top} y2={H - M.bottom} />
      {#each [RICH, FAST] as g, i}
        <circle class={`yr g${i}`} cx={x(year)} cy={y(level(g, year))} r="4.5" fill={SERIES[i]} />
      {/each}
    </svg>
    <label class="slider">
      <span class="s-name">year <b>{year}</b></span>
      <input type="range" min="0" max={YEARS} step="1" value={year} oninput={(e) => (year = +e.currentTarget.value)} />
    </label>
    <p class="legend">
      <span class="key"><span class="swatch" style={`background:${SERIES[0]}`}></span>2% a year</span>
      <span class="key"><span class="swatch" style={`background:${SERIES[1]}`}></span>3% a year</span>
      <span class="key"><span class="ring"></span>each doubling at 2%, every {Td.toFixed(1)} years</span>
    </p>
  </div>
</div>

<style>
  .fig {
    max-width: 640px;
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
    gap: 0.4rem;
    margin-bottom: 0.4rem;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.8rem;
    padding: 4px 11px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill.active {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 0.4rem 0;
    min-height: 3em;
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
    fill: #61707d;
  }

  .grid {
    stroke: #eef1f3;
  }

  .growth {
    fill: none;
    stroke-width: 2.5;
  }

  .cursor {
    stroke: #c9d1d8;
    stroke-dasharray: 3 3;
  }

  .yr {
    stroke: #fff;
    stroke-width: 1.5;
  }

  .slider {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 0.4rem;
  }

  .s-name {
    font-family: var(--font-main);
    font-size: 0.85rem;
  }

  .s-name b {
    font-family: var(--font-mono);
    float: right;
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--violet);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1rem;
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #61707d;
    margin: 0.3rem 0 0 0;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .swatch {
    display: inline-block;
    width: 14px;
    height: 4px;
  }

  .ring {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 2px solid #2074d5;
  }
</style>
