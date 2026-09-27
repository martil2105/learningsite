<script>
  /*
    The trap. BALANCED's machine-day count goes on a slider, and with it its
    cost line. The shaded band on the r axis is the window of relative prices
    on which BALANCED is at least as cheap as everything else — computed here
    from technology.js's winInterval, and asserted against the closed form in
    check-numbers.mjs. The readout is built in the script block.
  */
  import { SET, BALANCED, BAL_MIN, BAL_MAX } from "../datasets.js";
  import { winInterval, costAt, envelope } from "../technology.js";
  import { linear, clampW, pathOf } from "../chart.js";

  const H = 260;
  const M = { top: 18, right: 16, bottom: 40, left: 52 };
  const C_MAX = 60;
  const OTHERS = SET.filter((t) => t !== BALANCED);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let R = $state(BALANCED.R);

  let xR = $derived(linear(0.2, 14, M.left, W - M.right));
  let yC = $derived(linear(0, C_MAX, H - M.bottom, M.top));

  const RS = Array.from({ length: 277 }, (_, i) => 0.2 + (13.8 * i) / 276);
  const ENV = RS.map((rr) => [rr, envelope(OTHERS, rr)]);
  let envPath = $derived(pathOf(ENV.map(([rr, c]) => [xR(rr), yC(c)])));

  let variant = $derived({ ...BALANCED, R });
  let window_ = $derived(winInterval(variant, [...OTHERS, variant]));

  let readout = $derived.by(() => {
    if (!window_) {
      return `At ${R} machine-days, there's no relative price at which Balanced is the cheapest technology, even though nothing beats it in the rectangle test.`;
    }
    const width = window_.hi - window_.lo;
    const covers = window_.lo <= 2 && 2 <= window_.hi;
    const tail = covers
      ? ` and it covers r = 2, the industry standard, so at that price Balanced pushes Indexed out.`
      : `.`;
    return `At ${R} machine-days, Balanced is the cheapest choice for r from ${window_.lo.toFixed(2)} to ${window_.hi.toFixed(2)}, a window ${width.toFixed(1)} wide,${tail}`;
  });

  let balY = $derived(Math.min(C_MAX, costAt(variant, 14)));

  // The note under the chart, built here: {#if} strips whitespace, and the
  // width claim is regime-dependent, so it is a whole sentence or nothing.
  let trapNote = $derived.by(() => {
    if (!window_) {
      return `The window closed at 18 machine-days, exactly where the chord between Batched and Indexed sits at five engineer-days. At ${R} machine-days, Balanced isn't the cheapest choice anywhere.`;
    }
    if (R >= 14) {
      return `From 14 machine-days up, the window is exactly ${(18 - R).toFixed(1)} wide, which is the chord's 18 minus Balanced's own machine-days, and it closes for good at 18, the chord's value at five engineer-days.`;
    }
    return `Below 14 machine-days, Hand-tuned's line rather than Indexed's sets the window's lower edge, so the width rule changes: at ${R} machine-days, the window is ${(window_.hi - window_.lo).toFixed(1)} wide.`;
  });
</script>

<div class="fig" id="trap-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="The cost lines for BATCHED, INDEXED and BALANCED against r, with BALANCED's window shaded">
      <g class="axis">
        {#each [0, 2, 4, 6, 8, 10, 12, 14] as t}
          <line class="grid" x1={xR(t)} y1={M.top} x2={xR(t)} y2={H - M.bottom} />
          <text x={xR(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each [0, 20, 40, 60] as t}
          <line class="grid" x1={M.left} y1={yC(t)} x2={W - M.right} y2={yC(t)} />
          <text x={M.left - 7} y={yC(t) + 4} text-anchor="end">{t}</text>
        {/each}
        {#if window_}
          <rect class="win" x={xR(window_.lo)} y={M.top}
            width={Math.max(0, xR(window_.hi) - xR(window_.lo))}
            height={H - M.bottom - M.top} />
        {/if}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">r, the relative price</text>
      </g>

      {#each OTHERS.filter((t) => t.id === "Q" || t.id === "S") as t}
        <line class="cline" x1={xR(0.2)} y1={yC(costAt(t, 0.2))} x2={xR(14)} y2={yC(Math.min(C_MAX, costAt(t, 14)))} />
        <text class="clab" x={xR(14) - 4} y={yC(costAt(t, 14)) - 5} text-anchor="end">{t.name}</text>
      {/each}

      <line class="bal" x1={xR(0.2)} y1={yC(costAt({ ...BALANCED, R }, 0.2))}
        x2={xR(14)} y2={balY} />
      <text class="clab bal-lab" x={xR(14) - 4} y={balY - 5} text-anchor="end">BALANCED</text>
      <path class="env" d={envPath} />
    </svg>

    <label class="slider">
      <span class="slider-name">BALANCED's machine-days</span>
      <input type="range" min={BAL_MIN} max={BAL_MAX} step="1" value={R}
        oninput={(e) => (R = +e.currentTarget.value)}
        aria-label="BALANCED's machine-days per run" />
    </label>
  </div>

  <p class="note">{trapNote}</p>
</div>

<style>
  .fig { --pink: #df2a5d; max-width: 680px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .win { fill: var(--violet); opacity: 0.12; }
  .cline { stroke: #c7cdd4; stroke-width: 1.4; }
  .bal { stroke: var(--pink); stroke-width: 2; }
  .env { fill: none; stroke: var(--primary); stroke-width: 2.5; }
  .clab { font-family: var(--font-mono); font-size: 10.5px; fill: #8a94a2; }
  .bal-lab { fill: var(--pink); font-weight: 600; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .slider { display: flex; align-items: center; gap: 10px; margin: 0.4rem 0 0 0; }
  .slider-name { font-family: var(--font-mono); font-size: 0.75rem; color: #5a6672; white-space: nowrap; }
  .slider input { flex: 1; accent-color: var(--primary); }
  .note { font-family: var(--font-main); font-size: 0.9rem; color: #5a6672; margin: 0.6rem 0 0 0; }
</style>