<script>
  /*
    Core distance and mutual reachability.

    Usually introduced as "a smoothing trick that makes it robust to noise",
    which understates it. It is the piece that makes a hierarchy of density
    levels behave on filaments - and on location data every route walked
    between two stops is a filament. The measurement in the last figure is what
    it actually buys: not a better answer, a wider window.
  */
  import MapPanel from "./MapPanel.svelte";
  import katexify from "../katexify.js";
  import { DAY, HARD, byId, scene, num, int, M_DEFAULT } from "../experiments.js";
  import { ACCENT, INK } from "../palette.js";

  const eqCore = katexify("\\operatorname{core}_m(p) \\;=\\; \\text{distance from } p \\text{ to its } m\\text{-th nearest ping}", true);
  const eqReach = katexify("d_{\\text{mreach}}(a,b) \\;=\\; \\max\\big(\\operatorname{core}_m(a),\\; \\operatorname{core}_m(b),\\; d(a,b)\\big)", true);
  const inlineCore = katexify("\\operatorname{core}_m");
  const inlineD = katexify("d(a,b)");

  let mSamples = M_DEFAULT;
  const M_OPTIONS = [2, 4, 8, 16];
  const day = byId("whole-day");

  $: S = scene("whole-day", mSamples);
  /* A stratified sample: a few pings from each stop and a few from the walking,
     so both scales are on screen and neither buries the other. */
  $: sample = (() => {
    const out = [];
    const perGroup = new Map();
    for (let i = 0; i < day.pts.length; i++) {
      const g = day.stop[i];
      const want = g < 0 ? 14 : 5;
      const have = perGroup.get(g) || 0;
      if (have >= want) continue;
      // spread them out rather than taking the first few, which are adjacent
      if (i % (g < 0 ? 6 : 11) !== 0) continue;
      perGroup.set(g, have + 1);
      out.push(i);
    }
    return out;
  })();
  const medStop = num(DAY.medianCore.stops, 1);
  const inflation = num(DAY.medianCore.transit / DAY.medianCore.stops, 1);

  /* What it buys: the window, against min_samples. */
  const LINK = DAY.linkage;
  let boxWidth = 320;
  $: BW = Math.max(260, boxWidth);
  $: LH = 190;
  $: lmargin = { top: 10, right: 12, bottom: 32, left: 40 };
  $: lPlotW = Math.max(120, BW - lmargin.left - lmargin.right);
  $: lPlotH = LH - lmargin.top - lmargin.bottom;
  $: lMax = 40;
  $: lx = (i) => lmargin.left + ((i + 0.5) / LINK.length) * lPlotW;
  $: ly = (v) => lmargin.top + lPlotH - (Math.min(v, lMax) / lMax) * lPlotH;
  $: barW = Math.max(10, (lPlotW / LINK.length) * 0.42);
  $: lTicks = [0, 10, 20, 30, 40];
  $: widest = LINK.reduce((a, b) => (b.width > a.width ? b : a));
  $: plain = LINK.find((l) => l.m === 1);
</script>

<h1 class="body-header">A distance that knows how crowded it is</h1>

<p class="body-text">
  Everything from here on is HDBSCAN, and it starts by replacing the distance.
  The first piece is a number per ping rather than per pair — its
  <span class="bold">core distance</span>, which is exactly the quantity the
  last two sections kept measuring:
</p>

<div class="eq">{@html eqCore}</div>

<p class="body-text">
  It is a density estimate that happens to be measured in metres. Small where
  the phone sat still, large where it was moving. On this day the median is
  {medStop} m inside the stops and
  <span class="bold">{num(DAY.medianCore.transit, 1)} m</span> along the routes
  walked between them — <span class="bold">{inflation}× further</span>, which is
  the whole of the mechanism in one number. The circles below are each ping's own core distance —
  a sample of them, because five hundred overlapping circles is a fog rather
  than a figure.
</p>

<div class="figwrap">
  <div class="card">
    <div class="head">
      <span class="title">Every ping's own idea of how far away its neighbours are</span>
      <div class="pills" role="group" aria-label="min_samples">
        <span class="clabel">m</span>
        {#each M_OPTIONS as opt}
          <button class="pill" class:on={mSamples === opt} on:click={() => (mSamples = opt)} aria-pressed={mSamples === opt}>{opt}</button>
        {/each}
      </div>
    </div>
    <MapPanel pts={day.pts} core={S.core} coreFor={sample} maxHeight={320} dotR={1.9} />
    <p class="cap">
      Circles of radius <span class="mono">core<sub>{mSamples}</sub></span>. The
      ones strung out along the walking routes are the point: a ping logged
      mid-stride is a long way from its {mSamples}th neighbour, and turning
      <span class="mono">m</span> up makes it further, faster than it does for a
      ping inside a stop.
    </p>
  </div>
</div>

<p class="body-text">
  Now the second piece. Take the distance between two pings and refuse to let it
  be smaller than either one's core distance:
</p>

<div class="eq">{@html eqReach}</div>

<p class="body-text">
  Read it as: <em>two pings are as far apart as the greater of how far apart
  they are and how lonely either of them is</em>. Three things follow, and none
  of them require any calculation. It can only ever push points further apart,
  never closer, because it is a maximum with {@html inlineD} in it. Inside a
  dense stop it changes nothing, because there {@html inlineCore} is much
  smaller than the distances between neighbours and the maximum picks
  {@html inlineD}. And a ping out on its own is pushed away from
  <em>everything</em> at once, by its own core distance — so it joins whatever
  it eventually joins late, and it cannot act as a stepping stone before then.
</p>

<p class="body-text">
  That last one is what it is for. A route walked between two stops is a
  one-dimensional filament of pings at moderate spacing, and a filament is a
  bridge: at the <span class="mono">eps</span> a loose stop needs to hold
  together, the filament is dense enough to connect everything it touches.
  Mutual reachability inflates exactly those pings and leaves the stops alone.
</p>

<h2 class="sub-header">What it actually buys</h2>

<p class="body-text">
  Here is the part usually left out. It does not buy a better answer. On this
  day, plain single linkage — which is what you get when
  <span class="mono">m = 1</span> and every core distance is zero — recovers all
  five stops at its best threshold, and so does mutual reachability at every
  <span class="mono">m</span>. What changes is how much room you have to be
  wrong:
</p>

<div class="figwrap">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth} />
    <div class="title">The range of thresholds that recovers all five stops</div>
    <svg viewBox="0 0 {BW} {LH}" width={BW} height={LH} aria-hidden="true">
      {#each lTicks as t}
        <line class="grid" x1={lmargin.left} x2={lmargin.left + lPlotW} y1={ly(t)} y2={ly(t)} />
        <text class="tick" x={lmargin.left - 6} y={ly(t) + 3.2} text-anchor="end">{t}</text>
      {/each}
      {#each LINK as l, i}
        {#if l.lo !== null}
          <rect class="bar" x={lx(i) - barW / 2} y={ly(l.hi)} width={barW} height={Math.max(2, ly(l.lo) - ly(l.hi))} />
          <text class="barlab" x={lx(i)} y={ly(l.hi) - 5} text-anchor="middle">{num(l.width, 1)}</text>
        {/if}
        <text class="tick" x={lx(i)} y={LH - 16} text-anchor="middle">{l.m === 1 ? "1" : l.m}</text>
      {/each}
      <text class="axis-title" x={lmargin.left + lPlotW / 2} y={LH - 3} text-anchor="middle">
        m, the neighbour count in the core distance
      </text>
      <text class="axis-title" transform="translate(10 {lmargin.top + lPlotH / 2}) rotate(-90)" text-anchor="middle">threshold, m</text>
    </svg>
    <p class="cap">
      <span class="mono">m = 1</span> is plain single linkage: no core distance,
      no mutual reachability. Bars are labelled with their height in metres.
    </p>
  </div>
</div>

<p class="body-text">
  From <span class="bold">{num(plain.width, 1)} metres</span> of usable
  threshold with plain single linkage to
  <span class="bold">{num(widest.width, 1)} metres</span> at
  <span class="mono">m = {widest.m}</span>. Same answer inside the window,
  more than twice as much window. That is the honest description of what
  mutual reachability is: not accuracy, tolerance. It makes the choice of
  threshold matter less, which is a strange thing to want until you remember
  that the next step is going to stop choosing one.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }

  /* A KaTeX display equation is routinely the widest thing on the page and will
     push the body sideways on a phone unless it may scroll itself. */
  .eq { max-width: 600px; margin: 1.1rem auto; overflow-x: auto; overflow-y: hidden; padding: 0.15rem 0; }

  .figwrap { display: flex; justify-content: center; margin: 1.4rem auto; padding: 0 0.75rem; }
  .card {
    width: 100%; max-width: 660px; background: #fff; border-radius: 10px;
    padding: 1rem 1.1rem 0.9rem 1.1rem; border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }
  .measure { width: 100%; height: 0; }
  .head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem; }
  .title { font-family: var(--font-main); font-size: 0.9rem; font-weight: 700; color: var(--squidink); margin-bottom: 0.3rem; }

  .pills { display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; }
  .clabel { font-family: var(--font-mono, monospace); font-size: 0.76rem; color: #718096; }
  .pill {
    font-family: var(--font-main); font-size: 0.72rem; line-height: 1; padding: 0.34rem 0.5rem;
    border: 1px solid #dbe1e8; background: #fff; color: #4a5568; border-radius: 5px; cursor: pointer;
  }
  .pill:hover { border-color: var(--violet); }
  .pill.on { background: var(--violet); border-color: var(--violet); color: #fff; font-weight: 700; }

  svg { display: block; max-width: 100%; }
  .grid { stroke: #eef1f5; }
  .bar { fill: rgba(47, 125, 50, 0.28); stroke: #2f7d32; stroke-width: 1; }
  .barlab { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #2f7d32; font-weight: 700; }
  .tick { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }
  .axis-title { font-family: var(--font-main); font-size: 10.5px; font-weight: 600; fill: var(--squidink); }

  .cap { font-family: var(--font-main); font-size: 0.75rem; line-height: 1.5; color: #718096; margin: 0.5rem 0 0 0; }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .eq { max-width: 80%; }
    .card { padding: 0.8rem 0.7rem 0.7rem 0.7rem; }
  }
</style>
