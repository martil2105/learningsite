<script>
  /* PlantLab.svelte: The Hook — Plant size slider, tangency vs minimum marker, and the (2k/(f+k))^(1/3) ratio */
  import { linear, clampW } from "../chart.js";
  import { f, SRAC, LRAC, qTangency, qCheapest, tangencyRatio } from "../cost.js";

  let kVal = $state(100);
  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  const M = { top: 24, right: 24, bottom: 40, left: 52 };
  const height = 340;

  const Q_MAX = 65;
  const Y_MAX = 35;

  let x = $derived(linear(0, Q_MAX, M.left, W - M.right));
  let y = $derived(linear(0, Y_MAX, height - M.bottom, M.top));

  // Calculations for active plant
  let qTan = $derived(qTangency(kVal));
  let acTan = $derived(LRAC(qTan)); // SRAC(qTan, kVal) === LRAC(qTan)
  let qMinSR = $derived(qCheapest(kVal));
  let acMinSR = $derived(SRAC(qMinSR, kVal));
  let ratio = $derived(tangencyRatio(kVal));

  const presets = [
    { label: "k = 25", k: 25, note: "26% below peak" },
    { label: "k = 50", k: 50, note: "13% below peak" },
    { label: "k = 100 (Textbook)", k: 100, note: "Coincides (k = f)" },
    { label: "k = 200", k: 200, note: "10% above peak" },
    { label: "k = 400", k: 400, note: "17% above peak" }
  ];

  // Long-run curve
  let lracPath = $derived.by(() => {
    let pts = [];
    for (let q = 3; q <= Q_MAX; q += 0.5) {
      const val = LRAC(q);
      if (val <= Y_MAX + 5) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  });

  // Active SRAC curve
  let activeSracPath = $derived.by(() => {
    let pts = [];
    for (let q = 2; q <= Q_MAX; q += 0.5) {
      const val = SRAC(q, kVal);
      if (val <= Y_MAX + 10) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  });

  // Faint background curves
  const faintKs = [25, 50, 200, 400];
  function faintPath(k) {
    let pts = [];
    for (let q = 2; q <= Q_MAX; q += 0.5) {
      const val = SRAC(q, k);
      if (val <= Y_MAX + 10) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${x(q).toFixed(1)} ${y(val).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  }
</script>

<div class="card hook-card" id="plant-lab" bind:clientWidth={boxWidth}>
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">Interactive Plant Lab</h3>
    <p class="card-sub">
      Drag the plant size slider or select a preset. Watch the two markers on the blue short-run curve: the <strong>orange tangency dot</strong> touches the long-run envelope, while the <strong>dark blue dot</strong> marks the plant's own cheapest scale.
    </p>
  </div>

  <div class="controls-bar">
    <div class="slider-row">
      <label for="k-slider" class="ctrl-label">
        Plant size (k): <strong>{kVal}</strong>
      </label>
      <input
        id="k-slider"
        type="range"
        min="20"
        max="400"
        step="5"
        bind:value={kVal}
      />
    </div>

    <div class="preset-row">
      <span class="ctrl-tag">Presets:</span>
      {#each presets as p}
        <button
          type="button"
          class="btn-preset"
          class:active={kVal === p.k}
          onclick={() => (kVal = p.k)}
        >
          {p.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="readout-grid">
    <div class="readout-item">
      <span class="lbl">Tangency Output (q_t)</span>
      <span class="val font-mono text-orange" id="readout-q-tan">{qTan.toFixed(2)}</span>
      <span class="sub">touches envelope (k^(2/3))</span>
    </div>
    <div class="readout-item">
      <span class="lbl">Cheapest Output (q_min)</span>
      <span class="val font-mono text-blue" id="readout-q-min">{qMinSR.toFixed(2)}</span>
      <span class="sub">lowest point of SRAC</span>
    </div>
    <div class="readout-item highlight">
      <span class="lbl">Ratio (q_t ÷ q_min)</span>
      <span class="val font-mono" id="readout-ratio">{ratio.toFixed(4)}</span>
      <span class="sub">(2k / (f + k))^(1/3)</span>
    </div>
    <div class="readout-item">
      <span class="lbl">Verdict</span>
      <span class="val font-mono status-tag">
        {#if Math.abs(kVal - f) < 1}
          Exact Match (1.000)
        {:else if kVal < f}
          Run Below Capacity
        {:else}
          Run Above Capacity
        {/if}
      </span>
      <span class="sub">
        {#if kVal < f}
          q_t is {( (1 - ratio) * 100 ).toFixed(1)}% below min AC
        {:else if kVal > f}
          q_t is {( (ratio - 1) * 100 ).toFixed(1)}% above min AC
        {:else}
          textbook case (k = f = 100)
        {/if}
      </span>
    </div>
  </div>

  <div class="svg-wrap">
    <svg width={W} {height} viewBox="0 0 {W} {height}" role="img" aria-label="Interactive plant lab showing tangency and SRAC minimum">
      <!-- Grid & axes -->
      <line x1={M.left} y1={height - M.bottom} x2={W - M.right} y2={height - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={height - M.bottom} stroke="#d4dada" />

      <!-- Faint background curves -->
      {#each faintKs as fk}
        {#if Math.abs(fk - kVal) > 15}
          <path class="curve srac faint" d={faintPath(fk)} fill="none" stroke="#d4dada" stroke-width="1.2" />
        {/if}
      {/each}

      <!-- Long-run envelope LRAC -->
      <path class="curve lrac" d={lracPath} fill="none" stroke="#232f3e" stroke-width="2.5" />

      <!-- Active SRAC curve -->
      <path class="curve srac active" d={activeSracPath} fill="none" stroke="#2074d5" stroke-width="2.5" />

      <!-- Marker 1: Tangency dot (touches LRAC) -->
      <line
        x1={x(qTan)}
        y1={height - M.bottom}
        x2={x(qTan)}
        y2={y(acTan)}
        stroke="#df2a5d"
        stroke-dasharray="2 2"
        stroke-width="1.2"
      />
      <circle class="dot tangency" cx={x(qTan)} cy={y(acTan)} r="6" fill="#df2a5d" />

      <!-- Marker 2: SRAC minimum dot -->
      <line
        x1={x(qMinSR)}
        y1={height - M.bottom}
        x2={x(qMinSR)}
        y2={y(acMinSR)}
        stroke="#2074d5"
        stroke-dasharray="2 2"
        stroke-width="1.2"
      />
      <circle class="dot srmin" cx={x(qMinSR)} cy={y(acMinSR)} r="5.5" fill="#2074d5" />

      <!-- Marker labels -->
      {#if Math.abs(x(qTan) - x(qMinSR)) > 14}
        <text x={x(qTan)} y={y(acTan) - 9} text-anchor="middle" font-size="10" font-weight="700" fill="#df2a5d">
          Tangency (q={qTan.toFixed(1)})
        </text>
        <text x={x(qMinSR)} y={y(acMinSR) + 16} text-anchor="middle" font-size="10" font-weight="700" fill="#2074d5">
          Min AC (q={qMinSR.toFixed(1)})
        </text>
      {:else}
        <text x={x(qTan)} y={y(acTan) - 10} text-anchor="middle" font-size="11" font-weight="700" fill="#232f3e">
          Coincident (q={qTan.toFixed(1)})
        </text>
      {/if}

      <!-- Axis ticks & labels -->
      <text x={x(0)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">0</text>
      <text x={x(15)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">15</text>
      <text x={x(30)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">30</text>
      <text x={x(45)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">45</text>
      <text x={x(60)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">60</text>
      <text x={W - M.right} y={height - 6} font-size="11" text-anchor="end" font-weight="700" fill="#232f3e">
        Output, q
      </text>

      <text x={M.left - 8} y={y(0) + 4} font-size="11" text-anchor="end" fill="#232f3e">0</text>
      <text x={M.left - 8} y={y(10) + 4} font-size="11" text-anchor="end" fill="#232f3e">10</text>
      <text x={M.left - 8} y={y(20) + 4} font-size="11" text-anchor="end" fill="#232f3e">20</text>
      <text x={M.left - 8} y={y(30) + 4} font-size="11" text-anchor="end" fill="#232f3e">30</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">
        Cost per unit
      </text>
    </svg>
  </div>

  <p class="caption">
    <strong>Figure 4. The tangency offset.</strong> When $k = 100$ (the plant that serves the minimum of the long-run curve), tangency occurs at the bottom of the short-run curve. But for any other plant size, the two dots separate. A small plant ($k = 25$) touches the envelope at $q = 8.55$, well below its own cheapest scale of $11.60$ (ratio $0.7368$); a large plant ($k = 400$) touches at $q = 54.29$, above its cheapest scale of $46.42$ (ratio $1.1696$).
  </p>
</div>

<style>
  .card {
    border: 3px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2rem 0;
    background: #fff;
  }
  .hook-card {
    border-color: var(--violet, #7c5aed);
  }
  .card-header {
    margin-bottom: 1.25rem;
  }
  .card-title {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0 0 0.4rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .card-sub {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    opacity: 0.85;
  }
  .controls-bar {
    background: var(--paper, #f1f3f3);
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .slider-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .ctrl-label {
    font-size: 0.85rem;
    font-weight: 600;
    min-width: 8rem;
  }
  input[type="range"] {
    flex: 1;
    accent-color: var(--violet, #7c5aed);
  }
  .preset-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .ctrl-tag {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    opacity: 0.7;
    margin-right: 0.2rem;
  }
  .btn-preset {
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 700;
    border: 1px solid var(--squidink, #232f3e);
    background: transparent;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .btn-preset:hover {
    background: var(--squidink, #232f3e);
    color: #fff;
  }
  .btn-preset.active {
    background: var(--violet, #7c5aed);
    border-color: var(--violet, #7c5aed);
    color: #fff;
  }
  .readout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .readout-item {
    border: 1px solid #d4dada;
    padding: 0.6rem 0.8rem;
    display: flex;
    flex-direction: column;
  }
  .readout-item.highlight {
    border-color: var(--violet, #7c5aed);
    background: rgba(124, 90, 237, 0.05);
  }
  .lbl {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--squidink, #232f3e);
    opacity: 0.8;
  }
  .val {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0.2rem 0;
  }
  .text-orange {
    color: #df2a5d;
  }
  .text-blue {
    color: #2074d5;
  }
  .status-tag {
    font-size: 0.95rem;
  }
  .sub {
    font-size: 0.75rem;
    opacity: 0.6;
  }
  .svg-wrap {
    width: 100%;
    margin-bottom: 0.75rem;
  }
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 0;
  }
</style>
