<script>
  /*
    The hook. The effort curve, a wage you can drag, and the ray from the
    origin through the point (w, e). Where the ray is tangent, cost per unit
    of effort bottoms out and the elasticity readout says exactly 1.000 —
    the reader finds the tangency before the article names it.
  */
  import { WR, effort, unitCost, elasticityAt, closedWage } from "../effort.js";
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 280;
  const M = { top: 20, right: 16, bottom: 40, left: 50 };
  const W_MAX = 40;
  const PINK = "#df2a5d";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let a = $state(1);
  let w = $state(14);

  let x = $derived(linear(0, W_MAX, M.left, W - M.right));
  let y = $derived(linear(0, 1, H - M.bottom, M.top));

  let e = $derived(effort(w, WR, a));
  let cost = $derived(unitCost(w, WR, a));
  let elast = $derived(elasticityAt(w, WR, a));

  // The ray from the origin through the point, extended to the plot edge.
  let rayEnd = $derived.by(() => {
    const slope = e / w;
    return Math.min(W_MAX, (1 / slope));
  });
  let rayEndY = $derived(Math.min(1, (e / w) * rayEnd));

  // $derived, not const: a const read a once, so the curve stayed at a = 1
  // while the curvature slider moved the dot off it.
  let curvePts = $derived(Array.from({ length: 241 }, (_, i) => {
    const ww = WR * (1 + ((W_MAX / WR - 1) * i) / 240);
    return [ww, effort(ww, WR, a)];
  }));
  let curvePath = $derived(curvePts.map(([ww, ee], i) => `${i ? "L" : "M"} ${x(ww).toFixed(2)} ${y(ee).toFixed(2)}`).join(" "));

  let wBest = $derived(closedWage(WR, a));
  let hint = $derived(
    Math.abs(w - wBest) < 0.06
      ? "The line just touches the curve, so this is the cheapest point."
      : w < wBest
        ? "The line cuts the curve, so a higher wage would buy effort more cheaply."
        : "The line cuts the curve, so a lower wage would buy effort more cheaply."
  );
  let readout = $derived(
    `A wage of ${w.toFixed(1)} buys effort ${e.toFixed(3)}, so each unit of effort costs ${cost.toFixed(2)}, and the elasticity of effort is ${elast.toFixed(3)}. ${hint}`
  );

  const wTicks = [0, 10, 20, 30, 40];
</script>

<div class="fig" id="effort-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">Effort against the wage, and the cost of each unit</p>
  <p class="readout">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Effort against the wage, with the ray from the origin through the chosen point; at the tangency the elasticity of effort is exactly one">
      <g class="axis">
        {#each wTicks as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each [0, 0.25, 0.5, 0.75, 1] as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t.toFixed(2)}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">wage</text>
        <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">effort</text>
      </g>

      <path class="curve" d={curvePath} />
      <line class="ray" x1={x(0)} y1={y(0)} x2={x(rayEnd)} y2={y(rayEndY)} />
      <circle class="dot" cx={x(w)} cy={y(e)} r="6.5" fill={SERIES[0]} />
      <text class="clab curve-lab" x={x(12.5)} y={y(0.1)}>effort e(w)</text>
    </svg>

    <div class="sliders">
      <label class="slider">
        <span class="slider-name">wage w</span>
        <input type="range" min={WR + 0.5} max={W_MAX} step="0.1" value={w}
          oninput={(e) => (w = +e.currentTarget.value)} aria-label="The wage" />
      </label>
      <label class="slider">
        <span class="slider-name">curvature a</span>
        <input type="range" min="1" max="3" step="0.1" value={a}
          oninput={(e) => (a = +e.currentTarget.value)} aria-label="Effort curvature a" />
      </label>
    </div>
  </div>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.3rem 0; color: var(--squidink); }
  .readout { font-family: var(--font-main); font-size: 0.88rem; line-height: 1.5; margin: 0 0 0.6rem 0; color: #5a6672; }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .curve { fill: none; stroke: var(--primary); stroke-width: 2.5; }
  .ray { stroke: #df2a5d; stroke-width: 1.5; stroke-dasharray: 5 4; }
  .dot { stroke: white; stroke-width: 1.5; }
  .clab { font-family: var(--font-mono); font-size: 10px; fill: #8a94a2; }
  .curve-lab { fill: var(--primary); }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .sliders { display: flex; flex-direction: column; gap: 4px; }
  .slider { display: flex; align-items: center; gap: 10px; margin: 0.3rem 0 0 0; }
  .slider-name { font-family: var(--font-mono); font-size: 0.75rem; color: #5a6672; width: 15ch; white-space: nowrap; }
  .slider input { flex: 1; accent-color: var(--primary); }
</style>