<script>
  /*
    "The subspace arrives. The basis never does."

    One chart across five steps: three quantities against the step count, on a
    log x axis, because everything interesting here happens across four orders
    of magnitude and the punchline is specifically about what happens LONG after
    the loss has stopped moving.

    The three quantities are chosen to separate what the loss can see from what
    it cannot. Distance to the principal subspace goes to machine zero in both
    runs. The angle between the decoder's leading singular vector and the first
    principal direction goes to zero in one of them and, in the other, does not
    move at all - not by a hundredth of a degree, over twenty-two thousand
    further steps.
  */
  import Scrolly from "./Scrolly.svelte";
  import { scaleLog, scaleLinear } from "d3-scale";
  import {
    TRACE_FREE, TRACE_REG, CONFIG, WIDE_PCA, UNREG, REG, SETTLED_STEP,
    FROZEN_ANGLE, ROTATION_STEP, num, deg, int, pct,
  } from "../experiments.js";
  import { PCA, AE, ACCENT, MUTED, FAINT, INK } from "../palette.js";

  let value = 0;
  $: step = typeof value === "number" ? Math.min(4, Math.max(0, value)) : 0;
  $: showReg = step >= 3;

  const LAST = TRACE_FREE.rows[TRACE_FREE.rows.length - 1];
  const first = TRACE_FREE.rows[0].step === 0 ? TRACE_FREE.rows.slice(1) : TRACE_FREE.rows;
  const FREE = first.filter((r) => r.step >= 1);
  const REGR = (TRACE_REG.rows[0].step === 0 ? TRACE_REG.rows.slice(1) : TRACE_REG.rows).filter((r) => r.step >= 1);

  let chartWidth = 320;
  $: CW = Math.max(260, chartWidth);
  $: narrow = CW < 520;
  $: H = narrow ? 330 : 372;
  $: margin = { top: 8, right: narrow ? 10 : 14, bottom: 46, left: narrow ? 46 : 58 };
  $: plotW = Math.max(140, CW - margin.left - margin.right);
  $: plotH = H - margin.top - margin.bottom;

  /*
    Three stacked panels rather than three lines in one box.

    The first draft put loss, subspace distance and angle on a single set of
    axes labelled in degrees, each with its own invisible scale. It looked
    tidier and it was a lie: a reader following the blue curve against the
    degree ticks would have read a subspace distance of 10^-6 as seventy
    degrees. Three quantities in three units get three axes.
  */
  const PANELS = [
    { key: "loss", field: "loss", label: "loss", share: 0.24, kind: "log" },
    { key: "subspace", field: "subspace", label: "distance to the PCA subspace", share: 0.31, kind: "log" },
    // `field` is not the same as `key`: the trace records angle1 and angle2 for
    // the two singular vectors, and this panel draws the first. Reading the row
    // by `key` gave undefined, NaN coordinates, and four console errors a page.
    { key: "angle", field: "angle1", label: "angle from the first principal direction", share: 0.45, kind: "angle" },
  ];
  const GAP = 16;
  $: panelH = PANELS.map((p) => (plotH - GAP * (PANELS.length - 1)) * p.share);
  $: panelTop = PANELS.map((_, i) => margin.top + panelH.slice(0, i).reduce((a, b) => a + b, 0) + GAP * i);

  $: xStep = scaleLog().domain([1, CONFIG.STEPS]).range([margin.left, margin.left + plotW]);
  // Each panel gets its own y scale, built from its own data.
  $: yFor = (i) => {
    const top = panelTop[i] + 11;
    const bot = panelTop[i] + panelH[i];
    if (PANELS[i].kind === "angle") return scaleLinear().domain([0, 92]).range([bot, top]);
    if (PANELS[i].key === "loss") {
      const lo = Math.min(...FREE.map((r) => r.loss));
      const hi = Math.max(...FREE.map((r) => r.loss));
      return scaleLog().domain([lo * 0.96, hi]).range([bot, top]);
    }
    return scaleLog().domain([1e-16, 2]).range([bot, top]);
  };
  // Reactive, not const: every one of these closes over the scales above, which
  // move with the measured width.
  $: pathFor = (i, rows) => {
    const y = yFor(i);
    const field = PANELS[i].field;
    const dom = y.domain();
    return rows
      .map((r, j) => (j ? "L" : "M") + " " + xStep(r.step) + " " + y(Math.max(dom[0], r[field])))
      .join(" ");
  };
  $: ticksFor = (i) => {
    if (PANELS[i].kind === "angle") return [0, 45, 90].map((v) => ({ v, t: v + "°" }));
    if (PANELS[i].key === "loss") {
      const hi = Math.max(...FREE.map((r) => r.loss));
      return [WIDE_PCA.bestError, hi].map((v) => ({ v, t: v.toFixed(v > 5 ? 0 : 2) }));
    }
    return [1e-15, 1e-8, 1].map((v) => ({ v, t: v === 1 ? "1" : "1e" + Math.round(Math.log10(v)) }));
  };

  $: steps = [
    "<h1 class='step-title'>The loss settles early</h1>" +
      "<p>We start with eight measured columns, " + int(CONFIG.n) + " rows, two latent units and plain " +
      "gradient descent. The loss reaches its floor of " + num(WIDE_PCA.bestError, 4) + " by around step " +
      int(SETTLED_STEP) + " and then stops moving. This is what a converged model looks like, and it's " +
      "where most people stop watching.</p>" +
      "<p>The dashed line is the theoretical best, which is the sum of the six eigenvalues that the " +
      "bottleneck had to throw away. There's nothing left to gain.</p>",

    "<h1 class='step-title'>And it has found the right subspace</h1>" +
      "<p>The second line shows the distance between the plane the decoder spans and the plane PCA " +
      "would have chosen, measured in a way that doesn't care which basis either one is written in. It " +
      "falls through 10⁻⁶ and 10⁻¹², and it keeps going until it hits the floor of double precision.</p>" +
      "<p>By any reasonable reading, this model has found the principal subspace exactly.</p>",

    "<h1 class='step-title'>Now look at the basis</h1>" +
      "<p>The third line is the angle between the decoder's leading direction and the first principal " +
      "direction. It wanders while the loss is still falling, arrives at <span class='bold'>" +
      deg(FROZEN_ANGLE, 1) + "</span>, and then stops.</p>" +
      "<p>It isn't slowly converging; it has completely stopped. From step " + int(SETTLED_STEP) +
      " to step " + int(CONFIG.STEPS) + ", it doesn't move by even a hundredth of a degree, because the " +
      "loss is exactly flat in that direction, so gradient descent has nothing to descend. Whatever " +
      "angle the random initialisation happened to produce is the angle you're going to ship.</p>",

    "<h1 class='step-title'>Add a small penalty on the weights</h1>" +
      "<p>Now let's keep the same data, the same steps and everything else, but add an L2 penalty of " +
      CONFIG.L2 + " on the two weight matrices. The subspace is found just as before, and the loss is " +
      "the same to four decimals (" + num(REG[0].loss, 4) + " compared with " + num(UNREG[0].loss, 4) +
      ").</p>" +
      "<p>This time, though, the angle moves. It leaves " + deg(FROZEN_ANGLE, 0) + " somewhere past step " +
      "3,000, <em>after</em> the loss has already flattened, and it's under a degree by step " +
      int(ROTATION_STEP) + ". Watching the loss alone would have told you nothing about this.</p>",

    "<h1 class='step-title'>Which lands it exactly on PCA</h1>" +
      "<p>At convergence, the angle is <span class='bold'>0°</span>: the decoder's leading singular " +
      "vector is the first principal direction, and its second singular vector is the second. The " +
      "encoder has also become the decoder's transpose (the largest disagreement between them is " +
      REG[0].symmetry.toExponential(0) + "), and its two rows are now " + deg(REG[0].encoderRows, 1) +
      " apart.</p>" +
      "<p>Kunin and colleagues proved why this happens in 2019. The penalty shrinks the symmetry group " +
      "from every invertible matrix down to just the rotations, and that's exactly enough structure for " +
      "a singular value decomposition of the decoder to hand back the principal directions. It does " +
      "cost a little accuracy, though. Because the weights are shrunk, the reconstruction is off by " +
      "about " + REG[0].reconGap.toExponential(0) + ", whereas the unregularised one was off by " +
      UNREG[0].reconGap.toExponential(0) + ".</p>",
  ];
</script>

<h1 class="body-header">The subspace arrives, but the basis never does</h1>

<p class="body-text">
  It's worth watching this happen rather than just taking the argument on
  trust, because the timing is the surprising part. Below is one training run on
  {CONFIG.d} measured columns with a two-unit bottleneck, followed out to
  {int(CONFIG.STEPS)} gradient steps. That's far longer than anyone would
  normally train something this small, and as we'll see, there's a reason for
  it.
</p>

<section class="side-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="measure" bind:clientWidth={chartWidth} />
      <div class="chart-header">
        <span class="chart-title">One run, followed too far</span>
        <span class="chart-sub">{showReg ? "with and without an L2 penalty" : "no regularisation"}</span>
      </div>

      <svg viewBox="0 0 {CW} {H}" width={CW} height={H}>
        {#each PANELS as panel, i}
          {#if step >= i}
            <g class="panel">
              <text class="p-label" x={margin.left} y={panelTop[i] + 8}>{panel.label}</text>
              {#each ticksFor(i) as tick}
                <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={yFor(i)(tick.v)} y2={yFor(i)(tick.v)} />
                <text class="tick" x={margin.left - 6} y={yFor(i)(tick.v) + 3.5} text-anchor="end">{tick.t}</text>
              {/each}
              <path
                class="ln"
                d={pathFor(i, FREE)}
                stroke={panel.key === "angle" ? PCA : panel.key === "subspace" ? AE : MUTED}
                stroke-width={panel.key === "loss" ? 1.6 : 2.2}
              />
              {#if panel.key === "angle" && showReg}
                <path class="ln reg" d={pathFor(i, REGR)} stroke={ACCENT} stroke-width="2.2" />
                <text class="ln-label" x={xStep(CONFIG.STEPS)} y={yFor(i)(10)} text-anchor="end" fill={ACCENT}>
                  with L2 → 0°
                </text>
              {/if}
              {#if panel.key === "angle" && step >= 2}
                <text class="ln-label" x={xStep(CONFIG.STEPS)} y={yFor(i)(FROZEN_ANGLE) - 7} text-anchor="end" fill={PCA}>
                  frozen at {deg(FROZEN_ANGLE, 1)}
                </text>
              {/if}
              <line
                class="settled"
                x1={xStep(SETTLED_STEP)}
                x2={xStep(SETTLED_STEP)}
                y1={panelTop[i] + 11}
                y2={panelTop[i] + panelH[i]}
              />
            </g>
          {/if}
        {/each}

        <text class="settled-label" x={xStep(SETTLED_STEP) + 5} y={margin.top + 8}>the loss stops here</text>

        <line
          class="axis"
          x1={margin.left}
          x2={margin.left + plotW}
          y1={margin.top + plotH}
          y2={margin.top + plotH}
        />
        {#each [1, 10, 100, 1000, 10000] as t}
          <text class="tick" x={xStep(t)} y={margin.top + plotH + 16} text-anchor="middle">
            {t >= 1000 ? t / 1000 + "k" : t}
          </text>
        {/each}
        <text class="axis-title" x={margin.left + plotW / 2} y={H - 8} text-anchor="middle">gradient steps</text>
      </svg>

      <div class="foot">
        {#if step === 0}
          <span class="foot-plain">Converged, according to the only number most people look at.</span>
        {:else if step === 1}
          <span class="foot-good">The right subspace, to {FREE[FREE.length - 1].subspace.toExponential(0)}.</span>
        {:else if step === 2}
          <span class="foot-bad">The basis stopped moving at {deg(FROZEN_ANGLE, 3)} and stayed there.</span>
        {:else if step === 3}
          <span class="foot-plain">Same loss and same subspace, but now the angle moves.</span>
        {:else}
          <span class="foot-good">0°: the decoder's singular vectors are the principal directions.</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="steps-container">
    <Scrolly bind:value>
      {#each steps as text, i}
        <div class="step" class:active={step === i}>
          <div class="step-content">{@html text}</div>
        </div>
      {/each}
    </Scrolly>
  </div>
</section>

<style>
  .measure {
    width: 100%;
    height: 0;
  }

  svg {
    max-width: 100%;
    display: block;
  }

  .side-section {
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
    max-width: 620px;
    background: #ffffff;
    border-radius: 10px;
    padding: 1.1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.3rem;
  }

  .chart-title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--squidink);
  }

  .chart-sub {
    font-family: var(--font-mono, monospace);
    font-size: 0.74rem;
    color: #718096;
  }

  .grid {
    stroke: #eef1f5;
  }

  .axis {
    stroke: #b6bfcc;
  }

  .ln {
    fill: none;
    stroke-width: 2.2;
    stroke-linejoin: round;
  }

  .ln.reg {
    stroke-dasharray: 6 3;
  }

  .ln-label {
    font-family: var(--font-main);
    font-size: 10.5px;
    font-weight: 700;
  }

  .settled {
    stroke: #cbd5e0;
    stroke-width: 1.2;
  }

  .p-label {
    font-family: var(--font-main);
    font-size: 10px;
    font-weight: 700;
    fill: #4a5568;
  }

  .settled-label {
    font-family: var(--font-main);
    font-size: 9.5px;
    fill: #9aa5b1;
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    fill: #9aa5b1;
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    font-weight: 600;
    fill: var(--squidink);
  }

  .foot {
    min-height: 20px;
    margin-top: 0.4rem;
    font-family: var(--font-main);
    font-size: 0.77rem;
  }

  .foot-good {
    color: #2f7d32;
    font-weight: 700;
  }

  .foot-bad {
    color: #df2a5d;
    font-weight: 700;
  }

  .foot-plain {
    color: #718096;
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
    padding: 1.1rem 1.3rem;
    max-width: 440px;
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
    .side-section {
      flex-direction: column-reverse;
    }

    .steps-container {
      pointer-events: none;
    }

    .sticky-container {
      top: 4vh;
      min-height: 0;
      height: 56vh;
    }

    .chart-box {
      width: 96%;
      padding: 0.75rem;
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
