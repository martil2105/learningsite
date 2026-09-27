<script>
  /*
    The identity. Growth alternating between a + s and a − s averages a but
    compounds at sqrt((1 + a)^2 − s^2) − 1, whatever the order. Against the
    swing s, with a = 3%, that is a curve falling from 3% and crossing zero at
    s = sqrt(1.03^2 − 1). The scrubber reads it; check-browser.mjs asserts the
    marker is on the curve and the zero crossing where the readout says.
  */
  import { alternating, zeroGrowthSwing } from "../growth.js";
  import { STEADY } from "../datasets.js";
  import { SERIES } from "../palette.js";
  import { linear, clampW, pathOf } from "../chart.js";

  const S_MAX = 0.3;
  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 240;
  const M = { top: 12, right: 16, bottom: 38, left: 46 };
  let x = $derived(linear(0, S_MAX, M.left, W - M.right));
  let y = $derived(linear(-0.02, 0.035, H - M.bottom, M.top));
  const ss = Array.from({ length: 121 }, (_, i) => (S_MAX * i) / 120);
  let curve = $derived(pathOf(ss.map((s) => [x(s), y(alternating(STEADY, s))])));
  let approx = $derived(pathOf(ss.map((s) => [x(s), y(STEADY - (s * s) / (2 * (1 + STEADY)))])));
  const zero = zeroGrowthSwing(STEADY);

  let s = $state(0.05);
  let g = $derived(alternating(STEADY, s));
  const pct = (v, d = 2) => `${v < 0 ? "−" : ""}${Math.abs(v * 100).toFixed(d)}%`;
  let readout = $derived(
    s === 0
      ? `With no swing at all, 3% a year compounds at exactly 3%.`
      : `Swinging ${(s * 100).toFixed(1)} points either side of 3%, so ${pct(STEADY + s, 1)} then ${pct(STEADY - s, 1)}, compounds at ${pct(g)} a year.`
  );
</script>

<div class="fig" id="drag-figure">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>
    <p class="fig-title">{readout}</p>
    <p class="axis-note">vertical: the compound growth rate</p>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each [-0.02, -0.01, 0, 0.01, 0.02, 0.03] as t}
          <line class="grid" class:zero={t === 0} x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
          <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{Math.round(t * 100)}%</text>
        {/each}
        {#each [0, 0.1, 0.2, 0.3] as t}
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">±{Math.round(t * 100)}</text>
        {/each}
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">size of the swing around 3%, percentage points</text>
      </g>
      <path class="approx" d={approx} />
      <path class="curve" d={curve} stroke={SERIES[0]} />
      <line class="mean" x1={M.left} x2={W - M.right} y1={y(STEADY)} y2={y(STEADY)} />
      <circle class="zero-pt" cx={x(zero)} cy={y(0)} r="5" fill="#fff" stroke="#232f3e" stroke-width="2" />
      <circle class="marker" cx={x(s)} cy={y(g)} r="5.5" fill={SERIES[0]} />
    </svg>
    <label class="slider">
      <span class="s-name">size of the swing <b>±{(s * 100).toFixed(1)} points</b></span>
      <input type="range" min="0" max={S_MAX * 100} step="0.5" value={s * 100} oninput={(e) => (s = +e.currentTarget.value / 100)} />
    </label>
    <p class="legend">
      <span class="key"><span class="swatch" style={`background:${SERIES[0]}`}></span>compound rate, exact</span>
      <span class="key"><span class="swatch dashed"></span>average minus half the squared swing</span>
      <span class="key"><span class="ring"></span>no growth at all, at ±{(zero * 100).toFixed(1)} points</span>
    </p>
  </div>
</div>

<style>
  .fig {
    max-width: 640px;
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
    margin: 0 0 0.4rem 0;
    min-height: 3em;
  }

  .axis-note {
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #61707d;
    margin: 0 0 0.1rem 0;
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

  .grid.zero {
    stroke: #c9d1d8;
  }

  .curve {
    fill: none;
    stroke-width: 2.6;
  }

  .approx {
    fill: none;
    stroke: #8a94a2;
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
  }

  .mean {
    stroke: #c9d1d8;
    stroke-dasharray: 2 3;
  }

  .marker {
    stroke: #fff;
    stroke-width: 1.5;
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

  .swatch.dashed {
    height: 0;
    border-top: 2px dashed #8a94a2;
  }

  .ring {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 2px solid #232f3e;
  }
</style>
