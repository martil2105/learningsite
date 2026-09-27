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
  Here is a pile of points and a suspicion that they arrived in groups. Nothing
  is labelled. Nobody has told you how many groups there are or where they sit.
  You would like the groups.
</p>

<p class="body-text">
  Stated carefully, the job is to choose a partition — every point into exactly
  one group — that makes the groups as tight as possible. And stated that way it
  looks like something you could brute-force, right up until you count the
  partitions. Twenty points into three groups can be done
  <span class="bold">{smallText}</span> ways. The
  {MAIN.length} points in the chart below can be done
  <span class="bold">{big.mantissa} × 10<sup>{big.exponent}</sup></span> ways.
  There is no cleverness waiting to rescue you either: finding the tightest
  partition is NP-hard, and it stays NP-hard for points in a plane.
</p>

<p class="body-text">
  So look at what <em>is</em> easy. If somebody handed you the three centres,
  grouping the points would be trivial — each point goes to whichever centre is
  nearest. And if somebody handed you the three groups, finding the centres
  would be trivial — each centre is the average of its group. Both halves of the
  problem are one line of arithmetic. Each of them just needs the other half
  first.
</p>

<p class="body-text">
  Stuart Lloyd's move, in a 1957 Bell Labs memo about quantising telephone
  signals, was to stop trying to break the circle and simply go round it.
  <span class="bold">Guess</span> the centres. Group the points by the guess.
  Move each centre to the middle of the group it just got. Repeat until nothing
  moves. That is the whole algorithm, and it is what almost everybody means when
  they say "k-means".
</p>

<p class="body-text">
  It is below, one half-step at a time. The three crosses are the centres —
  <span class="bold">centroids</span> — and you can drag them anywhere you like.
  The number underneath is the only thing the algorithm is actually trying to
  make small.
</p>
