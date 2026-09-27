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
  Suppose a phone logged its location {int(HOOK.n)} times over the course of a
  day. Some of those pings come from places where the person stopped (a
  platform, a café, twenty minutes on a bench), and the rest were logged while
  they walked from one place to the next. Our job is to recover the places.
</p>

<p class="body-text">
  k-means won't do the job, and it's worth being precise about why, because
  there are two reasons and only one of them is the famous one. The first is
  that you'd have to say how many places there were, which is exactly the
  question we're trying to answer. The second is that a place isn't a blob. Two
  railway platforms are two long, thin strips {num(GAP, 0)} metres apart, and the
  cheapest way to split points on two strips into two groups is to cut
  <em>across</em> them rather than between them. k-means with
  <span class="mono">k = 2</span> splits the first platform into
  <span class="bold">{km.split[0]} and {km.split[1]}</span> and scores an
  adjusted Rand index of <span class="bold">{num(km.ari, 3)}</span> against the
  truth, which is fractionally worse than dealing out the labels at random.
</p>

<p class="body-text">
  DBSCAN asks for something else entirely. Instead of how many clusters there
  are, it asks <span class="bold">how close counts as close</span>
  (<span class="mono">eps</span>, a radius) and
  <span class="bold">how many neighbours make a crowd</span>
  (<span class="mono">minPts</span>). A ping with at least
  <span class="mono">minPts</span> pings within <span class="mono">eps</span> of
  it is a <em>core</em> ping, core pings within <span class="mono">eps</span> of
  each other belong to the same cluster, and whatever is left over is noise.
  There's no <span class="mono">k</span> anywhere, clusters can have any shape at
  all, and the walking comes back labelled as walking instead of being forced
  into a group.
</p>

<p class="body-text">
  Both axes below are in metres, and that's not a minor detail.
  <span class="mono">eps</span> is a distance, and in almost every write-up of
  DBSCAN, it's a distance in whatever space a
  <span class="mono">StandardScaler</span> produced, which nobody has any
  intuition about. Here, it's metres on the ground, so any value you pick is a
  claim you can argue with: are two pings twelve metres apart still in the same
  place, or in two different places?
</p>

<p class="body-text">
  We'll use one definition for the rest of the article. A stop counts as
  <span class="bold">found</span> when some cluster holds at least 80% of its
  pings and less than 20% of any other stop's pings. It's a blunt test, but it
  has the merit of stating clearly what it treats as success.
</p>

<p class="body-text">
  Now try moving <span class="mono">eps</span>. The strip below the map shows
  the whole sweep, with every distinct clustering the knob can produce, one per
  step, and the band marks where the answer recovers every stop. Get a feel for
  it on the first day, and then switch to the second one.
</p>

<style>
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
</style>
