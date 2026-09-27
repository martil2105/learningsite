<script>
  /*
    The property nobody states because everybody assumes the opposite.

    Live rather than precomputed: the reader presses the button, the rows are
    shuffled, DBSCAN is run again on the same data with the same parameters,
    and the pings that changed cluster are ringed. One run is O(n^2) on 324
    pings, which is a couple of milliseconds.
  */
  import MapPanel from "./MapPanel.svelte";
  import { byId, scene, dbscan, canonicalPartition, mulberry32, PRE, num, int, M_DEFAULT } from "../experiments.js";

  const ID = "platforms";
  const sc = byId(ID);
  const pre = PRE.scenarios.find((s) => s.id === ID);
  const EPS = pre.order.eps;
  const S = scene(ID, M_DEFAULT);

  const rand = mulberry32(20260910);
  const baseline = dbscan(sc.pts, EPS, M_DEFAULT, { D: S.D, core: S.core });
  const baseCanon = canonicalPartition(baseline.labels).split(",");

  let run = baseline;
  let canon = baseCanon;
  let shuffles = 0;
  let changed = [];
  const seen = new Set([baseCanon.join(",")]);

  function shuffle() {
    const n = sc.pts.length;
    const ord = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [ord[i], ord[j]] = [ord[j], ord[i]];
    }
    run = dbscan(sc.pts, EPS, M_DEFAULT, { D: S.D, core: S.core, order: ord });
    canon = canonicalPartition(run.labels).split(",");
    seen.add(canon.join(","));
    changed = canon.map((v, i) => (v !== baseCanon[i] ? i : -1)).filter((i) => i >= 0);
    shuffles++;
  }
  function reset() {
    run = baseline;
    canon = baseCanon;
    changed = [];
    shuffles = 0;
  }

  // Sentences in the script: an {#if} strips the leading space of its body.
  $: line =
    shuffles === 0
      ? "Same data, same eps, same minPts. Press the button."
      : changed.length === 0
      ? "Shuffle " + shuffles + ": identical to the first run."
      : "Shuffle " + shuffles + ": " + changed.length +
        (changed.length === 1 ? " ping is" : " pings are") + " in a different cluster than they were.";
  $: seenLine = seen.size + (seen.size === 1 ? " distinct answer so far" : " distinct answers so far");
</script>

<h1 class="body-header">Two things that will bite you</h1>

<h2 class="sub-header">DBSCAN isn't deterministic</h2>

<p class="body-text">
  Let's return to the border pings from the walkthrough, which aren't crowded
  enough to be core but are close enough to a core ping to be swept in. The
  original definition says a border ping belongs to a cluster it's
  density-reachable from, but if it's reachable from two clusters, it doesn't
  say which one. Every implementation resolves that the same way, by giving the
  ping to whichever cluster gets there first, which means the answer depends on
  the order of the rows. Try shuffling them below.
</p>

<div class="figwrap">
  <div class="card">
    <div class="head">
      <span class="title">Two platforms, eps = {num(EPS, 2)} m, minPts = {M_DEFAULT}</span>
      <span class="sub mono">{seenLine}</span>
    </div>
    <MapPanel pts={sc.pts} labels={run.labels} core={S.core} eps={EPS} rings={changed} maxHeight={300} dotR={2.1} />
    <div class="controls">
      <button class="go" on:click={shuffle}>shuffle the rows</button>
      <button class="reset" on:click={reset}>reset</button>
      <span class="readout" class:bad={changed.length > 0}>{line}</span>
    </div>
  </div>
</div>

<p class="body-text">
  If we sweep <span class="mono">eps</span> and repeat this
  {pre.order.trials} times at each value, the worst case on this day is
  <span class="bold">{pre.order.partitions} different answers</span> from
  {pre.order.trials} orderings at <span class="mono">eps = {num(pre.order.eps, 2)} m</span>,
  with {pre.order.flips} pings moving between clusters. There are
  {pre.order.border} border pings at that setting, and they're exactly the ones
  that can move.
</p>

<p class="body-text">
  That's a small effect, but it isn't nothing: if you run
  <span class="mono">df.sample(frac=1)</span> before clustering, your cluster
  sizes change. It's also why HDBSCAN is built on DBSCAN*, in which a non-core
  ping is simply noise. A hierarchy needs the clusters at each level to nest
  inside the clusters at the level above, and a ping that belongs to whichever
  neighbour asked first doesn't nest. So <span class="mono">hdbscan</span> with
  <span class="mono">cluster_selection_epsilon</span> set isn't the same
  algorithm as <span class="mono">DBSCAN(eps=…)</span>, and the difference is
  precisely these pings.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 1.6rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  .figwrap { display: flex; justify-content: center; margin: 1.3rem auto; padding: 0 0.75rem; }
  .card {
    width: 100%; max-width: 620px; background: #fff; border-radius: 10px;
    padding: 1rem 1.1rem 0.9rem 1.1rem; border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }
  .head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem; }
  .title { font-family: var(--font-main); font-size: 0.88rem; font-weight: 700; color: var(--squidink); }
  .sub { font-size: 0.73rem; color: #718096; }

  .controls { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; margin-top: 0.55rem; }
  .go {
    font-family: var(--font-main); font-size: 0.76rem; font-weight: 700; padding: 0.4rem 0.7rem;
    border: 1px solid var(--violet); background: var(--violet); color: #fff; border-radius: 5px; cursor: pointer;
  }
  .go:hover { filter: brightness(1.08); }
  .reset {
    font-family: var(--font-main); font-size: 0.74rem; border: none; background: none;
    color: var(--violet); cursor: pointer; padding: 0; text-decoration: underline;
  }
  .readout { font-family: var(--font-main); font-size: 0.78rem; color: #4a5568; margin-left: auto; }
  .readout.bad { color: #df2a5d; font-weight: 700; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .card { padding: 0.8rem 0.7rem 0.7rem 0.7rem; }
    .readout { margin-left: 0; }
  }
</style>
