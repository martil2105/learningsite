<script>
  /*
    The fallback. The limit curve is max(x*, s_A): an outside option is worth
    exactly nothing while it sits below the equilibrium share, and one for
    one once it crosses. The dot is the finite-period fixed point from
    src/bargain.js, which sits (honestly) O(Δ) off the limit curve.
  */
  import { R_A, R_B, DTS } from "../datasets.js";
  import { fixedPoint, discount, limitShare, rubinstein } from "../bargain.js";
  import { linear, clampW, pathOf } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 260;
  const M = { top: 22, right: 16, bottom: 40, left: 50 };
  const DT = DTS[1]; // 0.1 — small enough to see the kink, large enough to converge

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let sA = $state(0.5);

  let x = $derived(linear(0, 1, M.left, W - M.right));
  let y = $derived(linear(0, 1, H - M.bottom, M.top));

  let dA = $derived(discount(R_A, DT));
  let dB = $derived(discount(R_B, DT));
  let base = $derived(rubinstein(dA, dB));
  let limit = $derived(limitShare(R_A, R_B));

  const SS = Array.from({ length: 201 }, (_, i) => i / 200);
  const CURVE = SS.map((s) => [s, Math.max(limit, s)]);
  let curvePath = $derived(pathOf(CURVE.map(([s, v]) => [x(s), y(v)])));

  let fp = $derived(fixedPoint(dA, dB, sA, 0, 60000));
  let payoff = $derived(Math.max(base, sA));

  let readout = $derived.by(() => {
    if (sA < limit - 1e-9) {
      return `A's fallback is ${(sA * 100).toFixed(0)}% and the split is unchanged at ${(limit * 100).toFixed(1)}%: below the line, an outside option is worth exactly nothing.`;
    }
    return `A's fallback is ${(sA * 100).toFixed(0)}%, above the ${(limit * 100).toFixed(1)}% share, so it binds: A walks away with the fallback and B holds the rest. One for one, and no further.`;
  });
</script>

<div class="fig" id="option-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="A's payoff against its outside option: flat, then one for one past the kink">
      <g class="axis">
        {#each [0, 0.25, 0.5, 0.75, 1] as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{(t * 100).toFixed(0)}%</text>
        {/each}
        {#each [0, 0.25, 0.5, 0.75, 1] as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{(t * 100).toFixed(0)}%</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">A's outside option, as a share</text>
      </g>

      <line class="limit" x1={x(limit)} y1={M.top} x2={x(limit)} y2={H - M.bottom} />
      <text class="limit-lab" x={x(limit) - 6} y={M.top + 10} text-anchor="end">the kink sits at the share</text>
      <path class="curve" d={curvePath} />
      <circle class="dot fp" cx={x(sA)} cy={y(fp)} r="5.5" fill={SERIES[1]} />
      <circle class="dot" cx={x(sA)} cy={y(payoff)} r="6.5" fill={SERIES[0]} />
    </svg>

    <label class="slider">
      <span class="slider-name">A's outside option</span>
      <input type="range" min="0" max="1" step="0.01" value={sA}
        oninput={(e) => (sA = +e.currentTarget.value)}
        aria-label="A's outside option, as a share of the surplus" />
    </label>
  </div>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .limit { stroke: var(--violet); stroke-width: 1; stroke-dasharray: 2 3; opacity: 0.7; }
  .limit-lab { font-family: var(--font-mono); font-size: 10px; fill: var(--violet); }
  .curve { fill: none; stroke: var(--primary); stroke-width: 2.5; }
  .dot { stroke: white; stroke-width: 1.5; }
  .dot.fp { opacity: 0.85; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .slider { display: flex; align-items: center; gap: 10px; margin: 0.4rem 0 0 0; }
  .slider-name { font-family: var(--font-mono); font-size: 0.75rem; color: #5a6672; white-space: nowrap; }
  .slider input { flex: 1; accent-color: var(--primary); }
</style>