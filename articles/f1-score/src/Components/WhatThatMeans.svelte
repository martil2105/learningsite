<script>
  import katexify from "../katexify.js";

  const eqCostRatio = katexify("\\text{Implied Cost Ratio} = \\frac{C_{\\text{missed failure}}}{C_{\\text{false alarm}}} = \\frac{1 - t}{t}", true);
  const eqOptimalCostThresh = katexify("t_{\\text{cost}} = \\frac{C_{\\text{alarm}}}{C_{\\text{alarm}} + C_{\\text{miss}}} = \\frac{1}{1 + \\text{ratio}}", true);
  const inlineRatio = katexify("(1-t)/t");
</script>

<h1 class="body-header">What That Means: An Unchosen Cost Ratio</h1>

<p class="body-text">
  Because our model outputs calibrated probabilities, every decision threshold has an exact
  decision-theoretic meaning. If sending a technician out on a false alarm costs
  {@html katexify("C_{\\text{alarm}}")} and suffering an unpredicted shutdown costs
  {@html katexify("C_{\\text{miss}}")}, the rule that minimises the total expected financial
  loss is:
</p>

<div class="eq">{@html eqOptimalCostThresh}</div>

<p class="body-text">
  Read in reverse, this means that choosing any threshold {@html katexify("t")} is the same
  as asserting that a missed catastrophe costs exactly {@html inlineRatio} times as much as an
  inspection:
</p>

<div class="eq">{@html eqCostRatio}</div>

<p class="body-text">
  So when you tune the threshold to maximise {@html katexify("F_1")} and land on the
  population optimum, {@html katexify("t^* = 0.2552")}, you're asserting that:
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
  Of course not. That number was never an engineering estimate; it came entirely from
  {@html katexify("F_1^{\\max} / 2")}. In other words, the threshold came from the model’s own
  achievable accuracy, not from the reality of the plant.
</p>

<h2 class="sub-header">The better your model, the fewer failures you care about</h2>

<p class="body-text">
  This leads to an unnerving inversion. Suppose your team spends three months engineering
  better vibration features, improving the model so that its achievable
  {@html katexify("F_1^{\\max}")} climbs
  from <span class="mono">0.51</span> to <span class="mono">0.70</span>.
</p>

<p class="body-text">
  What does the F1-maximising recipe do then? Because
  {@html katexify("t^* = F_1^{\\max} / 2")}, the threshold jumps from
  <span class="mono bold">0.255</span> to <span class="mono bold">0.350</span>, and the implied
  cost ratio plunges from <span class="mono bold">2.92×</span> to
  <span class="mono bold">1.86×</span>. By improving the model, you've quietly decided that
  missing a catastrophic pump failure is suddenly less serious than it was last month.
</p>

<p class="body-text">
  Conversely, if a sensor fails and the model degrades to
  {@html katexify("F_1^{\\max} = 0.30")}, the optimal threshold drops to
  <span class="mono">0.150</span>, which asserts an implied ratio of
  <span class="mono bold">5.67×</span>. The physical consequences of a pump failure haven't
  changed by a single cent, yet the metric drastically changes the operational policy based
  solely on how well the algorithm is doing.
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
