<script>
  /*
    AlongTheLine.svelte — Small-multiple strip of 6 prices along the straight line:
    p in {5, 12.5, 25, 31.25, 50, 60}
    |ε| in {0.087, 0.25, 0.667, 1.0, 4.0, 24.0}
    Revenue rectangle p * q drawn under each.
  */
  import { families, pointElasticity, revenue } from "../demand.js";
  import { linear } from "../chart.js";

  const fam = families.lin; // q = 75 - 1.2p, Pmax = 62.5, Qmax = 75

  const points = [
    { p: 5, label: "Very inelastic", epsStr: "0.087" },
    { p: 12.5, label: "Inelastic", epsStr: "0.25" },
    { p: 25, label: "The pin", epsStr: "0.667" },
    { p: 31.25, label: "Unit elastic (peak revenue)", epsStr: "1.0", isPeak: true },
    { p: 50, label: "Elastic", epsStr: "4.0" },
    { p: 60, label: "Very elastic", epsStr: "24.0" },
  ].map((pt) => {
    const q = fam.q(pt.p);
    const eps = pointElasticity(fam, pt.p);
    const rev = revenue(fam, pt.p);
    return {
      ...pt,
      q,
      eps,
      rev,
    };
  });

  const pw = 180;
  const ph = 140;
  const m = { top: 12, right: 10, bottom: 24, left: 32 };

  const x = linear(0, 65, m.left, pw - m.right);
  const y = linear(0, 80, ph - m.bottom, m.top);
</script>

<div class="along-card" id="along-the-line">
  <div class="card-header">
    <h3 class="strip-title">One straight line, six very different elasticities</h3>
    <p class="strip-sub">
      Six prices on the same straight demand line, <em>q</em> = 75 − 1.2<em>p</em>. The shaded rectangle in each panel is the revenue at that price.
    </p>
  </div>

  <div class="multiples-grid">
    {#each points as pt}
      <div class="mini-panel {pt.isPeak ? 'peak-card' : ''}">
        <div class="panel-head">
          <span class="panel-p">p = {pt.p}</span>
          <span class="panel-eps {pt.isPeak ? 'peak-text' : ''}">|ε| = {pt.epsStr}</span>
        </div>

        <svg
          width={pw}
          height={ph}
          viewBox={`0 0 ${pw} ${ph}`}
          role="img"
          aria-label={`Demand curve at p = ${pt.p}, elasticity = ${pt.epsStr}`}
        >
          <!-- Grid / axes -->
          <line class="mini-rule" x1={m.left} y1={ph - m.bottom} x2={pw - m.right} y2={ph - m.bottom} />
          <line class="mini-rule" x1={m.left} y1={m.top} x2={m.left} y2={ph - m.bottom} />
          <text class="mini-lbl" x={m.left - 4} y={y(75) + 3} text-anchor="end">75</text>
          <text class="mini-lbl" x={x(62.5)} y={ph - m.bottom + 12} text-anchor="middle">62.5</text>

          <!-- Revenue Rectangle -->
          <rect
            class="rev-rect {pt.isPeak ? 'peak-rect' : ''}"
            x={x(0)}
            y={y(pt.q)}
            width={x(pt.p) - x(0)}
            height={y(0) - y(pt.q)}
          />

          <!-- Demand Line -->
          <line
            class="mini-demand"
            x1={x(0)}
            y1={y(75)}
            x2={x(62.5)}
            y2={y(0)}
          />

          <!-- Operating Point -->
          <circle class="mini-dot" cx={x(pt.p)} cy={y(pt.q)} r="4" />
        </svg>

        <div class="panel-stats">
          <div class="stat-item">
            <span class="stat-lbl">Quantity:</span>
            <span class="stat-val">{pt.q.toFixed(1)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-lbl">Revenue:</span>
            <span class="stat-val {pt.isPeak ? 'highlight-stat' : ''}">{pt.rev.toFixed(0)}</span>
          </div>
          <div class="stat-status">{pt.label}</div>
        </div>
      </div>
    {/each}
  </div>

  <p class="caption">
    Below the midpoint price the line is inelastic, above it the line is elastic, and the revenue rectangle is largest at the midpoint itself.
  </p>
</div>

<style>
  .along-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.25rem;
    margin: 2rem auto;
    max-width: 680px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .card-header {
    margin-bottom: 1.25rem;
  }
  .strip-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--squidink, #232f3e);
    margin: 0 0 0.4rem 0;
  }
  .strip-sub {
    font-size: 0.88rem;
    color: #475569;
    line-height: 1.5;
    margin: 0;
  }
  .multiples-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  @media (max-width: 600px) {
    .multiples-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 400px) {
    .multiples-grid {
      grid-template-columns: 1fr;
    }
  }
  .mini-panel {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.65rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .mini-panel.peak-card {
    background: #fdf4ff;
    border-color: #d8b4fe;
  }
  .panel-head {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
  }
  .panel-p {
    font-weight: 600;
    color: #334155;
  }
  .panel-eps {
    font-weight: 700;
    color: #2074d5;
  }
  .panel-eps.peak-text {
    color: #7c5aed;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .mini-rule {
    stroke: #cbd5e1;
    stroke-width: 1;
  }
  .mini-lbl {
    font-family: var(--font-mono, monospace);
    font-size: 8.5px;
    fill: #94a3b8;
  }
  .rev-rect {
    fill: #93c5fd;
    fill-opacity: 0.45;
    stroke: #60a5fa;
    stroke-width: 1;
  }
  .rev-rect.peak-rect {
    fill: #d8b4fe;
    fill-opacity: 0.55;
    stroke: #c084fc;
  }
  .mini-demand {
    stroke: #1e293b;
    stroke-width: 2;
  }
  .mini-dot {
    fill: var(--squidink, #232f3e);
    stroke: #ffffff;
    stroke-width: 1.5;
  }
  .panel-stats {
    width: 100%;
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
  }
  .stat-item {
    display: flex;
    justify-content: space-between;
  }
  .stat-lbl {
    color: #64748b;
  }
  .stat-val {
    font-weight: 600;
    color: #1e293b;
  }
  .highlight-stat {
    color: #7c5aed;
    font-weight: 700;
  }
  .stat-status {
    margin-top: 0.25rem;
    padding-top: 0.25rem;
    border-top: 1px dashed #e2e8f0;
    font-size: 0.68rem;
    font-weight: 600;
    color: #64748b;
    text-align: center;
  }
  .caption {
    font-size: 0.85rem;
    color: #64748b;
    line-height: 1.5;
    margin: 1rem 0 0 0;
    border-top: 1px solid #f1f5f9;
    padding-top: 0.75rem;
  }
</style>
