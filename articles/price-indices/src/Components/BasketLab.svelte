<script>
  /*
    The hook. Two controls: how much energy's price is multiplied by, and sigma,
    the elasticity of substitution that the statistician never observes.

    The diagram is the household's choice. A is last year's basket; the curve
    is every basket exactly as good as A; B is the cheapest of those at the new
    prices. The fixed-basket line passes through A at the new prices, and the
    true line is parallel to it and touches the curve at B. The gap between
    the two lines is the fixed basket's overstatement. check-browser.mjs
    asserts in rendered pixels that A and B are on the curve, A on the first
    line, B on the second, that the lines are parallel and that the true line
    never crosses the curve.
  */
  import { shock, indifferenceCurve } from "../indices.js";
  import { W_ENERGY, R_DEFAULT, SIGMA_DEFAULT, SIGMA_MIN, SIGMA_MAX, R_MIN, R_MAX } from "../datasets.js";
  import { SERIES, INK } from "../palette.js";
  import { linear, clampW, pathOf } from "../chart.js";

  // Zoomed on the tangency: B stays inside this box for every R and sigma the
  // sliders allow (x from 0.01 to 0.79, y from 0.39 to 1.07).
  const XMIN = 0, XMAX = 0.85, YMIN = 0.3, YMAX = 1.3;
  const H = 300;
  const M = { top: 12, right: 12, bottom: 38, left: 42 };

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth - 2));
  let inner = $derived(W - 32);
  let twoUp = $derived(inner >= 620);
  let panelW = $derived(twoUp ? Math.floor((inner - 24 - 2) / 2) : inner);

  let R = $state(R_DEFAULT);
  let sigma = $state(SIGMA_DEFAULT);

  let s = $derived(shock(R, sigma, W_ENERGY));
  let x = $derived(linear(XMIN, XMAX, M.left, panelW - M.right));
  let y = $derived(linear(YMIN, YMAX, H - M.bottom, M.top));

  // The indifference curve; for sigma = 0 it is the corner at A.
  let curve = $derived.by(() => {
    if (sigma < 0.02) {
      const A = s.A;
      return [[A[0], YMAX], [A[0], A[1]], [XMAX, A[1]]];
    }
    const span = Math.min(200, 8 / Math.max(sigma, 0.04));
    return indifferenceCurve(sigma, W_ENERGY, 801, span).filter(([a, b]) => a >= XMIN && a <= XMAX && b >= YMIN && b <= YMAX);
  });
  let curvePath = $derived(pathOf(curve.map(([a, b]) => [x(a), y(b)])));

  // A budget line slope·x + y = c, clipped to the plot box.
  function clipLine(c, slope = R) {
    const lo = Math.max(XMIN, (c - YMAX) / slope);
    const hi = Math.min(XMAX, (c - YMIN) / slope);
    return { x1: x(lo), y1: y(c - slope * lo), x2: x(hi), y2: y(c - slope * hi) };
  }
  let lasLine = $derived(clipLine(s.L));
  let trueLine = $derived(clipLine(s.C));
  let oldLine = $derived(clipLine(1, 1));

  const xTicks = [0, 0.2, 0.4, 0.6, 0.8];
  const yTicks = [0.4, 0.6, 0.8, 1, 1.2];

  // Bars.
  let bars = $derived([
    { key: "L", label: "fixed basket (Laspeyres)", v: s.L - 1, colour: SERIES[1] },
    { key: "P", label: "new basket (Paasche)", v: s.P - 1, colour: SERIES[2] },
    { key: "F", label: "Fisher, the average of the two", v: s.F - 1, colour: SERIES[0] },
    { key: "C", label: "true cost of living", v: s.C - 1, colour: INK },
  ]);
  const BH = 200;
  const BM = { top: 8, right: 56, bottom: 26, left: 10 };
  let vMin = $derived(Math.min(0, ...bars.map((b) => b.v)));
  let vMax = $derived(Math.max(0.05, ...bars.map((b) => b.v)));
  let bx = $derived(linear(vMin, vMax, BM.left, panelW - BM.right));
  let rowH = $derived((BH - BM.top - BM.bottom) / bars.length);

  const pct = (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(1)}%`;
  const two = (v) => v.toFixed(2);
  let readout = $derived.by(() => {
    const gapL = Math.abs(s.L - s.C) * 100, gapF = Math.abs(s.F - s.C) * 100;
    if (Math.abs(R - 1) < 1e-9) return "Energy's price hasn't changed, so every index says the same thing: no change at all.";
    return `Energy ×${two(R)} and σ = ${sigma.toFixed(2)}: the fixed basket is ${gapL.toFixed(2)} points off the true answer, and Fisher is ${gapF.toFixed(2)} points off without knowing σ.`;
  });

  const SIGMA_PRESETS = [0, 0.5, 1, 2];
</script>

<div class="fig" id="basket-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <div class="lab">
    <div class="controls-bar">
      <label class="slider">
        <span class="s-name">energy's price is multiplied by <b>{two(R)}</b></span>
        <input class="r-slider" type="range" min={Math.log2(R_MIN)} max={Math.log2(R_MAX)} step="0.01" value={Math.log2(R)}
          oninput={(e) => (R = Math.pow(2, +e.currentTarget.value))} />
      </label>
      <label class="slider">
        <span class="s-name">how readily the household switches, σ <b>{sigma.toFixed(2)}</b></span>
        <input class="s-slider" type="range" min={SIGMA_MIN} max={SIGMA_MAX} step="0.05" value={sigma}
          oninput={(e) => (sigma = +e.currentTarget.value)} />
      </label>
      <div class="presets">
        <span class="ctl-label">σ</span>
        {#each SIGMA_PRESETS as v}
          <button class="pill" class:active={sigma === v} onclick={() => (sigma = v)}>{v}</button>
        {/each}
        <button class="pill r-reset" class:active={R === 2} onclick={() => (R = 2)}>energy doubles</button>
      </div>
    </div>

    <div class="pair" class:two-up={twoUp}>
      <div class="cell">
        <p class="panel-title">The household's choice</p>
        <svg class="choice" width={panelW} height={H} viewBox={`0 0 ${panelW} ${H}`}>
          <g class="axis">
            {#each xTicks as t}
              <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
            {/each}
            {#each yTicks as t}
              <line class="grid" x1={M.left} x2={panelW - M.right} y1={y(t)} y2={y(t)} />
              <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{t}</text>
            {/each}
            <line class="rule" x1={M.left} x2={panelW - M.right} y1={y(YMIN)} y2={y(YMIN)} />
            <line class="rule" x1={M.left} x2={M.left} y1={M.top} y2={y(YMIN)} />
            <text class="axis-title" x={(M.left + panelW - M.right) / 2} y={H - 4} text-anchor="middle">energy</text>
            <text class="axis-title" x={panelW - M.right} y={M.top + 10} text-anchor="end">vertical: everything else</text>
          </g>
          <line class="old-line" {...oldLine} />
          <path class="curve" d={curvePath} />
          <line class="las-line" {...lasLine} stroke={SERIES[1]} />
          <line class="true-line" {...trueLine} stroke={INK} />
          <circle class="basket-a" cx={x(s.A[0])} cy={y(s.A[1])} r="6" fill={SERIES[1]} />
          <text class="pt-label" x={x(s.A[0]) + 9} y={y(s.A[1]) - 8}>A</text>
          <circle class="basket-b" cx={x(s.B[0])} cy={y(s.B[1])} r="6" fill={INK} />
          <text class="pt-label" x={x(s.B[0]) - 9} y={y(s.B[1]) + 16} text-anchor="end">B</text>
        </svg>
        <p class="legend">
          <span class="key"><span class="swatch" style={`background:${SERIES[1]}`}></span>what A costs at the new prices</span>
          <span class="key"><span class="swatch" style={`background:${INK}`}></span>what B, the cheapest basket as good as A, costs</span>
        </p>
      </div>
      <div class="cell">
        <p class="panel-title">Rise in the cost of living, by index</p>
        <svg class="bars" width={panelW} height={BH} viewBox={`0 0 ${panelW} ${BH}`}>
          <line class="zero" x1={bx(0)} x2={bx(0)} y1={BM.top} y2={BH - BM.bottom} />
          {#each bars as b, i}
            <rect class={`bar ${b.key}`} data-value={b.v}
              x={Math.min(bx(0), bx(b.v))} y={BM.top + rowH * i + 4}
              width={Math.abs(bx(b.v) - bx(0))} height={rowH - 22} fill={b.colour} opacity={b.key === "C" ? 0.85 : 0.8} />
            <text class="bar-label" x={BM.left + 2} y={BM.top + rowH * i + rowH - 6}>{b.label}</text>
            <text class="bar-value" x={Math.max(bx(0), bx(b.v)) + 5} y={BM.top + rowH * i + (rowH - 22) / 2 + 8}>{pct(b.v)}</text>
          {/each}
          <line class="truth" x1={bx(s.C - 1)} x2={bx(s.C - 1)} y1={BM.top} y2={BH - BM.bottom} />
        </svg>
      </div>
    </div>
    <p class="verdict">{readout}</p>
  </div>
</div>

<style>
  .fig {
    max-width: 820px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .lab {
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 1rem 16px;
  }

  .controls-bar {
    background: #fff;
    padding: 0.3rem 0 0.6rem 0;
    margin-bottom: 0.6rem;
    border-bottom: 1px solid #eef1f3;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  @media screen and (max-width: 700px) {
    .controls-bar {
      position: sticky;
      top: 0;
      z-index: 5;
    }
  }

  .slider {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .s-name {
    font-family: var(--font-main);
    font-size: 0.85rem;
  }

  .s-name b {
    font-family: var(--font-mono);
    float: right;
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--violet);
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }

  .ctl-label {
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #8a94a2;
  }

  .pill {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill.active {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .r-reset {
    font-family: var(--font-main);
    margin-left: auto;
  }

  .pair {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pair.two-up {
    flex-direction: row;
    gap: 24px;
  }

  .cell {
    min-width: 0;
  }

  .panel-title {
    font-family: var(--font-main);
    font-size: 0.88rem;
    font-weight: 600;
    margin: 0 0 0.3rem 0;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }

  .axis .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .grid {
    stroke: #eef1f3;
  }

  .rule {
    stroke: #8a94a2;
  }

  .old-line {
    stroke: #c9d1d8;
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
  }

  .curve {
    fill: none;
    stroke: #8a94a2;
    stroke-width: 2;
  }

  .las-line,
  .true-line {
    stroke-width: 2.2;
  }

  .true-line {
    stroke-dasharray: 7 4;
  }

  .basket-a,
  .basket-b {
    stroke: #fff;
    stroke-width: 2;
  }

  .pt-label {
    font-family: var(--font-main);
    font-weight: 700;
    font-size: 13px;
    fill: var(--squid-ink);
    stroke: #fff;
    stroke-width: 3px;
    paint-order: stroke;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.9rem;
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #61707d;
    margin: 0.3rem 0 0 0;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .swatch {
    display: inline-block;
    width: 14px;
    height: 4px;
  }

  .zero {
    stroke: #c9d1d8;
  }

  .truth {
    stroke: var(--squid-ink);
    stroke-width: 1.2;
    stroke-dasharray: 3 3;
  }

  .bar-label {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .bar-value {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: var(--squid-ink);
  }

  .verdict {
    font-family: var(--font-main);
    font-size: 0.92rem;
    line-height: 1.55;
    margin: 0.8rem 0 0 0;
    min-height: 3em;
    text-align: center;
  }
</style>
