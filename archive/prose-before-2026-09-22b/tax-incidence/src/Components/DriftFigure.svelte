<script>
  /*
    The break. In an iso-elastic market the textbook share es/(es+ed) is a
    first-order rule: true as the rate goes to zero, and drifting away from
    it as the rate grows. The dots are the true share, computed by bisecting
    the wedge in src/market.js; the dashed line is the textbook value. Every
    parameter pair tried drifts the same way — toward the buyers.
  */
  import { isoShare } from "../market.js";
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 250;
  const M = { top: 18, right: 16, bottom: 40, left: 54 };
  const ED = 1.5, ES = 1;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let x = $derived(linear(-2, 0.55, M.left, W - M.right));
  let y = $derived(linear(0.3, 0.55, H - M.bottom, M.top));

  const RATES = [0.001, 0.01, 0.1, 0.25, 0.5];
  const TEXTBOOK = ES / (ES + ED);
  const TRUE = RATES.map((rate) => ({ rate, share: isoShare(rate, ED, ES).share }));

  let readout = $derived.by(() => {
    const last = TRUE[TRUE.length - 1];
    return `The textbook says buyers bear ${(TEXTBOOK * 100).toFixed(1)}%. Bisecting the wedge says ${(last.share * 100).toFixed(1)}% once the tax is half the price — a first-order rule wearing an exact costume.`;
  });

  const xTicks = [0.001, 0.01, 0.1, 0.25, 0.5];
</script>

<div class="fig" id="drift-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="The true incidence share against the tax rate, drifting away from the textbook elasticity ratio">
      <g class="axis">
        {#each xTicks as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each [0.3, 0.35, 0.4, 0.45, 0.5] as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{(t * 100).toFixed(0)}%</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">tax rate as a share of price (log)</text>
      </g>

      <line class="textbook" x1={M.left} y1={y(TEXTBOOK)} x2={W - M.right} y2={y(TEXTBOOK)} />
      <text class="tb-lab" x={W - M.right - 4} y={y(TEXTBOOK) - 6} text-anchor="end">
        es/(es+ed) = {(TEXTBOOK * 100).toFixed(1)}%
      </text>
      {#each TRUE as pt}
        <circle class="dot" cx={x(pt.rate)} cy={y(pt.share)} r="6" fill={SERIES[0]} />
      {/each}
      <path class="curve" d={TRUE.map((pt, i) => `${i ? "L" : "M"} ${x(pt.rate).toFixed(2)} ${y(pt.share).toFixed(2)}`).join(" ")} />
    </svg>
  </div>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .textbook { stroke: var(--violet); stroke-width: 1.5; stroke-dasharray: 5 4; }
  .tb-lab { font-family: var(--font-mono); font-size: 10px; fill: var(--violet); }
  .curve { fill: none; stroke: var(--primary); stroke-width: 1.5; opacity: 0.5; }
  .dot { stroke: white; stroke-width: 1.5; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
</style>