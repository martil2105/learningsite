<script>
  /* TheAnswer.svelte: the reaction curve behind the cartel's loss */
  import { A_DEFAULT as a, C_DEFAULT as c } from "../cournot.js";

  let boxWidth = $state(320);
  const W = $derived(Math.max(260, Math.min(boxWidth, 700)));
  const H = 260;
  const M = { top: 25, right: 20, bottom: 40, left: 44 };

  const intercept = a - c; // 90

  function x(R) {
    return M.left + (R / intercept) * (W - M.left - M.right);
  }
  function y(q) {
    return H - M.bottom - (q / (intercept / 2)) * (H - M.top - M.bottom);
  }

  // Five firms competing: each makes (a - c)/6 = 15, so one firm faces R = 4 x 15 = 60.
  // A cartel of two leaves four players, each making (a - c)/5 = 18: the cartel and
  // three outsiders. One outsider then faces R = 18 + 2 x 18 = 54 and makes 18.
  const before = { R: 4 * (intercept / 6), q: intercept / 6 };
  const after = { R: 3 * (intercept / 5), q: intercept / 5 };
</script>

<div class="card" id="reaction-figure">
  <div class="card-header">
    <h3 class="card-title">How an outsider responds</h3>
    <p class="card-sub">
      The purple line is one firm's best output for each amount the rest of the
      market makes. Follow the firm from the dark dot to the blue one.
    </p>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label="An outsider's reaction curve">
      <!-- Axes -->
      <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="#d4dada" />

      <!-- Reaction curve q = (a - c - R)/2 -->
      <line class="reaction" x1={x(0)} y1={y(intercept / 2)} x2={x(intercept)} y2={y(0)} stroke="#7c5aed" stroke-width="3" />

      <!-- Before the cartel -->
      <circle class="dot-before" cx={x(before.R)} cy={y(before.q)} r="5" fill="#232f3e" stroke="#fff" stroke-width="1.5" />
      <text x={x(before.R) - 10} y={y(before.q) + 20} font-size="11" font-weight="bold" fill="#232f3e" text-anchor="end">
        Before ({before.R}, {before.q})
      </text>

      <!-- After: one of the outsiders -->
      <circle class="dot-after" cx={x(after.R)} cy={y(after.q)} r="5" fill="#2b6cb0" stroke="#fff" stroke-width="1.5" />
      <text x={x(after.R) + 9} y={y(after.q) - 8} font-size="11" font-weight="bold" fill="#2b6cb0">
        After ({after.R}, {after.q})
      </text>

      <!-- Ticks -->
      {#each [0, 30, 60, 90] as t}
        <text x={x(t)} y={H - M.bottom + 16} font-size="11" text-anchor="middle" fill="#232f3e">{t}</text>
      {/each}
      {#each [0, 15, 30, 45] as t}
        <text x={M.left - 6} y={y(t) + 4} font-size="11" text-anchor="end" fill="#232f3e">{t}</text>
      {/each}
      <text x={W - M.right} y={H - 5} font-size="11" text-anchor="end" fill="#232f3e">Rest of the market's output (R)</text>
      <text x={M.left} y={M.top - 10} font-size="11" font-weight="700" fill="#232f3e">This firm's output (q)</text>
    </svg>
  </div>

  <p class="caption">
    When the cartel cuts back, the rest of the market makes less, so the firm
    slides up its line and makes more. Every outsider does the same.
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
    width: 100%;
    margin: 1rem 0;
  }
  .svg-wrap svg {
    display: block;
    margin: 0 auto;
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
