<script>
  /*
    The hook. Two controls and nothing else: drag the frontier to change the
    wage, and set sigma. The object carrying the claim is the locus — the path
    the optimum traces as the wage runs over its whole range. At sigma = 1 that
    path is exactly vertical, and no amount of dragging bends it.
  */
  import katexify from "../katexify.js";
  import { linear, ticks, clampW, pathOf } from "../chart.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { BASE, W_MIN, W_MAX, W_DEFAULT, REGIMES } from "../datasets.js";
  import { optimum, utility, indifferenceC } from "../choice.js";

  const H = 320;
  const M = { top: 18, right: 18, bottom: 40, left: 56 };
  const C_MAX = W_MAX * BASE.T;
  const T = BASE.T;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let w = $state(W_DEFAULT);
  let sigma = $state(1);
  let dragging = $state(false);
  let svgEl;

  let p = $derived({ a: BASE.a, sigma, T });
  let x = $derived(linear(0, T, M.left, W - M.right));
  let y = $derived(linear(0, C_MAX, H - M.bottom, M.top));

  let opt = $derived(optimum(w, p));
  let frontier = $derived(pathOf([[x(T), y(0)], [x(0), y(w * T)]]));

  function indifferencePath() {
    const U = utility(opt.c, opt.f, p);
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const f = 0.12 + (i / 240) * (T - 0.12);
      const c = indifferenceC(f, U, p);
      if (c === null || !(c > 0) || c > C_MAX) continue;
      pts.push([x(f), y(c)]);
    }
    return pts.length > 1 ? pathOf(pts) : "";
  }

  function locusPath() {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const wi = W_MIN + (i / 120) * (W_MAX - W_MIN);
      const o = optimum(wi, p);
      pts.push([x(o.f), y(o.c)]);
    }
    return pathOf(pts);
  }

  let curve = $derived(indifferencePath());
  let locus = $derived(locusPath());

  /* The sentence is built here: {#if} strips the leading whitespace of its
     body, so a figure spliced into markup renders glued to the next word. */
  let spread = $derived(
    Math.abs(optimum(W_MAX, p).h - optimum(W_MIN, p).h)
  );
  let readout = $derived(
    `Working ${opt.h.toFixed(2)} hours for ${Math.round(opt.c).toLocaleString("en-GB")} kr. Across the whole range the drag covers, hours worked move by ${spread < 5e-13 ? "0.00" : spread.toFixed(2)} of an hour.`
  );
  let eq = $derived(
    katexify(`f^\\ast = \\frac{(1-\\alpha)^{\\sigma} w^{1-\\sigma}\\,T}{\\alpha^{\\sigma} + (1-\\alpha)^{\\sigma} w^{1-\\sigma}}`, true)
  );

  let xTicks = $derived(ticks(0, T, 4));
  let yTicks = $derived(ticks(0, C_MAX, 4));

  function setFromEvent(e) {
    const r = svgEl.getBoundingClientRect();
    const s = r.width / W;                    // the viewBox may be scaling
    const uf = x.invert((e.clientX - r.left) / s);
    const uc = y.invert((e.clientY - r.top) / s);
    const rest = T - uf;
    if (!(rest > 0.4)) return;
    w = Math.min(W_MAX, Math.max(W_MIN, uc / rest));
  }
  function down(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging = true;
    setFromEvent(e);
  }
  function move(e) { if (dragging) setFromEvent(e); }
  function up() { dragging = false; }
  function key(e) {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      w = Math.min(W_MAX, w + step); e.preventDefault();
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      w = Math.max(W_MIN, w - step); e.preventDefault();
    }
  }
</script>

<div class="fig" id="wagelab">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">{readout}</p>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="plot"
    role="application"
    tabindex="0"
    aria-label="Drag to pivot the budget frontier and change the wage, or use the arrow keys"
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

      <path d={locus} class="locus" stroke={BACKGROUND_CLASS} fill="none" />
      <path d={curve} class="indiff" stroke={SERIES[2]} fill="none" />
      <path d={frontier} class="model" stroke={SERIES[0]} fill="none" />
      <circle class="handle" cx={x(opt.f)} cy={y(opt.c)} r={dragging ? 9 : 7} fill={SERIES[1]} />
    </svg>
  </div>

  <div class="ctls">
    <label class="ctl">
      σ
      <input type="range" min="0.4" max="2.5" step="0.02" bind:value={sigma} />
      <span class="val">{Number(sigma).toFixed(2)}</span>
    </label>
    <div class="presets">
      {#each REGIMES as r}
        <button
          class:on={Math.abs(sigma - r.sigma) < 1e-9}
          onclick={() => (sigma = r.sigma)}>{r.label}</button
        >
      {/each}
    </div>
  </div>

  <p class="legend">
    <span class="key" style="background:{SERIES[0]}"></span> frontier
    <span class="key" style="background:{SERIES[2]}"></span> indifference curve through the optimum
    <span class="key" style="background:{BACKGROUND_CLASS}"></span> every optimum in the wage range
  </p>

  <div class="eq">{@html eq}</div>
</div>

<style>
  .fig { max-width: 680px; margin: 1.8rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.45;
    margin: 0 0 0.5rem 0;
    color: var(--squid-ink);
  }
  .plot { outline-offset: 3px; touch-action: none; }
  .plot:focus-visible { outline: 2px solid var(--violet); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .model { stroke-width: 2.5; }
  .indiff { stroke-width: 2; stroke-dasharray: 1 0; }
  .locus { stroke-width: 6; opacity: 0.45; stroke-linecap: round; }
  .handle { cursor: grab; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .axis-title { font-family: var(--font-main); }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .ctls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
    margin-top: 0.8rem;
  }
  .ctl {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: var(--font-main);
    font-size: 0.9rem;
    color: var(--squid-ink);
    flex: 1;
    min-width: 200px;
  }
  .ctl input { flex: 1; min-width: 110px; accent-color: #7c5aed; }
  .val { font-family: var(--font-mono); min-width: 2.6rem; text-align: right; }
  .presets { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .presets button {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    padding: 0.25rem 0.55rem;
    border: 1px solid #d5dade;
    background: #fff;
    border-radius: 999px;
    cursor: pointer;
    color: var(--squid-ink);
  }
  .presets button.on { border-color: #7c5aed; color: #7c5aed; }
  .legend {
    font-family: var(--font-main);
    font-size: 0.82rem;
    color: #5b6670;
    margin: 0.6rem 0 0 0;
    line-height: 1.9;
  }
  .key {
    display: inline-block;
    width: 14px;
    height: 3px;
    vertical-align: middle;
    margin: 0 0.25rem 0 0.6rem;
    border-radius: 2px;
  }
  .legend .key:first-child { margin-left: 0; }
  .eq { text-align: center; margin: 0.9rem 0 0 0; }
</style>
