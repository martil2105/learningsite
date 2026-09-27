<script>
  /*
    The payoff: cut every branch at its own height.

    The min_cluster_size slider is live because the expensive work - the
    distance matrix and the mutual reachability MST - was done once when the
    scene was built. Condensing and selecting from a finished tree is
    milliseconds, which is why the reader can drag it rather than step through
    frames somebody chose in advance.
  */
  import CondensedFig from "./CondensedFig.svelte";
  import MapPanel from "./MapPanel.svelte";
  import katexify from "../katexify.js";
  import { DATA, scene, treeOf, verdict, epsOf, PRE, num, int, pct, M_DEFAULT, MCS_DEFAULT } from "../experiments.js";
  import { hue } from "../palette.js";

  let id = "cafe-bakery-park";
  let mcs = MCS_DEFAULT;

  const eqLambda = katexify("\\lambda = \\frac{1}{\\varepsilon}", false);
  const eqStab = katexify(
    "S(C) \\;=\\; \\sum_{p \\in C} \\big(\\lambda_{\\text{leave}}(p) - \\lambda_{\\text{birth}}(C)\\big)",
    true
  );
  const eqPick = katexify("\\text{keep } C \\iff S(C) > \\textstyle\\sum_{C' \\text{ a child of } C} \\hat{S}(C')", true);

  $: S = scene(id, M_DEFAULT);
  $: T = treeOf(S, mcs);
  $: vd = verdict(S.sc, T.rec, T.nClusters);
  $: picked = T.nodes.filter((n) => n.selected).sort((a, b) => a.id - b.id);
  $: cutLine =
    picked.length < 2
      ? "one cut"
      : "cuts at " + picked.map((n) => num(Math.min(epsOf(n.birth), 99), 1)).sort((a, b) => a - b).join(", ") + " m";
  $: spread = picked.length < 2 ? 0 : Math.max(...picked.map((n) => epsOf(n.birth))) - Math.min(...picked.map((n) => epsOf(n.birth)));

  const SS = PRE.stabilityScale;
  const half = SS.find((r) => r.scale === 0.5);
  const quarter = SS.find((r) => r.scale === 0.25);
</script>

<h1 class="body-header">Cut every branch at its own height</h1>

<p class="body-text">
  The tree has every answer in it and DBSCAN takes one horizontal slice. The
  obvious alternative is to go branch by branch and ask a local question:
  <em>is this branch worth keeping, on its own terms?</em> HDBSCAN is that
  question, made precise in two steps.
</p>

<h2 class="sub-header">One: throw away the branches that are not places</h2>

<p class="body-text">
  Most of the tree is noise in the literal sense — two pings that happened to
  be near each other, forming a branch of size two that exists over a few
  centimetres of <span class="mono">eps</span> before something absorbs it. So
  pick a <span class="mono">min_cluster_size</span> and walk
  down from the root. At each split, if both sides are at least that big, it was
  a real split and both sides become clusters. If only one side is, the small
  side did not split off — it <em>fell off</em>, and its pings leave the cluster
  at that level while the cluster carries on. If neither is, the cluster has
  come apart, and everything still in it leaves.
</p>

<p class="body-text">
  That is called condensing, and it turns a tree with hundreds of internal nodes
  into one with a handful. Crucially the parameter is a <span class="bold">count
  of pings</span>, not a distance. "I do not care about places I visited for
  under ten minutes" is an opinion you can have. "I do not care about places
  smaller than 8.4 metres" is not really an opinion about anything.
</p>

<h2 class="sub-header">Two: keep the branches that persist</h2>

<p class="body-text">
  Write {@html eqLambda} — so a big {@html katexify("\\lambda")} means dense —
  and measure a cluster by how long its pings stay in it:
</p>

<div class="eq">{@html eqStab}</div>

<p class="body-text">
  A ping that joined the cluster at its birth and stayed until the cluster died
  contributes the full height of the branch; one that dropped out early
  contributes a sliver. Add them up and you have the branch's
  <span class="bold">stability</span> — literally the mass of density sitting
  above the level where the cluster came into existence. Then choose greedily,
  from the bottom up:
</p>

<div class="eq">{@html eqPick}</div>

<p class="body-text">
  Keep a branch if it is more stable than everything below it put together;
  otherwise pass its children up unchanged. The root is not eligible, because
  "it is all one cluster" is an answer HDBSCAN declines to give.
</p>

<div class="figwrap">
  <div class="card">
    <div class="head">
      <span class="title">The condensed tree, and what it selects</span>
      <div class="pills" role="group" aria-label="which day">
        {#each DATA as d}
          <button class="pill" class:on={id === d.id} on:click={() => (id = d.id)} aria-pressed={id === d.id}>{d.name}</button>
        {/each}
      </div>
    </div>

    <div class="panes">
      <div class="pane">
        <CondensedFig tree={T} height={318} yMax={40} />
      </div>
      <div class="pane">
        <MapPanel pts={S.sc.pts} labels={T.labels} colourByCluster={true} maxHeight={304} minHeight={250} dotR={2.3} />
      </div>
    </div>

    <div class="controls">
      <label class="slider">
        <span class="clabel">min_cluster_size</span>
        <input type="range" min="3" max="60" step="1" bind:value={mcs} aria-label="min_cluster_size, in pings" />
        <span class="cvalue">{mcs}</span>
      </label>
      <span class="crossed">{cutLine}</span>
    </div>

    <div class="readout" class:good={vd.ok} class:bad={!vd.ok}>{vd.line}</div>
    <p class="cap">
      Ribbon width is how many pings the branch still holds; filled ribbons are
      the ones selected. Coloured bars mark where each selected branch was cut.
      On the map, colour is cluster identity — the same colour as the ribbon it
      came from — and grey is noise.
    </p>
  </div>
</div>

<p class="body-text">
  There is the whole difference, and it is visible rather than argued. The
  coloured bars are the cuts, and they are not level.
  {#if spread > 0.5}
    On this day they are spread over {num(spread, 1)} metres of
    <span class="mono">eps</span>, which is exactly the range a single value
    could not cover.
  {:else}
    On this day they happen to be nearly level, which is what an easy dataset
    looks like — the horizontal line would have worked here too.
  {/if}
  Nothing about the tree changed; the tree is the same object DBSCAN was
  slicing. What changed is that the answer is now allowed to have more than one
  number in it.
</p>

<h2 class="sub-header">The unit stability is measured in</h2>

<p class="body-text">
  One wrinkle worth knowing, because it is a real property of the criterion and
  it is rarely mentioned. {@html katexify("\\lambda")} is one over a distance,
  so stability is measured in <span class="bold">pings per metre</span>. Scale
  a whole dataset by <span class="mono">s</span> and every stability scales by
  exactly <span class="mono">1/s</span> — which is fine, because everything
  scaled and the selection is unchanged.
</p>

<p class="body-text">
  What is less fine is what happens when only <em>part</em> of the data scales.
  Take two identical clusters, side by side, and shrink one of them: at half the
  size it is <span class="bold">{num(half.ratio, 2)}×</span> as stable as its
  twin, and at a quarter, <span class="bold">{num(quarter.ratio, 2)}×</span> —
  the scale factor, to two decimals, from a pair of clusters that are the same
  shape and the same size in pings. So the criterion carries a systematic
  preference for the denser candidate, inside the algorithm whose entire selling
  point is coping with clusters of different density.
</p>

<p class="body-text">
  It does not break anything here — the loose one still gets selected, because
  it is competing against its own children rather than against the compact one.
  But it is the thing to look at first when HDBSCAN returns a big coarse cluster
  where you expected two, and it is why
  <span class="mono">cluster_selection_method="leaf"</span> exists: it takes the
  deepest branches instead of the most stable ones, and gives up the excess-of-
  mass argument in exchange for not having this thumb on the scale.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
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

  .panes { display: flex; gap: 14px; align-items: flex-start; }
  .pane { flex: 1 1 0; min-width: 0; }

  .pills { display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; }
  .pill {
    font-family: var(--font-main); font-size: 0.72rem; line-height: 1; padding: 0.34rem 0.5rem;
    border: 1px solid #dbe1e8; background: #fff; color: #4a5568; border-radius: 5px; cursor: pointer;
  }
  .pill:hover { border-color: var(--violet); }
  .pill.on { background: var(--violet); border-color: var(--violet); color: #fff; font-weight: 700; }

  .controls { display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap; margin-top: 0.5rem; }
  .slider { display: flex; align-items: center; gap: 0.5rem; flex: 1 1 260px; min-width: 220px; }
  .slider input { flex: 1 1 auto; min-width: 0; accent-color: var(--violet); }
  .clabel { font-family: var(--font-mono, monospace); font-size: 0.74rem; color: #718096; }
  .cvalue { font-family: var(--font-mono, monospace); font-size: 0.76rem; color: var(--squidink); font-weight: 700; min-width: 1.8rem; }
  .crossed { font-family: var(--font-main); font-size: 0.75rem; color: #7c5aed; font-weight: 700; }

  .readout { font-family: var(--font-main); font-size: 0.82rem; font-weight: 700; margin-top: 0.45rem; min-height: 1.1rem; }
  .readout.bad { color: #df2a5d; }
  .readout.good { color: #2f7d32; }
  .cap { font-family: var(--font-main); font-size: 0.73rem; line-height: 1.5; color: #9aa5b1; margin: 0.4rem 0 0 0; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .eq { max-width: 80%; }
    .card { padding: 0.8rem 0.7rem 0.7rem 0.7rem; }
    .panes { flex-direction: column; }
    .pane { width: 100%; }
    .pill { font-size: 0.68rem; padding: 0.3rem 0.42rem; }
  }
</style>
