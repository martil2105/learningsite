<script>
  /*
    The hook. One slider that is supposed to work and does not.

    The reader drags the fine across three orders of magnitude aiming at the
    breach rate, and the breach bar does not move by one pixel — which is a
    claim check-browser.mjs asserts in rendered pixels, not a figure of speech.
    The second slider is the one that works, so the article is not merely
    telling them nothing can be done.
  */
  import { linear, clampW } from "../chart.js";
  import { BASE, matrices, mixed, values } from "../game.js";
  import { SERIES } from "../palette.js";
  import PayoffMatrix from "./PayoffMatrix.svelte";
  import katexify from "../katexify.js";

  const H = 150;
  const M = { top: 30, right: 96, bottom: 34, left: 84 };
  const F_MIN = 20;
  const F_MAX = 10000;
  const C_MIN = 1;
  const C_MAX = 24;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let F = $state(BASE.F);
  let C = $state(BASE.C);

  let params = $derived({ ...BASE, F: Math.round(F), C: Math.round(C) });
  let eq = $derived(mixed(params));
  let mats = $derived(matrices(params));
  let payoffs = $derived(values(params));

  // Where the breach rate started, as a fixed reference the bar is compared to.
  const ANCHOR = mixed(BASE).p;

  let x = $derived(linear(0, 1, M.left, W - M.right));

  const ROWS = [
    { key: "p", label: "breach rate", colour: SERIES[1] },
    { key: "q", label: "audit rate", colour: SERIES[0] },
  ];
  const rowY = (i) => M.top + 14 + i * 46;

  let moved = $derived(Math.abs(eq.p - ANCHOR));

  let verdict = $derived(
    moved === 0
      ? `The fine is at ${Math.round(F).toLocaleString("en-GB")} and the breach rate has not moved from ${(ANCHOR * 100).toFixed(1)}%.`
      : `The breach rate is ${(eq.p * 100).toFixed(2)}%, ${(moved * 100).toFixed(2)} points from where it started — and the audit cost is what moved it.`
  );

  let formulaP = katexify(`p^{\\ast} = \\dfrac{C}{V + L}`, false);
  let formulaQ = katexify(`q^{\\ast} = \\dfrac{G}{G + F}`, false);
</script>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <div class="lab">
    <PayoffMatrix A={mats.A} B={mats.B} />

    <div class="plot">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <!-- the reference the breach bar is supposed to leave and does not -->
        <line
          class="anchor"
          x1={x(ANCHOR)}
          y1={M.top - 8}
          x2={x(ANCHOR)}
          y2={H - M.bottom + 4}
        />
        <text class="anchor-label" x={x(ANCHOR)} y={M.top - 14} text-anchor="middle">
          where it started
        </text>

        {#each ROWS as row, i}
          <text class="bar-label" x={M.left - 10} y={rowY(i) + 15} text-anchor="end">
            {row.label}
          </text>
          <rect class="track" x={M.left} y={rowY(i)} width={W - M.right - M.left} height={22} />
          <rect
            class={`bar ${row.key}`}
            x={M.left}
            y={rowY(i)}
            width={Math.max(0, x(eq[row.key]) - M.left)}
            height={22}
            fill={row.colour}
          />
          <text class={`bar-value ${row.key}`} x={W - M.right + 10} y={rowY(i) + 16}>
            {(eq[row.key] * 100).toFixed(1)}%
          </text>
        {/each}

        <g class="axis">
          {#each [0, 0.25, 0.5, 0.75, 1] as t}
            <text x={x(t)} y={H - M.bottom + 22} text-anchor="middle">{t * 100}%</text>
          {/each}
        </g>
      </svg>
    </div>

    <p class="verdict">{verdict}</p>

    <div class="sliders">
      <label class="slider">
        <span class="s-name">
          fine, <em>F</em>
          <b>{Math.round(F).toLocaleString("en-GB")}</b>
        </span>
        <input type="range" min={F_MIN} max={F_MAX} step="10" bind:value={F} />
        <span class="s-hint">the trader's punishment</span>
      </label>

      <label class="slider">
        <span class="s-name">
          audit cost, <em>C</em>
          <b>{Math.round(C)}</b>
        </span>
        <input type="range" min={C_MIN} max={C_MAX} step="1" bind:value={C} />
        <span class="s-hint">the risk desk's cost of looking</span>
      </label>
    </div>

    <div class="presets">
      <span class="ctl-label">jump to</span>
      {#each [20, 140, 340, 10000] as f}
        <button class="pill" class:active={Math.round(F) === f} onclick={() => (F = f)}>
          F = {f.toLocaleString("en-GB")}
        </button>
      {/each}
      <button class="pill ghost" onclick={() => { F = BASE.F; C = BASE.C; }}>reset</button>
    </div>

    <div class="forms">
      <span class="form">{@html formulaP}</span>
      <span class="form">{@html formulaQ}</span>
    </div>

    <p class="payoff-line">
      Expected payoffs at this setting: trader {payoffs.row.toFixed(1)}, risk desk
      {payoffs.col.toFixed(1)}.
    </p>
  </div>
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

  .lab {
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 1.4rem 1rem 1.1rem 1rem;
  }

  .plot {
    margin-top: 1.2rem;
  }

  .plot svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .track {
    fill: #eef1f3;
  }

  .anchor {
    stroke: #232f3e;
    stroke-width: 1.5;
    stroke-dasharray: 3 3;
  }

  .anchor-label {
    font-family: var(--font-main);
    font-size: 10.5px;
    fill: #61707d;
  }

  .bar-label {
    font-family: var(--font-main);
    font-size: 12.5px;
    fill: var(--squid-ink);
  }

  .bar-value {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 700;
    fill: var(--squid-ink);
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 10.5px;
    fill: #8a94a2;
  }

  .verdict {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--squid-ink);
    min-height: 2.9em;
    margin: 0.4rem 0 0.9rem 0;
    text-align: center;
  }

  .sliders {
    display: flex;
    gap: 1.2rem;
    flex-wrap: wrap;
  }

  .slider {
    flex: 1 1 240px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .s-name {
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: var(--squid-ink);
  }

  .s-name em {
    font-family: var(--font-mono);
    font-style: normal;
    color: #61707d;
  }

  .s-name b {
    font-family: var(--font-mono);
    float: right;
  }

  .s-hint {
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #8a94a2;
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--violet);
  }

  .presets {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .ctl-label {
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #8a94a2;
    text-transform: uppercase;
    letter-spacing: 0.06em;
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

  .pill.ghost {
    color: #8a94a2;
  }

  .forms {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .payoff-line {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: #8a94a2;
    text-align: center;
    margin: 0.7rem 0 0 0;
  }
</style>
