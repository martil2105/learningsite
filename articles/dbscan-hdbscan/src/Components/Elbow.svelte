<script>
  /*
    The objection everybody raises, taken seriously: you did not pick eps
    properly, there is a recipe for that.

    The figure puts the recipe's answer and the range that works on the SAME
    axis, because both are distances. Whether it lands is then something the
    reader looks at rather than something they are told, and the toggles let
    them try to break it - which one extra ping does.
  */
  import ElbowFig from "./ElbowFig.svelte";
  import { DATA, PRE, HOOK, HARD, DAY, num, pct, int } from "../experiments.js";

  const M_OPTIONS = [4, 8, 12, 20];
  let id = "platforms";
  let mPts = 8;
  let stray = false;

  const withWindow = PRE.scenarios.flatMap((s) => s.grid.filter((g) => g.lo !== null));
  const hits = withWindow.filter((g) => g.elbow.inside).length;
  const per = (s) => {
    const w = s.grid.filter((g) => g.lo !== null);
    return { n: w.length, hit: w.filter((g) => g.elbow.inside).length };
  };
  const easy = per(HOOK);
  const day = per(DAY);
  const E = PRE.elbow;
  $: sc = DATA.find((d) => d.id === id);
  $: strayNote = stray ? "with one extra ping, at the far corner" : "as logged";
</script>

<h1 class="body-header">But maybe you just didn't pick <span class="mono h">eps</span> properly</h1>

<p class="body-text">
  This is a fair objection, and it deserves a real answer, because there's a
  standard recipe that almost every tutorial repeats. You take every ping's
  distance to its <span class="mono">k</span>th nearest neighbour, sort those
  distances, plot them, and read <span class="mono">eps</span> off the elbow,
  which is the place where the curve stops crawling along and turns upwards.
</p>

<p class="body-text">
  It's worth going back to what the recipe was originally for. Ester and
  colleagues proposed it in the original 1996 paper as a <em>sorted 4-dist
  graph</em>, and what they asked you to find on it was the first valley, which
  separates the noise from everything else. You pick a point by eye, and the
  pings on one side of it are noise. In other words, it's a way of locating the
  <span class="bold">noise floor</span>. The modern retelling automates the same
  picture but treats it as a way of locating the
  <span class="bold">cluster scale</span>. Those two are the same number only
  when all your clusters have roughly the same density, which is exactly the
  assumption the previous section was about.
</p>

<div class="figwrap">
  <div class="card">
    <div class="head">
      <span class="title">The k-distance curve, and the range that works</span>
      <div class="pills" role="group" aria-label="which day">
        {#each DATA as d}
          <button class="pill" class:on={id === d.id} on:click={() => (id = d.id)} aria-pressed={id === d.id}>{d.name}</button>
        {/each}
      </div>
    </div>
    <ElbowFig {id} {mPts} {stray} />
    <div class="controls">
      <div class="pills small" role="group" aria-label="minPts">
        <span class="clabel">minPts</span>
        {#each M_OPTIONS as opt}
          <button class="pill" class:on={mPts === opt} on:click={() => (mPts = opt)} aria-pressed={mPts === opt}>{opt}</button>
        {/each}
      </div>
      <label class="toggle">
        <input type="checkbox" bind:checked={stray} />
        <span>add one stray ping</span>
      </label>
      <span class="note">{strayNote}</span>
    </div>
  </div>
</div>

<p class="body-text">
  Try it on each day. On the platforms, the elbow lands inside the working range
  for <span class="bold">{easy.hit} of the {easy.n}</span> values of
  <span class="mono">minPts</span> in the grid behind this figure. On the whole
  day, where a window exists and is
  {num(-DAY.crossings.find((c) => c.m === 8).gap, 1)} metres wide at
  <span class="mono">minPts = 8</span>, it lands inside for
  <span class="bold">{day.hit} of {day.n}</span>. Overall, that's {hits} of
  {withWindow.length}. On the café day, it can't land anywhere, because there's
  nowhere to land, and the best it manages is
  {Math.max(...HARD.grid.map((g) => g.elbow.found))} of {HARD.nStops} stops.
</p>

<p class="body-text">
  So the recipe works on the day you didn't need it and misses on the day you
  did, and that isn't bad luck. Look at <em>where</em> on the curve the elbow
  keeps landing. Across {E.n} combinations of dataset and
  <span class="mono">minPts</span>, it sits between the
  {Math.round(100 * E.min)}th and {Math.round(100 * E.max)}th percentiles of the
  sorted distances, with a median at the {Math.round(100 * E.median)}th and a
  standard deviation of {num(100 * E.sd, 1)} percentage points. In other words,
  the elbow is really just a high percentile in disguise. Any sorted distance
  curve has roughly that shape, so the recipe returns a property of sorted
  distances in general rather than a property of your clusters.
</p>

<p class="body-text">
  It's also fragile in a specific and easily triggered way. The chord it
  measures against is anchored at the far end of the curve, which is just
  <em>one</em> order statistic. Try ticking the box. A single extra ping, logged
  once in a corner where nothing happened, moves the recommendation from
  <span class="bold">{num(E.stray.before, 2)} m</span> to
  <span class="bold">{num(E.stray.after, 2)} m</span>. That's a 75% change to
  the model's central parameter, caused by a single row you'd never look at.
</p>

<p class="body-text">
  None of this makes the heuristic useless. Finding the noise floor is a real
  question, and the sorted curve is a reasonable way to look at it. It just
  isn't a way of finding a window that doesn't exist, and it was never
  advertised as one.
</p>

<style>
  .h { font-size: 0.92em; }
  .mono { font-family: var(--font-mono, monospace); }

  .figwrap { display: flex; justify-content: center; margin: 1.6rem auto 1.2rem auto; padding: 0 0.75rem; }
  .card {
    width: 100%; max-width: 660px; background: #fff; border-radius: 10px;
    padding: 1rem 1.1rem 0.9rem 1.1rem; border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }
  .head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; }
  .title { font-family: var(--font-main); font-size: 0.9rem; font-weight: 700; color: var(--squidink); }

  .pills { display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; }
  .pill {
    font-family: var(--font-main); font-size: 0.72rem; line-height: 1; padding: 0.34rem 0.5rem;
    border: 1px solid #dbe1e8; background: #fff; color: #4a5568; border-radius: 5px; cursor: pointer;
  }
  .pill:hover { border-color: var(--violet); }
  .pill.on { background: var(--violet); border-color: var(--violet); color: #fff; font-weight: 700; }

  .controls { display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap; margin-top: 0.6rem; }
  .clabel { font-family: var(--font-mono, monospace); font-size: 0.76rem; color: #718096; }
  .toggle {
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-family: var(--font-main); font-size: 0.76rem; color: var(--squidink); cursor: pointer;
  }
  .toggle input { accent-color: var(--violet); }
  .note { font-family: var(--font-main); font-size: 0.72rem; color: #9aa5b1; margin-left: auto; }

  @media screen and (max-width: 950px) {
    .card { padding: 0.8rem 0.7rem 0.7rem 0.7rem; }
    .pill { font-size: 0.68rem; padding: 0.3rem 0.42rem; }
    .note { margin-left: 0; }
  }
</style>
