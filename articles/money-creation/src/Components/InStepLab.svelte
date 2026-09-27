<script>
  /*
    The hook. Anchor lends €100. The other banks lend a fraction phi of what
    would keep them in proportion to Anchor ("in step"). Payments land at each
    bank in proportion to its share of deposits, so Anchor's net reserve flow
    is −(1 − s)(1 − phi)·L exactly: a straight line in phi, which the first
    panel draws and the marker rides. The second panel is every bank's net
    flow from banks.settle(), which must sum to zero because reserves only move
    between banks. check-browser.mjs asserts both in rendered pixels.
  */
  import { settle, drain, inStepLoans } from "../banks.js";
  import { LOAN } from "../datasets.js";
  import { SERIES } from "../palette.js";
  import { linear, clampW } from "../chart.js";

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth - 2));
  let inner = $derived(W - 32);
  let twoUp = $derived(inner >= 620);
  let panelW = $derived(twoUp ? Math.floor((inner - 24 - 2) / 2) : inner);
  const H = 230;
  const M = { top: 14, right: 14, bottom: 40, left: 46 };

  let phi = $state(0);
  let sA = $state(0.5);
  // Birch and Cedar keep their 3 : 2 split of whatever Anchor doesn't hold.
  let banks = $derived([
    { id: "anchor", name: "Anchor", share: sA },
    { id: "birch", name: "Birch", share: ((1 - sA) * 3) / 5 },
    { id: "cedar", name: "Cedar", share: ((1 - sA) * 2) / 5 },
  ]);
  let loans = $derived(inStepLoans(0, phi, LOAN, banks));
  let flows = $derived(settle(banks.map((b) => b.share), loans));
  let d = $derived(drain(sA, phi, LOAN));

  let x = $derived(linear(0, 1, M.left, panelW - M.right));
  let y = $derived(linear(-LOAN, 0, H - M.bottom, M.top));
  let line = $derived({ x1: x(0), y1: y(drain(sA, 0, LOAN)), x2: x(1), y2: y(drain(sA, 1, LOAN)) });

  const FMAX = 100;
  let bx = $derived(linear(-FMAX, FMAX, 70, panelW - 50));
  let rowH = 46;

  const eur = (v) => `${v < -1e-9 ? "−" : v > 1e-9 ? "+" : ""}€${Math.abs(Math.round(v * 10) / 10)}`;
  const pct = (v) => `${Math.round(v * 100)}%`;
  let readout = $derived(
    `Anchor lends €${LOAN}; Birch lends €${Math.round(loans[1] * 10) / 10} and Cedar €${Math.round(loans[2] * 10) / 10}. ` +
      (Math.abs(d) < 1e-9
        ? "Every bank's payments in match its payments out, so nobody loses reserves."
        : `Anchor loses ${eur(-d).replace("+", "")} of reserves to the others.`)
  );
</script>

<div class="fig" id="in-step-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <div class="lab">
    <div class="controls-bar">
      <label class="slider">
        <span class="s-name">how far Birch and Cedar lend in step with Anchor <b>{pct(phi)}</b></span>
        <input class="phi" type="range" min="0" max="100" step="5" value={Math.round(phi * 100)} oninput={(e) => (phi = +e.currentTarget.value / 100)} />
      </label>
      <label class="slider">
        <span class="s-name">Anchor's share of all deposits <b>{pct(sA)}</b></span>
        <input class="share" type="range" min="10" max="90" step="5" value={Math.round(sA * 100)} oninput={(e) => (sA = +e.currentTarget.value / 100)} />
      </label>
      <div class="presets">
        <button class="pill" class:active={phi === 0} onclick={() => (phi = 0)}>Anchor lends alone</button>
        <button class="pill" class:active={phi === 1} onclick={() => (phi = 1)}>all lend in step</button>
      </div>
    </div>
    <p class="fig-title">{readout}</p>
    <div class="pair" class:two-up={twoUp}>
      <div class="cell">
        <p class="panel-title">Anchor's reserves gained or lost</p>
        <svg class="drain-panel" width={panelW} height={H} viewBox={`0 0 ${panelW} ${H}`}>
          {#each [-100, -75, -50, -25, 0] as t}
            <line class="grid" class:zero={t === 0} x1={M.left} x2={panelW - M.right} y1={y(t)} y2={y(t)} />
            <text class="tick" x={M.left - 6} y={y(t) + 4} text-anchor="end">{t === 0 ? "€0" : `−€${-t}`}</text>
          {/each}
          {#each [0, 0.25, 0.5, 0.75, 1] as t}
            <text class="tick" x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{pct(t)}</text>
          {/each}
          <text class="axis-title" x={(M.left + panelW - M.right) / 2} y={H - 4} text-anchor="middle">how far the others lend in step</text>
          <line class="drain-line" {...line} stroke={SERIES[0]} />
          <circle class="drain-mk" cx={x(phi)} cy={y(d)} r="6" fill={SERIES[0]} data-value={d} />
        </svg>
      </div>
      <div class="cell">
        <p class="panel-title">Each bank's net reserves after all the payments</p>
        <svg class="flow-panel" width={panelW} height={rowH * 3 + 20} viewBox={`0 0 ${panelW} ${rowH * 3 + 20}`}>
          <line class="zero-v" x1={bx(0)} x2={bx(0)} y1="4" y2={rowH * 3 + 8} />
          {#each banks as b, i}
            <text class="b-label" x="4" y={i * rowH + 26}>{b.name}</text>
            <rect class="flow-bar" data-bank={b.id} data-value={flows[i]} x={Math.min(bx(0), bx(flows[i]))} y={i * rowH + 12}
              width={Math.abs(bx(flows[i]) - bx(0))} height="20" fill={SERIES[i]} opacity="0.85" />
            <text class="b-val" x={flows[i] >= 0 ? bx(Math.max(0, flows[i])) + 5 : bx(0) + 5} y={i * rowH + 26}>{eur(flows[i])}</text>
          {/each}
        </svg>
        <p class="sum">sum across banks: <b class="flow-sum">{eur(flows.reduce((a, v) => a + v, 0))}</b></p>
      </div>
    </div>
  </div>
</div>

<style>
  .fig {
    max-width: 820px;
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
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
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

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    line-height: 1.5;
    margin: 0 0 0.6rem 0;
    min-height: 3em;
  }

  .pair {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pair.two-up {
    flex-direction: row;
    gap: 24px;
  }

  .cell {
    min-width: 0;
  }

  .panel-title {
    font-family: var(--font-main);
    font-size: 0.86rem;
    font-weight: 600;
    margin: 0 0 0.3rem 0;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .grid {
    stroke: #eef1f3;
  }

  .grid.zero,
  .zero-v {
    stroke: #c9d1d8;
  }

  .tick {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .drain-line {
    stroke-width: 2.5;
  }

  .drain-mk {
    stroke: #fff;
    stroke-width: 2;
  }

  .b-label {
    font-family: var(--font-main);
    font-size: 12px;
    font-weight: 600;
    fill: var(--squid-ink);
  }

  .b-val {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: var(--squid-ink);
  }

  .sum {
    font-family: var(--font-main);
    font-size: 0.82rem;
    color: #61707d;
    margin: 0.3rem 0 0 0;
  }

  .sum b {
    font-family: var(--font-mono);
    color: var(--squid-ink);
  }
</style>
