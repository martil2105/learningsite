<script>
  import katexify from "../katexify.js";
  import precomputed from "../precomputed.js";

  const eqF1Def = katexify("F_1 = \\frac{2 \\cdot \\mathbb{E}[\\text{TP}]}{\\mathbb{E}[\\text{Flagged}] + P} = \\frac{A}{D}", true);
  const eqF1New = katexify("F_1^{\\text{new}} = \\frac{A + 2p}{D + 1}", true);
  const eqDeriv = katexify(
    "\\frac{A + 2p}{D + 1} > \\frac{A}{D} \\iff 2pD > A \\iff p > \\frac{A}{2D} = \\frac{F_1}{2}",
    true
  );
  const eqOptimum = katexify("t^* = \\frac{F_1^{\\max}}{2}", true);

  const inlineP = katexify("p");
  const inlineTStar = katexify("t^*");
  const inlineF1Max = katexify("F_1^{\\max}");
  const inlineHalf = katexify("F_1 / 2");
  const inlineOptimum = katexify("t^* = F_1^{\\max} / 2");

  const rows = precomputed.drift;
</script>

<h1 class="body-header">The Reveal: You were calculating F1 / 2</h1>

<p class="body-text">
  The best this validation set has to offer is an {@html katexify("F_1")} of
  <span class="mono bold">0.512</span>, at a threshold of
  <span class="mono bold">0.158</span>. But if we run the same model over the whole
  fleet rather than just these six thousand rows, the true maximum is
  <span class="bold">0.5105</span>, at a threshold of <span class="bold">0.2552</span>.
</p>

<p class="body-text">
  Notice the relationship between <em>those</em> two numbers:
  <span class="bold">0.2552 is exactly half of 0.5105</span>.
</p>

<p class="body-text">
  Now notice that your two numbers aren't related that way at all. Half of 0.512
  is 0.256, but you landed on 0.158, which is a long way off. That isn't because
  you hunted badly. There was nothing better to find, since 0.158 really is where
  {@html katexify("F_1")} peaks on the rows you were given.
  <span class="bold">Both of these facts matter, and the second one turns out to
  matter more.</span> But let's start with the theorem.
</p>

<p class="body-text">
  The half isn't a coincidence of pump mechanics or random seeds; it's a theorem.
  In 2014, Zachary Lipton, Charles Elkan and Balakrishnan Narayanaswamy proved that for any
  calibrated probabilistic classifier, the threshold that maximises expected F1 has an exact
  closed form: <span class="bold">act whenever the score exceeds {@html inlineF1Max} / 2</span>.
</p>

<div class="eq">{@html eqOptimum}</div>

<h2 class="sub-header">The two-line proof</h2>

<p class="body-text">
  The derivation is remarkably simple. We write the expected {@html katexify("F_1")} score
  as the ratio of twice the expected true positives to the sum of the flagged units and the
  total actual positives, {@html katexify("P")}:
</p>

<div class="eq">{@html eqF1Def}</div>

<p class="body-text">
  Suppose you've selected a threshold, and you're considering whether to lower it slightly
  to flag one more pump, whose predicted probability of failure is {@html inlineP}.
  Flagging this pump increases your expected true positives by {@html inlineP}, so the
  numerator {@html katexify("A")} gains {@html katexify("2p")}. The fleet's total number of
  failures, {@html katexify("P")}, is fixed, but you've flagged one additional pump, so the
  denominator {@html katexify("D")} increases by exactly 1:
</p>

<div class="eq">{@html eqF1New}</div>

<p class="body-text">
  So when does adding this pump improve {@html katexify("F_1")}? Cross-multiplying the
  inequality gives us:
</p>

<div class="eq">{@html eqDeriv}</div>

<p class="body-text">
  In other words, every unflagged pump whose risk exceeds {@html inlineHalf} increases
  {@html katexify("F_1")}, and every pump whose risk falls below {@html inlineHalf} drags it
  down. At the peak, where no further additions can improve the score, the boundary between
  what you act on and what you ignore must sit exactly at {@html inlineOptimum}:
</p>

<!-- Verification table across prevalences -->
<div class="table-container">
  <table class="reveal-table">
    <thead>
      <tr>
        <th>Fleet Prevalence</th>
        <th>Optimal {@html inlineF1Max}</th>
        <th>Population {@html inlineTStar}</th>
        <th>{@html inlineF1Max} / 2</th>
        <th>Implied Cost Ratio</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr>
          <td class="mono">{(r.prevalence * 100).toFixed(2)}%</td>
          <td class="mono text-green bold">{r.f1max.toFixed(4)}</td>
          <td class="mono bold">{r.tStar.toFixed(4)}</td>
          <td class="mono text-purple bold">{(r.f1max / 2).toFixed(4)}</td>
          <td class="mono">{r.costRatio.toFixed(2)}×</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div class="table-caption">
    Across all four fleet scenarios, the optimal threshold matches
    <span class="mono">F1max / 2</span> to every decimal place shown. The
    identity is exact, and the fourth decimal is simply the last one these
    figures are stored to.
  </div>
</div>

<p class="body-text">
  Now let's pause and ask: what does this mean for the operational decision you just made?
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

  .table-container {
    max-width: 620px;
    margin: 1.75rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  }

  .reveal-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    text-align: left;
  }

  .reveal-table th {
    background: #f8fafc;
    padding: 0.75rem 1rem;
    font-family: var(--font-main);
    font-weight: 600;
    color: #4a5568;
    border-bottom: 1px solid #e2e8f0;
  }

  .reveal-table td {
    padding: 0.7rem 1rem;
    border-bottom: 1px solid #edf2f7;
    color: #2d3748;
  }

  .reveal-table tr:last-child td {
    border-bottom: none;
  }

  .table-caption {
    padding: 0.6rem 1rem;
    background: #f8fafc;
    border-top: 1px solid #edf2f7;
    font-size: 0.8rem;
    color: #718096;
    line-height: 1.4;
  }

  .text-green { color: #16a34a; }
  .text-purple { color: #7c5aed; }
  .mono { font-family: var(--font-mono, monospace); }
  .bold { font-weight: bold; }

  @media (max-width: 600px) {
    .reveal-table {
      font-size: 0.8rem;
    }
    .reveal-table th, .reveal-table td {
      padding: 0.5rem 0.6rem;
    }
  }
</style>
