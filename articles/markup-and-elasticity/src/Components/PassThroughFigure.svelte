<script>
  /*
    Pass-through against the exponent, ρ = n/(1+n): 1/2 for the straight
    line (n = 1), above one down the constant-elasticity branch, a negative
    region for −1 < n < 0 where a cost rise LOWERS the optimal price, and
    the asymptote at n = −1. The marked dots are the members the article
    names; the live dot tracks the lab's slider.
  */
  import { passThrough } from "../demand.js";
  import { linear, clampW, pathOf } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 250;
  const M = { top: 18, right: 16, bottom: 40, left: 50 };
  const R_MIN = -4, R_MAX = 6;
  const PINK = "#df2a5d";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let x = $derived(linear(-6, 8, M.left, W - M.right));
  let y = $derived(linear(R_MIN, R_MAX, H - M.bottom, M.top));

  let branches = $derived.by(() => {
    const seg = (lo, hi, steps) => {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const nn = lo + ((hi - lo) * i) / steps;
        const r = passThrough(nn);
        if (r >= R_MIN && r <= R_MAX) pts.push([nn, r]);
      }
      return pts;
    };
    return [
      seg(0.2, 8, 300),        // 0 < rho < 1
      seg(-0.99, -0.2, 300),   // negative, heading to -infinity
      seg(-6, -1.2, 300),      // rho > 1, from infinity down to 1.2
    ];
  });

  const MARKS = [
    { n: 1, label: "n = 1" },
    { n: -1.5, label: "n = −1.5" },
    { n: -2, label: "−2" },
    { n: -5, label: "−5" },
  ];

  const nTicks = [-6, -4, -2, 0, 2, 4, 6, 8];
  const rTicks = [-4, -2, 0, 2, 4, 6];
</script>

<div class="fig" id="pass-through-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <div class="panels">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Pass-through against the exponent: a half for the straight line, above one down the constant-elasticity branch, negative in between, asymptote at n = -1">
      <g class="axis">
        {#each nTicks as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each rTicks as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <line class="zero" x1={M.left} y1={y(0)} x2={W - M.right} y2={y(0)} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">exponent n</text>
        <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">pass-through ρ</text>
      </g>

      {#each branches as pts}
        <path class="curve" d={pathOf(pts.map(([nn, r]) => [x(nn), y(r)]))} />
      {/each}
      <line class="asym" x1={x(-1)} y1={M.top} x2={x(-1)} y2={H - M.bottom} />
      <text class="alab" x={x(-1) + 5} y={M.top + 12}>n = −1</text>

      {#each MARKS as mk}
        <circle class="pt" cx={x(mk.n)} cy={y(passThrough(mk.n))} r="4.5" fill={SERIES[0]} />
      {/each}
    </svg>
  </div>

  <p class="note">
    The straight line, at n = 1, passes on half of a cost rise. Curves to the
    left of the gap pass on more than all of it, and between n = −1 and 0 a
    rise in cost lowers the best price.
  </p>
</div>

<style>
  .fig { max-width: 680px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .panels svg { display: block; max-width: 100%; height: auto; }
  .curve { fill: none; stroke: var(--primary); stroke-width: 2.5; }
  .asym { stroke: var(--violet); stroke-width: 1; stroke-dasharray: 3 3; opacity: 0.7; }
  .alab { font-family: var(--font-mono); font-size: 10px; fill: var(--violet); }
  .zero { stroke: #8a94a2; stroke-width: 1; }
  .pt { stroke: white; stroke-width: 1; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .note { font-family: var(--font-main); font-size: 0.9rem; color: #5a6672; margin: 0.6rem 0 0 0; }
</style>