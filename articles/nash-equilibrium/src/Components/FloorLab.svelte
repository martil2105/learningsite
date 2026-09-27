<script>
  /*
    Both regimes in one picture.

    A regulator mandates a MINIMUM audit rate. Below the threshold the floor is
    slack, the risk desk chooses freely, and the fine does nothing. Above it the
    risk desk is forced past what the trader will tolerate and the trader
    complies outright. The step is at G(1-qbar)/qbar and the check bisects the
    realised breach rate to find it.
  */
  import { linear, ticks, pathOf, clampW, shortN } from "../chart.js";
  import { BASE, criticalFine } from "../game.js";
  import { floorSweep, FLOOR_PRESETS } from "../datasets.js";
  import { SERIES } from "../palette.js";
  import katexify from "../katexify.js";

  const H = 260;
  const M = { top: 22, right: 22, bottom: 46, left: 56 };
  const F_MAX = 1200;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let qbar = $state(0.25);

  let sweep = $derived(floorSweep(qbar, 400, F_MAX));
  let critical = $derived(criticalFine(BASE, qbar));

  let x = $derived(linear(0, F_MAX, M.left, W - M.right));
  let y = $derived(linear(0, 0.2, H - M.bottom, M.top));

  // Two segments rather than one path: a single polyline across the jump draws
  // a diagonal through a discontinuity that is not there.
  let flat = $derived(
    sweep.curve.filter((d) => d.F < critical).map((d) => [x(d.F), y(0.15)])
  );
  let zero = $derived(
    sweep.curve.filter((d) => d.F > critical).map((d) => [x(d.F), y(0)])
  );

  let inRange = $derived(critical <= F_MAX);

  let verdict = $derived.by(() => {
    if (qbar <= 0) {
      return "With no floor, the risk desk audits as much as it likes, and no fine of any size changes the breach rate.";
    }
    if (!inRange) {
      return `A floor of ${(qbar * 100).toFixed(0)}% needs a fine of ${Math.round(critical).toLocaleString("en-GB")} before it binds, which is further along than this chart goes.`;
    }
    return `With a floor of ${(qbar * 100).toFixed(0)}%, the fine starts to bite at ${Math.round(critical)}. Below that it does nothing, and above it the trader stops breaching.`;
  });

  let fTicks = $derived(ticks(0, F_MAX, 5));
  let formula = katexify(`F_{\\text{crit}} = \\frac{G(1 - \\bar q)}{\\bar q}`, false);
</script>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{verdict}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each [0, 0.05, 0.1, 0.15, 0.2] as t}
          <line x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} class="grid" />
          <text x={M.left - 8} y={y(t) + 4} text-anchor="end">{(t * 100).toFixed(0)}%</text>
        {/each}
        {#each fTicks as t}
          <text x={x(t)} y={H - M.bottom + 16} text-anchor="middle">{shortN(t)}</text>
        {/each}
        <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} class="rule" />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 6} text-anchor="middle">
          fine, F
        </text>
      </g>

      {#if inRange}
        <line class="kink" x1={x(critical)} y1={M.top} x2={x(critical)} y2={H - M.bottom} />
        <!-- Anchor the label at the end the curve is NOT at, or it lands on the line. -->
        <text class="kink-label" x={x(critical) + 6} y={M.top + 12} text-anchor="start">
          F = {Math.round(critical)}
        </text>
      {/if}

      {#if flat.length > 1}
        <path class="curve slack" d={pathOf(flat)} stroke={SERIES[1]} />
      {/if}
      {#if zero.length > 1}
        <path class="curve bound" d={pathOf(zero)} stroke={SERIES[2]} />
      {/if}
    </svg>
  </div>

  <label class="scrub">
    <span>audit floor</span>
    <input type="range" min="0" max="0.6" step="0.01" bind:value={qbar} />
    <b>{(qbar * 100).toFixed(0)}%</b>
  </label>

  <div class="presets">
    <span class="ctl-label">floors</span>
    {#each FLOOR_PRESETS as f}
      <button class="pill" class:active={Math.abs(qbar - f) < 0.005} onclick={() => (qbar = f)}>
        {(f * 100).toFixed(0)}%
      </button>
    {/each}
  </div>

  <p class="identity">{@html formula}</p>
</div>

<style>
  .fig {
    max-width: 700px;
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
    min-height: 3em;
  }

  .plot svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .curve {
    fill: none;
    stroke-width: 3;
  }

  .kink {
    stroke: #232f3e;
    stroke-width: 1.5;
    stroke-dasharray: 4 3;
  }

  .kink-label {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: #232f3e;
    stroke: #fff;
    stroke-width: 3px;
    paint-order: stroke;
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

  .scrub {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.9rem;
  }

  .scrub span {
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #8a94a2;
  }

  .scrub input {
    flex: 1;
    accent-color: var(--violet);
  }

  .scrub b {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    min-width: 3ch;
  }

  .presets {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 0.7rem;
  }

  .ctl-label {
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #8a94a2;
  }

  .pill {
    font-family: var(--font-mono);
    font-size: 0.78rem;
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

  .identity {
    text-align: center;
    margin: 0.9rem 0 0 0;
  }
</style>
