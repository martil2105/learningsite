<script>
  /*
    The hook. The envelope with the rent shaded: the vertical gap between a
    technology you might hold and the cheapest way to run the job. The reader
    moves r and picks a technology to hold; the readout is built in the script
    block. Rent is zero exactly when the technology held IS the frontier,
    which is the whole of "competition destroys the rent".
  */
  import { SET, REGIMES, R_MIN, R_MAX, R_DEFAULT } from "../datasets.js";
  import { costAt, cheapest, envelope, gap } from "../technology.js";
  import { linear, ticks, clampW, pathOf } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 270;
  const M = { top: 18, right: 16, bottom: 40, left: 52 };
  const C_MAX = 250;
  const P_BASE = 200; // a machine-day, for the money gloss on one readout

  const PICKS = SET.filter((t) => t.id !== "M"); // PORTED never needs showing

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let r = $state(R_DEFAULT);
  let held = $state(PICKS[3]); // TUNED — a real trade-off with a real rent

  let xR = $derived(linear(R_MIN, R_MAX, M.left, W - M.right));
  let yC = $derived(linear(0, C_MAX, H - M.bottom, M.top));

  const RS = Array.from({ length: 277 }, (_, i) => R_MIN + ((R_MAX - R_MIN) * i) / 276);
  const ENV = RS.map((rr) => [rr, envelope(SET, rr)]);
  let envPath = $derived(pathOf(ENV.map(([rr, c]) => [xR(rr), yC(c)])));

  let best = $derived(cheapest(SET, r));
  let env = $derived(envelope(SET, r));
  let heldCost = $derived(costAt(held, r));
  let rent = $derived(gap(held, SET, r));

  let rTicks = $derived(ticks(R_MIN, R_MAX, 5));
  let cTicks = $derived(ticks(0, C_MAX, 4));

  let readout = $derived.by(() => {
    const base = `At r = ${r.toFixed(2)}, the job runs for ${env.toFixed(0)} on ${best.name}`;
    if (rent === 0) {
      return `${base}, and holding ${held.name} costs the same ${heldCost.toFixed(0)}. The rent is exactly zero, because this is the cheapest technology at this price.`;
    }
    const money = ((rent * P_BASE) / 1000).toFixed(1);
    return `${base}, and holding ${held.name} costs ${heldCost.toFixed(0)}. The gap is ${rent.toFixed(1)} machine-days a run, about ${money}k at ${P_BASE} a machine-day, and that gap is the rent.`;
  });

  function onSlide(e) {
    r = +e.currentTarget.value;
  }
</script>

<div class="fig" id="rent-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="controls">
    <div class="presets" role="group" aria-label="Named price regimes">
      {#each REGIMES as g}
        <button class="pick" class:active={r === g.r} onclick={() => (r = g.r)}>{g.label}</button>
      {/each}
    </div>
    <div class="presets" role="group" aria-label="Choose the technology you hold">
      {#each PICKS as t}
        <button class="pick tech" class:active={held === t} onclick={() => (held = t)}>{t.name}</button>
      {/each}
    </div>
  </div>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="The cost envelope against r, with the rent to the held technology shaded">
      <g class="axis">
        {#each rTicks as t}
          <line class="grid" x1={xR(t)} y1={M.top} x2={xR(t)} y2={H - M.bottom} />
          <text x={xR(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each cTicks as t}
          <line class="grid" x1={M.left} y1={yC(t)} x2={W - M.right} y2={yC(t)} />
          <text x={M.left - 7} y={yC(t) + 4} text-anchor="end">{t}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">r, the relative price</text>
      </g>

      {#each PICKS as t}
        <line class="cline" class:on={t === held}
          x1={xR(R_MIN)} y1={yC(Math.min(C_MAX, costAt(t, R_MIN)))}
          x2={xR(R_MAX)} y2={yC(Math.min(C_MAX, costAt(t, R_MAX)))} />
      {/each}

      <rect class="rent" x={xR(r) - 7} y={yC(heldCost)} width="14"
        height={Math.max(0, yC(env) - yC(heldCost))} />
      <path class="env" d={envPath} />
      <line class="scrub" x1={xR(r)} y1={M.top} x2={xR(r)} y2={H - M.bottom} />
      <circle class="dot env-dot" cx={xR(r)} cy={yC(env)} r="6" fill={SERIES[0]} />
      <circle class="dot held-dot" cx={xR(r)} cy={yC(heldCost)} r="5.5" fill={SERIES[1]} />
    </svg>

    <label class="slider">
      <span class="slider-name">relative price r</span>
      <input type="range" min={R_MIN} max={R_MAX} step="0.01" value={r}
        oninput={onSlide} aria-label="Relative price r" />
    </label>
  </div>
</div>
<style>
  .fig { --pink: #df2a5d; max-width: 680px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .controls { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 0 0 0.8rem 0; }
  .presets { display: flex; flex-wrap: wrap; gap: 6px; }
  .pick { font-family: var(--font-mono); font-size: 0.78rem; padding: 5px 10px; border: 1px solid #c7cdd4; border-radius: 4px; background: white; color: var(--squidink); cursor: pointer; }
  .pick.active { border-color: var(--primary); color: var(--primary); font-weight: 600; }
  .pick.tech.active { border-color: var(--pink); color: var(--pink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .rent { fill: var(--pink); opacity: 0.25; }
  .cline { stroke: #c7cdd4; stroke-width: 1.4; }
  .cline.on { stroke: var(--pink); stroke-width: 2; }
  .env { fill: none; stroke: var(--primary); stroke-width: 2.5; }
  .scrub { stroke: #8a94a2; stroke-width: 1; stroke-dasharray: 2 3; }
  .dot { stroke: white; stroke-width: 1.5; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .slider { display: flex; align-items: center; gap: 10px; margin: 0.4rem 0 0 0; }
  .slider-name { font-family: var(--font-mono); font-size: 0.75rem; color: #5a6672; white-space: nowrap; }
  .slider input { flex: 1; accent-color: var(--primary); }
</style>