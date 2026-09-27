<script>
  import katexify from "../katexify.js";
  import { sample } from "../datasets.js";
  import { SKY, COSMOS, GREEN, NEUTRAL, ACCENT, HANDLE, CARD, FAINT, GRID, AXIS, LABEL, INK } from "../palette.js";

  const rows = sample(6000, 0.055, 20260908);
  const totalPositives = rows.reduce((acc, r) => acc + r.y, 0);

  // Selected cost ratio: cost(miss) / cost(alarm)
  let ratio = 5.0;

  // Presets
  const presets = [
    { label: "Minor Line (2×)", ratio: 2.0, desc: "A pump swap is minor; shutdowns are brief." },
    { label: "F1 Implied (2.92×)", ratio: 2.92, desc: "The tradeoff F1 secretly picked for you." },
    { label: "Critical Refinery (10×)", ratio: 10.0, desc: "Shutdown halts entire refining unit." },
    { label: "Catastrophic (20×)", ratio: 20.0, desc: "Hazardous leak risks regulatory shutdown." },
  ];

  function evaluateAt(t, costRatio) {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.score >= t) {
        if (r.y === 1) tp++;
        else fp++;
      } else {
        if (r.y === 1) fn++;
        else tn++;
      }
    }
    const loss = fp * 1 + fn * costRatio;
    return { t, tp, fp, fn, tn, loss, flagged: tp + fp };
  }

  // Principle: t_cost = 1 / (1 + ratio)
  $: tCost = 1 / (1 + ratio);
  $: tF1 = 0.2552;

  $: costEval = evaluateAt(tCost, ratio);
  $: f1Eval = evaluateAt(tF1, ratio);
  $: excessLoss = f1Eval.loss - costEval.loss;
  $: pctSaved = costEval.loss > 0 ? ((f1Eval.loss - costEval.loss) / f1Eval.loss) * 100 : 0;

  let boxWidth = 600;
  $: BW = Math.max(280, boxWidth);

  const eqExpectedLoss = katexify(
    "\\text{Total Loss} = \\text{FP} \\times C_{\\text{alarm}} + \\text{FN} \\times C_{\\text{miss}}",
    true
  );
  const eqOptimalThresh = katexify("t^*_{\\text{cost}} = \\frac{1}{1 + \\text{ratio}}", true);
</script>

<h1 class="body-header">What To Do Instead: Decision-Theoretic Classification</h1>

<p class="body-text">
  So if maximising {@html katexify("F_1")} produces an arbitrary, noise-sensitive threshold
  that drifts with the base rate, what should an engineer do instead?
</p>

<p class="body-text">
  The solution is surprisingly simple: <span class="bold">state the cost ratio out loud</span>.
</p>

<p class="body-text">
  In any real application, someone knows the relative cost of an error, so ask the operations team:
  <em>"If we suffer one unpredicted breakdown, how many routine preventive inspections would we have gladly
  traded to prevent it?"</em>
</p>

<p class="body-text">
  Once you have that ratio, {@html katexify("r = C_{\\text{miss}} / C_{\\text{alarm}}")},
  probability theory gives you the optimal operating threshold immediately:
</p>

<div class="eq">{@html eqOptimalThresh}</div>

<div class="lab-container" id="cost-figure">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>

    <div class="cost-header">
      <span class="control-title">Select Operational Scenario:</span>
      <div class="preset-buttons">
        {#each presets as p}
          <button
            class="preset-btn {Math.abs(ratio - p.ratio) < 0.05 ? 'active' : ''}"
            on:click={() => (ratio = p.ratio)}
          >
            <span class="p-title">{p.label}</span>
            <span class="p-desc">{p.desc}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Custom Slider -->
    <div class="slider-row">
      <label for="custom-ratio-slider" class="slider-label">
        Or pick custom ratio: 1 missed failure = <span class="mono bold text-purple">{ratio.toFixed(1)}×</span> false alarms
      </label>
      <input
        id="custom-ratio-slider"
        type="range"
        min="1.0"
        max="20.0"
        step="0.5"
        bind:value={ratio}
        class="custom-slider"
      />
    </div>

    <!-- Comparison Table of Outcomes -->
    <div class="comparison-grid">
      <!-- Cost-Optimal Box -->
      <div class="policy-card optimal">
        <div class="policy-badge good-badge">OPTIMAL POLICY</div>
        <h4 class="policy-name">Principled Cost Minimisation</h4>
        <div class="policy-threshold mono">Threshold: t = {tCost.toFixed(3)}</div>
        <div class="policy-loss">
          Total Loss: <span class="mono bold">{costEval.loss.toFixed(0)} units</span>
        </div>
        <div class="policy-breakdown">
          <div>Caught failures: <b>{costEval.tp}</b> / {totalPositives}</div>
          <div>Missed breakdowns: <b class="text-cosmos">{costEval.fn}</b></div>
          <div>False inspections: <b class="text-handle">{costEval.fp}</b></div>
        </div>
      </div>

      <!-- F1 Default Box -->
      <div class="policy-card f1-policy">
        <div class="policy-badge warn-badge">RECEIVED PRACTICE</div>
        <h4 class="policy-name">Default F1 Maximisation</h4>
        <div class="policy-threshold mono">Threshold: t = {tF1.toFixed(3)} (fixed)</div>
        <div class="policy-loss">
          Total Loss: <span class="mono bold text-cosmos">{f1Eval.loss.toFixed(0)} units</span>
        </div>
        <div class="policy-breakdown">
          <div>Caught failures: <b>{f1Eval.tp}</b> / {totalPositives}</div>
          <div>Missed breakdowns: <b class="text-cosmos">{f1Eval.fn}</b></div>
          <div>False inspections: <b class="text-handle">{f1Eval.fp}</b></div>
        </div>
      </div>
    </div>

    <!-- Loss Difference Callout -->
    {#if Math.abs(excessLoss) > 5}
      <div class="penalty-banner">
        {#if excessLoss > 0}
          <span>
            Following the F1 recipe incurs <span class="mono bold text-cosmos">+{excessLoss.toFixed(0)} excess cost units</span>
            ({pctSaved.toFixed(0)}% more expensive than the optimal policy) because F1 assumes breakdowns are cheaper than they really are.
          </span>
        {:else}
          <span>
            The F1 threshold happens to be close to this scenario's natural tradeoff.
          </span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<p class="body-text">
  If your business really does require optimizing an F-measure directly (for instance, in
  automated document retrieval, where explicit dollar costs don't exist), use
  {@html katexify("F_\\beta")} rather than the standard {@html katexify("F_1")}:
</p>

<div class="eq">
  {@html katexify("F_\\beta = (1 + \\beta^2) \\frac{\\text{precision} \\cdot \\text{recall}}{\\beta^2 \\cdot \\text{precision} + \\text{recall}}", true)}
</div>

<p class="body-text">
  Setting {@html katexify("\\beta = 2")} weights recall twice as heavily as precision, while
  {@html katexify("\\beta = 0.5")} weights precision twice as heavily. Unlike
  {@html katexify("F_1")}, which looks neutral while enforcing an arbitrary ratio,
  {@html katexify("F_\\beta")} forces the designer to make their preference explicit.
</p>

<style>
  .lab-container {
    max-width: 760px;
    margin: 2rem auto;
    padding: 0 0.5rem;
  }

  .card {
    background: var(--white, #ffffff);
    border: 1px solid var(--faint, #e2e8f0);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  }

  .measure {
    width: 100%;
    height: 0;
    pointer-events: none;
  }

  .control-title {
    display: block;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #718096;
    margin-bottom: 0.5rem;
  }

  .preset-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .preset-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.6rem 0.65rem;
    cursor: pointer;
    text-align: left;
    display: flex;
    flex-direction: column;
    transition: all 0.15s ease;
  }

  .preset-btn:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  .preset-btn.active {
    background: #eef2ff;
    border-color: var(--violet, #7c5aed);
    box-shadow: 0 0 0 1px var(--violet, #7c5aed);
  }

  .p-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: #1e293b;
  }

  .p-desc {
    font-size: 0.72rem;
    color: #718096;
    margin-top: 0.2rem;
    line-height: 1.25;
  }

  .slider-row {
    background: #f8fafc;
    border: 1px solid #edf2f7;
    border-radius: 8px;
    padding: 0.85rem 1rem;
    margin-bottom: 1.25rem;
  }

  .slider-label {
    font-size: 0.88rem;
    color: #2d3748;
    display: block;
    margin-bottom: 0.35rem;
  }

  .custom-slider {
    width: 100%;
    accent-color: var(--violet, #7c5aed);
  }

  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .policy-card {
    border-radius: 8px;
    padding: 1.1rem;
    border: 1px solid #e2e8f0;
  }

  .policy-card.optimal {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }

  .policy-card.f1-policy {
    background: #fff1f2;
    border-color: #fecdd3;
  }

  .policy-badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    margin-bottom: 0.4rem;
  }

  .good-badge { background: #dcfce7; color: #15803d; }
  .warn-badge { background: #ffe4e6; color: #be123c; }

  .policy-name {
    margin: 0 0 0.35rem 0;
    font-size: 1.05rem;
    font-family: var(--font-heavy);
    color: #1e293b;
  }

  .policy-threshold {
    font-size: 0.85rem;
    color: #4a5568;
    margin-bottom: 0.6rem;
  }

  .policy-loss {
    font-size: 1.25rem;
    font-family: var(--font-heavy);
    margin-bottom: 0.6rem;
  }

  .policy-breakdown {
    font-size: 0.8rem;
    color: #4a5568;
    line-height: 1.5;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding-top: 0.5rem;
  }

  .penalty-banner {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    font-size: 0.88rem;
    color: #92400e;
    line-height: 1.4;
  }

  .eq {
    max-width: 600px;
    margin: 1.1rem auto;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.15rem 0;
  }

  .text-cosmos { color: #df2a5d; }
  .text-handle { color: #d97706; }
  .text-purple { color: #7c5aed; }
  .mono { font-family: var(--font-mono, monospace); }
  .bold { font-weight: bold; }
</style>
