<script>
  /*
    What actually bends the hours curve. A constant sigma below 1 does make
    hours fall, but it drives them to zero. A subsistence floor inside
    Cobb-Douglas makes them fall and then level off at exactly the
    Cobb-Douglas answer, which is the shape the historical series has.
  */
  import katexify from "../katexify.js";
  import { linear, log as logScale, clampW, ticks, pathOf } from "../chart.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { BASE, SUB_W_MIN, SUB_W_MAX, CBAR_DEFAULT } from "../datasets.js";
  import { optimum, stoneGearyHours } from "../choice.js";

  const H = 300;
  const M = { top: 18, right: 20, bottom: 42, left: 52 };
  const T = BASE.T;
  const DECADES = [5, 10, 50, 100, 500];

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let cbar = $state(CBAR_DEFAULT);

  let x = $derived(logScale(SUB_W_MIN, SUB_W_MAX, M.left, W - M.right));
  let y = $derived(linear(0, T, H - M.bottom, M.top));

  function sweep(fn) {
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const w = SUB_W_MIN * Math.pow(SUB_W_MAX / SUB_W_MIN, i / 160);
      const h = fn(w);
      if (!(h > 0) || h > T) continue;
      pts.push([x(w), y(h)]);
    }
    return pathOf(pts);
  }

  let sg = $derived(sweep((w) => stoneGearyHours(w, { a: BASE.a, T, cbar })));
  let ces = $derived(sweep((w) => optimum(w, { a: BASE.a, sigma: 0.5, T }).h));
  let floor = $derived(pathOf([[x(SUB_W_MIN), y(BASE.a * T)], [x(SUB_W_MAX), y(BASE.a * T)]]));

  let readout = $derived(
    `With a ${cbar} kr floor to cover, a worker on 10 kr an hour puts in ${stoneGearyHours(10, { a: BASE.a, T, cbar }).toFixed(2)} hours and one on 400 kr puts in ${stoneGearyHours(400, { a: BASE.a, T, cbar }).toFixed(2)} — falling towards eight and never past it.`
  );
  let eq = $derived(
    katexify(`h(w) = \\alpha T + (1-\\alpha)\\frac{\\bar{c}}{w}`, true)
  );

  let yTicks = $derived(ticks(0, T, 4));
</script>

<div class="fig" id="subsistence">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each yTicks as t}
          <line x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} class="grid" />
          <text x={M.left - 8} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        {#each DECADES as d}
          <text x={x(d)} y={H - M.bottom + 16} text-anchor="middle">{d}</text>
        {/each}
        <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} class="rule" />
        <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} class="rule" />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">
          wage, kr per hour (log scale)
        </text>
        <text
          class="axis-title"
          transform={`rotate(-90 13 ${(M.top + H - M.bottom) / 2})`}
          x="13"
          y={(M.top + H - M.bottom) / 2}
          text-anchor="middle">hours worked</text
        >
      </g>

      <path d={floor} fill="none" stroke={BACKGROUND_CLASS} class="floor" />
      <!-- anchored at the left, because both curves converge on the right -->
      <text class="lab" x={M.left + 6} y={y(BASE.a * T) - 8} text-anchor="start">
        αT = 8 hours
      </text>

      <path d={ces} fill="none" stroke={SERIES[1]} class="curve ces" />
      <path d={sg} fill="none" stroke={SERIES[0]} class="curve sg" />
    </svg>
  </div>

  <label class="ctl">
    subsistence floor c̄, kr per day
    <input type="range" min="0" max="120" step="5" bind:value={cbar} />
    <span class="val">{cbar}</span>
  </label>

  <p class="legend">
    <span class="key" style="background:{SERIES[0]}"></span> Cobb–Douglas with a subsistence floor
    <span class="key" style="background:{SERIES[1]}"></span> constant σ = 0.5
  </p>

  <div class="eq">{@html eq}</div>
</div>

<style>
  .fig { max-width: 680px; margin: 1.8rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title {
    font-family: var(--font-main); font-size: 0.95rem; line-height: 1.45;
    margin: 0 0 0.5rem 0; color: var(--squid-ink);
  }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .curve { stroke-width: 2.5; }
  .floor { stroke-width: 1.5; stroke-dasharray: 5 4; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .axis-title { font-family: var(--font-main); }
  .lab {
    font-family: var(--font-main); font-size: 11px; fill: #8a94a2;
    stroke: #fff; stroke-width: 3px; paint-order: stroke;
  }
  .grid { stroke: #eef1f2; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .ctl {
    display: flex; align-items: center; gap: 0.6rem;
    font-family: var(--font-main); font-size: 0.9rem; margin-top: 0.7rem;
    color: var(--squid-ink);
  }
  .ctl input { flex: 1; min-width: 110px; accent-color: #7c5aed; }
  .val { font-family: var(--font-mono); min-width: 2.6rem; text-align: right; }
  .legend {
    font-family: var(--font-main); font-size: 0.82rem; color: #5b6670;
    margin: 0.5rem 0 0 0; line-height: 1.9;
  }
  .key {
    display: inline-block; width: 14px; height: 3px; vertical-align: middle;
    margin: 0 0.25rem 0 0.6rem; border-radius: 2px;
  }
  .legend .key:first-child { margin-left: 0; }
  .eq { text-align: center; margin: 0.9rem 0 0 0; }
</style>
