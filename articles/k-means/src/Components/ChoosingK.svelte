<script>
  /*
    Choosing k. A small second interactive, deliberately not folded into the
    hook: the house rule is one manipulable object per figure, and piling a k
    selector onto the centroid drag would have made both illegible.

    The toggle is the argument. The same two criteria are run on data with three
    real groups and on 150 points drawn uniformly from a box, and neither
    criterion has any way of saying "there is nothing here". That comparison,
    done properly with a reference distribution instead of by eye, is the gap
    statistic - which is worth saying out loud, because it makes the toggle a
    demonstration of a method rather than a rhetorical trick.

    Points are not coloured by cluster here. k runs to 8 and this project has
    three validated categorical colours; the cells carry the clustering instead.
  */
  import { scaleLinear } from "d3-scale";
  import { MAIN, UNIFORM, extent } from "../datasets.js";
  import { voronoiCells, polygonPath } from "../voronoi.js";
  import { fitEqual } from "../plot.js";
  import { ELBOW, NOISE, BEST_SILHOUETTE_K, NOISE_BEST_K, int } from "../experiments.js";
  import { INK, FAINT, ACCENT, CLUSTER_COLORS } from "../palette.js";

  const SETS = {
    structure: { label: "Three real groups", points: MAIN, curve: ELBOW, ext: extent(MAIN, 0.08) },
    noise: { label: "Pure noise", points: UNIFORM, curve: NOISE, ext: extent(UNIFORM, 0.08) },
  };

  let which = "structure";
  let k = 3;
  $: set = SETS[which];
  $: maxK = set.curve.length;
  $: kk = Math.min(k, maxK);
  $: entry = set.curve[kk - 1];
  $: cells = voronoiCells(entry.centroids, set.ext);

  function choose(name) {
    which = name;
    if (k > SETS[name].curve.length) k = SETS[name].curve.length;
  }

  let width = 320;
  /*
    A measured width can arrive as 0 - the binding fires before layout, and a
    sticky panel that is momentarily zero-width reports zero. Every scale built
    from it then has an inverted range, which shows up as a negative <rect>
    width in the console and, in the worst case, as a chart drawn backwards.
    Clamp once, here, and use the clamped value everywhere below.
  */
  $: W = Math.max(260, width);
  $: narrow = W < 520;
  $: SH = narrow ? 210 : 250;
  $: p = fitEqual(set.ext, W, SH, { top: 8, right: 8, bottom: 8, left: 8 });
  $: r = narrow ? 2.2 : 2.7;

  // -------------------------------------------------------- the two curves
  // Floored, with a pixel to spare: see the note in ScrollCenter.svelte.
  $: cw = narrow ? W : Math.floor((W - 16) / 2);
  const CH = 168;
  $: cMargin = { top: 20, right: 10, bottom: 30, left: 42 };
  $: cPlotW = Math.max(90, cw - cMargin.left - cMargin.right);
  $: cPlotH = CH - cMargin.top - cMargin.bottom;
  $: xK = scaleLinear().domain([1, maxK]).range([cMargin.left, cMargin.left + cPlotW]);
  $: yIn = scaleLinear()
    .domain([0, Math.max(...set.curve.map((e) => e.inertia))])
    .range([cMargin.top + cPlotH, cMargin.top]);
  $: ySil = scaleLinear().domain([0, 0.75]).range([cMargin.top + cPlotH, cMargin.top]);
  // Reactive: both close over xK / yIn / ySil, which change with the measured
  // W. As plain consts the paths would freeze at the first render's scales.
  $: inPath = set.curve.map((e, i) => (i ? "L" : "M") + " " + xK(e.k) + " " + yIn(e.inertia) + " ").join("");
  $: silPath = set.curve
    .filter((e) => e.silhouette !== null)
    .map((e, i) => (i ? "L" : "M") + " " + xK(e.k) + " " + ySil(e.silhouette) + " ")
    .join("");
  $: bestSilK = which === "structure" ? BEST_SILHOUETTE_K : NOISE_BEST_K.k;
  // Built in script rather than in the template: Svelte trims the leading space
  // off an {#if} block's contents, which silently glued "26,231" to "\u00b7 silhouette".
  $: footText =
    "k = " + kk + " \u00b7 inertia " + int(entry.inertia) +
    (entry.silhouette !== null ? " \u00b7 silhouette " + entry.silhouette.toFixed(2) : "") +
    " \u2014 silhouette peaks at k = " + bestSilK + ".";
</script>

<h1 class="body-header">Choosing k, and the criteria that can't help</h1>

<p class="body-text">
  So far, we haven't said where <em>k</em> comes from. It's an input, and the
  algorithm will happily return four clusters, or eleven, from the same points.
  The obvious approach is to try several values and pick the best one. The
  problem is that inertia falls every time we add a cluster, all the way down to
  zero when every point is its own centroid. This means the objective can't
  choose k for us, because minimising it always says "more".
</p>

<p class="body-text">
  Instead, people usually look for the bend in the curve: the value of k after
  which adding clusters stops improving things by much. Since that's a judgement
  call dressed up as a measurement, they often ask for a second opinion as well.
  The most common one is the <span class="bold">silhouette</span>, which isn't
  the k-means objective at all. For each point, it compares how far the point
  sits from its own cluster with how far it sits from the nearest other cluster.
</p>

<div class="card">
  <div class="measure" bind:clientWidth={width} />

  <div class="card-head">
    <span class="card-title">The same two criteria, two datasets</span>
    <div class="toggle">
      {#each Object.entries(SETS) as [name, s]}
        <button class="pill" class:on={which === name} on:click={() => choose(name)}>{s.label}</button>
      {/each}
    </div>
  </div>

  <svg viewBox="0 0 {W} {SH}" width={W} height={SH}>
    <rect x={p.box.x} y={p.box.y} width={p.box.w} height={p.box.h} fill="#fbfcfd" stroke={FAINT} />
    {#each cells as poly}
      <!-- The cells ARE the clustering here, since the points are left ink-coloured:
           they need to be visible, not a hairline. Violet ties them to the centroid
           markers and never sits beside a cluster-coloured mark in this figure. -->
      <path d={polygonPath(poly, p)} fill="#f7f6fd" stroke={ACCENT} stroke-opacity="0.55" stroke-width="1.2" />
    {/each}
    {#each set.points as d}
      <circle cx={p.X(d.x)} cy={p.Y(d.y)} {r} fill={INK} fill-opacity="0.55" />
    {/each}
    {#each entry.centroids as c}
      <path
        d="M {p.X(c.x)} {p.Y(c.y) - 7} L {p.X(c.x) + 7} {p.Y(c.y)} L {p.X(c.x)} {p.Y(c.y) + 7} L {p.X(c.x) - 7} {p.Y(c.y)} Z"
        fill={ACCENT}
        stroke="#ffffff"
        stroke-width="2"
      />
    {/each}
  </svg>

  <div class="k-row">
    <span class="k-label">k</span>
    {#each set.curve as e}
      <button class="kbtn" class:on={kk === e.k} on:click={() => (k = e.k)}>{e.k}</button>
    {/each}
  </div>

  <div class="curves">
    <svg viewBox="0 0 {cw} {CH}" width={cw} height={CH}>
      <text class="c-title" x={cMargin.left} y="12">inertia</text>
      {#each yIn.ticks(4) as t}
        <line class="grid" x1={cMargin.left} x2={cMargin.left + cPlotW} y1={yIn(t)} y2={yIn(t)} />
        <text class="tick" x={cMargin.left - 6} y={yIn(t) + 3.5} text-anchor="end">{Math.round(t / 1000)}k</text>
      {/each}
      <path d={inPath} fill="none" stroke={CLUSTER_COLORS[0]} stroke-width="2" />
      {#each set.curve as e}
        <circle cx={xK(e.k)} cy={yIn(e.inertia)} r={kk === e.k ? 5 : 3} fill={CLUSTER_COLORS[0]} stroke="#fff" stroke-width="1.4" />
      {/each}
      {#each set.curve as e}
        <text class="tick" x={xK(e.k)} y={CH - 12} text-anchor="middle">{e.k}</text>
      {/each}
    </svg>

    <svg viewBox="0 0 {cw} {CH}" width={cw} height={CH}>
      <text class="c-title" x={cMargin.left} y="12">mean silhouette</text>
      {#each ySil.ticks(4) as t}
        <line class="grid" x1={cMargin.left} x2={cMargin.left + cPlotW} y1={ySil(t)} y2={ySil(t)} />
        <text class="tick" x={cMargin.left - 6} y={ySil(t) + 3.5} text-anchor="end">{t.toFixed(1)}</text>
      {/each}
      <path d={silPath} fill="none" stroke={CLUSTER_COLORS[1]} stroke-width="2" />
      {#each set.curve.filter((e) => e.silhouette !== null) as e}
        <circle cx={xK(e.k)} cy={ySil(e.silhouette)} r={kk === e.k ? 5 : 3} fill={CLUSTER_COLORS[1]} stroke="#fff" stroke-width="1.4" />
      {/each}
      {#each set.curve as e}
        <text class="tick" x={xK(e.k)} y={CH - 12} text-anchor="middle">{e.k}</text>
      {/each}
      <text class="peak" x={xK(bestSilK)} y={ySil(set.curve[bestSilK - 1].silhouette) - 10} text-anchor="middle">
        peak
      </text>
    </svg>
  </div>

  <p class="card-foot">{footText}</p>
</div>

<p class="body-text">
  Try a few values of k in the figure above. On the three real groups, both
  criteria agree with each other and with your eyes: the inertia curve bends
  sharply at <span class="bold">k = {BEST_SILHOUETTE_K}</span>, and the silhouette
  peaks there at {ELBOW[BEST_SILHOUETTE_K - 1].silhouette.toFixed(2)}. This is
  the case that shows up in most tutorials, but it isn't the one that teaches us
  anything.
</p>

<p class="body-text">
  Now switch the toggle to <em>Pure noise</em>. These {UNIFORM.length} points are
  drawn uniformly from a box, so by construction there's no group structure in
  them at all. The inertia curve still falls steadily, but this time there's no
  bend to find. The silhouette, however, still gives an answer: it peaks at
  <span class="bold">k = {NOISE_BEST_K.k}</span>, with a score of
  {NOISE_BEST_K.silhouette.toFixed(2)}. That's lower than the
  {ELBOW[BEST_SILHOUETTE_K - 1].silhouette.toFixed(2)} scored by the real
  structure, but nothing in the number itself tells you where the line between
  the two lies, and in practice you won't have both to compare.
</p>

<p class="body-text">
  That comparison is the whole point of the toggle. Comparing your inertia curve
  with the one you'd get from structureless data spread over the same region is
  the only way to turn "the bend is around three" into a statement with a null
  hypothesis behind it. When this is done properly, using reference datasets
  rather than eyeballing, it's called the <span class="bold">gap statistic</span>,
  and of the methods we've discussed, it's the only one that can return the
  answer "one cluster".
</p>

<style>
  .card {
    max-width: 620px;
    margin: 1.6rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .measure {
    width: 100%;
    height: 0;
  }

  svg {
    max-width: 100%;
    display: block;
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .card-title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--squidink);
  }

  .toggle {
    display: flex;
    gap: 0.3rem;
  }

  button {
    font-family: var(--font-main);
    cursor: pointer;
    border: 1px solid #cbd5e0;
    background: #ffffff;
    color: #4a5568;
    transition: background 120ms ease, border-color 120ms ease;
  }

  button:hover {
    border-color: var(--violet);
  }

  .pill {
    font-size: 0.74rem;
    padding: 0.24rem 0.62rem;
    border-radius: 999px;
  }

  .pill.on {
    background: #efeafe;
    border-color: var(--violet);
    color: #4a3592;
    font-weight: 700;
  }

  .k-row {
    display: flex;
    align-items: center;
    gap: 0.28rem;
    margin: 0.6rem 0 0.3rem 0;
    flex-wrap: wrap;
  }

  .k-label {
    font-family: var(--font-mono, monospace);
    font-size: 0.78rem;
    color: #9aa5b1;
    margin-right: 0.15rem;
  }

  .kbtn {
    font-family: var(--font-mono, monospace);
    font-size: 0.78rem;
    width: 1.85rem;
    padding: 0.18rem 0;
    border-radius: 5px;
    text-align: center;
  }

  .kbtn.on {
    background: var(--violet);
    border-color: var(--violet);
    color: #ffffff;
    font-weight: 700;
  }

  .curves {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }

  .grid {
    stroke: #eef1f5;
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    fill: #9aa5b1;
  }

  .c-title {
    font-family: var(--font-main);
    font-size: 11px;
    font-weight: 700;
    fill: var(--squidink);
  }

  .peak {
    font-family: var(--font-main);
    font-size: 10px;
    font-weight: 700;
    fill: #df2a5d;
  }

  .card-foot {
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #718096;
    margin: 0.5rem 0 0 0;
  }

  @media screen and (max-width: 950px) {
    .card {
      max-width: 92%;
      padding: 0.75rem;
    }
  }
</style>
