<script>
  /*
    Why shrinkage matters — argued on held-out days rather than on the training
    set, because it is a claim about generalization and the training curve says
    the opposite: on data the model was fit to, less shrinkage always wins.

    Two panels. The top one shows one learning rate's training and held-out
    error together, so the moment they separate is visible. The bottom one zooms
    in on the held-out curves alone, where the three rates can actually be
    ranked against each other.
  */
  import Scrolly from "./Scrolly.svelte";
  import katexify from "../katexify";
  import { scaleLinear } from "d3-scale";
  import { energyData, testData } from "../datasets.js";
  import { trainEnsemble, rmseOn } from "../xgboost.js";
  import { INK, SKY, COSMOS, VIOLET, JUNGLE, MUTED } from "../palette.js";

  const nRounds = 120;
  const RATES = [
    { eta: 1.0, label: "η = 1.00", note: "no shrinkage", color: COSMOS },
    { eta: 0.25, label: "η = 0.25", note: "balanced", color: SKY },
    { eta: 0.08, label: "η = 0.08", note: "patient", color: JUNGLE },
  ];

  // Everything quoted in the prose below is read back out of these arrays, so
  // the words cannot drift away from the picture.
  const HIST = RATES.map((r) => {
    const model = trainEnsemble(energyData, {
      nTrees: nRounds,
      learningRate: r.eta,
      lambda: 1.0,
      maxDepth: 1,
    });
    const train = [];
    const test = [];
    for (let i = 0; i <= nRounds; i++) {
      train.push(rmseOn(model, energyData, i));
      test.push(rmseOn(model, testData, i));
    }
    let best = Infinity;
    let bestRound = 0;
    for (let i = 1; i <= nRounds; i++) {
      if (test[i] < best) {
        best = test[i];
        bestRound = i;
      }
    }
    return { ...r, train, test, best, bestRound };
  });

  const ZOOM = [3.2, 5.4];
  const entersZoom = (h) => h.test.findIndex((v, i) => i > 0 && v <= ZOOM[1]);

  let value = 0;
  $: step = typeof value === "number" ? Math.min(3, Math.max(0, value)) : 0;
  $: active = HIST[Math.min(step, 2)];

  // Layout
  let chartWidth = 640;
  $: narrow = chartWidth < 520;
  $: topH = narrow ? 132 : 168;
  $: botH = narrow ? 118 : 150;
  $: margin = { top: 18, right: narrow ? 14 : 56, bottom: 26, left: narrow ? 40 : 50 };

  $: innerWidth = Math.max(180, chartWidth - margin.left - margin.right);

  $: xScale = scaleLinear()
    .domain([0, nRounds])
    .range([margin.left, margin.left + innerWidth]);

  $: yTop = scaleLinear()
    .domain([0, 20])
    .range([topH - margin.bottom, margin.top]);

  $: yBot = scaleLinear()
    .domain(ZOOM)
    .range([botH - margin.bottom, margin.top]);

  function linePath(series, ySc, from = 0) {
    if (!series || !series.length) return "";
    let d = "";
    for (let i = from; i < series.length; i++) {
      d += `${d ? " L" : "M"} ${xScale(i)} ${ySc(series[i])}`;
    }
    return d;
  }

  // Clip so a curve that starts far above the zoom window enters the frame
  // instead of drawing a spike down its left edge.
  function clippedPath(series, ySc, domain) {
    if (!series || !series.length) return "";
    let d = "";
    for (let i = 0; i < series.length; i++) {
      const v = series[i];
      if (v > domain[1] || v < domain[0]) {
        d += "";
        continue;
      }
      d += `${d ? " L" : "M"} ${xScale(i)} ${ySc(v)}`;
    }
    return d;
  }

  const fmt = (v) => v.toFixed(2);

  $: steps = [
    `<h1 class='step-title'>Full steps (η = 1.00)</h1>
     <p>With no shrinkage, each tree tries to erase all of the remaining error, and for a
     while that works beautifully: this is the fastest curve down. But then the two lines
     come apart. Training error keeps falling, all the way to
     <span class='bold'>${fmt(HIST[0].train[nRounds])} kWh</span> by round ${nRounds}, while
     the error on days the model has never seen bottoms out at
     <span class='bold'>${fmt(HIST[0].best)} kWh at round ${HIST[0].bestRound}</span>
     and then starts climbing again.</p>
     <p>That gap is overfitting, and notice that we can <em>only</em> see it because the
     held-out curve is on the chart. If we plotted the training curve alone, this would
     look like steady progress.</p>`,

    `<h1 class='step-title'>Shrinkage (η = 0.25)</h1>
     <p>If we scale each tree down by ${katexify("\\eta = 0.25")}, every round accomplishes
     less, so the descent is slower. At round 10, this curve is still at
     ${fmt(HIST[1].test[10])} kWh, while full steps had already reached ${fmt(HIST[0].test[10])}.</p>
     <p>Even so, it ends up in a better place. Its best held-out error is
     <span class='bold'>${fmt(HIST[1].best)} kWh at round ${HIST[1].bestRound}</span>, compared with
     <span class='bold'>${fmt(HIST[0].best)}</span> for full steps. Each tree leaves some
     signal on the table for the next tree to use, so the ensemble commits to any one
     tree's view of the data more slowly.</p>`,

    `<h1 class='step-title'>Patience (η = 0.08)</h1>
     <p>If we drop ${katexify("\\eta")} to 0.08, the curve doesn't even enter this zoomed
     frame until round ${entersZoom(HIST[2])}. At round ${nRounds}, it's still descending: it
     has reached <span class='bold'>${fmt(HIST[2].test[nRounds])} kWh</span> and hasn't found
     its floor yet, let alone turned upward.</p>
     <p>This is the real trade-off. A smaller ${katexify("\\eta")} buys a lower eventual
     error but needs more trees to get there, and on this budget it hasn't caught up with
     ${katexify("\\eta = 0.25")} yet. That's why nobody picks the number of rounds by hand.
     Instead, you train with a small ${katexify("\\eta")} and stop when a held-out score
     stops improving.</p>`,

    `<h1 class='step-title'>Under the hood: engineering</h1>
     <p>Everything we've covered so far is regularized gradient boosting, but what made
     XGBoost the default choice was its systems engineering:</p>
     <p>1. <span class='bold'>Weighted quantile sketch.</span> Rather than evaluating every
     possible split point, XGBoost proposes a few candidates per feature from an approximate
     quantile summary. The summary is weighted by the second-order Hessians, so it's finer
     where the loss is most sensitive.</p>
     <p>2. <span class='bold'>Sparsity awareness.</span> Missing values aren't imputed.
     Instead, each branch learns a default direction, chosen by whichever side gives more
     gain, and the split scan only visits the non-missing entries.</p>
     <p>3. <span class='bold'>Cache-aware blocks.</span> The data is held in compressed,
     pre-sorted column blocks, so gradient statistics are read in contiguous order instead
     of chasing pointers through a shuffled index.</p>`,
  ];
</script>

<h1 class="body-header">The Art of Pacing: Why Shrinkage Matters</h1>

<p class="body-text">
  Since gradient boosting is gradient descent, it has the same knob: how far to
  step. If we take the full step, each tree wrings everything it can out of the
  current errors. If we take only a fraction of it, we need more trees.
</p>

<p class="body-text">
  The catch is that we can't settle this on the training set. Every tree is fit
  to the training residuals, so on the training set, less shrinkage always looks
  better, right up to the point of memorising the noise. That's why the charts
  below show two curves: the dashed one is the error on the
  {energyData.length} days the model was fit to, and the solid one is the error
  on {testData.length} held-out days it has never seen.
</p>

<section class="center-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="measure" bind:clientWidth={chartWidth} />
      {#if step < 3}
        <div class="chart-header">
          <span class="chart-title">RMSE over {nRounds} boosting rounds</span>
          <div class="legend-row">
            {#each HIST as h, i}
              <span class="legend-item" class:dimmed={step !== i}>
                <span class="swatch" style="background: {h.color};" />
                {h.label}
              </span>
            {/each}
          </div>
        </div>

        <svg width={chartWidth} height={topH + botH + 46}>
          <!-- ---------- panel 1: this rate's train vs held-out ---------- -->
          <g>
            {#each yTop.ticks(4) as t}
              <line
                class="grid"
                x1={margin.left}
                x2={margin.left + innerWidth}
                y1={yTop(t)}
                y2={yTop(t)}
              />
              <text class="axis-label" x={margin.left - 8} y={yTop(t) + 4} text-anchor="end"
                >{t}</text
              >
            {/each}

            <!-- every rate, ghosted, for context -->
            {#each HIST as h}
              {#if h.eta !== active.eta}
                <path d={linePath(h.test, yTop)} fill="none" stroke={MUTED} stroke-width="1.2" opacity="0.4" />
              {/if}
            {/each}

            <path
              d={linePath(active.train, yTop)}
              fill="none"
              stroke={active.color}
              stroke-width="1.8"
              stroke-dasharray="5 4"
              opacity="0.85"
            />
            <path d={linePath(active.test, yTop)} fill="none" stroke={active.color} stroke-width="2.6" />

            {#if !narrow}
              {@const yTr = yTop(active.train[nRounds])}
              {@const yTe = yTop(active.test[nRounds])}
              {@const apart = Math.abs(yTr - yTe) >= 13}
              <text
                class="curve-label"
                x={margin.left + innerWidth + 6}
                y={(apart ? yTr : Math.max(yTr, yTe) + 9) + 4}
                fill={active.color}>train</text
              >
              <text
                class="curve-label"
                x={margin.left + innerWidth + 6}
                y={(apart ? yTe : Math.min(yTr, yTe) - 5) + 4}
                fill={active.color}>held out</text
              >
            {/if}

            <text class="panel-title" x={margin.left} y={12}>
              {active.label} — training (dashed) vs held out (solid)
            </text>
          </g>

          <!-- ---------- panel 2: held-out only, zoomed ---------- -->
          <g transform="translate(0, {topH + 26})">
            <rect
              class="zoom-bg"
              x={margin.left}
              y={margin.top}
              width={innerWidth}
              height={botH - margin.bottom - margin.top}
            />
            {#each yBot.ticks(3) as t}
              <line class="grid" x1={margin.left} x2={margin.left + innerWidth} y1={yBot(t)} y2={yBot(t)} />
              <text class="axis-label" x={margin.left - 8} y={yBot(t) + 4} text-anchor="end">{t}</text>
            {/each}
            {#each xScale.ticks(6) as t}
              <text class="axis-label" x={xScale(t)} y={botH - margin.bottom + 16} text-anchor="middle">{t}</text>
            {/each}

            {#each HIST as h, i}
              <path
                d={clippedPath(h.test, yBot, ZOOM)}
                fill="none"
                stroke={h.color}
                stroke-width={step === i ? 2.8 : 1.6}
                opacity={step === i ? 1 : 0.32}
              />
            {/each}

            {#if active.best >= ZOOM[0] && active.best <= ZOOM[1]}
              <circle class="best-ring" cx={xScale(active.bestRound)} cy={yBot(active.best)} r="6" stroke={active.color} />
              <text
                class="best-label"
                x={xScale(active.bestRound)}
                y={yBot(active.best) - 12}
                text-anchor={active.bestRound > nRounds * 0.75 ? "end" : "middle"}
                fill={active.color}
              >
                best {fmt(active.best)} @ {active.bestRound}
              </text>
            {/if}

            <text class="panel-title" x={margin.left} y={12}>Held-out error, zoomed</text>
            <text
              class="axis-title"
              x={margin.left + innerWidth / 2}
              y={botH - margin.bottom + 34}
              text-anchor="middle">Boosting rounds (trees added)</text
            >
          </g>
        </svg>
        <p class="chart-note">
          Both panels show RMSE in kWh. In the lower panel, the curves drop in from
          above, because everything before round {entersZoom(HIST[0])} is off the
          top of the zoomed view.
        </p>
      {:else}
        <div class="arch-card">
          <h3 class="arch-title">Three systems ideas, not statistical ones</h3>
          <div class="arch-grid">
            <div class="arch-item">
              <h4>Weighted quantile sketch</h4>
              <p>
                Split candidates are approximated with provable error bounds and summarised
                with second-order Hessian weights, so the resolution goes where the loss
                is most sensitive.
              </p>
            </div>
            <div class="arch-item">
              <h4>Sparsity-aware splitting</h4>
              <p>
                Missing entries are never imputed. Instead, each branch learns a default
                direction, and the scan only visits the values that are present.
              </p>
            </div>
            <div class="arch-item">
              <h4>Cache-aware blocks</h4>
              <p>
                Compressed, pre-sorted column blocks keep gradient statistics contiguous in
                memory instead of scattered behind a sorted index.
              </p>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

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
</section>

<style>
  /* Zero-height ruler: its clientWidth is the padded box's content width. */
  .measure {
    width: 100%;
    height: 0;
  }

  svg {
    max-width: 100%;
  }

  .center-section {
    position: relative;
    margin-top: 2rem;
    display: flex;
    align-items: flex-start;
  }

  .steps-container {
    flex: 1 1 38%;
    z-index: 10;
  }

  .sticky-container {
    position: sticky;
    top: 8vh;
    flex: 1 1 62%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
  }

  .chart-box {
    width: 96%;
    max-width: 660px;
    background: #ffffff;
    border-radius: 10px;
    padding: 1.2rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .chart-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--squidink);
    font-family: var(--font-main);
  }

  .legend-row {
    display: flex;
    gap: 0.9rem;
    font-size: 0.8rem;
    color: var(--squidink);
    font-family: var(--font-main);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: opacity 250ms ease;
  }

  .legend-item.dimmed {
    opacity: 0.35;
  }

  .swatch {
    width: 12px;
    height: 3px;
    border-radius: 1px;
  }

  .grid {
    stroke: #e2e8f0;
    stroke-dasharray: 3 3;
  }

  .zoom-bg {
    fill: #f8fafc;
  }

  .axis-label {
    font-size: 11px;
    fill: #718096;
    font-family: var(--font-mono, monospace);
  }

  .axis-title {
    font-size: 12px;
    fill: var(--squidink);
    font-weight: 600;
    font-family: var(--font-main);
  }

  .panel-title {
    font-size: 11px;
    fill: #4a5568;
    font-family: var(--font-main);
    font-weight: 600;
    letter-spacing: 0.4px;
  }

  .curve-label {
    font-size: 10.5px;
    font-family: var(--font-main);
  }

  .best-ring {
    fill: #ffffff;
    stroke-width: 2.5;
  }

  .best-label {
    font-size: 11px;
    font-weight: 700;
    font-family: var(--font-main);
  }

  .chart-note {
    font-size: 0.78rem;
    color: #718096;
    font-family: var(--font-main);
    line-height: 1.45;
    margin: 0.5rem 0 0 0;
  }

  .arch-card {
    padding: 0.5rem;
  }

  .arch-title {
    font-size: 1.15rem;
    color: var(--squidink);
    margin-top: 0;
    margin-bottom: 1rem;
    text-align: center;
    font-family: var(--font-main);
  }

  .arch-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .arch-item {
    background: var(--paper);
    padding: 0.9rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .arch-item h4 {
    margin: 0.3rem 0;
    font-size: 0.95rem;
    color: var(--squidink);
    font-family: var(--font-main);
  }

  .arch-item p {
    font-size: 0.8rem;
    color: #4a5568;
    line-height: 1.45;
    margin: 0;
  }

  .step {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .step-content {
    background: rgba(255, 255, 255, 0.97);
    color: #4a5568;
    border-radius: 8px;
    padding: 1.1rem 1.4rem;
    max-width: 460px;
    width: 88%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    line-height: 1.55;
    transition: all 250ms ease;
  }

  .step.active .step-content {
    color: var(--squidink);
    border-left: 5px solid var(--violet);
    box-shadow: 0 8px 24px rgba(124, 90, 237, 0.15);
  }

  @media screen and (max-width: 950px) {
    .center-section {
      flex-direction: column-reverse;
    }

    .steps-container {
      pointer-events: none;
    }

    .sticky-container {
      top: 4vh;
      min-height: 0;
      height: 54vh;
    }

    .chart-box {
      width: 96%;
      padding: 0.8rem;
    }

    .arch-grid {
      grid-template-columns: 1fr;
      gap: 0.6rem;
    }

    .step {
      height: 110vh;
    }

    .step-content {
      width: 92%;
      max-width: 640px;
      font-size: 0.95rem;
    }
  }
</style>
