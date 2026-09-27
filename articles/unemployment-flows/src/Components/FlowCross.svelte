<script>
  /*
    The mechanism. Against the unemployment rate u, the monthly inflow
    s(1 − u) falls gently and the outflow f·u rises; where they cross, the
    stock stops moving. A scrubber sets u, and a toggle swaps Eastport's flows
    for Millbrook's, which cross at exactly the same 6% with much smaller
    flows. check-browser.mjs asserts the crossing dot lies on both lines.
  */
  import { steady } from "../flows.js";
  import { TOWN_A, TOWN_B } from "../datasets.js";
  import { SERIES } from "../palette.js";
  import { linear, clampW } from "../chart.js";

  const UMAX = 0.16, YMAX = 60; // people per 1,000 workers per month
  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 250;
  const M = { top: 12, right: 14, bottom: 38, left: 40 };
  let x = $derived(linear(0, UMAX, M.left, W - M.right));
  let y = $derived(linear(0, YMAX, H - M.bottom, M.top));

  let town = $state(TOWN_A);
  let u = $state(0.1);
  let us = $derived(steady(town.s, town.f));

  // Both lines are straight; clip the outflow to the top of the plot.
  let inLine = $derived({ x1: x(0), y1: y(1000 * town.s), x2: x(UMAX), y2: y(1000 * town.s * (1 - UMAX)) });
  let outEnd = $derived(Math.min(UMAX, YMAX / (1000 * town.f)));
  let outLine = $derived({ x1: x(0), y1: y(0), x2: x(outEnd), y2: y(1000 * town.f * outEnd) });

  let inNow = $derived(1000 * town.s * (1 - u));
  let outNow = $derived(1000 * town.f * u);
  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  let readout = $derived(
    Math.abs(inNow - outNow) < 0.05
      ? `At ${pct(u)} in ${town.name}, as many people find jobs each month as lose them (${inNow.toFixed(1)} per 1,000 workers), so the rate stays where it is.`
      : inNow > outNow
        ? `At ${pct(u)} in ${town.name}, ${inNow.toFixed(1)} per 1,000 workers lose their job this month and ${outNow.toFixed(1)} find one, so unemployment rises.`
        : `At ${pct(u)} in ${town.name}, ${inNow.toFixed(1)} per 1,000 workers lose their job this month and ${outNow.toFixed(1)} find one, so unemployment falls.`
  );
</script>

<div class="fig" id="flow-cross">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>
    <div class="controls">
      {#each [TOWN_A, TOWN_B] as t}
        <button class="pill" class:active={town === t} onclick={() => (town = t)}>{t.name}</button>
      {/each}
    </div>
    <p class="fig-title">{readout}</p>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each [0, 20, 40, 60] as t}
          <line class="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
          <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        {#each [0, 0.04, 0.08, 0.12, 0.16] as t}
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{Math.round(t * 100)}%</text>
        {/each}
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">unemployment rate</text>
        <text class="axis-title" x={M.left + 4} y={M.top + 10}>per 1,000 workers a month</text>
      </g>
      <line class="flow in" {...inLine} stroke={SERIES[1]} />
      <line class="flow out" {...outLine} stroke={SERIES[0]} />
      <line class="cursor" x1={x(u)} x2={x(u)} y1={M.top} y2={H - M.bottom} />
      <circle class="mk in" cx={x(u)} cy={y(inNow)} r="4.5" fill={SERIES[1]} />
      {#if outNow <= YMAX}<circle class="mk out" cx={x(u)} cy={y(outNow)} r="4.5" fill={SERIES[0]} />{/if}
      <circle class="cross" cx={x(us)} cy={y(1000 * town.s * (1 - us))} r="6" fill="none" stroke="#232f3e" stroke-width="2" />
    </svg>
    <label class="slider">
      <span class="s-name">unemployment rate this month <b>{pct(u)}</b></span>
      <input type="range" min="0" max="16" step="0.5" value={u * 100} oninput={(e) => (u = +e.currentTarget.value / 100)} />
    </label>
    <p class="legend">
      <span class="key"><span class="swatch" style={`background:${SERIES[1]}`}></span>losing a job</span>
      <span class="key"><span class="swatch" style={`background:${SERIES[0]}`}></span>finding a job</span>
      <span class="key"><span class="ring"></span>where they balance</span>
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

  .flow {
    stroke-width: 2.5;
  }

  .cursor {
    stroke: #c9d1d8;
    stroke-dasharray: 3 3;
  }

  .mk {
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
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid #232f3e;
  }
</style>
