<script>
  /*
    The premium is exactly 1/(pF): monitoring probability and penalty are
    perfect substitutes along a hyperbola. Log-log axes make the hyperbola
    a straight line of slope exactly −1, with the article's named points
    marked. At p = 1 with a bounded penalty the premium is still 100% —
    only an unbounded penalty collapses the construction.
  */
  import { premiumPct } from "../effort.js";
  import { log, linear, clampW, pathOf } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 250;
  // left margin 60, not 54: the rotated axis title ran into the "3000%" ticks
  const M = { top: 20, right: 16, bottom: 40, left: 60 };

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let x = $derived(log(0.01, 1, M.left, W - M.right));
  let y = $derived(log(50, 3000, H - M.bottom, M.top));

  const PS = Array.from({ length: 121 }, (_, i) => Math.pow(10, -2 + (2 * i) / 120));
  // Only the part of the hyperbola inside the axis: at p = 0.01 the premium is
  // far above the 3000% top, and the line ran into the title.
  let path = $derived(pathOf(PS.filter((p) => premiumPct(p) <= 3000).map((p) => [x(p), y(premiumPct(p))])));

  const MARKS = [
    { p: 0.05, label: "p = 0.05", end: false },
    { p: 0.2, label: "p = 0.2", end: false },
    { p: 1, label: "p = 1", end: true },
  ];


</script>

<div class="fig" id="monitor-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">The premium needed to stop slacking, against the chance of being caught</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="The no-shirking premium against the monitoring probability, a straight line of slope minus one on log-log axes">
      <g class="axis">
        {#each [0.01, 0.1, 1] as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each [100, 300, 1000, 3000] as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t}%</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">monitoring probability p (log)</text>
        <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">premium (log)</text>
      </g>

      <path class="curve" d={path} />
      {#each MARKS as mk}
        <circle class="dot" cx={x(mk.p)} cy={y(premiumPct(mk.p))} r="5.5" fill={SERIES[0]} />
        <text class="clab" x={mk.end ? x(mk.p) - 8 : x(mk.p) + 6} y={y(premiumPct(mk.p)) + (mk.end ? 18 : -8)}
          text-anchor={mk.end ? "end" : "start"}>{mk.label}</text>
      {/each}
    </svg>
  </div>

  <p class="caption">
    The penalty is held at F = 1. On these logarithmic scales the premium falls
    along a straight line, and it stops at p = 1, well above zero.
  </p>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .curve { fill: none; stroke: var(--primary); stroke-width: 2.5; }
  .dot { stroke: white; stroke-width: 1.5; }
  .clab { font-family: var(--font-mono); font-size: 10px; fill: #5a6672; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .caption { font-family: var(--font-main); font-size: 0.88rem; line-height: 1.5; color: #5a6672; margin: 0.6rem 0 0 0; }
</style>