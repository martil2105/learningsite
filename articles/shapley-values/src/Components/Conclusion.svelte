<script>
  import katexify from "../katexify";
  import { fit, krPlain } from "../explain.js";
</script>

<h1 class="body-header">What a Shapley value gives you</h1>

<p class="body-text">
  A Shapley value is the unique answer to a precisely stated question: given a
  payoff for every subset of players, how should we divide the total so that the
  division is efficient, blind to names, gives nothing to those who add nothing,
  and is linear in the game? When we apply it to a model, the players are
  features, the payoff is the model's average output when only those features
  are known, and the answer is one number per feature, with the numbers summing
  exactly to the distance between this prediction and the average one.
</p>

<p class="body-text">
  That's a real guarantee, and an unusual one. Most attribution methods can be
  challenged on whether they satisfy their axioms, but this one can only be
  challenged on whether those were the right axioms to want. However, the
  guarantee is narrower than the way these numbers are usually talked about, and
  that gap is where the trouble lies.
</p>

<h1 class="body-header">Things to know before you sign off on anything</h1>

<p class="body-text">
  <span class="bold">It explains the model, not the world.</span> A SHAP value
  attributes {@html katexify("f")}'s output. If the model leans on a postcode
  that happens to correlate with income, the explanation faithfully reports the
  postcode, but it says nothing at all about what would happen to anyone who
  moved. There's no counterfactual claim in here anywhere, and reading one into
  it is the most common and most expensive misuse of the method.
</p>

<p class="body-text">
  <span class="bold">Every value function is a compromise, and you have to pick
  one.</span> The interventional version used throughout this article replaces the
  features outside a coalition with values drawn from other listings, which means
  it asks the model about combinations that don't exist, such as a 32 m² flat
  with the distance profile of a suburban house. The model has never seen
  anything like that, so its answer there is an extrapolation that you're now
  averaging into an explanation. The conditional alternative stays on the data
  manifold, but then a feature that the model provably ignores can still get
  credit, because it correlates with one the model does use. No third option
  avoids both problems, so choose one, and say which one you chose.
</p>

<p class="body-text">
  <span class="bold">TreeSHAP's default isn't what most people think it
  is.</span> Its path-dependent mode estimates a conditional expectation from the
  training counts stored in the tree, while passing a background dataset gives
  you the interventional value function instead. These produce different
  numbers, and with correlated features, they aren't close. If a validation
  report quotes SHAP values without naming the mode and the background, it
  hasn't specified the quantity it's reporting.
</p>

<p class="body-text">
  <span class="bold">Global importance is a summary, not a test.</span> Ranking
  features by mean {@html katexify("|\\phi_i|")} describes how much this model
  moved on this sample. It isn't a significance test, and it has no null
  hypothesis, so a pure-noise feature will score above zero, and a feature that
  matters enormously in a region the sample barely covers will score low. It
  describes the model's behaviour; it isn't evidence of relevance.
</p>

<p class="body-text">
  <span class="bold">Additivity buys uniqueness at the cost of
  expressiveness.</span> The output is one number per feature, which is a linear
  surrogate for a model that isn't linear. You can't say "these two only matter
  together" in that language, because the credit gets split and the joint effect
  disappears into two halves. Shapley interaction values can recover it, at the
  cost of another factor of {@html katexify("n")}.
</p>

<p class="body-text">
  <span class="bold">Fair isn't the same as stable.</span> A sampling estimator
  returns a different answer on each run, and the spread depends on your budget,
  not on the model. So report the estimator, the number of permutations and,
  ideally, the standard error. An attribution reported to four significant
  figures from 100 samples is claiming a precision it doesn't have.
</p>

<h1 class="body-header">A note on the numbers</h1>

<p class="body-text">
  The model in the second half is a gradient-boosted forest of 40 depth-3 trees,
  trained on {krPlain(fit.nTrain)} rows in your browser when this page loaded. It
  scores an RMSE of {krPlain(fit.train)} kr on its training data and
  {krPlain(fit.heldOut)} kr on {krPlain(fit.nTest)} held-out listings, against an
  irreducible noise floor of 900 kr. That makes it a decent but visibly imperfect
  model, which is both the normal case and the interesting one. Every figure
  quoted in the text is read from the same objects the charts draw, and the
  Shapley values are computed exactly by enumerating all six orderings, then
  checked against the closed-form weighted-subset formula and against
  efficiency.
</p>

<p class="body-text">
  Let's end where the maths began. Shapley wasn't thinking about models. He was
  answering a question about people in rooms, and the answer turned out not to
  depend on anything specific to people, only on having a set of participants
  and a number for every subset of them. Sixty-four years later, Lundberg and Lee
  noticed that a prediction has exactly that shape. So SHAP doesn't have its
  properties because anyone designed them in. They were already there, in a 1953
  paper about dividing a payout.
</p>

<p class="body-text">
  Thanks for reading!
</p>
