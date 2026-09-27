<script>
  /*
    The Laffer figure. Revenue against the rate is a parabola for the
    straight-line market, and at its peak two things hold in EVERY linear
    market, whatever the elasticities: quantity is exactly half what it
    was, and the deadweight loss is exactly half the take. The market
    presets let the reader check that the halves survive new slopes.
  */
  import { A, B, C, S, p0, q0, solveSeller, dwl, revenue, peak, tMax } from "../market.js";
  import { linear, clampW, pathOf } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 260;
  const M = { top: 20, right: 16, bottom: 40, left: 56 };

  const MARKETS = [
    { name: "the article's", mkt: { A, B, C, S } },
    { name: "steeper both sides", mkt: { A: 90, B: 2, C: 10, S: 1.5 } },
    { name: "flatter both sides", mkt: { A: 200, B: 5, C: 40, S: 4 } },
  ];

  let sel = $state(0);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let m = $derived(MARKETS[sel].mkt);
  let pk = $derived(peak(m));
  let tm = $derived(tMax(m));
  let rev0 = $derived(pk.revenue);

  let x = $derived(linear(0, tm, M.left, W - M.right));
  let y = $derived(linear(0, rev0 * 1.05, H - M.bottom, M.top));

  let revPath = $derived.by(() => {
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const t = (tm * i) / 240;
      pts.push([x(t), y(revenue(t, m))]);
    }
    return pathOf(pts);
  });

  let readout = $derived.by(() => {
    const half1 = (pk.qRatio * 100).toFixed(1);
    const half2 = (pk.lossRatio * 100).toFixed(1);
    return `${MARKETS[sel].name}: the peak is at t = ${pk.tStar.toFixed(1)}, where quantity is ${half1}% of what it was and the deadweight loss is ${half2}% of the take — in every straight-line market, both halves are exact.`;
  });
</script>

<div class="fig" id="laffer-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="controls">
    <div class="presets" role="group" aria-label="Choose a market">
      {#each MARKETS as mk, i}
        <button class="pick" class:active={sel === i} onclick={() => (sel = i)}>{mk.name}</button>
      {/each}
    </div>
  </div>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Revenue against the tax rate, a parabola peaking where quantity halves and the deadweight loss is half the take">
      <g class="axis">
        {#each [0, 0.25, 0.5, 0.75, 1] as f}
          <line class="grid" x1={x(f * tm)} y1={M.top} x2={x(f * tm)} y2={H - M.bottom} />
          <text x={x(f * tm)} y={H - M.bottom + 15} text-anchor="middle">{(f * tm).toFixed(0)}</text>
        {/each}
        {#each [0, 0.5, 1] as f}
          <line class="grid" x1={M.left} y1={y(f * rev0)} x2={W - M.right} y2={y(f * rev0)} />
          <text x={M.left - 7} y={y(f * rev0) + 4} text-anchor="end">{(f * rev0).toFixed(0)}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">tax per unit</text>
        <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">revenue</text>
      </g>

      <path class="curve" d={revPath} />
      <line class="peak" x1={x(pk.tStar)} y1={M.top} x2={x(pk.tStar)} y2={H - M.bottom} />
      <circle class="dot" cx={x(pk.tStar)} cy={y(pk.revenue)} r="6" fill={SERIES[0]} />
      <text class="peak-lab" x={x(pk.tStar)} y={y(pk.revenue) - 10} text-anchor="middle">
        q halves · loss = half the take
      </text>
    </svg>
  </div>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .controls { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 0 0 0.8rem 0; }
  .presets { display: flex; flex-wrap: wrap; gap: 6px; }
  .pick { font-family: var(--font-mono); font-size: 0.78rem; padding: 5px 10px; border: 1px solid #c7cdd4; border-radius: 4px; background: white; color: var(--squidink); cursor: pointer; }
  .pick.active { border-color: var(--primary); color: var(--primary); font-weight: 600; }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .curve { fill: none; stroke: var(--primary); stroke-width: 2.5; }
  .peak { stroke: #8a94a2; stroke-width: 1; stroke-dasharray: 2 3; }
  .peak-lab { font-family: var(--font-mono); font-size: 10px; fill: #5a6672; }
  .dot { stroke: white; stroke-width: 1.5; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
</style>