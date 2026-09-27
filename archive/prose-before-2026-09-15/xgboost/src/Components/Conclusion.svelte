<script>
  import katexify from "../katexify";
</script>

<h1 class="body-header">Why Trees Still Rule the Table</h1>

<p class="body-text">
  In an era dominated by large language models and deep neural networks, it is easy
  to wonder why tree-based gradient boosting remains the gold standard for tabular data.
  The answer lies in the nature of structured business data:
</p>

<p class="body-text">
  1. <span class="bold">Heterogeneous features:</span> Tabular datasets mix currencies,
  percentages, categorical codes, and missing values. Neural networks want all of that
  scaled, normalized and embedded first. A tree only ever asks whether a value is above
  or below a threshold, so any strictly increasing transform of a feature — kroner to
  euros, kWh to joules, a rank transform — leaves every split decision untouched.
  Missing values are not a preprocessing problem either: each branch learns which way
  to send them.
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
  No algorithm is a silver bullet, and the honest list of caveats is longer than the
  list of strengths.
</p>

<p class="body-text">
  <span class="bold">Extrapolation:</span> Decision trees create piece-wise constant step
  functions. If our heating dataset only saw temperatures down to -10°C, the model will
  predict the exact same constant value for -40°C. It cannot extrapolate continuous trends
  beyond the minimum and maximum boundaries of its training data.
</p>

<p class="body-text">
  <span class="bold">Unstructured modalities:</span> On images, audio, or raw text,
  convolutions and attention build hierarchical representations that boosted trees have
  no mechanism to express. This is not a close contest.
</p>

<p class="body-text">
  <span class="bold">It hands you a score, not a probability.</span> For a classifier,
  the number that comes out of the sigmoid is a ranking, and it is usually not calibrated
  — especially once you have tuned for AUC or used class weights. If a downstream decision
  multiplies that number by a cost, fit a calibration map on held-out data and check the
  reliability curve before anyone treats it as a probability.
</p>

<p class="body-text">
  <span class="bold">It has a lot of knobs, and they interact.</span> Random forests are
  famously forgiving; XGBoost is not. Depth, {@html katexify("\\eta")}, the number of
  rounds, subsampling, {@html katexify("\\lambda")} and {@html katexify("\\gamma")} all
  trade against each other, and the number of rounds in particular should never be chosen
  by hand — as the shrinkage charts above showed, training error keeps improving long
  after held-out error has turned around. Early stopping on a validation set is not a
  refinement here, it is the mechanism.
</p>

<p class="body-text">
  <span class="bold">Its feature importances mislead.</span> The default gain and split-count
  importances systematically favour high-cardinality and continuous features, which have
  more thresholds available to them, over binary ones that may matter more. If the
  importances are going to be shown to anyone who will act on them, compute SHAP values
  instead and be explicit that they explain the model, not the world.
</p>

<br />

<p class="body-text">
  Thanks for reading. This article is built in the visual essay style of
  <a class="on-end" href="https://mlu-explain.github.io/">MLU-Explain</a>,
  Amazon's collection of visual essays on machine learning, whose open-source
  scaffold and design system it borrows; the prose, visualizations, and code are
  original. To explore deeper, consult the foundational papers and resources linked
  below.
</p>

<style>
</style>