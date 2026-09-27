<script>
  /*
    ShifterFigure.svelte
    An exogenous variable (supply shifter / instrument) that shifts supply only.
    Contrasts the wrong-signed naive OLS slope with the two-point route that recovers true demand.
  */
  import { shifterPoints } from "../datasets.js";
  import { sampleMoments, B, S, A, C } from "../market.js";
  import MarketPanel from "./MarketPanel.svelte";

  let showIV = $state(true);

  // Group by shifter z
  const zNeg = shifterPoints.filter((pt) => pt.z === -1);
  const zPos = shifterPoints.filter((pt) => pt.z === 1);

  const mNeg = sampleMoments(zNeg);
  const mPos = sampleMoments(zPos);
  const mAll = sampleMoments(shifterPoints);

  // IV two-point slope: Δq / Δp between the two shifter means
  const ivSlope = (mPos.meanQ - mNeg.meanQ) / (mPos.meanP - mNeg.meanP);
</script>

<div class="figure-wrap" id="shifter-figure">
  <div class="card-header">
    <h3 class="figure-title">The Solution: An Exogenous Shifter</h3>
    <p class="figure-desc">
      More observations cannot solve the identification problem: millions of data points merely estimate the confounded mixture with greater precision. What breaks the deadlock is an <strong>instrument</strong> — a variable that shifts one curve without entering the other.
    </p>
  </div>

  <div class="controls-bar">
    <div class="presets" role="group" aria-label="Shifter comparison options">
      <button class="pill" class:active={showIV} onclick={() => (showIV = true)}>
        Show Instrument Estimate (IV)
      </button>
      <button class="pill" class:active={!showIV} onclick={() => (showIV = false)}>
        Show Naive OLS Alone
      </button>
    </div>
  </div>

  <div class="panel-container">
    <MarketPanel
      points={shifterPoints}
      showTrueCurves={true}
      showCrossing={false}
      fittedLine={!showIV ? { slope: mAll.slope, meanP: mAll.meanP, meanQ: mAll.meanQ } : null}
      ariaLabel="Supply shifter data recovering demand curve"
    >
      {#snippet children({ x, y })}
        {#if showIV}
          <!-- The two group centroids -->
          <circle cx={x(mNeg.meanQ)} cy={y(mNeg.meanP)} r="7" fill="#7c5aed" stroke="#fff" stroke-width="2" />
          <circle cx={x(mPos.meanQ)} cy={y(mPos.meanP)} r="7" fill="#7c5aed" stroke="#fff" stroke-width="2" />

          <!-- Line connecting the two means (IV line) -->
          <line
            class="line iv-line"
            x1={x(mNeg.meanQ - ivSlope * (mNeg.meanP - 35))}
            y1={y(35)}
            x2={x(mPos.meanQ - ivSlope * (mPos.meanP - 5))}
            y2={y(5)}
            stroke="#7c5aed"
            stroke-width="3"
          />
          <text class="iv-label" x={x(mNeg.meanQ) + 10} y={y(mNeg.meanP) - 10} fill="#7c5aed">
            Group Z = −1
          </text>
          <text class="iv-label" x={x(mPos.meanQ) + 10} y={y(mPos.meanP) + 16} fill="#7c5aed">
            Group Z = +1
          </text>
        {/if}
      {/snippet}
    </MarketPanel>
  </div>

  <div class="figure-caption">
    {#if showIV}
      <p class="readout-text">
        <strong>Instrumental Variables Slope: {ivSlope.toFixed(2)}</strong> (True demand slope: −{B.toFixed(1)}).
        By isolating the variation caused solely by supply shifts Z, the line connecting the two group averages strips away demand shocks and recovers the true demand curve.
      </p>
    {:else}
      <p class="readout-text error">
        <strong>Naive OLS Slope: +{mAll.slope.toFixed(2)}</strong> (True demand slope: −{B.toFixed(1)}).
        Running a standard regression across the entire cloud yields a <em>positive</em> slope — the wrong sign! It conflates demand shifts with supply responses.
      </p>
    {/if}
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
    gap: 0.5rem;
    margin-bottom: 1.2rem;
  }
  .pill {
    background: transparent;
    border: 2px solid var(--squidink, #232f3e);
    color: var(--squidink, #232f3e);
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
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
  .panel-container {
    background: var(--paper, #f1f3f3);
    border: 1px solid #e5e9e9;
    padding: 0.75rem 0.5rem 0.25rem 0.5rem;
  }
  .figure-caption {
    margin-top: 1rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  .readout-text {
    font-family: var(--font-mono, monospace);
    font-size: 0.85rem;
    background: rgba(124, 90, 237, 0.08);
    padding: 0.4rem 0.6rem;
    border-left: 3px solid var(--violet, #7c5aed);
    margin: 0;
  }
  .readout-text.error {
    background: rgba(223, 42, 93, 0.08);
    border-left-color: #df2a5d;
  }
  .iv-label {
    font-family: var(--font-main, sans-serif);
    font-size: 0.78rem;
    font-weight: 700;
  }
</style>
