<script></script>

<br />
<br />
<br />
<section id="resources">
  <br />
  <h3 class="body-header">References + Open Source</h3>
  <p class="body-text">
    This article was built with the following papers, documentation and
    open-source libraries:
  </p>
  <br />

  <p class="resource-item">
    <a class="on-end" href="https://proceedings.neurips.cc/paper/2017/hash/6449f44a102fde848669bdd9eb6b76fa-Abstract.html" target="_blank" rel="noreferrer"
      >LightGBM: A Highly Efficient Gradient Boosting Decision Tree</a
    ><br />
    Guolin Ke, Qi Meng, Thomas Finley, Taifeng Wang, Wei Chen, Weidong Ma, Qiwei Ye
    &amp; Tie-Yan Liu (NeurIPS 2017) — the paper. Worth reading for what it is
    actually about: GOSS and EFB. The histogram is the substrate underneath both.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://lightgbm.readthedocs.io/en/latest/Features.html" target="_blank" rel="noreferrer"
      >LightGBM: Features</a
    ><br />
    The clearest statement of the histogram algorithm and the subtraction trick,
    including the line this article is built around: build the histogram for only
    one child and obtain its neighbour by subtraction.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://lightgbm.readthedocs.io/en/latest/Parameters.html" target="_blank" rel="noreferrer"
      >LightGBM: Parameters</a
    ><br />
    Where the defaults quoted here come from — <span class="mono">max_bin = 255</span>,
    <span class="mono">min_data_in_bin = 3</span>,
    <span class="mono">bin_construct_sample_cnt = 200000</span>,
    <span class="mono">num_leaves = 31</span>,
    <span class="mono">min_data_in_leaf = 20</span> — and the note that a feature
    value is stored in a <span class="mono">uint8_t</span> at 255 bins.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://arxiv.org/abs/1603.02754" target="_blank" rel="noreferrer"
      >XGBoost: A Scalable Tree Boosting System</a
    ><br />
    Tianqi Chen &amp; Carlos Guestrin (KDD 2016) — the gain formula used
    throughout, and the weighted quantile sketch, which proposes candidate splits
    from a summary rather than from the rows: the same instinct, arrived at
    differently.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://xgboost.readthedocs.io/en/stable/treemethod.html" target="_blank" rel="noreferrer"
      >XGBoost: Tree Methods</a
    ><br />
    Which describes its own <span class="mono">hist</span> method as "an
    approximation tree method used in LightGBM with slight differences in
    implementation" — the cleanest available answer to who had the idea.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1214/aos/1013203451" target="_blank" rel="noreferrer"
      >Greedy Function Approximation: A Gradient Boosting Machine</a
    ><br />
    Jerome H. Friedman (Annals of Statistics 29(5), 2001) — gradient boosting,
    and the reason a tree is being fitted to gradients at all.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://proceedings.neurips.cc/paper/2022/hash/0378c7692da36807bdec87ab043cdadc-Abstract-Datasets_and_Benchmarks.html" target="_blank" rel="noreferrer"
      >Why do tree-based models still outperform deep learning on tabular data?</a
    ><br />
    Léo Grinsztajn, Edouard Oyallon &amp; Gaël Varoquaux (NeurIPS 2022) — the
    benchmark to cite when someone asks why any of this still matters.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a
    ><br />
    Jared Wilber &amp; the Amazon Machine Learning University team — the article
    format, scaffold and design system this piece is built on, used under
    CC BY-SA 4.0. The writing, code and data here are original.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://d3js.org/" target="_blank" rel="noreferrer">D3.js</a><br />
    Mike Bostock &amp; the D3 community.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://katex.org/" target="_blank" rel="noreferrer">KaTeX</a><br />
    Emily Eisenberg, Sophie Alpert &amp; the KaTeX team.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://svelte.dev/" target="_blank" rel="noreferrer">Svelte</a><br />
    Rich Harris &amp; the Svelte maintainers.
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

  .mono {
    font-family: var(--font-mono, monospace);
    font-size: 0.92em;
  }

  @media screen and (max-width: 950px) {
    .resource-item {
      max-width: 85%;
      font-size: 16px;
    }
  }
</style>
