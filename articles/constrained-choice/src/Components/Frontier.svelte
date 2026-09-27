<script>
  /* Build-up, figure 1. One point: the wage is the slope of the frontier. */
  import { linear, ticks, clampW, pathOf } from "../chart.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { BASE, W_MIN, W_MAX, W_DEFAULT } from "../datasets.js";

  const H = 280;
  const M = { top: 18, right: 18, bottom: 40, left: 56 };
  const C_MAX = W_MAX * BASE.T;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let w = $state(W_DEFAULT);

  let x = $derived(linear(0, BASE.T, M.left, W - M.right));
  let y = $derived(linear(0, C_MAX, H - M.bottom, M.top));

  let line = $derived(pathOf([[x(BASE.T), y(0)], [x(0), y(w * BASE.T)]]));
  let midF = 8;

  let readout = $derived(
    `At ${w} kr an hour, giving up all 16 hours of free time buys ${(w * BASE.T).toLocaleString("en-GB")} kr of consumption, and each hour of free time costs ${w} kr.`
  );

  let xTicks = $derived(ticks(0, BASE.T, 4));
  let yTicks = $derived(ticks(0, C_MAX, 4));
</script>

<div class="fig" id="frontier">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each yTicks as t}
          <line x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} class="grid" />
          <text x={M.left - 8} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        {#each xTicks as t}
          <text x={x(t)} y={H - M.bottom + 16} text-anchor="middle">{t}</text>
        {/each}
        <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} class="rule" />
        <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} class="rule" />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">
          free time, hours
        </text>
        <text
          class="axis-title"
          transform={`rotate(-90 13 ${(M.top + H - M.bottom) / 2})`}
          x="13"
          y={(M.top + H - M.bottom) / 2}
          text-anchor="middle">consumption, kr</text
        >
      </g>

      <path d={line} class="model" stroke={SERIES[0]} fill="none" />
      <circle cx={x(0)} cy={y(w * BASE.T)} r="5" fill={SERIES[0]} />
      <circle cx={x(BASE.T)} cy={y(0)} r="5" fill={SERIES[0]} />
      <text class="lab" x={x(0) + 8} y={y(w * BASE.T) - 8} text-anchor="start">work all 16</text>
      <text class="lab" x={x(BASE.T) - 6} y={y(0) - 12} text-anchor="end">work none</text>
      <text class="slope" x={x(midF)} y={y(w * (BASE.T - midF)) - 10} text-anchor="middle">
        slope = −{w}
      </text>
    </svg>
  </div>

  <label class="ctl">
    wage, kr per hour
    <input type="range" min={W_MIN} max={W_MAX} step="1" bind:value={w} />
    <span class="val">{w}</span>
  </label>

  <p class="note">
    Everything below the line is affordable, and nothing above it is. The wage
    doesn't appear anywhere else in the problem. It's simply the slope of this
    line, and that slope is all a pay rise changes.
  </p>
</div>

<style>
  .fig { max-width: 680px; margin: 1.8rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.45;
    margin: 0 0 0.5rem 0;
    color: var(--squid-ink);
  }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .model { stroke-width: 2.5; }
  .axis-title { font-family: var(--font-main); }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .lab { font-family: var(--font-main); font-size: 11px; fill: #8a94a2; }
  .slope {
    font-family: var(--font-mono);
    font-size: 12px;
    fill: #2074d5;
    stroke: #fff;
    stroke-width: 3px;
    paint-order: stroke;
  }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .ctl {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: var(--font-main);
    font-size: 0.9rem;
    margin-top: 0.7rem;
    color: var(--squid-ink);
  }
  .ctl input { flex: 1; min-width: 120px; accent-color: #7c5aed; }
  .val { font-family: var(--font-mono); min-width: 2.2rem; text-align: right; }
  .note {
    font-family: var(--font-main);
    font-size: 0.88rem;
    line-height: 1.5;
    color: #5b6670;
    margin: 0.6rem 0 0 0;
  }
</style>
