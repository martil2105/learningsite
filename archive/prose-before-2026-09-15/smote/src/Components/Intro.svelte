<script>
  import { HOOK, VERDICT, pct, int } from "../experiments.js";
  const hard = VERDICT.find((v) => v.id === "as-it-arrives");
</script>

<p class="body-text">
  A year of card transactions, {int(HOOK.majority.length + HOOK.minority.length)} of
  them, and {HOOK.minority.length} are fraud. That is the situation, and the
  awkward thing about it is that the data rewards a model for ignoring the
  question entirely: predict <em>legitimate</em> every time and you are right
  {pct(1 - HOOK.minority.length / (HOOK.majority.length + HOOK.minority.length), 1)} of
  the time. A nearest-neighbours classifier trained on exactly this data, at the
  usual threshold, does something very close to that — it catches
  <span class="bold">{pct(1 - hard.none.atHalf.miss)}</span> of the fraud.
</p>

<p class="body-text">
  You cannot go and collect more fraud. So the standard move is to manufacture
  it. SMOTE — Synthetic Minority Over-sampling Technique — takes a fraud row,
  finds its <span class="mono">k</span> nearest fraud neighbours, picks one of
  them, and writes down a new fraud row somewhere on the straight line between
  the two. Repeat until the classes are the same size.
</p>

<p class="body-text">
  That is the whole method. It is twenty-odd lines of code, it has been the
  default answer to class imbalance for twenty years, and it is one
  <span class="mono">import</span> away in every toolbox anyone reaches for.
</p>

<p class="body-text">
  It also contains an assumption, stated so quietly that it is easy to miss:
  <span class="bold">that the space between two fraud rows is itself fraud</span>.
  Not that it might be. That it is — enough to label a point there and hand it
  to a classifier as evidence.
</p>

<p class="body-text">
  Below is the data. Amount runs left to right on a log scale, time of day runs
  bottom to top, and both are standardised before anything measures a distance,
  because "how far is €40 from 3am" has no answer until somebody picks one. Red
  points are the labelled fraud. The shaded regions are where fraud genuinely is
  the more common of the two classes — a luxury of synthetic data, and the thing
  we get to check the method against.
</p>

<p class="body-text">
  Pick up the orange point and move it. Its <span class="mono">k</span> nearest
  fraud neighbours are recomputed as you go, the segments to them are drawn, and
  the blue points are the synthetic fraud rows SMOTE would put on those
  segments. Nothing in that machinery has any idea the grey cloud is there.
</p>

<style>
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
</style>
