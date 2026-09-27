<script>
  /*
    The hook. Four hundred economies (or households, or funds) whose growth
    each year is independent and lognormal, all with the same expected growth
    of 2% a year. One control: the volatility sigma of annual log growth.

    Drawn on a logarithmic axis: every path in grey, the expected level in
    dashed ink, the median path in blue. The readouts compare the simulated
    share of paths ending above the expected level with the exact
    Phi(−sigma·sqrt(t)/2). Paths are split where they leave the plot and cut
    at the boundary, never clamped along it (house rule: draw only inside the
    window).
  */
  import { normals, paths, expectedLevel, medianLevel, shareAboveMean, typicalRate } from "../growth.js";
  import { MEAN_GROWTH, LAB_YEARS, LAB_PATHS, SIGMA_DEFAULT, SIGMA_MIN, SIGMA_MAX, SEED } from "../datasets.js";
  import { SERIES, INK } from "../palette.js";
  import { linear, log, clampW } from "../chart.js";

  const Y0 = 0.01, Y1 = 100;
  const Z = normals(LAB_PATHS, LAB_YEARS, SEED);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth - 2));
  let inner = $derived(W - 32);
  const H = 320;
  const M = { top: 12, right: 16, bottom: 38, left: 48 };
  let x = $derived(linear(0, LAB_YEARS, M.left, inner - M.right));
  let y = $derived(log(Y0, Y1, H - M.bottom, M.top));

  let sigma = $state(SIGMA_DEFAULT);
  let P = $derived(paths(Z, MEAN_GROWTH, sigma));

  // One path → an SVG d string made of the pieces that lie inside [Y0, Y1],
  // each cut exactly at the boundary (interpolated in log space).
  function clippedD(levels) {
    const lo = Math.log(Y0), hi = Math.log(Y1);
    let d = "", pen = false;
    for (let t = 0; t < levels.length; t++) {
      const v = Math.log(levels[t]);
      const inside = v >= lo && v <= hi;
      if (t > 0) {
        const u = Math.log(levels[t - 1]);
        const wasInside = u >= lo && u <= hi;
        if (inside !== wasInside) {
          const edge = (inside ? u : v) > hi ? hi : lo;
          const f = (edge - u) / (v - u);
          const tx = x(t - 1 + f), ty = y(Math.exp(edge));
          d += `${inside ? "M" : "L"} ${tx.toFixed(2)} ${ty.toFixed(2)} `;
          pen = inside;
        }
      }
      if (inside) {
        d += `${pen ? "L" : "M"} ${x(t).toFixed(2)} ${y(levels[t]).toFixed(2)} `;
        pen = true;
      } else {
        pen = false;
      }
    }
    return d.trim();
  }
  let ds = $derived(P.map(clippedD).filter((d) => d.length));
  let expD = $derived(
    Array.from({ length: LAB_YEARS + 1 }, (_, t) => `${t ? "L" : "M"} ${x(t).toFixed(2)} ${y(expectedLevel(MEAN_GROWTH, t)).toFixed(2)}`).join(" ")
  );
  let medD = $derived(
    Array.from({ length: LAB_YEARS + 1 }, (_, t) => `${t ? "L" : "M"} ${x(t).toFixed(2)} ${y(medianLevel(MEAN_GROWTH, sigma, t)).toFixed(2)}`).join(" ")
  );

  let E = $derived(expectedLevel(MEAN_GROWTH, LAB_YEARS));
  let med = $derived(medianLevel(MEAN_GROWTH, sigma, LAB_YEARS));
  let simAbove = $derived(P.filter((p) => p[LAB_YEARS] > E).length / LAB_PATHS);
  let exactAbove = $derived(shareAboveMean(sigma, LAB_YEARS));
  const pct = (v, d = 1) => `${v < 0 ? "−" : ""}${Math.abs(v * 100).toFixed(d)}%`;

  const PRESETS = [
    { label: "a country's GDP", v: 0.02 },
    { label: "one household's earnings", v: 0.15 },
    { label: "a stock", v: 0.2 },
  ];
  let facts = $derived([
    { k: "expected", label: `expected level, year ${LAB_YEARS}`, v: `${E.toFixed(2)}×` },
    { k: "median", label: "median path", v: `${med.toFixed(2)}×` },
    { k: "typical", label: "median growth rate", v: `${pct(typicalRate(MEAN_GROWTH, sigma), 2)} a year` },
    { k: "above", label: "paths above expected", v: `${pct(simAbove)} simulated, ${pct(exactAbove)} exact` },
  ]);
</script>

<div class="fig" id="fan-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <div class="lab">
    <div class="controls-bar">
      <label class="slider">
        <span class="s-name">volatility of annual growth, σ <b>{(sigma * 100).toFixed(0)}%</b></span>
        <input type="range" min={SIGMA_MIN * 100} max={SIGMA_MAX * 100} step="1" value={Math.round(sigma * 100)}
          oninput={(e) => (sigma = +e.currentTarget.value / 100)} />
      </label>
      <div class="presets">
        {#each PRESETS as p}
          <button class="pill" class:active={Math.abs(sigma - p.v) < 1e-9} onclick={() => (sigma = p.v)}>{p.label}, {Math.round(p.v * 100)}%</button>
        {/each}
      </div>
      <div class="facts">
        {#each facts as f}
          <div class={`fact ${f.k}`}><span class="f-label">{f.label}</span><b>{f.v}</b></div>
        {/each}
      </div>
    </div>
    <p class="fig-title">{LAB_PATHS} paths, each expecting 2% growth a year, on a logarithmic axis</p>
    <svg width={inner} height={H} viewBox={`0 0 ${inner} ${H}`}>
      <g class="axis">
        {#each [0.01, 0.1, 1, 10, 100] as t}
          <line class="grid" x1={M.left} x2={inner - M.right} y1={y(t)} y2={y(t)} />
          <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{t}×</text>
        {/each}
        {#each [0, 10, 20, 30, 40, 50] as t}
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        <text class="axis-title" x={(M.left + inner - M.right) / 2} y={H - 4} text-anchor="middle">years</text>
      </g>
      <g class="fan">
        {#each ds as d}
          <path class="one" d={d} />
        {/each}
      </g>
      <path class="expected" d={expD} stroke={INK} />
      <path class="median" d={medD} stroke={SERIES[0]} />
      <circle class="exp-end" cx={x(LAB_YEARS)} cy={y(E)} r="4.5" fill={INK} />
      <circle class="med-end" cx={x(LAB_YEARS)} cy={y(med)} r="4.5" fill={SERIES[0]} />
    </svg>
    <p class="legend">
      <span class="key"><span class="swatch grey"></span>one path each</span>
      <span class="key"><span class="swatch dashed"></span>the expected level</span>
      <span class="key"><span class="swatch" style={`background:${SERIES[0]}`}></span>the median path</span>
    </p>
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

  .slider {
    display: flex;
    flex-direction: column;
    gap: 2px;
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

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.4rem;
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
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8a94a2;
  }

  .fact b {
    font-family: var(--font-mono);
    font-size: 0.88rem;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.88rem;
    margin: 0 0 0.3rem 0;
    color: #3d4a57;
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

  .one {
    fill: none;
    stroke: #8a94a2;
    stroke-width: 0.8;
    opacity: 0.28;
  }

  .expected {
    fill: none;
    stroke-width: 2.2;
    stroke-dasharray: 6 4;
  }

  .median {
    fill: none;
    stroke-width: 2.8;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1rem;
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #61707d;
    margin: 0.3rem 0 0 0;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .swatch {
    display: inline-block;
    width: 14px;
    height: 4px;
  }

  .swatch.grey {
    background: #8a94a2;
    opacity: 0.5;
  }

  .swatch.dashed {
    height: 0;
    border-top: 2px dashed #232f3e;
  }
</style>
