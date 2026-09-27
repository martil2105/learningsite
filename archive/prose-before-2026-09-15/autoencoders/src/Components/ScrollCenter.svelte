<script>
  /*
    "Where the line runs out."

    Three steps on one dataset that no line can follow. The point of the section
    is not that nonlinear autoencoders are better - they obviously fit this
    better - but that the property the whole article has been about, having a
    subspace at all, is the thing you give up to get it.
  */
  import Scrolly from "./Scrolly.svelte";
  import { ARC_DATA, ARC_EXT, ARC_RESULT, ARC_GAIN, ARC_LINE, ARC_LINEAR_RECON, num, times, deg } from "../experiments.js";
  import { fitEqual, clipRayThroughOrigin } from "../plot.js";
  import { PCA, AE, NONLIN, ACCENT, MUTED, FAINT, INK } from "../palette.js";

  let value = 0;
  $: step = typeof value === "number" ? Math.min(2, Math.max(0, value)) : 0;

  let boxWidth = 320;
  $: BW = Math.max(260, boxWidth);
  $: narrow = BW < 520;
  $: H = narrow ? Math.round(BW * 0.78) : 330;
  $: p = fitEqual(ARC_EXT, BW, H, { top: 10, right: 10, bottom: 10, left: 10 });
  $: r = narrow ? 2.1 : 2.6;

  $: lineEnds = clipRayThroughOrigin(ARC_LINE, ARC_EXT);
  $: curvePath = ARC_RESULT.curve
    .map((q, i) => (i ? "L" : "M") + " " + p.X(q[0]).toFixed(1) + " " + p.Y(q[1]).toFixed(1))
    .join(" ");

  const steps = [
    "<h1 class='step-title'>A line cannot follow a curve</h1>" +
      "<p>These " + ARC_DATA.length + " points sit on an arc. There is one degree of freedom in them — " +
      "position along the curve — so a one-unit bottleneck ought to be enough, and it is not.</p>" +
      "<p>The linear autoencoder settles at <span class='bold'>" + num(ARC_RESULT.linearLoss, 3) +
      "</span>, which is the second eigenvalue to three decimals, which is to say it found exactly the " +
      "line PCA would have drawn and could do nothing else. The reconstructions all lie on it, and the " +
      "two ends of the arc get folded on top of the middle.</p>",

    "<h1 class='step-title'>Put a nonlinearity in and it follows</h1>" +
      "<p>The same one-unit bottleneck with two tanh layers either side of it — " + ARC_RESULT.hidden +
      " hidden units, nothing exotic — reaches <span class='bold'>" + num(ARC_RESULT.nonlinearLoss, 4) +
      "</span>. That is " + times(ARC_GAIN) + " less error, and the curve it draws is the arc.</p>" +
      "<p>The code has become position along that curve. This is what people mean when they say an " +
      "autoencoder generalises PCA: not a bigger subspace, but no longer a subspace.</p>",

    "<h1 class='step-title'>And that is precisely what you gave up</h1>" +
      "<p>Everything the first half of this article complained about was a complaint about the " +
      "<em>basis</em> of a subspace. There is no subspace here. There is a curve, whose parameterisation " +
      "is arbitrary in a far larger way than a matrix " +
      "<span class='mono'>A</span> was — any smooth invertible relabelling of the code leaves the " +
      "reconstruction untouched.</p>" +
      "<p>The other loss is quieter. Baldi and Hornik's theorem — that every critical point is either the " +
      "global optimum or a saddle — is a theorem about the linear case. Put the tanh layers in and it " +
      "stops applying: this fit is one of many, it depends on the seed, and there is no longer any " +
      "guarantee that the thing you trained is the best thing available.</p>",
  ];
</script>

<h1 class="body-header">Where the line runs out</h1>

<p class="body-text">
  All of the above is about the linear case, and the obvious objection is that
  nobody uses linear autoencoders — the point of the architecture is the
  activation functions. That is fair, and it is worth being exact about what
  changes and what is traded for it.
</p>

<section class="side-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="measure" bind:clientWidth={boxWidth} />
      <div class="chart-header">
        <span class="chart-title">{ARC_DATA.length} points on an arc, one latent unit</span>
        <span class="chart-sub">
          {step === 0 ? "linear · " + num(ARC_RESULT.linearLoss, 3) : "nonlinear · " + num(ARC_RESULT.nonlinearLoss, 4)}
        </span>
      </div>

      <svg viewBox="0 0 {BW} {H}" width={BW} height={H}>
        <rect x={p.box.x} y={p.box.y} width={p.box.w} height={p.box.h} fill="#fbfcfd" stroke={FAINT} />

        {#if step === 0}
          <line class="fit-line" x1={p.X(lineEnds[0][0])} y1={p.Y(lineEnds[0][1])} x2={p.X(lineEnds[1][0])} y2={p.Y(lineEnds[1][1])} />
          {#each ARC_DATA as x, i}
            <line class="resid" x1={p.X(x[0])} y1={p.Y(x[1])} x2={p.X(ARC_LINEAR_RECON[i][0])} y2={p.Y(ARC_LINEAR_RECON[i][1])} />
          {/each}
        {:else}
          <path class="fit-curve" d={curvePath} />
          {#each ARC_DATA as x, i}
            <line class="resid" x1={p.X(x[0])} y1={p.Y(x[1])} x2={p.X(ARC_RESULT.recon[i][0])} y2={p.Y(ARC_RESULT.recon[i][1])} />
          {/each}
        {/if}

        {#each ARC_DATA as x}
          <circle cx={p.X(x[0])} cy={p.Y(x[1])} {r} fill={INK} fill-opacity="0.5" />
        {/each}
        {#if step === 0}
          {#each ARC_LINEAR_RECON as q}
            <circle cx={p.X(q[0])} cy={p.Y(q[1])} r={r * 0.85} fill="none" stroke={AE} stroke-width="1.2" />
          {/each}
        {:else}
          {#each ARC_RESULT.recon as q}
            <circle cx={p.X(q[0])} cy={p.Y(q[1])} r={r * 0.85} fill="none" stroke={NONLIN} stroke-width="1.2" />
          {/each}
        {/if}
      </svg>

      <div class="foot">
        {#if step === 0}
          <span class="foot-bad">
            {num(ARC_RESULT.linearLoss, 3)} — and the second eigenvalue is {num(ARC_RESULT.eigenvalues[1], 3)}.
          </span>
        {:else if step === 1}
          <span class="foot-good">{num(ARC_RESULT.nonlinearLoss, 4)} — {times(ARC_GAIN)} less error.</span>
        {:else}
          <span class="foot-plain">A curve, not a subspace — and no theorem left about the optimum.</span>
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
    margin-bottom: 0.4rem;
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

  .fit-line {
    stroke: #2074d5;
    stroke-width: 2;
    opacity: 0.75;
  }

  .fit-curve {
    fill: none;
    stroke: #2f7d32;
    stroke-width: 2.4;
    opacity: 0.85;
  }

  .resid {
    stroke: #9aa5b1;
    stroke-width: 0.9;
    opacity: 0.55;
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
