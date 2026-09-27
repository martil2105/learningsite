<script></script>

<br />
<br />
<br />
<section id="resources">
  <br />
  <h3 class="body-header">References + Open Source</h3>
  <p class="body-text">
    This article was built with the following papers and open-source libraries:
  </p>
  <br />

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1016/0893-6080(89)90014-2" target="_blank" rel="noreferrer"
      >Neural networks and principal component analysis: Learning from examples without local minima</a
    ><br />
    Pierre Baldi &amp; Kurt Hornik, Neural Networks 2(1), 53–58 (1989) — the landscape
    result. Every critical point is the global optimum or a saddle, and the optimum is
    projection onto the principal subspace.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1007/BF00332918" target="_blank" rel="noreferrer"
      >Auto-association by multilayer perceptrons and singular value decomposition</a
    ><br />
    Hervé Bourlard &amp; Yves Kamp, Biological Cybernetics 59, 291–294 (1988) — the same
    connection, arrived at a year earlier and from the SVD side.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1007/BF02288367" target="_blank" rel="noreferrer"
      >The approximation of one matrix by another of lower rank</a
    ><br />
    Carl Eckart &amp; Gale Young, Psychometrika 1(3), 211–218 (1936) — the theorem the
    bottleneck is unknowingly solving, and the reason the error equals the sum of the
    discarded eigenvalues.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://arxiv.org/abs/1804.10253" target="_blank" rel="noreferrer"
      >From Principal Subspaces to Principal Components with Linear Autoencoders</a
    ><br />
    Elad Plaut (2018) — states the gap plainly: the weights "span the same subspace as
    the one spanned by the principal component loading vectors, but … are not identical to
    the loading vectors", and recovers the loadings by an SVD of the decoder.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://proceedings.mlr.press/v97/kunin19a.html" target="_blank" rel="noreferrer"
      >Loss Landscapes of Regularized Linear Autoencoders</a
    ><br />
    Daniel Kunin, Jonathan Bloom, Aleksandrina Goeva &amp; Cotton Seed (ICML 2019) — why
    an L2 penalty fixes it: regularisation "reduces the symmetry group from GL(k) to the
    orthogonal group O(k), which preserves the structure of SVD", and all critical points
    become symmetric.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1002/aic.690370209" target="_blank" rel="noreferrer"
      >Nonlinear principal component analysis using autoassociative neural networks</a
    ><br />
    Mark A. Kramer, AIChE Journal 37(2), 233–243 (1991) — the five-layer autoencoder, and
    the case for the curve instead of the line.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1126/science.1127647" target="_blank" rel="noreferrer"
      >Reducing the dimensionality of data with neural networks</a
    ><br />
    Geoffrey E. Hinton &amp; Ruslan R. Salakhutdinov, Science 313, 504–507 (2006) — the
    paper that put deep autoencoders back on the map, with the PCA comparison front and
    centre.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1080/14786440109462720" target="_blank" rel="noreferrer"
      >On lines and planes of closest fit to systems of points in space</a
    ><br />
    Karl Pearson, Philosophical Magazine 2(11), 559–572 (1901) — where the first chart in
    this article comes from, a hundred and twenty-five years ago.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a
    ><br />
    Jared Wilber &amp; the Amazon Machine Learning University team — the article format,
    scaffold and design system this piece is built on, used under CC BY-SA 4.0. The
    writing, code and data here are original.
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

  @media screen and (max-width: 950px) {
    .resource-item {
      max-width: 85%;
      font-size: 16px;
    }
  }
</style>
