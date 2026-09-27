<script>
  import katexify from "../katexify";
  import {
    WIDE_PCA, CONFIG, UNREG, REG, FROZEN_ANGLE, SETTLED_STEP, ROTATION_STEP,
    ARC_RESULT, ARC_GAIN, DATA_SCALE, PLANE_PCA, num, deg, pct, int, times,
  } from "../experiments.js";
  import { PLANE } from "../datasets.js";
</script>

<h1 class="body-header">What a bottleneck actually gives you</h1>

<p class="body-text">
  A subspace. Trained on squared error with no activation functions, a
  {CONFIG.k}-unit bottleneck finds the {CONFIG.k}-dimensional subspace that loses
  the least, exactly and reliably, and it comes with a theorem saying gradient
  descent will get there. That is a real result and it is worth knowing that the
  network is not doing anything mysterious: it is solving a problem from 1936 by
  a different route.
</p>

<p class="body-text">
  It does not give you a basis of that subspace, and it cannot, because the loss
  is exactly constant across every basis. What you get instead is whichever basis
  the random initialisation happened to start near — {deg(FROZEN_ANGLE, 1)} away
  from the principal directions in the run above, and frozen there from step
  {int(SETTLED_STEP)} to step {int(CONFIG.STEPS)} without moving.
</p>

<h1 class="body-header">The limits worth knowing before you read anything off a latent space</h1>

<p class="body-text">
  <span class="bold">Latent units are not features.</span> Unit 1 is not "the
  most important direction", because nothing sorted them; it is not independent
  of unit 2, because nothing decorrelated them — in one of the three runs above
  they correlate at {num(Math.abs(UNREG[1].latent.correlation), 2)}; and its
  scale is arbitrary, because halving the encoder and doubling the decoder
  changes every code and nothing observable. Any sentence of the form "the third
  latent dimension captures…" needs to say what fixed the third latent dimension.
</p>

<p class="body-text">
  <span class="bold">Reconstruction error cannot detect the problem.</span> This
  is the part that bites. The metric you are watching is invariant to precisely
  the thing that is arbitrary: two models whose codes look nothing alike agree on
  their outputs to {UNREG[0].reconGap.toExponential(0)}. Early stopping, model
  selection, hyperparameter search — none of them can see the basis, so none of
  them will warn you.
</p>

<p class="body-text">
  <span class="bold">Nothing converges to it either.</span> It is tempting to
  assume a longer run would settle the basis down. It will not: the loss is flat
  along that direction, so there is no gradient, and training for another
  twenty thousand steps moves the angle by nothing at all. If two runs of your
  pipeline disagree about a latent space, more epochs is not the fix.
</p>

<p class="body-text">
  <span class="bold">If you want the components, take an SVD of the
  decoder.</span> The decoder's left singular vectors are an orthonormal basis of
  the right subspace, and once the scaling is pinned down they are the principal
  directions themselves. A modest L2 penalty pins it: it cut the symmetry from
  every invertible matrix to just the rotations in the run above, and the angle
  went to 0°. Two caveats. It costs a little accuracy, because the weights get
  shrunk — the reconstruction gap went from
  {UNREG[0].reconGap.toExponential(0)} to {REG[0].reconGap.toExponential(0)}. And
  it fixes the decoder, not the codes: the latent coordinates stay a rotation of
  PCA's, correlated at {num(Math.abs(REG[0].latent.correlation), 2)}.
</p>

<p class="body-text">
  <span class="bold">If PCA is what you want, run PCA.</span> On data this size
  the eigendecomposition is instant, deterministic, has no learning rate, and
  hands you an ordered orthonormal basis with the variances attached. The
  autoencoder formulation earns its place when you are going to add something to
  it — a nonlinearity, a denoising objective, a sparsity penalty, a
  convolutional encoder — not as a way of computing something a direct method
  computes better.
</p>

<p class="body-text">
  <span class="bold">A nonlinearity removes the guarantee along with the
  limit.</span> On the arc it cut the error {times(ARC_GAIN)}, and it did so by
  giving up the object the whole discussion was about. There is no subspace to
  have a basis of, the parameterisation of the learned curve is arbitrary in a
  much larger way, and Baldi and Hornik's theorem does not survive the tanh — so
  you also lose the assurance that the fit you have is the best one available.
  All of that may be a good trade. It is a trade.
</p>

<h1 class="body-header">A note on the numbers here</h1>

<p class="body-text">
  The first chart runs in your browser: {PLANE.length} points, one latent unit,
  and gradient descent stepping live while you watch. Everything after it is
  {int(CONFIG.STEPS)} gradient steps twice over, which is about fifty seconds, so
  it is computed by a script in the repository from the same modules this page
  imports and committed as data. The checking script re-runs every one of those
  fits and fails if a number has moved, and separately verifies the analytic
  gradients against numerical ones, the eigendecomposition against its own
  definition, and the autoencoder's optimum against the sum of the discarded
  eigenvalues.
</p>

<p class="body-text">
  What is nice about the linear case is that it is one of the few places in this
  subject where "what did the network learn" has an exact answer, written down
  before anybody was training networks. And the answer contains a warning that
  generalises well past the linear case: a loss function is a statement about
  what you want, and everything it is indifferent to will be decided by
  something else — an initialisation, an optimiser, a random seed — quietly, and
  without ever appearing in the number you are watching.
</p>
