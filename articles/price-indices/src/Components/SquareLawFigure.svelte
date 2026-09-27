<script>
  /*
    The identity figure. On log–log axes, the fixed basket's overstatement
    (log points) against the size of the energy shock (|ln R|) is a family of
    straight lines of slope 2, one per sigma, and Fisher's error is a family of
    slope 3 far below them. check-numbers.mjs asserts both slopes; the scrubber
    reads the sigma = 1 pair at any shock size, and check-browser.mjs asserts its
    markers sit on their curves.
  */
  import { shock } from "../indices.js";
  import { W_ENERGY } from "../datasets.js";
  import { log, logTicks, clampW, pathOf } from "../chart.js";

  const RAMP = { 0.5: "#8c82d2", 1: "#5b4ba1", 2: "#311072" };
  const SIGMAS = [0.5, 1, 2];
  const X0 = 0.02, X1 = 1, Y0 = 1e-8, Y1 = 0.3;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 290;
  const M = { top: 12, right: 14, bottom: 40, left: 50 };
  let x = $derived(log(X0, X1, M.left, W - M.right));
  let y = $derived(log(Y0, Y1, H - M.bottom, M.top));

  const N = 80;
  const xs = Array.from({ length: N + 1 }, (_, i) => X0 * Math.pow(X1 / X0, i / N));
  const gaps = (s, xv) => {
    const r = shock(Math.exp(xv), s, W_ENERGY);
    return { las: Math.log(r.L) - Math.log(r.C), fis: Math.abs(Math.log(r.F) - Math.log(r.C)) };
  };
  const series = SIGMAS.map((s) => ({ s, pts: xs.map((xv) => ({ xv, ...gaps(s, xv) })) }));

  let paths = $derived(
    series.map((ser) => ({
      s: ser.s,
      las: pathOf(ser.pts.map((p) => [x(p.xv), y(p.las)])),
      fis: pathOf(ser.pts.filter((p) => p.fis >= Y0).map((p) => [x(p.xv), y(p.fis)])),
    }))
  );

  let lx = $state(Math.log(2)); // the scrubber, |ln R|
  let here = $derived(gaps(1, lx));
  const pts = (v) => (v * 100).toFixed(v * 100 < 0.01 ? 4 : 2);
  let readout = $derived(
    `A shock of ×${Math.exp(lx).toFixed(2)} with σ = 1: the fixed basket overstates by ${pts(here.las)} log points, Fisher by ${pts(here.fis)}.`
  );
  let xTicks = $derived(logTicks(X0, X1, true));
  let yTicks = $derived(logTicks(Y0 * 10, Y1));
  // Log points (×100), written as plain numbers down to 0.01 and powers of ten below.
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  function fmtY(v) {
    const lp = v * 100;
    if (lp >= 0.01) return String(+lp.toPrecision(1));
    const e = Math.round(Math.log10(lp));
    return "10" + String(e).split("").map((c) => SUP[c]).join("");
  }
</script>

<div class="fig" id="square-law">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>
    <p class="fig-title">{readout}</p>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each yTicks as t}
          <line class="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
          <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{fmtY(t)}</text>
        {/each}
        {#each xTicks as t}
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">size of the energy shock, |ln R|</text>
        <text class="axis-title" x={M.left + 4} y={M.top + 10}>overstatement, log points</text>
      </g>
      {#each paths as p}
        <path class={`las s${p.s * 10}`} d={p.las} stroke={RAMP[p.s]} />
        <path class={`fis s${p.s * 10}`} d={p.fis} stroke={RAMP[p.s]} />
      {/each}
      <line class="cursor" x1={x(lx)} x2={x(lx)} y1={M.top} y2={H - M.bottom} />
      <circle class="mk las-mk" cx={x(lx)} cy={y(here.las)} r="5" fill={RAMP[1]} />
      <circle class="mk fis-mk" cx={x(lx)} cy={y(here.fis)} r="5" fill="#fff" stroke={RAMP[1]} stroke-width="2" />
    </svg>
    <label class="slider">
      <span class="s-name">size of the shock <b>×{Math.exp(lx).toFixed(2)}</b></span>
      <input type="range" min="-3.91" max="0" step="0.01" value={Math.log(lx)}
        oninput={(e) => (lx = Math.exp(+e.currentTarget.value))} />
    </label>
    <p class="legend">
      <span class="key"><span class="line solid"></span>fixed basket</span>
      <span class="key"><span class="line dashed"></span>Fisher</span>
      {#each SIGMAS as s}
        <span class="key"><span class="dot" style={`background:${RAMP[s]}`}></span>σ = {s}</span>
      {/each}
    </p>
  </div>
</div>

<style>
  .fig {
    max-width: 620px;
    margin: 1.8rem auto;
    padding: 0 1rem;
  }

  .card {
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 0.9rem 16px;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.9rem;
    line-height: 1.5;
    min-height: 3em;
    margin: 0 0 0.4rem 0;
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

  path {
    fill: none;
    stroke-width: 2.2;
  }

  path.fis {
    stroke-dasharray: 6 4;
  }

  .cursor {
    stroke: #c9d1d8;
    stroke-dasharray: 3 3;
  }

  .slider {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 0.4rem;
  }

  .s-name {
    font-family: var(--font-main);
    font-size: 0.85rem;
  }

  .s-name b {
    font-family: var(--font-mono);
    float: right;
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--violet);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.9rem;
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #61707d;
    margin: 0.4rem 0 0 0;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .line {
    display: inline-block;
    width: 18px;
    border-top: 2.5px solid #5b4ba1;
  }

  .line.dashed {
    border-top-style: dashed;
  }

  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
</style>
