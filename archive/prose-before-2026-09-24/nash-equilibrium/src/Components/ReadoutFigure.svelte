<script>
  /*
    The identity, over a range wide enough that a coincidence would have shown.

    Left panel: the breach rate against the fine. A horizontal line, and the
    check asserts its sampled values collapse to a single float.
    Right panel: 1/q* against the fine. A straight line whose intercept is
    exactly 1 and whose slope is exactly 1/G — so inverting the slope recovers
    a number that exists only inside the trader's head.
  */
  import { linear, ticks, pathOf, clampW, shortN } from "../chart.js";
  import { BASE, mixed } from "../game.js";
  import { fineSweep } from "../datasets.js";
  import { SERIES } from "../palette.js";
  import katexify from "../katexify.js";

  const H = 230;
  const M = { top: 16, right: 14, bottom: 42, left: 48 };
  const F_MAX = 1200;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  // Splitting a row exactly in half is a knife-edge: (w - gap)/2 once asked for
  // 604px of a 603px row and flex-wrap dropped a panel below the fold.
  let twoUp = $derived(W >= 580);
  let PW = $derived(twoUp ? Math.floor((W - 18 - 2) / 2) : W);

  let cursor = $state(340);

  const data = fineSweep(240, F_MAX);

  let x = $derived(linear(0, F_MAX, M.left, PW - M.right));
  let yP = $derived(linear(0, 0.3, H - M.bottom, M.top));
  let yI = $derived(linear(0, 1 + F_MAX / BASE.G, H - M.bottom, M.top));

  let pPath = $derived(pathOf(data.map((d) => [x(d.F), yP(d.p)])));
  let iPath = $derived(pathOf(data.map((d) => [x(d.F), yI(d.inv)])));

  let here = $derived(mixed({ ...BASE, F: cursor }));

  let slope = $derived.by(() => {
    const a = 1 / mixed({ ...BASE, F: 10 }).q;
    const b = 1 / mixed({ ...BASE, F: 1010 }).q;
    return (b - a) / 1000;
  });

  let recovered = $derived(1 / slope);

  let fTicks = $derived(ticks(0, F_MAX, 4));
  let pTicks = [0, 0.1, 0.2, 0.3];
  let iTicks = $derived(ticks(0, 1 + F_MAX / BASE.G, 4));

  let readout = $derived(
    `At a fine of ${Math.round(cursor)}: the breach rate is ${(here.p * 100).toFixed(1)}% and the audit rate is ${(here.q * 100).toFixed(2)}%.`
  );

  let identity = katexify(`\\frac{1}{q^{\\ast}} = 1 + \\frac{F}{G}`, false);
</script>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="panels" class:stacked={!twoUp}>
    <div class="panel">
      <p class="panel-title">Breach rate</p>
      <svg width={PW} height={H} viewBox={`0 0 ${PW} ${H}`}>
        <g class="axis">
          {#each pTicks as t}
            <line x1={M.left} y1={yP(t)} x2={PW - M.right} y2={yP(t)} class="grid" />
            <text x={M.left - 8} y={yP(t) + 4} text-anchor="end">{(t * 100).toFixed(0)}%</text>
          {/each}
          {#each fTicks as t}
            <text x={x(t)} y={H - M.bottom + 16} text-anchor="middle">{shortN(t)}</text>
          {/each}
          <line x1={M.left} y1={H - M.bottom} x2={PW - M.right} y2={H - M.bottom} class="rule" />
          <text class="axis-title" x={(M.left + PW - M.right) / 2} y={H - 6} text-anchor="middle">
            fine, F
          </text>
        </g>
        <path class="curve breach" d={pPath} stroke={SERIES[1]} />
        <line class="cursor" x1={x(cursor)} y1={M.top} x2={x(cursor)} y2={H - M.bottom} />
        <circle class="dot breach-dot" cx={x(cursor)} cy={yP(here.p)} r="5" fill={SERIES[1]} />
      </svg>
    </div>

    <div class="panel">
      <p class="panel-title">1 / audit rate</p>
      <svg width={PW} height={H} viewBox={`0 0 ${PW} ${H}`}>
        <g class="axis">
          {#each iTicks as t}
            <line x1={M.left} y1={yI(t)} x2={PW - M.right} y2={yI(t)} class="grid" />
            <text x={M.left - 8} y={yI(t) + 4} text-anchor="end">{shortN(t)}</text>
          {/each}
          {#each fTicks as t}
            <text x={x(t)} y={H - M.bottom + 16} text-anchor="middle">{shortN(t)}</text>
          {/each}
          <line x1={M.left} y1={H - M.bottom} x2={PW - M.right} y2={H - M.bottom} class="rule" />
          <text class="axis-title" x={(M.left + PW - M.right) / 2} y={H - 6} text-anchor="middle">
            fine, F
          </text>
        </g>
        <path class="curve inverse" d={iPath} stroke={SERIES[0]} />
        <line class="cursor" x1={x(cursor)} y1={M.top} x2={x(cursor)} y2={H - M.bottom} />
        <circle class="dot inverse-dot" cx={x(cursor)} cy={yI(1 / here.q)} r="5" fill={SERIES[0]} />
      </svg>
    </div>
  </div>

  <label class="scrub">
    <span>fine</span>
    <input type="range" min="0" max={F_MAX} step="10" bind:value={cursor} />
  </label>

  <p class="identity">{@html identity}</p>

  <p class="note">
    The right-hand line has an intercept of exactly 1 and a slope of exactly
    1&#8202;/&#8202;{BASE.G}. If you measure how often the risk desk audits and
    invert the slope, you get {recovered.toFixed(0)} back. That's the trader's
    private gain from a breach, read off the behaviour of the person watching
    them.
  </p>
</div>

<style>
  .fig {
    max-width: 760px;
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
    margin: 0 0 0.5rem 0;
    color: var(--squid-ink);
  }

  .panels {
    display: flex;
    gap: 18px;
  }

  .panels.stacked {
    flex-direction: column;
    gap: 8px;
  }

  .panel-title {
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: #61707d;
    margin: 0 0 2px 0;
  }

  .panel svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .curve {
    fill: none;
    stroke-width: 2.5;
  }

  .cursor {
    stroke: #8a94a2;
    stroke-width: 1;
    stroke-dasharray: 3 3;
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
    margin-top: 0.8rem;
  }

  .scrub span {
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #8a94a2;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .scrub input {
    flex: 1;
    accent-color: var(--violet);
  }

  .identity {
    text-align: center;
    margin: 0.9rem 0 0 0;
  }

  .note {
    font-family: var(--font-main);
    font-size: 0.9rem;
    line-height: 1.6;
    color: #3c4b57;
    max-width: 560px;
    margin: 0.8rem auto 0 auto;
    text-align: center;
  }
</style>
