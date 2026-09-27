<script>
  import katexify from "../katexify";
  import { WIDE_PCA, CONFIG, PLANE_PCA, num, pct } from "../experiments.js";
  const tail = WIDE_PCA.eigenvalues.slice(2);
</script>

<h1 class="body-header">What the loss can see</h1>

<p class="body-text">
  Let's write the encoder as a matrix {@html katexify("W_1")} of shape
  {@html katexify("k \\times d")} and the decoder as {@html katexify("W_2")} of
  shape {@html katexify("d \\times k")}, with {@html katexify("k < d")}. Since
  there's no activation function anywhere, the whole network is
  {@html katexify("x \\mapsto W_2 W_1 x")}, and what we're minimising is:
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
  rank is at most {@html katexify("k")}, whatever the two factors are. This means
  the network isn't really searching over pairs of matrices at all. Instead, it's
  searching over rank-{@html katexify("k")} linear maps for the one that changes
  the data the least.
</p>

<p class="body-text">
  It turns out that this problem has been solved since 1936. The Eckart–Young
  theorem says that the best rank-{@html katexify("k")} approximation keeps the
  {@html katexify("k")} directions of greatest variance and discards the rest,
  and that the error it leaves behind is exactly the sum of the discarded
  variances. For the {@html katexify(CONFIG.d + "")}-dimensional data later in
  this article, the six eigenvalues below the top two sum to
  <span class="bold">{num(WIDE_PCA.bestError, 4)}</span>, and
  {num(WIDE_PCA.bestError, 4)} is exactly the number the autoencoder converges
  to, not approximately but to every digit its arithmetic can hold.
</p>

<div class="callout">
  <h4>So the bottleneck is doing PCA</h4>
  <p>
    We don't mean something like PCA, or PCA as a special case of something
    more general. A linear autoencoder trained on squared error is a
    reparameterisation of the same optimisation problem, and its optimum is the
    same subspace. Everything the first chart shows, from the perpendicular drops
    to the line that loses the least, is exactly what principal component
    analysis does, just arrived at by gradient descent instead of by an
    eigendecomposition.
  </p>
</div>

<h1 class="body-header">And what the loss can't see</h1>

<p class="body-text">
  Now let's take any invertible {@html katexify("k \\times k")} matrix
  {@html katexify("A")} at all, and replace the two factors like this:
</p>

<div class="math-display">
  {@html katexify(
    "W_1 \\;\\longrightarrow\\; A W_1 \\qquad\\qquad W_2 \\;\\longrightarrow\\; W_2 A^{-1}",
    true
  )}
</div>

<p class="body-text">
  The product doesn't change, because
  {@html katexify("(W_2 A^{-1})(A W_1) = W_2 W_1")}, so every reconstruction is
  identical and the loss is identical, down to the last bit. Yet the two
  matrices are now completely different: they can be rotated, stretched and
  sheared in any combination you like.
</p>

<p class="body-text">
  This means the minimum isn't a single point. It's a whole
  {@html katexify("k^2")}-dimensional family of points, all with exactly the same
  value, and gradient descent has no reason to prefer any one of them over the
  others. In the two-dimensional chart above, {@html katexify("A")} is a single
  nonzero number, and the family is "scale the decoder by anything and scale the
  encoder by its reciprocal", which is precisely why the length of that arrow
  didn't matter.
</p>

<p class="body-text">
  What this costs us is every property of PCA that comes from how it's
  <em>constructed</em> rather than from what it optimises:
</p>

<div class="losses">
  <div class="loss-item">
    <h4>Ordering</h4>
    <p>
      Principal components come out sorted by variance, but latent units aren't
      sorted by anything, so the second one is just as likely to be the bigger
      one.
    </p>
  </div>
  <div class="loss-item">
    <h4>Orthogonality</h4>
    <p>
      The rows of {@html katexify("W_1")} span the right subspace, but nothing
      forces them to be perpendicular to each other, and usually they aren't.
    </p>
  </div>
  <div class="loss-item">
    <h4>Uncorrelated codes</h4>
    <p>
      PCA's coordinates are uncorrelated by construction, while an autoencoder's
      are correlated by however much {@html katexify("A")} happened to shear them.
    </p>
  </div>
  <div class="loss-item">
    <h4>Scale</h4>
    <p>
      A latent value of 3 means nothing on its own. If you halve the encoder and
      double the decoder, every code halves, with no change to anything
      observable.
    </p>
  </div>
</div>

<p class="body-text">
  There's one piece of good news, and it's a real theorem rather than just a
  reassurance. Baldi and Hornik showed in 1989 that this loss has no local minima
  that aren't global: every critical point other than the global optimum is a
  saddle point. So gradient descent does reliably find the right subspace. It
  simply has no opinion, and can't have one, about which basis of that subspace
  to hand you.
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
