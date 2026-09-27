<script>
  import katexify from "../katexify.js";

  const eqCostRatio = katexify("\\text{Implied Cost Ratio} = \\frac{C_{\\text{missed failure}}}{C_{\\text{false alarm}}} = \\frac{1 - t}{t}", true);
  const eqOptimalCostThresh = katexify("t_{\\text{cost}} = \\frac{C_{\\text{alarm}}}{C_{\\text{alarm}} + C_{\\text{miss}}} = \\frac{1}{1 + \\text{ratio}}", true);
  const inlineRatio = katexify("(1-t)/t");
</script>

<h1 class="body-header">What That Means: An Unchosen Cost Ratio</h1>

<p class="body-text">
  Because our model outputs calibrated probabilities, any decision threshold carries an exact
  decision-theoretic translation. If sending a technician on a false alarm costs
  {@html katexify("C_{\\text{alarm}}")} and suffering an unpredicted shutdown costs
  {@html katexify("C_{\\text{miss}}")}, the rule that minimises total expected financial loss is:
</p>

<div class="eq">{@html eqOptimalCostThresh}</div>

<p class="body-text">
  Read backwards, choosing any threshold {@html katexify("t")} is identical to asserting that a missed
  catastrophe costs exactly {@html inlineRatio} times what an inspection costs:
</p>

<div class="eq">{@html eqCostRatio}</div>

<p class="body-text">
  When you tuned the threshold to maximise {@html katexify("F_1")} and landed on the population optimum
  {@html katexify("t^* = 0.2552")}, you asserted:
</p>

<p class="body-text centered callout">
  <span class="callout-text">
    <span class="mono bold">1 unplanned shutdown = 2.92 false alarms</span>
  </span>
</p>

<p class="body-text">
  Did anyone in maintenance choose 2.92? Did the plant manager sign off on it?
</p>

<p class="body-text">
  No. That number was never an engineering estimate. It came entirely from
  {@html katexify("F_1^{\\max} / 2")}. The threshold came from the model’s own achievable accuracy,
  not from the reality of the plant.
</p>

<h2 class="sub-header">The better your model, the fewer failures you care about</h2>

<p class="body-text">
  This produces an unnerving inversion. Suppose your team spends three months engineering better vibration
  features, boosting the model’s performance so that achievable {@html katexify("F_1^{\\max}")} climbs
  from <span class="mono">0.51</span> to <span class="mono">0.70</span>.
</p>

<p class="body-text">
  What does the F1-maximising recipe do?
  Because {@html katexify("t^* = F_1^{\\max} / 2")}, the threshold jumps from
  <span class="mono bold">0.255</span> to <span class="mono bold">0.350</span>.
  The implied cost ratio plunges from <span class="mono bold">2.92×</span> down to
  <span class="mono bold">1.86×</span>.
  By improving the model, you have quietly decided that missing an engine blowout is suddenly
  less serious than it was last month.
</p>

<p class="body-text">
  Conversely, if a camera fails and the model degrades to {@html katexify("F_1^{\\max} = 0.30")}, the
  optimal threshold drops to <span class="mono">0.150</span>, asserting an implied ratio of
  <span class="mono bold">5.67×</span>.
  The physical consequences of a pump failure have not changed by a single cent. Yet the metric
  drastically alters the operational policy based solely on how well the algorithm is doing.
</p>

<style>
  .sub-header {
    max-width: 600px;
    margin: 2rem auto 0.4rem auto;
    text-align: left;
    font-size: 1.28rem;
    line-height: 1.4;
    font-family: var(--font-heavy);
    color: var(--squid-ink);
  }

  .eq {
    max-width: 600px;
    margin: 1.1rem auto;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.15rem 0;
  }

  .callout {
    background: #f8fafc;
    border-left: 4px solid var(--violet, #7c5aed);
    padding: 1rem 1.25rem;
    border-radius: 0 8px 8px 0;
    margin: 1.5rem auto;
  }

  .callout-text {
    font-size: 1.15rem;
    color: #1e293b;
  }

  .mono { font-family: var(--font-mono, monospace); }
  .bold { font-weight: bold; }
</style>
