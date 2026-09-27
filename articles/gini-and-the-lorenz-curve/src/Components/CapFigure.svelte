<script>
  /* CapFigure.svelte - Two credit scorecards with the same Gini */
  import { BOOK, lamB, capShiftAt, captureShift, captureSlice } from "../inequality.js";

  let boxWidth = $state(300);
  const W = $derived(Math.max(260, Math.min(boxWidth, 700)));
  const H = 260;
  const M = { top: 25, right: 16, bottom: 40, left: 44 };

  const pct = (v) => (100 * v).toFixed(1) + "%";
  const rows = [0.01, 0.05, 0.1, 0.2, 0.5].map((f) => {
    const a = captureShift(f);
    const b = captureSlice(f);
    return { f, label: `${(100 * f).toFixed(0)}%`, a: pct(a), b: pct(b), ahead: b > a ? "B" : "A", highlight: f === 0.1 };
  });

  const CUT = 0.1;
  const cutA = captureShift(CUT);
  const cutB = captureSlice(CUT);

  function x(p) {
    return M.left + p * (W - M.left - M.right);
  }
  function y(r) {
    return H - M.bottom - r * (H - M.top - M.bottom);
  }

  // Scorecard A traced by sweeping the cut-off score from high to low.
  const tsA = Array.from({ length: 321 }, (_, i) => 8 - i * 0.05);
  const ptsA = [{ flagged: 0, caught: 0 }, ...tsA.map((t) => capShiftAt(t)), { flagged: 1, caught: 1 }];
  const pathA = $derived("M " + ptsA.map((q) => `${x(q.flagged).toFixed(2)} ${y(q.caught).toFixed(2)}`).join(" L "));
  // Scorecard B: steepest possible until its separated slice runs out, then straight.
  const pathB = $derived(`M ${x(0)} ${y(0)} L ${x(lamB * BOOK.pi)} ${y(lamB)} L ${x(1)} ${y(1)}`);
  const pathPerfect = $derived(`M ${x(0)} ${y(0)} L ${x(BOOK.pi)} ${y(1)} L ${x(1)} ${y(1)}`);
</script>

<div class="card" id="cap-figure">
  <div class="card-header">
    <h3 class="card-title">Two scorecards with the same Gini</h3>
    <p class="card-sub">
      Both scorecards have a Gini of {lamB.toFixed(2)}. Follow the dashed line
      at 10%, then look further right, where the curves cross.
    </p>
  </div>

  <div class="legend-row">
    <div class="legend-item">
      <span class="swatch blue"></span>
      <span><strong>Scorecard A:</strong> every defaulter's score shifted by one s.d.</span>
    </div>
    <div class="legend-item">
      <span class="swatch purple"></span>
      <span><strong>Scorecard B:</strong> {(100 * lamB).toFixed(0)}% of defaulters picked out perfectly, the rest not at all</span>
    </div>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="Two CAP curves that cross">
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- A scorecard that can't tell anyone apart -->
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="#a0aec0" stroke-dasharray="3 3" />
      <!-- A perfect scorecard -->
      <path class="cap-perfect" d={pathPerfect} fill="none" stroke="#c9d1d9" stroke-width="1.5" />
      <text x={x(BOOK.pi) + 6} y={y(1) + 14} font-size="10" fill="#8a94a2">Perfect scorecard</text>

      <path class="cap cap-a" d={pathA} fill="none" stroke="#2b6cb0" stroke-width="2.5" />
      <path class="cap cap-b" d={pathB} fill="none" stroke="#7c5aed" stroke-width="3" />

      <!-- the 10% cut-off -->
      <line x1={x(CUT)} y1={M.top} x2={x(CUT)} y2={H - M.bottom} stroke="#c53030" stroke-dasharray="2 2" />
      <circle class="cut-a" cx={x(CUT)} cy={y(cutA)} r="4" fill="#2b6cb0" />
      <circle class="cut-b" cx={x(CUT)} cy={y(cutB)} r="5" fill="#7c5aed" />
      <text x={x(CUT) + 7} y={y(cutB) + 4} font-size="11" font-weight="bold" fill="#7c5aed" stroke="#fff" stroke-width="3" paint-order="stroke">
        B {pct(cutB)}
      </text>
      <text x={x(CUT) + 7} y={y(cutA) + 16} font-size="11" font-weight="bold" fill="#2b6cb0" stroke="#fff" stroke-width="3" paint-order="stroke">
        A {pct(cutA)}
      </text>

      {#each [0, 0.2, 0.4, 0.6, 0.8, 1.0] as pVal}
        <text x={x(pVal)} y={H - M.bottom + 16} font-size="11" text-anchor={pVal === 1 ? "end" : "middle"} fill="#232f3e">
          {(pVal * 100).toFixed(0)}%
        </text>
        <text x={M.left - 6} y={y(pVal) + 4} font-size="11" text-anchor="end" fill="#232f3e">
          {(pVal * 100).toFixed(0)}%
        </text>
      {/each}
      <text x={W - M.right} y={H - M.bottom - 6} font-size="11" text-anchor="end" fill="#232f3e">Share of applicants declined, riskiest first</text>
      <text x={M.left} y={M.top - 10} font-size="11" font-weight="700" fill="#232f3e">Share of defaulters caught</text>
    </svg>
  </div>

  <div class="table-wrap">
    <table class="cap-table">
      <thead>
        <tr>
          <th>Riskiest share declined</th>
          <th>A catches</th>
          <th>B catches</th>
          <th>Ahead</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr class:highlight-row={r.highlight}>
            <td class="font-bold">{r.label}</td>
            <td class="font-mono text-blue">{r.a}</td>
            <td class="font-mono font-bold text-purple">{r.b}</td>
            <td class="font-mono font-bold">{r.ahead}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="caption">
    B's curve runs along the perfect scorecard's until its kink, then climbs in
    a straight line. A's curve bends gently the whole way, and ends up above B's.
  </p>
</div>

<style>
  .card {
    border: 2px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2rem 0;
    background: #fff;
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
    gap: 0.5rem 1.25rem;
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
    flex-shrink: 0;
  }
  .blue {
    background: #2b6cb0;
  }
  .purple {
    background: #7c5aed;
  }
  .table-wrap {
    overflow-x: auto;
    margin-top: 1rem;
  }
  .cap-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  .cap-table th,
  .cap-table td {
    padding: 0.6rem 0.6rem;
    text-align: left;
    border-bottom: 1px solid var(--stone, #d4dada);
  }
  .cap-table th {
    font-size: 0.8rem;
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
    margin: 1rem 0;
  }
  .svg-wrap svg {
    display: block;
    max-width: 100%;
    height: auto;
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
