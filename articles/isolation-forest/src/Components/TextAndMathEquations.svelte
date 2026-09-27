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
  Let's write {@html katexify("h(x)")} for the number of cuts one tree needs to
  isolate the point {@html katexify("x")}. This is called the point's
  <span class="bold">path length</span>, and it's the depth of the leaf where the
  point ends up alone. On its own, a single tree's value of
  {@html katexify("h(x)")} is close to useless, so we grow {N_TREES} trees, each
  on its own random subsample, and take the average,
  {@html katexify("E[h(x)]")}.
</p>
<p class="body-text">
  However, that average still isn't comparable to anything. Depth grows with
  sample size, since isolating a point among a thousand others takes more cuts
  than isolating it among ten, for reasons that have nothing to do with the point
  itself. To fix this, we need to divide by the depth we would have expected
  anyway.
</p>
<p class="body-text">
  Here, the algorithm gets a lucky break. Because splits are drawn uniformly, an
  isolation tree has the same structure as a random binary search tree, and the
  average depth of an unsuccessful search in such a tree with
  {@html katexify("n")} nodes is known exactly:
</p>
<div class="math-display">
  {@html katexify("c(n) = 2H(n-1) - \\frac{2(n-1)}{n}", true)}
</div>
<p class="body-text">
  Here, {@html katexify("H(i)")} is the {@html katexify("i")}-th harmonic
  number, which is well approximated by
  {@html katexify("\\ln(i) + 0.5772156649")} (that constant is the
  Euler–Mascheroni constant). With the {PSI}-account subsamples used throughout
  this article, {@html katexify(`c(n) = ${cn.toFixed(2)}`)}, so a typical point
  should need about {cn.toFixed(1)} cuts.
</p>
<p class="body-text">
  If we divide by that yardstick and push the ratio through a negative exponent,
  we get the anomaly score:
</p>
<div class="math-display">
  {@html katexify("s(x, n) = 2^{-\\frac{E[h(x)]}{c(n)}}", true)}
</div>
<p class="body-text">
  It's worth taking a moment to look at the shape of this expression. When a
  point takes exactly the expected number of cuts, the exponent is
  {@html katexify("-1")} and the score is {@html katexify("0.5")}. If a point is
  isolated instantly, then {@html katexify("E[h(x)] \\to 0")}, so its score
  climbs toward {@html katexify("1")}. And if we keep having to cut, the score
  falls toward {@html katexify("0")}. Because the scale is fixed, a score of
  {@html katexify("0.7")} means the same thing on a hundred rows as it does on
  ten million, which is exactly what we wanted.
</p>
<p class="body-text">
  In the data below, the most isolated account scores
  <span class="bold">{top.score.toFixed(2)}</span>
  ({top.avgDepth.toFixed(1)} cuts on average), and the most deeply buried one
  scores <span class="bold">{bottom.score.toFixed(2)}</span>
  ({bottom.avgDepth.toFixed(1)} cuts). One caveat follows directly from the
  formula. If every score in your dataset comes back near
  {@html katexify("0.5")}, that isn't a failure to be tuned away. It's the model
  telling you that it found no point meaningfully easier to isolate than any
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
