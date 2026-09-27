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
    <a class="on-end" href="https://doi.org/10.1109/TIT.1982.1056489" target="_blank" rel="noreferrer"
      >Least Squares Quantization in PCM</a
    ><br />
    Stuart P. Lloyd, IEEE Transactions on Information Theory 28(2), 129–137 (1982) —
    written as a Bell Labs memo in 1957. The algorithm, before anyone called it clustering.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://projecteuclid.org/euclid.bsmsp/1200512992" target="_blank" rel="noreferrer"
      >Some Methods for Classification and Analysis of Multivariate Observations</a
    ><br />
    James MacQueen, Proceedings of the Fifth Berkeley Symposium on Mathematical
    Statistics and Probability (1967) — where the name "k-means" comes from.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://theory.stanford.edu/~sergei/papers/kMeansPP-soda.pdf" target="_blank" rel="noreferrer"
      >k-means++: The Advantages of Careful Seeding</a
    ><br />
    David Arthur &amp; Sergei Vassilvitskii, SODA 2007 — D² seeding, and the theorem
    that it is Θ(log k)-competitive in expectation.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1007/s10994-009-5103-0" target="_blank" rel="noreferrer"
      >NP-hardness of Euclidean sum-of-squares clustering</a
    ><br />
    Daniel Aloise, Amit Deshpande, Pierre Hansen &amp; Preyas Popat, Machine Learning 75,
    245–248 (2009) — a short, correct hardness proof, replacing an earlier one that was not.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1016/j.tcs.2010.05.034" target="_blank" rel="noreferrer"
      >The planar k-means problem is NP-hard</a
    ><br />
    Meena Mahajan, Prajakta Nimbhorkar &amp; Kasturi Varadarajan, Theoretical Computer
    Science 442, 13–21 (2012) — the problem stays hard for points in a plane.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1007/s00454-011-9340-1" target="_blank" rel="noreferrer"
      >k-means Requires Exponentially Many Iterations Even in the Plane</a
    ><br />
    Andrea Vattani, Discrete &amp; Computational Geometry 45(4), 596–616 (2011) — the
    reason "it always terminates" is a weaker statement than it sounds.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1111/1467-9868.00293" target="_blank" rel="noreferrer"
      >Estimating the number of clusters in a data set via the gap statistic</a
    ><br />
    Robert Tibshirani, Guenther Walther &amp; Trevor Hastie, Journal of the Royal
    Statistical Society B 63(2), 411–423 (2001) — the elbow, with a null model attached.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://doi.org/10.1016/0377-0427(87)90125-7" target="_blank" rel="noreferrer"
      >Silhouettes: a graphical aid to the interpretation and validation of cluster analysis</a
    ><br />
    Peter J. Rousseeuw, Journal of Computational and Applied Mathematics 20, 53–65 (1987).
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://proceedings.neurips.cc/paper/2002/hash/43e4e6a6f341e00671e123714de019a8-Abstract.html" target="_blank" rel="noreferrer"
      >An Impossibility Theorem for Clustering</a
    ><br />
    Jon Kleinberg, NeurIPS 2002 — scale-invariance, richness and consistency, pick two.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://cdn.aaai.org/ICML/2003/ICML03-022.pdf" target="_blank" rel="noreferrer"
      >Using the Triangle Inequality to Accelerate k-Means</a
    ><br />
    Charles Elkan, ICML 2003 — exactly the same answer, with most of the distance
    calculations skipped.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://dl.acm.org/doi/10.1145/1772690.1772862" target="_blank" rel="noreferrer"
      >Web-Scale K-Means Clustering</a
    ><br />
    D. Sculley, WWW 2010 — the mini-batch variant, for when a full pass is too many passes.
  </p>

  <p class="resource-item">
    <a class="on-end" href="https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html" target="_blank" rel="noreferrer"
      >scikit-learn: KMeans</a
    ><br />
    The reference implementation most of us actually run. Worth reading for
    <span class="mono">n_init</span>, which changed default in version 1.4.
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
