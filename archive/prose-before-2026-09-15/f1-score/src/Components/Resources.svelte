<h1 class="body-header">References</h1>

<div class="refs">
  <p class="ref">
    Lipton, Z. C., Elkan, C., &amp; Narayanaswamy, B. (2014).
    <a href="https://arxiv.org/abs/1402.1892" target="_blank" rel="noreferrer">
      Thresholding Classifiers to Maximize F1 Score</a>.
    arXiv:1402.1892.
    <span class="note">The primary reference: proves that optimal thresholding for F1 on calibrated classifiers satisfies t* = F1max / 2.</span>
  </p>

  <p class="ref">
    Hand, D. J. (2009).
    <a href="https://link.springer.com/article/10.1007/s10994-009-5119-5" target="_blank" rel="noreferrer">
      Measuring classifier performance: a coherent alternative to the area under the ROC curve</a>.
    <em>Machine Learning</em>, 77(1), 103–123.
    <span class="note">Seminal analysis showing how conventional metrics like AUC and F-score evaluate performance against implicit, model-dependent cost distributions.</span>
  </p>

  <p class="ref">
    Flach, P., &amp; Kull, M. (2015).
    <a href="https://papers.nips.cc/paper/5867-precision-recall-gain-curves-pr-analysis-done-right" target="_blank" rel="noreferrer">
      Precision-Recall-Gain Curves: PR Analysis Done Right</a>.
    <em>Advances in Neural Information Processing Systems (NeurIPS)</em>, 28.
    <span class="note">Examines why precision and recall change with class prevalence and proposes calibrated alternatives.</span>
  </p>

  <p class="ref">
    Provost, F., Fawcett, T., &amp; Kohavi, R. (1998).
    <a href="https://www.aaai.org/Papers/ICML/1998/ICML98-057.pdf" target="_blank" rel="noreferrer">
      The Case Against Accuracy Estimation for Comparing Induction Algorithms</a>.
    <em>International Conference on Machine Learning (ICML)</em>.
    <span class="note">The foundation of cost curves and decision-theoretic classifier evaluation under imbalanced costs.</span>
  </p>

  <p class="ref">
    Amazon Machine Learning University.
    <a href="https://mlu-explain.github.io/precision-recall/" target="_blank" rel="noreferrer">
      Precision &amp; Recall</a>.
    <em>MLU-Explain</em>.
    <span class="note">The sister article in the MLU-Explain series introducing precision, recall, and threshold sliders.</span>
  </p>
</div>

<div class="tail" />

<style>
  .refs { max-width: 600px; margin: 0 auto; }

  .ref {
    font-family: var(--font-main);
    font-size: 0.92rem;
    line-height: 1.55;
    color: var(--squid-ink);
    margin: 0 0 1.15rem 0;
  }

  .note {
    display: block;
    font-size: 0.82rem;
    color: #718096;
    margin-top: 0.2rem;
    line-height: 1.35;
  }

  .tail { height: 4rem; }

  @media screen and (max-width: 950px) {
    .refs { max-width: 80%; }
  }
</style>
