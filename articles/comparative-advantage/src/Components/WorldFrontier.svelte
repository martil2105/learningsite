<script>
  /*
    Why the price sticks. The world's frontier is two straight pieces with a
    corner between them, and the price is the slope of whichever piece world
    production sits on. Only at the corner is the price free to be anything
    between the two slopes, and only there do both economies gain.

    Three presets rather than a slider: the size lab is the slider, and this
    figure's job is to show the three regimes one at a time.
  */
  import { VALLEY, COAST, SHARE_TOOLS, VALLEY_WORKERS } from "../datasets.js";
  import { market, oppCost } from "../trade.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { linear, ticks, clampW } from "../chart.js";

  const PRESETS = [
    { k: 1, label: "equal size" },
    { k: 3, label: "Coast 3× bigger" },
    { k: 6, label: "Coast 6× bigger" },
  ];
  let k = $state(1);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 300;
  const M = { top: 14, right: 18, bottom: 42, left: 50 };

  let m = $derived(market(VALLEY, COAST, k, SHARE_TOOLS));

  // Everything in thousands, with 1,000 Valley workers.
  let A = $derived([0, VALLEY.grain + k * COAST.grain]);
  let K = $derived([VALLEY.tools, k * COAST.grain]);
  let B = $derived([VALLEY.tools + k * COAST.tools, 0]);
  let P = $derived([m.production.tools, m.production.grain]);
  let N = $derived([m.autarkyProduction.tools, m.autarkyProduction.grain]);

  let xMax = $derived(Math.ceil((B[0] * 1.08) / 2) * 2);
  let yMax = $derived(Math.ceil((A[1] * 1.08) / 10) * 10);
  let x = $derived(linear(0, xMax, M.left, W - M.right));
  let y = $derived(linear(0, yMax, H - M.bottom, M.top));
  let xTicks = $derived(ticks(0, xMax, 6));
  let yTicks = $derived(ticks(0, yMax, 5));

  // The price line through production, slope -p, clipped to the plot.
  let priceLine = $derived.by(() => {
    const p = m.p;
    const [x0, y0] = P;
    const xa = Math.max(0, x0 - (yMax - y0) / p);
    const xb = Math.min(xMax, x0 + y0 / p);
    return { x1: xa, y1: y0 - p * (xa - x0), x2: xb, y2: y0 - p * (xb - x0) };
  });

  const th = (v) => Math.round(v * VALLEY_WORKERS).toLocaleString("en-GB");
  const n = (v) => String(v);

  let readout = $derived.by(() => {
    const t0 = th(N[0]), g0 = th(N[1]), t1 = th(P[0]), g1 = th(P[1]);
    if (m.regime === "a makes both") {
      return `Production sits on the Valley's piece, whose slope is ${n(oppCost(VALLEY))}, so a tool sells for ${n(m.p)} sacks. The world grows the same ${g1} sacks as before and makes ${t1} tools instead of ${t0}.`;
    }
    if (m.regime === "b makes both") {
      return `Production sits on the Coast's piece, whose slope is ${n(oppCost(COAST))}, so a tool sells for ${n(m.p)} sacks. The world makes the same ${t1} tools as before and grows ${g1} sacks instead of ${g0}.`;
    }
    const upT = Math.round((P[0] / N[0] - 1) * 100);
    const upG = Math.round((P[1] / N[1] - 1) * 100);
    const more = upT === upG ? `${upT}% more of each` : `${upT}% more tools and ${upG}% more grain`;
    return `Production sits exactly on the corner, where each economy makes only its own good, and a tool sells for ${n(m.p)} sacks, between the two slopes. The world makes ${t1} tools instead of ${t0} and ${g1} sacks instead of ${g0}, ${more}.`;
  });
</script>

<div class="fig" id="world-frontier">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">The world's frontier: every mix of tools and grain the two economies can make together</p>

  <div class="presets">
    {#each PRESETS as pr}
      <button class="pill" class:active={k === pr.k} onclick={() => (k = pr.k)}>{pr.label}</button>
    {/each}
  </div>

  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
    aria-label="The world's production frontier, with world production and the world's output without trade">
    <g class="axis">
      {#each xTicks as t}
        <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
        <text x={x(t)} y={H - M.bottom + 16} text-anchor="middle">{t}</text>
      {/each}
      {#each yTicks as t}
        <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
        <text x={M.left - 8} y={y(t) + 4} text-anchor="end">{t}</text>
      {/each}
      <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
      <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 6} text-anchor="middle">thousand tools a day</text>
      <text class="axis-title" x={14} y={(M.top + H - M.bottom) / 2} text-anchor="middle"
        transform={`rotate(-90 14 ${(M.top + H - M.bottom) / 2})`}>thousand sacks a day</text>
    </g>

    <line class="piece valley" x1={x(A[0])} y1={y(A[1])} x2={x(K[0])} y2={y(K[1])} stroke={SERIES[0]} />
    <line class="piece coast" x1={x(K[0])} y1={y(K[1])} x2={x(B[0])} y2={y(B[1])} stroke={SERIES[1]} />
    <rect class="corner" x={x(K[0]) - 4} y={y(K[1]) - 4} width="8" height="8" />

    <line class="price-line" x1={x(priceLine.x1)} y1={y(priceLine.y1)} x2={x(priceLine.x2)} y2={y(priceLine.y2)} />

    <circle class="no-trade" cx={x(N[0])} cy={y(N[1])} r="5.5" stroke={BACKGROUND_CLASS} />
    <circle class="production" cx={x(P[0])} cy={y(P[1])} r="6" />
  </svg>

  <p class="legend">
    <span class="key"><span class="swatch" style:background={SERIES[0]}></span>the Valley moving workers (slope 2)</span>
    <span class="key"><span class="swatch" style:background={SERIES[1]}></span>the Coast moving workers (slope 4.5)</span>
    <span class="key"><span class="swatch square"></span>each makes only its own good</span>
    <span class="key"><span class="swatch hollow"></span>world output without trade</span>
    <span class="key"><span class="swatch dot"></span>with trade</span>
    <span class="key"><span class="swatch dash"></span>the price</span>
  </p>

  <p class="readout">{readout}</p>
</div>

<style>
  .fig {
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    margin: 0 0 0.6rem 0;
    color: var(--squid-ink);
    text-align: center;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
    overflow: hidden;
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 10.5px;
    fill: #8a94a2;
  }

  .axis .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .grid {
    stroke: #eef1f3;
    stroke-width: 1;
  }

  .rule {
    stroke: #8a94a2;
    stroke-width: 1;
  }

  .piece {
    stroke-width: 3;
  }

  .corner {
    fill: #fff;
    stroke: #232f3e;
    stroke-width: 1.5;
  }

  .price-line {
    stroke: #232f3e;
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
  }

  .no-trade {
    fill: #fff;
    stroke-width: 2;
  }

  .production {
    fill: #232f3e;
    stroke: #fff;
    stroke-width: 2;
  }

  .presets {
    display: flex;
    gap: 0.35rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 0.6rem;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.82rem;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill:hover {
    border-color: var(--violet);
  }

  .pill.active {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.9rem;
    justify-content: center;
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #61707d;
    margin: 0.5rem 0 0 0;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .swatch {
    display: inline-block;
    width: 16px;
    height: 3px;
  }

  .swatch.square {
    width: 8px;
    height: 8px;
    background: #fff;
    border: 1.5px solid #232f3e;
  }

  .swatch.hollow {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 2px solid #8a94a2;
    background: #fff;
  }

  .swatch.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #232f3e;
  }

  .swatch.dash {
    height: 0;
    border-bottom: 1.5px dashed #232f3e;
  }

  .readout {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--squid-ink);
    text-align: center;
    min-height: 4.6em;
    margin: 0.8rem auto 0 auto;
    max-width: 580px;
  }
</style>
