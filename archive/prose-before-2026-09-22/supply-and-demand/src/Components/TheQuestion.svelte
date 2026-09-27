<script>
  /*
    TheQuestion.svelte
    18 months of market data. The reader drags a line through the scatter to guess demand,
    commits their answer, and sees it scored against true demand and true supply.
  */
  import { questionPoints } from "../datasets.js";
  import { sampleMoments, B, S, A, C } from "../market.js";
  import MarketPanel from "./MarketPanel.svelte";

  let committed = $state(false);
  let pGuess1 = $state(32);
  let pGuess2 = $state(15);
  const q1 = 30;
  const q2 = 90;

  // Slope of the guess: dq/dp = (q2 - q1) / (pGuess2 - pGuess1)
  let guessSlope = $derived(
    Math.abs(pGuess2 - pGuess1) > 1e-4 ? (q2 - q1) / (pGuess2 - pGuess1) : 0
  );

  const moments = sampleMoments(questionPoints);

  function commitGuess() {
    committed = true;
  }

  function resetGuess() {
    committed = false;
  }

  // Pointer drag for handle 1 and 2
  function handleDrag(handleNum, e, H, M, yInv) {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const rect = target.ownerSVGElement.getBoundingClientRect();
    const s = (H - M.top - M.bottom) / (rect.height - (M.top + M.bottom) * (rect.height / H));
    
    function onMove(ev) {
      const svgY = ev.clientY - rect.top;
      const priceVal = Math.max(0, Math.min(45, (H - M.bottom - svgY) / (H - M.top - M.bottom) * 45));
      if (handleNum === 1) pGuess1 = priceVal;
      else pGuess2 = priceVal;
    }

    function onUp(ev) {
      target.releasePointerCapture(ev.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
</script>

<div class="figure-wrap" id="the-question">
  <div class="card-header">
    <h3 class="figure-title">The Challenge: Draw the Demand Curve</h3>
    <p class="figure-desc">
      Here are eighteen months of monthly price and quantity pairs from a competitive commodity market. Drag the two violet handles to draw where you think the <strong>demand curve</strong> lies, then commit your guess.
    </p>
  </div>

  <div class="panel-container">
    <MarketPanel
      points={questionPoints}
      showTrueCurves={committed}
      showCrossing={committed}
      fittedLine={committed ? { slope: moments.slope, meanP: moments.meanP, meanQ: moments.meanQ } : null}
      ariaLabel="18 months of market transactions for user estimation"
    >
      {#snippet children({ x, y, H, M })}
        <!-- User guess line -->
        <line
          class="guess-line"
          x1={x(q1)}
          y1={y(pGuess1)}
          x2={x(q2)}
          y2={y(pGuess2)}
          stroke="#7c5aed"
          stroke-width="3"
        />

        <!-- Draggable handles -->
        {#if !committed}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <circle
            class="handle handle-1"
            cx={x(q1)}
            cy={y(pGuess1)}
            r="8"
            fill="#7c5aed"
            stroke="#ffffff"
            stroke-width="2"
            style="cursor: ns-resize; touch-action: none;"
            onpointerdown={(e) => handleDrag(1, e, H, M, y)}
          />
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <circle
            class="handle handle-2"
            cx={x(q2)}
            cy={y(pGuess2)}
            r="8"
            fill="#7c5aed"
            stroke="#ffffff"
            stroke-width="2"
            style="cursor: ns-resize; touch-action: none;"
            onpointerdown={(e) => handleDrag(2, e, H, M, y)}
          />
        {/if}
      {/snippet}
    </MarketPanel>
  </div>

  <div class="action-bar">
    {#if !committed}
      <button class="commit-btn" onclick={commitGuess}>
        Commit guess
      </button>
      <span class="hint">Drag the circular handles up or down to adjust your line.</span>
    {:else}
      <button class="reset-btn" onclick={resetGuess}>
        Try another guess
      </button>
      <div class="score-report">
        <p>
          Your line has slope <strong>{guessSlope.toFixed(2)}</strong>.
          The standard line of best fit (OLS, in green) has slope <strong>{moments.slope.toFixed(2)}</strong>.
          Yet the true demand slope (in blue) is <strong>−{B.toFixed(1)}</strong>, and the true supply slope (in red) is <strong>+{S.toFixed(1)}</strong>!
        </p>
        <p class="takeaway">
          The fitted line slopes in the <em>wrong direction</em>. Because demand was shifting more than supply over these eighteen months, the scatter of points traces out supply, not demand.
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
  .figure-wrap {
    background: #ffffff;
    border: 3px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2.5rem 0;
  }
  .card-header {
    margin-bottom: 1rem;
  }
  .figure-title {
    font-size: 1.25rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 0.5rem 0;
    color: var(--squidink, #232f3e);
  }
  .figure-desc {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    color: var(--squidink, #232f3e);
    opacity: 0.85;
  }
  .panel-container {
    background: var(--paper, #f1f3f3);
    border: 1px solid #e5e9e9;
    padding: 0.75rem 0.5rem 0.25rem 0.5rem;
  }
  .action-bar {
    margin-top: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .commit-btn {
    align-self: flex-start;
    background: var(--violet, #7c5aed);
    color: #ffffff;
    border: none;
    padding: 0.6rem 1.4rem;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    cursor: pointer;
    transition: background 120ms ease;
  }
  .commit-btn:hover {
    background: #6744db;
  }
  .reset-btn {
    align-self: flex-start;
    background: transparent;
    border: 2px solid var(--squidink, #232f3e);
    color: var(--squidink, #232f3e);
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
  }
  .hint {
    font-size: 0.85rem;
    color: #666;
    font-style: italic;
  }
  .score-report {
    background: #f8fafc;
    border-left: 4px solid var(--violet, #7c5aed);
    padding: 0.8rem 1.2rem;
    font-size: 0.92rem;
    line-height: 1.55;
    color: var(--squidink, #232f3e);
  }
  .takeaway {
    margin-top: 0.4rem;
    font-weight: 600;
  }
  .handle {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }
</style>
