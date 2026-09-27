<h1 class="body-header">References</h1>

<div class="refs">
  <p class="ref">
    Chawla, N. V., Bowyer, K. W., Hall, L. O., &amp; Kegelmeyer, W. P. (2002).
    <a href="https://www.jair.org/index.php/jair/article/view/10302" target="_blank" rel="noreferrer">
      SMOTE: Synthetic Minority Over-sampling Technique</a>.
    <em>Journal of Artificial Intelligence Research</em>, 16, 321–357.
    <span class="note">The original. Section 5.3 defines SMOTE-NC for mixed data types.</span>
  </p>

  <p class="ref">
    Han, H., Wang, W.-Y., &amp; Mao, B.-H. (2005).
    Borderline-SMOTE: A New Over-Sampling Method in Imbalanced Data Sets Learning.
    <em>Advances in Intelligent Computing (ICIC 2005)</em>, 878–887.
    <span class="note">Generate only from the minority points that have majority neighbours.</span>
  </p>

  <p class="ref">
    He, H., Bai, Y., Garcia, E. A., &amp; Li, S. (2008).
    ADASYN: Adaptive Synthetic Sampling Approach for Imbalanced Learning.
    <em>IEEE International Joint Conference on Neural Networks</em>, 1322–1328.
    <span class="note">The same instinct, as a weighting rather than a filter.</span>
  </p>

  <p class="ref">
    Batista, G. E. A. P. A., Prati, R. C., &amp; Monard, M. C. (2004).
    A Study of the Behavior of Several Methods for Balancing Machine Learning Training Data.
    <em>ACM SIGKDD Explorations Newsletter</em>, 6(1), 20–29.
    <span class="note">Where SMOTE-ENN and SMOTE-Tomek come from — cleaning after generating.</span>
  </p>

  <p class="ref">
    Wilson, D. L. (1972). Asymptotic Properties of Nearest Neighbor Rules Using Edited Data.
    <em>IEEE Transactions on Systems, Man, and Cybernetics</em>, SMC-2(3), 408–421.
    <span class="note">The ENN pass used in the last figure.</span>
  </p>

  <p class="ref">
    Blagus, R., &amp; Lusa, L. (2013).
    <a href="https://bmcbioinformatics.biomedcentral.com/articles/10.1186/1471-2105-14-106" target="_blank" rel="noreferrer">
      SMOTE for high-dimensional class-imbalanced data</a>.
    <em>BMC Bioinformatics</em>, 14, 106.
    <span class="note">What happens to interpolation when the neighbours stop being near.</span>
  </p>

  <p class="ref">
    Elor, Y., &amp; Averbuch-Elor, H. (2022).
    <a href="https://arxiv.org/abs/2201.08528" target="_blank" rel="noreferrer">To SMOTE, or not to SMOTE?</a>
    arXiv:2201.08528.
    <span class="note">Balancing helps weak classifiers and does not help strong ones.</span>
  </p>

  <p class="ref">
    van den Goorbergh, R., van Smeden, M., Timmerman, D., &amp; Van Calster, B. (2022).
    <a href="https://doi.org/10.1093/jamia/ocac093" target="_blank" rel="noreferrer">
      The harm of class imbalance corrections for risk prediction models: illustration and simulation using
      logistic regression</a>.
    <em>Journal of the American Medical Informatics Association</em>, 29(9), 1525–1534.
    <span class="note">Corrections left discrimination unchanged and destroyed calibration; moving the
    threshold got the same classifications without the damage.</span>
  </p>

  <p class="ref">
    Lemaître, G., Nogueira, F., &amp; Aridas, C. K. (2017).
    <a href="https://jmlr.org/papers/v18/16-365.html" target="_blank" rel="noreferrer">
      Imbalanced-learn: A Python Toolbox to Tackle the Curse of Imbalanced Datasets in Machine Learning</a>.
    <em>Journal of Machine Learning Research</em>, 18(17), 1–5.
    <span class="note">The implementation almost everyone is actually running.</span>
  </p>

  <p class="ref">
    Amazon Machine Learning University.
    <a href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a>.
    <span class="note">The format, the scaffold and the design system this page is built on, used under
    CC BY-SA 4.0.</span>
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
    margin: 0 0 1.05rem 0;
  }

  .note {
    display: block;
    font-size: 0.82rem;
    color: #718096;
    margin-top: 0.15rem;
  }

  .tail { height: 4rem; }

  @media screen and (max-width: 950px) {
    .refs { max-width: 80%; }
  }
</style>
