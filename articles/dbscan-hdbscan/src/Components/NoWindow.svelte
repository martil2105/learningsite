<script>
  /*
    The central argument. Not "eps is hard to tune" - "on this data no eps
    exists", which is a different claim and a checkable one.

    The two numbers are the whole of it: the eps at which the two closest stops
    fall into one cluster, and the eps at which the loosest stop finally holds
    together. Every eps that works is at least the second and below the first.
    verify/check-numbers.mjs shows those two numbers predict the window
    enumerated from every distinct clustering, exactly, 39 times out of 39.
  */
  import GapPanel from "./GapPanel.svelte";
  import { HOOK, HARD, DAY, M_DEFAULT, num, int, m, pct } from "../experiments.js";

  const cross = (s) => s.crossings.find((c) => c.m === M_DEFAULT);
  const hard = cross(HARD);
  const easy = cross(HOOK);
  const day = cross(DAY);
  const gapLo = HARD.crossings[0];
  const gapHi = HARD.crossings[HARD.crossings.length - 1];
  const classicFails = HARD.classic.every((c) => !c.any);
  const mLo = HARD.classic[0].m;
  const mHi = HARD.classic[HARD.classic.length - 1].m;

  let rowWidth = 320;
  $: RW = Math.max(260, rowWidth);
  $: threeUp = RW > 700;
  // Splitting a row exactly in half - or in thirds - is a knife edge: asking
  // for 604px of a 603px row drops a whole panel below the fold with every
  // check still green. Floor it, and take two extra pixels for the border.
  $: panelW = threeUp ? Math.floor((RW - 2 * 14 - 2) / 3) : Math.min(430, RW);
  $: panelH = threeUp ? 190 : 200;

  const PANELS = [
    { rows: HOOK.crossings, title: "Two platforms", sub: "a window " + num(-easy.gap, 1) + " m wide" },
    { rows: HARD.crossings, title: "Café, bakery, park", sub: "the curves have crossed" },
    { rows: DAY.crossings, title: "A whole day", sub: "a window " + num(-day.gap, 1) + " m wide" },
  ];
</script>

<h1 class="body-header">It isn't a narrow window. There's no window at all.</h1>

<p class="body-text">
  On the second day, the band never appears. It's worth being careful about
  what that means, because the standard explanation (<em>one global
  <span class="mono">eps</span> can't suit a dense cluster and a sparse one at
  the same time</em>) sounds like a compromise, and a compromise implies that
  there's a best point on some curve. There's no such point here. No
  <span class="mono">eps</span>, at any <span class="mono">minPts</span>,
  recovers all three stops.
</p>

<p class="body-text">
  The table below shows why. The natural scale of a place is how far you have
  to go to find {M_DEFAULT} pings, so that's what we measure, taking the median
  over the pings that belong to each group:
</p>

<div class="tablewrap">
  <table class="dens">
    <thead>
      <tr><th>where</th><th class="r">distance to the {M_DEFAULT}th nearest ping</th></tr>
    </thead>
    <tbody>
      {#each HARD.stopNames as nm, i}
        <tr><td>{nm}</td><td class="r mono">{num(HARD.medianCore.byStop[i], 1)} m</td></tr>
      {/each}
      <tr class="sep"><td>walking between them</td><td class="r mono">{num(HARD.medianCore.transit, 1)} m</td></tr>
    </tbody>
  </table>
</div>

<p class="body-text">
  The lawn is four times looser than the café table, and that isn't a quirk of
  the data; it's arithmetic. Ping density is time spent divided by area covered,
  so forty minutes at one table is dense, while an hour spent wandering around a
  lawn isn't, and both come from the same person having an ordinary day.
</p>

<h2 class="sub-header">Two numbers, and a subtraction</h2>

<p class="body-text">
  Everything follows from a pair of thresholds. The café and the bakery are a
  few doors apart, so as <span class="mono">eps</span> grows, they eventually
  fall into one cluster, which happens at
  <span class="bold">{num(hard.merge, 2)} m</span>. The park is loose, so below
  some <span class="mono">eps</span>, it doesn't hold together at all; it needs
  <span class="bold">{num(hard.cohere, 2)} m</span>. Any working
  <span class="mono">eps</span> has to be at least the second number and below
  the first:
</p>

<div class="formula">
  <span class="fx">{num(hard.cohere, 2)} m</span>
  <span class="fop">≤ eps &lt;</span>
  <span class="fx">{num(hard.merge, 2)} m</span>
  <span class="fverdict bad">empty</span>
</div>

<p class="body-text">
  That subtraction isn't just a rule of thumb. On the platforms, the same two
  numbers are {num(easy.cohere, 2)} m and {num(easy.merge, 2)} m, and the band
  under the slider on that day runs from {num(easy.cohere, 2)} to
  {num(easy.merge, 2)}, {num(-easy.gap, 2)} m wide, which is exactly where it
  came from. Across all three days
  and every <span class="mono">minPts</span> from {mLo} to {mHi}, the window
  read off those two numbers and the window found by enumerating every distinct
  clustering agree <span class="bold">exactly, 39 times out of 39</span>. So the
  width of the working range has a closed form, and its sign is the whole
  question.
</p>

<div class="rowwrap">
  <div class="measure" bind:clientWidth={rowWidth} />
  <div class="grid-row" class:stacked={!threeUp}>
    {#each PANELS as p}
      <GapPanel rows={p.rows} title={p.title} sub={p.sub} width={panelW} height={panelH} />
    {/each}
  </div>
  <div class="rowlegend">
    <span class="key"><i class="ln cohere" />the loosest stop finally holds together</span>
    <span class="key"><i class="ln merge" />the two closest stops become one</span>
    <span class="key"><i class="sw good" />a window</span>
    <span class="key"><i class="sw bad" />no window</span>
  </div>
</div>

<p class="body-text">
  Turning <span class="mono">minPts</span> up doesn't rescue it, either. In
  fact, it makes things monotonically worse. The gap runs from
  {num(gapLo.gap, 2)} m at
  <span class="mono">minPts = {gapLo.m}</span> to {num(gapHi.gap, 1)} m at
  <span class="mono">minPts = {gapHi.m}</span>. Raising
  <span class="mono">minPts</span> inflates every point's sense of how far away
  its neighbours are, and it inflates the lawn's faster than the gap between
  two shops. That's because a two-dimensional patch has to grow its radius to
  find more neighbours, while two clusters a fixed distance apart stay a fixed
  distance apart.
</p>

<p class="body-text">
  Border points don't rescue it either, which is worth checking rather than
  assuming. The version above is DBSCAN*, which throws non-core pings away,
  whereas the DBSCAN in your toolbox sweeps them into whichever cluster reaches
  them first. If we run that version instead, on a 10 cm grid of
  <span class="mono">eps</span> from 1 to 40
  metres and every <span class="mono">minPts</span> from {mLo} to {mHi}, it
  {classicFails ? "never recovers all three stops either" : "sometimes recovers all three"}.
</p>

<p class="body-text">
  If we count them up, the <span class="mono">eps</span> knob has
  <span class="bold">{int(HARD.atDefault.distinct)}</span> distinct settings on
  this data, in the sense that there are that many different answers to be had,
  and <span class="bold">{HARD.atDefault.right} of them</span> are right. On the
  platforms, the same count gives {int(HOOK.atDefault.distinct)} answers, of which
  {HOOK.atDefault.right} are right.
</p>

<h2 class="sub-header">The uncomfortable comparison</h2>

<p class="body-text">
  There's one thing we should say here rather than bury, because it's the
  obvious objection, and it's correct. If you run k-means on this day with
  <span class="mono">k = {HARD.kmeans.k}</span>, it finds all three stops, with
  an adjusted Rand index of {num(HARD.kmeans.ari, 2)}, compared with
  {num(HARD.atDefault.best.ari, 2)} for the best <span class="mono">eps</span>
  there is. The café, the bakery and the lawn are three roughly round blobs,
  which is exactly the shape k-means assumes, and it doesn't care in the
  slightest that one of them is four times looser than another.
</p>

<p class="body-text">
  So this isn't a story about one algorithm being better than the other. It's a
  story about what each of them is committed to. k-means is committed to round
  clusters of comparable spread and to a number you supply. It was fine here,
  but it scored {num(HOOK.kmeans.ari, 3)} on the platforms, which is worse than
  guessing. DBSCAN is committed to one density threshold for the whole map, and
  unlike the shape assumption, that commitment can't be relaxed by tuning,
  because it isn't a parameter. It's the form of the answer.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }

  .tablewrap { max-width: 600px; margin: 1.1rem auto; overflow-x: auto; }
  .dens { border-collapse: collapse; width: 100%; font-family: var(--font-main); font-size: 0.88rem; }
  .dens th {
    text-align: left; font-family: var(--font-main); font-weight: 700; font-size: 0.76rem;
    color: #718096; border-bottom: 1px solid #cbd5e0; padding: 0.3rem 0.5rem 0.3rem 0;
  }
  .dens td { padding: 0.3rem 0.5rem 0.3rem 0; color: var(--squid-ink); border-bottom: 1px solid #eef1f5; }
  .dens .r { text-align: right; padding-right: 0; }
  .dens .sep td { color: #718096; font-style: italic; }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  .formula {
    max-width: 600px; margin: 1rem auto 1.2rem auto; display: flex; align-items: center;
    gap: 0.6rem; flex-wrap: wrap; font-family: var(--font-mono, monospace); font-size: 0.95rem;
  }
  .fx { font-weight: 700; color: var(--squidink); background: #f1f3f3; padding: 0.25rem 0.5rem; border-radius: 4px; }
  .fop { color: #718096; }
  .fverdict {
    font-family: var(--font-main); font-weight: 700; font-size: 0.8rem;
    padding: 0.2rem 0.5rem; border-radius: 4px; margin-left: 0.2rem;
  }
  .fverdict.bad { background: rgba(223, 42, 93, 0.12); color: #df2a5d; }

  .rowwrap { max-width: 760px; margin: 1.4rem auto; padding: 0 0.75rem; }
  /* The measuring div is the first child of the box being sized. As a flex
     sibling of the row it would report its own negotiated width, and every
     panel would be laid out for the wrong box. */
  .measure { width: 100%; height: 0; }
  .grid-row { display: flex; gap: 14px; justify-content: center; align-items: flex-start; }
  .grid-row.stacked { flex-direction: column; align-items: center; }

  .rowlegend {
    display: flex; flex-wrap: wrap; gap: 0.35rem 1rem; justify-content: center;
    margin-top: 0.6rem; font-family: var(--font-main); font-size: 0.72rem; color: #4a5568;
  }
  .key { display: inline-flex; align-items: center; gap: 0.32rem; }
  .ln { width: 15px; height: 0; border-top: 2.4px solid; display: inline-block; }
  .ln.cohere { border-color: #2074d5; }
  .ln.merge { border-color: #df2a5d; }
  .sw { width: 13px; height: 9px; display: inline-block; }
  .sw.good { background: rgba(47, 125, 50, 0.3); }
  .sw.bad { background: rgba(223, 42, 93, 0.26); }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .tablewrap { max-width: 80%; }
    .formula { max-width: 80%; font-size: 0.85rem; }
  }
</style>
