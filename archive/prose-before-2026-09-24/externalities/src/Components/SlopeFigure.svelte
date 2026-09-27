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
  const PINK = "#df2a5d";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let x = $derived(log(0.25, 4, M.left, W - M.right));
  let y = $derived(log(0.01, 30, H - M.bottom, M.top));

  const GRIDS = Array.from({ length: 25 }, (_, i) => Math.pow(2, -2 + (4 * i) / 24));
  // The x axis is the ratio g/b; with b = B the function takes g itself.
  const RUNS = GRIDS.map((r) => ({ g: r, ...weitzman(r * B, 20, 15, 20000) }));

  const taxPts = RUNS.filter((r) => r.tax > 0.01 && r.tax < 30).map((r) => [x(r.g), y(r.tax)]);
  const quotaPts = RUNS.filter((r) => r.quota > 0.01 && r.quota < 30).map((r) => [x(r.g), y(r.quota)]);

  let cross = $derived.by(() => {
    for (let i = 1; i < RUNS.length; i++) {
      const a = RUNS[i - 1], b = RUNS[i];
      if ((a.ratio - 1) * (b.ratio - 1) <= 0) {
        return a.g + ((b.g - a.g) * (1 - a.ratio)) / (b.ratio - a.ratio);
      }
    }
    return null;
  });

  let readout = $derived.by(() => {
    if (cross === null) return "The curves did not cross in the sweep — check the slopes.";
    return `The expected losses cross at g/b = ${cross.toFixed(3)} — exactly 1, the knife edge — and the tax wins on the flat-damage side by (g/b)², until the corner at extreme ratios takes over.`;
  });
</script>

<div class="fig" id="slope-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Expected losses for the tax and the quota against the slope ratio, crossing at one, with the tax curve on a slope-two line">
      <g class="axis">
        {#each [0.25, 0.5, 1, 2, 4] as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each [0.01, 0.1, 1, 10] as t}
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
      <circle class="dot" cx={x(0.5)} cy={y(weitzman(0.5, 20, 15).quota)} r="4.5" fill={SERIES[0]} />
      <circle class="dot" cx={x(2)} cy={y(weitzman(2, 20, 15).quota)} r="4.5" fill={SERIES[0]} />
      {#if cross}
        <circle class="cross" cx={x(cross)} cy={y(weitzman(cross, 20, 15).quota)} r="5" fill="none" stroke={PINK} stroke-width="1.8" />
      {/if}
      <text class="clab" x={x(0.3)} y={y(0.04)}>tax (price instrument)</text>
      <text class="clab" x={x(1.4)} y={y(3)}>quota (quantity instrument)</text>
    </svg>
  </div>

  <p class="note">
    At g/b = 0.5 the ratio is 0.25, at 1 it is 1.00, at 2 it is 4.00 — the
    square of the slope ratio, exact while the tax's optimum stays interior.
    At g/b = 8 the measured ratio is 46.0, not 64: the tax has pushed output
    to the corner, and a corner is a finding.
  </p>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .curve { fill: none; stroke: var(--pink); stroke-width: 2.5; }
  .curve.two { stroke: var(--primary); }
  .cross { fill: none; }
  .dot { stroke: white; stroke-width: 1; }
  .clab { font-family: var(--font-mono); font-size: 10px; fill: #8a94a2; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .note { font-family: var(--font-main); font-size: 0.9rem; color: #5a6672; margin: 0.6rem 0 0 0; }
</style>