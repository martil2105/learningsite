<script>
  /*
    CloudLab.svelte
    The primary hook: demand-shock share w on a slider with 3 presets (w=0, w=0.6, w=1).
    Shows the cloud of equilibrium observations, the live OLS fitted line, and faint true curves.
  */
  import { computeCloudPoints } from "../datasets.js";
  import { sampleMoments, populationMoments, B, S, A, C } from "../market.js";
  import MarketPanel from "./MarketPanel.svelte";

    let w = $state(0.35); // Initial shock share

  // a typographic minus in reader text, to match the −3.0 in the prose
  const minus = (s) => s.replace(/^-/, "−");

  let points = $derived(computeCloudPoints(w));
  let sample = $derived(sampleMoments(points));
  let pop = $derived(populationMoments(w * 100, (1 - w) * 100));

  let readout = $derived(
    `Demand-shock share w = ${w.toFixed(2)}: in this sample of ${points.length} months, the fitted slope is ${minus(sample.slope.toFixed(2))} and R² = ${sample.r2.toFixed(3)}. With unlimited data, the slope would be ${minus(pop.slope.toFixed(2))}.`
  );
</script>

<div class="figure-wrap" id="cloud-lab">
  <div class="card-header">
    <h3 class="figure-title">Which curve is moving?</h3>
    <p class="figure-desc">
      Every month, random shocks move both demand and supply. The slider sets <em>w</em>, the share of the shock variance that comes from demand. Drag it and watch the cloud of prices and quantities turn from the demand curve to the supply curve.
    </p>
  </div>

  <div class="controls-bar">
    <div class="presets" role="group" aria-label="Shock share presets">
      <button class="pill" class:active={Math.abs(w - 0) < 1e-4} onclick={() => (w = 0)}>
        Supply shocks only (w = 0)
      </button>
      <button class="pill" class:active={Math.abs(w - 0.6) < 1e-4} onclick={() => (w = 0.6)}>
        Flat cloud (w* = 0.6)
      </button>
      <button class="pill" class:active={Math.abs(w - 1) < 1e-4} onclick={() => (w = 1)}>
        Demand shocks only (w = 1)
      </button>
    </div>

    <label class="slider-row">
      <span class="slider-label">Demand-shock share <em>w</em>: <strong>{w.toFixed(2)}</strong></span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        bind:value={w}
        aria-label="Demand-shock share w"
      />
    </label>
  </div>

  <div class="panel-container">
    <MarketPanel
      {points}
      showTrueCurves={true}
      showCrossing={true}
      fittedLine={{ slope: sample.slope, meanP: sample.meanP, meanQ: sample.meanQ }}
      ariaLabel="Interactive shock share cloud lab"
    />
  </div>

  <div class="figure-caption">
    <p class="readout-text">
      {readout}
    </p>
    <p class="explanation">
      {#if Math.abs(w - 0) < 0.05}
        When only supply moves (w = 0), every point lies on the demand curve, so the fitted slope is −3.00 and R² = 1.00.
      {:else if Math.abs(w - 0.6) < 0.05}
        At w* = 0.60, the cloud is completely flat (slope ≈ 0.00, R² ≈ 0.00). Neither curve is flat, since demand's slope is −3.0 and supply's is +2.0, but their shocks cancel out in the covariance.
      {:else if Math.abs(w - 1.0) < 0.05}
        When only demand moves (w = 1), every point lies on the supply curve, so the fitted slope is +2.00 and R² = 1.00.
      {:else}
        In between, the fitted slope is a weighted average of the demand slope and the supply slope, with weights set by w.
      {/if}
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
    letter-spacing: 0;
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
  @media (max-width: 700px) {
    .controls-bar {
      position: sticky;
      top: 0;
      z-index: 10;
    }
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
  .figure-caption {
    margin-top: 1rem;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--squidink, #232f3e);
  }
  .readout-text {
    font-family: var(--font-mono, monospace);
    font-size: 0.88rem;
    font-weight: 600;
    background: rgba(124, 90, 237, 0.08);
    padding: 0.4rem 0.6rem;
    border-left: 3px solid var(--violet, #7c5aed);
    margin-bottom: 0.5rem;
  }
  .explanation {
    margin: 0;
  }
</style>
