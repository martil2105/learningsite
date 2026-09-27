<script>
  /*
    The hook. A point in the plane of the job-finding rate f (across) and the
    separation rate s (up). Every ray from the origin is a set of labour
    markets with the same unemployment rate, because u* = 1 / (1 + f/s)
    depends on the ratio only. Drag the point, or use the arrow keys.

    The claims check-browser.mjs defends in rendered pixels: the point lies on
    the dashed ray drawn through it; both towns lie on the 6% ray; and the two
    Eastport shocks, layoffs doubling and hiring halving, land on the same ray.
  */
  import { steady, meanSpell, longTermShare, halfLife } from "../flows.js";
  import { TOWN_A, TOWN_B, LONG_TERM, S_MAX, F_MAX } from "../datasets.js";
  import { SERIES, INK } from "../palette.js";
  import { linear, clampW } from "../chart.js";

  const RAYS = [0.03, 0.06, 0.1, 0.15, 0.25];
  const F_MIN = 0.02, S_MIN = 0.002;
  const PRESETS = [
    { label: TOWN_A.name, f: TOWN_A.f, s: TOWN_A.s },
    { label: TOWN_B.name, f: TOWN_B.f, s: TOWN_B.s },
    { label: `${TOWN_A.name}, layoffs double`, f: TOWN_A.f, s: 2 * TOWN_A.s },
    { label: `${TOWN_A.name}, hiring halves`, f: TOWN_A.f / 2, s: TOWN_A.s },
  ];

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth - 2));
  let inner = $derived(W - 32);
  const H = 320;
  const M = { top: 14, right: 40, bottom: 40, left: 46 };
  let x = $derived(linear(0, F_MAX, M.left, inner - M.right));
  let y = $derived(linear(0, S_MAX, H - M.bottom, M.top));

  let f = $state(TOWN_A.f);
  let s = $state(TOWN_A.s);
  let dragging = $state(false);
  let svgEl;

  let u = $derived(steady(s, f));

  // A ray s = f·u/(1−u) from the origin to the plot boundary.
  function ray(rate) {
    const k = rate / (1 - rate);
    const fEnd = Math.min(F_MAX, S_MAX / k);
    return { x1: x(0), y1: y(0), x2: x(fEnd), y2: y(k * fEnd), label: `${Math.round(rate * 100)}%`, top: k * F_MAX > S_MAX };
  }
  let rays = $derived(RAYS.map(ray));
  let own = $derived(ray(u));

  const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;
  let facts = $derived([
    { k: "rate", label: "unemployment rate", v: pct(u) },
    { k: "ratio", label: "f ÷ s", v: (f / s).toFixed(1) },
    { k: "spell", label: "average spell", v: `${meanSpell(f).toFixed(1)} months` },
    { k: "lt", label: "out a year or more", v: longTermShare(f, LONG_TERM) < 0.001 ? `${(longTermShare(f, LONG_TERM) * 100).toFixed(2)}%` : pct(longTermShare(f, LONG_TERM)) },
    { k: "half", label: "half-life of a gap", v: `${halfLife(s, f).toFixed(1)} months` },
  ]);

  function setFromEvent(e) {
    const r = svgEl.getBoundingClientRect();
    const k = r.width / inner;
    const ux = (e.clientX - r.left) / k, uy = (e.clientY - r.top) / k;
    f = Math.min(F_MAX, Math.max(F_MIN, x.invert(ux)));
    s = Math.min(S_MAX, Math.max(S_MIN, y.invert(uy)));
  }
  function down(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging = true;
    setFromEvent(e);
  }
  function move(e) {
    if (dragging) setFromEvent(e);
  }
  function up() {
    dragging = false;
  }
  function key(e) {
    const big = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowRight") f = Math.min(F_MAX, f + 0.005 * big);
    else if (e.key === "ArrowLeft") f = Math.max(F_MIN, f - 0.005 * big);
    else if (e.key === "ArrowUp") s = Math.min(S_MAX, s + 0.0005 * big);
    else if (e.key === "ArrowDown") s = Math.max(S_MIN, s - 0.0005 * big);
    else return;
    e.preventDefault();
  }
  const isAt = (p) => Math.abs(p.f - f) < 1e-12 && Math.abs(p.s - s) < 1e-12;
</script>

<div class="fig" id="ratio-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <div class="lab">
    <div class="controls-bar">
      <div class="presets">
        {#each PRESETS as p}
          <button class="pill" class:active={isAt(p)} onclick={() => { f = p.f; s = p.s; }}>{p.label}</button>
        {/each}
      </div>
      <div class="facts">
        {#each facts as fct}
          <div class={`fact ${fct.k}`}><span class="f-label">{fct.label}</span><b>{fct.v}</b></div>
        {/each}
      </div>
    </div>

    <p class="axis-note">up: share of workers who lose their job each month, s</p>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="plot"
      role="application"
      tabindex="0"
      aria-label="Drag the point, or use the arrow keys: left and right change the job-finding rate, up and down the separation rate"
      onkeydown={key}
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={up}
    >
      <svg bind:this={svgEl} width={inner} height={H} viewBox={`0 0 ${inner} ${H}`}>
        <g class="axis">
          {#each [0, 0.02, 0.04, 0.06, 0.08] as t}
            <line class="grid" x1={M.left} x2={inner - M.right} y1={y(t)} y2={y(t)} />
            <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{Math.round(t * 100)}%</text>
          {/each}
          {#each [0, 0.2, 0.4, 0.6, 0.8] as t}
            <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{Math.round(t * 100)}%</text>
          {/each}
          <text class="axis-title" x={(M.left + inner - M.right) / 2} y={H - 4} text-anchor="middle">share of the unemployed who find a job each month, f</text>
        </g>
        {#each rays as r}
          <line class="ray" x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
          <text class="ray-label" x={r.x2 + (r.top ? 0 : 4)} y={r.y2 + (r.top ? -3 : 4)} text-anchor={r.top ? "middle" : "start"}>{r.label}</text>
        {/each}
        <line class="own-ray" x1={own.x1} y1={own.y1} x2={own.x2} y2={own.y2} stroke={INK} />
        {#each PRESETS.slice(0, 2) as p, i}
          <circle class="town" data-town={p.label} cx={x(p.f)} cy={y(p.s)} r="4" fill="none" stroke={SERIES[i]} stroke-width="2" />
        {/each}
        <circle class="handle" cx={x(f)} cy={y(s)} r={dragging ? 10 : 8} fill={SERIES[0]} />
      </svg>
    </div>
    <p class="hint">Drag the point, or click the plot and use the arrow keys. Notice which readouts change as you slide along a ray.</p>
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
    padding: 1rem 16px;
  }

  .controls-bar {
    background: #fff;
    padding: 0.2rem 0 0.6rem 0;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #eef1f3;
  }

  @media screen and (max-width: 700px) {
    .controls-bar {
      position: sticky;
      top: 0;
      z-index: 5;
    }
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.78rem;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill.active {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.1rem;
    margin-top: 0.6rem;
  }

  .fact {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .f-label {
    font-family: var(--font-main);
    font-size: 0.75rem;
    color: #8a94a2;
  }

  .fact b {
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }

  .plot {
    outline-offset: 3px;
    touch-action: none;
    cursor: crosshair;
  }

  .plot:focus-visible {
    outline: 2px solid var(--violet);
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }

  .axis .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .grid {
    stroke: #eef1f3;
  }

  .ray {
    stroke: #c3cad1;
    stroke-width: 1.5;
  }

  .ray-label {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }

  .own-ray {
    stroke-width: 1.6;
    stroke-dasharray: 6 4;
  }

  .handle {
    stroke: #fff;
    stroke-width: 2;
    cursor: grab;
  }

  .axis-note {
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #61707d;
    margin: 0 0 0.2rem 0;
  }

  .hint {
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #61707d;
    margin: 0.5rem 0 0 0;
  }
</style>
