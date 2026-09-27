<script>
  /*
    The mechanism, one cut at a time, on a sample small enough that every
    point stays visible.
  */
  import Scrolly from "./Scrolly.svelte";
  import CutChart from "./CutChart.svelte";
  import { smallSample, BOUNDS, mulberry32 } from "../datasets.js";
  import { isolationPath, makeStream } from "../isolation.js";
  import { SERIES, PROBE } from "../palette.js";

  // One fixed tree, chosen so the two paths it produces are easy to compare.
  const stream = makeStream(mulberry32(22), 64);

  const outlier = smallSample.find((p) => p.kind === "anomaly" && p.x > 40000);
  const crowd = smallSample
    .filter((p) => p.x < 4000)
    .sort(
      (a, b) =>
        (a.x - 1600) ** 2 / 1e6 +
        (a.y - 9) ** 2 -
        ((b.x - 1600) ** 2 / 1e6 + (b.y - 9) ** 2)
    )[0];

  const pathOutlier = isolationPath(outlier, smallSample, BOUNDS, stream);
  const pathCrowd = isolationPath(crowd, smallSample, BOUNDS, stream);

  const regionAfter = (path, n) => {
    if (n <= 0) return null;
    const taken = path.cuts.slice(0, n);
    if (n >= path.cuts.length) return path.region;
    const last = taken[taken.length - 1];
    const r = { ...last.region };
    const probe = path === pathOutlier ? outlier : crowd;
    const key = last.dim === 0 ? "x" : "y";
    const below = probe[key] < last.value;
    if (last.dim === 0) {
      if (below) r.x1 = last.value;
      else r.x0 = last.value;
    } else if (below) r.y1 = last.value;
    else r.y0 = last.value;
    return r;
  };

  const views = [
    { probe: null, path: pathOutlier, n: 0 },
    { probe: outlier, path: pathOutlier, n: 0 },
    { probe: outlier, path: pathOutlier, n: 1 },
    { probe: outlier, path: pathOutlier, n: 2 },
    { probe: outlier, path: pathOutlier, n: pathOutlier.cuts.length },
    { probe: crowd, path: pathCrowd, n: pathCrowd.cuts.length },
  ];

  let value;
  $: view = views[Math.min(views.length - 1, value || 0)];
  $: cuts = view.path.cuts.slice(0, view.n);
  $: region = regionAfter(view.path, view.n);

  const steps = [
    `<h1 class='step-title'>Thirty-three accounts</h1>
     <p>The same picture as before, thinned out so nothing hides behind anything else.
     Two ordinary habits and two accounts that belong to neither. Watch the right-hand
     panel as you scroll.</p>`,
    `<h1 class='step-title'>Pick one to look at</h1>
     <p>Take the account out on its own at the far right: large transfers, almost never.
     We are going to find out how much work it takes to separate it from everything else.</p>`,
    `<h1 class='step-title'>One cut</h1>
     <p>Choose a feature at random. Choose a split value uniformly between the smallest and
     largest value that feature takes in the box. Cut. That is the entire rule — there is no
     score to maximise, no impurity to reduce, nothing being fit.</p>`,
    `<h1 class='step-title'>Cut again</h1>
     <p>Throw away the half our account did not land in and repeat inside the half it did.
     The box shrinks. Notice that most of the other accounts left the picture immediately:
     a point sitting on its own in empty space gets separated from the crowd early, by
     almost any cut you draw.</p>`,
    `<h1 class='step-title'>Alone after three</h1>
     <p>Three cuts and nothing else is left in the box. Three is this account's
     <span class='bold'>path length</span> in this tree. It is short because the account was
     easy to isolate, and it was easy to isolate because there was nothing nearby.</p>`,
    `<h1 class='step-title'>Now one from the crowd</h1>
     <p>Same tree, same rules, a different starting point: an account in the middle of the
     busiest habit. It takes <span class='bold'>nine</span> cuts to get it on its own. Every
     early cut that isolated the odd account instantly just splits the crowd roughly in half,
     and the crowd has to be halved again and again.</p>`,
  ];
</script>

<h1 class="body-header">How a tree isolates a point</h1>
<p class="body-text">
  An isolation tree does something almost aggressively simple. It picks a
  feature at random, picks a split point at random between the smallest and
  largest value that feature takes, and cuts. Then it does the same thing again
  inside one of the halves. It never looks at where the other points are beyond
  those two numbers, and it never looks at a label.
</p>

<section>
  <div class="section-container">
    <div class="steps-container">
      <Scrolly bind:value>
        {#each steps as text, i}
          <div class="step" class:active={value === i}>
            <div class="step-content">{@html text}</div>
          </div>
        {/each}
        <div class="spacer" />
      </Scrolly>
    </div>
    <div class="charts-container">
      <div class="chart-legend">
        <span class="legend-item"
          ><span class="swatch" style="background: {SERIES.normal}" />ordinary</span
        >
        <span class="legend-item"
          ><span class="swatch" style="background: {SERIES.anomaly}" />planted oddity</span
        >
        <span class="legend-item"
          ><span class="swatch probe-swatch" style="background: {PROBE}" />the one we're
          isolating</span
        >
      </div>
      <div class="chart-body">
        <CutChart points={smallSample} probe={view.probe} {cuts} {region} />
      </div>
      <div class="chart-caption">
        {#if view.probe}
          <span class="count">{view.n}</span>
          {view.n === 1 ? "cut" : "cuts"} so far ·
          {view.path.cuts.length - view.n === 0
            ? "isolated"
            : `${view.path.cuts.length - view.n} to go`}
        {:else}
          The data, before any cutting
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .spacer {
    height: 40vh;
  }

  .charts-container {
    position: sticky;
    top: 8%;
    display: flex;
    flex-direction: column;
    width: 50%;
    height: 82vh;
  }

  .chart-body {
    flex: 1 1 auto;
    min-height: 0;
  }

  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.9rem;
    justify-content: center;
    font-size: 0.8rem;
    font-family: var(--font-main);
    color: var(--squidink);
    padding-bottom: 0.4rem;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
  }

  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 0.35rem;
  }

  .probe-swatch {
    border: 2px solid var(--squidink);
    width: 12px;
    height: 12px;
  }

  .chart-caption {
    text-align: center;
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: var(--squidink);
    opacity: 0.8;
    padding-top: 0.3rem;
  }

  .count {
    font-family: var(--font-heavy);
    font-size: 1.1rem;
    opacity: 1;
  }

  .section-container {
    margin-top: 1em;
    text-align: center;
    transition: background 100ms;
    display: flex;
  }

  .step {
    height: 110vh;
    display: flex;
    place-items: center;
    justify-content: center;
  }

  .step-content {
    font-size: 18px;
    background: var(--bg);
    color: #ccc;
    border-radius: 1px;
    padding: 0.5rem 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 500ms ease;
    text-align: left;
    width: 75%;
    margin: auto;
    max-width: 500px;
    font-family: var(--font-main);
    line-height: 1.4;
    border: 5px solid var(--default);
  }

  .step.active .step-content {
    background: #f1f3f3ee;
    color: var(--squidink);
  }

  .steps-container {
    height: 100%;
    flex: 1 1 40%;
    z-index: 10;
  }

  @media screen and (max-width: 950px) {
    .section-container {
      flex-direction: column-reverse;
    }

    .steps-container {
      pointer-events: none;
    }

    .charts-container {
      top: 6%;
      width: 95%;
      margin: auto;
      height: 62vh;
    }

    .step {
      height: 130vh;
    }

    .step-content {
      width: 95%;
      max-width: 768px;
      font-size: 17px;
      line-height: 1.6;
    }

    .spacer {
      height: 100vh;
    }
  }
</style>
