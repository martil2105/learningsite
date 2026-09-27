<script>
  /*
    The limit. Left: A's share as a function of each side's impatience — it
    rises in the other side's rate and falls in its own. Right: how far the
    finite-period share sits from that limit, against the period length on
    log-log axes — a straight line of slope exactly 1, which is the claim
    "moving first is worth O(Δ)".
  */
  import { R_A, R_B } from "../datasets.js";
  import { rubinstein, discount, limitShare } from "../bargain.js";
  import { log, linear, clampW, pathOf } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 250;
  const M = { top: 22, right: 16, bottom: 42, left: 50 };
  const RB_MAX = 0.5;
  const DTS = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001];
  const PINK = "#df2a5d";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let twoUp = $derived(W >= 620);
  let pw = $derived(twoUp ? Math.floor((W - 28 - 2) / 2) : W);

  let xR = $derived(linear(0, RB_MAX, M.left, pw - M.right));
  let yS = $derived(linear(0, 1, H - M.bottom, M.top));
  let xD = $derived(log(0.001, 1, M.left, pw - M.right));
  let yE = $derived(log(1e-5, 1e-1, H - M.bottom, M.top));

  const RBS = Array.from({ length: 121 }, (_, i) => (RB_MAX * i) / 120);
  const OWN = RBS.map((rb) => [rb, limitShare(R_A, rb)]);
  const OTHER = RBS.map((ra) => [ra, limitShare(ra, R_B)]);
  let ownPath = $derived(pathOf(OWN.map(([r, s]) => [xR(r), yS(s)])));
  let otherPath = $derived(pathOf(OTHER.map(([r, s]) => [xR(r), yS(s)])));

  const ERRORS = DTS.map((dt) => ({
    dt,
    err: Math.abs(rubinstein(discount(R_A, dt), discount(R_B, dt)) - limitShare(R_A, R_B)),
  }));
  let errPath = $derived(pathOf(ERRORS.map((e) => [xD(e.dt), yE(e.err)])));

  const here = limitShare(R_A, R_B);

  const D_TICKS = [0.001, 0.01, 0.1, 1];
  const E_TICKS = [1e-5, 1e-4, 1e-3, 1e-2];
</script>

<div class="fig" id="patience-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">How impatience sets A's share, and what a gap between offers adds</p>

  <div class="panels" class:two-up={twoUp}>
    <div class="panel">
      <p class="panel-title">A's share against each impatience rate</p>
      <svg width={pw} height={H} viewBox={`0 0 ${pw} ${H}`} role="img"
        aria-label="A's limit share rises in the other side's impatience and falls in its own">
        <g class="axis">
          {#each [0, 0.1, 0.2, 0.3, 0.4, 0.5] as t}
            <line class="grid" x1={xR(t)} y1={M.top} x2={xR(t)} y2={H - M.bottom} />
            <text x={xR(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
          {/each}
          {#each [0, 0.25, 0.5, 0.75, 1] as t}
            <line class="grid" x1={M.left} y1={yS(t)} x2={pw - M.right} y2={yS(t)} />
            <text x={M.left - 7} y={yS(t) + 4} text-anchor="end">{(t * 100).toFixed(0)}</text>
          {/each}
          <line class="rule" x1={M.left} y1={H - M.bottom} x2={pw - M.right} y2={H - M.bottom} />
          <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
          <text class="axis-title" x={(M.left + pw - M.right) / 2} y={H - 4} text-anchor="middle">rate (per unit time)</text>
        </g>
        <path class="curve" d={ownPath} />
        <path class="curve two" d={otherPath} />
        <circle class="dot" cx={xR(R_B)} cy={yS(here)} r="6" fill={SERIES[0]} />
        <text class="lab one" x={xR(0.2)} y={yS(0.95)}>B's rate varies</text>
        <text class="lab" x={xR(0.3)} y={yS(0.12)} fill={PINK}>A's rate varies</text>
      </svg>
    </div>

    <div class="panel">
      <p class="panel-title">Distance to the limit, against the period Δ</p>
      <svg width={pw} height={H} viewBox={`0 0 ${pw} ${H}`} role="img"
        aria-label="The gap between the finite-period share and the limit, a straight line of slope one on log-log axes">
        <g class="axis">
          {#each D_TICKS as t}
            <line class="grid" x1={xD(t)} y1={M.top} x2={xD(t)} y2={H - M.bottom} />
            <text x={xD(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
          {/each}
          {#each E_TICKS as t}
            <line class="grid" x1={M.left} y1={yE(t)} x2={pw - M.right} y2={yE(t)} />
            <text x={M.left - 7} y={yE(t) + 4} text-anchor="end">{t.toExponential(0)}</text>
          {/each}
          <line class="rule" x1={M.left} y1={H - M.bottom} x2={pw - M.right} y2={H - M.bottom} />
          <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
          <text class="axis-title" x={(M.left + pw - M.right) / 2} y={H - 4} text-anchor="middle">period length Δ (log)</text>
        </g>
        <path class="curve" d={errPath} />
        {#each ERRORS as e}
          <circle class="pt" cx={xD(e.dt)} cy={yE(e.err)} r="4" fill={SERIES[0]} />
        {/each}
      </svg>
    </div>
  </div>

  <p class="caption">
    The blue dot marks our two firms, with A's rate at {R_A} and B's at {R_B}.
    In the second chart, moving one grid line to the left makes the gap
    between offers ten times shorter, and A's edge from moving first shrinks
    about ten times too.
  </p>
</div>

<style>
  .fig { max-width: 900px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .panels { display: flex; flex-direction: column; gap: 12px; }
  .panels.two-up { flex-direction: row; align-items: flex-start; }
  .panel { flex: 1 1 0; min-width: 0; }
  .panel-title { font-family: var(--font-main); font-size: 0.85rem; color: #5a6672; margin: 0 0 0.3rem 0; }
  .panel svg { display: block; max-width: 100%; height: auto; }
  .curve { fill: none; stroke: var(--primary); stroke-width: 2.5; }
  .curve.two { stroke: #df2a5d; }
  .pt { stroke: white; stroke-width: 1; }
  .dot { stroke: white; stroke-width: 1.5; }
  .lab { font-family: var(--font-mono); font-size: 10px; }
  .lab.one { fill: var(--primary); }
  .caption { font-family: var(--font-main); font-size: 0.88rem; line-height: 1.5; color: #5a6672; margin: 0.6rem 0 0 0; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
</style>
