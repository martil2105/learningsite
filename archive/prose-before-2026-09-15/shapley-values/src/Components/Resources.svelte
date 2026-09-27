<script></script>

<br />
<br />
<br />
<section id="resources">
  <br />
  <h3 class="body-header">References + Open Source</h3>
  <p class="body-text">
    This article was built with the following foundational papers and open-source
    libraries:
  </p>
  <br />

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1515/9781400881970-018" target="_blank" rel="noreferrer"
      >A Value for n-Person Games</a
    ><br />
    Lloyd S. Shapley, in <em>Contributions to the Theory of Games II</em>, Annals of
    Mathematics Studies 28 (1953), pp. 307–317 — the axioms and the uniqueness theorem.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://arxiv.org/abs/1705.07874" target="_blank" rel="noreferrer"
      >A Unified Approach to Interpreting Model Predictions</a
    ><br />
    Scott M. Lundberg & Su-In Lee (NeurIPS 2017) — the paper that named SHAP and
    connected Shapley values to LIME and DeepLIFT.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://www.nature.com/articles/s42256-019-0138-9" target="_blank" rel="noreferrer"
      >From local explanations to global understanding with explainable AI for trees</a
    ><br />
    Scott M. Lundberg, Gabriel Erion, Hugh Chen et al. (Nature Machine Intelligence 2,
    56–67, 2020) — TreeSHAP, and the polynomial-time algorithm behind it.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://link.springer.com/article/10.1007/s10115-013-0679-x" target="_blank" rel="noreferrer"
      >Explaining prediction models and individual predictions with feature contributions</a
    ><br />
    Erik Štrumbelj & Igor Kononenko (Knowledge and Information Systems 41, 2014) — the
    sampling estimator, three years before SHAP.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://proceedings.mlr.press/v108/janzing20a.html" target="_blank" rel="noreferrer"
      >Feature relevance quantification in explainable AI: A causal problem</a
    ><br />
    Dominik Janzing, Lenon Minorics & Patrick Blöbaum (AISTATS 2020) — the case for the
    interventional value function, argued causally.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://www.sciencedirect.com/science/article/pii/S0004370221000539" target="_blank" rel="noreferrer"
      >Explaining individual predictions when features are dependent</a
    ><br />
    Kjersti Aas, Martin Jullum & Anders Løland (Artificial Intelligence 298, 2021) — the
    other side of that argument, and better conditional approximations when features are
    correlated.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://proceedings.mlr.press/v119/kumar20e.html" target="_blank" rel="noreferrer"
      >Problems with Shapley-value-based explanations as feature importance measures</a
    ><br />
    I. Elizabeth Kumar, Suresh Venkatasubramanian, Carlos Scheidegger & Sorelle Friedler
    (ICML 2020) — read this before quoting a SHAP ranking as evidence of anything.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://arxiv.org/abs/2006.16234" target="_blank" rel="noreferrer"
      >True to the Model or True to the Data?</a
    ><br />
    Hugh Chen, Joseph D. Janizek, Scott Lundberg & Su-In Lee (2020) — the clearest short
    statement of the interventional-versus-conditional choice.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://christophm.github.io/interpretable-ml-book/shapley.html" target="_blank" rel="noreferrer"
      >Interpretable Machine Learning</a
    ><br />
    Christoph Molnar — the standard practitioner reference, and free.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer"
      >MLU-Explain</a
    ><br />
    Jared Wilber & the Amazon Machine Learning University team — the article format,
    scaffold and design system this piece is built on, used under CC BY-SA 4.0. The
    writing, code and data here are original.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://d3js.org/" target="_blank" rel="noreferrer">D3.js</a><br />
    Mike Bostock & the D3 community.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://katex.org/" target="_blank" rel="noreferrer">KaTeX</a><br />
    Emily Eisenberg, Sophie Alpert & the KaTeX team.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://svelte.dev/" target="_blank" rel="noreferrer">Svelte</a><br />
    Rich Harris & the Svelte maintainers.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://rsms.me/inter/" target="_blank" rel="noreferrer">Inter</a>
    and
    <a class="on-end" href="https://www.ibm.com/plex/" target="_blank" rel="noreferrer">IBM Plex Mono</a><br />
    Rasmus Andersson; IBM. Both under the SIL Open Font License, self-hosted.
  </p>
  <br />
  <br />
  <br />
</section>

<style>
  p.body-text {
    color: white;
  }
  #resources {
    background-color: var(--primary);
    color: white;
  }
  .resource-item {
    max-width: 600px;
    margin: 0 auto;
    text-align: left;
    font-size: 18px;
    line-height: 1.5em;
    font-family: var(--font-main);
    color: white;
    margin-bottom: 1.2rem;
  }

  a.on-end {
    text-decoration: underline;
    color: #f1f3f3;
  }

  @media screen and (max-width: 950px) {
    .resource-item {
      max-width: 85%;
      font-size: 16px;
    }
  }
</style>
