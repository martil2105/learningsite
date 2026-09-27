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
  Stack the three numbers end to end, starting from the market average, and you
  get a waterfall — the standard picture of a single SHAP explanation. It closes
  by construction: efficiency guarantees the bars land exactly on the prediction,
  so there is never a residual to explain away.
</p>

<WaterfallFigure />

<p class="body-text">
  The large flat is a nearly average listing for entirely non-average reasons.
  Its size is worth {krSigned(LARGE.phi[0])} a month, its distance from the
  centre {krSigned(LARGE.phi[1])}, and the low floor {krSigned(LARGE.phi[2])};
  the three almost cancel, leaving it {krSigned(LARGE.phi.reduce((a, b) => a + b, 0))}
  from the middle of the market. A model that reported only "about average" would
  have been accurate and useless.
</p>

<p class="body-text">
  Now compare the two rows labelled <span class="bold">distance</span>. Both flats
  are 6.5 km out. For the large one that costs {krSigned(LARGE.phi[1])}; for the
  studio, {krSigned(STUDIO.phi[1])} — a factor of {ratio}. The kilometres have not
  changed. What changed is how many square metres are travelling with them, and
  the model has learned that a long commute is a discount applied per square
  metre, not a flat fee.
</p>

<p class="body-text">
  This is the thing to be clear-eyed about, because it is where SHAP is most often
  misread. A feature does not have <em>a</em> contribution. It has a contribution
  to this prediction, and even that is an average over orderings that disagree
  with each other. Inside the studio's explanation, distance is credited
  {krSigned(STUDIO.spread[1].min)} when it is revealed first and only
  {krSigned(STUDIO.spread[1].max)} when it arrives last, after the model already
  knows the flat is {STUDIO.x[0]} m². Once you know it is tiny, learning that it is
  also far out barely moves the quote.
</p>

<p class="body-text">
  The Shapley value summarises that disagreement into
  {krSigned(STUDIO.phi[1])} and hands you one number. That is the service it
  performs, and it is also exactly what it hides: a single attribution is a
  faithful average over stories that are not the same story.
</p>
