<script>
  /* TheAnswer.svelte - The reaction curve mechanics behind the cartel loss */
  let boxWidth = $state(600);
  const W = $derived(Math.max(320, Math.min(boxWidth, 700)));
  const H = 260;
  const M = { top: 25, right: 30, bottom: 40, left: 55 };

  const a = 100;
  const c = 10;
  const intercept = a - c; // 90

  function x(Qrest) {
    return M.left + (Qrest / intercept) * (W - M.left - M.right);
  }
  function y(qi) {
    return H - M.bottom - (qi / (intercept / 2)) * (H - M.top - M.bottom);
  }

  // Pre-cartel point: Qrest = 60, qi = 15
  // Post-cartel point: Qrest = 54, qi = 18
</script>

<div class="card" bind:clientWidth={boxWidth}>
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">The Mechanics: Cournot Best Response</h3>
    <p class="card-sub">
      Why do outsiders destroy the cartel's profits? Because Cournot reaction curves slope downward with a slope of <strong>&minus;1/2</strong>.
    </p>
  </div>

  <div class="svg-wrap">
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="Reaction function">
      <!-- Grid & axes -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- Reaction curve qi = (90 - Qrest)/2 -->
      <line
        x1={x(0)}
        y1={y(45)}
        x2={x(90)}
        y2={y(0)}
        stroke="#7c5aed"
        stroke-width="3"
      />

      <!-- Pre-cartel point: Qrest = 60, qi = 15 -->
      <circle cx={x(60)} cy={y(15)} r="5" fill="#232f3e" stroke="#fff" stroke-width="1.5" />
      <text x={x(60) + 8} y={y(15) - 8} font-size="11" font-weight="bold" fill="#232f3e">
        Initial (Q<tspan baseline-shift="sub" font-size="8">rest</tspan> = 60, q<tspan baseline-shift="sub" font-size="8">i</tspan> = 15)
      </text>

      <!-- Post-cartel point for outsider: Qrest = 54, qi = 18 -->
      <circle cx={x(54)} cy={y(18)} r="5" fill="#2b6cb0" stroke="#fff" stroke-width="1.5" />
      <text x={x(54) - 8} y={y(18) - 12} font-size="11" font-weight="bold" fill="#2b6cb0" text-anchor="end">
        Outsider (Q<tspan baseline-shift="sub" font-size="8">rest</tspan> = 54, q<tspan baseline-shift="sub" font-size="8">i</tspan> = 18)
      </text>

      <!-- Ticks -->
      <text x={x(0)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">0</text>
      <text x={x(30)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">30</text>
      <text x={x(60)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">60</text>
      <text x={x(90)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">90</text>
      <text x={W - M.right} y={H - M.bottom - 6} font-size="11" text-anchor="end" fill="#232f3e">Rival Output (Q<tspan baseline-shift="sub" font-size="8">rest</tspan>)</text>

      <text x={M.left - 6} y={y(0)} font-size="11" text-anchor="end" fill="#232f3e">0</text>
      <text x={M.left - 6} y={y(15)} font-size="11" text-anchor="end" fill="#232f3e">15</text>
      <text x={M.left - 6} y={y(30)} font-size="11" text-anchor="end" fill="#232f3e">30</text>
      <text x={M.left - 6} y={y(45)} font-size="11" text-anchor="end" fill="#232f3e">45</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">Firm Output (q<tspan baseline-shift="sub" font-size="8">i</tspan>)</text>
    </svg>
  </div>

  <p class="caption">
    <strong>Figure 1. The strategic substitution trap.</strong> When the cartel members restrict their production, rival output in the market drops from 60 to 54. Along the reaction curve <code>q<sub>i</sub> = (90 &minus; Q<sub>rest</sub>)/2</code>, every non-cartel firm responds by expanding output from 15 to 18 units.
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
    margin: 0.75rem 0 0 0;
    border-top: 1px solid var(--stone, #d4dada);
    padding-top: 0.5rem;
  }
</style>
