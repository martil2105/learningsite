<script>
  import katexify from "../katexify";
</script>

<h1 class="body-header">Why Trees Still Rule the Table</h1>

<p class="body-text">
  In an era dominated by large language models and deep neural networks, it's
  natural to wonder why tree-based gradient boosting remains the gold standard for
  tabular data.
  The answer lies in the nature of structured business data:
</p>

<p class="body-text">
  1. <span class="bold">Heterogeneous features:</span> Tabular datasets mix currencies,
  percentages, categorical codes, and missing values. Neural networks need all of
  that scaled, normalized and embedded first. A tree, on the other hand, only ever
  asks whether a value is above or below a threshold, so any strictly increasing
  transform of a feature (kroner to euros, kWh to joules, or a rank transform)
  leaves every split decision untouched. Missing values aren't a preprocessing
  problem either, since each branch learns which way to send them.
</p>

<p class="body-text">
  2. <span class="bold">Sample Efficiency:</span> While deep neural networks often
  require hundreds of thousands of samples to avoid memorizing noise, XGBoost delivers
  state-of-the-art accuracy on small to medium datasets containing only thousands or tens
  of thousands of rows.
</p>

<p class="body-text">
  3. <span class="bold">Built-in regularization:</span> By putting the L2 leaf penalty
  {@html katexify("\\lambda")} and the per-split toll {@html katexify("\\gamma")} directly
  into the objective that split-finding maximises, XGBoost makes complexity control part
  of the fit rather than something bolted on afterwards.
</p>

<h1 class="body-header">The Limits: Where Not to Use It</h1>

<p class="body-text">
  Of course, no algorithm is a silver bullet, and an honest list of caveats is
  longer than the list of strengths.
</p>

<p class="body-text">
  <span class="bold">Extrapolation:</span> Decision trees create piecewise
  constant step functions. If our heating dataset only saw temperatures down to
  -10°C, the model would predict exactly the same value for -40°C, because it
  can't extrapolate trends beyond the range of its training data.
</p>

<p class="body-text">
  <span class="bold">Unstructured modalities:</span> On images, audio, or raw text,
  convolutions and attention build hierarchical representations that boosted
  trees have no way to express, and it isn't a close contest.
</p>

<p class="body-text">
  <span class="bold">It hands you a score, not a probability.</span> For a classifier,
  the number that comes out of the sigmoid is a ranking, and it's usually not
  calibrated, especially once you've tuned for AUC or used class weights. If a
  downstream decision
  multiplies that number by a cost, fit a calibration map on held-out data and check the
  reliability curve before anyone treats it as a probability.
</p>

<p class="body-text">
  <span class="bold">It has a lot of knobs, and they interact.</span> Random
  forests are famously forgiving, but XGBoost isn't. Depth,
  {@html katexify("\\eta")}, the number of rounds, subsampling,
  {@html katexify("\\lambda")} and {@html katexify("\\gamma")} all trade off
  against each other, and the number of rounds in particular should never be
  chosen by hand. As the shrinkage charts above showed, training error keeps
  improving long after held-out error has turned around. Early stopping on a
  validation set isn't just a refinement here; it's the mechanism that makes the
  whole thing work.
</p>

<p class="body-text">
  <span class="bold">Its feature importances mislead.</span> The default gain and split-count
  importances systematically favour high-cardinality and continuous features, which have
  more thresholds available to them, over binary features that may matter more. If
  the importances will be shown to anyone who's going to act on them, compute SHAP
  values instead, and be explicit that they explain the model, not the world.
</p>

<br />

<p class="body-text">
  Thanks for reading! This article is built in the visual essay style of
  <a class="on-end" href="https://mlu-explain.github.io/">MLU-Explain</a>,
  Amazon's collection of visual essays on machine learning, and it borrows their
  open-source scaffold and design system. The prose, visualizations, and code are
  original. If you'd like to dig deeper, the foundational papers and resources
  are linked below.
</p>

<style>
</style>