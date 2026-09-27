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
  In short, it gives you a subspace. When it's trained on squared error with no
  activation functions, a {CONFIG.k}-unit bottleneck finds the
  {CONFIG.k}-dimensional subspace that loses the least, exactly and reliably, and
  a theorem guarantees that gradient descent will get there. That's a real
  result, and it's worth knowing that the network isn't doing anything
  mysterious. It's solving a problem from 1936 by a different route.
</p>

<p class="body-text">
  What it doesn't give you is a basis for that subspace, and it can't, because
  the loss is exactly the same for every basis. Instead, you get whichever basis
  the random initialisation happened to start near. In the run above, that was
  {deg(FROZEN_ANGLE, 1)} away from the principal directions, and it stayed frozen
  there from step {int(SETTLED_STEP)} to step {int(CONFIG.STEPS)}.
</p>

<h1 class="body-header">Things to know before you read anything off a latent space</h1>

<p class="body-text">
  <span class="bold">Latent units aren't features.</span> Unit 1 isn't "the most
  important direction", because nothing sorted the units. It isn't independent
  of unit 2 either, because nothing decorrelated them (in one of the three runs
  above, they correlate at {num(Math.abs(UNREG[1].latent.correlation), 2)}). And
  its scale is arbitrary, because halving the encoder and doubling the decoder
  changes every code but nothing observable. So any sentence of the form "the
  third latent dimension captures…" needs to say what fixed the third latent
  dimension.
</p>

<p class="body-text">
  <span class="bold">Reconstruction error can't detect the problem.</span> This
  is the part that really bites. The metric you're watching is invariant to
  precisely the thing that's arbitrary, so two models whose codes look nothing
  alike agree on their outputs to within
  {UNREG[0].reconGap.toExponential(0)}. Early stopping, model selection and
  hyperparameter search all rely on that metric, so none of them can see the
  basis, and none of them will warn you.
</p>

<p class="body-text">
  <span class="bold">Training longer won't fix it either.</span> It's tempting
  to assume that a longer run would eventually settle the basis. It won't,
  because the loss is flat in that direction, so there's no gradient to follow,
  and training for another twenty thousand steps doesn't move the angle at all.
  If two runs of your pipeline disagree about a latent space, more epochs aren't
  the fix.
</p>

<p class="body-text">
  <span class="bold">If you want the components, take an SVD of the
  decoder.</span> The decoder's left singular vectors form an orthonormal basis
  of the right subspace, and once the scaling is pinned down, they're the
  principal directions themselves. A modest L2 penalty does the pinning. In the
  run above, it cut the symmetry from every invertible matrix down to just the
  rotations, and the angle went to 0°. There are two caveats, though. First, it
  costs a little accuracy, because the weights get shrunk (the reconstruction
  gap went from {UNREG[0].reconGap.toExponential(0)} to
  {REG[0].reconGap.toExponential(0)}). Second, it fixes the decoder, not the
  codes, so the latent coordinates remain a rotation of PCA's, correlated at
  {num(Math.abs(REG[0].latent.correlation), 2)}.
</p>

<p class="body-text">
  <span class="bold">If PCA is what you want, run PCA.</span> On data this
  size, the eigendecomposition is instant and deterministic, has no learning
  rate, and hands you an ordered orthonormal basis with the variances attached.
  The autoencoder formulation earns its place when you're going to add something
  to it, such as a nonlinearity, a denoising objective, a sparsity penalty or a
  convolutional encoder, not as a way of computing something that a direct
  method computes better.
</p>

<p class="body-text">
  <span class="bold">A nonlinearity removes the guarantee along with the
  limit.</span> On the arc, it cut the error {times(ARC_GAIN)}, but it did so by
  giving up the very object this whole discussion was about. There's no
  subspace left to have a basis for, the parameterisation of the learned curve
  is arbitrary in a much larger way, and Baldi and Hornik's theorem doesn't
  survive the tanh, so you also lose the assurance that your fit is the best one
  available. All of that may well be a good trade, but it's still a trade.
</p>

<h1 class="body-header">A note on the numbers</h1>

<p class="body-text">
  The first chart runs in your browser, with {PLANE.length} points, one latent
  unit, and gradient descent stepping live while you watch. Everything after it
  takes {int(CONFIG.STEPS)} gradient steps twice over, which is about fifty
  seconds of work, so it's computed by a script in the repository, using the
  same modules this page imports, and committed as data. The checking script
  re-runs every one of those fits and fails if any number has moved. It also
  separately verifies the analytic
  gradients against numerical ones, the eigendecomposition against its own
  definition, and the autoencoder's optimum against the sum of the discarded
  eigenvalues.
</p>

<p class="body-text">
  What's nice about the linear case is that it's one of the few places in this
  field where "what did the network learn?" has an exact answer, one that was
  written down before anyone was training networks. And that answer carries a
  warning that applies well beyond the linear case. A loss function is a
  statement about what you want, and everything it's indifferent to will be
  decided by something else, such as an initialisation, an optimiser or a random
  seed. That decision happens quietly, and it never shows up in the number
  you're watching.
</p>

<p class="body-text">
  Thanks for reading!
</p>
