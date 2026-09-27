<script>
  import katexify from "../katexify";
  import { WIDE_PCA, CONFIG, PLANE_PCA, num, pct } from "../experiments.js";
  const tail = WIDE_PCA.eigenvalues.slice(2);
</script>

<h1 class="body-header">What the loss can see</h1>

<p class="body-text">
  Write the encoder as a matrix {@html katexify("W_1")} of shape
  {@html katexify("k \\times d")} and the decoder as {@html katexify("W_2")} of
  shape {@html katexify("d \\times k")}, with {@html katexify("k < d")}. There is
  no activation function anywhere, so the whole network is
  {@html katexify("x \\mapsto W_2 W_1 x")} and what is being minimised is:
</p>

<div class="math-display">
  {@html katexify(
    "\\mathcal{L}(W_1, W_2) \\;=\\; \\frac{1}{n}\\sum_{i=1}^{n} \\left\\lVert x_i - W_2 W_1 x_i \\right\\rVert^2",
    true
  )}
</div>

<p class="body-text">
  The product {@html katexify("W = W_2 W_1")} is a {@html katexify("d \\times d")}
  matrix that has been squeezed through {@html katexify("k")} columns, so its
  rank is at most {@html katexify("k")} whatever the two factors are. Which means
  the network is not really searching over pairs of matrices at all. It is
  searching over rank-{@html katexify("k")} linear maps, for the one that changes
  the data least.
</p>

<p class="body-text">
  That problem has been solved since 1936. The Eckart–Young theorem says the best
  rank-{@html katexify("k")} approximation is the one that keeps the
  {@html katexify("k")} directions of greatest variance and discards the rest,
  and that the error it leaves behind is exactly the sum of the variances
  discarded. For the {@html katexify(CONFIG.d + "")}-dimensional data later in
  this article, the six eigenvalues below the top two sum to
  <span class="bold">{num(WIDE_PCA.bestError, 4)}</span> — and
  {num(WIDE_PCA.bestError, 4)} is the number the autoencoder converges to, not
  approximately but to every digit its arithmetic has.
</p>

<div class="callout">
  <h4>So the bottleneck is doing PCA</h4>
  <p>
    Not something like PCA, and not PCA as a special case of something more
    general. A linear autoencoder trained on squared error is a
    reparameterisation of the same optimisation problem, and its optimum is the
    same subspace. Everything the first chart does — the perpendicular drops, the
    line that loses least — is what principal component analysis does, arrived at
    by gradient descent instead of by an eigendecomposition.
  </p>
</div>

<h1 class="body-header">And what the loss cannot see</h1>

<p class="body-text">
  Now take any invertible {@html katexify("k \\times k")} matrix
  {@html katexify("A")} at all, and replace the two factors:
</p>

<div class="math-display">
  {@html katexify(
    "W_1 \\;\\longrightarrow\\; A W_1 \\qquad\\qquad W_2 \\;\\longrightarrow\\; W_2 A^{-1}",
    true
  )}
</div>

<p class="body-text">
  The product is unchanged, because
  {@html katexify("(W_2 A^{-1})(A W_1) = W_2 W_1")}. Every reconstruction is
  identical. The loss is identical, to the last bit. And the two matrices are
  now completely different — rotated, stretched, sheared, in any combination you
  like.
</p>

<p class="body-text">
  So the minimum is not a point. It is a whole
  {@html katexify("k^2")}-dimensional family of points, all with exactly the same
  value, and gradient descent has no reason to prefer any member of it over any
  other. In the two-dimensional chart above, {@html katexify("A")} is a single
  nonzero number and the family is "scale the decoder by anything, scale the
  encoder by its reciprocal" — which is precisely why the length of that arrow
  did not matter.
</p>

<p class="body-text">
  What that costs is every property of PCA that comes from how it is
  <em>constructed</em> rather than from what it optimises:
</p>

<div class="losses">
  <div class="loss-item">
    <h4>Ordering</h4>
    <p>
      Principal components come out sorted by variance. Latent units do not come
      out sorted by anything, and the second one is as likely to be the bigger.
    </p>
  </div>
  <div class="loss-item">
    <h4>Orthogonality</h4>
    <p>
      The rows of {@html katexify("W_1")} span the right subspace and are under
      no obligation to be perpendicular to each other. Usually they are not.
    </p>
  </div>
  <div class="loss-item">
    <h4>Uncorrelated codes</h4>
    <p>
      PCA's coordinates are uncorrelated by construction. An autoencoder's are
      correlated by however much {@html katexify("A")} happened to shear them.
    </p>
  </div>
  <div class="loss-item">
    <h4>Scale</h4>
    <p>
      A latent value of 3 means nothing on its own. Halve the encoder and double
      the decoder and every code halves, with no change to anything observable.
    </p>
  </div>
</div>

<p class="body-text">
  There is one piece of good news, and it is a real theorem rather than a
  reassurance. Baldi and Hornik showed in 1989 that this loss has no local minima
  that are not global: every critical point that is not the global optimum is a
  saddle. So gradient descent does reliably find the right subspace. It simply
  has, and can have, no opinion about which basis of it to hand you.
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

  .callout {
    max-width: 600px;
    margin: 1.5rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 5px solid var(--violet);
    border-radius: 8px;
    padding: 0.9rem 1.1rem;
  }

  .callout h4 {
    margin: 0 0 0.4rem 0;
    font-family: var(--font-heavy);
    font-size: 1rem;
    color: var(--squidink);
  }

  .callout p {
    margin: 0;
    font-family: var(--font-main);
    font-size: 0.92rem;
    line-height: 1.55;
    color: #4a5568;
  }

  .losses {
    max-width: 640px;
    margin: 1.5rem auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
    padding: 0 0.5rem;
  }

  .loss-item {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.85rem 0.95rem;
  }

  .loss-item h4 {
    margin: 0 0 0.4rem 0;
    font-family: var(--font-main);
    font-size: 0.95rem;
    color: var(--squidink);
  }

  .loss-item p {
    margin: 0;
    font-family: var(--font-main);
    font-size: 0.83rem;
    line-height: 1.5;
    color: #4a5568;
  }

  @media screen and (max-width: 950px) {
    .math-display {
      max-width: 92%;
    }

    .losses {
      grid-template-columns: 1fr;
      max-width: 92%;
    }

    .callout {
      max-width: 85%;
    }
  }
</style>
