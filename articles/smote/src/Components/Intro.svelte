<script>
  import { HOOK, VERDICT, pct, int } from "../experiments.js";
  const hard = VERDICT.find((v) => v.id === "as-it-arrives");
</script>

<p class="body-text">
  Suppose we have a month of card transactions,
  {int(HOOK.majority.length + HOOK.minority.length)} of them, and
  {HOOK.minority.length} are fraud. The awkward thing about this situation is
  that the data rewards a model for ignoring the question entirely. If we predict
  <em>legitimate</em> every time, we're right
  {pct(1 - HOOK.minority.length / (HOOK.majority.length + HOOK.minority.length), 1)}
  of the time. A nearest-neighbours classifier trained on exactly this data, at
  the usual threshold, does something very close to that: it catches
  <span class="bold">{pct(1 - hard.none.atHalf.miss)}</span> of the fraud.
</p>

<p class="body-text">
  We can't just go out and collect more fraud, so the standard move is to
  manufacture it. SMOTE (Synthetic Minority Over-sampling Technique) takes a
  fraud row, finds its <span class="mono">k</span> nearest fraud neighbours,
  picks one of them, and writes down a new fraud row somewhere on the straight
  line between the two. It repeats this until the classes are the same size.
</p>

<p class="body-text">
  That's the whole method. It takes twenty-odd lines of code, it has been the
  default answer to class imbalance for twenty years, and it's one
  <span class="mono">import</span> away in just about every toolbox.
</p>

<p class="body-text">
  However, it also contains an assumption that's stated so quietly it's easy to
  miss: <span class="bold">that the space between two fraud rows is itself
  fraud</span>. The method doesn't just assume that it might be; it assumes that
  it is, strongly enough to label a point there and hand it to a classifier as
  evidence.
</p>

<p class="body-text">
  Below is the data. Amount runs from left to right on a log scale, and time of
  day runs from bottom to top. Both are standardised before anything measures a
  distance, because "how far is €40 from 3am?" has no answer until somebody
  picks a scale. The red points are the labelled fraud, and the shaded regions
  show where fraud really is the more common of the two classes. Knowing that is
  a luxury of synthetic data, and it's what we get to check the method against.
</p>

<p class="body-text">
  Try picking up the orange point and moving it around. Its
  <span class="mono">k</span> nearest fraud neighbours are recomputed as you go,
  the segments to them are drawn, and the blue points show the synthetic fraud
  rows SMOTE would put on those segments. Notice that nothing in that machinery
  has any idea the grey cloud is there.
</p>

<style>
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
</style>
