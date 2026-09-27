<script>
  /* CapFigure.svelte - The Credit Scorecard / Machine Learning Connection */
  let boxWidth = $state(600);
  const W = $derived(Math.max(320, Math.min(boxWidth, 700)));
  const H = 260;
  const M = { top: 25, right: 30, bottom: 40, left: 50 };

  const tableData = [
    { frac: "Top 1%", cut: 0.01, a: "3.4%", b: "4.0%" },
    { frac: "Top 5%", cut: 0.05, a: "14.2%", b: "20.0%" },
    { frac: "Top 10%", cut: 0.1, a: "25.6%", b: "40.0%", highlight: true },
    { frac: "Top 20%", cut: 0.2, a: "43.3%", b: "55.8%" },
    { frac: "Top 50%", cut: 0.5, a: "77.7%", b: "72.6%" },
  ];

  function x(p) {
    return M.left + p * (W - M.left - M.right);
  }
  function y(r) {
    return H - M.bottom - r * (H - M.top - M.bottom);
  }

  // Model A and Model B CAP curves
  const pathA = `M ${x(0)} ${y(0)} L ${x(0.1)} ${y(0.256)} L ${x(0.2)} ${y(0.433)} L ${x(0.5)} ${y(0.777)} L ${x(1)} ${y(1)}`;
  const pathB = `M ${x(0)} ${y(0)} L ${x(0.1)} ${y(0.4)} L ${x(0.2)} ${y(0.558)} L ${x(0.5)} ${y(0.726)} L ${x(1)} ${y(1)}`;
</script>

<div class="card" bind:clientWidth={boxWidth}>
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <div class="card-badge">Machine Learning &amp; Risk Analytics</div>
    <h3 class="card-title">Scorecards with the Same Gini, Opposite Power</h3>
    <p class="card-sub">
      In retail banking and credit scoring, the Gini coefficient (or Accuracy Ratio, <code>AR = 2&middot;AUC &minus; 1</code>) is the industry-standard benchmark. But just like income, two predictive models with identical Gini = 0.523 can perform radically differently at critical decision thresholds.
    </p>
  </div>

  <div class="legend-row">
    <div class="legend-item">
      <span class="swatch blue"></span>
      <span><strong>Model A (G = 0.523):</strong> Broad separation across the median</span>
    </div>
    <div class="legend-item">
      <span class="swatch purple"></span>
      <span><strong>Model B (G = 0.523):</strong> Razor-sharp separation at the high-risk tail</span>
    </div>
  </div>

  <div class="table-wrap">
    <table class="cap-table">
      <thead>
        <tr>
          <th>Risk Cutoff (% of applicants rejected)</th>
          <th>Model A Default Capture</th>
          <th>Model B Default Capture</th>
          <th>Lead / Advantage</th>
        </tr>
      </thead>
      <tbody>
        {#each tableData as r}
          <tr class:highlight-row={r.highlight}>
            <td class="font-bold">{r.frac}</td>
            <td class="font-mono text-blue">{r.a}</td>
            <td class="font-mono font-bold text-purple">{r.b}</td>
            <td class="font-mono font-bold">
              {r.highlight ? "Model B leads by +14.4%!" : r.cut < 0.3 ? "Model B leads" : "Model A leads"}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="svg-wrap">
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="CAP curves crossing">
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- Random benchmark 45 deg -->
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="#a0aec0" stroke-dasharray="3 3" />

      <!-- Curves -->
      <path d={pathA} fill="none" stroke="#2b6cb0" stroke-width="2.5" />
      <path d={pathB} fill="none" stroke="#7c5aed" stroke-width="3" />

      <!-- 10% marker -->
      <line x1={x(0.1)} y1={M.top} x2={x(0.1)} y2={H - M.bottom} stroke="#c53030" stroke-dasharray="2 2" />
      <circle cx={x(0.1)} cy={y(0.256)} r="4" fill="#2b6cb0" />
      <circle cx={x(0.1)} cy={y(0.4)} r="5" fill="#7c5aed" />
      <text x={x(0.1) + 6} y={y(0.4) - 4} font-size="11" font-weight="bold" fill="#7c5aed">
        40.0% (B) vs 25.6% (A)
      </text>

      <!-- Ticks -->
      {#each [0, 0.2, 0.4, 0.6, 0.8, 1.0] as pVal}
        <text x={x(pVal)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">
          {(pVal * 100).toFixed(0)}%
        </text>
        <text x={M.left - 6} y={y(pVal)} font-size="11" text-anchor="end" fill="#232f3e">
          {(pVal * 100).toFixed(0)}%
        </text>
      {/each}
      <text x={W - M.right} y={H - M.bottom - 6} font-size="11" text-anchor="end" fill="#232f3e">Applicants Flagged (%)</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">Defaults Caught (%)</text>
    </svg>
  </div>

  <p class="caption">
    <strong>Figure 4. The danger of metric blindness.</strong> If a risk manager selects a model based purely on overall Gini / AUC, both models look identical. But if the business strategy is to reject the riskiest 10% of applicants, Model B catches 40% of all bad loans while Model A catches only 25.6%. Evaluating models requires inspecting the entire curve at your actual operating threshold.
  </p>
</div>

<style>
  .card {
    border: 2px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2rem 0;
    background: #fff;
  }
  .card-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: var(--paper, #f1f3f3);
    padding: 0.2rem 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 2px;
  }
  .card-header {
    margin-bottom: 1.25rem;
  }
  .card-title {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0 0 0.4rem 0;
  }
  .card-sub {
    font-size: 0.95rem;
    color: var(--squidink, #232f3e);
    opacity: 0.8;
    margin: 0;
  }
  .legend-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    margin-bottom: 1rem;
    font-size: 0.85rem;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 2px;
  }
  .blue {
    background: #2b6cb0;
  }
  .purple {
    background: #7c5aed;
  }
  .table-wrap {
    overflow-x: auto;
    margin-bottom: 1.25rem;
  }
  .cap-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  .cap-table th,
  .cap-table td {
    padding: 0.7rem 0.85rem;
    text-align: left;
    border-bottom: 1px solid var(--stone, #d4dada);
  }
  .cap-table th {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: var(--paper, #f1f3f3);
    color: var(--squidink, #232f3e);
  }
  .highlight-row {
    background: rgba(124, 90, 237, 0.08);
  }
  .font-mono {
    font-family: monospace;
  }
  .font-bold {
    font-weight: 700;
  }
  .text-blue {
    color: #2b6cb0;
  }
  .text-purple {
    color: var(--violet, #7c5aed);
  }
  .svg-wrap {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
    overflow-x: auto;
  }
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 1rem 0 0 0;
    border-top: 1px solid var(--stone, #d4dada);
    padding-top: 0.5rem;
  }
</style>
