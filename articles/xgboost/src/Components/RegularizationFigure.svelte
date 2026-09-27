<script>
  /*
    What the two penalties actually do, on a single tree where you can see every
    number at once.

    lambda sits in the denominator of the leaf weight, so it drags leaf outputs
    toward zero — hardest on leaves holding few points. gamma is a toll on the
    split itself: below it, the split simply does not happen and the tree
    collapses to one leaf.
  */
  import { scaleLinear } from "d3-scale";
  import { smallSample, outlierPoint, BOUNDS, AXIS } from "../datasets.js";
  import {
    calculateBaseScore,
    computeGradients,
    scanCandidateSplits,
    leafWeight,
  } from "../xgboost.js";
  import { INK, SKY, COSMOS, VIOLET, SMILE } from "../palette.js";

  let lambda = 1.0;
  let gamma = 0;
  let withOutlier = false;

  $: points = withOutlier ? [...smallSample, outlierPoint] : smallSample;
  $: baseScore = calculateBaseScore(points);
  $: grads = computeGradients(points, points.map(() => baseScore));
  $: candidates = scanCandidateSplits(grads, lambda, gamma);
  $: best = candidates.length
    ? candidates.reduce((m, c) => (c.gain > m.gain ? c : m), candidates[0])
    : null;
  $: pruned = !best || best.gain <= 0;
  $: leftPts = best ? grads.filter((p) => p.x <= best.splitValue) : [];
  $: rightPts = best ? grads.filter((p) => p.x > best.splitValue) : [];
  $: wLeft = leafWeight(leftPts, lambda);
  $: wRight = leafWeight(rightPts, lambda);
  // What the same leaves would say with no L2 penalty at all.
  $: wLeftRaw = leafWeight(leftPts, 0);
  $: wRightRaw = leafWeight(rightPts, 0);

  let boxWidth = 0;
  $: narrow = boxWidth > 0 && boxWidth < 520;
  $: height = narrow ? 250 : 300;
  $: margin = { top: 18, right: narrow ? 14 : 22, bottom: 44, left: 52 };
  $: width = Math.max(260, boxWidth);

  $: xScale = scaleLinear()
    .domain([BOUNDS.x0, BOUNDS.x1])
    .range([margin.left, width - margin.right]);
  $: yScale = scaleLinear()
    .domain([BOUNDS.y0, BOUNDS.y1])
    .range([height - margin.bottom, margin.top]);

  const fmt1 = (v) => (v >= 0 ? "+" : "") + v.toFixed(1);
</script>

<h1 class="body-header">What λ and γ actually do</h1>

<p class="body-text">
  Both penalties appear in the objective, and both are easiest to understand on a
  single tree rather than on a whole ensemble. Below is the same first stump,
  with the two knobs exposed. There's no shrinkage here and no second round, just
  one split and its two leaves.
</p>

<div class="reg-figure">
  <div class="reg-controls">
    <div class="knob">
      <div class="knob-head">
        <span class="knob-name">L2 on leaf values (λ)</span>
        <span class="knob-val">{lambda.toFixed(1)}</span>
      </div>
      <input type="range" min="0" max="20" step="0.5" bind:value={lambda} />
      <div class="knob-hint">
        {lambda === 0
          ? "No penalty: each leaf is the plain mean residual."
          : `Denominator is |I| + ${lambda.toFixed(1)}, so small leaves shrink most.`}
      </div>
    </div>

    <div class="knob">
      <div class="knob-head">
        <span class="knob-name">Toll per split (γ)</span>
        <span class="knob-val">{gamma}</span>
      </div>
      <input type="range" min="0" max="900" step="25" bind:value={gamma} />
      <div class="knob-hint">
        {pruned
          ? "Nothing clears the toll — the tree is a single leaf."
          : `Best split clears it by ${best.gain.toFixed(0)}.`}
      </div>
    </div>

    <button class="outlier-btn" class:on={withOutlier} on:click={() => (withOutlier = !withOutlier)}>
      {withOutlier ? "Remove the odd day" : "Add one odd day"}
    </button>
  </div>

  <div class="reg-chart" bind:offsetWidth={boxWidth}>
    {#if width > 0}
      <svg {width} {height}>
        {#each yScale.ticks(5) as t}
          <line class="grid" x1={margin.left} x2={width - margin.right} y1={yScale(t)} y2={yScale(t)} />
          <text class="tick" x={margin.left - 8} y={yScale(t) + 4} text-anchor="end">{t}</text>
        {/each}
        {#each xScale.ticks(6) as t}
          <text class="tick" x={xScale(t)} y={height - margin.bottom + 17} text-anchor="middle">{t}</text>
        {/each}

        <!-- baseline -->
        <line
          class="baseline"
          x1={margin.left}
          x2={width - margin.right}
          y1={yScale(baseScore)}
          y2={yScale(baseScore)}
        />
        <text class="baseline-label" x={width - margin.right} y={yScale(baseScore) - 6} text-anchor="end">
          baseline ŷ⁽⁰⁾ = {baseScore.toFixed(1)}
        </text>

        {#if pruned}
          <line
            class="leaf single"
            x1={margin.left}
            x2={width - margin.right}
            y1={yScale(baseScore)}
            y2={yScale(baseScore)}
          />
          <text class="pruned-note" x={(width + margin.left) / 2} y={margin.top + 26} text-anchor="middle">
            no split worth γ = {gamma} — the tree is one leaf
          </text>
        {:else}
          <!-- the split -->
          <line
            class="split"
            x1={xScale(best.splitValue)}
            x2={xScale(best.splitValue)}
            y1={margin.top}
            y2={height - margin.bottom}
          />
          <text class="split-label" x={xScale(best.splitValue) + 6} y={margin.top + 12}>
            {best.splitValue.toFixed(1)}°C
          </text>

          <!-- what the leaves would say with no L2 penalty -->
          <line
            class="leaf raw"
            x1={margin.left}
            x2={xScale(best.splitValue)}
            y1={yScale(baseScore + wLeftRaw)}
            y2={yScale(baseScore + wLeftRaw)}
          />
          <line
            class="leaf raw"
            x1={xScale(best.splitValue)}
            x2={width - margin.right}
            y1={yScale(baseScore + wRightRaw)}
            y2={yScale(baseScore + wRightRaw)}
          />

          <!-- and what they say with the current lambda -->
          <line
            class="leaf"
            x1={margin.left}
            x2={xScale(best.splitValue)}
            y1={yScale(baseScore + wLeft)}
            y2={yScale(baseScore + wLeft)}
          />
          <line
            class="leaf"
            x1={xScale(best.splitValue)}
            x2={width - margin.right}
            y1={yScale(baseScore + wRight)}
            y2={yScale(baseScore + wRight)}
          />
          <text class="leaf-label" x={margin.left + 6} y={yScale(baseScore + wLeft) - 11}>
            w = {fmt1(wLeft)}
          </text>
          <text class="leaf-label" x={width - margin.right - 6} y={yScale(baseScore + wRight) - 11} text-anchor="end">
            w = {fmt1(wRight)}
          </text>
        {/if}

        {#each points as p (p.id)}
          <circle
            class="pt"
            class:odd={p.id === "outlier"}
            cx={xScale(p.x)}
            cy={yScale(p.y)}
            r={p.id === "outlier" ? 7 : 5}
          />
        {/each}

        <line class="axis" x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} />
        <text class="axis-title" x={(width + margin.left) / 2} y={height - 6} text-anchor="middle">{AXIS.x}</text>
        <text class="axis-title" transform="rotate(-90)" x={-(height - margin.bottom + margin.top) / 2} y={13} text-anchor="middle">{AXIS.y}</text>
      </svg>
    {/if}
  </div>

  <div class="reg-readout">
    {#if pruned}
      <p>
        γ is a toll, and nothing here can pay it. At λ =
        <span class="mono">{lambda.toFixed(1)}</span> the best split available buys
        <span class="mono">{(best ? best.gain + gamma : 0).toFixed(0)}</span> of improvement
        and γ is <span class="mono">{gamma}</span>. So no split happens, and the tree
        predicts one constant for every temperature — which is also why raising λ makes
        splits easier to prune: it shrinks every gain on the board.
      </p>
    {:else}
      <p>
        Left leaf holds <span class="mono">{leftPts.length}</span> days, right leaf
        <span class="mono">{rightPts.length}</span>.
        With λ = 0 they would output
        <span class="mono">{fmt1(wLeftRaw)}</span> and <span class="mono">{fmt1(wRightRaw)}</span>
        — the plain mean residual in each. At λ = <span class="mono">{lambda.toFixed(1)}</span>
        they output <span class="mono">{fmt1(wLeft)}</span> and <span class="mono">{fmt1(wRight)}</span>.
        The smaller leaf moves more, because λ is a larger share of
        <span class="mono">|I| + λ</span> when <span class="mono">|I|</span> is small.
      </p>
    {/if}
  </div>
</div>

<p class="body-text">
  That asymmetry is the whole point of an L2 penalty on leaf values. A leaf
  resting on two or three days mostly reports whatever those particular days
  happened to do, while a leaf resting on twenty reports something closer to a
  trend. λ pulls on the first much harder than on the second, without anyone
  having to decide in advance which leaves to trust.
</p>

<p class="body-text">
  Now try adding the odd day. It's a single mild Tuesday with heating-season
  demand, as if someone had an uninsulated greenhouse or left a heat pump
  running. At λ = 0, it drags its leaf noticeably, but as you raise λ, the leaf
  moves back toward the crowd. And if you raise γ far enough, the algorithm
  declines to split at all.
</p>

<style>
  .reg-figure {
    max-width: 720px;
    margin: 1.5rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1.1rem;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  }

  .reg-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
    margin-bottom: 0.9rem;
  }

  .knob {
    flex: 1 1 220px;
    min-width: 180px;
  }

  .knob-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: var(--squidink);
    margin-bottom: 0.25rem;
  }

  .knob-name {
    font-weight: 600;
  }

  .knob-val {
    font-family: var(--font-mono, monospace);
    font-weight: 800;
  }

  .knob input[type="range"] {
    width: 100%;
    accent-color: var(--violet);
  }

  .knob-hint {
    font-size: 0.75rem;
    color: #718096;
    font-family: var(--font-main);
    line-height: 1.35;
    margin-top: 0.2rem;
    min-height: 2.1em;
  }

  .outlier-btn {
    font-family: var(--font-mono, monospace);
    font-size: 0.8rem;
    background: #ffffff;
    border: 2px solid var(--squidink);
    color: var(--squidink);
    padding: 0.4rem 0.7rem;
    cursor: pointer;
    border-radius: 4px;
    align-self: center;
  }

  .outlier-btn:hover {
    background: var(--squidink);
    color: #ffffff;
  }

  .outlier-btn.on {
    background: var(--squidink);
    color: #ffffff;
  }

  .reg-chart {
    width: 100%;
  }

  svg {
    display: block;
    overflow: visible;
  }

  .grid {
    stroke: var(--squidink);
    opacity: 0.07;
  }

  .axis {
    stroke: var(--squidink);
    opacity: 0.5;
    stroke-width: 1.5;
  }

  .tick {
    font-size: 0.75rem;
    fill: var(--squidink);
    opacity: 0.65;
    font-family: var(--font-main);
  }

  .axis-title {
    font-size: 0.75rem;
    fill: var(--squidink);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: var(--font-main);
  }

  .baseline {
    stroke: var(--squidink);
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
    opacity: 0.45;
  }

  .baseline-label {
    font-size: 0.72rem;
    fill: var(--squidink);
    opacity: 0.6;
    font-family: var(--font-main);
  }

  .split {
    stroke: #7c5aed;
    stroke-width: 2;
    stroke-dasharray: 6 4;
  }

  .split-label {
    font-size: 0.78rem;
    fill: #7c5aed;
    font-weight: 700;
    font-family: var(--font-main);
  }

  .leaf {
    stroke: #2074d5;
    stroke-width: 3;
    stroke-linecap: round;
  }

  .leaf.raw {
    stroke: #2074d5;
    stroke-width: 2;
    stroke-dasharray: 3 4;
    opacity: 0.4;
  }

  .leaf.single {
    stroke: #2074d5;
    stroke-width: 3;
  }

  .leaf-label {
    font-size: 0.8rem;
    fill: #2074d5;
    font-weight: 800;
    font-family: var(--font-mono, monospace);
    paint-order: stroke;
    stroke: #ffffff;
    stroke-width: 4px;
    stroke-linejoin: round;
  }

  .baseline-label,
  .split-label {
    paint-order: stroke;
    stroke: #ffffff;
    stroke-width: 4px;
    stroke-linejoin: round;
  }

  .pruned-note {
    font-size: 0.85rem;
    fill: #df2a5d;
    font-weight: 700;
    font-family: var(--font-main);
  }

  .pt {
    fill: var(--squidink);
    stroke: #ffffff;
    stroke-width: 1.5;
  }

  .pt.odd {
    fill: #df2a5d;
    stroke-width: 2;
  }

  .reg-readout {
    font-family: var(--font-main);
    font-size: 0.88rem;
    line-height: 1.55;
    color: #4a5568;
    border-top: 1px solid #e2e8f0;
    margin-top: 0.7rem;
    padding-top: 0.7rem;
  }

  .reg-readout p {
    margin: 0;
  }

  .mono {
    font-family: var(--font-mono, monospace);
    font-weight: 800;
    color: var(--squidink);
  }

  @media screen and (max-width: 950px) {
    .reg-figure {
      max-width: 92%;
      padding: 0.8rem;
    }
  }
</style>
