<script>
  /*
    From one tree to a forest: why the average is the thing, what the score
    formula does with it, and what the whole surface looks like.
  */
  import { onMount } from "svelte";
  import Scrolly from "./Scrolly.svelte";
  import CutChart from "./CutChart.svelte";
  import katexify from "../katexify";
  import { accounts, BOUNDS, mulberry32 } from "../datasets.js";
  import { isolationPath, makeStream, pathDepths, scoreGrid } from "../isolation.js";
  import { FOREST, N_TREES, PSI } from "../forest.js";
  import { SCORE_RAMP, SERIES, PROBE, INK } from "../palette.js";

  // One account to follow through the whole section.
  const subject = accounts.find((p) => p.kind === "anomaly" && p.x > 32000 && p.x < 34000);

  // Two individual trees, drawn in full.
  const treeViews = [0, 1].map((k) => {
    const tree = FOREST.trees[k];
    const ids = new Set(tree.sample.map((p) => p.id));
    const path = isolationPath(subject, tree.sample, BOUNDS, tree.stream);
    return { ids, path };
  });

  const depths = pathDepths(subject, FOREST);
  const mean = depths.reduce((a, b) => a + b, 0) / depths.length;
  const score = Math.pow(2, -mean / FOREST.norm);

  const histo = (() => {
    const max = Math.max(...depths);
    const bins = Array.from({ length: max + 1 }, (_, d) => ({
      d,
      n: depths.filter((x) => x === d).length,
    }));
    return { bins, peak: Math.max(...bins.map((b) => b.n)) };
  })();

  // The surface is the same 60 trees evaluated everywhere, so the colour under
  // a point always agrees with that point's number. It costs a few hundred
  // milliseconds, so it is computed after the page has drawn itself.
  let heat = null;
  onMount(() => {
    const id = setTimeout(() => {
      heat = scoreGrid(FOREST, BOUNDS, 30, 30);
    }, 60);
    return () => clearTimeout(id);
  });

  let value;
  $: step = Math.min(4, value || 0);

  const kr = (v) => Math.round(v).toLocaleString("en-US").replace(/,/g, " ");

  const steps = [
    `<h1 class='step-title'>One tree, one number</h1>
     <p>Here is a single isolation tree, grown on a random ${PSI}-account sample, isolating
     the account we planted at the top right. Count the cuts.</p>`,
    `<h1 class='step-title'>Another tree, another number</h1>
     <p>A different sample and different random splits give a different count for the very
     same account. One tree is a coin flip with opinions. This is not a flaw to be tuned
     away — the randomness is what makes each tree cheap.</p>`,
    `<h1 class='step-title'>Sixty trees</h1>
     <p>Grow ${N_TREES} of them and the counts pile up into a distribution. Its mean is what
     the algorithm actually uses, written <span class='bold'>E[h(x)]</span>. The spread is
     wide; the mean is stable.</p>`,
    `<h1 class='step-title'>From cuts to a score</h1>
     <p>A raw depth is not comparable across datasets — deeper trees are expected when there
     are more points. Dividing by c(n), the average depth you would expect anyway, and
     pushing the result through a negative exponent gives a number between 0 and 1 that means
     the same thing everywhere.</p>`,
    `<h1 class='step-title'>The whole surface</h1>
     <p>Run that score at every position, not just where the data sits, and the model becomes
     visible. Light where a point would be hard to isolate — down in the crowd — and dark out
     in the empty space, where two or three cuts would do it. Notice the shape of the pale
     regions: they are made of rectangles, and they run off along the axes past where any
     data sits, because every cut this algorithm can make is parallel to an axis.</p>`,
  ];
</script>

<h1 class="body-header">One tree is noisy. A forest is not.</h1>
<p class="body-text">
  A single tree's answer depends on which points it happened to sample and where
  its splits happened to land. The fix is the usual one, and it is the reason
  this is a forest rather than a tree.
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
      {#if step < 2}
        <div class="chart-legend">
          <span class="legend-item"
            ><span class="swatch" style="background: {SERIES.normal}" />ordinary</span
          >
          <span class="legend-item"
            ><span class="swatch" style="background: {SERIES.anomaly}" />planted oddity</span
          >
          <span class="legend-item"
            ><span class="swatch probe-swatch" style="background: {PROBE}" />our account</span
          >
          <span class="legend-item muted">faded = not in this tree's sample</span>
        </div>
        <div class="chart-body">
          <CutChart
            points={accounts}
            probe={subject}
            cuts={treeViews[step].path.cuts}
            region={treeViews[step].path.region}
            sampleIds={treeViews[step].ids}
          />
        </div>
        <div class="chart-caption">
          Tree {step + 1} · <span class="count">{treeViews[step].path.cuts.length}</span> cuts
          to isolate the account at {kr(subject.x)} kr
        </div>
      {:else if step < 4}
        <div class="chart-body histo-body">
          <div class="histo">
            {#each histo.bins as b}
              <div class="bar-slot">
                <div
                  class="bar"
                  class:at-mean={Math.round(mean) === b.d}
                  style="height: {(b.n / histo.peak) * 100}%"
                  title="{b.n} of {N_TREES} trees isolated it in {b.d} cuts"
                />
                <span class="bar-label">{b.d}</span>
              </div>
            {/each}
          </div>
          <div class="histo-axis">cuts needed, across {N_TREES} trees</div>
          <div class="mean-line">
            mean path length <span class="count">{mean.toFixed(2)}</span>
            &nbsp;·&nbsp; range {Math.min(...depths)}–{Math.max(...depths)}
          </div>
          {#if step === 3}
            <div class="math-block math-display">
              {@html katexify(
                `s(x) = 2^{-\\frac{E[h(x)]}{c(n)}} = 2^{-\\frac{${mean.toFixed(
                  2
                )}}{${FOREST.norm.toFixed(2)}}} = ${score.toFixed(2)}`,
                true
              )}
            </div>
          {/if}
        </div>
      {:else}
        <div class="chart-body">
          {#if heat}
            <CutChart points={accounts} {heat} bounds={BOUNDS} />
          {:else}
            <div class="pending">computing the surface…</div>
          {/if}
        </div>
        <div class="colorbar">
          <span class="cb-label">ordinary</span>
          <span
            class="cb-strip"
            style="background: linear-gradient(90deg, {SCORE_RAMP.join(', ')})"
          />
          <span class="cb-label">anomalous</span>
        </div>
        <div class="chart-caption">
          Anomaly score at every position, from the same {N_TREES} trees
        </div>
      {/if}
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
    width: 55%;
    height: 82vh;
  }

  .chart-body {
    flex: 1 1 auto;
    min-height: 0;
  }

  .pending {
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--squidink);
    opacity: 0.6;
  }

  .histo-body {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding-bottom: 0.5rem;
  }

  .histo {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 55%;
    padding: 0 0.5rem;
  }

  .bar-slot {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
  }

  .bar {
    width: 100%;
    background: var(--sky, #2074d5);
    border-radius: 3px 3px 0 0;
    min-height: 1px;
  }

  .bar.at-mean {
    background: var(--squidink);
  }

  .bar-label {
    font-size: 0.72rem;
    font-family: var(--font-main);
    color: var(--squidink);
    opacity: 0.7;
    padding-top: 0.2rem;
  }

  .histo-axis {
    text-align: center;
    font-size: 0.8rem;
    font-family: var(--font-main);
    color: var(--squidink);
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding-top: 0.5rem;
  }

  .mean-line {
    text-align: center;
    font-family: var(--font-main);
    font-size: 0.9rem;
    color: var(--squidink);
    padding-top: 0.6rem;
  }

  .math-block {
    padding-top: 0.8rem;
    text-align: center;
  }

  .math-display {
    overflow-x: auto;
    overflow-y: hidden;
  }

  .colorbar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding-top: 0.5rem;
  }

  .cb-strip {
    display: inline-block;
    width: 180px;
    height: 12px;
    border: 1px solid rgba(35, 47, 62, 0.3);
  }

  .cb-label {
    font-size: 0.78rem;
    font-family: var(--font-main);
    color: var(--squidink);
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
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

  .legend-item.muted {
    opacity: 0.6;
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
    opacity: 0.85;
    padding-top: 0.35rem;
  }

  .count {
    font-family: var(--font-heavy);
    font-size: 1.05rem;
  }

  .section-container {
    margin-top: 1em;
    text-align: center;
    display: flex;
  }

  .steps-container {
    height: 100%;
    flex: 1 1 40%;
    z-index: 10;
  }

  .step {
    height: 115vh;
    display: flex;
    place-items: center;
    justify-content: center;
  }

  .step-content {
    font-size: 17px;
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
    max-width: 500px;
    margin: auto;
    font-family: var(--font-main);
    line-height: 1.45;
    border: 5px solid var(--default);
  }

  .step.active .step-content {
    background: #f1f3f3ee;
    color: var(--squidink);
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
      height: 64vh;
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
