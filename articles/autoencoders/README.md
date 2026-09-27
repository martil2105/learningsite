# Autoencoders: the linear case

An interactive visual essay on what a bottleneck actually finds when you train
it on squared error — and, more usefully, on what it provably cannot find.

Narrow on purpose. This is not a survey of autoencoder variants; it is the
linear case, where "what did the network learn" has an exact answer that was
written down in 1936.

**The hook:** a two-to-one-to-two autoencoder over 180 points, with the decoder
vector on a drag handle. Point it anywhere; every reconstruction is a multiple
of it, so they all land on one line, and the number underneath is the loss. Two
things are meant to land, in order: the loss depends on the decoder's
*direction* and not its length (press *double the decoder* and no digit moves),
and the direction that minimises it is the first principal direction.

**The argument, in order:**

1. The product `W2 W1` has rank at most k, so the network is searching over
   rank-k maps, and Eckart–Young settled that in 1936. The trained loss is
   `0.706620`; the sum of the discarded eigenvalues is `0.706620`.
2. For any invertible `A`, `(A W1, W2 A⁻¹)` gives the same product and the same
   loss. So the minimum is a k²-dimensional family and gradient descent has no
   reason to prefer any member of it. Ordering, orthogonality, uncorrelated
   codes and scale are all properties of how PCA is *constructed*, not of what
   it optimises.
3. Watch it happen. The loss settles by step 1,778 and the distance to the
   principal subspace falls to 1e-15 — while the angle between the decoder's
   leading direction and the first principal direction **freezes at 57.579° and
   does not move by a hundredth of a degree over the next 23,000 steps**. The
   loss is exactly flat there. Nothing is pushing.
4. Same subspace, unrecognisable coordinates: three seeds give latent codes
   correlated at −0.04, +0.74 and −0.73, one of them with more variance in the
   second unit than the first — while every reconstruction agrees with PCA's to
   about 3e-14 on data that runs to ±5.8.
5. A small L2 penalty fixes the basis, slowly, long after the loss has stopped:
   the angle reaches exactly 0°, the encoder becomes the decoder's transpose to
   4e-12, and the decoder's singular vectors are the principal directions. It
   costs a little shrinkage — and it does *not* decorrelate the codes.
6. Where the line runs out: on an arc the linear autoencoder finds exactly PCA's
   line (0.547, which is the second eigenvalue), and a tanh version reaches
   0.0377 — 14.5× lower. What you gave up to get it is the subspace itself, and
   with it Baldi and Hornik's guarantee that gradient descent finds the optimum.

## Running it

```
npm install
npm run dev        # http://localhost:5000, with livereload
npm run build      # production build into public/
npm run check      # re-derive every number, and re-run every committed fit
```

## Precomputed sweeps

As in `articles/lightgbm`: the hook is live, but 25,000 gradient steps twice
over is about fifty seconds, so `scripts/precompute.mjs` runs it from the same
modules the page imports and writes `src/precomputed.js`, which is committed.
The **first** check in `verify/check-numbers.mjs` re-runs every one of those fits
and diffs the result, so a stale precompute is a failing build. After editing
`datasets.js`, `autoencoder.js`, `pca.js` or `linalg.js`:

```
node scripts/precompute.mjs && npm run check
```

## Verifying

`verify/check-numbers.mjs` is the strongest in this project, because almost
everything here is an identity rather than a tendency. It checks the
eigendecomposition against `A v = λ v` and orthonormality, the analytic
gradients against numerical ones, the projector's idempotence, the trained loss
against the sum of the discarded eigenvalues, and — the article's centrepiece —
that re-basing by an arbitrary invertible matrix leaves the loss and every
reconstruction unchanged while moving the weights 24°.

`verify/check-browser.mjs` drives a served build at 1280 and 390. The check
specific to this article: **every reconstruction circle must lie on the line
through the origin and the decoder handle**, measured in rendered pixels. That
single assertion exercises the plot transform, the closed-form encoder solve and
the drag handler at once, and it comes back at 0.0000px.

## Notes specific to this article

- **The hook trains with a backtracking step, and rebalances first.** The
  curvature of this loss in the encoder scales with the *square* of the decoder's
  length, so after the reader stretches the decoder a fixed step size sends the
  whole chart to NaN. Rebalancing the two factors first is free — it is the very
  invariance the article is about — and it restores the conditioning.
- **`jacobiEigen`'s tolerance is on the sum of squares** of the off-diagonals,
  so it is the square of the accuracy you get. At the default 1e-12 the
  eigenvector residual came out at 1e-10 and the checking script rejected it.
- **Lines through the origin are clipped with `clipRayThroughOrigin`.** Drawing
  them as ±(a large number)·u looks identical, because the SVG clips, and
  quietly makes the document wider than the viewport.
- **The masthead is sized in `vw`.** "AUTOENCODERS" at the old fixed size was
  410px wide on a 390px phone. That fix went back into the other two articles too.

Design system and article format from [MLU-Explain](https://mlu-explain.github.io/),
used under CC BY-SA 4.0. Writing, code and data are original.
