<script>
  import katexify from "../katexify";
  import { fit, krPlain } from "../explain.js";
</script>

<h1 class="body-header">What you actually have</h1>

<p class="body-text">
  A Shapley value is the unique answer to a precisely stated question: given a
  payoff for every subset of players, how do you divide the total so that the
  division is efficient, blind to names, gives nothing to those who add nothing,
  and is linear in the game. Applied to a model, the players are features, the
  payoff is the model's average output when only those features are known, and
  the answer is a number per feature that sums exactly to the distance between
  this prediction and the average one.
</p>

<p class="body-text">
  That is a real guarantee, and it is unusual. Most attribution methods can be
  argued with on their axioms; this one can only be argued with on whether the
  axioms were the right ones to want. But the guarantee is narrower than the way
  these numbers usually get talked about, and the gap is where the trouble lives.
</p>

<h1 class="body-header">The limits worth knowing before you sign anything</h1>

<p class="body-text">
  <span class="bold">It explains the model, not the world.</span> A SHAP value
  attributes {@html katexify("f")}'s output. If the model leans on a postcode
  that happens to correlate with income, the explanation faithfully reports the
  postcode — and says nothing whatsoever about what would happen to anyone who
  moved. There is no counterfactual claim in here anywhere. Reading one in is the
  most common and most expensive misuse of the method.
</p>

<p class="body-text">
  <span class="bold">Every value function is a compromise, and you have to pick
  one.</span> The interventional version used throughout this article replaces the
  features outside a coalition with values drawn from other listings, which means
  it asks the model about combinations that do not exist — a 32 m² flat with the
  distance profile of a suburban house. The model has never seen such a thing and
  its answer there is extrapolation you are now averaging into an explanation. The
  conditional alternative stays on the data manifold, but then a feature the model
  provably ignores can still be paid, because it correlates with one the model
  uses. There is no third option that avoids both. Choose, and say which you chose.
</p>

<p class="body-text">
  <span class="bold">TreeSHAP's default is not the one most people think.</span>
  Its path-dependent mode estimates a conditional expectation from the training
  counts stored in the tree; passing a background dataset gives you the
  interventional value function instead. These are different numbers, and with
  correlated features they are not close. If a validation report quotes SHAP
  values without naming the mode and the background, it has not specified the
  quantity it is reporting.
</p>

<p class="body-text">
  <span class="bold">Global importance is a summary, not a test.</span> Ranking
  features by mean {@html katexify("|\\phi_i|")} describes how much this model
  moved on this sample. It is not a significance test and it has no null
  hypothesis: a pure-noise feature will score above zero, and a feature that
  matters enormously in a region the sample barely covers will score low. It is a
  description of behaviour, not evidence of relevance.
</p>

<p class="body-text">
  <span class="bold">Additivity buys uniqueness and charges expressiveness.</span>
  The output is one number per feature, which is a linear surrogate for a model
  that is not linear. "These two only matter together" cannot be said in that
  language; the credit gets split and the joint effect disappears into two
  halves. Shapley interaction values recover it, at another factor of
  {@html katexify("n")} in cost.
</p>

<p class="body-text">
  <span class="bold">Fair is not the same as stable.</span> A sampling estimator
  returns a different answer each run, and the spread is a function of your
  budget, not of the model. Quote the estimator, the number of permutations, and
  ideally the standard error — an attribution reported to four significant figures
  from 100 samples is claiming a precision it does not have.
</p>

<h1 class="body-header">A note on the numbers here</h1>

<p class="body-text">
  The model in the second half is a {krPlain(fit.nTrain)}-row gradient-boosted
  forest of 40 depth-3 trees, fit in your browser when this page loaded. It scores
  an RMSE of {krPlain(fit.train)} kr on its training data and
  {krPlain(fit.heldOut)} kr on {krPlain(fit.nTest)} held-out listings, against an
  irreducible noise floor of 900 kr — so it is a decent but visibly imperfect
  model, which is the normal case and the interesting one. Every figure quoted in
  the prose is read out of the same objects the charts draw, and the Shapley
  values are computed exactly, by enumerating all six orderings, then checked
  against the closed-form weighted-subset formula and against efficiency.
</p>

<p class="body-text">
  It is worth ending where the maths did. Shapley was not thinking about models.
  He was answering a question about people in rooms, and the answer turned out to
  depend on nothing about people — only on having a set of participants and a
  number for every subset of them. Sixty-four years later Lundberg and Lee noticed
  that a prediction has exactly that shape. The reason SHAP has the properties it
  has is not that anyone designed them in. They were already there, in a 1953 paper
  about dividing a payout.
</p>
