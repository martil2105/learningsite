<script>
  /*
    The hook. One slider, the exponent n. Every curve stays pinned through
    p = 25, q = 45 with elasticity 5/3 there; the monopoly price at c = 10
    never moves; the pass-through readout runs from 1/2 to 3. Values with
    |n| under 0.25 are snapped, because the pin itself degenerates there.
  */
  import { P0, Q0, EPS0, C0, family, q, optimalPrice, passThrough, elasticity } from "../demand.js";
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const P_MIN = 12, P_MAX = 46, Q_MAX = 140;
  const H = 280;
  const M = { top: 18, right: 16, bottom: 40, left: 50 };
  const PINK = "#df2a5d";
  const N_MIN = -5, N_MAX = 6, N_DEAD = 0.25;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let raw = $state(1);

  // Snap out of the degenerate strip around n = 0.
  let n = $derived.by(() => {
    const v = +raw;
    if (Math.abs(v) < N_DEAD) return v < 0 ? -N_DEAD : N_DEAD;
    return v;
  });

  let x = $derived(linear(P_MIN, P_MAX, M.left, W - M.right));
  let y = $derived(linear(0, Q_MAX, H - M.bottom, M.top));

  let d = $derived(family(n));

  let pts = $derived.by(() => {
    const out = [];
    for (let i = 0; i <= 400; i++) {
      const p = P_MIN + ((P_MAX - P_MIN) * i) / 400;
      const v = d.a + d.b * p;
      if (v <= 0) { out.push(null); continue; }
      const yy = Math.pow(v, d.n);
      out.push(yy <= Q_MAX ? [x(p), y(yy)] : null);
    }
    return out;
  });
  let curvePath = $derived.by(() => {
    let s = "";
    let pen = false;
    for (const pt of pts) {
      if (!pt) { pen = false; continue; }
      s += `${pen ? "L" : "M"} ${pt[0].toFixed(2)} ${pt[1].toFixed(2)} `;
      pen = true;
    }
    return s;
  });

  let pStar = $derived(optimalPrice(d, C0));
  let rho = $derived(passThrough(n));
  let eps = $derived(elasticity(d, pStar));

  let readout = $derived(
    `n = ${n.toFixed(2)}: the optimum is still p = ${pStar.toFixed(2)}, the markup is still ${(((pStar - C0) / pStar) * 100).toFixed(0)}%, and 1/ε there is ${eps.toFixed(4)} — but a one-unit cost rise now shifts the price by ${rho.toFixed(2)} units.`
  );

  const nTicks = [-5, -4, -3, -2, -1, 0, 2, 4, 6];
</script>

<div class="fig" id="curvature-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="The pinned demand family: one slider on the exponent n, the point and its elasticity fixed">
      <g class="axis">
        {#each [12, 20, 28, 36, 46] as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each [0, 35, 70, 105, 140] as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">price</text>
      </g>

      <path class="curve" d={curvePath} />
      <line class="opt" x1={x(pStar)} y1={M.top} x2={x(pStar)} y2={H - M.bottom} />
      <circle class="pin-dot" cx={x(P0)} cy={y(Q0)} r="6" fill="none" stroke={PINK} stroke-width="1.8" />
      <text class="clab pin-lab" x={x(P0)} y={y(Q0) - 10} text-anchor="middle">the pin: ε = 5/3 here, for every n</text>
    </svg>

    <label class="slider">
      <span class="slider-name">exponent n</span>
      <input type="range" min={N_MIN} max={N_MAX} step="0.05" value={raw}
        oninput={(e) => (raw = e.currentTarget.value)}
        aria-label="The family's exponent n" />
      <span class="slider-value">{n.toFixed(2)}</span>
    </label>
    <div class="ticks">
      {#each nTicks as t}
        <span class="tick">{t}</span>
      {/each}
    </div>
  </div>
</div>

<style>
  .fig { max-width: 680px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .curve { fill: none; stroke: var(--primary); stroke-width: 2.5; }
  .opt { stroke: #8a94a2; stroke-width: 1.5; stroke-dasharray: 5 4; }
  .pin-dot { fill: none; }
  .clab { font-family: var(--font-mono); font-size: 10px; fill: #8a94a2; }
  .pin-lab { fill: #5a6672; font-size: 10px; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .slider { display: flex; align-items: center; gap: 10px; margin: 0.4rem 0 0 0; }
  .slider-name { font-family: var(--font-mono); font-size: 0.75rem; color: #5a6672; white-space: nowrap; }
  .slider input { flex: 1; accent-color: var(--primary); }
  .slider-value { font-family: var(--font-mono); font-size: 0.78rem; color: var(--primary); min-width: 4ch; text-align: right; }
  .ticks { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.65rem; color: #8a94a2; padding: 0 2px; }
</style>