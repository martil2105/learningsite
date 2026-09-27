<script>
  /*
    The steered run. Eastport, month by month, after one of two shocks: hiring
    halves (f 47% → 23.5%) or layoffs double (s 3% → 6%). The first panel is
    the unemployment rate, the second the number of people losing their jobs
    each month, per 1,000 workers. Both shocks head for exactly the same rate;
    only the second one ever shows up as more layoffs.
  */
  import { shockRun, steady } from "../flows.js";
  import { TOWN_A, FREEZE, LAYOFFS, RUN_MONTHS } from "../datasets.js";
  import { SERIES } from "../palette.js";
  import { linear, clampW, pathOf } from "../chart.js";

  const runs = [
    { k: "freeze", label: "hiring halves", colour: SERIES[0], rows: shockRun(TOWN_A, FREEZE, RUN_MONTHS) },
    { k: "layoffs", label: "layoffs double", colour: SERIES[1], rows: shockRun(TOWN_A, LAYOFFS, RUN_MONTHS) },
  ];
  const target = steady(FREEZE.s, FREEZE.f);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let twoUp = $derived(W >= 600);
  let panelW = $derived(twoUp ? Math.floor((W - 24 - 2) / 2) : W);
  const H = 210;
  const M = { top: 12, right: 12, bottom: 34, left: 40 };
  let x = $derived(linear(0, RUN_MONTHS, M.left, panelW - M.right));
  let yU = $derived(linear(0.04, 0.12, H - M.bottom, M.top));
  let yL = $derived(linear(0, 60, H - M.bottom, M.top));

  let month = $state(0);
  let timer = $state(null);
  function play() {
    if (timer) return;
    if (month >= RUN_MONTHS) month = 0;
    timer = setInterval(() => {
      month = Math.min(RUN_MONTHS, month + 1);
      if (month >= RUN_MONTHS) stop();
    }, 180);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }
  $effect(() => () => stop());

  let shown = $derived(runs.map((r) => ({ ...r, upto: r.rows.slice(0, month + 1) })));
  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  let readout = $derived.by(() => {
    const [a, b] = runs.map((r) => r.rows[month]);
    if (month === 0) return `Before the shock: ${pct(a.u)} unemployed, and ${(1000 * a.losers).toFixed(1)} of every 1,000 workers lose their job each month.`;
    return `Month ${month}. Hiring halved: ${pct(a.u)} unemployed, ${(1000 * a.losers).toFixed(1)} per 1,000 lost their job this month. Layoffs doubled: ${pct(b.u)} unemployed, ${(1000 * b.losers).toFixed(1)} per 1,000 lost their job.`;
  });
</script>

<div class="fig" id="freeze-run">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>
    <div class="controls">
      <button class="pill" onclick={() => { stop(); month = Math.max(0, month - 1); }} aria-label="previous month">◀</button>
      <button class="pill next" onclick={() => { stop(); month = Math.min(RUN_MONTHS, month + 1); }}>next month</button>
      <button class="pill play" onclick={() => (timer ? stop() : play())}>{timer ? "pause" : "play"}</button>
      <button class="pill" onclick={() => { stop(); month = 0; }}>reset</button>
      <input class="scrub" type="range" min="0" max={RUN_MONTHS} step="1" value={month} oninput={(e) => { stop(); month = +e.currentTarget.value; }} aria-label="month" />
    </div>
    <p class="fig-title">{readout}</p>
    <div class="pair" class:two-up={twoUp}>
      <div class="cell">
        <p class="panel-title">Unemployment rate</p>
        <svg class="u-panel" width={panelW} height={H} viewBox={`0 0 ${panelW} ${H}`}>
          {#each [0.04, 0.06, 0.08, 0.1, 0.12] as t}
            <line class="grid" x1={M.left} x2={panelW - M.right} y1={yU(t)} y2={yU(t)} />
            <text class="tick" x={M.left - 5} y={yU(t) + 4} text-anchor="end">{Math.round(t * 100)}%</text>
          {/each}
          <line class="target" x1={M.left} x2={panelW - M.right} y1={yU(target)} y2={yU(target)} />
          {#each [0, 6, 12, 18, 24] as t}
            <text class="tick" x={x(t)} y={H - M.bottom + 14} text-anchor="middle">{t}</text>
          {/each}
          <text class="axis-title" x={(M.left + panelW - M.right) / 2} y={H - 4} text-anchor="middle">month</text>
          {#each shown as r}
            <path class={`u-line ${r.k}`} d={pathOf(r.upto.map((p) => [x(p.t), yU(p.u)]))} stroke={r.colour} />
            <circle class={`u-dot ${r.k}`} data-u={r.rows[month].u} cx={x(month)} cy={yU(r.rows[month].u)} r="4.5" fill={r.colour} />
          {/each}
        </svg>
      </div>
      <div class="cell">
        <p class="panel-title">People losing their job this month, per 1,000 workers</p>
        <svg class="l-panel" width={panelW} height={H} viewBox={`0 0 ${panelW} ${H}`}>
          {#each [0, 20, 40, 60] as t}
            <line class="grid" x1={M.left} x2={panelW - M.right} y1={yL(t)} y2={yL(t)} />
            <text class="tick" x={M.left - 5} y={yL(t) + 4} text-anchor="end">{t}</text>
          {/each}
          <line class="before" x1={M.left} x2={panelW - M.right} y1={yL(1000 * runs[0].rows[0].losers)} y2={yL(1000 * runs[0].rows[0].losers)} />
          {#each [0, 6, 12, 18, 24] as t}
            <text class="tick" x={x(t)} y={H - M.bottom + 14} text-anchor="middle">{t}</text>
          {/each}
          <text class="axis-title" x={(M.left + panelW - M.right) / 2} y={H - 4} text-anchor="middle">month</text>
          {#each shown as r}
            <path class={`l-line ${r.k}`} d={pathOf(r.upto.map((p) => [x(p.t), yL(1000 * p.losers)]))} stroke={r.colour} />
            <circle class={`l-dot ${r.k}`} data-l={1000 * r.rows[month].losers} cx={x(month)} cy={yL(1000 * r.rows[month].losers)} r="4.5" fill={r.colour} />
          {/each}
        </svg>
      </div>
    </div>
    <p class="legend">
      {#each runs as r}
        <span class="key"><span class="swatch" style={`background:${r.colour}`}></span>{r.label}</span>
      {/each}
      <span class="key"><span class="swatch dashed"></span>where both end up ({pct(target)}), and the old layoff rate</span>
    </p>
  </div>
</div>

<style>
  .fig {
    max-width: 800px;
    margin: 2rem auto;
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
  }

  .scrub {
    flex: 1 1 140px;
    accent-color: var(--violet);
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.8rem;
    padding: 4px 11px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill.play {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0.5rem 0 0.4rem 0;
    min-height: 4.5em;
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
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .grid {
    stroke: #eef1f3;
  }

  .tick {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .target,
  .before {
    stroke: #232f3e;
    stroke-width: 1.2;
    stroke-dasharray: 5 4;
  }

  path {
    fill: none;
    stroke-width: 2.5;
  }

  circle {
    stroke: #fff;
    stroke-width: 1.5;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1rem;
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #61707d;
    margin: 0.4rem 0 0 0;
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

  .swatch.dashed {
    height: 0;
    border-top: 2px dashed #232f3e;
  }
</style>
