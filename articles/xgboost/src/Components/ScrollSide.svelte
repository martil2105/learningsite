<script>
  import Scrolly from "./Scrolly.svelte";
  import RegularizationFigure from "./RegularizationFigure.svelte";
  import katexify from "../katexify";
  import { scaleLinear } from "d3-scale";
  import { smallSample, BOUNDS, AXIS } from "../datasets.js";
  import {
    calculateBaseScore,
    scanCandidateSplits,
    leafWeight,
    computeGradients,
  } from "../xgboost.js";
  import { INK, SURFACE, SKY, COSMOS, VIOLET, SMILE, JUNGLE, MUTED } from "../palette.js";

  const baseScore = calculateBaseScore(smallSample);
  const baseGrads = computeGradients(
    smallSample,
    smallSample.map(() => baseScore)
  );
  const candidates = scanCandidateSplits(baseGrads, 1.0, 0.0);
  const bestCandidate = candidates.reduce(
    (max, c) => (c.gain > max.gain ? c : max),
    candidates[0]
  );

  // Left & right leaf calculation for lambda=1 and lambda=5
  const leftPts = baseGrads.filter((p) => p.x <= bestCandidate.splitValue);
  const rightPts = baseGrads.filter((p) => p.x > bestCandidate.splitValue);

  const wLeftNoReg = leafWeight(leftPts, 0.0);
  const wRightNoReg = leafWeight(rightPts, 0.0);
  const wLeftReg = leafWeight(leftPts, 1.0);
  const wRightReg = leafWeight(rightPts, 1.0);
  const wLeftHeavyReg = leafWeight(leftPts, 5.0);
  const wRightHeavyReg = leafWeight(rightPts, 5.0);

  const eta = 0.3;
  const updatedPreds = smallSample.map((p) => {
    const w = p.x <= bestCandidate.splitValue ? wLeftReg : wRightReg;
    return baseScore + eta * w;
  });
  const updatedGrads = computeGradients(smallSample, updatedPreds);

  let width = 600;
  let height = 480;
  const margin = { top: 30, right: 30, bottom: 50, left: 55 };

  $: innerWidth = Math.max(200, width - margin.left - margin.right);
  $: innerHeight = Math.max(200, height - margin.top - margin.bottom);

  $: xScale = scaleLinear()
    .domain([BOUNDS.x0, BOUNDS.x1])
    .range([margin.left, margin.left + innerWidth]);

  $: yScale = scaleLinear()
    .domain([BOUNDS.y0, BOUNDS.y1])
    .range([margin.top + innerHeight, margin.top]);

  // Scrolly state
  let value = 0;
  $: step = typeof value === "number" ? Math.min(5, Math.max(0, value)) : 0;

  const steps = [
    `<h1 class='step-title'>1. The Starting Baseline</h1>
     <p>Before training any trees, XGBoost starts with a constant baseline prediction,
     ${katexify("\\hat{y}^{(0)} = \\bar{y} \\approx " + baseScore.toFixed(1) + "\\text{ kWh}")}.
     This is the simplest possible starting point: the overall mean of our ten days.</p>`,

    `<h1 class='step-title'>2. Calculating Gradients</h1>
     <p>For each day, we measure the gap between the true demand and our baseline,
     ${katexify("r_i = y_i - \\hat{y}^{(0)}")}.
     Under squared error, the negative gradient is exactly this residual, so
     ${katexify("-g_i = r_i")}.
     The rose arrows point up for days that used more electricity than average (the cold
     ones) and down for days that used less.</p>`,

    `<h1 class='step-title'>3. Scanning Candidate Splits</h1>
     <p>Next, XGBoost tests every midpoint between adjacent temperature observations.
     For each candidate threshold, it computes the <span class='bold'>Similarity Score</span>
     of the left and right groups and evaluates the <span class='bold'>Gain</span>.
     The highest gain occurs at <span class='bold'>${bestCandidate.splitValue.toFixed(1)}°C</span>,
     which splits off the coldest ${bestCandidate.leftCount} days.</p>
     <p>Now look closely at what the other leaf contains: mild days at 17°C sitting alongside
     the hottest day at 33°C, which used nearly three times as much power. Demand is
     U-shaped in temperature, and a single threshold can't express that. In fact, a single
     stump is close to the worst case for this data, which is exactly why we're going to
     need a lot of them.</p>`,

    `<h1 class='step-title'>4. Optimal Leaf Weights</h1>
     <p>With the split locked in at ${bestCandidate.splitValue.toFixed(1)}°C,
     XGBoost calculates the optimal output for each leaf using
     ${katexify("w^* = \\frac{\\sum r_i}{|I| + \\lambda}")}.
     The left leaf outputs <span class='bold'>+${wLeftReg.toFixed(1)} kWh</span> (the
     cold-weather surge in demand), while the right leaf outputs
     <span class='bold'>${wRightReg.toFixed(1)} kWh</span>.</p>`,

    `<h1 class='step-title'>5. Taming Leaves with Regularization (λ)</h1>
     <p>Notice the ${katexify("\\lambda")} in the denominator!
     Without regularization (${katexify("\\lambda = 0")}), the leaves jump to
     <span class='bold'>+${wLeftNoReg.toFixed(1)}</span> and <span class='bold'>${wRightNoReg.toFixed(1)}</span>,
     but increasing ${katexify("\\lambda")} to 5 shrinks them to
     <span class='bold'>+${wLeftHeavyReg.toFixed(1)}</span> and <span class='bold'>${wRightHeavyReg.toFixed(1)}</span>.</p>
     <p>Notice which leaf moved further. λ competes with ${katexify("|I|")}, the number of
     points in the leaf, so a leaf resting on ${leftPts.length} days is pulled toward zero much
     harder than one resting on ${rightPts.length}. Further down, there's a figure where you
     can adjust both penalties yourself.</p>`,

    `<h1 class='step-title'>6. Shrinkage: Adding the Tree</h1>
     <p>Instead of jumping straight to the new tree's full prediction, XGBoost multiplies
     its leaf values by the learning rate (also called shrinkage), ${katexify("\\eta = 0.3")},
     giving ${katexify("\\hat{y}^{(1)}(x) = \\hat{y}^{(0)} + 0.3 \\cdot f_1(x)")}.
     As a result, the blue prediction line moves closer to the data, and the residual
     errors shrink!</p>`,
  ];
</script>

<h1 class="body-header">Growing a Tree: One Split at a Time</h1>

<p class="body-text">
  To see the mathematics in motion, let's follow the very first XGBoost tree as it
  grows on a clean ten-day sample. Scroll slowly to trace each calculation.
</p>

<section>
  <div class="section-container">
    <div class="steps-container">
      <Scrolly bind:value>
        {#each steps as text, i}
          <div class="step" class:active={step === i}>
            <div class="step-content">
              {@html text}
            </div>
          </div>
        {/each}
      </Scrolly>
    </div>

    <div class="sticky-container">
      <div class="chart-box">
      <div class="measure" bind:clientWidth={width} />
        <svg {width} {height} viewBox="0 0 {width} {height}">
          <!-- Background grid -->
          {#each yScale.ticks(6) as tick}
            <line
              x1={margin.left}
              x2={margin.left + innerWidth}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="#e2e8f0"
              stroke-dasharray="3,3"
            />
            <text
              x={margin.left - 10}
              y={yScale(tick) + 4}
              text-anchor="end"
              class="axis-label">{tick}</text
            >
          {/each}

          {#each xScale.ticks(7) as tick}
            <line
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={margin.top}
              y2={margin.top + innerHeight}
              stroke="#e2e8f0"
              stroke-dasharray="3,3"
            />
            <text
              x={xScale(tick)}
              y={margin.top + innerHeight + 20}
              text-anchor="middle"
              class="axis-label">{tick}°C</text
            >
          {/each}

          <!-- Axis Titles -->
          <text
            x={margin.left + innerWidth / 2}
            y={margin.top + innerHeight + 42}
            text-anchor="middle"
            class="axis-title">{AXIS.x}</text
          >
          <text
            transform="rotate(-90)"
            x={-(margin.top + innerHeight / 2)}
            y={margin.left - 38}
            text-anchor="middle"
            class="axis-title">{AXIS.y}</text
          >

          <!-- Step 0-4: Base Prediction Line -->
          {#if step < 5}
            <line
              x1={margin.left}
              x2={margin.left + innerWidth}
              y1={yScale(baseScore)}
              y2={yScale(baseScore)}
              stroke={SKY}
              stroke-width="2.5"
              stroke-dasharray="6,4"
            />
            <text
              x={margin.left + innerWidth - 5}
              y={yScale(baseScore) - 8}
              text-anchor="end"
              fill={SKY}
              class="line-label">ŷ⁽⁰⁾ = {baseScore.toFixed(1)} kWh</text
            >
          {/if}

          <!-- Step 1-4: Residual Stems -->
          {#if step >= 1 && step <= 4}
            {#each baseGrads as p}
              <line
                x1={xScale(p.x)}
                x2={xScale(p.x)}
                y1={yScale(baseScore)}
                y2={yScale(p.y)}
                stroke={COSMOS}
                stroke-width="2"
                opacity="0.75"
              />
              <!-- Arrowhead pointing to point -->
              <circle
                cx={xScale(p.x)}
                cy={yScale(p.y)}
                r="3"
                fill={COSMOS}
              />
            {/each}
          {/if}

          <!-- Step 2: Split Scanning Guide Line -->
          {#if step === 2}
            <line
              x1={xScale(bestCandidate.splitValue)}
              x2={xScale(bestCandidate.splitValue)}
              y1={margin.top}
              y2={margin.top + innerHeight}
              stroke={VIOLET}
              stroke-width="3"
              stroke-dasharray="4,3"
            />
            <rect
              x={xScale(bestCandidate.splitValue) - 55}
              y={margin.top + 10}
              width="110"
              height="26"
              fill="#ffffff"
              stroke={VIOLET}
              rx="4"
            />
            <text
              x={xScale(bestCandidate.splitValue)}
              y={margin.top + 27}
              text-anchor="middle"
              fill={VIOLET}
              font-weight="bold"
              font-size="12"
            >
              Split: {bestCandidate.splitValue.toFixed(1)}°C
            </text>
          {/if}

          <!-- Step 3: Optimal Leaf Weights Step Function -->
          {#if step === 3}
            <line
              x1={xScale(bestCandidate.splitValue)}
              x2={xScale(bestCandidate.splitValue)}
              y1={margin.top}
              y2={margin.top + innerHeight}
              stroke={VIOLET}
              stroke-width="2"
              stroke-dasharray="4,4"
              opacity="0.5"
            />
            <!-- Left leaf value relative to base -->
            <line
              x1={margin.left}
              x2={xScale(bestCandidate.splitValue)}
              y1={yScale(baseScore + wLeftReg)}
              y2={yScale(baseScore + wLeftReg)}
              stroke={VIOLET}
              stroke-width="3.5"
            />
            <!-- Right leaf value relative to base -->
            <line
              x1={xScale(bestCandidate.splitValue)}
              x2={margin.left + innerWidth}
              y1={yScale(baseScore + wRightReg)}
              y2={yScale(baseScore + wRightReg)}
              stroke={VIOLET}
              stroke-width="3.5"
            />
            <!-- Vertical connecting jump -->
            <line
              x1={xScale(bestCandidate.splitValue)}
              x2={xScale(bestCandidate.splitValue)}
              y1={yScale(baseScore + wLeftReg)}
              y2={yScale(baseScore + wRightReg)}
              stroke={VIOLET}
              stroke-width="2"
              stroke-dasharray="2,2"
            />
            <text
              x={margin.left + 20}
              y={yScale(baseScore + wLeftReg) - 10}
              fill={VIOLET}
              font-weight="bold"
              font-size="13"
            >
              w_L = +{wLeftReg.toFixed(1)}
            </text>
            <text
              x={margin.left + innerWidth - 20}
              y={yScale(baseScore + wRightReg) + 20}
              text-anchor="end"
              fill={VIOLET}
              font-weight="bold"
              font-size="13"
            >
              w_R = {wRightReg.toFixed(1)}
            </text>
          {/if}

          <!-- Step 4: Comparing Lambda = 0 vs Lambda = 5 -->
          {#if step === 4}
            <!-- Unregularized (ghosted) -->
            <line
              x1={margin.left}
              x2={xScale(bestCandidate.splitValue)}
              y1={yScale(baseScore + wLeftNoReg)}
              y2={yScale(baseScore + wLeftNoReg)}
              stroke={MUTED}
              stroke-width="2"
              stroke-dasharray="4,3"
            />
            <line
              x1={xScale(bestCandidate.splitValue)}
              x2={margin.left + innerWidth}
              y1={yScale(baseScore + wRightNoReg)}
              y2={yScale(baseScore + wRightNoReg)}
              stroke={MUTED}
              stroke-width="2"
              stroke-dasharray="4,3"
            />
            <text
              x={margin.left + 15}
              y={yScale(baseScore + wLeftNoReg) - 6}
              fill={MUTED}
              font-size="11"
              font-weight="bold">λ = 0 (w_L = +{wLeftNoReg.toFixed(1)})</text
            >

            <!-- Regularized with lambda = 5 -->
            <line
              x1={margin.left}
              x2={xScale(bestCandidate.splitValue)}
              y1={yScale(baseScore + wLeftHeavyReg)}
              y2={yScale(baseScore + wLeftHeavyReg)}
              stroke={VIOLET}
              stroke-width="4"
            />
            <line
              x1={xScale(bestCandidate.splitValue)}
              x2={margin.left + innerWidth}
              y1={yScale(baseScore + wRightHeavyReg)}
              y2={yScale(baseScore + wRightHeavyReg)}
              stroke={VIOLET}
              stroke-width="4"
            />
            <text
              x={margin.left + 15}
              y={yScale(baseScore + wLeftHeavyReg) + 18}
              fill={VIOLET}
              font-size="12"
              font-weight="bold">λ = 5 (w_L = +{wLeftHeavyReg.toFixed(1)})</text
            >
          {/if}

          <!-- Step 5: Updated Ensemble Prediction with Eta -->
          {#if step === 5}
            <!-- Ghost of previous baseline -->
            <line
              x1={margin.left}
              x2={margin.left + innerWidth}
              y1={yScale(baseScore)}
              y2={yScale(baseScore)}
              stroke={MUTED}
              stroke-width="1.5"
              stroke-dasharray="4,4"
              opacity="0.6"
            />
            <!-- Updated Prediction Line -->
            <line
              x1={margin.left}
              x2={xScale(bestCandidate.splitValue)}
              y1={yScale(baseScore + eta * wLeftReg)}
              y2={yScale(baseScore + eta * wLeftReg)}
              stroke={SKY}
              stroke-width="3.5"
            />
            <line
              x1={xScale(bestCandidate.splitValue)}
              x2={margin.left + innerWidth}
              y1={yScale(baseScore + eta * wRightReg)}
              y2={yScale(baseScore + eta * wRightReg)}
              stroke={SKY}
              stroke-width="3.5"
            />
            <line
              x1={xScale(bestCandidate.splitValue)}
              x2={xScale(bestCandidate.splitValue)}
              y1={yScale(baseScore + eta * wLeftReg)}
              y2={yScale(baseScore + eta * wRightReg)}
              stroke={SKY}
              stroke-width="2"
              stroke-dasharray="2,2"
            />
            <!-- Shortened residual stems -->
            {#each updatedGrads as p}
              <line
                x1={xScale(p.x)}
                x2={xScale(p.x)}
                y1={yScale(p.yHat)}
                y2={yScale(p.y)}
                stroke={COSMOS}
                stroke-width="2"
                opacity="0.8"
              />
            {/each}
            <text
              x={margin.left + 20}
              y={yScale(baseScore + eta * wLeftReg) - 10}
              fill={SKY}
              font-weight="bold"
              font-size="13"
            >
              ŷ⁽¹⁾ = ŷ⁽⁰⁾ + 0.3·f₁(x)
            </text>
          {/if}

          <!-- Data Points -->
          {#each smallSample as p}
            <circle
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r="6"
              fill={INK}
              stroke="#ffffff"
              stroke-width="1.5"
            />
          {/each}
        </svg>

        <div class="legend-bar">
          <span class="legend-item">
            <span class="legend-dot" style="background-color: {INK};"></span>
            Household Data
          </span>
          <span class="legend-item">
            <span class="legend-line" style="background-color: {SKY};"></span>
            Ensemble ŷ
          </span>
          {#if step >= 1}
            <span class="legend-item">
              <span class="legend-line" style="background-color: {COSMOS};"></span>
              Residuals
            </span>
          {/if}
          {#if step >= 3}
            <span class="legend-item">
              <span class="legend-line" style="background-color: {VIOLET};"></span>
              Tree f₁(x)
            </span>
          {/if}
        </div>
      </div>
    </div>
  </div>
</section>

<RegularizationFigure />

<style>
  /* Zero-height ruler: its clientWidth is the padded box's content width. */
  .measure {
    width: 100%;
    height: 0;
  }

  svg {
    max-width: 100%;
  }

  .section-container {
    margin-top: 2rem;
    display: flex;
    position: relative;
  }

  .steps-container {
    flex: 1 1 42%;
    z-index: 10;
  }

  .step {
    height: 100vh;
    display: flex;
    place-items: center;
    justify-content: center;
    padding: 0 1rem;
  }

  .step-content {
    font-size: 1.05rem;
    background: #ffffff;
    color: #4a5568;
    border-radius: 6px;
    padding: 1.2rem 1.4rem;
    transition: all 300ms ease;
    text-align: left;
    width: 85%;
    max-width: 440px;
    line-height: 1.5;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .step.active .step-content {
    background: #ffffff;
    color: var(--squid-ink);
    border-left: 5px solid var(--violet);
    box-shadow: 0 8px 24px rgba(124, 90, 237, 0.12);
  }

  .sticky-container {
    flex: 1 1 58%;
    position: sticky;
    top: 10vh;
    height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chart-box {
    width: 100%;
    max-width: 660px;
    background: var(--paper);
    border-radius: 8px;
    padding: 0.8rem;
    border: 1px solid #e2e8f0;
  }

  .axis-label {
    font-size: 11px;
    fill: #718096;
    font-family: var(--font-mono, monospace);
  }

  .axis-title {
    font-size: 12px;
    fill: var(--squid-ink);
    font-weight: 600;
    font-family: var(--font-main);
  }

  .line-label {
    font-size: 12px;
    font-weight: bold;
    font-family: var(--font-mono, monospace);
  }

  .legend-bar {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    padding-top: 0.6rem;
    font-size: 12px;
    font-family: var(--font-main);
    color: var(--squid-ink);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .legend-line {
    width: 16px;
    height: 3px;
    border-radius: 2px;
  }

  @media screen and (max-width: 950px) {
    .section-container {
      flex-direction: column-reverse;
    }

    .steps-container {
      width: 100%;
    }

    .sticky-container {
      position: sticky;
      top: 5vh;
      height: 52vh;
      width: 100%;
      z-index: 5;
    }

    .step {
      height: 90vh;
    }

    .step-content {
      width: 92%;
      font-size: 0.95rem;
    }
  }
</style>
