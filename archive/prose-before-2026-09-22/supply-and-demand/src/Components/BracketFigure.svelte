<script>
  /*
    BracketFigure.svelte
    The central identity on screen:
    Forward regression (solid), reverse regression (dashed), and true demand (blue).
    An admissible elasticity range bar whose ratio equals exactly 1/R².
  */
  import { computeCloudPoints } from "../datasets.js";
  import { populationMoments, demandBracket, sampleMoments, B, S, p0, q0 } from "../market.js";
  import MarketPanel from "./MarketPanel.svelte";

  // Shock share restricted to downward-sloping clouds (w < 0.6)
  let w = $state(0.35); // The worked case

  // Worked case variances: td2 = w * 100, ts2 = (1-w) * 100
  let pop = $derived(populationMoments(w * 100, (1 - w) * 100));
  let bracket = $derived(demandBracket(pop.vp, pop.vq, pop.cov));

  let points = $derived(computeCloudPoints(w));
  let sample = $derived(sampleMoments(points));
  let sampleBrack = $derived(demandBracket(sample.vp, sample.vq, sample.cov));

  // Elasticity at equilibrium point (20, 60): |eps| = B * (20 / 60) = B / 3
  let epsLo = $derived(bracket ? (bracket.Blo * p0) / q0 : 0);
  let epsHi = $derived(bracket ? (bracket.Bhi * p0) / q0 : 0);
  let epsTrue = $derived((B * p0) / q0); // 1.0

  // Presets from the worked table
  function setPreset(val) {
    w = val;
  }
</script>

<div class="figure-wrap" id="bracket-figure">
  <div class="card-header">
    <h3 class="figure-title">The Bracket Identity: Goodness of Fit Is Identification Failure</h3>
    <p class="figure-desc">
      When market transactions slope downward, two empirical bounds contain the true demand curve. The forward regression (fitting quantity on price) gives a lower bound <strong>B_lo</strong>. The reverse regression (fitting price on quantity and solving backwards) gives an upper bound <strong>B_hi</strong>. The ratio between them is not an approximation: <strong>B_hi / B_lo = 1 / R²</strong> exactly.
    </p>
  </div>

  <div class="controls-bar">
    <div class="presets" role="group" aria-label="Bracket figure presets">
      <button class="pill" class:active={Math.abs(w - 0.35) < 0.01} onclick={() => setPreset(0.35)}>
        Worked Case (R² = 0.22, 4.64×)
      </button>
      <button class="pill" class:active={Math.abs(w - 0.01) < 0.01} onclick={() => setPreset(0.01)}>
        Pure Supply Shift (R² = 0.97, 1.03×)
      </button>
      <button class="pill" class:active={Math.abs(w - 0.10) < 0.01} onclick={() => setPreset(0.10)}>
        Mild Demand Noise (R² = 0.74, 1.36×)
      </button>
      <button class="pill" class:active={Math.abs(w - 0.50) < 0.01} onclick={() => setPreset(0.50)}>
        High Ambiguity (R² = 0.04, 26.0×)
      </button>
    </div>

    <label class="slider-row">
      <span class="slider-label">Demand-shock share <em>w</em>: <strong>{w.toFixed(2)}</strong></span>
      <input
        type="range"
        min="0.01"
        max="0.55"
        step="0.01"
        bind:value={w}
        aria-label="Demand-shock share for bracket"
      />
    </label>
  </div>

  <div class="panel-container">
    <MarketPanel
      {points}
      showTrueCurves={true}
      showCrossing={true}
      fittedLine={{ slope: sample.slope, meanP: sample.meanP, meanQ: sample.meanQ }}
      reverseLine={{ slopePQ: sample.cov / sample.vq, meanP: sample.meanP, meanQ: sample.meanQ }}
      ariaLabel="Forward and reverse regressions framing true demand"
    />
  </div>

  <!-- The Admissible Elasticity Bar and Identity Readout -->
  <div class="bracket-display">
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-label">Bracket Ratio (B_hi / B_lo)</span>
        <span class="stat-val ratio-val">{bracket ? bracket.ratio.toFixed(3) : "—"}×</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Inverse Fit (1 / R²)</span>
        <span class="stat-val invr2-val">{bracket ? bracket.invR2.toFixed(3) : "—"}×</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Sample R²</span>
        <span class="stat-val">{sample.r2.toFixed(4)}</span>
      </div>
    </div>

    {#if bracket}
      <div class="bar-section">
        <div class="bar-header">
          <span>Admissible Demand Elasticity |ε|: <strong>[{epsLo.toFixed(3)}, {epsHi.toFixed(3)}]</strong></span>
          <span class="truth-tag">True |ε| = {epsTrue.toFixed(3)}</span>
        </div>
        <div class="bar-track">
          <!-- Scale: 0 to 5.0 -->
          <div
            class="bar-range"
            style={`left: ${Math.min(100, (epsLo / 5.0) * 100)}%; width: ${Math.min(100 - (epsLo / 5.0) * 100, ((epsHi - epsLo) / 5.0) * 100)}%;`}
          ></div>
          <div
            class="truth-pin"
            style={`left: ${(epsTrue / 5.0) * 100}%;`}
            title="True demand elasticity"
          ></div>
        </div>
        <div class="bar-labels">
          <span>0.0</span>
          <span>1.0</span>
          <span>2.0</span>
          <span>3.0</span>
          <span>4.0</span>
          <span>5.0+</span>
        </div>
      </div>
    {/if}
  </div>

  <div class="figure-caption">
    <p class="legend-note">
      Solid green line: forward regression (quantity on price). Dashed green line: reverse regression (price on quantity). Blue line: true demand. As R² falls, the two regression lines scissor apart, widening the identification bracket by a factor of exactly 1/R².
    </p>
  </div>
</div>

<style>
  .figure-wrap {
    background: #ffffff;
    border: 3px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2.5rem 0;
  }
  .card-header {
    margin-bottom: 1rem;
  }
  .figure-title {
    font-size: 1.25rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 0.5rem 0;
    color: var(--squidink, #232f3e);
  }
  .figure-desc {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    color: var(--squidink, #232f3e);
    opacity: 0.85;
  }
  .controls-bar {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.2rem;
    background: var(--paper, #f1f3f3);
    padding: 0.8rem 1rem;
    border: 1px solid #e5e9e9;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .pill {
    background: transparent;
    border: 2px solid var(--squidink, #232f3e);
    color: var(--squidink, #232f3e);
    padding: 0.35rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .pill:hover,
  .pill.active {
    background: var(--squidink, #232f3e);
    color: #ffffff;
  }
  .slider-row {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .slider-label {
    font-size: 0.85rem;
    color: var(--squidink, #232f3e);
  }
  input[type="range"] {
    width: 100%;
    accent-color: var(--violet, #7c5aed);
  }
  .panel-container {
    background: var(--paper, #f1f3f3);
    border: 1px solid #e5e9e9;
    padding: 0.75rem 0.5rem 0.25rem 0.5rem;
  }
  .bracket-display {
    margin-top: 1.2rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 1rem;
  }
  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.8rem;
    margin-bottom: 1.2rem;
  }
  .stat-box {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .stat-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
  }
  .stat-val {
    font-family: var(--font-mono, monospace);
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--squidink, #232f3e);
  }
  .ratio-val, .invr2-val {
    color: var(--violet, #7c5aed);
  }
  .bar-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .bar-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--squidink, #232f3e);
  }
  .truth-tag {
    font-weight: 700;
    color: #2074d5;
  }
  .bar-track {
    position: relative;
    height: 18px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
  }
  .bar-range {
    position: absolute;
    top: 0;
    bottom: 0;
    background: #7c5aed;
    opacity: 0.7;
    transition: all 120ms ease;
  }
  .truth-pin {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 4px;
    background: #2074d5;
    z-index: 2;
  }
  .bar-labels {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    color: #64748b;
  }
  .figure-caption {
    margin-top: 1rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  .legend-note {
    margin: 0;
    font-size: 0.85rem;
    color: #555;
  }
</style>
