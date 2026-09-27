<script>
  /*
    The spine. Two demand curves through one point with one elasticity; a
    cost slider. At c = 10 their optimal prices coincide exactly; drag the
    cost and they come apart. Both optimum lines are drawn from the closed
    form in src/demand.js; the check-numbers route maximises profit
    numerically and must land on the same places.
  */
  import { P0, Q0, EPS0, C0, family, q, optimalPrice, elasticity } from "../demand.js";
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const P_MIN = 15, P_MAX = 40, Q_MAX = 110;
  const H = 280;
  const M = { top: 18, right: 16, bottom: 40, left: 50 };
  const PINK = "#df2a5d";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let c = $state(C0);

  let x = $derived(linear(P_MIN, P_MAX, M.left, W - M.right));
  let y = $derived(linear(0, Q_MAX, H - M.bottom, M.top));

  const LIN = family(1);
  const CES = family(-EPS0);

  const PS = Array.from({ length: 251 }, (_, i) => P_MIN + ((P_MAX - P_MIN) * i) / 250);
  const linPts = PS.filter((p) => q(LIN, p) <= Q_MAX).map((p) => [x(p), y(q(LIN, p))]);
  const cesPts = PS.filter((p) => q(CES, p) <= Q_MAX).map((p) => [x(p), y(q(CES, p))]);
  const path = (pts) => pts.map(([a, b], i) => `${i ? "L" : "M"} ${a.toFixed(2)} ${b.toFixed(2)}`).join(" ");

  let pLin = $derived(optimalPrice(LIN, c));
  let pCes = $derived(optimalPrice(CES, c));
  let spread = $derived(Math.abs(pCes - pLin));

  let readout = $derived.by(() => {
    if (spread < 1e-9) {
      return `At c = ${c.toFixed(0)} both curves put the price at exactly ${pLin.toFixed(1)} and the markup at ${(((pLin - c) / pLin) * 100).toFixed(0)}% — 1/|ε|, as the rule says. You cannot tell them apart from here.`;
    }
    return `At c = ${c.toFixed(0)} the straight line says ${pLin.toFixed(1)} and the constant-elasticity curve says ${pCes.toFixed(1)} — a gap of ${spread.toFixed(1)}, from two curves that agree on everything local.`;
  });

  const pTicks = [15, 20, 25, 30, 35, 40];
  const qTicks = [0, 25, 50, 75, 100];
</script>

<div class="fig" id="spine">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Two demand curves through the same point with the same elasticity, and their optimal prices at the chosen cost">
      <g class="axis">
        {#each pTicks as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each qTicks as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">price</text>
        <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">quantity</text>
      </g>

      <path class="curve lin" d={path(linPts)} />
      <path class="curve ces" d={path(cesPts)} />
      <text class="clab" x={x(36)} y={y(q(LIN, 36)) - 6} fill={SERIES[0]}>straight line, ε moves</text>
      <text class="clab" x={x(19)} y={y(q(CES, 19)) - 6} fill={PINK}>constant ε = 5/3</text>

      <line class="pin" x1={x(P0)} y1={y(Q0)} x2={x(P0)} y2={H - M.bottom} />
      <circle class="pin-dot" cx={x(P0)} cy={y(Q0)} r="6" fill="none" stroke={SERIES[0]} stroke-width="1.8" />
      <text class="clab pin-lab" x={x(P0)} y={y(Q0) - 10} text-anchor="middle">the point: p = 25, q = 45, ε = 5/3</text>

      <line class="opt" x1={x(pLin)} y1={M.top} x2={x(pLin)} y2={H - M.bottom} />
      <line class="opt ces" x1={x(pCes)} y1={M.top} x2={x(pCes)} y2={H - M.bottom} />
      <text class="clab opt-lab" x={x(pLin)} y={M.top + 10} text-anchor="middle">{pLin.toFixed(1)}</text>
      <text class="clab opt-lab" x={x(pCes)} y={M.top + 24} text-anchor="middle">{pCes.toFixed(1)}</text>
    </svg>

    <label class="slider">
      <span class="slider-name">marginal cost c</span>
      <input type="range" min="8" max="12" step="0.5" value={c}
        oninput={(e) => (c = +e.currentTarget.value)}
        aria-label="Marginal cost" />
    </label>
  </div>
</div>

<style>
  .fig { max-width: 680px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .curve { fill: none; stroke-width: 2.5; }
  .curve.lin { stroke: var(--primary); }
  .curve.ces { stroke: var(--pink); }
  .pin { stroke: #8a94a2; stroke-width: 1; stroke-dasharray: 2 3; }
  .pin-lab { fill: #5a6672; font-size: 10px; }
  .opt { stroke: var(--primary); stroke-width: 1.5; stroke-dasharray: 5 4; }
  .opt.ces { stroke: var(--pink); }
  .opt-lab { font-size: 10.5px; font-weight: 600; }
  .clab { font-family: var(--font-mono); font-size: 10px; fill: #8a94a2; }
  .pin-dot { fill: none; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .slider { display: flex; align-items: center; gap: 10px; margin: 0.4rem 0 0 0; }
  .slider-name { font-family: var(--font-mono); font-size: 0.75rem; color: #5a6672; white-space: nowrap; }
  .slider input { flex: 1; accent-color: var(--primary); }
</style>