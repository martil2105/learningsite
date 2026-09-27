<script>
  /*
    Competition. One job a month, the standard regime r = 2, and an incumbent
    who has been selling the run at LEGACY's cost of 48 because that was the
    cheapest way to do it. A rival adopts INDEXED at 26 and undercuts by the
    slider. The rent — the gap between the price and the envelope — shrinks
    one for one with the undercut and reaches exactly zero when the undercut
    reaches the gap: competition destroys the rent, and the innovation has
    then spread. The readout is built in the script block.
  */
  import { SET } from "../datasets.js";
  import { costAt, cheapest, envelope, gap, rentSlope } from "../technology.js";
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const R = 2; // the industry standard
  const LEGACY = SET.find((t) => t.id === "L");
  const INDEXED = SET.find((t) => t.id === "S");

  const H = 210;
  const M = { top: 18, right: 16, bottom: 40, left: 52 };

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let undercut = $state(0);

  let env = $derived(envelope(SET, R));
  let rent = $derived(gap(LEGACY, SET, R));
  let price = $derived(costAt(LEGACY, R) - undercut);
  let rivalProfit = $derived(price - env);
  let slope = $derived(rentSlope(LEGACY, INDEXED));

  let xU = $derived(linear(0, rent, M.left, W - M.right));
  let yC = $derived(linear(0, costAt(LEGACY, R), H - M.bottom, M.top));

  let readout = $derived.by(() => {
    if (undercut >= rent) {
      return `Undercut by ${undercut.toFixed(1)}, the run sells at ${price.toFixed(1)} — exactly INDEXED's cost. The rent is zero, and the innovation has spread.`;
    }
    return `Undercut by ${undercut.toFixed(1)}, the run sells at ${price.toFixed(1)}, the pioneer's rent is ${rent.toFixed(1)} − ${undercut.toFixed(1)} = ${(rent - undercut).toFixed(1)}, and the rival is earning ${(rivalProfit).toFixed(1)}.`;
  });
</script>

<div class="fig" id="spread-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="The price of a run against the rival's undercut, with the rent shrinking to zero">
      <g class="axis">
        {#each [0, 0.25, 0.5, 0.75, 1] as f}
          <line class="grid" x1={xU(f * rent)} y1={M.top} x2={xU(f * rent)} y2={H - M.bottom} />
          <text x={xU(f * rent)} y={H - M.bottom + 15} text-anchor="middle">{(f * rent).toFixed(0)}</text>
        {/each}
        {#each [26, 37, 48] as t}
          <line class="grid" x1={M.left} y1={yC(t)} x2={W - M.right} y2={yC(t)} />
          <text x={M.left - 7} y={yC(t) + 4} text-anchor="end">{t}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">the rival's undercut, machine-days</text>
      </g>

      <rect class="rentband" x={xU(undercut)} y={yC(price)}
        width={Math.max(0, xU(rent) - xU(undercut))}
        height={Math.max(0, yC(env) - yC(price))} />
      <line class="price" x1={xU(0)} y1={yC(costAt(LEGACY, R))} x2={xU(rent)} y2={yC(env)} />
      <circle class="dot" cx={xU(undercut)} cy={yC(price)} r="6" fill={SERIES[0]} />
      <text class="clab" x={xU(0) + 6} y={yC(costAt(LEGACY, R)) - 6}>LEGACY's cost, yesterday's price</text>
      <text class="clab" x={xU(rent) - 4} y={yC(env) + 16} text-anchor="end">INDEXED's cost</text>
    </svg>

    <label class="slider">
      <span class="slider-name">the rival's undercut</span>
      <input type="range" min="0" max={rent} step="0.5" value={undercut}
        oninput={(e) => (undercut = +e.currentTarget.value)}
        aria-label="The rival's undercut, in machine-days" />
    </label>
  </div>

  <p class="note">
    The gain to switching from LEGACY to INDEXED grows by exactly {slope}
    machine-days for every unit that r rises — the switch sheds
    {LEGACY.N - INDEXED.N} engineer-days, so people getting dearer makes the
    innovation worth more, which is how it spreads.
  </p>
</div>

<style>
  .fig { --pink: #df2a5d; max-width: 680px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .rentband { fill: var(--pink); opacity: 0.25; }
  .price { stroke: var(--primary); stroke-width: 2.5; }
  .dot { stroke: white; stroke-width: 1.5; }
  .clab { font-family: var(--font-mono); font-size: 10.5px; fill: #8a94a2; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .grid { stroke: #e3e7ea; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .axis-title { font-size: 11px; }
  .slider { display: flex; align-items: center; gap: 10px; margin: 0.4rem 0 0 0; }
  .slider-name { font-family: var(--font-mono); font-size: 0.75rem; color: #5a6672; white-space: nowrap; }
  .slider input { flex: 1; accent-color: var(--primary); }
  .note { font-family: var(--font-main); font-size: 0.9rem; color: #5a6672; margin: 0.6rem 0 0 0; }
</style>