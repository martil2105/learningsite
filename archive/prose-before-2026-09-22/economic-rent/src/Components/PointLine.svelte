<script>
  /*
    The duality. Left: the six technologies as POINTS in input space, with the
    lower-left hull through the four survivors. Right: the same six as LINES
    in (r, cost) space — cost r*N + R, in units of p — with the lower envelope
    in the primary colour. The slider is r, the only number the choice depends
    on, and the readout names the cheapest technology at it. The switch ticks
    at 1, 3 and 8 come from technology.js, not from this file.
  */
  import { STARTERS, W_BASE, P_BASE, R_MIN, R_MAX, R_DEFAULT } from "../datasets.js";
  import { costAt, cheapest, envelope, lowerHull, switchPrices } from "../technology.js";
  import { linear, ticks, clampW, pathOf } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 260;
  const M = { top: 18, right: 16, bottom: 40, left: 46 };
  const C_MAX = 230;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let twoUp = $derived(W >= 620);
  let pw = $derived(twoUp ? Math.floor((W - 28 - 2) / 2) : W);

  let r = $state(R_DEFAULT);

  let xN = $derived(linear(0, 20, M.left, pw - M.right));
  let yR = $derived(linear(0, 44, H - M.bottom, M.top));
  let xR = $derived(linear(R_MIN, R_MAX, M.left, pw - M.right));
  let yC = $derived(linear(0, C_MAX, H - M.bottom, M.top));

  const HULL = lowerHull(STARTERS);
  const SWITCHES = switchPrices(STARTERS);

  // The envelope, sampled densely enough that the kinks land on their prices.
  const RS = Array.from({ length: 277 }, (_, i) => R_MIN + ((R_MAX - R_MIN) * i) / 276);
  const ENV = RS.map((rr) => [rr, envelope(STARTERS, rr)]);
  let envPath = $derived(pathOf(ENV.map(([rr, c]) => [xR(rr), yC(c)])));

  let chosen = $derived(cheapest(STARTERS, r));
  let cost = $derived(costAt(chosen, r));

  let rTicks = $derived(ticks(R_MIN, R_MAX, 5));
  let cTicks = $derived(ticks(0, C_MAX, 4));

  let readout = $derived(
    `At r = ${r.toFixed(2)}, ${chosen.name} runs the job for ${cost.toFixed(0)} machine-days, and it is the cheapest technology there is.`
  );

  function onSlide(e) {
    r = +e.currentTarget.value;
  }
</script>

<div class="fig" id="point-line">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="panels" class:two-up={twoUp}>
    <div class="panel">
      <p class="panel-title">Inputs for one run: points</p>
      <svg width={pw} height={H} viewBox={`0 0 ${pw} ${H}`} role="img"
        aria-label="The six technologies as points in input space, with the lower-left hull">
        <g class="axis">
          {#each [0, 5, 10, 15, 20] as t}
            <line class="grid" x1={xN(t)} y1={M.top} x2={xN(t)} y2={H - M.bottom} />
            <text x={xN(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
          {/each}
          {#each [0, 10, 20, 30, 40] as t}
            <line class="grid" x1={M.left} y1={yR(t)} x2={pw - M.right} y2={yR(t)} />
            <text x={M.left - 7} y={yR(t) + 4} text-anchor="end">{t}</text>
          {/each}
          <line class="rule" x1={M.left} y1={H - M.bottom} x2={pw - M.right} y2={H - M.bottom} />
          <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
          <text class="axis-title" x={(M.left + pw - M.right) / 2} y={H - 4} text-anchor="middle">engineer-days</text>
        </g>
        <path class="hull" d={pathOf([...HULL, HULL[0]].map((t) => [xN(t.N), yR(t.R)]))} />
        {#each STARTERS as t}
          <circle class="dot" cx={xN(t.N)} cy={yR(t.R)} r={t === chosen ? 6.5 : 5}
            fill={t === chosen ? SERIES[0] : "#b9c0c9"} />
          <text class="lab" class:on={t === chosen} x={xN(t.N) + 9} y={yR(t.R) + 4}>{t.id}</text>
        {/each}
      </svg>
    </div>
    <div class="panel">
      <p class="panel-title">Cost of one run at r = w/p: lines</p>
      <svg width={pw} height={H} viewBox={`0 0 ${pw} ${H}`} role="img"
        aria-label="Each technology's cost against the relative price r, with the lower envelope">
        <g class="axis">
          {#each rTicks as t}
            <line class="grid" x1={xR(t)} y1={M.top} x2={xR(t)} y2={H - M.bottom} />
            <text x={xR(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
          {/each}
          {#each cTicks as t}
            <line class="grid" x1={M.left} y1={yC(t)} x2={pw - M.right} y2={yC(t)} />
            <text x={M.left - 7} y={yC(t) + 4} text-anchor="end">{t}</text>
          {/each}
          {#each SWITCHES as s}
            <line class="switch" x1={xR(s)} y1={M.top} x2={xR(s)} y2={H - M.bottom} />
            <text class="switch-lab" x={xR(s)} y={M.top - 6} text-anchor="middle">{s}</text>
          {/each}
          <line class="rule" x1={M.left} y1={H - M.bottom} x2={pw - M.right} y2={H - M.bottom} />
          <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
          <text class="axis-title" x={(M.left + pw - M.right) / 2} y={H - 4} text-anchor="middle">r, the relative price</text>
        </g>
        {#each STARTERS as t}
          <line class="cline" class:on={t === chosen}
            x1={xR(R_MIN)} y1={yC(Math.min(C_MAX, costAt(t, R_MIN)))}
            x2={xR(R_MAX)} y2={yC(Math.min(C_MAX, costAt(t, R_MAX)))} />
        {/each}
        <path class="env" d={envPath} />
        <line class="scrub" x1={xR(r)} y1={M.top} x2={xR(r)} y2={H - M.bottom} />
        <circle class="dot env-dot" cx={xR(r)} cy={yC(cost)} r="6" fill={SERIES[0]} />
      </svg>
      <label class="slider">
        <span class="slider-name">relative price r</span>
        <input type="range" min={R_MIN} max={R_MAX} step="0.01" value={r}
          oninput={onSlide} aria-label="Relative price r, engineer-days per machine-day" />
      </label>
    </div>
  </div>

  <p class="note">
    The money never matters on its own: at {W_BASE} an engineer-day and {P_BASE} a
    machine-day the relative price is r = {(W_BASE / P_BASE).toFixed(0)}, and
    doubling both leaves the choice alone, because every cost carries the same
    factor.
  </p>
</div>

<style>
  .panels {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .panels.two-up {
    flex-direction: row;
    align-items: flex-start;
  }

  .panel {
    flex: 1 1 0;
    min-width: 0;
  }

  .panel-title {
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: #5a6672;
    margin: 0 0 0.3rem 0;
  }

  .panel svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .hull {
    fill: none;
    stroke: #8a94a2;
    stroke-width: 1.5;
    stroke-dasharray: 3 3;
  }

  .cline {
    stroke: #c7cdd4;
    stroke-width: 1.4;
  }

  .cline.on {
    stroke: var(--primary);
    stroke-width: 2;
  }

  .env {
    fill: none;
    stroke: var(--primary);
    stroke-width: 2.5;
  }

  .switch {
    stroke: var(--violet);
    stroke-width: 1;
    stroke-dasharray: 2 3;
    opacity: 0.7;
  }

  .switch-lab {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: var(--violet);
  }

  .scrub {
    stroke: #8a94a2;
    stroke-width: 1;
    stroke-dasharray: 2 3;
  }

  .dot {
    stroke: white;
    stroke-width: 1.5;
  }

  .lab {
    font-family: var(--font-mono);
    font-size: 10.5px;
    fill: #8a94a2;
  }

  .lab.on {
    fill: var(--squidink);
    font-weight: 600;
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: #8a94a2;
  }

  .grid {
    stroke: #e3e7ea;
    stroke-width: 1;
  }

  .rule {
    stroke: #8a94a2;
    stroke-width: 1;
  }

  .axis-title {
    font-size: 11px;
  }

  .slider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0.4rem 0 0 0;
  }

  .slider-name {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: #5a6672;
    white-space: nowrap;
  }

  .slider input {
    flex: 1;
    accent-color: var(--primary);
  }

  .note {
    font-family: var(--font-main);
    font-size: 0.9rem;
    color: #5a6672;
    margin: 0.6rem 0 0 0;
  }
</style>