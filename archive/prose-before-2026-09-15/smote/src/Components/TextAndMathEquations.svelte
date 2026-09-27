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
  Written out, the step you just watched is a convex combination — a weighted
  average of two points, with the weights adding to one:
</p>

<div class="eq">{@html eqSmote}</div>
<div class="eq small">{@html eqLambda}</div>

<p class="body-text">
  {@html inlineLambda} is drawn uniformly, so the new row is equally likely to
  land anywhere on the segment. Two things follow immediately, and neither of
  them depends on the data, the value of <span class="mono">k</span>, or how
  many rows you generate.
</p>

<h2 class="sub-header">1. SMOTE cannot leave the hull</h2>

<p class="body-text">
  A weighted average of two points from a set is inside that set's convex hull,
  and so is a weighted average of averages. Whatever SMOTE produces, the outline
  of the minority class does not move:
</p>

<div class="eq">{@html eqHull}</div>

<p class="body-text">
  The sweep behind the next two sections generates {int(HULL_TRIALS)} synthetic
  rows — every scenario, every <span class="mono">k</span> from 1 to
  {HOOK.minority.length - 1}. The number of them that landed outside the hull of
  the rows they were built from is
  <span class="bold">{HULL_ESCAPES}</span>, and it is not
  {HULL_ESCAPES === 0 ? "zero because the sample was lucky" : "small by luck"} —
  it is zero because it cannot be anything else.
</p>

<p class="body-text">
  So the thing oversampling is usually sold as doing — giving the classifier a
  richer, more varied picture of the rare class — is exactly the thing it cannot
  do. It has no mechanism for a fraud larger than the largest one you logged, or
  earlier than the earliest. It fills in; it never reaches out.
</p>

<h2 class="sub-header">2. And at large k it pulls inward</h2>

<p class="body-text">
  There is a second, quieter effect. If the neighbour is drawn uniformly from
  every other point — SMOTE at {@html katexify("k = n-1")} — the covariance of
  the synthetic cloud is not the covariance of the real one but a fixed fraction
  of it, where {@html inlineS} is the sample covariance of the
  {@html inlineN} real points:
</p>

<div class="eq">{@html eqVar}</div>

<p class="body-text">
  For the {HOOK.minority.length} fraud rows here that is
  <span class="bold">{num(VAR_IDENTITY, 3)}</span> — a third of the variance
  gone, not as an artefact of any particular sample but as a property of
  averaging pairs. The measured ratio, computed exactly from the same points, is
  {num(atFull, 3)}.
</p>

<p class="body-text">
  It is worth being precise about when that matters, because it is usually
  quoted as a general warning against SMOTE and it is not one. At the default
  <span class="mono">k = {K_DEFAULT}</span> the same calculation on the same
  points gives <span class="bold">{num(atDefault, 3)}</span>: the synthetic cloud
  is very slightly <em>wider</em> than the real one, not narrower. The
  contraction is a large-<span class="mono">k</span> phenomenon and at the
  setting almost everybody uses it is simply not happening.
</p>

<p class="body-text">
  Something else is happening at <span class="mono">k = {K_DEFAULT}</span>,
  though, and it is the thing you were dragging the point through.
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
