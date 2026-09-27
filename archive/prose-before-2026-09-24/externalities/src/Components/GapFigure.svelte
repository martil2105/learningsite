<script>
  /*
    The gap. The market's own equilibrium against the social one: the
    vertical distance between the private and social supply curves is the
    uncounted cost e, and it is the whole distance between the two
    quantities. Both quantities are drawn from closed forms; the numeric
    optimum in src/externality.js is the independent route the checks use.
  */
  import { A, B, C, S, E, pD, pS, pSsocial, q0, qSocial } from "../externality.js";
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 280;
  const M = { top: 20, right: 16, bottom: 40, left: 50 };
  const Q_MAX = 55, P_MAX = 55;
  const PINK = "#df2a5d";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let x = $derived(linear(0, Q_MAX, M.left, W - M.right));
  let y = $derived(linear(0, P_MAX, H - M.bottom, M.top));

  const pc = pD(q0);   // 30, the laissez-faire price
  const psSocial = pD(qSocial); // 34

  const qTicks = [0, 10, 20, 30, 40, 50];
  const pTicks = [0, 10, 20, 30, 40, 50];

  let readout = $derived(
    `The market stops at ${q0} units and price ${pc}; the social optimum is ${qSocial} units and price ${psSocial}. The whole difference is the uncounted ${E} a unit, and leaving the market alone burns 48 of surplus.`
  );
</script>

<div class="fig" id="gap-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Private supply, social supply, and the gap of uncounted cost between the two equilibria">
      <g class="axis">
        {#each qTicks as qt}
          <line class="grid" x1={x(qt)} y1={M.top} x2={x(qt)} y2={H - M.bottom} />
          <text x={x(qt)} y={H - M.bottom + 15} text-anchor="middle">{qt}</text>
        {/each}
        {#each pTicks as pt}
          <line class="grid" x1={M.left} y1={y(pt)} x2={W - M.right} y2={y(pt)} />
          <text x={M.left - 7} y={y(pt) + 4} text-anchor="end">{pt}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">output</text>
        <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">price</text>
      </g>

      <path class="base" d={`M ${x(0)} ${y(pD(0))} L ${x(Q_MAX)} ${y(Math.max(0, pD(Q_MAX)))}`} />
      <path class="base" d={`M ${x(C)} ${y(pS(C))} L ${x(Q_MAX)} ${y(pS(Q_MAX))}`} />
      <path class="social" d={`M ${x(C)} ${y(Math.min(P_MAX, pSsocial(C)))} L ${x(Q_MAX)} ${y(pSsocial(Q_MAX))}`} />
      <text class="clab" x={x(46)} y={y(pD(46)) - 6}>demand</text>
      <text class="clab" x={x(46)} y={y(pS(46)) + 14}>supply (private)</text>
      <text class="clab social-lab" x={x(8)} y={y(Math.min(P_MAX, pSsocial(8))) - 6}>supply + the uncounted {E}</text>

      <line class="gap" x1={x(q0)} y1={y(pc)} x2={x(q0)} y2={y(Math.min(P_MAX, pSsocial(q0)))} />
      <line class="scrub" x1={x(qSocial)} y1={M.top} x2={x(qSocial)} y2={H - M.bottom} />
      <circle class="dot" cx={x(q0)} cy={y(pc)} r="6" fill={SERIES[0]} />
      <circle class="dot" cx={x(qSocial)} cy={y(psSocial)} r="6" fill={PINK} />
      <text class="clab q0-lab" x={x(q0) + 6} y={y(pc) + 14}>the market: {q0}</text>
      <text class="clab qs-lab" x={x(qSocial) - 6} y={y(psSocial) - 10} text-anchor="end">the optimum: {qSocial}</text>
    </svg>
  </div>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .base { fill: none; stroke: #8a94a2; stroke-width: 1.8; }
  .social { fill: none; stroke: var(--primary); stroke-width: 1.8; stroke-dasharray: 6 4; }
  .social-lab { fill: var(--primary); }
  .gap { stroke: var(--pink); stroke-width: 2; }
  .scrub { stroke: #8a94a2; stroke-width: 1; stroke-dasharray: 2 3; }
  .dot { stroke: white; stroke-width: 1.5; }
  .clab { font-family: var(--font-mono); font-size: 10px; fill: #8a94a2; }
  .q0-lab { fill: var(--squidink); }
  .qs-lab { fill: var(--pink); }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
</style>