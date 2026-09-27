<script>
  import katexify from "../katexify";
  import { accounts } from "../datasets.js";
  import { FOREST, N_TREES, PSI, ranked } from "../forest.js";

  // Quoted straight from the forest the charts use, so the prose cannot drift
  // away from the pictures.
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const cn = FOREST.norm;
</script>

<h1 class="body-header">Counting cuts, carefully</h1>
<p class="body-text">
  Write {@html katexify("h(x)")} for the number of cuts one tree needs to isolate
  the point {@html katexify("x")} — its
  <span class="bold">path length</span>, the depth of the leaf it ends up alone
  in. A single tree's value of {@html katexify("h(x)")} is close to useless on its
  own, so we grow {N_TREES} of them, each on its own random subsample, and average:
  {@html katexify("E[h(x)]")}.
</p>
<p class="body-text">
  That average still is not comparable to anything. Depth grows with sample
  size: isolating a point among a thousand takes more cuts than isolating it
  among ten, for reasons that have nothing to do with the point. We need to
  divide by the depth we would have expected anyway.
</p>
<p class="body-text">
  Here the algorithm gets a gift. Because splits are drawn uniformly, an
  isolation tree has the same structure as a random binary search tree, and the
  average depth of an unsuccessful search in such a tree with
  {@html katexify("n")} nodes is known exactly:
</p>
<div class="math-display">
  {@html katexify("c(n) = 2H(n-1) - \\frac{2(n-1)}{n}", true)}
</div>
<p class="body-text">
  where {@html katexify("H(i)")} is the {@html katexify("i")}-th harmonic number,
  well approximated by {@html katexify("\\ln(i) + 0.5772156649")} — the constant
  being Euler–Mascheroni. With the {PSI}-account subsamples used
  throughout this article, {@html katexify(`c(n) = ${cn.toFixed(2)}`)} — a
  typical point should need about {cn.toFixed(1)} cuts.
</p>
<p class="body-text">
  Divide by that yardstick and push the ratio through a negative exponent, and
  you get the anomaly score:
</p>
<div class="math-display">
  {@html katexify("s(x, n) = 2^{-\\frac{E[h(x)]}{c(n)}}", true)}
</div>
<p class="body-text">
  The shape of that expression is worth a moment. When a point takes exactly the
  expected number of cuts, the exponent is {@html katexify("-1")} and the score
  is {@html katexify("0.5")}. Isolate it instantly and
  {@html katexify("E[h(x)] \\to 0")}, so the score climbs toward
  {@html katexify("1")}. Keep having to cut and the score falls toward
  {@html katexify("0")}. The scale is fixed, which is the entire point: a score
  of {@html katexify("0.7")} means the same thing on a hundred rows as on ten
  million.
</p>
<p class="body-text">
  In the data below, the most isolated account scores
  <span class="bold">{top.score.toFixed(2)}</span>
  ({top.avgDepth.toFixed(1)} cuts on average) and the most deeply buried one
  scores <span class="bold">{bottom.score.toFixed(2)}</span>
  ({bottom.avgDepth.toFixed(1)} cuts). One caveat that follows directly from the
  formula: if every score in your dataset comes back near
  {@html katexify("0.5")}, that is not a failure to be tuned around. It is the
  model telling you it found no point meaningfully easier to isolate than any
  other.
</p>

<style>
  /* A display equation is the one thing on the page wide enough to push the
     body sideways on a phone. Let it scroll inside its own box instead. */
  .math-display {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 600px;
    margin: 0 auto;
    padding: 0.2rem 0;
  }

  @media screen and (max-width: 950px) {
    .math-display {
      max-width: 80%;
    }
  }
</style>
