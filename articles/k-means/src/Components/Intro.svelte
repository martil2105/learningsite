<script>
  /*
    Motivation. The two counts are computed exactly, in BigInt, from
    stirling2() - not looked up and not estimated.
  */
  import { MAIN, stirling2, scientific } from "../datasets.js";

  const small = stirling2(20, 3);
  const big = scientific(stirling2(MAIN.length, 3));
  const smallText = small.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
</script>

<p class="body-text">
  Suppose we have a pile of points and a hunch that they came from a few distinct
  groups. None of the points are labelled, and nobody has told us how many groups
  there are or where they sit, but we'd still like to find them. This task is
  called <span class="bold">clustering</span>, and k-means is the classic way to
  approach it.
</p>

<p class="body-text">
  More precisely, we want to split the points into a
  <span class="bold">partition</span>, where every point belongs to exactly one
  group, and we want those groups to be as tight as possible. Put that way, it
  sounds like something we could solve by brute force: try every partition and
  keep the best one. The trouble is how many partitions there are. Twenty points
  can be split into three groups in <span class="bold">{smallText}</span>
  different ways, and the {MAIN.length} points in the chart below can be split in
  <span class="bold">{big.mantissa} × 10<sup>{big.exponent}</sup></span> ways.
  A cleverer search won't save us either, because finding the tightest partition
  is NP-hard, even when the points lie in a plane.
</p>

<p class="body-text">
  So instead, let's look at what <em>is</em> easy. If someone gave us the three
  centres, grouping the points would be simple, because each point would just
  join whichever centre is nearest. And if someone gave us the three groups
  instead, finding the centres would be just as simple, since each centre is the
  average of its group. Each half of the problem takes one line of arithmetic,
  but each one needs the answer to the other half first.
</p>

<p class="body-text">
  Stuart Lloyd's solution, written up in a 1957 Bell Labs memo about quantising
  telephone signals, was to stop trying to break this circle and simply go around
  it. We start by <span class="bold">guessing</span> the centres. Then we group
  the points using that guess, move each centre to the middle of the group it was
  just given, and repeat until nothing moves. That's the whole algorithm, and
  it's what almost everyone means when they say "k-means".
</p>

<p class="body-text">
  You can try it yourself below, one half-step at a time. The three diamonds are
  the centres, which we'll call <span class="bold">centroids</span>, and you can
  drag them anywhere you like. The number underneath the chart is the only thing
  the algorithm is actually trying to make small.
</p>
