<script></script>

<br />
<br />
<br />
<section id="resources">
  <br />
  <h3 class="body-header">References + Open Source</h3>
  <p class="body-text">
    This article is a product of the following resources + the awesome people
    who made (and contributed to) them:
  </p>
  <br />
  <p class="resource-item">
    <a class="on-end" href="https://ieeexplore.ieee.org/document/4781136"
      >Isolation Forest</a
    ><br />
    (Fei Tony Liu, Kai Ming Ting & Zhi-Hua Zhou, ICDM 2008).
  </p>
  <p class="resource-item">
    <a class="on-end" href="https://dl.acm.org/doi/10.1145/2133360.2133363"
      >Isolation-Based Anomaly Detection</a
    ><br />
    (Fei Tony Liu, Kai Ming Ting & Zhi-Hua Zhou, ACM TKDD 2012) — the longer treatment,
    including swamping, masking and the c(n) derivation.
  </p>
  <p class="resource-item">
    <a class="on-end" href="https://arxiv.org/abs/1811.02141"
      >Extended Isolation Forest</a
    ><br />
    (Sahand Hariri, Matias Carrasco Kind & Robert J. Brunner, 2018).
  </p>
  <p class="resource-item">
    <a class="on-end" href="https://mlu-explain.github.io/">MLU-Explain</a><br />
    (Jared Wilber & the Amazon Machine Learning University team) — the article format,
    scaffold and design system this piece is built on, used under CC BY-SA 4.0.
  </p>
  <p class="resource-item">
    <a class="on-end" href="https://d3js.org/">D3.js</a><br />(Mike Bostock &
    Philippe Rivière)
  </p>
  <p class="resource-item">
    <a class="on-end" href="https://katex.org/">KaTeX</a> <br />(Emily Eisenberg
    & Sophie Alpert)
  </p>
  <p class="resource-item">
    <a class="on-end" href="https://svelte.dev/">Svelte</a><br />(Rich Harris)
  </p>
  <br />
  <br />
  <br />
</section>

<style>
  /* overwrite */
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
  }

  a.on-end {
    text-decoration: underline;
    color: #f1f3f3;
  }

  /* mobile */
  @media screen and (max-width: 950px) {
    .resource-item {
      max-width: 80%;
      font-size: 17px;
    }
  }
</style>
