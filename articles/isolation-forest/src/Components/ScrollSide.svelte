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
     <p>Here's a smaller version of our data, thinned out so that nothing hides behind
     anything else. It has two ordinary habits and two accounts that belong to neither.
     Keep an eye on the chart as you scroll.</p>`,
    `<h1 class='step-title'>Pick one to look at</h1>
     <p>Let's focus on the account sitting on its own at the far right, which makes large
     transfers but almost never. We're going to find out how much work it takes to separate
     it from everything else.</p>`,
    `<h1 class='step-title'>One cut</h1>
     <p>First, we choose a feature at random. Then we choose a split value uniformly between
     the smallest and largest values that feature takes inside the box, and we cut there.
     That's the entire rule. There's no score to maximise, no impurity to reduce, and nothing
     being fit.</p>`,
    `<h1 class='step-title'>Cut again</h1>
     <p>Next, we throw away the half our account didn't land in and repeat the process inside
     the half it did, so the box shrinks. Notice that most of the other accounts left the
     picture right away. A point sitting on its own in empty space gets separated from the
     crowd early, by almost any cut we draw.</p>`,
    `<h1 class='step-title'>Alone after three</h1>
     <p>After three cuts, nothing else is left in the box, so three is this account's
     <span class='bold'>path length</span> in this tree. The path is short because the
     account was easy to isolate, and it was easy to isolate because there was nothing
     nearby.</p>`,
    `<h1 class='step-title'>Now one from the crowd</h1>
     <p>Now let's use the same tree and the same rules, but start from an account in the
     middle of the busiest habit. This time it takes <span class='bold'>nine</span> cuts to
     get the account on its own. The early cuts that quickly isolated the odd account only
     split the crowd roughly in half, so the crowd has to be halved again and again.</p>`,
  ];
</script>

<h1 class="body-header">How a tree isolates a point</h1>
<p class="body-text">
  An isolation tree works in a remarkably simple way. It picks a feature at
  random, picks a split point at random between the smallest and largest values
  that feature takes, and cuts. Then it does the same thing again inside one of
  the two halves. Apart from those two numbers, it never looks at where the other
  points are, and it never looks at a label. Scroll through the steps below to
  see it in action.
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
