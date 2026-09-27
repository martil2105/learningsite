<script>
  /*
    The payoff of the whole second half: two listings, the same distance, and
    two different numbers for it. Every figure quoted here comes out of
    explain.js, so the sentences cannot drift away from the bars.
  */
  import WaterfallFigure from "./WaterfallFigure.svelte";
  import { LARGE, STUDIO, krPlain, krSigned } from "../explain.js";

  const ratio = (LARGE.phi[1] / STUDIO.phi[1]).toFixed(1);
</script>

<h1 class="body-header">Reading the answer</h1>

<p class="body-text">
  If we stack the three numbers end to end, starting from the market average, we
  get a waterfall chart, which is the standard picture of a single SHAP
  explanation. It always closes by construction, because efficiency guarantees
  that the bars land exactly on the prediction, so there's never a residual to
  explain away.
</p>

<WaterfallFigure />

<p class="body-text">
  The large flat is a nearly average listing for completely non-average reasons.
  Its size is worth {krSigned(LARGE.phi[0])} a month, its distance from the
  centre {krSigned(LARGE.phi[1])}, and its low floor {krSigned(LARGE.phi[2])}.
  These three almost cancel out, leaving it
  {krSigned(LARGE.phi.reduce((a, b) => a + b, 0))} from the middle of the market.
  A model that only reported "about average" would have been accurate, but not
  very useful.
</p>

<p class="body-text">
  Now compare the two rows labelled <span class="bold">distance</span>. Both
  flats are 6.5 km out, but for the large one, that costs
  {krSigned(LARGE.phi[1])}, while for the studio it costs
  {krSigned(STUDIO.phi[1])}, a difference by a factor of {ratio}. The kilometres
  haven't changed. What has changed is how many square metres are travelling
  with them, and
  the model has learned that a long commute is a discount applied per square
  metre, not a flat fee.
</p>

<p class="body-text">
  This is worth being clear about, because it's where SHAP is most often
  misread. A feature doesn't have <em>a</em> contribution. It has a contribution
  to this particular prediction, and even that is an average over orderings that
  disagree with each other. Within the studio's explanation, distance is
  credited {krSigned(STUDIO.spread[1].min)} when it's revealed first, but only
  {krSigned(STUDIO.spread[1].max)} when it arrives last, after the model already
  knows the flat is {STUDIO.x[0]} m². Once the model knows the flat is tiny,
  learning that it's also far out barely moves the quote.
</p>

<p class="body-text">
  The Shapley value summarises that disagreement as
  {krSigned(STUDIO.phi[1])} and hands you a single number. That's the service it
  performs, and it's also exactly what it hides, because a single attribution is
  a faithful average over stories that aren't the same story.
</p>
