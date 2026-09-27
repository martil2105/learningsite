<script>
  /*
    What the two parameters actually do, on sixty pings rather than five
    hundred, because this section asks the reader to count neighbours and you
    cannot count neighbours in a cloud.

    The last step is the one the rest of the article is built on: eps is doing
    two different jobs at the same time. It is the density test - how many
    pings are inside the ball - and it is the linking rule - how far a cluster
    is allowed to step. One number, two jobs, and they do not want the same
    value.
  */
  import Scrolly from "./Scrolly.svelte";
  import MapPanel from "./MapPanel.svelte";
  import { PATCH, PATCH_EXTENT } from "../datasets.js";
  import { coreDistances, distanceMatrix } from "../density.js";

  const EPS = 5;
  const MINPTS = 5;
  const TICKS = [0, 20, 40, 60];
  const TICKS_Y = [0, 20, 40];

  const D = distanceMatrix(PATCH);
  const N = PATCH.length;
  const core = coreDistances(PATCH, MINPTS, D);
  const isCore = PATCH.map((_, i) => core[i] <= EPS);

  const neighbours = (i, eps) => {
    const out = [];
    for (let j = 0; j < N; j++) if (j !== i && D[i * N + j] <= eps) out.push(j);
    return out;
  };

  /*
    Two different pings, for two different jobs.

    The one the first step puts a circle on is the core ping with the FEWEST
    neighbours - the one that only just qualifies - because a circle with
    thirty pings in it is a circle nobody counts, and "only just enough" is the
    more instructive case anyway. The one the flood fill starts from is in the
    middle of the dense stop, where a flood fill would actually start.
  */
  const EXAMPLE = (() => {
    let best = 0, bn = Infinity;
    for (let i = 0; i < N; i++) {
      if (!isCore[i]) continue;
      const k = neighbours(i, EPS).length;
      if (k < bn) { bn = k; best = i; }
    }
    return best;
  })();
  const EX_NBRS = neighbours(EXAMPLE, EPS);

  const SEED = (() => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(PATCH[i][0] - 22, PATCH[i][1] - 33);
      if (isCore[i] && d < bd) { bd = d; best = i; }
    }
    return best;
  })();

  /* Roles. A ping is core if minPts pings (itself included) are within eps; a
     border ping is not core but sits inside some core ping's ball; everything
     else is noise. */
  const roles = PATCH.map((_, i) => {
    if (isCore[i]) return "core";
    for (let j = 0; j < N; j++) if (isCore[j] && D[i * N + j] <= EPS) return "border";
    return "noise";
  });
  const nCore = roles.filter((r) => r === "core").length;
  const nBorder = roles.filter((r) => r === "border").length;
  const nNoise = roles.filter((r) => r === "noise").length;

  /* The flood fill, one round at a time. Only core pings are expanded, which
     is the whole of what "border" means. */
  const ROUNDS = (() => {
    const reached = new Set([SEED]);
    const out = [new Set(reached)];
    let frontier = [SEED];
    while (frontier.length) {
      const next = [];
      for (const p of frontier) {
        if (!isCore[p]) continue;
        for (const q of neighbours(p, EPS)) if (!reached.has(q)) { reached.add(q); next.push(q); }
      }
      if (!next.length) break;
      out.push(new Set(reached));
      frontier = next;
    }
    return out;
  })();
  const FINAL = ROUNDS[ROUNDS.length - 1];

  const labelsFrom = (set) => PATCH.map((_, i) => (set.has(i) ? 0 : -1));

  let value = 0;
  $: step = typeof value === "number" ? Math.min(5, Math.max(0, value)) : 0;

  const VIEWS = [
    { title: "One ping, one circle", sub: "eps = " + EPS + " m", discs: [EXAMPLE], rings: EX_NBRS, roles: null, labels: null, eps: null },
    { title: "Three kinds of ping", sub: "minPts = " + MINPTS, discs: null, rings: null, roles, labels: null, eps: null },
    { title: "Growing the cluster", sub: "one round of expansion", discs: null, rings: null, roles: null, labels: labelsFrom(ROUNDS[1] || ROUNDS[0]), eps: EPS },
    { title: "Growing the cluster", sub: ROUNDS.length - 1 + " rounds, and it stops", discs: null, rings: null, roles: null, labels: labelsFrom(FINAL), eps: EPS },
    { title: "The ones that do not pass it on", sub: "border pings", discs: null, rings: PATCH.map((_, i) => i).filter((i) => roles[i] === "border"), roles, labels: null, eps: null },
    { title: "eps, twice", sub: "the same number in both jobs", discs: [SEED], rings: null, roles: null, labels: labelsFrom(FINAL), eps: EPS },
  ];
  $: view = VIEWS[step];

  // Every sentence built here. An {#if} block strips the leading whitespace of
  // its contents, so a figure beside one renders glued to the next word.
  const steps = [
    "<h1 class='step-title'>Put a circle on a ping</h1>" +
      "<p>Radius <span class='mono'>eps</span>, which is " + EPS + " metres here. Count what is inside it, " +
      "the ping itself included: <span class='bold'>" + (EX_NBRS.length + 1) + "</span>. " +
      "<span class='mono'>minPts</span> is " + MINPTS + ", so this ping is <span class='bold'>core</span> — " +
      "it has enough company to count as being somewhere. This is the ping with the least company that still " +
      "qualifies; most of them are not close.</p>" +
      "<p>That is the entire density test. Not a density estimate, not a kernel: a count inside a ball, " +
      "compared against a threshold. Everything DBSCAN knows about how crowded a place is, it knows from " +
      "this one comparison.</p>",

    "<h1 class='step-title'>Which makes three kinds of ping</h1>" +
      "<p><span class='bold'>Core</span> — " + nCore + " of them here — has <span class='mono'>minPts</span> " +
      "inside its circle. <span class='bold'>Border</span> — " + nBorder + " — does not, but sits inside " +
      "somebody else's. <span class='bold'>Noise</span> — " + nNoise + " — is neither, and DBSCAN will hand " +
      "it back to you unlabelled rather than pretend it belongs somewhere.</p>" +
      "<p>Being willing to say <em>this ping is not anywhere</em> is the thing that makes this worth doing on " +
      "location data at all. k-means has no way to say it: every ping logged mid-stride gets assigned to a " +
      "place, and drags that place's centre towards the road.</p>",

    "<h1 class='step-title'>Then grow</h1>" +
      "<p>Start from any core ping, take everything inside its circle, and repeat from each of those that is " +
      "<em>also</em> core. One round in, the cluster is the shaded region: every point within " + EPS + " metres " +
      "of a core point it has reached.</p>" +
      "<p>Nothing here is optimising anything. There is no objective function, no assignment step, nothing to " +
      "converge to. It is a flood fill.</p>",

    "<h1 class='step-title'>Until it stops</h1>" +
      "<p>" + (ROUNDS.length - 1) + " rounds and the frontier runs out — every core ping it can reach has " +
      "been expanded, and what is left is more than " + EPS + " metres from all of them. That is one cluster, " +
      "finished. Start again somewhere unvisited for the next one.</p>" +
      "<p>The cluster's shape is whatever the data's shape was. Nobody chose an ellipse or a centre; the region " +
      "is the union of a few dozen circles and it can be as bent, as long or as knobbly as the pings are.</p>",

    "<h1 class='step-title'>The ones that do not pass it on</h1>" +
      "<p>The ringed pings are border: near enough to a core ping to be swept into its cluster, not crowded " +
      "enough to spread it any further. The fill stops at them.</p>" +
      "<p>They look like a detail and they are not. A border ping can be inside the circle of two core pings " +
      "from two different clusters, and the definition does not say which one it belongs to — so it goes to " +
      "whichever cluster is grown first, which is to say, to whatever order your rows happen to be in. " +
      "We come back to this.</p>",

    "<h1 class='step-title'>And now the problem, in one sentence</h1>" +
      "<p>Look at what <span class='mono'>eps</span> just did. It set the <span class='bold'>density " +
      "threshold</span>: how many pings have to be inside the circle. And it set the " +
      "<span class='bold'>linking rule</span>: how far the flood fill may step at a time. Same number, " +
      "both jobs.</p>" +
      "<p>Those two jobs want different values, and worse, they want different values <em>in different " +
      "places on the map</em>. A busy café needs a small circle to stay distinct from the shop next door; " +
      "an hour on a lawn needs a big one to hold together at all. There is one <span class='mono'>eps</span>, " +
      "and it is the same everywhere.</p>",
  ];
</script>

<h1 class="body-header">What the two numbers do</h1>

<p class="body-text">
  Before the failure, the mechanism — on sixty pings instead of five hundred, so
  the counts are countable. <span class="mono">eps</span> is fixed at {EPS} metres
  and <span class="mono">minPts</span> at {MINPTS} throughout this section.
</p>

<section class="side-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="chart-header">
        <span class="chart-title">{view.title}</span>
        <span class="chart-sub">{view.sub}</span>
      </div>
      <MapPanel
        pts={PATCH}
        ext={PATCH_EXTENT}
        ticks={TICKS}
        ticksY={TICKS_Y}
        core={core}
        eps={view.eps}
        labels={view.labels}
        roles={view.roles}
        rings={view.rings}
        discs={view.discs}
        dotR={3.1}
        maxHeight={280}
      />
      <div class="legend">
        {#if view.roles}
          <span class="key"><i class="dot core" />core</span>
          <span class="key"><i class="dot border" />border</span>
          <span class="key"><i class="dot noise" />noise</span>
        {:else}
          <span class="key"><i class="dot ink" />in the cluster</span>
          <span class="key"><i class="dot noise" />not reached</span>
          <span class="key"><i class="circ" />a circle of radius {EPS} m</span>
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
  .side-section { position: relative; margin-top: 2rem; display: flex; align-items: flex-start; }
  .steps-container { flex: 1 1 38%; z-index: 10; }

  .sticky-container {
    position: sticky;
    top: 7vh;
    flex: 1 1 62%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 82vh;
  }

  .chart-box {
    width: 96%;
    max-width: 560px;
    background: #ffffff;
    border-radius: 10px;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .chart-header {
    display: flex; justify-content: space-between; align-items: baseline;
    flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.35rem;
  }
  .chart-title { font-family: var(--font-main); font-size: 0.9rem; font-weight: 700; color: var(--squidink); }
  .chart-sub { font-family: var(--font-mono, monospace); font-size: 0.74rem; color: #718096; }

  .legend {
    display: flex; flex-wrap: wrap; gap: 0.4rem 0.85rem; margin-top: 0.45rem;
    font-family: var(--font-main); font-size: 0.7rem; color: #4a5568;
  }
  .key { display: inline-flex; align-items: center; gap: 0.28rem; }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .dot.core { background: #232f3e; }
  .dot.ink { background: #232f3e; }
  .dot.border { background: #ff9900; }
  .dot.noise { background: #8a94a2; }
  .circ { width: 11px; height: 11px; border-radius: 50%; display: inline-block; border: 1.4px dashed #7c5aed; }

  .step { height: 100vh; display: flex; justify-content: center; align-items: center; }

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

  /*
    Column, not column-reverse. A sticky element sticks within its containing
    block starting from where it sits in the flow, so putting it LAST - which
    is what column-reverse does with this DOM order - means it is below the
    viewport for the whole section and only appears at the very end. On a phone
    the chart has to be the first thing in the column and the steps scroll
    underneath it, which is also the only arrangement where the reader can see
    both at once.
  */
  /*
    On a phone the two panels share one column, so two things have to be true
    at once and the obvious CSS gets both wrong.

    The chart must be FIRST in the flow - a sticky element sticks from where it
    sits, so column-reverse leaves it below the viewport for the whole section
    and it only appears at the end.

    And the chart must be the layer ON TOP, with an opaque background. The
    desktop rule puts the steps above it, which is harmless when they are side
    by side and, stacked, means every card scrolls across the picture it is
    describing. This is the failure the house notes record from two earlier
    articles; the fix is to let the cards pass behind an opaque chart, and
    check-browser.mjs now asserts that nothing is painted over it.
  */
  @media screen and (max-width: 950px) {
    .side-section { flex-direction: column; }
    .steps-container { pointer-events: none; width: 100%; z-index: 1; }
    .sticky-container {
      top: 0;
      min-height: 0;
      height: 40vh;
      /* Explicit, because .side-section's `align-items: flex-start` controls
         the HORIZONTAL axis once the direction is column, so this box shrinks
         to fit its contents and the opaque background stops short of the
         screen edge - leaving a strip down the side where the card behind
         shows through. */
      width: 100%;
      align-items: flex-start;
      z-index: 20;
      background: var(--paper);
      padding: 1vh 0 0.6rem 0;
    }
    .chart-box { width: 100%; padding: 0.6rem; }
    .step { height: 92vh; align-items: flex-end; padding-bottom: 3vh; }
    .step-content { width: 96%; max-width: 640px; font-size: 0.9rem; padding: 0.9rem 1rem; background: #ffffff; }
  }
</style>
