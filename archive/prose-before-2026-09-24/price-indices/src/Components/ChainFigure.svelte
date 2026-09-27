<script>
  /*
    Chaining, month by month. Two price paths: energy doubling in twelve equal
    steps, and a good that goes a quarter off every other month. Each index is
    chained monthly with the basket actually bought that month. On the second
    path the true index is back at 1 every even month; chained Fisher is too
    (check-browser.mjs asserts its points sit on the truth's), and chained
    Laspeyres ratchets up.
  */
  import { chained, smoothPath, salePath } from "../indices.js";
  import { W_ENERGY, SMOOTH_MONTHS, SALE_SHARE, SALE_PRICE, SALE_MONTHS } from "../datasets.js";
  import { SERIES, INK } from "../palette.js";
  import { linear, ticks, clampW, pathOf } from "../chart.js";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 260;
  const M = { top: 12, right: 14, bottom: 38, left: 46 };

  let mode = $state("sale");
  let sigma = $state(1);

  let series = $derived(
    mode === "smooth"
      ? chained(smoothPath(2, SMOOTH_MONTHS), [W_ENERGY, 1 - W_ENERGY], sigma)
      : chained(salePath(SALE_PRICE, SALE_MONTHS), [SALE_SHARE, 1 - SALE_SHARE], sigma)
  );
  let T = $derived(series.length - 1);
  let lo = $derived(Math.min(...series.flatMap((p) => [p.L, p.P, p.F, p.C])));
  let hi = $derived(Math.max(...series.flatMap((p) => [p.L, p.P, p.F, p.C])));
  let pad = $derived((hi - lo) * 0.08 + 0.005);
  let x = $derived(linear(0, T, M.left, W - M.right));
  let y = $derived(linear(lo - pad, hi + pad, H - M.bottom, M.top));
  let yTicks = $derived(ticks(lo - pad, hi + pad, 5));
  let xTicks = $derived(ticks(0, T, 6));

  const KEYS = [
    { k: "L", label: "chained fixed basket", colour: SERIES[1] },
    { k: "P", label: "chained new basket", colour: SERIES[2] },
    { k: "F", label: "chained Fisher", colour: SERIES[0] },
    { k: "C", label: "true cost of living", colour: INK },
  ];
  let paths = $derived(KEYS.map((K) => ({ ...K, d: pathOf(series.map((p, t) => [x(t), y(p[K.k])])) })));
  const pct = (v) => `${v >= 1 ? "+" : "−"}${Math.abs((v - 1) * 100).toFixed(1)}%`;
  let end = $derived(series[T]);
  let readout = $derived(
    mode === "smooth"
      ? `After ${T} months: chained fixed basket ${pct(end.L)}, chained Fisher ${pct(end.F)}, true ${pct(end.C)}.`
      : `After ${T} months, with prices exactly where they started: chained fixed basket ${pct(end.L)}, chained new basket ${pct(end.P)}, chained Fisher ${pct(end.F)}, true ${pct(end.C)}.`
  );
</script>

<div class="fig" id="chain-figure">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>
    <div class="controls">
      <button class="pill" class:active={mode === "smooth"} onclick={() => (mode = "smooth")}>energy doubles over a year</button>
      <button class="pill" class:active={mode === "sale"} onclick={() => (mode = "sale")}>a good on sale every other month</button>
      <span class="sig">
        <span class="ctl-label">σ</span>
        {#each [0.5, 1, 2] as v}
          <button class="pill mono" class:active={sigma === v} onclick={() => (sigma = v)}>{v}</button>
        {/each}
      </span>
    </div>
    <p class="fig-title">{readout}</p>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each yTicks as t}
          <line class="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
          <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{t.toFixed(2)}</text>
        {/each}
        {#each xTicks as t}
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">month</text>
      </g>
      {#each paths as p}
        <path class={`series ${p.k}`} d={p.d} stroke={p.colour} />
      {/each}
      {#each series as pt, t}
        {#if t % 2 === 0}
          <circle class="c-pt" data-t={t} cx={x(t)} cy={y(pt.C)} r="2.5" fill={INK} />
          <circle class="f-pt" data-t={t} cx={x(t)} cy={y(pt.F)} r="4.5" fill="none" stroke={SERIES[0]} stroke-width="1.5" />
        {/if}
      {/each}
    </svg>
    <p class="legend">
      {#each KEYS as K}
        <span class="key"><span class="swatch" class:dashed={K.k === "C"} style={`border-color:${K.colour}`}></span>{K.label}</span>
      {/each}
    </p>
  </div>
</div>

<style>
  .fig {
    max-width: 680px;
    margin: 1.8rem auto;
    padding: 0 1rem;
  }

  .card {
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 0.9rem 16px;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  .sig {
    display: inline-flex;
    gap: 0.3rem;
    align-items: center;
    margin-left: auto;
  }

  .ctl-label {
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #8a94a2;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.78rem;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill.mono {
    font-family: var(--font-mono);
  }

  .pill.active {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 0.4rem 0;
    min-height: 3em;
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

  .series {
    fill: none;
    stroke-width: 2;
  }

  .series.C {
    stroke-dasharray: 5 4;
    stroke-width: 1.6;
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
    width: 18px;
    border-top: 2.5px solid;
  }

  .swatch.dashed {
    border-top-style: dashed;
  }
</style>
