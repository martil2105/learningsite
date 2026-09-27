<script>
  /*
    The turn. The private-benefit intercept is shocked; both instruments are
    set for the mean. Left axis: expected welfare loss for the price
    instrument (tax) and the quantity instrument (quota) against the slope
    ratio g/b, on log-log axes. The curves cross at exactly 1, and away
    from the crossing the tax-side ratio sits on the line of slope exactly
    2 — (g/b)² — until the tax drives output to the corner and departs.
    The corner is measured, not smoothed.
  */
  import { B, weitzman } from "../externality.js";
  import { log, linear, clampW, pathOf } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 270;
  const M = { top: 20, right: 16, bottom: 42, left: 54 };
  const INK = "#232f3e";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let x = $derived(log(0.25, 4, M.left, W - M.right));
  // Losses in this parameterisation run from about 2 to about 120, so the
  // axis spans 1 to 200 (it was 0.01 to 30, which cut the tax curve off).
  let y = $derived(log(1, 200, H - M.bottom, M.top));

  const GRIDS = Array.from({ length: 25 }, (_, i) => Math.pow(2, -2 + (4 * i) / 24));
  // The x axis is the ratio g/b; with b = B the function takes g itself.
  const RUNS = GRIDS.map((r) => ({ g: r, ...weitzman(r * B, 20, 15, 20000) }));

  const inRange = (v) => v >= 1 && v <= 200;
  let taxPts = $derived(RUNS.filter((r) => inRange(r.tax)).map((r) => [x(r.g), y(r.tax)]));
  let quotaPts = $derived(RUNS.filter((r) => inRange(r.quota)).map((r) => [x(r.g), y(r.quota)]));
  // The two ratios the prose compares, g/b = 1/2 and 2, are grid points 6 and 18.
  const MARKED = [RUNS[6], RUNS[18]];

  let cross = $derived.by(() => {
    for (let i = 1; i < RUNS.length; i++) {
      const a = RUNS[i - 1], b = RUNS[i];
      if ((a.ratio - 1) * (b.ratio - 1) <= 0) {
        return a.g + ((b.g - a.g) * (1 - a.ratio)) / (b.ratio - a.ratio);
      }
    }
    return null;
  });

</script>

<div class="fig" id="slope-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">Expected loss from a tax and from a quota, as damage gets steeper</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Expected losses for the tax and the quota against the slope ratio, crossing at one, with the tax curve on a slope-two line">
      <g class="axis">
        {#each [0.25, 0.5, 1, 2, 4] as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each [1, 10, 100] as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">slope ratio g/b (log)</text>
        <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">expected loss (log)</text>
      </g>

      <path class="curve" d={pathOf(quotaPts)} />
      <path class="curve two" d={pathOf(taxPts)} />
      {#each MARKED as m}
        <circle class="dot" cx={x(m.g)} cy={y(m.tax)} r="4.5" fill={SERIES[0]} />
        <circle class="dot" cx={x(m.g)} cy={y(m.quota)} r="4.5" fill={SERIES[0]} />
      {/each}
      {#if cross}
        <!-- weitzman takes g itself, and the axis is g/b, so scale by b = B -->
        <circle class="cross" cx={x(cross)} cy={y(weitzman(cross * B, 20, 15).quota)} r="6" fill="none" stroke={INK} stroke-width="1.8" />
      {/if}
      <text class="clab tax-lab" x={x(1.9) - 6} y={y(60)} text-anchor="end">tax (price)</text>
      <text class="clab quota-lab" x={x(4) - 2} y={y(4)} text-anchor="end">quota (quantity)</text>
    </svg>
  </div>

  <p class="caption">
    The violet curve is the tax and the pink curve is the quota. The dark ring
    marks where they cross, and the blue dots mark the two ratios compared
    below.
  </p>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .curve { fill: none; stroke: #df2a5d; stroke-width: 2.5; }
  .curve.two { stroke: var(--primary); }
  .cross { fill: none; }
  .dot { stroke: white; stroke-width: 1; }
  .clab { font-family: var(--font-mono); font-size: 10px; fill: #8a94a2; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .tax-lab { fill: var(--primary); }
  .quota-lab { fill: #df2a5d; }
  .caption { font-family: var(--font-main); font-size: 0.88rem; line-height: 1.5; color: #5a6672; margin: 0.6rem 0 0 0; }
</style>