<script>
  /*
    Samuelson's case. The Coast, three times the Valley's size, gets better at
    one good. If it's the good the Valley buys, the Valley gains more. If it's
    the good the Valley sells, nothing happens to the Valley until the Coast's
    tool capacity matches the Valley's, and then the Valley's gain falls to
    exactly zero at parity, before trade restarts the other way round.
  */
  import { VALLEY, COAST, SHARE_TOOLS, CATCHUP_SIZE, CATCHUP_TOOLS, CATCHUP_GRAIN } from "../datasets.js";
  import { gainsFor, oppCost } from "../trade.js";
  import { SERIES } from "../palette.js";
  import { linear, clampW, pathOf, ticks } from "../chart.js";

  const K = CATCHUP_SIZE;
  const KINK = VALLEY.tools / K; // the Coast's tool capacity reaches the Valley's
  const PARITY = COAST.grain / oppCost(VALLEY); // the Coast's tool cost falls to 2

  let mode = $state("tools");
  let atTools = $state(CATCHUP_TOOLS.from);
  let atGrain = $state(CATCHUP_GRAIN.from);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 280;
  const M = { top: 30, right: 18, bottom: 42, left: 46 };
  const G_MAX = 80;

  let range = $derived(mode === "tools" ? CATCHUP_TOOLS : CATCHUP_GRAIN);
  let at = $derived(mode === "tools" ? atTools : atGrain);

  const coastWith = (mode, v) => (mode === "tools" ? { ...COAST, tools: v } : { ...COAST, grain: v });

  function curve(mode) {
    const r = mode === "tools" ? CATCHUP_TOOLS : CATCHUP_GRAIN;
    const vs = [];
    for (let i = 0; i <= 350; i++) vs.push(r.from + ((r.to - r.from) * i) / 350);
    if (mode === "tools") vs.push(KINK, PARITY);
    vs.sort((a, b) => a - b);
    return vs.map((v) => {
      const g = gainsFor(VALLEY, coastWith(mode, v), K, SHARE_TOOLS);
      return { v, a: (g.valley - 1) * 100, c: (g.coast - 1) * 100 };
    });
  }
  const CURVES = { tools: curve("tools"), grain: curve("grain") };

  let x = $derived(linear(range.from, range.to, M.left, W - M.right));
  const y = linear(0, G_MAX, H - M.bottom, M.top);
  let xTicks = $derived(ticks(range.from, range.to, 7));
  const yTicks = [0, 20, 40, 60, 80];

  let valleyPath = $derived(pathOf(CURVES[mode].map((p) => [x(p.v), y(p.a)])));
  let coastPath = $derived(pathOf(CURVES[mode].map((p) => [x(p.v), y(p.c)])));

  let now = $derived(gainsFor(VALLEY, coastWith(mode, at), K, SHARE_TOOLS));

  const pct = (g) => `${((g - 1) * 100).toFixed(1)}%`;
  // At most two decimals, and no trailing zeros: 4.5, not 4.50.
  const num = (v) => String(Math.round(v * 100) / 100);

  let readout = $derived.by(() => {
    if (mode === "grain") {
      return `When a Coast worker can grow ${num(at)} sacks a day, the Valley gains ${pct(now.valley)} from trade and the Coast ${pct(now.coast)}.`;
    }
    const cost = COAST.grain / at;
    const sacks = num(cost) === "1" ? "1 sack" : `${num(cost)} sacks`;
    const lead = `When a Coast worker can make ${num(at)} tools a day, a tool costs the Coast ${sacks}.`;
    if (now.exporter === "nobody") return `${lead} That's exactly the Valley's cost, so there's nothing to trade and neither economy gains.`;
    if (now.exporter === "coast") return `${lead} Now the Coast sells tools to the Valley, and the Valley gains ${pct(now.valley)} while the Coast gains ${pct(now.coast)}.`;
    return `${lead} The Valley gains ${pct(now.valley)} from trade and the Coast ${pct(now.coast)}.`;
  });

  const ruleNote = `The rule at ${num(KINK)} marks where the Coast's tool capacity reaches the Valley's, and the rule at ${num(PARITY)} marks where the two economies' tool costs are equal.`;

  function onSlide(e) {
    const v = +e.currentTarget.value;
    if (mode === "tools") atTools = v;
    else atGrain = v;
  }
</script>

<div class="fig" id="catch-up">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">The Coast is three times the Valley's size and gets better at one good</p>

  <div class="presets">
    <button class="pill" class:active={mode === "tools"} onclick={() => (mode = "tools")}>better at tools</button>
    <button class="pill" class:active={mode === "grain"} onclick={() => (mode = "grain")}>better at grain</button>
  </div>

  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
    aria-label="Each economy's gain from trade as the Coast becomes more productive">
    <g class="axis">
      {#each xTicks as t}
        <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
        <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
      {/each}
      {#each yTicks as t}
        <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
        <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t}%</text>
      {/each}
      <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
      <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 5} text-anchor="middle">
        {mode === "tools" ? "tools a Coast worker can make in a day" : "sacks a Coast worker can grow in a day"}
      </text>
    </g>

    {#if mode === "tools"}
      <line class="marker kink" x1={x(KINK)} y1={M.top - 4} x2={x(KINK)} y2={H - M.bottom} />
      <text class="marker-label kink-label" x={x(KINK)} y={M.top - 16} text-anchor="middle">{num(KINK)}</text>
      <line class="marker parity" x1={x(PARITY)} y1={M.top - 4} x2={x(PARITY)} y2={H - M.bottom} />
      <text class="marker-label parity-label" x={x(PARITY)} y={M.top - 16} text-anchor="middle">{num(PARITY)}</text>
    {/if}

    <path class="curve coast" d={coastPath} stroke={SERIES[1]} />
    <path class="curve valley" d={valleyPath} stroke={SERIES[0]} />

    <line class="scrub" x1={x(at)} y1={M.top} x2={x(at)} y2={H - M.bottom} />
    <circle class="scrub-dot coast" cx={x(at)} cy={y((now.coast - 1) * 100)} r="5" fill={SERIES[1]} />
    <circle class="scrub-dot valley" cx={x(at)} cy={y((now.valley - 1) * 100)} r="5" fill={SERIES[0]} />
  </svg>

  <p class="legend">
    <span class="key"><span class="swatch" style:background={SERIES[0]}></span>Valley's gain</span>
    <span class="key"><span class="swatch" style:background={SERIES[1]}></span>Coast's gain</span>
  </p>
  {#if mode === "tools"}
    <p class="note">{ruleNote}</p>
  {/if}

  <p class="readout">{readout}</p>

  <label class="slider">
    <span class="s-name">
      {mode === "tools" ? "Coast tools per worker-day" : "Coast sacks per worker-day"}
      <b>{num(at)}</b>
    </span>
    <input type="range" min={range.from} max={range.to} step="0.05" value={at} oninput={onSlide} />
  </label>
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

  .marker {
    stroke: #232f3e;
    stroke-width: 1;
  }

  .marker-label {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: #232f3e;
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

  .presets {
    display: flex;
    gap: 0.35rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 0.4rem;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.82rem;
    padding: 5px 12px;
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

  .note {
    font-family: var(--font-main);
    font-size: 0.78rem;
    line-height: 1.5;
    color: #61707d;
    text-align: center;
    max-width: 520px;
    margin: 0.3rem auto 0 auto;
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
