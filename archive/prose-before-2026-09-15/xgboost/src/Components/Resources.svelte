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
    <a class="on-end" href="https://arxiv.org/abs/1603.02754" target="_blank" rel="noreferrer"
      >XGBoost: A Scalable Tree Boosting System</a
    ><br />
    Tianqi Chen & Carlos Guestrin (ACM SIGKDD, 2016).
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://projecteuclid.org/journals/annals-of-statistics/volume-29/issue-5/Greedy-function-approximation-A-gradient-boosting-machine/10.1214/aos/1013203451.full" target="_blank" rel="noreferrer"
      >Greedy Function Approximation: A Gradient Boosting Machine</a
    ><br />
    Jerome H. Friedman (The Annals of Statistics, 2001).
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://xgboost.readthedocs.io/" target="_blank" rel="noreferrer"
      >XGBoost Documentation & Source Code</a
    ><br />
    DMLC / Distributed (Deep) Machine Learning Community.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://arxiv.org/abs/2207.08815" target="_blank" rel="noreferrer"
      >Why do tree-based models still outperform deep learning on tabular data?</a
    ><br />
    Léo Grinsztajn, Edouard Oyallon & Gaël Varoquaux (NeurIPS 2022) — the benchmark behind
    the claim that trees still win on tables, and a careful account of why.
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
