<script>
  /*
    The identity. log(h/f) is exactly linear in log w with slope sigma - 1, so
    the whole family is a fan of straight lines through one point and the
    Cobb-Douglas case is the horizontal one. The dots are the model solved
    numerically; the line is the closed form. Nothing is fitted.
  */
  import katexify from "../katexify.js";
  import { linear, clampW, ticks, pathOf } from "../chart.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { BASE } from "../datasets.js";
  import { optimum, logOddsLine } from "../choice.js";

  const H = 300;
  const M = { top: 18, right: 20, bottom: 42, left: 52 };
  const T = BASE.T;
  const LW = [0, Math.log(1000)];
  const Y = [-4.5, 10.5];
  const DECADES = [1, 10, 100, 1000];

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let sigma = $state(1.6);

  let p = $derived({ a: BASE.a, sigma, T });
  let x = $derived(linear(LW[0], LW[1], M.left, W - M.right));
  let y = $derived(linear(Y[0], Y[1], H - M.bottom, M.top));

  function dots() {
    const out = [];
    for (let i = 0; i <= 26; i++) {
      const lw = LW[0] + (i / 26) * (LW[1] - LW[0]);
      const o = optimum(Math.exp(lw), p);
      out.push([x(lw), y(Math.log(o.h / o.f))]);
    }
    return out;
  }
  function closedForm() {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const lw = LW[0] + (i / 60) * (LW[1] - LW[0]);
      pts.push([x(lw), y(logOddsLine(Math.exp(lw), p))]);
    }
    return pathOf(pts);
  }

  /* Least squares on the dots, so the slope on screen is measured rather than
     asserted. It comes back as sigma - 1 to twelve digits. */
  function measuredSlope() {
    const xs = [], ys = [];
    for (let i = 0; i <= 200; i++) {
      const lw = LW[0] + (i / 200) * (LW[1] - LW[0]);
      const o = optimum(Math.exp(lw), p);
      xs.push(lw); ys.push(Math.log(o.h / o.f));
    }
    const n = xs.length;
    const mx = xs.reduce((s, v) => s + v, 0) / n;
    const my = ys.reduce((s, v) => s + v, 0) / n;
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
    return sxy / sxx;
  }

  let pts = $derived(dots());
  let line = $derived(closedForm());
  let slope = $derived(measuredSlope());
  let cdLine = $derived(pathOf([[x(LW[0]), y(0)], [x(LW[1]), y(0)]]));

  let readout = $derived(
    `Slope measured off the drawn points: ${slope.toFixed(12)}. σ − 1 = ${(sigma - 1).toFixed(12)}.`
  );
  let eq = $derived(
    katexify(`\\log\\frac{h}{f} = \\sigma\\log\\frac{\\alpha}{1-\\alpha} + (\\sigma-1)\\log w`, true)
  );

  let yTicks = $derived(ticks(Y[0], Y[1], 5));
</script>

<div class="fig" id="sigmaline">
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
          <text x={x(Math.log(d))} y={H - M.bottom + 16} text-anchor="middle">{d}</text>
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
          text-anchor="middle">log (hours worked / free time)</text
        >
      </g>

      <path d={cdLine} fill="none" stroke={BACKGROUND_CLASS} class="cd" />
      <text class="lab" x={W - M.right - 4} y={y(0) - 8} text-anchor="end">σ = 1</text>

      <path d={line} fill="none" stroke={SERIES[0]} class="model" />
      {#each pts as [cx, cy]}
        <circle {cx} {cy} r="3.4" fill={SERIES[1]} />
      {/each}
    </svg>
  </div>

  <label class="ctl">
    σ
    <input type="range" min="0.4" max="2.5" step="0.02" bind:value={sigma} />
    <span class="val">{Number(sigma).toFixed(2)}</span>
  </label>

  <p class="legend">
    <span class="key" style="background:{SERIES[1]}"></span> the model, solved
    <span class="key" style="background:{SERIES[0]}"></span> the closed form, drawn straight
  </p>

  <div class="eq">{@html eq}</div>
</div>

<style>
  .fig { max-width: 680px; margin: 1.8rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title {
    font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.45;
    margin: 0 0 0.5rem 0; color: var(--squid-ink);
  }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .model { stroke-width: 2.5; opacity: 0.9; }
  .cd { stroke-width: 1.5; stroke-dasharray: 5 4; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .axis-title { font-family: var(--font-main); }
  .lab { font-family: var(--font-main); font-size: 11px; fill: #8a94a2; }
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
