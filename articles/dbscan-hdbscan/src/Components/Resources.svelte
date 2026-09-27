<h1 class="body-header">References</h1>

<div class="refs">
  <p class="ref">
    Ester, M., Kriegel, H.-P., Sander, J., &amp; Xu, X. (1996).
    A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise.
    <em>Proceedings of the 2nd International Conference on Knowledge Discovery and Data Mining (KDD-96)</em>, 226–231.
    <span class="note">The original. Section 4.2 is the sorted k-dist graph, proposed for finding the
    threshold that separates noise from clusters.</span>
  </p>

  <p class="ref">
    Campello, R. J. G. B., Moulavi, D., &amp; Sander, J. (2013).
    <a href="https://doi.org/10.1007/978-3-642-37456-2_14" target="_blank" rel="noreferrer">
      Density-Based Clustering Based on Hierarchical Density Estimates</a>.
    <em>Advances in Knowledge Discovery and Data Mining (PAKDD 2013)</em>, 160–172.
    <span class="note">DBSCAN*, mutual reachability, the condensed tree and the excess-of-mass
    selection — all of the second half of this article.</span>
  </p>

  <p class="ref">
    Campello, R. J. G. B., Moulavi, D., Zimek, A., &amp; Sander, J. (2015).
    <a href="https://doi.org/10.1145/2733381" target="_blank" rel="noreferrer">
      Hierarchical Density Estimates for Data Clustering, Visualization, and Outlier Detection</a>.
    <em>ACM Transactions on Knowledge Discovery from Data</em>, 10(1), Article 5.
    <span class="note">The long version, including the leaf-selection alternative to excess of mass.</span>
  </p>

  <p class="ref">
    Schubert, E., Sander, J., Ester, M., Kriegel, H.-P., &amp; Xu, X. (2017).
    <a href="https://doi.org/10.1145/3068335" target="_blank" rel="noreferrer">
      DBSCAN Revisited, Revisited: Why and How You Should (Still) Use DBSCAN</a>.
    <em>ACM Transactions on Database Systems</em>, 42(3), Article 19.
    <span class="note">Where the order-dependence is stated plainly — "the result of this DBSCAN
    algorithm is deterministic, but may change if the dataset is permuted" — along with the
    minPts = 2 × dim rule of thumb and a defence of the complexity claims.</span>
  </p>

  <p class="ref">
    McInnes, L., Healy, J., &amp; Astels, S. (2017).
    <a href="https://doi.org/10.21105/joss.00205" target="_blank" rel="noreferrer">
      hdbscan: Hierarchical density based clustering</a>.
    <em>Journal of Open Source Software</em>, 2(11), 205.
    <span class="note">The implementation almost everyone is actually running, and the source of the
    condensed-tree plot this article's version is modelled on.</span>
  </p>

  <p class="ref">
    McInnes, L., &amp; Healy, J. (2017).
    <a href="https://doi.org/10.1109/ICDMW.2017.12" target="_blank" rel="noreferrer">
      Accelerated Hierarchical Density Based Clustering</a>.
    <em>IEEE International Conference on Data Mining Workshops (ICDMW)</em>, 33–42.
    <span class="note">How the mutual reachability minimum spanning tree is built without the
    quadratic pass this article uses.</span>
  </p>

  <p class="ref">
    Ankerst, M., Breunig, M. M., Kriegel, H.-P., &amp; Sander, J. (1999).
    <a href="https://doi.org/10.1145/304182.304187" target="_blank" rel="noreferrer">
      OPTICS: Ordering Points To Identify the Clustering Structure</a>.
    <em>Proceedings of the 1999 ACM SIGMOD International Conference on Management of Data</em>, 49–60.
    <span class="note">The first attempt at the same problem: rather than choose eps, produce an
    ordering from which every eps can be read off.</span>
  </p>

  <p class="ref">
    Hartigan, J. A. (1975). <em>Clustering Algorithms</em>. Wiley.
    <span class="note">Where the cluster tree — the connected components of every density level set,
    organised by inclusion — is set out as the thing a clustering method should be estimating.</span>
  </p>

  <p class="ref">
    Chaudhuri, K., &amp; Dasgupta, S. (2010).
    <a href="https://papers.nips.cc/paper_files/paper/2010/hash/b534ba68236ba543ae44b22bd110a1d6-Abstract.html" target="_blank" rel="noreferrer">
      Rates of Convergence for the Cluster Tree</a>.
    <em>Advances in Neural Information Processing Systems 23</em>, 343–351.
    <span class="note">What it takes to recover that tree consistently, and the sense in which a
    single-linkage variant does.</span>
  </p>

  <p class="ref">
    Behboodian, J. (1970). On the Modes of a Mixture of Two Normal Distributions.
    <em>Technometrics</em>, 12(1), 131–139.
    <span class="note">The unimodality condition the last section rests on: a mixture of two normals
    is unimodal whenever the means are within 2 min(σ₁, σ₂) of each other.</span>
  </p>

  <p class="ref">
    Hubert, L., &amp; Arabie, P. (1985).
    <a href="https://doi.org/10.1007/BF01908075" target="_blank" rel="noreferrer">Comparing Partitions</a>.
    <em>Journal of Classification</em>, 2(1), 193–218.
    <span class="note">The adjusted Rand index, used here only where two numbers had to be put beside
    each other.</span>
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
    font-family: var(--font-main); font-size: 0.92rem; line-height: 1.55;
    color: var(--squid-ink); margin: 0 0 1.05rem 0;
  }

  .note { display: block; font-size: 0.82rem; color: #718096; margin-top: 0.15rem; }
  .tail { height: 4rem; }

  @media screen and (max-width: 950px) {
    .refs { max-width: 80%; }
  }
</style>
