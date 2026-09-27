<script>
  import { accounts } from "../datasets.js";
  const n = accounts.length;
  const planted = accounts.filter((p) => p.kind === "anomaly").length;
</script>

<section>
  <p class="body-text">
    Suppose you are handed {n} bank accounts and told that a handful of them are
    behaving strangely. Nobody will tell you which ones, or what "strangely"
    means. All you get is a couple of numbers per account: how big its transfers
    usually are, and how many it makes in a week.
  </p>
  <p class="body-text">
    The instinctive move is to describe what normal looks like and then flag
    whatever fails to match. Fit a density and take the low-probability tail.
    Measure each point's distance to its nearest neighbours and take the lonely
    ones. Both work. Both also spend nearly all of their effort building a
    careful picture of the majority — which is the part you were never asked
    about — and both get slower and shakier as you add columns.
  </p>
  <p class="body-text">
    In 2008, Fei Tony Liu, Kai Ming Ting and Zhi-Hua Zhou proposed turning the
    problem around. Do not model normal at all. Instead, take a point and try to
    <span class="bold">separate it from everything else</span> using random
    cuts, and simply count how many cuts that takes. Anomalies, they observed,
    are <span class="bold">few and different</span>: few, so there is empty
    space around them; different, so their values sit away from the bulk. Both
    properties make a point easy to cut off. The count is the detector.
  </p>
  <p class="body-text">
    There are {planted} accounts in the data below that were planted to be odd.
    Nothing that follows ever sees that label — it is only there so we can check
    the answer at the end.
  </p>
</section>

<style>
  section {
    padding-top: 1rem;
  }
</style>
