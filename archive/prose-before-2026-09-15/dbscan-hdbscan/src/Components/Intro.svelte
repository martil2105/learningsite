<script>
  import { HOOK, HARD, byId, int, pct, num } from "../experiments.js";
  const km = HOOK.kmeans;
  /* Measured, not typed. A number in a sentence that the data could drift away
     from is the failure this project keeps finding. */
  const GAP = (() => {
    const sc = byId("platforms");
    const mid = (g) => {
      const ys = sc.stop.map((s, i) => [s, i]).filter(([s]) => s === g).map(([, i]) => sc.pts[i][1]);
      return ys.reduce((a, b) => a + b, 0) / ys.length;
    };
    return Math.abs(mid(0) - mid(1));
  })();
</script>

<p class="body-text">
  A phone logged where it was, all day, {int(HOOK.n)} times. Some of those pings
  are places the person stopped — a platform, a café, twenty minutes on a bench —
  and the rest were logged while they walked from one to the next. The job is to
  get the places back.
</p>

<p class="body-text">
  k-means will not do it, and it is worth being exact about why, because there
  are two reasons and only one of them is the famous one. The first is that you
  would have to say how many places there were, which is the question. The
  second is that a place is not a blob. Two railway platforms are two long thin
  strips {num(GAP, 0)} metres apart, and the cheapest way to cut points on two
  strips into two groups is to cut <em>across</em> them rather than between
  them. k-means with <span class="mono">k = 2</span> splits the first platform
  into <span class="bold">{km.split[0]} and {km.split[1]}</span> and scores an
  adjusted Rand index of <span class="bold">{num(km.ari, 3)}</span> against the
  truth — fractionally worse than dealing the labels out at random.
</p>

<p class="body-text">
  DBSCAN asks for something else entirely. Not how many clusters, but
  <span class="bold">how close counts as close</span> — <span class="mono">eps</span>,
  a radius — and <span class="bold">how many neighbours make a crowd</span> —
  <span class="mono">minPts</span>. A ping with at least
  <span class="mono">minPts</span> pings within <span class="mono">eps</span> of
  it is a <em>core</em> ping; core pings within <span class="mono">eps</span> of
  each other belong to the same cluster; whatever is left over is noise. No
  <span class="mono">k</span> anywhere, clusters of any shape at all, and the
  walking comes back labelled as walking instead of being forced into a group.
</p>

<p class="body-text">
  Both axes below are metres. That is not a detail. <span class="mono">eps</span>
  is a distance, and in almost every write-up of DBSCAN it is a distance in
  whatever space a <span class="mono">StandardScaler</span> produced, which
  nobody has an intuition about. Here it is metres on the ground, so a value for
  it is a claim you can argue with: is twelve metres the same place, or two
  places?
</p>

<p class="body-text">
  One definition, used for the rest of the article. A stop counts as
  <span class="bold">found</span> when some cluster holds at least 80% of its
  pings and less than 20% of any other stop's. It is a blunt test, and it has
  the merit of saying out loud what it is treating as success.
</p>

<p class="body-text">
  So: move <span class="mono">eps</span>. The strip below the map is the whole
  sweep — every distinct clustering the knob can produce, one clustering per
  step — and the band is where the answer recovers every stop. Get a feel for
  it on the first day. Then switch to the second one.
</p>

<style>
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
</style>
