<script>
  import katexify from "../katexify.js";
  import precomputed from "../precomputed.js";
  const pop = precomputed.population;
</script>

<h1 class="body-header">What to Take From It</h1>

<p class="body-text">
  The {@html katexify("F_1")} score is not a flawed mathematical formula. It does exactly what it was
  defined to do: calculate the harmonic mean of precision and recall.
</p>

<p class="body-text">
  The mistake is treating it as a <span class="bold">neutral summary metric</span> suitable for operational
  decision-making.
</p>

<p class="body-text">
  When you tune a decision threshold to maximize {@html katexify("F_1")}, you are not taking a middle path
  between precision and recall. You are asserting a precise, unchosen cost ratio:
</p>

<ul class="body-list">
  <li>
    <span class="bold">The rule is about your model, not your problem.</span> In expectation, the optimal
    rule is always <span class="mono bold">t* = F1max / 2</span>. If your model gets better, the threshold
    moves up and you penalise false alarms more; if your model degrades, it moves down. The reality of pump
    breakdowns did not change.
  </li>
  <li>
    <span class="bold">Finite validation sets inject massive noise.</span> Finding the argmax on an empirical
    sample of 6,000 units yielded thresholds spanning from <span class="mono">0.124</span> to <span class="mono">0.386</span>,
    swinging your asserted tradeoff from <span class="bold">1.6× to 7.0×</span> purely by sample luck.
  </li>
  <li>
    <span class="bold">Prevalence drift quietly shifts your operational goals.</span> When failure frequency rises
    from 1.95% to 12.3%, {@html katexify("F_1^{\\max}")} surges from 0.399 to 0.590 and the implied cost ratio
    drops from 4.01× to 2.39× on a frozen model.
  </li>
</ul>

<h2 class="sub-header">When F1 is appropriate (and when it is not)</h2>

<p class="body-text">
  <span class="bold">When it works:</span> In academic benchmarks, competitive leaderboards, and general information
  retrieval. If you are comparing two ranking models on a standardized dataset where downstream deployment costs
  are genuinely unknown or unquantifiable, {@html katexify("F_1")} serves as a reasonable single-number proxy
  to prevent either extreme (predicting all positive or all negative).
</p>

<p class="body-text">
  <span class="bold">When it fails:</span> In production systems that trigger real actions — preventive maintenance,
  fraud blocking, medical screening, loan underwriting, or spam filtering. In every one of these domains, false
  positives and false negatives carry asymmetric, real-world costs.
</p>

<p class="body-text">
  Before sliding a threshold until {@html katexify("F_1")} peaks, have the conversation everyone avoids:
  <span class="bold">ask what a false alarm costs, ask what a missed event costs, and calibrate your probabilities</span>.
  Once you have honest probabilities and explicit costs, decision theory does the rest — with no magic metrics required.
</p>

<p class="footnote">
  This article is a derived work of
  <a href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a>
  by Amazon's Machine Learning University, whose scaffold and design system it borrows under CC BY-SA 4.0.
  All prose, data, code and figures here are original. The coolant pump data is synthetic with calibrated probabilities
  by construction; every number is reproducible from <span class="mono">scripts/precompute.mjs</span> and asserted in
  <span class="mono">verify/</span>.
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

  .body-list {
    max-width: 600px;
    margin: 1.25rem auto;
    padding-left: 1.5rem;
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--squid-ink, #232f3e);
  }

  .body-list li {
    margin-bottom: 0.85rem;
  }

  .footnote {
    max-width: 600px;
    margin: 2.5rem auto 1rem auto;
    font-family: var(--font-main);
    font-size: 0.82rem;
    line-height: 1.6;
    color: #718096;
    border-top: 1px solid #e2e8f0;
    padding-top: 1rem;
  }

  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
  .bold { font-weight: bold; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .footnote { max-width: 80%; }
  }
</style>
