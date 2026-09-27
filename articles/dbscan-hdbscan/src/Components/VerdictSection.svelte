<script>
  /*
    The honest accounting. Two strips per day, drawn in the same visual
    language as the strip under the hook: the range of a parameter, shaded
    where it recovers every stop.

    This is the section where the article has to resist its own argument. On
    two of the three days a global threshold works perfectly well, and on one
    of those DBSCAN at its best eps scores HIGHER than HDBSCAN. Both of those
    are in here.
  */
  import { PRE, SEARCH, MCS_RANGE, M_DEFAULT, num, pct, int } from "../experiments.js";
  import { GOOD, BAD, INK, NOISE, ACCENT } from "../palette.js";

  let boxWidth = 320;
  $: BW = Math.max(260, boxWidth);
  /* Narrow screens put the row label above its track instead of beside it.
     Drawing it at x = -8 with no label column is how two <text> nodes ended up
     eighty pixels outside their own svg on a phone. */
  $: narrow = BW < 520;
  $: labelW = narrow ? 0 : 150;
  $: stripW = Math.max(120, BW - labelW - (narrow ? 48 : 68));
  const ROW_H = 20;
  $: GAP = narrow ? 22 : 5;
  $: ROW_GAP = narrow ? 30 : 26;
  $: rowsFor = (s) => {
    const eps = [];
    if (s.atDefault.lo !== null)
      eps.push([Math.max(s.atDefault.lo, SEARCH.lo), Math.min(s.atDefault.hi, SEARCH.hi)]);
    const mcsBands = [];
    let run = null;
    for (const r of s.mcs.rows) {
      const good = r.found === s.nStops;
      if (good && !run) run = [r.mcs, r.mcs];
      else if (good) run[1] = r.mcs;
      else if (run) { mcsBands.push(run); run = null; }
    }
    if (run) mcsBands.push(run);
    return { eps, mcsBands };
  };
  $: xEps = (v) => ((v - SEARCH.lo) / (SEARCH.hi - SEARCH.lo)) * stripW;
  $: xMcs = (v) => ((v - MCS_RANGE.lo) / (MCS_RANGE.hi - MCS_RANGE.lo)) * stripW;
  $: H = PRE.scenarios.length * (2 * ROW_H + GAP + ROW_GAP) + 6;

  const best = (s) => ({
    db: s.atDefault.best.ari,
    hd: Math.max(...s.mcs.rows.map((r) => r.ari)),
  });
</script>

<h1 class="body-header">So did the parameter go away?</h1>

<p class="body-text">
  No, it didn't. It changed units, and that turns out to matter more than
  removing it would have. Here's how we measured it. We took a range of each
  parameter that someone might reasonably search (<span class="mono">eps</span>
  from {SEARCH.lo} to {SEARCH.hi} metres, and
  <span class="mono">min_cluster_size</span> from {MCS_RANGE.lo} to
  {MCS_RANGE.hi} pings), held the neighbour count at {M_DEFAULT} in both, so
  that exactly one thing varies on each track, and shaded the part of each range
  that recovers every stop.
</p>

<div class="figwrap">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth} />
    <svg viewBox="0 0 {BW} {H}" width={BW} height={H} aria-hidden="true">
      {#each PRE.scenarios as s, si}
        {#each [0] as _}
          <g transform="translate(0 {si * (2 * ROW_H + GAP + ROW_GAP) + 16})">
            <text class="dtitle" x="0" y="-3">{s.name}</text>
            <g transform="translate({labelW} 0)">
              <rect class="track" x="0" y="0" width={stripW} height={ROW_H} />
              {#each rowsFor(s).eps as b}
                <rect class="good" x={xEps(b[0])} y="0" width={Math.max(1.5, xEps(b[1]) - xEps(b[0]))} height={ROW_H} />
              {/each}
              <text class="rlab" x={narrow ? 0 : -8} y={narrow ? -4 : ROW_H - 6} text-anchor={narrow ? "start" : "end"}>DBSCAN, eps</text>
              <text class="pctlab" x={stripW + 6} y={ROW_H - 6}>{pct(s.searchShare, 1)}</text>

              <rect class="track" x="0" y={ROW_H + GAP} width={stripW} height={ROW_H} />
              {#each rowsFor(s).mcsBands as b}
                <rect class="good" x={xMcs(b[0])} y={ROW_H + GAP} width={Math.max(1.5, xMcs(b[1] + 1) - xMcs(b[0]))} height={ROW_H} />
              {/each}
              <text class="rlab" x={narrow ? 0 : -8} y={narrow ? ROW_H + GAP - 4 : 2 * ROW_H + GAP - 6} text-anchor={narrow ? "start" : "end"}>HDBSCAN, cluster size</text>
              <text class="pctlab" x={stripW + 6} y={2 * ROW_H + GAP - 6}>{pct(s.mcs.share, 1)}</text>
            </g>
          </g>
        {/each}
      {/each}
    </svg>
    <p class="cap">
      Each pair of tracks is one day. Shaded means every stop was recovered, and
      the number on the right shows how much of the range that covers.
      <span class="mono">minPts</span> and <span class="mono">min_samples</span>
      are both fixed at {M_DEFAULT}, so each track varies just one thing.
    </p>
  </div>
</div>

<p class="body-text">
  For HDBSCAN, nearly all of each range works, compared with a quarter, a tenth
  and none at all for DBSCAN's <span class="mono">eps</span>. So the bottom
  track in each pair isn't really a range you have to search; it's a range
  that's hard to get wrong.
</p>

<p class="body-text">
  There's one caveat, because it applies to the version most people will
  actually run. By default, the library couples the two neighbour counts
  (<span class="mono">min_samples</span> takes
  <span class="mono">min_cluster_size</span>'s value unless you set it), and
  that's a worse deal, because it makes one number answer two unrelated
  questions. If we sweep them coupled, the same three days give
  {PRE.scenarios.map((s) => pct(s.mcsCoupled.share, 1)).join(", ")}. That's
  still several times more room than <span class="mono">eps</span> has, and
  it's never empty, but leaving the two tied together does cost you something.
</p>

<p class="body-text">
  The ratio is the less interesting half of this, anyway.
  <span class="mono">min_cluster_size</span> is a count of pings: ten pings is
  about three minutes of standing still, and sixty is about twenty. Those are
  opinions a person can hold about their own data before seeing any output. By
  contrast, the honest description of how <span class="mono">eps</span> gets
  chosen is that you try values and look at the answers, and a clustering you
  picked because you liked how it looked isn't evidence of anything.
</p>

<h2 class="sub-header">Where it doesn't win</h2>

<p class="body-text">
  Two of these three days have a perfectly good window in
  <span class="mono">eps</span>, and on one of them, DBSCAN with the right
  value actually does <em>better</em>:
</p>

<div class="tablewrap">
  <table class="cmp">
    <thead>
      <tr><th>day</th><th class="r">best DBSCAN</th><th class="r">best HDBSCAN</th><th class="r">stops found</th></tr>
    </thead>
    <tbody>
      {#each PRE.scenarios as s}
        <tr>
          <td>{s.name}</td>
          <td class="r mono">{num(best(s).db, 3)}</td>
          <td class="r mono">{num(best(s).hd, 3)}</td>
          <td class="r">{s.atDefault.best.found} / {Math.max(...s.mcs.rows.map((r) => r.found))} of {s.nStops}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="tnote">
    Adjusted Rand index against the truth, where the walking counts as its own
    group. A score of 1.0 means exact agreement, and 0 is what randomly drawn
    labels would give. The DBSCAN column shows the best value over every
    <span class="mono">eps</span> that exists, which is a number nobody could
    obtain without already knowing the answer.
  </p>
</div>

<p class="body-text">
  On the whole day, the best <span class="mono">eps</span> beats HDBSCAN by
  {num(best(PRE.scenarios[2]).db - best(PRE.scenarios[2]).hd, 3)}, with both of
  them finding all five stops, because HDBSCAN sweeps more of the walking in
  with the stops and pays for it. On the platforms, they're within
  {num(best(PRE.scenarios[0]).db - best(PRE.scenarios[0]).hd, 3)} of each other.
  It's only on the café day, where no working <span class="mono">eps</span>
  exists at all, that the gap is real.
</p>

<p class="body-text">
  That's the right way to summarise the whole thing. HDBSCAN isn't a more
  accurate DBSCAN. On data where a single density threshold is the right shape
  of answer, it's slightly worse, because it has more freedom than the problem
  needs and spends some of it. What it offers instead is an answer that doesn't
  stop existing when your clusters have different densities, bought with a
  parameter you can reason about rather than one you have to search for.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  .figwrap { display: flex; justify-content: center; margin: 1.4rem auto; padding: 0 0.75rem; }
  .card {
    width: 100%; max-width: 660px; background: #fff; border-radius: 10px;
    padding: 1rem 1.1rem 0.9rem 1.1rem; border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }
  .measure { width: 100%; height: 0; }
  svg { display: block; max-width: 100%; }

  .track { fill: #f1f3f3; stroke: #e2e8f0; stroke-width: 1; }
  .good { fill: rgba(47, 125, 50, 0.35); }
  .dtitle { font-family: var(--font-main); font-size: 11px; font-weight: 700; fill: var(--squidink); }
  .rlab { font-family: var(--font-main); font-size: 10px; fill: #718096; }
  .pctlab { font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 700; fill: #2f7d32; }

  .cap { font-family: var(--font-main); font-size: 0.73rem; line-height: 1.5; color: #9aa5b1; margin: 0.5rem 0 0 0; }

  .tablewrap { max-width: 600px; margin: 1.2rem auto; }
  .cmp { border-collapse: collapse; width: 100%; font-family: var(--font-main); font-size: 0.86rem; }
  .cmp th {
    text-align: left; font-weight: 700; font-size: 0.74rem; color: #718096;
    border-bottom: 1px solid #cbd5e0; padding: 0.3rem 0.5rem 0.3rem 0;
  }
  .cmp td { padding: 0.32rem 0.5rem 0.32rem 0; color: var(--squid-ink); border-bottom: 1px solid #eef1f5; }
  .cmp .r { text-align: right; padding-right: 0; }
  .tnote { font-family: var(--font-main); font-size: 0.75rem; line-height: 1.5; color: #718096; margin-top: 0.5rem; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .tablewrap { max-width: 80%; }
    .card { padding: 0.8rem 0.7rem 0.7rem 0.7rem; }
  }
</style>
