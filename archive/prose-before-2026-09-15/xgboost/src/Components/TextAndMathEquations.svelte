<script>
  import katexify from "../katexify";
  import HessianFigure from "./HessianFigure.svelte";
</script>

<h1 class="body-header">The Calculus of a Tree</h1>

<p class="body-text">
  Most machine learning models update their parameters by gradient descent: you
  take the derivative of your loss function with respect to weights, and step downhill.
  Gradient boosting does the same thing, but in
  <span class="bold">function space</span>: instead of nudging numerical weights, each
  step adds an entire decision tree {@html katexify("f_t(x)")} to the ensemble.
</p>

<p class="body-text">
  Suppose we have already trained {@html katexify("t-1")} trees, giving us current
  predictions {@html katexify("\\hat{y}_i^{(t-1)}")}. At step {@html katexify("t")},
  we seek a new tree {@html katexify("f_t")} that minimizes our objective:
</p>

<div class="math-display">
  {@html katexify("\\mathcal{L}^{(t)} = \\sum_{i=1}^n l\\left(y_i,\\, \\hat{y}_i^{(t-1)} + f_t(x_i)\\right) + \\Omega(f_t)", true)}
</div>

<p class="body-text">
  where {@html katexify("l(y, \\hat{y})")} is our loss function (such as squared error
  or logistic loss), and {@html katexify("\\Omega(f_t)")} is a penalty on tree complexity:
</p>

<div class="math-display">
  {@html katexify("\\Omega(f_t) = \\gamma T + \\frac{1}{2} \\lambda \\sum_{j=1}^T w_j^2", true)}
</div>

<p class="body-text">
  Here {@html katexify("T")} is the number of terminal leaves in the tree,
  {@html katexify("w_j")} is the prediction value output by leaf {@html katexify("j")},
  {@html katexify("\\gamma")} is a penalty for adding leaves, and
  {@html katexify("\\lambda")} is an L2 regularization penalty on leaf magnitude.
</p>

<h1 class="body-header">The Second-Order Taylor Trick</h1>

<p class="body-text">
  Evaluating a complex loss function inside every prospective tree split is computationally
  brutal. XGBoost overcomes this by replacing the loss with its
  <span class="bold">second-order Taylor expansion</span> around the current prediction:
</p>

<div class="math-display">
  {@html katexify("l(y_i,\\, \\hat{y}_i^{(t-1)} + f_t(x_i)) \\approx l(y_i,\\, \\hat{y}_i^{(t-1)}) + g_i f_t(x_i) + \\frac{1}{2} h_i f_t^2(x_i)", true)}
</div>

<p class="body-text">
  where {@html katexify("g_i")} is the first-order gradient and {@html katexify("h_i")}
  is the second-order Hessian:
</p>

<div class="math-display">
  {@html katexify("g_i = \\frac{\\partial l(y_i, \\hat{y})}{\\partial \\hat{y}}\\Bigg|_{\\hat{y} = \\hat{y}_i^{(t-1)}}, \\qquad h_i = \\frac{\\partial^2 l(y_i, \\hat{y})}{\\partial \\hat{y}^2}\\Bigg|_{\\hat{y} = \\hat{y}_i^{(t-1)}}", true)}
</div>

<p class="body-text">
  For standard Mean Squared Error {@html katexify("l(y, \\hat{y}) = \\frac{1}{2}(y - \\hat{y})^2")},
  the math is refreshingly simple:
  {@html katexify("g_i = \\hat{y}_i^{(t-1)} - y_i = -r_i")} (the negative residual) and
  {@html katexify("h_i = 1")}.
</p>

<p class="body-text">
  Simple to the point of being misleading, in fact — and it is worth being blunt
  about this, because every number in the rest of this article is computed under
  squared error. A quadratic's second-order Taylor expansion is not an
  approximation of it, it <em>is</em> it, and
  {@html katexify("h_i = 1")} for every point means the Hessian cancels out of
  everything below. Nothing you are about to see would change if XGBoost had
  stopped at first order.
</p>

<p class="body-text">
  Where the second derivative earns its keep is anywhere the loss is not a
  parabola. Under logistic loss, with {@html katexify("p_i")} the model's current
  predicted probability, {@html katexify("g_i = p_i - y_i")} and
  {@html katexify("h_i = p_i(1 - p_i)")} — so the Hessian becomes a per-point
  measure of how unsure the model still is:
</p>

<HessianFigure />

<p class="body-text">
  Since {@html katexify("h_i")} sits in the denominator of both the leaf weight
  and the gain, a point the model already calls at 95% confidence carries about a
  fifth of the weight of one sitting at 50% when the next split is chosen — and at
  99% confidence, about a twenty-fifth.
  Gradient boosting with only first-order information has no way to express that;
  it sees the gradient and nothing about the curvature underneath it. Regression
  with squared error is the one case where you cannot tell the difference.
</p>

<h1 class="body-header">The Optimal Leaf Weight</h1>

<p class="body-text">
  Let {@html katexify("I_j = \\{i \\mid q(x_i) = j\\}")} be the set of data points
  assigned to leaf {@html katexify("j")}. Dropping constant terms from prior rounds and
  grouping the objective by leaf gives:
</p>

<div class="math-display">
  {@html katexify("\\tilde{\\mathcal{L}}^{(t)} = \\sum_{j=1}^T \\left[ \\left(\\sum_{i \\in I_j} g_i\\right) w_j + \\frac{1}{2} \\left(\\sum_{i \\in I_j} h_i + \\lambda\\right) w_j^2 \\right] + \\gamma T", true)}
</div>

<p class="body-text">
  This is just a quadratic equation in {@html katexify("w_j")}. Taking its derivative
  and setting it to zero gives the exact optimal leaf weight:
</p>

<div class="math-display">
  {@html katexify("w_j^* = -\\frac{\\sum_{i \\in I_j} g_i}{\\sum_{i \\in I_j} h_i + \\lambda} \\;\\underset{\\text{sq. error}}{=}\\; \\frac{\\sum_{i \\in I_j} r_i}{|I_j| + \\lambda}", true)}
</div>

<p class="body-text">
  The left-hand form is general. The right-hand one is what it collapses to under
  squared error, where {@html katexify("h_i = 1")} makes the denominator a plain
  count of the points in the leaf.
</p>

<p class="body-text">
  Look at that denominator: when {@html katexify("\\lambda = 0")}, {@html katexify("w_j^*")}
  is simply the average residual in that leaf. But when {@html katexify("\\lambda > 0")},
  any leaf with only a few isolated points has its prediction gently pulled toward zero,
  preventing a single runaway point from distorting the whole tree.
</p>

<h1 class="body-header">Scoring a Split: The Gain Formula</h1>

<p class="body-text">
  Substituting {@html katexify("w_j^*")} back into our objective tells us the quality
  of any leaf structure. The paper calls this the <span class="bold">structure score</span>
  (you will also see it taught as the "similarity score"):
</p>

<div class="math-display">
  {@html katexify("S(I) = \\frac{\\left(\\sum_{i \\in I} g_i\\right)^2}{\\sum_{i \\in I} h_i + \\lambda}", true)}
</div>

<p class="body-text">
  When evaluating whether to split a node {@html katexify("I")} into left
  ({@html katexify("I_L")}) and right ({@html katexify("I_R")}) partitions,
  XGBoost computes the <span class="bold">Gain</span>:
</p>

<div class="math-display">
  {@html katexify("\\text{Gain} = \\frac{1}{2} \\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda} \\right] - \\gamma", true)}
</div>

<p class="body-text">
  The {@html katexify("\\gamma")} at the end is what turns this into a pruning rule:
  a split has to buy at least {@html katexify("\\gamma")} worth of improvement before
  it is allowed to exist.
</p>

<p class="body-text">
  It is tempting to read that as "stop as soon as the gain goes negative", and the
  demonstrations in this article do exactly that for simplicity. The real
  implementation is more patient: it grows the tree out to
  {@html katexify("\\texttt{max\\_depth}")} first and only then prunes bottom-up,
  removing nodes whose gain came out negative. The difference matters, because a
  split that looks worthless can sit above one that is extremely valuable — stop
  early and you never find out.
</p>

<p class="body-text">
  Finally, after growing {@html katexify("f_t(x)")}, we scale its contribution by a
  learning rate {@html katexify("\\eta \\in (0, 1]")}:
</p>

<div class="math-display">
  {@html katexify("\\hat{y}^{(t)}(x) = \\hat{y}^{(t-1)}(x) + \\eta \\cdot f_t(x)", true)}
</div>

<p class="body-text">
  This shrinkage parameter {@html katexify("\\eta")} ensures that no single tree hogs
  all the explanatory power, leaving plenty of subtle patterns for subsequent trees
  to learn.
</p>

<style>
  .math-display {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 620px;
    margin: 1.2rem auto;
    padding: 0.4rem 0.6rem;
    text-align: center;
  }

  @media screen and (max-width: 950px) {
    .math-display {
      max-width: 92%;
    }
  }
</style>