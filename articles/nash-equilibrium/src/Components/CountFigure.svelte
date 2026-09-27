<script>
  /*
    How many cells survive, as a function of how big the game is.

    At n = 2 the bars are EXACT — all 576 ordinal games enumerated, no sampling.
    Above that they are simulated, and the Poisson(1) marks laid over them are
    the limit law with nothing fitted to the data underneath.
  */
  import { linear, clampW } from "../chart.js";
  import { enumerateAll, poissonOne } from "../enumerate.js";
  import { COUNT_BY_SIZE, TRIALS } from "../precomputed.js";
  import { SERIES } from "../palette.js";

  const H = 250;
  const M = { top: 14, right: 16, bottom: 44, left: 44 };
  const KS = [0, 1, 2, 3, 4, 5];

  const exact = enumerateAll();
  const SIZES = [2, ...COUNT_BY_SIZE.filter((r) => r.n !== 2).map((r) => r.n)];

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let n = $state(2);

  let isExact = $derived(n === 2);

  let shares = $derived.by(() => {
    if (isExact) return KS.map((k) => (exact.counts[k] ?? 0) / exact.games);
    const row = COUNT_BY_SIZE.find((r) => r.n === n);
    return KS.map((k) => row.p[k] ?? 0);
  });

  let mean = $derived.by(() => {
    if (isExact) return exact.counts.reduce((s, c, k) => s + k * c, 0) / exact.games;
    return COUNT_BY_SIZE.find((r) => r.n === n).mean;
  });

  let x = $derived(linear(-0.5, KS.length - 0.5, M.left, W - M.right));
  let y = $derived(linear(0, 0.8, H - M.bottom, M.top));
  let band = $derived((x(1) - x(0)) * 0.62);

  let caption = $derived(
    isExact
      ? `Every two-by-two game, counted one by one. The pink bar is the share where no cell survives. Pick a bigger game to see it grow.`
      : `${TRIALS.toLocaleString("en-GB")} random ${n} × ${n} games. The dark marks are a Poisson(1) distribution, with nothing fitted to the bars.`
  );

  // The prose claims the EXPECTATION is exactly one. What this figure has is a
  // sample mean, which is near one and not equal to it. Saying both keeps the
  // sentence and the chart from contradicting each other.
  let meanLine = $derived(
    isExact
      ? `Average number of surviving cells: 1, over all ${exact.games} games`
      : `Average over these games: ${mean.toFixed(3)}, against an expected value of 1`
  );

  let yTicks = [0, 0.2, 0.4, 0.6, 0.8];
</script>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{caption}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each yTicks as t}
          <line x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} class="grid" />
          <text x={M.left - 8} y={y(t) + 4} text-anchor="end">{(t * 100).toFixed(0)}%</text>
        {/each}
        <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} class="rule" />
        {#each KS as k}
          <text x={x(k)} y={H - M.bottom + 17} text-anchor="middle">{k === 5 ? "5+" : k}</text>
        {/each}
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 6} text-anchor="middle">
          surviving cells
        </text>
      </g>

      {#each KS as k}
        <rect
          class="bar"
          x={x(k) - band / 2}
          y={y(shares[k])}
          width={band}
          height={Math.max(0, H - M.bottom - y(shares[k]))}
          fill={k === 0 ? SERIES[1] : SERIES[0]}
          opacity={k === 0 ? 1 : 0.82}
        />
      {/each}

      {#if !isExact}
        {#each KS.slice(0, 5) as k}
          <line
            class="poisson"
            x1={x(k) - band / 2 - 4}
            y1={y(poissonOne(k))}
            x2={x(k) + band / 2 + 4}
            y2={y(poissonOne(k))}
            stroke="#232f3e"
          />
        {/each}
      {/if}
    </svg>
  </div>

  <p class="mean">{meanLine}</p>

  <div class="controls">
    <span class="ctl-label">game size</span>
    {#each SIZES as s}
      <button class="pill" class:active={n === s} onclick={() => (n = s)}>
        {s}&times;{s}
      </button>
    {/each}
  </div>
</div>

<style>
  .fig {
    max-width: 680px;
    margin: 1.8rem auto;
    padding: 0 1rem;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0 0 0.5rem 0;
    color: var(--squid-ink);
  }

  .plot svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .mean {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: #61707d;
    margin: 0.4rem 0 0 0;
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: #8a94a2;
  }

  .axis .axis-title {
    font-family: var(--font-main);
    font-size: 12px;
  }

  .grid {
    stroke: #e3e7ea;
    stroke-width: 1;
  }

  .rule {
    stroke: #8a94a2;
    stroke-width: 1;
  }

  .poisson {
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  .controls {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 0.8rem;
  }

  .ctl-label {
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #8a94a2;
    margin-right: 0.2rem;
  }

  .pill {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    padding: 4px 10px;
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
</style>
