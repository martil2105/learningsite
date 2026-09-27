<h1 class="body-header">References</h1>

<div class="refs">
  <p class="ref">
    Yurdakul, B., &amp; Naranjo, J. (2020).
    <a href="https://www.risk.net/journal-of-risk-model-validation/7725371/statistical-properties-of-the-population-stability-index" target="_blank" rel="noreferrer">
      Statistical properties of the population stability index</a>.
    <em>Journal of Risk Model Validation</em>, 14(4), 89–100.
    <span class="note">Theorem 3.3 is the result the middle of this article rests on:
    (1/n + 1/m)⁻¹ PSI is approximately chi-square with B − 1 degrees of freedom. The paper
    also gives the critical-value formula and the normal approximation to it, and tabulates
    values for ten and twenty bins.</span>
  </p>

  <p class="ref">
    Lewis, E. M. (1994). <em>An Introduction to Credit Scoring</em> (2nd ed.). Athena Press.
    <span class="note">Where the 0.10 and 0.25 thresholds are usually traced to. They have been
    repeated without a sampling argument ever since.</span>
  </p>

  <p class="ref">
    Kullback, S., &amp; Leibler, R. A. (1951).
    <a href="https://doi.org/10.1214/aoms/1177729694" target="_blank" rel="noreferrer">
      On Information and Sufficiency</a>.
    <em>The Annals of Mathematical Statistics</em>, 22(1), 79–86.
    <span class="note">The divergence J — the symmetric one, I(1:2) + I(2:1) — which is PSI's
    formula exactly, forty years before it was given a credit-scoring name.</span>
  </p>

  <p class="ref">
    Potgieter, C. J., Van Zyl, C., Schutte, W. D., &amp; Lombard, F. (2025).
    <a href="https://arxiv.org/abs/2307.11878" target="_blank" rel="noreferrer">
      The Population Resemblance Statistic: A Chi-Square Measure of Fit for Banking</a>.
    arXiv:2307.11878.
    <span class="note">Makes the same sample-size argument and proposes replacing PSI with the
    Pearson statistic itself — which, as the expansion in this article shows, is the same thing
    to first order with the scaling left in.</span>
  </p>

  <p class="ref">
    Du Pisanie, J., Allison, J. S., Budde, C. J., &amp; Visagie, I. J. H. (2023).
    <a href="https://arxiv.org/abs/2303.01227" target="_blank" rel="noreferrer">
      A critical review of existing and new population stability testing procedures in credit
      risk scoring</a>. arXiv:2303.01227.
    <span class="note">A survey of the alternatives, and an effect-size-based proposal aimed at
    the large-sample end of the problem — the half of it this article's right-hand charts are about.</span>
  </p>

  <p class="ref">
    Siddiqi, N. (2017). <em>Intelligent Credit Scoring: Building and Implementing Better Credit
    Risk Scorecards</em> (2nd ed.). Wiley.
    <span class="note">The standard practitioner account of scorecard monitoring, including the
    characteristic-level version of PSI and the deciles-of-development convention used throughout
    this article.</span>
  </p>

  <p class="ref">
    Board of Governors of the Federal Reserve System &amp; Office of the Comptroller of the
    Currency (2011).
    <a href="https://www.federalreserve.gov/supervisionreg/srletters/sr1107a1.pdf" target="_blank" rel="noreferrer">
      Supervisory Guidance on Model Risk Management</a> (SR 11-7 / OCC 2011-12).
    <span class="note">The source of the obligation that makes any of this matter: ongoing
    monitoring is required, has to cover the segments the model is used on, and has to be able to
    say when a model is no longer fit for purpose.</span>
  </p>

  <p class="ref">
    Miller, G. A. (1955). Note on the bias of information estimates. In H. Quastler (Ed.),
    <em>Information Theory in Psychology: Problems and Methods</em>, 95–100. Free Press.
    <span class="note">The general phenomenon the correction here is an instance of: a plug-in
    estimate of an information quantity is biased upward by roughly (cells − 1) over sample size,
    and the fix is to subtract it.</span>
  </p>

  <p class="ref">
    Paninski, L. (2003).
    <a href="https://doi.org/10.1162/089976603321780272" target="_blank" rel="noreferrer">
      Estimation of Entropy and Mutual Information</a>.
    <em>Neural Computation</em>, 15(6), 1191–1253.
    <span class="note">The modern treatment of that bias, including how badly it behaves when the
    cells hold only a handful of observations — which is the regime the validity table in this
    article is measuring.</span>
  </p>

  <p class="ref">
    Hörmann, W. (1993). The generation of binomial random variates.
    <em>Journal of Statistical Computation and Simulation</em>, 46(1–2), 101–110.
    <span class="note">Background to the exact binomial sampling this page uses. The simulations
    here cannot approximate a multinomial with a normal, because the thing being simulated is
    precisely whether that approximation holds.</span>
  </p>

  <p class="ref">
    Amazon Machine Learning University.
    <a href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a>.
    <span class="note">The format, the scaffold and the design system this page is built on, used
    under CC BY-SA 4.0.</span>
  </p>
</div>

<div class="tail" />

<style>
  .refs { max-width: 600px; margin: 0 auto; }
  .ref {
    font-family: var(--font-main); font-size: 0.92rem; line-height: 1.55;
    color: var(--squid-ink); margin: 0 0 1.05rem 0;
  }
  .note { display: block; font-size: 0.82rem; color: #718096; margin-top: 0.15rem; }
  .tail { height: 4rem; }
  @media screen and (max-width: 950px) { .refs { max-width: 80%; } }
</style>
