<script>
  /*
    The Solow condition on screen: the elasticity of effort with respect to
    the wage, against the wage, for three curvatures. Each curve crosses 1
    exactly at its own closed-form optimum, marked with a dot — the same
    wage the search in src/effort.js returns.
  */
  import { WR, effort, elasticityAt, closedWage, optimalWage } from "../effort.js";
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 260;
  const M = { top: 20, right: 16, bottom: 40, left: 50 };
  const W_MAX = 3.2; // in units of w_r
  const PINK = "#df2a5d";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let x = $derived(linear(1, W_MAX, M.left, W - M.right));
  let y = $derived(linear(0, 2.2, H - M.bottom, M.top));

  const AS = [1, 2, 3];
  const CURVES = AS.map((a) => ({
    a,
    pts: Array.from({ length: 121 }, (_, i) => {
      const ww = WR * (1 + ((W_MAX - 1) * i) / 120);
      return [ww, Math.min(2.2, elasticityAt(ww, WR, a))];
    }),
    wStar: closedWage(WR, a),
    searched: optimalWage(WR, a, 10),
  }));

  let readout = $derived(
    `Three curvatures, three optima — 20, ${closedWage(WR, 2).toFixed(4)} and ${closedWage(WR, 3).toFixed(4)} — and every crossing sits on 1.0000000, which is the Solow condition: at the cheapest effort per unit of pay, a one-percent wage rise buys exactly one percent more effort.`
  );

  const xTicks = [1, 1.5, 2, 2.5, 3];
</script>

<div class="fig" id="elasticity-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="The elasticity of effort against the wage for three curvatures, each crossing one exactly at its optimal wage">
      <g class="axis">
        {#each xTicks as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each [0, 0.5, 1, 1.5, 2] as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t.toFixed(1)}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <line class="one" x1={M.left} y1={y(1)} x2={W - M.right} y2={y(1)} />
        <text class="one-lab" x={W - M.right - 4} y={y(1) - 6} text-anchor="end">elasticity = 1</text>
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">wage, in multiples of the reservation wage</text>
      </g>

      {#each CURVES as c, i}
        <path class="curve" class:two={i === 1} class:three={i === 2}
          d={c.pts.map(([ww, ee], k) => `${k ? "L" : "M"} ${x(ww).toFixed(2)} ${y(ee).toFixed(2)}`).join(" ")} />
        <circle class="dot" class:two={i === 1} class:three={i === 2}
          cx={x(c.wStar / WR)} cy={y(1)} r="5.5" />
        <text class="clab" class:two={i === 1} class:three={i === 2}
          x={x(c.wStar / WR)} y={H - M.bottom - 6} text-anchor="middle">a = {c.a}</text>
      {/each}
    </svg>
  </div>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .curve { fill: none; stroke: var(--primary); stroke-width: 2.5; }
  .curve.two { stroke: #df2a5d; }
  .curve.three { stroke: #2f7d32; }
  .one { stroke: #8a94a2; stroke-width: 1.5; stroke-dasharray: 5 4; }
  .one-lab { font-family: var(--font-mono); font-size: 10px; fill: #5a6672; }
  .dot { stroke: white; stroke-width: 1.5; fill: var(--primary); }
  .dot.two { fill: #df2a5d; }
  .dot.three { fill: #2f7d32; }
  .clab { font-family: var(--font-mono); font-size: 10px; fill: #8a94a2; }
  .clab.two { fill: #df2a5d; }
  .clab.three { fill: #2f7d32; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
</style>