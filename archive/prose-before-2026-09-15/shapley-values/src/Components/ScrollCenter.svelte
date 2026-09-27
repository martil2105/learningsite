<script>
  /*
    What it costs, and the two ways out.

    Same side-by-side layout as the bridge section rather than the starter's
    overlay. Panels 0 and 1 are charts; 2 and 3 are cards, because "how TreeSHAP
    works" is a claim about algorithms and drawing it as a fake chart would be
    decoration pretending to be evidence.
  */
  import Scrolly from "./Scrolly.svelte";
  import katexify from "../katexify";
  import { scaleLinear, scaleLog } from "d3-scale";
  import { BLOWUP, CONVERGENCE, BUDGETS, bigNumber, BIG_SCALE } from "../sampling.js";
  import { BIG_N } from "../bigGame.js";
  import { INK, MUTED, PLAYER_COLORS, ACCENT } from "../palette.js";

  const ORDER_C = PLAYER_COLORS[1];
  const COAL_C = PLAYER_COLORS[0];

  const at = (n) => BLOWUP.find((b) => b.n === n);
  const MARKS = [3, 10, 20];

  let value = 0;
  $: step = typeof value === "number" ? Math.min(3, Math.max(0, value)) : 0;

  let chartWidth = 320;
  $: narrow = chartWidth < 520;
  $: H = narrow ? 250 : 300;
  $: margin = { top: 20, right: narrow ? 14 : 24, bottom: 42, left: narrow ? 44 : 54 };
  $: plotW = Math.max(140, chartWidth - margin.left - margin.right);
  $: plotH = H - margin.top - margin.bottom;

  // panel 0: how many things there are to enumerate
  $: xN = scaleLinear().domain([2, 24]).range([margin.left, margin.left + plotW]);
  $: yLog = scaleLinear().domain([0, 24]).range([margin.top + plotH, margin.top]);
  const line = (points, xs, ys) =>
    points.map((p, i) => (i ? "L" : "M") + " " + xs(p) + " " + ys(p) + " ").join("");

  // panel 1: what sampling buys
  $: xM = scaleLog().domain([3.4, 620]).range([margin.left, margin.left + plotW]);
  $: yErr = scaleLog()
    .domain([0.3, 9])
    .range([margin.top + plotH, margin.top]);
  // A 1/sqrt(m) reference anchored on the first measured point.
  $: refAt = (m) => CONVERGENCE[0].median * Math.sqrt(CONVERGENCE[0].m / m);

  $: steps = [
    "<h1 class='step-title'>Six orderings, and then trouble</h1>" +
      "<p>Three players make six orderings, so the table earlier could just show all of them. " +
      "Ten players make " + bigNumber(at(10).logOrderings) + ". Twenty make " +
      bigNumber(at(20).logOrderings) + ", which is not a number of anything you are going to " +
      "enumerate.</p>" +
      "<p>Collapsing to coalitions helps enormously — " + katexify("2^n") + " instead of " +
      katexify("n!") + " — and for twenty features that is the difference between " +
      bigNumber(at(20).logCoalitions) + " subsets and " + bigNumber(at(20).logOrderings) +
      " orderings. It is still exponential. A model with forty features has more coalitions than " +
      "a modern CPU has clock cycles in a month, and forty features is a small model.</p>",

    "<h1 class='step-title'>Sample the orderings</h1>" +
      "<p>The definition is an average, and averages can be estimated. Draw orderings at random, " +
      "take the marginal contribution in each, and stop when the answer is precise enough. This is " +
      "the idea behind the sampling estimators, KernelSHAP among them.</p>" +
      "<p>Here it is on an eight-player game where the exact answer is known. Sixteen sampled " +
      "orderings put the worst-estimated player within " + CONVERGENCE[2].pct.toFixed(1) +
      "% of its true value; " + CONVERGENCE[7].m + " gets that to " +
      CONVERGENCE[7].pct.toFixed(1) + "%. The error tracks " + katexify("1/\\sqrt{m}") +
      " — the grey line — which is the usual bad news about Monte Carlo: to halve your error, " +
      "quadruple your budget.</p>" +
      "<p>The consolation is that this is an <em>estimate</em>, so it comes with a standard error. " +
      "An attribution you can put a confidence interval on is worth more than one you cannot.</p>",

    "<h1 class='step-title'>Or exploit the model</h1>" +
      "<p>Sampling treats the model as a black box. If you know it is a tree ensemble, you can do " +
      "far better — and this is where the fourth axiom finally earns its place.</p>" +
      "<p>Additivity says the Shapley values of a sum of games are the sum of their Shapley values. " +
      "An ensemble's prediction is a sum over trees, so you can attribute each tree separately and " +
      "add. And a single tree is a much easier object: it only depends on the features that appear " +
      "on its paths, and the paths can be walked once, keeping track of every subset at the same " +
      "time. That is TreeSHAP, and it turns an exponential problem into a polynomial one — " +
      katexify("O(TLD^2)") + " for " + katexify("T") + " trees of " + katexify("L") +
      " leaves and depth " + katexify("D") + ", exactly, with no sampling error at all.</p>",

    "<h1 class='step-title'>The baseline is a choice</h1>" +
      "<p>One thing no formula will decide for you: what <em>absent</em> means. Every number in " +
      "this article is measured against the average prediction over a background sample, and " +
      "changing that sample changes every attribution in the explanation.</p>" +
      "<p>Explaining a rejected loan against all applicants, against approved applicants, or " +
      "against that one customer's own history gives three different and individually correct " +
      "sets of numbers, answering three different questions. The reference population is part of " +
      "the explanation, and an explanation that does not state it has not really said anything.</p>",
  ];
</script>

<h1 class="body-header">What it costs</h1>

<p class="body-text">
  Everything so far has been an existence argument. There is a unique fair
  attribution and here is what it looks like. Whether you can actually compute it
  is a separate question, and for a while the honest answer was no.
</p>

<section class="cost-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="measure" bind:clientWidth={chartWidth} />

      {#if step === 0}
        <div class="chart-header">
          <span class="chart-title">How much there is to enumerate</span>
          <span class="legend">
            <span class="legend-item"><span class="sw" style="background:{ORDER_C}" />orderings, n!</span>
            <span class="legend-item"><span class="sw" style="background:{COAL_C}" />coalitions, 2ⁿ</span>
          </span>
        </div>
        <svg viewBox="0 0 {chartWidth} {H}" width={chartWidth} height={H}>
          {#each [0, 4, 8, 12, 16, 20, 24] as t}
            <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={yLog(t)} y2={yLog(t)} />
            <text class="tick" x={margin.left - 8} y={yLog(t) + 4} text-anchor="end">
              {t === 0 ? "1" : "10" + "^" + t}
            </text>
          {/each}
          <path class="curve" d={line(BLOWUP, (p) => xN(p.n), (p) => yLog(p.logCoalitions))} stroke={COAL_C} />
          <path class="curve" d={line(BLOWUP, (p) => xN(p.n), (p) => yLog(p.logOrderings))} stroke={ORDER_C} />
          {#each MARKS as n}
            {@const row = at(n)}
            <line class="mark" x1={xN(n)} x2={xN(n)} y1={yLog(0)} y2={yLog(row.logOrderings)} />
            <circle cx={xN(n)} cy={yLog(row.logOrderings)} r="4" fill={ORDER_C} stroke="#fff" stroke-width="1.5" />
            <circle cx={xN(n)} cy={yLog(row.logCoalitions)} r="4" fill={COAL_C} stroke="#fff" stroke-width="1.5" />
            <text
              class="mark-label"
              x={xN(n) + (n === 20 ? -6 : 7)}
              y={yLog(row.logOrderings) - 8}
              text-anchor={n === 20 ? "end" : "start"}
              fill={ORDER_C}>{bigNumber(row.logOrderings)}</text
            >
          {/each}
          {#each [2, 6, 10, 14, 18, 22] as n}
            <text class="tick" x={xN(n)} y={H - margin.bottom + 17} text-anchor="middle">{n}</text>
          {/each}
          <text class="axis-title" x={margin.left + plotW / 2} y={H - 8} text-anchor="middle">
            number of features
          </text>
        </svg>
        <p class="note">Log scale. Both curves are straight-ish lines here; only one of them is survivable.</p>

      {:else if step === 1}
        <div class="chart-header">
          <span class="chart-title">Sampling error on an {BIG_N}-player game</span>
          <span class="chart-sub">median of 9 seeds</span>
        </div>
        <svg viewBox="0 0 {chartWidth} {H}" width={chartWidth} height={H}>
          {#each [0.5, 1, 2, 4, 8] as t}
            <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={yErr(t)} y2={yErr(t)} />
            <text class="tick" x={margin.left - 8} y={yErr(t) + 4} text-anchor="end">{t}</text>
          {/each}
          <path
            class="curve ref"
            d={line(BUDGETS, (m) => xM(m), (m) => yErr(Math.min(9, Math.max(0.3, refAt(m)))))}
            stroke={MUTED}
          />
          <text class="ref-label" x={xM(BUDGETS[5])} y={yErr(refAt(BUDGETS[5])) - 9} fill={MUTED}>1/√m</text>
          <path class="curve" d={line(CONVERGENCE, (c) => xM(c.m), (c) => yErr(c.median))} stroke={ORDER_C} />
          {#each CONVERGENCE as c}
            <circle cx={xM(c.m)} cy={yErr(c.median)} r="4" fill={ORDER_C} stroke="#fff" stroke-width="1.5" />
          {/each}
          {#each [CONVERGENCE[2], CONVERGENCE[7]] as c}
            <text class="mark-label" x={xM(c.m)} y={yErr(c.median) - 10} text-anchor="middle" fill={ORDER_C}>
              {c.pct.toFixed(1)}%
            </text>
          {/each}
          {#each BUDGETS as m}
            <text class="tick" x={xM(m)} y={H - margin.bottom + 17} text-anchor="middle">{m}</text>
          {/each}
          <text class="axis-title" x={margin.left + plotW / 2} y={H - 8} text-anchor="middle">
            sampled orderings
          </text>
        </svg>
        <p class="note">
          Worst absolute error across the eight players, against the exact answer. Both axes are log.
        </p>

      {:else if step === 2}
        <div class="card">
          <h3>Two routes to a number</h3>
          <div class="route">
            <h4>Model-agnostic sampling</h4>
            <p>
              Works on anything you can call. Costs a chosen number of model evaluations, returns
              an estimate with a standard error, and slows down linearly in the precision you want
              squared.
            </p>
          </div>
          <div class="route">
            <h4>TreeSHAP</h4>
            <p>
              Only for tree ensembles. Exact, polynomial, and fast enough to explain a whole
              dataset rather than one row — which is what makes summary plots over thousands of
              predictions possible in the first place.
            </p>
          </div>
          <p class="card-foot">
            Both compute the same quantity. They differ in what they assume and what they charge.
          </p>
        </div>

      {:else}
        <div class="card">
          <h3>Same prediction, three explanations</h3>
          <table class="baseline-table">
            <thead>
              <tr><th>Background</th><th>The question it answers</th></tr>
            </thead>
            <tbody>
              <tr><td>all applicants</td><td>why is this different from a typical case?</td></tr>
              <tr><td>approved applicants</td><td>why did this one fail where those succeeded?</td></tr>
              <tr><td>this customer, last year</td><td>what changed?</td></tr>
            </tbody>
          </table>
          <p class="card-foot">
            All three are correct Shapley values. None of them is "the" explanation, and the
            formula has no opinion about which you meant.
          </p>
        </div>
      {/if}
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
  }

  .cost-section {
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

  .legend {
    display: flex;
    gap: 0.8rem;
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #4a5568;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .sw {
    width: 13px;
    height: 3px;
    border-radius: 1px;
    display: inline-block;
  }

  .grid {
    stroke: #eef1f5;
  }

  .curve {
    fill: none;
    stroke-width: 2.4;
    stroke-linejoin: round;
  }

  .curve.ref {
    stroke-width: 1.6;
    stroke-dasharray: 5 4;
  }

  .ref-label {
    font-family: var(--font-mono, monospace);
    font-size: 10.5px;
  }

  .mark {
    stroke: #dde3ea;
    stroke-dasharray: 2 3;
  }

  .mark-label {
    font-family: var(--font-main);
    font-size: 11px;
    font-weight: 700;
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    fill: #9aa5b1;
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 11.5px;
    font-weight: 600;
    fill: var(--squidink);
  }

  .note {
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #718096;
    line-height: 1.45;
    margin: 0.5rem 0 0 0;
  }

  .card h3 {
    font-family: var(--font-main);
    font-size: 1.05rem;
    color: var(--squidink);
    margin: 0.2rem 0 0.9rem 0;
    text-align: center;
  }

  .route {
    background: var(--paper);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.75rem 0.9rem;
  }

  .route + .route {
    margin-top: 0.6rem;
  }

  .route h4 {
    margin: 0 0 0.3rem 0;
    font-family: var(--font-main);
    font-size: 0.92rem;
    color: var(--squidink);
  }

  .route p {
    margin: 0;
    font-family: var(--font-main);
    font-size: 0.82rem;
    line-height: 1.5;
    color: #4a5568;
  }

  .card-foot {
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #718096;
    line-height: 1.5;
    margin: 0.75rem 0 0 0;
    font-style: italic;
  }

  .baseline-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-main);
    font-size: 0.83rem;
  }

  .baseline-table th {
    text-align: left;
    font-size: 0.75rem;
    letter-spacing: 0.3px;
    color: #718096;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 0.5rem 6px 0;
  }

  .baseline-table td {
    padding: 8px 0.5rem 8px 0;
    border-bottom: 1px solid #f0f3f7;
    color: #4a5568;
    vertical-align: top;
  }

  .baseline-table td:first-child {
    font-weight: 700;
    color: var(--squidink);
    white-space: nowrap;
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
    .cost-section {
      flex-direction: column-reverse;
    }

    .steps-container {
      pointer-events: none;
    }

    .sticky-container {
      top: 4vh;
      min-height: 0;
      height: 52vh;
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

    .baseline-table {
      font-size: 0.78rem;
    }
  }
</style>
