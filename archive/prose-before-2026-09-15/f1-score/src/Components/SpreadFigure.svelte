<script>
  import precomputed from "../precomputed.js";
  import katexify from "../katexify.js";
  import { sample, DEFAULT_DEGRADED, DEFAULT_N } from "../datasets.js";
  import { prCurve, bestF1, impliedCostRatio } from "../metrics.js";
  import { SKY, COSMOS, GREEN, NEUTRAL, ACCENT, HANDLE, CARD, FAINT, GRID, AXIS, LABEL, INK } from "../palette.js";

  const { draws, stats } = precomputed.spread;
  const pop = precomputed.population;

  let boxWidth = 600;
  $: BW = Math.max(280, boxWidth);

  // Live redraw state
  let liveDraw = null;
  let drawCount = 0;
  let isGenerating = false;

  function runNewDraw() {
    isGenerating = true;
    const seed = Math.floor(Math.random() * 1000000) + 20000;
    const rows = sample(DEFAULT_N, DEFAULT_DEGRADED, seed);
    const curve = prCurve(rows);
    const b = bestF1(curve);
    liveDraw = {
      seed,
      t: Math.round(b.t * 10000) / 10000,
      f1: Math.round(b.f1 * 10000) / 10000,
      ratio: Math.round(impliedCostRatio(b.t) * 100) / 100,
      positives: rows.reduce((acc, r) => acc + r.y, 0),
    };
    drawCount++;
    isGenerating = false;
  }

  // Layout and Scales
  const pad = { top: 35, right: 30, bottom: 45, left: 40 };
  const hStrip = 105;

  // Strip 1: Threshold t in [0.10, 0.42]
  const minTScale = 0.10;
  const maxTScale = 0.42;
  $: plotW = Math.max(100, BW - pad.left - pad.right);
  $: xT = (t) => pad.left + ((Math.min(maxTScale, Math.max(minTScale, t)) - minTScale) / (maxTScale - minTScale)) * plotW;

  // Strip 2: Implied cost ratio in [1.2, 7.5]
  const minRScale = 1.2;
  const maxRScale = 7.5;
  $: xR = (r) => pad.left + ((Math.min(maxRScale, Math.max(minRScale, r)) - minRScale) / (maxRScale - minRScale)) * plotW;

  // Jitter for the 40 dots to avoid complete occlusion
  const jitterY = (seed, h) => {
    const pseudo = ((seed * 9301 + 49297) % 233280) / 233280;
    return pad.top + (h - pad.top - pad.bottom) * (0.25 + 0.5 * pseudo);
  };
</script>

<h1 class="body-header">The Spread: How Sample Luck Dictates Your Policy</h1>

<p class="body-text">
  A common reaction to these identities is reassurance: <em>"Sure, but I have a large validation set.
  Six thousand pumps is plenty of data to find the right threshold."</em>
</p>

<p class="body-text">
  It is not. While 6,000 total pumps sounds large, a ~3% failure rate means your validation set
  contains only ~182 actual failures. On an empirical sample, the precision-recall curve is a jagged
  staircase. Small variations in which pump happens to fail first create wild local fluctuations in
  the argmax of {@html katexify("F_1")}.
</p>

<p class="body-text">
  Across <span class="bold">40 separate draws</span> of 6,000 pumps from this identical fleet,
  the empirical best threshold ranged from <span class="mono bold">0.1244</span> to
  <span class="mono bold">0.3857</span> (standard deviation <span class="mono">0.0561</span>)
  around the population optimum of <span class="mono">0.2552</span>.
</p>

<div class="lab-container" id="spread-figure">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>

    <div class="card-top">
      <div>
        <h3 class="figure-title">Empirical Variation Across 40 Validation Sets</h3>
        <p class="figure-sub">Each grey dot is the optimal threshold chosen on one 6,000-pump sample.</p>
      </div>
      <button class="btn-primary" on:click={runNewDraw} disabled={isGenerating}>
        {isGenerating ? "Sampling..." : "Re-draw validation set"}
      </button>
    </div>

    <!-- Live Readout Banner if user drew a sample -->
    {#if liveDraw}
      <div class="live-banner">
        <span class="live-tag">NEW DRAW #{drawCount}</span>
        <span>
          Found <b>{liveDraw.positives}</b> failures.
          Argmax threshold: <span class="mono bold text-handle">{liveDraw.t.toFixed(4)}</span>
          (F1 = <span class="mono">{liveDraw.f1.toFixed(3)}</span>).
          Implied cost ratio: <span class="mono bold text-purple">{liveDraw.ratio.toFixed(2)}×</span>!
        </span>
      </div>
    {/if}

    <!-- Chart 1: Threshold Distribution Strip -->
    <div class="strip-wrapper">
      <div class="strip-header">
        <span>OPTIMAL THRESHOLD, t*</span>
        <span class="strip-stat">Mean: {stats.meanT.toFixed(4)} | SD: {stats.sdT.toFixed(4)}</span>
      </div>
      <svg viewBox="0 0 {BW} {hStrip}" width={BW} height={hStrip} class="plot-svg">
        <!-- Scale Axis line -->
        <line x1={xT(minTScale)} x2={xT(maxTScale)} y1={hStrip - pad.bottom} y2={hStrip - pad.bottom} stroke={AXIS} stroke-width="1.5" />

        <!-- Ticks -->
        {#each [0.15, 0.20, 0.25, 0.30, 0.35, 0.40] as tick}
          <line x1={xT(tick)} x2={xT(tick)} y1={hStrip - pad.bottom} y2={hStrip - pad.bottom + 6} stroke={AXIS} stroke-width="1" />
          <text x={xT(tick)} y={hStrip - pad.bottom + 18} fill={LABEL} font-size="10" text-anchor="middle">
            {tick.toFixed(2)}
          </text>
        {/each}

        <!-- Population Optimum Reference Line -->
        <line
          x1={xT(pop.tStar)}
          x2={xT(pop.tStar)}
          y1={pad.top - 12}
          y2={hStrip - pad.bottom}
          stroke={GREEN}
          stroke-width="2"
          stroke-dasharray="3,3"
        />
        <text x={xT(pop.tStar)} y={pad.top - 16} fill={GREEN} font-size="10.5" font-weight="bold" text-anchor="middle">
          Population t* = {pop.tStar.toFixed(4)}
        </text>

        <!-- 40 Historical Draws Dots -->
        {#each draws as d}
          <circle
            cx={xT(d.t)}
            cy={jitterY(d.seed, hStrip)}
            r="4.5"
            fill={NEUTRAL}
            opacity="0.65"
          />
        {/each}

        <!-- User Live Draw Dot -->
        {#if liveDraw}
          <circle
            cx={xT(liveDraw.t)}
            cy={pad.top + (hStrip - pad.top - pad.bottom) / 2}
            r="8"
            fill={HANDLE}
            stroke="#ffffff"
            stroke-width="2.5"
          />
        {/if}
      </svg>
    </div>

    <!-- Chart 2: Implied Cost Ratio Strip -->
    <div class="strip-wrapper">
      <div class="strip-header">
        <span>IMPLIED COST RATIO: (1 - t*) / t*</span>
        <span class="strip-stat">Range: {stats.minRatio}× to {stats.maxRatio}×</span>
      </div>
      <svg viewBox="0 0 {BW} {hStrip}" width={BW} height={hStrip} class="plot-svg">
        <!-- Scale Axis line -->
        <line x1={xR(minRScale)} x2={xR(maxRScale)} y1={hStrip - pad.bottom} y2={hStrip - pad.bottom} stroke={AXIS} stroke-width="1.5" />

        <!-- Ticks -->
        {#each [2, 3, 4, 5, 6, 7] as tick}
          <line x1={xR(tick)} x2={xR(tick)} y1={hStrip - pad.bottom} y2={hStrip - pad.bottom + 6} stroke={AXIS} stroke-width="1" />
          <text x={xR(tick)} y={hStrip - pad.bottom + 18} fill={LABEL} font-size="10" text-anchor="middle">
            {tick}×
          </text>
        {/each}

        <!-- Population Reference Line -->
        <line
          x1={xR(pop.costRatio)}
          x2={xR(pop.costRatio)}
          y1={pad.top - 12}
          y2={hStrip - pad.bottom}
          stroke={GREEN}
          stroke-width="2"
          stroke-dasharray="3,3"
        />
        <text x={xR(pop.costRatio)} y={pad.top - 16} fill={GREEN} font-size="10.5" font-weight="bold" text-anchor="middle">
          Population ratio = {pop.costRatio.toFixed(2)}×
        </text>

        <!-- 40 Historical Draws Dots -->
        {#each draws as d}
          <circle
            cx={xR(d.ratio)}
            cy={jitterY(d.seed + 99, hStrip)}
            r="4.5"
            fill={NEUTRAL}
            opacity="0.65"
          />
        {/each}

        <!-- User Live Draw Dot -->
        {#if liveDraw}
          <circle
            cx={xR(liveDraw.ratio)}
            cy={pad.top + (hStrip - pad.top - pad.bottom) / 2}
            r="8"
            fill={HANDLE}
            stroke="#ffffff"
            stroke-width="2.5"
          />
        {/if}
      </svg>
    </div>
  </div>
</div>

<p class="body-text">
  Look at what that spread means in real plant economics. Depending purely on which random 6,000 pumps
  happened to end up in your validation sample:
</p>

<ul class="body-list">
  <li>In one draw (<span class="mono">t* = 0.3857</span>), you asserted that a missed breakdown is worth only <span class="bold">1.59 false alarms</span>.</li>
  <li>In another draw (<span class="mono">t* = 0.1244</span>), you asserted that a missed breakdown is worth <span class="bold">7.04 false alarms</span>.</li>
</ul>

<p class="body-text">
  That is a <span class="bold">4.4× swing in operating philosophy</span>, decided not by safety standards
  or downtime costs, but by finite validation sample noise.
</p>

<p class="body-text">
  There is also a second, systematic bias: <span class="bold">optimism</span>. Because the threshold was
  selected on the very same validation set used to evaluate it, the empirical maximum F1 averages
  <span class="mono bold">0.5176</span> across the 40 draws — roughly <span class="bold">+0.0071 higher</span>
  than the true population maximum of <span class="mono">0.5105</span>. Small, but permanent.
</p>

<style>
  .lab-container {
    max-width: 760px;
    margin: 2rem auto;
    padding: 0 0.5rem;
  }

  .card {
    background: var(--white, #ffffff);
    border: 1px solid var(--faint, #e2e8f0);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  }

  .measure {
    width: 100%;
    height: 0;
    pointer-events: none;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .figure-title {
    font-family: var(--font-heavy);
    font-size: 1.15rem;
    color: var(--squid-ink, #232f3e);
    margin: 0 0 0.25rem 0;
  }

  .figure-sub {
    font-size: 0.85rem;
    color: #718096;
    margin: 0;
  }

  .btn-primary {
    background: var(--violet, #7c5aed);
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 0.6rem 1.1rem;
    font-size: 0.88rem;
    font-family: var(--font-main);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-primary:hover {
    background: #6b46c1;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .live-banner {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 0.65rem 0.9rem;
    font-size: 0.85rem;
    color: #92400e;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .live-tag {
    background: #fef3c7;
    color: #b45309;
    font-weight: 700;
    font-size: 0.72rem;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }

  .strip-wrapper {
    background: #fafbfc;
    border: 1px solid #edf2f7;
    border-radius: 8px;
    padding: 0.9rem 1rem 0.3rem 1rem;
    margin-bottom: 1rem;
  }

  .strip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #4a5568;
    margin-bottom: 0.2rem;
  }

  .strip-stat {
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    color: #718096;
    font-weight: normal;
  }

  .plot-svg {
    display: block;
    width: 100%;
    overflow: visible;
  }

  .body-list {
    max-width: 600px;
    margin: 1rem auto;
    padding-left: 1.5rem;
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--squid-ink, #232f3e);
  }

  .body-list li {
    margin-bottom: 0.5rem;
  }

  .text-handle { color: #d97706; }
  .text-purple { color: #7c5aed; }
  .mono { font-family: var(--font-mono, monospace); }
  .bold { font-weight: bold; }
</style>
