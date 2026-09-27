<script>
  /*
    The hook. Scrub the horizon T and the opening offer — computed by literal
    backward induction in src/bargain.js — oscillates above and below the
    infinite-horizon line and converges onto it. The period-length presets
    set the discount factors from the impatience rates; the limit line is
    r_B/(r_A+r_B), drawn from the closed form, not from the ladder.
  */
  import { R_A, R_B, T_MAX, DTS } from "../datasets.js";
  import { backwardInduction, discount, limitShare } from "../bargain.js";
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 260;
  const M = { top: 22, right: 16, bottom: 40, left: 50 };

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let T = $state(6);
  let dt = $state(DTS[1]);

  let x = $derived(linear(1, T_MAX, M.left, W - M.right));
  let y = $derived(linear(0, 1, H - M.bottom, M.top));

  let dA = $derived(discount(R_A, dt));
  let dB = $derived(discount(R_B, dt));
  let limit = $derived(limitShare(R_A, R_B));

  let offers = $derived(
    Array.from({ length: T_MAX }, (_, i) => ({
      t: i + 1,
      share: backwardInduction(i + 1, dA, dB),
    }))
  );

  let here = $derived(backwardInduction(T, dA, dB));
  let gapHere = $derived(Math.abs(here - limit));

  let readout = $derived(
    `With ${T} round${T === 1 ? "" : "s"} on the clock, A's opening offer takes ${(here * 100).toFixed(2)}% — ${(gapHere * 100).toFixed(2)} points from the limit of ${(limit * 100).toFixed(1)}%, which no horizon can move.`
  );

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
</script>

<div class="fig" id="offer-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="controls">
    <div class="presets" role="group" aria-label="Period length between offers">
      {#each DTS as d}
        <button class="pick" class:active={dt === d} onclick={() => (dt = d)}>Δ = {d}</button>
      {/each}
    </div>
  </div>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="The opening offer against the horizon, oscillating onto the infinite-horizon limit">
      <g class="axis">
        {#each [1, 10, 20, 30, 40] as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each yTicks as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{(t * 100).toFixed(0)}%</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">rounds on the clock, T</text>
      </g>

      <line class="limit" x1={M.left} y1={y(limit)} x2={W - M.right} y2={y(limit)} />
      <text class="limit-lab" x={W - M.right - 4} y={y(limit) - 6} text-anchor="end">
        r_B/(r_A+r_B) = {(limit * 100).toFixed(0)}%
      </text>

      {#each offers as o}
        <circle class="pt" class:here={o.t === T} cx={x(o.t)}
          cy={y(o.share)} r={o.t === T ? 6.5 : 3.4}
          fill={o.t === T ? SERIES[1] : SERIES[0]} />
      {/each}
      <circle class="pt" cx={x(T)} cy={y(here)} r="7" fill="none" stroke={SERIES[1]} stroke-width="1.5" />
    </svg>

    <label class="slider">
      <span class="slider-name">horizon T</span>
      <input type="range" min="1" max={T_MAX} step="1" value={T}
        oninput={(e) => (T = +e.currentTarget.value)}
        aria-label="Rounds on the clock" />
    </label>
  </div>
</div>

<style>
  .fig { max-width: 680px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .controls { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 0 0 0.8rem 0; }
  .presets { display: flex; flex-wrap: wrap; gap: 6px; }
  .pick { font-family: var(--font-mono); font-size: 0.78rem; padding: 5px 10px; border: 1px solid #c7cdd4; border-radius: 4px; background: white; color: var(--squidink); cursor: pointer; }
  .pick.active { border-color: var(--primary); color: var(--primary); font-weight: 600; }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .limit { stroke: var(--primary); stroke-width: 1.5; stroke-dasharray: 5 4; }
  .limit-lab { font-family: var(--font-mono); font-size: 10.5px; fill: var(--primary); }
  .pt { stroke: white; stroke-width: 1; opacity: 0.9; }
  .pt.here { stroke-width: 0; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .slider { display: flex; align-items: center; gap: 10px; margin: 0.4rem 0 0 0; }
  .slider-name { font-family: var(--font-mono); font-size: 0.75rem; color: #5a6672; white-space: nowrap; }
  .slider input { flex: 1; accent-color: var(--primary); }
</style>