<script>
  import { accounts } from "../datasets.js";
  const n = accounts.length;
  const planted = accounts.filter((p) => p.kind === "anomaly").length;
</script>

<section>
  <p class="body-text">
    Suppose we're handed {n} bank accounts and told that a handful of them are
    behaving strangely. Nobody will tell us which ones they are, or even what
    "strangely" means. All we get is a couple of numbers for each account: how
    big its transfers usually are, and how many transfers it makes in a week.
  </p>
  <p class="body-text">
    The instinctive approach is to describe what normal looks like and then flag
    whatever doesn't match. For example, we could fit a density and flag the
    low-probability tail, or measure each point's distance to its nearest
    neighbours and flag the lonely ones. Both approaches work. However, both
    spend nearly all of their effort building a careful picture of the majority,
    which is the part we were never asked about, and both get slower and shakier
    as we add more columns.
  </p>
  <p class="body-text">
    In 2008, Fei Tony Liu, Kai Ming Ting and Zhi-Hua Zhou proposed turning the
    problem around. Their idea was to skip modelling normal behaviour altogether.
    Instead, we take a point, try to
    <span class="bold">separate it from everything else</span> using random
    cuts, and simply count how many cuts that takes. As they observed, anomalies
    are <span class="bold">few and different</span>. Because they're few,
    there's empty space around them, and because they're different, their values
    sit away from the bulk of the data. Both properties make a point easy to cut
    off, so the number of cuts itself becomes the detector.
  </p>
  <p class="body-text">
    The data below contains {planted} accounts that were deliberately planted to
    be odd. Nothing in the algorithm ever sees that label; it's only there so we
    can check the answer at the end.
  </p>
</section>

<style>
  section {
    padding-top: 1rem;
  }
</style>
