<script>
  /* Build-up, figure 3. One point: the best affordable bundle is where the rate
     you would trade at equals the rate the wage trades at. Drag along the
     frontier and the utility readout has a single peak. */
  import { linear, ticks, clampW, pathOf } from "../chart.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { BASE, W_DEFAULT, W_MAX } from "../datasets.js";
  import { indifferenceC, mrs, utility, optimum } from "../choice.js";

  const H = 290;
  const M = { top: 18, right: 18, bottom: 40, left: 56 };
  const C_MAX = W_MAX * BASE.T;
  const T = BASE.T;
  const w = W_DEFAULT;
  const p = { a: BASE.a, sigma: 1, T };

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let f = $state(12.5);
  let dragging = $state(false);
  let svgEl;

  let x = $derived(linear(0, T, M.left, W - M.right));
  let y = $derived(linear(0, C_MAX, H - M.bottom, M.top));

  let c = $derived(w * (T - f));
  let U = $derived(utility(c, f, p));
  let rate = $derived(mrs(c, f, p));
  let best = $derived(optimum(w, p));
  let bestU = $derived(utility(best.c, best.f, p));
  let atOptimum = $derived(Math.abs(rate - w) / w < 0.01);

  let frontier = $derived(pathOf([[x(T), y(0)], [x(0), y(w * T)]]));

  function curveThrough(level) {
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const ff = 0.35 + (i / 240) * (T - 0.35);
      const cc = indifferenceC(ff, level, p);
      if (cc === null || !(cc > 0) || cc > C_MAX) continue;
      pts.push([x(ff), y(cc)]);
    }
    return pts.length > 1 ? pathOf(pts) : "";
  }

  let curve = $derived(curveThrough(U));

  let verdict = $derived(
    atOptimum
      ? `An hour of free time is worth ${Math.round(rate)} kr to you and costs ${w} kr. Nothing is left to gain by moving either way — this is the best affordable bundle.`
      : rate > w
        ? `An hour of free time is worth ${Math.round(rate)} kr to you and costs only ${w} kr. Buy some: move right.`
        : `An hour of free time is worth ${Math.round(rate)} kr to you and costs ${w} kr. Sell some: move left.`
  );
  let score = $derived(`${((U / bestU) * 100).toFixed(1)}% of the best you can do`);

  let xTicks = $derived(ticks(0, T, 4));
  let yTicks = $derived(ticks(0, C_MAX, 4));

  function setFromEvent(e) {
    const r = svgEl.getBoundingClientRect();
    const s = r.width / W;
    const uf = x.invert((e.clientX - r.left) / s);
    f = Math.min(T - 0.8, Math.max(0.8, uf));
  }
  function down(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging = true;
    setFromEvent(e);
  }
  function move(e) { if (dragging) setFromEvent(e); }
  function up() { dragging = false; }
  function key(e) {
    const step = e.shiftKey ? 1 : 0.2;
    if (e.key === "ArrowRight") { f = Math.min(T - 0.8, f + step); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { f = Math.max(0.8, f - step); e.preventDefault(); }
  }
</script>

<div class="fig" id="tangency">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">{verdict}</p>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="plot"
    role="application"
    tabindex="0"
    aria-label="Drag the bundle along the frontier, or use the left and right arrow keys"
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

      <path d={curve} fill="none" stroke={SERIES[2]} class="indiff" />
      <path d={frontier} fill="none" stroke={SERIES[0]} class="model" />
      <line class="tangent" x1={x(Math.max(0.2, f - 2.6))} y1={y(c + rate * 2.6)}
        x2={x(Math.min(T - 0.2, f + 2.6))} y2={y(c - rate * 2.6)} stroke={SERIES[1]} />
      <circle class="handle" cx={x(f)} cy={y(c)} r={dragging ? 9 : 7}
        fill={atOptimum ? SERIES[2] : SERIES[1]} />
    </svg>
  </div>

  <p class="score" class:hit={atOptimum}>{score}</p>

  <p class="note">
    Try dragging the bundle along the frontier. The red tangent shows what your
    preferences offer, and the blue frontier shows what the wage offers.
    Wherever the two differ, there's a trade worth making, so the best bundle is
    the one where they agree. That's all the condition
    <span class="mono">MRS = w</span> says.
  </p>
</div>

<style>
  .fig { max-width: 680px; margin: 1.8rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title {
    font-family: var(--font-main); font-size: 0.95rem; line-height: 1.45;
    margin: 0 0 0.5rem 0; color: var(--squid-ink); min-height: 2.9em;
  }
  .plot { outline-offset: 3px; touch-action: none; }
  .plot:focus-visible { outline: 2px solid var(--violet); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .model { stroke-width: 2.5; }
  .indiff { stroke-width: 2; }
  .tangent { stroke-width: 2; opacity: 0.85; }
  .handle { cursor: grab; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .axis-title { font-family: var(--font-main); }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .score {
    font-family: var(--font-mono); font-size: 0.9rem; margin: 0.6rem 0 0 0;
    color: #5b6670;
  }
  .score.hit { color: #2f7d32; }
  .note {
    font-family: var(--font-main); font-size: 0.88rem; line-height: 1.5;
    color: #5b6670; margin: 0.7rem 0 0 0;
  }
</style>
