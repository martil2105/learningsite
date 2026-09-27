<script>
  /*
    The identity figure. Left: the market price against relative size on
    log–log axes, a straight line of slope exactly 1 between two flat ends.
    The line is drawn from the closed form; the dots on it come from the
    labour-market solver in src/market.js, which knows nothing about the closed
    form, and check-browser.mjs asserts in rendered pixels that they sit on it.
    Right: the two gains trading places while their product stays at 1.5.
  */
  import { VALLEY, COAST, SHARE_TOOLS, SIZE_MIN, SIZE_MAX } from "../datasets.js";
  import { market, band, oppCost } from "../trade.js";
  import { solveTwoGood } from "../market.js";
  import { SERIES } from "../palette.js";
  import { log, linear, clampW, pathOf } from "../chart.js";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let twoUp = $derived(W >= 620);
  let pw = $derived(twoUp ? Math.floor((W - 28 - 2) / 2) : W);

  const H = 250;
  const M = { top: 22, right: 16, bottom: 40, left: 46 };
  const P_MIN = 1.5, P_MAX = 6;
  const G_MAX = 55;

  let k = $state(2.7);
  let m = $derived(market(VALLEY, COAST, k, SHARE_TOOLS));

  const b = band(VALLEY, COAST, SHARE_TOOLS);
  const pv = oppCost(VALLEY), pc = oppCost(COAST);

  let x = $derived(log(SIZE_MIN, SIZE_MAX, M.left, pw - M.right));
  const yP = log(P_MIN, P_MAX, H - M.bottom, M.top);
  const yG = linear(0, G_MAX, H - M.bottom, M.top);

  // The first label starts at the axis instead of centring on it, so it
  // clears the y axis's bottom label.
  const X_TICKS = [
    { v: 0.25, t: "0.25" }, { v: 0.5, t: "0.5" }, { v: 1, t: "1" }, { v: 2, t: "2" },
    { v: 4, t: "4" }, { v: 8, t: "8" }, { v: 16, t: "16" },
  ];
  const P_TICKS = [2, 3, 4.5];
  const G_TICKS = [0, 10, 20, 30, 40, 50];

  // The closed form: flat at pv until the band, the diagonal p = k across it,
  // flat at pc after it.
  const CLAMP = [[SIZE_MIN, pv], [b.lo, pv], [b.hi, pc], [SIZE_MAX, pc]];
  let clampPath = $derived(pathOf(CLAMP.map(([kk, p]) => [x(kk), yP(p)])));

  // The independent route, sampled.
  const SAMPLES = Array.from({ length: 19 }, (_, i) => Math.pow(2, -2 + (6 * i) / 18)).map((kk) => ({
    k: kk,
    p: solveTwoGood(VALLEY, COAST, kk, SHARE_TOOLS).p,
  }));

  // The gain curves, dense enough to show the kinks where they are.
  const KS = (() => {
    const out = [];
    for (let i = 0; i <= 240; i++) out.push(Math.pow(2, -2 + (6 * i) / 240));
    out.push(b.lo, b.hi);
    return out.sort((a, c) => a - c);
  })();
  const GAINS = KS.map((kk) => {
    const r = market(VALLEY, COAST, kk, SHARE_TOOLS);
    return { k: kk, a: (r.gainA - 1) * 100, c: (r.gainB - 1) * 100 };
  });
  let valleyPath = $derived(pathOf(GAINS.map((g) => [x(g.k), yG(g.a)])));
  let coastPath = $derived(pathOf(GAINS.map((g) => [x(g.k), yG(g.c)])));

  const two = (v) => v.toFixed(2);
  const pct = (g) => `${((g - 1) * 100).toFixed(1)}%`;

  let readout = $derived(
    // Non-breaking spaces keep the product on one line when the sentence wraps.
    `At ${two(k)}× the price is ${two(m.p)} sacks per tool, the Valley gains ${pct(m.gainA)} and the Coast ${pct(m.gainB)}, and ${m.gainA.toFixed(3)}\u00a0×\u00a0${m.gainB.toFixed(3)}\u00a0=\u00a0${(m.gainA * m.gainB).toFixed(3)}.`
  );

  function onSlide(e) {
    k = Math.pow(2, +e.currentTarget.value);
  }
</script>

<div class="fig" id="band-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <div class="panels" class:two-up={twoUp}>
    <div class="panel price-panel">
      <p class="panel-title">Market price of a tool, in sacks</p>
      <svg width={pw} height={H} viewBox={`0 0 ${pw} ${H}`} role="img"
        aria-label="Market price against the Coast's relative size, on logarithmic axes">
        <rect class="band" x={x(b.lo)} y={M.top} width={x(b.hi) - x(b.lo)} height={H - M.bottom - M.top} />
        <text class="band-label" x={(x(b.lo) + x(b.hi)) / 2} y={M.top - 7} text-anchor="middle">×{b.hi / b.lo}</text>
        <g class="axis">
          {#each X_TICKS as t}
            <line class="grid" x1={x(t.v)} y1={M.top} x2={x(t.v)} y2={H - M.bottom} />
            <text x={x(t.v)} y={H - M.bottom + 15} text-anchor={t.v === SIZE_MIN ? "start" : "middle"}>{t.t}</text>
          {/each}
          {#each P_TICKS as t}
            <line class="grid" x1={M.left} y1={yP(t)} x2={pw - M.right} y2={yP(t)} />
            <text x={M.left - 7} y={yP(t) + 4} text-anchor="end">{t}</text>
          {/each}
          <line class="rule" x1={M.left} y1={H - M.bottom} x2={pw - M.right} y2={H - M.bottom} />
          <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
          <text class="axis-title" x={(M.left + pw - M.right) / 2} y={H - 5} text-anchor="middle">Coast workers per Valley worker</text>
        </g>
        <path class="clamp" d={clampPath} />
        {#each SAMPLES as s}
          <circle class="sample" cx={x(s.k)} cy={yP(s.p)} r="3.2" />
        {/each}
        <line class="scrub" x1={x(k)} y1={M.top} x2={x(k)} y2={H - M.bottom} />
        <circle class="scrub-dot price" cx={x(k)} cy={yP(m.p)} r="5.5" />
      </svg>
    </div>

    <div class="panel gain-panel">
      <p class="panel-title">Gain from trade, per worker</p>
      <svg width={pw} height={H} viewBox={`0 0 ${pw} ${H}`} role="img"
        aria-label="Each economy's gain from trade against the Coast's relative size">
        <rect class="band" x={x(b.lo)} y={M.top} width={x(b.hi) - x(b.lo)} height={H - M.bottom - M.top} />
        <g class="axis">
          {#each X_TICKS as t}
            <line class="grid" x1={x(t.v)} y1={M.top} x2={x(t.v)} y2={H - M.bottom} />
            <text x={x(t.v)} y={H - M.bottom + 15} text-anchor={t.v === SIZE_MIN ? "start" : "middle"}>{t.t}</text>
          {/each}
          {#each G_TICKS as t}
            <line class="grid" x1={M.left} y1={yG(t)} x2={pw - M.right} y2={yG(t)} />
            <text x={M.left - 7} y={yG(t) + 4} text-anchor="end">{t}%</text>
          {/each}
          <line class="rule" x1={M.left} y1={H - M.bottom} x2={pw - M.right} y2={H - M.bottom} />
          <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
          <text class="axis-title" x={(M.left + pw - M.right) / 2} y={H - 5} text-anchor="middle">Coast workers per Valley worker</text>
        </g>
        <path class="curve valley" d={valleyPath} stroke={SERIES[0]} />
        <path class="curve coast" d={coastPath} stroke={SERIES[1]} />
        <line class="scrub" x1={x(k)} y1={M.top} x2={x(k)} y2={H - M.bottom} />
        <circle class="scrub-dot valley" cx={x(k)} cy={yG((m.gainA - 1) * 100)} r="5" fill={SERIES[0]} />
        <circle class="scrub-dot coast" cx={x(k)} cy={yG((m.gainB - 1) * 100)} r="5" fill={SERIES[1]} />
      </svg>
    </div>
  </div>

  <p class="legend">
    <span class="key"><span class="swatch band-swatch"></span>both specialise</span>
    <span class="key"><span class="swatch line-swatch"></span>closed form</span>
    <span class="key"><span class="swatch sample-swatch"></span>solved market</span>
    <span class="key"><span class="swatch" style:background={SERIES[0]}></span>Valley</span>
    <span class="key"><span class="swatch" style:background={SERIES[1]}></span>Coast</span>
  </p>

  <p class="readout">{readout}</p>

  <label class="slider">
    <span class="s-name">Coast workers per Valley worker <b>{two(k)}×</b></span>
    <input type="range" min={Math.log2(SIZE_MIN)} max={Math.log2(SIZE_MAX)} step="0.01"
      value={Math.log2(k)} oninput={onSlide} />
  </label>
</div>

<style>
  .fig {
    max-width: 760px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .panels {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .panels.two-up {
    flex-direction: row;
    gap: 28px;
  }

  .panel {
    min-width: 0;
  }

  .panel-title {
    font-family: var(--font-main);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--squid-ink);
    margin: 0 0 0.2rem 0;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
    overflow: hidden;
  }

  .band {
    fill: #f1eefc;
  }

  .band-label {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: #61707d;
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 10.5px;
    fill: #8a94a2;
  }

  .axis .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .grid {
    stroke: #eef1f3;
    stroke-width: 1;
  }

  .rule {
    stroke: #8a94a2;
    stroke-width: 1;
  }

  .clamp {
    fill: none;
    stroke: #232f3e;
    stroke-width: 2;
  }

  .sample {
    fill: #fff;
    stroke: #232f3e;
    stroke-width: 1.5;
  }

  .curve {
    fill: none;
    stroke-width: 2.2;
  }

  .scrub {
    stroke: #61707d;
    stroke-width: 1;
  }

  .scrub-dot {
    stroke: #fff;
    stroke-width: 2;
  }

  .scrub-dot.price {
    fill: #232f3e;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.9rem;
    justify-content: center;
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #61707d;
    margin: 0.6rem 0 0 0;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .swatch {
    display: inline-block;
    width: 16px;
    height: 3px;
  }

  .band-swatch {
    height: 10px;
    background: #f1eefc;
    border: 1px solid #d9d1f7;
  }

  .line-swatch {
    background: #232f3e;
  }

  .sample-swatch {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid #232f3e;
    background: #fff;
  }

  .readout {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--squid-ink);
    text-align: center;
    min-height: 3.2em;
    margin: 0.7rem auto 0.5rem auto;
    max-width: 600px;
  }

  .slider {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .s-name {
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: var(--squid-ink);
  }

  .s-name b {
    font-family: var(--font-mono);
    float: right;
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--violet);
  }
</style>
