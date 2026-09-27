<script>
  /* The cheap check the last section recommends, measured rather than asserted:
     the paragraph claims it agrees with the density verdict, so the number in
     the sentence is computed from the same modules the page imports and
     verify/check-numbers.mjs holds the claim to a floor. */
  import { HOOK, K_DEFAULT, CHEAP_CHECK, pct, int } from "../experiments.js";
  const AGREE = pct(CHEAP_CHECK.agree);
  const CHEAP = pct(CHEAP_CHECK.cheapRate, 1);
  const TRUE_RATE = pct(CHEAP_CHECK.trueRate, 1);
  const NAIVE = pct(CHEAP_CHECK.naiveRate, 1);
</script>

<h1 class="body-header">What to take from it</h1>

<p class="body-text">
  SMOTE is not a bad idea. It is a <em>specific</em> idea — that a weighted
  average of two minority rows is a minority row — and it is worth knowing when
  you are betting on that and when you are not. The bet is safe when every kind
  of thing in your rare class shows up more than <span class="mono">k</span>
  times, and unsafe as soon as one of them does not.
</p>

<p class="body-text">
  Which is unfortunate, because the whole reason you reached for SMOTE is that
  the rare class is rare. The rarer it is, the more of its variety arrives in
  ones and twos, and the further five nearest neighbours have to reach to find
  each other. The method is under the most strain exactly where it is used.
</p>

<h2 class="sub-header">Things a two-dimensional picture hides</h2>

<p class="body-text">
  <span class="bold">Resample inside the fold, never before the split.</span>
  This is the one that turns up in real work. Oversample and then
  cross-validate, and the synthetic rows in your training folds are
  interpolations of rows sitting in your validation fold — a near-duplicate of
  the answer, in the training set. Every score comes back beautiful and none of
  them mean anything. Split first, then resample the training part only.
</p>

<p class="body-text">
  <span class="bold">There is no λ that makes sense for a categorical
  feature.</span> Interpolating <span class="mono">is_new_device</span> two
  thirds of the way gives 0.67, which no transaction has ever been. The original
  paper's SMOTE-NC handles this — majority vote among the neighbours for nominal
  columns, and a distance that penalises disagreement — but plain SMOTE on
  one-hot encoded data is manufacturing rows the source system could not emit,
  and tree-based models will happily split on the difference.
</p>

<p class="body-text">
  <span class="bold">It inherits every property of the distance you gave
  it.</span> SMOTE is a k-nearest-neighbours method wearing a hat, so the
  scaler is part of the algorithm: run it on raw euros and hours and you get a
  different set of synthetic rows than on standardised ones. In high dimensions
  it gets worse — Blagus and Lusa found that as the feature count grows the
  neighbours stop being meaningfully near, and for most classifiers SMOTE stops
  doing anything at all.
</p>

<p class="body-text">
  <span class="bold">Afterwards, the probabilities are wrong.</span> A model
  trained on a balanced set is estimating probabilities under a prior you
  invented. If anything downstream consumes the number rather than the ranking —
  an expected-loss threshold, a queue sized by risk, a report of "how likely is
  this" — it needs correcting back, or it is quietly miscounting.
</p>

<h2 class="sub-header">A cheaper first move</h2>

<p class="body-text">
  Before generating anything, move the threshold. It costs one line, it leaves
  the data alone, the probabilities stay honest, and on all three label sets
  here it landed exactly where SMOTE did. If it is not enough — and for weak
  learners it often is not — then resample, in the fold, with
  <span class="mono">k</span> no larger than the smallest genuine subgroup you
  believe is in there, and prefer a variant that generates from the border
  rather than from everything.
</p>

<p class="body-text">
  And check where the synthetic rows landed. The rate this article draws needs a
  generative model, which real data does not come with — but a version that does
  not needs three lines. For each synthetic row, take the distance to its third
  nearest <em>real</em> minority row and to its third nearest majority row, and
  scale each by how many rows of that class there are. Whichever side wins is
  the denser class there, at equal priors. On the label set that broke here,
  that check agrees with the density one about
  {AGREE} of the time and reports a rate of {CHEAP} against the true
  {TRUE_RATE}.
</p>

<p class="body-text">
  Do not skip the scaling, incidentally. Ask the unweighted question — is the
  nearest real row fraud or legitimate — and the answer is dominated by the
  forty-to-one imbalance rather than by anything about the synthetic row, which
  is how the same data reports {NAIVE} instead. None of this tells you SMOTE was
  wrong. It tells you where it made a claim, which is the part nobody is
  currently looking at.
</p>

<p class="footnote">
  This article is a derived work of
  <a href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a>
  by Amazon's Machine Learning University, whose scaffold and design system it
  borrows under CC BY-SA 4.0. All prose, data, code and figures here are
  original. The fraud data is synthetic and is not a model of any real payment
  system; every number is reproducible from
  <span class="mono">scripts/precompute.mjs</span> and asserted in
  <span class="mono">verify/</span>. The comparison in the last section is one
  classifier on one two-dimensional problem — enough to show a mechanism, not
  enough to settle a question.
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

  .footnote {
    max-width: 600px;
    margin: 2.5rem auto 1rem auto;
    font-family: var(--font-main);
    font-size: 0.82rem;
    line-height: 1.6;
    color: #718096;
    border-top: 1px solid #e2e8f0;
    padding-top: 1rem;
  }

  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .footnote { max-width: 80%; }
  }
</style>
