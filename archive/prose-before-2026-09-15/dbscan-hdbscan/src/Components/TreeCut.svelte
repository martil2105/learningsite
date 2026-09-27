<script>
  /*
    The claim the article exists to make, and the figure that makes it
    checkable: a value of eps is a horizontal line drawn across a tree.

    The tree is the mutual-reachability MST, condensed so branches holding
    fewer than MCS pings are not drawn separately. The map beside it drops
    those same small clusters, so the two panels always agree - a reader who
    counts branches crossed and clusters on the map gets the same number.
  */
  import TreeFig from "./TreeFig.svelte";
  import MapPanel from "./MapPanel.svelte";
  import katexify from "../katexify.js";
  import { DATA, scene, treeOf, verdict, epsOf, byId, num, int, M_DEFAULT } from "../experiments.js";
  import { hue, INK } from "../palette.js";

  const MCS = 10;
  /* 5.0 rather than 6.4 on the café day: 6.399 is the exact height at which
     the two shops merge, and opening a figure standing on a threshold shows
     the reader the "after" before they have seen the "before". */
  const START = { platforms: 9.0, "cafe-bakery-park": 5.0, "whole-day": 14.0 };
  let id = "cafe-bakery-park";
  let eps = START[id];

  const eqPath = katexify(
    "a \\sim_\\varepsilon b \\iff \\exists\\, a = p_0, p_1, \\ldots, p_k = b \\;\\text{ with }\\; d_{\\text{mreach}}(p_{i-1}, p_i) \\le \\varepsilon",
    true
  );

  $: S = scene(id, M_DEFAULT);
  $: T = treeOf(S, MCS);
  $: shot = S.at(eps, MCS);
  $: vd = verdict(S.sc, shot.rec, shot.nClusters);
  $: crossings = T.nodes.filter((nd) => eps > Math.min(epsOf(nd.death), 40) && eps <= Math.min(epsOf(nd.birth), 1e9)).length;
  $: fullNodes = S.link.nodes.length;

  /* Which stop each drawn branch is mostly made of. This is ground truth and
     it is being used deliberately: the figure's whole job is to show that the
     branches you want do not line up, so it has to say which ones you want. */
  $: marks = (() => {
    const n = S.sc.pts.length;
    const parentOf = new Map();
    const fell = new Int32Array(n).fill(-1);
    for (const r of T.cond.rows) {
      if (r.child >= n) parentOf.set(r.child, r.parent);
      else fell[r.child] = r.parent;
    }
    // every ancestor a ping was ever in
    const counts = new Map();
    for (let p = 0; p < n; p++) {
      const g = S.sc.stop[p];
      if (g < 0) continue;
      let c = fell[p];
      while (c !== undefined && c >= n) {
        if (!counts.has(c)) counts.set(c, new Array(S.sc.nStops).fill(0));
        counts.get(c)[g]++;
        c = parentOf.get(c);
      }
    }
    const sizes = Array.from({ length: S.sc.nStops }, (_, g) => S.sc.stop.filter((s) => s === g).length);
    const out = [];
    for (let g = 0; g < S.sc.nStops; g++) {
      /*
        The branch that IS this stop: the shallowest one holding most of it and
        almost none of anything else. Shallowest, not deepest - a deep
        sub-branch can also hold 80% of a stop while spanning almost no height
        at all, and marking that one turns a four-metre span into a degenerate
        point. Its parent is excluded by the purity test, which is what makes
        "shallowest" the right end to take.
      */
      let best = null;
      for (const [c, arr] of counts.entries()) {
        if (arr[g] < 0.8 * sizes[g]) continue;
        if (arr.some((v, h) => h !== g && v >= 0.2 * sizes[h])) continue;
        if (best === null || c < best) best = c;
      }
      if (best !== null) out.push({ id: best, label: S.sc.stopNames[g], colour: hue(g), stop: g });
    }
    return out;
  })();

  $: spans = marks.map((mk) => {
    const nd = T.byId.get(mk.id);
    return { ...mk, lo: epsOf(nd.death), hi: epsOf(nd.birth), size: nd.size };
  });
  $: overlapLo = spans.length ? Math.max(...spans.map((s) => s.lo)) : 0;
  $: overlapHi = spans.length ? Math.min(...spans.map((s) => s.hi)) : 0;
  $: overlaps = overlapLo < overlapHi;
  $: spanLine = overlaps
    ? "every branch you want exists at once for eps between " + num(overlapLo, 1) + " and " + num(overlapHi, 1) + " m"
    : "no height crosses all " + spans.length + " of them: the highest floor is " + num(overlapLo, 1) +
      " m and the lowest ceiling is " + num(overlapHi, 1) + " m";
  $: crossLine = crossings + (crossings === 1 ? " branch crossed" : " branches crossed");
</script>

<h1 class="body-header">The sweep is a tree</h1>

<p class="body-text">
  Go back to the slider for a moment and notice something about it. As
  <span class="mono">eps</span> grows, clusters only ever <em>merge</em>. A
  ping that has joined a cluster cannot leave it, and two clusters that have
  become one cannot come apart again — a larger radius can only add edges. So
  the whole sweep is a merge history, and a merge history is a tree.
</p>

<p class="body-text">
  That is not an analogy. It is an identity, and it is the reason this article
  is built the way it is. Two pings are in the same DBSCAN* cluster at
  <span class="mono">eps</span> exactly when there is a chain of pings between
  them on which every ping is core and every step is at most
  <span class="mono">eps</span> — and with the mutual reachability distance
  from the last section, both of those conditions collapse into one:
</p>

<div class="eq">{@html eqPath}</div>

<p class="body-text">
  Which is the definition of being connected in the single-linkage hierarchy of
  <span class="mono">d<sub>mreach</sub></span>, and a minimum spanning tree
  records that for every threshold at once. So <span class="bold">one tree,
  computed once, contains every answer DBSCAN* can give on this data</span> —
  not approximately, and not for a grid of values. Running brute-force DBSCAN*
  and reading the tree instead, at every <span class="mono">eps</span> the sweep
  can tell apart, across three days and three values of
  <span class="mono">minPts</span>: 3,581 thresholds, zero disagreements.
</p>

<p class="body-text">
  And a value of <span class="mono">eps</span> is a horizontal line drawn across
  that tree. Whatever branches the line crosses are the clusters. That is not a
  way of thinking about DBSCAN — it is the complete description of what DBSCAN
  is able to say.
</p>

<div class="figwrap">
  <div class="card">
    <div class="head">
      <span class="title">One tree, and a line across it</span>
      <div class="pills" role="group" aria-label="which day">
        {#each DATA as d}
          <button class="pill" class:on={id === d.id} on:click={() => { id = d.id; eps = START[d.id]; }} aria-pressed={id === d.id}>{d.name}</button>
        {/each}
      </div>
    </div>

    <div class="panes">
      <div class="pane">
        <TreeFig tree={T} {eps} onEps={(v) => (eps = v)} height={300} yMax={40} {marks} />
      </div>
      <div class="pane">
        <MapPanel pts={S.sc.pts} labels={shot.labels} core={S.core} {eps} maxHeight={286} minHeight={240} dotR={1.9} />
      </div>
    </div>

    <div class="legend">
      {#each spans as s}
        <span class="key"><i class="sq" style="background:{s.colour}" />{s.label}: eps {num(s.lo, 1)}–{num(s.hi, 1)} m</span>
      {/each}
    </div>

    <div class="controls">
      <label class="slider">
        <span class="clabel">eps</span>
        <input type="range" min="0.2" max="40" step="0.1" bind:value={eps} aria-label="eps, the height of the cut, in metres" />
        <span class="cvalue">{num(eps, 1)} m</span>
      </label>
      <span class="crossed">{crossLine}</span>
    </div>

    <div class="readout" class:good={vd.ok} class:bad={!vd.ok}>{vd.line}</div>
    <p class="cap">
      Both panels drop clusters of fewer than {MCS} pings, so the branches the
      line crosses and the regions on the map are the same objects — plain
      DBSCAN would report the small ones too. And this is a summary: the
      hierarchy it was condensed from has {fullNodes} internal nodes, one per
      merge, rather than {T.nodes.length}.
    </p>
  </div>
</div>

<p class="body-text">
  Now switch to the café day and read the three spans under the figure. The
  café's branch exists as its own cluster between
  {num(spans[0] ? spans[0].lo : 0, 1)} and {num(spans[0] ? spans[0].hi : 0, 1)} metres;
  below that it comes apart, above it the bakery has joined it. The bakery's
  runs from {num(spans[1] ? spans[1].lo : 0, 1)} to {num(spans[1] ? spans[1].hi : 0, 1)}.
  The park's does not begin until {num(spans[2] ? spans[2].lo : 0, 1)}.
  <span class="bold">{spanLine}.</span>
</p>

<p class="body-text">
  That is what "no <span class="mono">eps</span> works" is, structurally. Not a
  sensitive parameter, not a hard search, not a compromise between two
  objectives. A horizontal line has one height; this data has branches at three.
  You could search the whole real line and the answer would be the same,
  because the shape of the answer is wrong before any number goes into it.
</p>

<p class="body-text">
  Which is a much better position to be in than "the tuning is difficult",
  because it tells you what to change. Do not look for a better height. Stop
  cutting straight.
</p>

<style>
  .eq { max-width: 600px; margin: 1.1rem auto; overflow-x: auto; overflow-y: hidden; padding: 0.15rem 0; }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  .figwrap { display: flex; justify-content: center; margin: 1.5rem auto 1.2rem auto; padding: 0 0.75rem; }
  .card {
    width: 100%; max-width: 860px; background: #fff; border-radius: 10px;
    padding: 1rem 1.1rem 0.9rem 1.1rem; border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }
  .head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; }
  .title { font-family: var(--font-main); font-size: 0.9rem; font-weight: 700; color: var(--squidink); }

  /* flex-basis 0 with min-width 0 rather than a computed half: asking for
     604px of a 603px row is how a panel ends up below the fold with every
     check still green. */
  .panes { display: flex; gap: 14px; align-items: flex-start; }
  .pane { flex: 1 1 0; min-width: 0; }

  .pills { display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; }
  .pill {
    font-family: var(--font-main); font-size: 0.72rem; line-height: 1; padding: 0.34rem 0.5rem;
    border: 1px solid #dbe1e8; background: #fff; color: #4a5568; border-radius: 5px; cursor: pointer;
  }
  .pill:hover { border-color: var(--violet); }
  .pill.on { background: var(--violet); border-color: var(--violet); color: #fff; font-weight: 700; }

  .legend {
    display: flex; flex-wrap: wrap; gap: 0.35rem 0.9rem; margin-top: 0.5rem;
    font-family: var(--font-main); font-size: 0.72rem; color: #4a5568;
  }
  .key { display: inline-flex; align-items: center; gap: 0.32rem; }
  .sq { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }

  .controls { display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap; margin-top: 0.5rem; }
  .slider { display: flex; align-items: center; gap: 0.5rem; flex: 1 1 240px; min-width: 200px; }
  .slider input { flex: 1 1 auto; min-width: 0; accent-color: var(--violet); }
  .clabel { font-family: var(--font-mono, monospace); font-size: 0.76rem; color: #718096; }
  .cvalue { font-family: var(--font-mono, monospace); font-size: 0.76rem; color: var(--squidink); font-weight: 700; min-width: 3.6rem; }
  .crossed { font-family: var(--font-main); font-size: 0.75rem; color: #7c5aed; font-weight: 700; }

  .readout { font-family: var(--font-main); font-size: 0.82rem; font-weight: 700; margin-top: 0.45rem; min-height: 1.1rem; }
  .readout.bad { color: #df2a5d; }
  .readout.good { color: #2f7d32; }

  .cap { font-family: var(--font-main); font-size: 0.73rem; line-height: 1.5; color: #9aa5b1; margin: 0.4rem 0 0 0; }

  @media screen and (max-width: 950px) {
    .eq { max-width: 80%; }
    .card { padding: 0.8rem 0.7rem 0.7rem 0.7rem; }
    .panes { flex-direction: column; }
    .pane { width: 100%; }
    .pill { font-size: 0.68rem; padding: 0.3rem 0.42rem; }
  }
</style>
