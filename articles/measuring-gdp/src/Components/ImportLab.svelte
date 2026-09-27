<script>
  /*
    The hook. Households spend €40 on imported bicycles, and a share d of that
    money would otherwise have gone on the island's bread. One slider for d, one
    toggle for whether the bread's flour is imported.

    The three lines are the three rows of a GDP release, as functions of d:
    consumption's contribution, net exports' contribution, and their sum, GDP.
    All three are straight in d, so each is drawn from its two ends and the
    markers must lie on them; check-browser.mjs asserts that in screen pixels,
    and that the net-exports line is flat when the flour is home-made.
  */
  import { displacement } from "../accounts.js";
  import { BIKES } from "../datasets.js";
  import { SERIES } from "../palette.js";
  import { linear, ticks, clampW } from "../chart.js";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth - 2));
  let inner = $derived(W - 32);
  const H = 260;
  const M = { top: 14, right: 16, bottom: 40, left: 44 };

  let d = $state(0.6);
  let importedFlour = $state(false);

  let now = $derived(displacement(d, importedFlour));
  let at0 = $derived(displacement(0, importedFlour));
  let at1 = $derived(displacement(1, importedFlour));

  let x = $derived(linear(0, 1, M.left, inner - M.right));
  let y = $derived(linear(-45, 45, H - M.bottom, M.top));
  const yTicks = [-40, -20, 0, 20, 40];
  const xTicks = [0, 0.25, 0.5, 0.75, 1];

  const LINES = [
    { key: "dC", cls: "cons", label: "consumption", colour: SERIES[2] },
    { key: "netExports", cls: "nx", label: "net exports", colour: SERIES[1] },
    { key: "dGDP", cls: "gdp", label: "GDP", colour: SERIES[0] },
  ];

  const r = (v) => Math.round(v * 100) / 100;
  const signed = (v) => (r(v) > 0 ? `+€${r(v)}` : r(v) < 0 ? `−€${-r(v)}` : "€0");
  const pct = (v) => `${Math.round(v * 100)}%`;

  let bread = $derived(r(d * BIKES));
  let verdict = $derived.by(() => {
    const lost = -now.dGDP;
    if (lost === 0) {
      return `None of the €${BIKES} comes out of bread, so nothing the island makes changes and GDP doesn't move, even though net exports fall by €${-r(now.netExports)}.`;
    }
    return importedFlour
      ? `Households buy €${bread} less bread. Half of each loaf's price paid for imported flour, so the island loses only €${r(lost)} of its own production, and GDP falls by the same amount.`
      : `Households buy €${bread} less bread, all of it made on the island from wheat to loaf, so GDP falls by the same €${r(lost)}.`;
  });

  function onSlide(e) {
    d = +e.currentTarget.value / 100;
  }
</script>

<div class="fig" id="import-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <div class="lab">
    <div class="controls-bar">
      <p class="lab-title">€{BIKES} of imported bicycles, and {pct(d)} of it would have gone on bread</p>
      <label class="slider">
        <span class="s-name">share of the bike money that comes out of bread <b>{pct(d)}</b></span>
        <input type="range" min="0" max="100" step="5" value={Math.round(d * 100)} oninput={onSlide} />
      </label>
      <div class="presets">
        <button class="pill" class:active={d === 0} onclick={() => (d = 0)}>new bikes, same bread</button>
        <button class="pill" class:active={d === 1} onclick={() => (d = 1)}>bikes instead of bread</button>
        <label class="toggle"><input type="checkbox" bind:checked={importedFlour} /> bread made with imported flour</label>
      </div>
    </div>

    <p class="fig-title">What each line of the GDP release says, as the share changes</p>
    <svg width={inner} height={H} viewBox={`0 0 ${inner} ${H}`}>
      <g class="axis">
        {#each yTicks as t}
          <line class="grid" class:zero={t === 0} x1={M.left} x2={inner - M.right} y1={y(t)} y2={y(t)} />
          <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{t > 0 ? `+${t}` : t}</text>
        {/each}
        {#each xTicks as t}
          <text x={x(t)} y={H - M.bottom + 16} text-anchor="middle">{pct(t)}</text>
        {/each}
        <text class="axis-title" x={(M.left + inner - M.right) / 2} y={H - 4} text-anchor="middle">share of the bike money that comes out of bread</text>
        <text class="axis-title" x={M.left - 6} y={M.top - 2} text-anchor="end">€</text>
      </g>
      {#each LINES as L}
        <line class={`line ${L.cls}`} x1={x(0)} y1={y(at0[L.key])} x2={x(1)} y2={y(at1[L.key])} stroke={L.colour} />
      {/each}
      <line class="cursor" x1={x(d)} x2={x(d)} y1={M.top} y2={H - M.bottom} />
      {#each LINES as L}
        <circle class={`marker ${L.cls}`} cx={x(d)} cy={y(now[L.key])} r="5.5" fill={L.colour} data-value={now[L.key]} />
      {/each}
    </svg>
    <p class="legend">
      {#each LINES as L}
        <span class={`key ${L.cls}`}><span class="swatch" style={`background:${L.colour}`}></span>{L.label}</span>
      {/each}
    </p>

    <div class="tables">
      <table class="release conventional">
        <caption>The release, as published</caption>
        <tbody>
          <tr><td>Consumption</td><td class="num c-cons">{signed(now.dC)}</td></tr>
          <tr><td>Net exports</td><td class="num c-nx">{signed(now.netExports)}</td></tr>
          <tr class="total"><td>GDP</td><td class="num c-gdp">{signed(now.dGDP)}</td></tr>
        </tbody>
      </table>
      <table class="release adjusted">
        <caption>Each use net of its own imports</caption>
        <tbody>
          <tr><td>Consumption</td><td class="num a-cons">{signed(now.adjustedC)}</td></tr>
          <tr><td>Net exports</td><td class="num a-nx">{signed(now.adjustedNX)}</td></tr>
          <tr class="total"><td>GDP</td><td class="num a-gdp">{signed(now.dGDP)}</td></tr>
        </tbody>
      </table>
    </div>
    <p class="verdict">{verdict}</p>
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
    padding: 0.3rem 0 0.6rem 0;
    margin-bottom: 0.6rem;
    border-bottom: 1px solid #eef1f3;
  }

  @media screen and (max-width: 700px) {
    .controls-bar {
      position: sticky;
      top: 0;
      z-index: 5;
    }
  }

  .lab-title {
    font-family: var(--font-main);
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
    margin: 0 0 0.5rem 0;
  }

  .slider {
    display: flex;
    flex-direction: column;
    gap: 3px;
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
    gap: 0.4rem;
    align-items: center;
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

  .toggle {
    font-family: var(--font-main);
    font-size: 0.82rem;
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
    margin-left: auto;
  }

  .toggle input {
    accent-color: var(--violet);
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.9rem;
    margin: 0.2rem 0 0.4rem 0;
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
  }

  .grid {
    stroke: #eef1f3;
  }

  .grid.zero {
    stroke: #c9d1d8;
  }

  .line {
    stroke-width: 2.5;
  }

  .line.nx {
    stroke-dasharray: 7 5;
  }

  .line.gdp {
    stroke-width: 3.5;
  }

  .cursor {
    stroke: #c9d1d8;
    stroke-dasharray: 3 3;
  }

  .marker {
    stroke: #fff;
    stroke-width: 2;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 1rem;
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #61707d;
    margin: 0.3rem 0 0 0;
  }

  .swatch {
    display: inline-block;
    width: 14px;
    height: 4px;
    margin-right: 0.35rem;
    vertical-align: middle;
  }

  .tables {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 0.9rem;
  }

  .release {
    flex: 1 1 220px;
    border-collapse: collapse;
    font-family: var(--font-main);
    font-size: 0.86rem;
  }

  .release caption {
    text-align: left;
    font-size: 0.82rem;
    font-weight: 600;
    color: #61707d;
    padding-bottom: 0.3rem;
  }

  .release td {
    padding: 3px 6px;
    border-bottom: 1px solid #f0f2f4;
  }

  .release .num {
    text-align: right;
    font-family: var(--font-mono);
  }

  .release tr.total td {
    font-weight: 700;
    border-bottom: none;
  }

  .verdict {
    font-family: var(--font-main);
    font-size: 0.92rem;
    line-height: 1.55;
    margin: 0.8rem 0 0 0;
    min-height: 3em;
    text-align: center;
  }
</style>
