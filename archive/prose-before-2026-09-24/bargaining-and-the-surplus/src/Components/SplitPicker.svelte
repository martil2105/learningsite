<script>
  /*
    The question. The frontier is the line A's share + B's share = 1: every
    point on it beats no deal, and nothing in the picture prefers any one of
    them. The reader drags the split; the readout is built in the script
    block, because every sentence carrying a figure is.
  */
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 240;
  const M = { top: 18, right: 18, bottom: 40, left: 50 };

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let shareA = $state(0.5);

  let x = $derived(linear(0, 1, M.left, W - M.right));
  let y = $derived(linear(0, 1, H - M.bottom, M.top));

  let shareB = $derived(1 - shareA);

  let readout = $derived(
    `A takes ${(shareA * 100).toFixed(0)}% and B takes ${(shareB * 100).toFixed(0)}%. Every point on this line is a deal both prefer to walking away, and nothing in the picture prefers any one of them.`
  );
</script>

<div class="fig" id="split-picker">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="The bargaining frontier: every split of the surplus along it beats no deal">
      <g class="axis">
        {#each [0, 0.25, 0.5, 0.75, 1] as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{(t * 100).toFixed(0)}%</text>
        {/each}
        {#each [0.25, 0.5, 0.75] as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{(t * 100).toFixed(0)}%</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">A's share of the surplus</text>
        <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">B's share</text>
      </g>

      <line class="frontier" x1={x(0)} y1={y(1)} x2={x(1)} y2={y(0)} />
      <text class="flab" x={x(0.82)} y={y(0.06)}>the frontier</text>
      <circle class="dot" cx={x(shareA)} cy={y(shareB)} r="7" fill={SERIES[0]} />
    </svg>

    <label class="slider">
      <span class="slider-name">A's share</span>
      <input type="range" min="0" max="1" step="0.01" value={shareA}
        oninput={(e) => (shareA = +e.currentTarget.value)}
        aria-label="A's share of the surplus" />
    </label>
  </div>
</div>

<style>
  .fig { max-width: 560px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .frontier { stroke: var(--primary); stroke-width: 2.5; }
  .flab { font-family: var(--font-mono); font-size: 10.5px; fill: var(--primary); }
  .dot { stroke: white; stroke-width: 1.5; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .slider { display: flex; align-items: center; gap: 10px; margin: 0.4rem 0 0 0; }
  .slider-name { font-family: var(--font-mono); font-size: 0.75rem; color: #5a6672; white-space: nowrap; }
  .slider input { flex: 1; accent-color: var(--primary); }
</style>