<script>
  /*
    The hook. A market, a rate slider, and a statutory toggle: tax the
    sellers and the supply curve visibly shifts; tax the buyers and the
    demand curve visibly shifts. The outcome — buyer's price, seller's
    price, quantity, the whole incidence arithmetic — is the same object
    either way, and check-browser.mjs asserts the dots do not move while the
    curve does.
  */
  import { A, B, C, S, p0, q0, solveSeller, solveBuyer, consumerShare, dwl, revenue } from "../market.js";
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 300;
  const M = { top: 20, right: 16, bottom: 40, left: 50 };
  const Q_MAX = 90, P_MAX = 45;
  const PINK = "#df2a5d";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let t = $state(5);
  let onSeller = $state(true);

  let x = $derived(linear(0, Q_MAX, M.left, W - M.right));
  let y = $derived(linear(0, P_MAX, H - M.bottom, M.top));

  const dLine = (q) => (A - B * q);
  const sLine = (q) => (q - C) / S;

  let r = $derived(onSeller ? solveSeller(t) : solveBuyer(t));
  let share = $derived(consumerShare());
  let loss = $derived(dwl(t));
  let take = $derived(revenue(t));

  let readout = $derived(
    `With a tax of ${t.toFixed(1)} on ${onSeller ? "sellers" : "buyers"}, buyers pay ${r.pc.toFixed(2)}, sellers keep ${r.pp.toFixed(2)} and ${r.q.toFixed(1)} units trade. Buyers bear ${(share * 100).toFixed(0)}% of the tax, it raises ${take.toFixed(1)}, and ${loss.toFixed(1)} of surplus is lost.`
  );

  const qTicks = [0, 20, 40, 60, 80];
  const pTicks = [0, 10, 20, 30, 40];
</script>

<div class="fig" id="wedge-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="controls">
    <div class="presets" role="group" aria-label="Who is statutorily liable">
      <button class="pick" class:active={onSeller} onclick={() => (onSeller = true)}>tax on sellers</button>
      <button class="pick" class:active={!onSeller} onclick={() => (onSeller = false)}>tax on buyers</button>
    </div>
  </div>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Supply and demand with the tax wedge; whichever curve the statute moves, the outcome does not move">
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
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">quantity</text>
        <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">price</text>
      </g>

      {#if onSeller}
        <path class="shifted" d={`M ${x(0)} ${y(Math.min(P_MAX, sLine(0) + t))} L ${x(Q_MAX)} ${y(Math.min(P_MAX, sLine(Q_MAX) + t))}`} />
      {:else}
        <path class="shifted" d={`M ${x(0)} ${y(Math.max(0, dLine(0) - t))} L ${x(Q_MAX)} ${y(Math.max(0, dLine(Q_MAX) - t))}`} />
      {/if}

      <path class="base" d={`M ${x(0)} ${y(dLine(0))} L ${x(Q_MAX)} ${y(dLine(Q_MAX))}`} />
      <path class="base" d={`M ${x(C)} ${y(sLine(C))} L ${x(Q_MAX)} ${y(sLine(Q_MAX))}`} />
      <text class="clab" x={x(70)} y={y(dLine(70)) - 6}>demand</text>
      <text class="clab" x={x(70)} y={y(sLine(70)) + 14}>supply</text>
      <text class="clab shifted-lab" x={x(70)}
        y={onSeller ? y(sLine(70) + t) - 6 : y(Math.max(0, dLine(70) - t)) - 6}>
        {onSeller ? "supply + t" : "demand − t"}
      </text>

      <rect class="wedge" x={x(r.q) - 6} y={y(r.pc)} width="12"
        height={Math.max(0, y(r.pp) - y(r.pc))} />
      <line class="scrub" x1={x(r.q)} y1={M.top} x2={x(r.q)} y2={H - M.bottom} />
      <circle class="dot pc" cx={x(r.q)} cy={y(r.pc)} r="5.5" fill={SERIES[0]} />
      <circle class="dot pp" cx={x(r.q)} cy={y(r.pp)} r="5.5" fill={PINK} />
    </svg>

    <label class="slider">
      <span class="slider-name">tax per unit t</span>
      <input type="range" min="0" max="15" step="0.5" value={t}
        oninput={(e) => (t = +e.currentTarget.value)}
        aria-label="Tax per unit" />
    </label>
  </div>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .controls { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 0 0 0.8rem 0; }
  .presets { display: flex; flex-wrap: wrap; gap: 6px; }
  .pick { font-family: var(--font-mono); font-size: 0.78rem; padding: 5px 10px; border: 1px solid #c7cdd4; border-radius: 4px; background: white; color: var(--squidink); cursor: pointer; }
  .pick.active { border-color: var(--primary); color: var(--primary); font-weight: 600; }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .base { fill: none; stroke: #8a94a2; stroke-width: 1.8; }
  .shifted { fill: none; stroke: var(--primary); stroke-width: 1.8; stroke-dasharray: 6 4; }
  .shifted-lab { fill: var(--primary); }
  .wedge { fill: var(--pink); opacity: 0.3; }
  .scrub { stroke: #8a94a2; stroke-width: 1; stroke-dasharray: 2 3; }
  .dot { stroke: white; stroke-width: 1.5; }
  .clab { font-family: var(--font-mono); font-size: 10px; fill: #8a94a2; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .slider { display: flex; align-items: center; gap: 10px; margin: 0.4rem 0 0 0; }
  .slider-name { font-family: var(--font-mono); font-size: 0.75rem; color: #5a6672; white-space: nowrap; }
  .slider input { flex: 1; accent-color: var(--primary); }
</style>
