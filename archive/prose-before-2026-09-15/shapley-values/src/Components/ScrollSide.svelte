<script>
  /*
    The bridge: a prediction, recast as exactly the game from the first half.

    Side-by-side rather than the starter's centre-scroll, because a text card
    floating over the chart covers the thing it is describing. On mobile the
    flex direction reverses so the chart sits above its own caption.

    Every number in the step text is read out of LARGE, which is computed from
    the model in explain.js. Nothing here is typed in by hand.
  */
  import Scrolly from "./Scrolly.svelte";
  import { scaleLinear } from "d3-scale";
  import { FEATURES } from "../datasets.js";
  import { LARGE, krPlain, krSigned } from "../explain.js";
  import { PLAYER_COLORS, MUTED } from "../palette.js";

  const NAMES = FEATURES.map((f) => f.short);
  const x = LARGE.x;

  // The six staircases: running prediction as features are fixed one at a time.
  const PATHS = LARGE.rows.map((row) => ({
    order: row.order,
    marginals: row.marginals,
    values: [LARGE.baseline, ...row.coalitions.map((c) => c.value)],
  }));

  // Two orderings the prose contrasts, picked by name rather than by index so
  // reordering permutations() can never silently point these at other rows.
  const idOf = (a, b, c) => PATHS.findIndex((p) => p.order.join("") === "" + a + b + c);
  const FIRST = idOf(0, 1, 2); // size, then distance, then floor
  const SECOND = idOf(2, 1, 0); // floor, then distance, then size

  let value = 0;
  $: step = typeof value === "number" ? Math.min(3, Math.max(0, value)) : 0;
  $: shown = step === 1 ? [FIRST] : step === 2 ? [FIRST, SECOND] : step >= 3 ? PATHS.map((_, i) => i) : [];
  $: focused = step === 1 ? FIRST : step === 2 ? SECOND : null;

  // ------------------------------------------------------------- layout
  let chartWidth = 320;
  $: narrow = chartWidth < 520;
  $: H = narrow ? 280 : 330;
  $: margin = { top: 18, right: narrow ? 12 : 20, bottom: 40, left: narrow ? 52 : 62 };
  $: plotW = Math.max(150, chartWidth - margin.left - margin.right);

  const allValues = PATHS.flatMap((p) => p.values);
  const lo = Math.min(...allValues);
  const hi = Math.max(...allValues);
  const pad = (hi - lo) * 0.12;

  $: yScale = scaleLinear()
    .domain([lo - pad, hi + pad])
    .range([H - margin.bottom, margin.top]);
  $: xAt = (k) => margin.left + (plotW * k) / 3;

  // A staircase: hold the level across the slot, then jump when the feature is
  // fixed. Reactive, not a plain function: it closes over xAt and yScale, and a
  // plain const would freeze the paths at the width measured on first render.
  $: stairPath = (values) => {
    let d = "M " + xAt(0) + " " + yScale(values[0]);
    for (let k = 1; k < values.length; k++) {
      d += " L " + xAt(k - 1 + 0.45) + " " + yScale(values[k - 1]);
      d += " L " + xAt(k - 1 + 0.55) + " " + yScale(values[k]);
    }
    d += " L " + xAt(3) + " " + yScale(values[3]);
    return d;
  };

  $: steps = [
    "<h1 class='step-title'>The same game, new players</h1>" +
      "<p>A model that prices rentals has just quoted <span class='bold'>" +
      krPlain(LARGE.prediction) + " kr</span> a month for a " + x[0] + " m² flat, " + x[1] +
      " km from the centre, on floor " + x[2] + ". Across the whole market it quotes " +
      krPlain(LARGE.baseline) + " kr on average. So this flat sits " +
      krSigned(LARGE.prediction - LARGE.baseline) + " below the middle — and the question is which of " +
      "its three features that " + krPlain(Math.abs(LARGE.prediction - LARGE.baseline)) + " kr belongs to.</p>" +
      "<p>Make the three features the players. A coalition is a set of features you are allowed " +
      "to look at, and what it is worth is the model's average prediction when those are held at " +
      "this flat's values and the rest are drawn from other listings. Look at nothing: " +
      krPlain(LARGE.baseline) + " kr, the market average. Look at everything: " +
      krPlain(LARGE.prediction) + " kr, this flat's own quote. That is a value function, and it is " +
      "the only ingredient Shapley's formula ever needed.</p>",

    "<h1 class='step-title'>Fix them one at a time</h1>" +
      "<p>Take one ordering. Reveal the size first: telling the model this flat is " + x[0] +
      " m² lifts its average quote from " + krPlain(LARGE.baseline) + " to " +
      krPlain(PATHS[FIRST].values[1]) + " kr, so size is credited " +
      krSigned(PATHS[FIRST].marginals[0]) + ".</p>" +
      "<p>Now add the distance. Knowing it is " + x[1] + " km out drops the quote to " +
      krPlain(PATHS[FIRST].values[2]) + " — a marginal contribution of " +
      krSigned(PATHS[FIRST].marginals[1]) + ". Finally the floor, worth " +
      krSigned(PATHS[FIRST].marginals[2]) + ", and we land exactly on the prediction. " +
      "One ordering, three numbers, and they add up.</p>",

    "<h1 class='step-title'>A different order, different credit</h1>" +
      "<p>Run it backwards — floor, then distance, then size — and the endpoints are unchanged, " +
      "because they have to be: no features is always the market average and all three features " +
      "is always this flat's quote.</p>" +
      "<p>The route between them is not. Distance now costs " +
      krSigned(PATHS[SECOND].marginals[1]) + " instead of " + krSigned(PATHS[FIRST].marginals[1]) +
      ", and size is credited " + krSigned(PATHS[SECOND].marginals[0]) + " rather than " +
      krSigned(PATHS[FIRST].marginals[0]) + ". Nothing has gone wrong. The model's opinion of a " +
      "kilometre genuinely depends on how many square metres are moving, so what distance " +
      "contributes depends on whether size has already been revealed.</p>",

    "<h1 class='step-title'>All six, then average</h1>" +
      "<p>Every ordering is a defensible story and none of them is <em>the</em> story, which is " +
      "the same impasse as three consultants and a fee. Across the six, distance is credited " +
      "anywhere from " + krSigned(LARGE.spread[1].min) + " to " + krSigned(LARGE.spread[1].max) + ".</p>" +
      "<p>So do what Shapley did: average the columns. Size " + krSigned(LARGE.phi[0]) + ", distance " +
      krSigned(LARGE.phi[1]) + ", floor " + krSigned(LARGE.phi[2]) + " — and by efficiency they sum to " +
      krSigned(LARGE.phi.reduce((a, b) => a + b, 0)) + ", the whole gap between this flat and the " +
      "market average, with nothing left over. Those three numbers are the SHAP values for this " +
      "prediction.</p>",
  ];
</script>

<h1 class="body-header">From a fee to a prediction</h1>

<p class="body-text">
  Nothing in the last section mentioned people. It needed a set of players and a
  number for every subset of them, and that is all. So here is a different way to
  produce those two things.
</p>

<p class="body-text">
  A model {@html "<span class='mono'>f</span>"} has made one prediction about one
  case. Call the features the players. For a subset of them, ask: what would the
  model say on average if it knew <em>only</em> these, with everything else looking
  like a listing drawn at random from the market? That is a payoff for every
  coalition — and the Shapley values of that game are what the world calls
  <span class="bold">SHAP values</span>.
</p>

<section class="side-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="measure" bind:clientWidth={chartWidth} />
      <div class="chart-header">
        <span class="chart-title">Model prediction as features are revealed</span>
        <span class="chart-sub">{x[0]} m² · {x[1]} km out · floor {x[2]}</span>
      </div>

      <svg viewBox="0 0 {chartWidth} {H}" width={chartWidth} height={H}>
        {#each yScale.ticks(5) as t}
          <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={yScale(t)} y2={yScale(t)} />
          <text class="tick" x={margin.left - 8} y={yScale(t) + 4} text-anchor="end">
            {(t / 1000).toFixed(0)}k
          </text>
        {/each}

        <!-- the two fixed endpoints -->
        <line class="anchor" x1={margin.left} x2={margin.left + plotW} y1={yScale(LARGE.baseline)} y2={yScale(LARGE.baseline)} />
        <line class="anchor" x1={margin.left} x2={margin.left + plotW} y1={yScale(LARGE.prediction)} y2={yScale(LARGE.prediction)} />
        <text class="anchor-label" x={margin.left + 4} y={yScale(LARGE.baseline) - 6}>
          market average {krPlain(LARGE.baseline)}
        </text>
        <text class="anchor-label" x={margin.left + 4} y={yScale(LARGE.prediction) + 14}>
          this flat {krPlain(LARGE.prediction)}
        </text>

        {#each PATHS as p, i}
          {#if shown.includes(i)}
            <path
              class="stair"
              d={stairPath(p.values)}
              stroke={focused === null ? MUTED : focused === i ? "#232f3e" : MUTED}
              stroke-width={focused === i ? 2.6 : step >= 3 ? 1.4 : 2}
              opacity={focused === null ? 0.5 : focused === i ? 1 : 0.3}
            />
            {#if focused === i}
              {#each p.order as f, k}
                <line
                  class="jump"
                  x1={xAt(k + 0.5)}
                  x2={xAt(k + 0.5)}
                  y1={yScale(p.values[k])}
                  y2={yScale(p.values[k + 1])}
                  stroke={PLAYER_COLORS[f]}
                />
                <circle cx={xAt(k + 0.5)} cy={yScale(p.values[k + 1])} r="4.5" fill={PLAYER_COLORS[f]} stroke="#fff" stroke-width="1.5" />
                <text
                  class="jump-label"
                  x={xAt(k + 0.5) + 7}
                  y={(yScale(p.values[k]) + yScale(p.values[k + 1])) / 2 + 4}
                  fill={PLAYER_COLORS[f]}
                >
                  {NAMES[f]} {krSigned(p.marginals[f])}
                </text>
              {/each}
            {/if}
          {/if}
        {/each}

        {#each ["none", "1 fixed", "2 fixed", "all 3"] as label, k}
          <text class="slot" x={xAt(k)} y={H - margin.bottom + 18} text-anchor="middle">{label}</text>
        {/each}
        <text class="axis-title" x={margin.left + plotW / 2} y={H - 6} text-anchor="middle">
          features revealed to the model
        </text>
      </svg>

      <!-- The averaged answer, in HTML rather than inside the SVG: as chips over
           the plot it covered the staircases and clipped its own text. -->
      <div class="phi-row">
        {#if step >= 3}
          {#each [0, 1, 2] as k}
            <span class="phi-pill" style="background:{PLAYER_COLORS[k]}">
              {NAMES[k]} {krSigned(LARGE.phi[k])}
            </span>
          {/each}
          <span class="phi-sum">
            = {krSigned(LARGE.phi.reduce((a, b) => a + b, 0))}, the whole gap
          </span>
        {:else}
          <span class="phi-hint">One ordering at a time. The average comes last.</span>
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
    font-size: 0.75rem;
    color: #718096;
  }

  .grid {
    stroke: #eef1f5;
  }

  .anchor {
    stroke: #b6bfcc;
    stroke-dasharray: 4 4;
  }

  .anchor-label {
    font-family: var(--font-main);
    font-size: 10.5px;
    fill: #718096;
    /* A white halo: at step 3 six staircases cross these labels. */
    paint-order: stroke fill;
    stroke: #ffffff;
    stroke-width: 4px;
    stroke-linejoin: round;
  }

  .phi-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    min-height: 26px;
    margin-top: 0.2rem;
  }

  .phi-pill {
    font-family: var(--font-main);
    font-size: 0.76rem;
    font-weight: 700;
    color: #ffffff;
    padding: 3px 9px;
    border-radius: 999px;
    white-space: nowrap;
  }

  .phi-sum {
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: var(--squidink);
    font-weight: 700;
  }

  .phi-hint {
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #9aa5b1;
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    fill: #9aa5b1;
  }

  .stair {
    fill: none;
    stroke-linejoin: round;
  }

  .jump {
    stroke-width: 2.5;
  }

  .jump-label {
    font-family: var(--font-main);
    font-size: 11px;
    font-weight: 600;
  }

  .slot {
    font-family: var(--font-main);
    font-size: 10.5px;
    fill: #718096;
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 11.5px;
    font-weight: 600;
    fill: var(--squidink);
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
  }
</style>
