<script>
  /* Build-up, figure 2. One point: preferences are a rate, and the rate changes
     along the curve. Nothing about the wage appears here. */
  import { linear, ticks, clampW, pathOf } from "../chart.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { BASE, W_MAX } from "../datasets.js";
  import { indifferenceC, mrs } from "../choice.js";

  const H = 280;
  const M = { top: 18, right: 18, bottom: 40, left: 56 };
  const C_MAX = W_MAX * BASE.T;
  const T = BASE.T;
  const p = { a: BASE.a, sigma: 1 };
  const LEVELS = [200, 450, 750, 1100].map((c) => Math.sqrt(c * 8));
  const PICK = 1; // the curve carrying the handle

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let f = $state(4.5);
  let dragging = $state(false);
  let svgEl;

  let x = $derived(linear(0, T, M.left, W - M.right));
  let y = $derived(linear(0, C_MAX, H - M.bottom, M.top));

  function curveFor(U) {
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const ff = 0.35 + (i / 240) * (T - 0.35);
      const c = indifferenceC(ff, U, p);
      if (c === null || !(c > 0) || c > C_MAX) continue;
      pts.push([x(ff), y(c)]);
    }
    return pts.length > 1 ? pathOf(pts) : "";
  }

  let curves = $derived(LEVELS.map(curveFor));
  let handleC = $derived(indifferenceC(f, LEVELS[PICK], p) ?? 0);
  let rate = $derived(mrs(handleC, f, p));

  let readout = $derived(
    `With ${f.toFixed(1)} hours free and ${Math.round(handleC)} kr to spend, one more hour of free time is worth ${Math.round(rate)} kr to you — and further right, where free time is already plentiful, it is worth less.`
  );

  let xTicks = $derived(ticks(0, T, 4));
  let yTicks = $derived(ticks(0, C_MAX, 4));

  function setFromEvent(e) {
    const r = svgEl.getBoundingClientRect();
    const s = r.width / W;
    const uf = x.invert((e.clientX - r.left) / s);
    f = Math.min(T - 1.2, Math.max(1.2, uf));
  }
  function down(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging = true;
    setFromEvent(e);
  }
  function move(e) { if (dragging) setFromEvent(e); }
  function up() { dragging = false; }
  function key(e) {
    const step = e.shiftKey ? 1 : 0.25;
    if (e.key === "ArrowRight") { f = Math.min(T - 1.2, f + step); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { f = Math.max(1.2, f - step); e.preventDefault(); }
  }
</script>

<div class="fig" id="indifference">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">{readout}</p>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="plot"
    role="application"
    tabindex="0"
    aria-label="Drag the point along the indifference curve, or use the left and right arrow keys"
    onkeydown={key}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
  >
    <svg bind:this={svgEl} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each yTicks as t}
          <line x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} class="grid" />
          <text x={M.left - 8} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        {#each xTicks as t}
          <text x={x(t)} y={H - M.bottom + 16} text-anchor="middle">{t}</text>
        {/each}
        <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} class="rule" />
        <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} class="rule" />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">
          free time, hours
        </text>
        <text
          class="axis-title"
          transform={`rotate(-90 13 ${(M.top + H - M.bottom) / 2})`}
          x="13"
          y={(M.top + H - M.bottom) / 2}
          text-anchor="middle">consumption, kr</text
        >
      </g>

      {#each curves as d, i}
        <path {d} fill="none" stroke={i === PICK ? SERIES[2] : BACKGROUND_CLASS}
          stroke-width={i === PICK ? 2.5 : 1.5} opacity={i === PICK ? 1 : 0.5} />
      {/each}

      <line class="tangent" x1={x(Math.max(0.2, f - 2.6))} y1={y(handleC + rate * 2.6)}
        x2={x(Math.min(T - 0.2, f + 2.6))} y2={y(handleC - rate * 2.6)} stroke={SERIES[1]} />
      <circle class="handle" cx={x(f)} cy={y(handleC)} r={dragging ? 9 : 7} fill={SERIES[1]} />
      <text class="lab" x={x(T) - 4} y={y(indifferenceC(T - 0.6, LEVELS[3], p) ?? 0) - 10} text-anchor="end">
        happier
      </text>
    </svg>
  </div>

  <p class="note">
    Every point on a single curve is equally good, and curves further out are
    better. The slope of the red tangent is the rate the curve offers at that
    point. If you drag the point to the right, you'll see the tangent flatten as
    free time gets easier to come by, which is the only assumption about taste
    this article makes.
  </p>
</div>

<style>
  .fig { max-width: 680px; margin: 1.8rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title {
    font-family: var(--font-main); font-size: 0.95rem; line-height: 1.45;
    margin: 0 0 0.5rem 0; color: var(--squid-ink);
  }
  .plot { outline-offset: 3px; touch-action: none; }
  .plot:focus-visible { outline: 2px solid var(--violet); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .tangent { stroke-width: 2; opacity: 0.85; }
  .handle { cursor: grab; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .axis-title { font-family: var(--font-main); }
  .lab { font-family: var(--font-main); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .note {
    font-family: var(--font-main); font-size: 0.88rem; line-height: 1.5;
    color: #5b6670; margin: 0.7rem 0 0 0;
  }
</style>
