<script>
  /*
    The levers that do work, and they all belong to the person doing the
    watching. p* = C/(V+L), so the breach rate is the risk desk's audit cost
    divided by what a breach is worth to them — and the trader's numbers are
    not in it anywhere.
  */
  import { linear, ticks, pathOf, clampW } from "../chart.js";
  import { BASE, mixed } from "../game.js";
  import { leverSweep } from "../datasets.js";
  import { SERIES } from "../palette.js";

  const H = 240;
  const M = { top: 18, right: 18, bottom: 46, left: 52 };

  const LEVERS = [
    { key: "C", label: "cost of an audit", lo: 1, hi: 24, colour: SERIES[0], owner: "risk desk" },
    { key: "L", label: "damage from a missed breach", lo: 5, hi: 90, colour: SERIES[2], owner: "risk desk" },
    { key: "F", label: "fine on the trader", lo: 20, hi: 1000, colour: SERIES[1], owner: "trader" },
  ];

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let active = $state("C");

  let lever = $derived(LEVERS.find((l) => l.key === active));
  let data = $derived(leverSweep(lever.key, lever.lo, lever.hi, 160));

  let x = $derived(linear(lever.lo, lever.hi, M.left, W - M.right));
  let y = $derived(linear(0, 0.32, H - M.bottom, M.top));

  let path = $derived(pathOf(data.map((d) => [x(d.v), y(d.p)])));

  let span = $derived.by(() => {
    const lo = Math.min(...data.map((d) => d.p));
    const hi = Math.max(...data.map((d) => d.p));
    return { lo, hi, moves: hi - lo > 0 };
  });

  let verdict = $derived(
    span.moves
      ? `Sweeping the ${lever.label} across its whole range moves the breach rate from ${(span.lo * 100).toFixed(1)}% to ${(span.hi * 100).toFixed(1)}%.`
      : `Sweeping the ${lever.label} across its whole range moves the breach rate by nothing at all. It stays at ${(span.lo * 100).toFixed(1)}%.`
  );

  let xTicks = $derived(ticks(lever.lo, lever.hi, 5));
</script>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{verdict}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each [0, 0.08, 0.16, 0.24, 0.32] as t}
          <line x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} class="grid" />
          <text x={M.left - 8} y={y(t) + 4} text-anchor="end">{(t * 100).toFixed(0)}%</text>
        {/each}
        {#each xTicks as t}
          <text x={x(t)} y={H - M.bottom + 16} text-anchor="middle">{t}</text>
        {/each}
        <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} class="rule" />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 6} text-anchor="middle">
          {lever.label}
        </text>
      </g>

      <path class={`curve lever-${lever.key}`} d={path} stroke={lever.colour} />
    </svg>
  </div>

  <div class="presets">
    {#each LEVERS as l}
      <button class="pill" class:active={active === l.key} onclick={() => (active = l.key)}>
        {l.label}
      </button>
    {/each}
  </div>

  <p class="owner">
    This one belongs to the <b>{lever.owner}</b>.
  </p>
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

  .presets {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-top: 0.8rem;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.8rem;
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

  .owner {
    font-family: var(--font-main);
    font-size: 0.88rem;
    color: #61707d;
    margin: 0.7rem 0 0 0;
  }
</style>
