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

<h1 class="body-header">What to take away</h1>

<p class="body-text">
  SMOTE isn't a bad idea. It's a <em>specific</em> idea, namely that a weighted
  average of two minority rows is itself a minority row, and it's worth knowing
  when you're betting on that and when you aren't. The bet is safe when every
  kind of thing in your rare class shows up more than
  <span class="mono">k</span> times, and it becomes unsafe as soon as one of
  them doesn't.
</p>

<p class="body-text">
  Unfortunately, the whole reason you reached for SMOTE is that the rare class
  is rare. The rarer it is, the more of its variety arrives in ones and twos,
  and the further the five nearest neighbours have to reach to find each other.
  In other words, the method is under the most strain exactly where it gets
  used.
</p>

<h2 class="sub-header">Things a two-dimensional picture hides</h2>

<p class="body-text">
  <span class="bold">Resample inside the fold, never before the split.</span>
  This is the one that keeps turning up in real work. If you oversample and then
  cross-validate, the synthetic rows in your training folds are interpolations
  of rows sitting in your validation fold, which puts a near-duplicate of the
  answer in the training set. Every score comes back looking beautiful, and none
  of them mean anything. So split first, and then resample only the training
  part.
</p>

<p class="body-text">
  <span class="bold">No value of λ makes sense for a categorical
  feature.</span> Interpolating <span class="mono">is_new_device</span> two
  thirds of the way gives 0.67, which no transaction has ever been. The original
  paper's SMOTE-NC handles this by taking a majority vote among the neighbours
  for nominal columns and using a distance that penalises disagreement. But
  plain SMOTE on one-hot encoded data manufactures rows that the source system
  could never emit, and tree-based models will happily split on the difference.
</p>

<p class="body-text">
  <span class="bold">It inherits every property of the distance you give
  it.</span> SMOTE is essentially a k-nearest-neighbours method in disguise, so
  the scaler is part of the algorithm. If you run it on raw euros and hours,
  you'll get a different set of synthetic rows than you would on standardised
  ones. In high dimensions, it gets worse. Blagus and Lusa found that as the
  number of features grows, the neighbours stop being meaningfully near, and for
  most classifiers, SMOTE stops doing anything at all.
</p>

<p class="body-text">
  <span class="bold">Afterwards, the probabilities are wrong.</span> A model
  trained on a balanced set estimates probabilities under a prior you invented.
  If anything downstream uses the number itself rather than the ranking (for
  example, an expected-loss threshold, a queue sized by risk, or a report of
  "how likely is this?"), the probabilities need correcting back, or that
  process will quietly miscount.
</p>

<h2 class="sub-header">A cheaper first move</h2>

<p class="body-text">
  Before generating anything, try moving the threshold. It takes one line of
  code, leaves the data alone and keeps the probabilities honest, and on all
  three label sets here, it landed exactly where SMOTE did. If that isn't enough
  (and for weak learners, it often isn't), then resample inside the fold, with
  <span class="mono">k</span> no larger than the smallest real subgroup you
  believe is in there, and prefer a variant that generates from the border
  rather than from everything.
</p>

<p class="body-text">
  Finally, check where the synthetic rows landed. The rate this article plots
  needs a generative model, which real data doesn't come with, but a version
  that doesn't need one takes just three lines. For each synthetic row, take the
  distance to its third nearest <em>real</em> minority row and to its third
  nearest majority row, and scale each distance by how many rows of that class
  there are. Whichever side wins is the denser class at that point, assuming
  equal priors. On the label set that broke here, this check agrees with the
  density-based one about {AGREE} of the time, and it reports a rate of
  {CHEAP} compared with the true {TRUE_RATE}.
</p>

<p class="body-text">
  Don't skip the scaling, by the way. If you ask the unweighted question (is the
  nearest real row fraud or legitimate?), the answer is dominated by the
  forty-to-one imbalance rather than by anything about the synthetic row, which
  is how the same data ends up reporting {NAIVE} instead. None of this tells you
  that SMOTE was wrong. It tells you where it made a claim, which is the part
  nobody is currently looking at.
</p>

<p class="body-text">
  Thanks for reading!
</p>

<p class="footnote">
  This article is a derived work of
  <a href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a>
  by Amazon's Machine Learning University, and it borrows their scaffold and
  design system under CC BY-SA 4.0. All prose, data, code and figures here are
  original. The fraud data is synthetic and isn't a model of any real payment
  system, and every number can be reproduced from
  <span class="mono">scripts/precompute.mjs</span> and is asserted in
  <span class="mono">verify/</span>. The comparison in the last section uses one
  classifier on one two-dimensional problem, which is enough to show a
  mechanism but not enough to settle the question.
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
