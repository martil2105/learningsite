<script>
  /*
    The fair case for the textbook. With N equally weighted goods and the
    Valley's edge spread evenly between 2 and 4.5, the curves come from the
    labour-market solver in src/market.js, and the two vertical rules come from
    the closed form in src/trade.js. check-browser.mjs asserts that the solver's
    curve leaves zero where the closed-form rule says it does.
  */
  import { GOODS_COUNTS, edges, VALLEY_WORKERS } from "../datasets.js";
  import { manyGoodsBand } from "../trade.js";
  import { solveEdges } from "../market.js";
  import { SERIES } from "../palette.js";
  import { log, linear, clampW, pathOf } from "../chart.js";

  const K_MIN = 0.05, K_MAX = 100;
  const G_MAX = 55;

  let n = $state(10);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 270;
  const M = { top: 16, right: 18, bottom: 42, left: 46 };

  // Every curve, computed once: four goods counts, 260 sizes each.
  const TABLE = Object.fromEntries(
    GOODS_COUNTS.map((N) => {
      const ed = edges(N);
      const bd = manyGoodsBand(ed);
      const ks = [];
      for (let i = 0; i <= 260; i++) ks.push(Math.exp(Math.log(K_MIN) + (i / 260) * (Math.log(K_MAX) - Math.log(K_MIN))));
      ks.push(bd.lo, bd.hi);
      ks.sort((a, b) => a - b);
      const pts = ks.map((k) => {
        const r = solveEdges(ed, k);
        return { k, a: (r.gainValley - 1) * 100, c: (r.gainCoast - 1) * 100 };
      });
      return [N, { band: bd, pts, equal: solveEdges(ed, 1) }];
    })
  );

  let x = $derived(log(K_MIN, K_MAX, M.left, W - M.right));
  const y = linear(0, G_MAX, H - M.bottom, M.top);
  const X_TICKS = [
    { v: 0.1, t: "0.1" }, { v: 1, t: "1" }, { v: 10, t: "10" }, { v: 100, t: "100" },
  ];
  const Y_TICKS = [0, 10, 20, 30, 40, 50];

  let cur = $derived(TABLE[n]);
  let valleyPath = $derived(pathOf(cur.pts.map((p) => [x(p.k), y(p.a)])));
  let coastPath = $derived(pathOf(cur.pts.map((p) => [x(p.k), y(p.c)])));

  const per1000 = (v) => Math.floor(v * VALLEY_WORKERS).toLocaleString("en-GB");
  const pct = (g) => `${((g - 1) * 100).toFixed(1)}%`;

  let readout = $derived(
    `With ${n} goods, the Valley gains nothing only while the Coast has at most ${per1000(cur.band.lo)} workers for every ${per1000(1)} of its own, and the Coast gains nothing only from ${per1000(cur.band.hi)} up. At equal size the Valley gains ${pct(cur.equal.gainValley)} and the Coast ${pct(cur.equal.gainCoast)}.`
  );
</script>

<div class="fig" id="goods-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">Gain from trade against the Coast's relative size, with more goods to trade</p>

  <div class="presets">
    <span class="ctl-label">goods</span>
    {#each GOODS_COUNTS as N}
      <button class="pill" class:active={n === N} onclick={() => (n = N)}>{N}</button>
    {/each}
  </div>

  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
    aria-label="Each economy's gain from trade against the Coast's relative size, for the chosen number of goods">
    <rect class="band" x={x(cur.band.lo)} y={M.top} width={x(cur.band.hi) - x(cur.band.lo)} height={H - M.bottom - M.top} />
    <g class="axis">
      {#each X_TICKS as t}
        <line class="grid" x1={x(t.v)} y1={M.top} x2={x(t.v)} y2={H - M.bottom} />
        <text x={x(t.v)} y={H - M.bottom + 15} text-anchor="middle">{t.t}</text>
      {/each}
      {#each Y_TICKS as t}
        <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
        <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t}%</text>
      {/each}
      <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
      <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 5} text-anchor="middle">Coast workers per Valley worker</text>
    </g>

    <line class="edge lo" x1={x(cur.band.lo)} y1={M.top} x2={x(cur.band.lo)} y2={H - M.bottom} />
    <line class="edge hi" x1={x(cur.band.hi)} y1={M.top} x2={x(cur.band.hi)} y2={H - M.bottom} />
    <line class="equal" x1={x(1)} y1={M.top} x2={x(1)} y2={H - M.bottom} />

    <path class="curve coast" d={coastPath} stroke={SERIES[1]} />
    <path class="curve valley" d={valleyPath} stroke={SERIES[0]} />
  </svg>

  <p class="legend">
    <span class="key"><span class="swatch" style:background={SERIES[0]}></span>Valley's gain</span>
    <span class="key"><span class="swatch" style:background={SERIES[1]}></span>Coast's gain</span>
    <span class="key"><span class="swatch band-swatch"></span>both gain</span>
    <span class="key"><span class="swatch rule-swatch"></span>equal size</span>
  </p>

  <p class="readout">{readout}</p>
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

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    margin: 0 0 0.6rem 0;
    color: var(--squid-ink);
    text-align: center;
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

  .edge {
    stroke: #b7aee6;
    stroke-width: 1;
  }

  .equal {
    stroke: #232f3e;
    stroke-width: 1;
  }

  .curve {
    fill: none;
    stroke-width: 2.2;
  }

  .presets {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 0.4rem;
  }

  .ctl-label {
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #8a94a2;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .pill {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill:hover {
    border-color: var(--violet);
  }

  .pill.active {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.9rem;
    justify-content: center;
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #61707d;
    margin: 0.4rem 0 0 0;
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

  .rule-swatch {
    width: 1.5px;
    height: 12px;
    background: #232f3e;
  }

  .readout {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--squid-ink);
    text-align: center;
    min-height: 4.7em;
    margin: 0.7rem auto 0 auto;
    max-width: 600px;
  }
</style>
