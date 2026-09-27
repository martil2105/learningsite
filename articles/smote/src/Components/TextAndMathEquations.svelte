<script>
  /*
    The two consequences of the convex combination that hold for every k and
    every dataset. Both are identities rather than measurements, which is why
    they are here rather than in the sweep - and both are asserted in
    verify/check-numbers.mjs against the same modules the page imports.
  */
  import katexify from "../katexify.js";
  import { HOOK, HULL_ESCAPES, HULL_TRIALS, VAR_IDENTITY, K_DEFAULT, int, num, pct } from "../experiments.js";

  const row = (k) => HOOK.sweep.find((r) => r.k === k);
  const atDefault = row(K_DEFAULT).spreadRatio;
  const atFull = row(HOOK.minority.length - 1).spreadRatio;

  const eqSmote = katexify("x_{\\text{new}} = (1-\\lambda)\\,x_i + \\lambda\\,x_{z_i}", true);
  const eqLambda = katexify("\\lambda \\sim \\mathcal{U}(0,1), \\quad z_i \\in \\text{kNN}(x_i)", true);
  const eqHull = katexify("\\operatorname{conv}\\big(X \\cup \\tilde{X}\\big) = \\operatorname{conv}(X)", true);
  const eqVar = katexify(
    "\\operatorname{Cov}(x_{\\text{new}}) = \\left(\\frac{2}{3} - \\frac{1}{3(n-1)}\\right) S",
    true
  );
  const inlineLambda = katexify("\\lambda");
  const inlineN = katexify("n");
  const inlineS = katexify("S");
</script>

<h1 class="body-header">One line, two consequences</h1>

<p class="body-text">
  If we write it out, the step you just watched is a convex combination, which is
  a weighted average of two points with weights that add up to one:
</p>

<div class="eq">{@html eqSmote}</div>
<div class="eq small">{@html eqLambda}</div>

<p class="body-text">
  Since {@html inlineLambda} is drawn uniformly, the new row is equally likely to
  land anywhere on the segment. Two things follow immediately, and neither of
  them depends on the data, the value of <span class="mono">k</span>, or how
  many rows we generate.
</p>

<h2 class="sub-header">1. SMOTE can't leave the hull</h2>

<p class="body-text">
  A weighted average of two points from a set lies inside that set's convex hull,
  and so does a weighted average of such averages. So whatever SMOTE produces,
  the outline of the minority class doesn't move:
</p>

<div class="eq">{@html eqHull}</div>

<p class="body-text">
  The sweep behind the next two sections generates {int(HULL_TRIALS)} synthetic
  rows, covering every scenario and every <span class="mono">k</span> from 1 to
  {HOOK.minority.length - 1}. The number of them that landed outside the hull of
  the rows they were built from is
  <span class="bold">{HULL_ESCAPES}</span>, and it's not
  {HULL_ESCAPES === 0 ? "zero because the sample was lucky" : "small by luck"}.
  It's zero because it can't be anything else.
</p>

<p class="body-text">
  This means that what oversampling is usually sold as doing, giving the
  classifier a richer and more varied picture of the rare class, is exactly what
  it can't do. It has no way to produce a fraud larger than the largest one you
  logged, or earlier than the earliest one. It fills in, but it never reaches
  out.
</p>

<h2 class="sub-header">2. At large k, it pulls inward</h2>

<p class="body-text">
  There's also a second, quieter effect. If the neighbour is drawn uniformly
  from every other point (SMOTE at {@html katexify("k = n-1")}), the covariance
  of the synthetic cloud isn't the covariance of the real one, but a fixed
  fraction of it, where {@html inlineS} is the sample covariance of the
  {@html inlineN} real points:
</p>

<div class="eq">{@html eqVar}</div>

<p class="body-text">
  For the {HOOK.minority.length} fraud rows here, that's
  <span class="bold">{num(VAR_IDENTITY, 3)}</span>. In other words, a third of
  the variance is gone, not because of any particular sample, but as a property
  of averaging pairs. The measured ratio, computed exactly from the same points,
  is {num(atFull, 3)}.
</p>

<p class="body-text">
  It's worth being precise about when this matters, because it's usually quoted
  as a general warning against SMOTE, and it isn't one. At the default
  <span class="mono">k = {K_DEFAULT}</span>, the same calculation on the same
  points gives <span class="bold">{num(atDefault, 3)}</span>, so the synthetic
  cloud is very slightly <em>wider</em> than the real one, not narrower. The
  contraction only happens at large <span class="mono">k</span>, and at the
  setting almost everyone uses, it simply isn't happening.
</p>

<p class="body-text">
  Something else is happening at <span class="mono">k = {K_DEFAULT}</span>,
  though, and it's the thing you were dragging the point through.
</p>

<style>
  .sub-header {
    max-width: 600px;
    margin: 2rem auto 0.4rem auto;
    text-align: left;
    font-size: 1.28rem;
    line-height: 1.4;
    font-family: var(--font-heavy);
    color: var(--squid-ink);
  }

  /* A KaTeX display equation is routinely the widest thing on the page and will
     push the body sideways on a phone unless it is allowed to scroll itself. */
  .eq {
    max-width: 600px;
    margin: 1.1rem auto;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.15rem 0;
  }

  .eq.small { margin-top: -0.4rem; font-size: 0.88em; opacity: 0.85; }

  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .eq { max-width: 80%; }
  }
</style>
