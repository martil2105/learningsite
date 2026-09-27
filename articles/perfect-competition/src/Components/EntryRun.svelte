<script>
  /* EntryRun.svelte: The Hook — One steered simulation of free entry */
  import { linear, clampW } from "../chart.js";
  import { F, c, d, acMin, createMarket } from "../entry.js";

  const market = createMarket(600, 10); // A=600, B=10 => nBar = 50.7107, nStar = 50

  let currentN = $state(1);
  let isPlaying = $state(false);
  let timerId = null;
  let refuseMessage = $state("");

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  const M = { top: 20, right: 24, bottom: 40, left: 52 };
  const height = 320;

  const N_MAX = 54;
  const P_MAX = 60;
  const P_MIN = 22;

  let x = $derived(linear(0, N_MAX, M.left, W - M.right));
  let y = $derived(linear(P_MIN, P_MAX, height - M.bottom, M.top));

  let priceNow = $derived(market.price(currentN));
  let profitNow = $derived(market.profit(currentN));
  let profitShare = $derived((100 * profitNow) / F);

  function stepTo(n) {
    refuseMessage = "";
    if (n > market.nStar) {
      refuseMessage = `Firm ${n} stays out: projected profit ${market.profit(n).toFixed(2)} < 0`;
      currentN = market.nStar;
      if (isPlaying) stopPlay();
      return;
    }
    currentN = Math.max(1, Math.min(market.nStar, n));
  }

  function stepForward() {
    if (currentN >= market.nStar) {
      refuseMessage = `Firm ${currentN + 1} stays out: projected profit ${market.profit(currentN + 1).toFixed(2)} < 0`;
      if (isPlaying) stopPlay();
      return;
    }
    refuseMessage = "";
    currentN++;
  }

  function togglePlay() {
    if (isPlaying) {
      stopPlay();
    } else {
      if (currentN >= market.nStar) currentN = 1;
      isPlaying = true;
      refuseMessage = "";
      timerId = setInterval(() => {
        if (currentN < market.nStar) {
          currentN++;
        } else {
          refuseMessage = `Firm ${currentN + 1} stays out: projected profit ${market.profit(currentN + 1).toFixed(2)} < 0`;
          stopPlay();
        }
      }, 70);
    }
  }

  function stopPlay() {
    isPlaying = false;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function reset() {
    stopPlay();
    refuseMessage = "";
    currentN = 1;
  }

  // Price history line up to currentN
  let historyPath = $derived.by(() => {
    let pts = [];
    for (let k = 1; k <= currentN; k++) {
      pts.push(`${k === 1 ? "M" : "L"} ${x(k).toFixed(1)} ${y(market.price(k)).toFixed(1)}`);
    }
    return pts.join(" ");
  });
</script>

<div class="card hook-card" id="entry-run">
  <div class="measure" style="width: 100%; height: 0;"></div>

  <div class="card-header">
    <h3 class="card-title">Letting firms in</h3>
    <p class="card-sub">
      Admit firms one at a time into a market with demand Q = 600 − 10p, or press Auto-run, and watch where entry stops.
    </p>
  </div>

  <div class="controls-bar">
    <div class="btn-cluster">
      <button type="button" class="btn-action primary" onclick={stepForward}>
        + Admit 1 firm
      </button>
      <button type="button" class="btn-action" onclick={togglePlay}>
        {isPlaying ? "Pause" : "Auto-run"}
      </button>
      <button type="button" class="btn-action secondary" onclick={reset}>
        Reset
      </button>
    </div>

    <div class="slider-row">
      <label for="scrubber-slider" class="ctrl-label">
        Firms (n): <strong>{currentN}</strong>
      </label>
      <input
        id="scrubber-slider"
        type="range"
        min="1"
        max={market.nStar}
        bind:value={currentN}
        oninput={(e) => stepTo(+e.currentTarget.value)}
      />
    </div>

    {#if refuseMessage}
      <div class="refusal-banner font-mono" id="refusal-alert">
        {refuseMessage}
      </div>
    {/if}
  </div>

  <div class="readout-grid">
    <div class="readout-item">
      <span class="lbl">Firms in the market</span>
      <span class="val font-mono" id="sim-n-val">{currentN}</span>
      <span class="sub">room for n̄ = {market.nBar.toFixed(2)}</span>
    </div>
    <div class="readout-item">
      <span class="lbl">Market price p(n)</span>
      <span class="val font-mono text-purple" id="sim-p-val">{priceNow.toFixed(4)}</span>
      <span class="sub">min AC = {acMin.toFixed(4)}</span>
    </div>
    <div class="readout-item highlight">
      <span class="lbl">Profit per firm (π)</span>
      <span class="val font-mono text-blue" id="sim-profit-val">+{profitNow.toFixed(4)}</span>
      <span class="sub">{profitShare.toFixed(3)}% of fixed cost</span>
    </div>
    <div class="readout-item">
      <span class="lbl">Next firm would make</span>
      <span class="val font-mono text-pink" id="sim-next-profit">
        {market.profit(currentN + 1) >= 0 ? "+" : ""}{market.profit(currentN + 1).toFixed(4)}
      </span>
      <span class="sub">{market.profit(currentN + 1) >= 0 ? "would enter" : "stays out (loss)"}</span>
    </div>
  </div>

  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} {height} viewBox="0 0 {W} {height}" role="img" aria-label="Steered entry simulation showing price descent">
      <!-- Grid & axes -->
      <line x1={M.left} y1={height - M.bottom} x2={W - M.right} y2={height - M.bottom} stroke="#d4dada" />
      <line x1={M.left} y1={M.top} x2={M.left} y2={height - M.bottom} stroke="#d4dada" />

      <!-- Minimum average cost threshold line -->
      <line
        class="min-ac-line"
        x1={M.left}
        y1={y(acMin)}
        x2={W - M.right}
        y2={y(acMin)}
        stroke="#df2a5d"
        stroke-dasharray="3 3"
        stroke-width="1.8"
      />
      <text x={W - M.right} y={y(acMin) - 6} text-anchor="end" fill="#df2a5d" font-size="11" font-weight="700">
        min AC = {acMin.toFixed(2)}
      </text>

      <!-- Step descent history line -->
      <path class="curve entry-history" d={historyPath} fill="none" stroke="#232f3e" stroke-width="2" />

      <!-- Previous firms markers (faint) -->
      {#each Array.from({ length: currentN }, (_, i) => i + 1) as k}
        <circle cx={x(k)} cy={y(market.price(k))} r="2" fill="#8a94a2" />
      {/each}

      <!-- Current firm active marker -->
      <circle class="dot active-price" cx={x(currentN)} cy={y(priceNow)} r="6" fill="#7c5aed" />
      <line
        x1={x(currentN)}
        y1={height - M.bottom}
        x2={x(currentN)}
        y2={y(priceNow)}
        stroke="#7c5aed"
        stroke-dasharray="2 2"
        stroke-width="1.2"
      />

      <!-- Text marker for current price -->
      <text x={x(currentN) - 4} y={y(priceNow) - 10} text-anchor="end" font-size="11" font-weight="700" fill="#7c5aed">
        p = {priceNow.toFixed(2)}
      </text>

      <!-- Ticks & labels -->
      <text x={x(0)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">0</text>
      <text x={x(10)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">10</text>
      <text x={x(20)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">20</text>
      <text x={x(30)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">30</text>
      <text x={x(40)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">40</text>
      <text x={x(50)} y={height - M.bottom + 18} font-size="11" text-anchor="middle" fill="#232f3e">50</text>
      <text x={W - M.right} y={height - 6} font-size="11" text-anchor="end" font-weight="700" fill="#232f3e">
        Firms admitted, n
      </text>

      <text x={M.left - 8} y={y(25) + 4} font-size="11" text-anchor="end" fill="#232f3e">25</text>
      <text x={M.left - 8} y={y(30) + 4} font-size="11" text-anchor="end" fill="#232f3e">30</text>
      <text x={M.left - 8} y={y(40) + 4} font-size="11" text-anchor="end" fill="#232f3e">40</text>
      <text x={M.left - 8} y={y(50) + 4} font-size="11" text-anchor="end" fill="#232f3e">50</text>
      <text x={M.left - 8} y={y(60) + 4} font-size="11" text-anchor="end" fill="#232f3e">60</text>
      <text x={M.left} y={M.top - 8} font-size="11" font-weight="700" fill="#232f3e">
        Price, p(n)
      </text>
    </svg>
  </div>

  <p class="caption">
    The line traces the price as each firm arrives. Look at where it stops, and at whether it ever reaches the dashed line at the lowest average cost.
  </p>
</div>

<style>
  .card {
    border: 3px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2rem 0;
    background: #fff;
  }
  .hook-card {
    border-color: var(--violet, #7c5aed);
  }
  .card-header {
    margin-bottom: 1.25rem;
  }
  .card-title {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0 0 0.4rem 0;
  }
  .card-sub {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    opacity: 0.85;
  }
  .controls-bar {
    background: var(--paper, #f1f3f3);
    padding: 0.85rem 1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .btn-cluster {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .btn-action {
    padding: 0.4rem 0.8rem;
    font-size: 0.82rem;
    font-weight: 700;
    border: 2px solid var(--squidink, #232f3e);
    background: #fff;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .btn-action.primary {
    background: var(--squidink, #232f3e);
    color: #fff;
  }
  .btn-action.primary:hover {
    background: var(--violet, #7c5aed);
    border-color: var(--violet, #7c5aed);
  }
  .btn-action.secondary {
    border-color: #8a94a2;
    color: #555;
  }
  .slider-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .ctrl-label {
    font-size: 0.85rem;
    font-weight: 600;
    min-width: 7rem;
  }
  input[type="range"] {
    flex: 1;
    accent-color: var(--violet, #7c5aed);
  }
  .refusal-banner {
    background: rgba(223, 42, 93, 0.1);
    border-left: 3px solid #df2a5d;
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
    color: #df2a5d;
    font-weight: 700;
  }
  .readout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .readout-item {
    border: 1px solid #d4dada;
    padding: 0.6rem 0.8rem;
    display: flex;
    flex-direction: column;
  }
  .readout-item.highlight {
    border-color: var(--violet, #7c5aed);
    background: rgba(124, 90, 237, 0.05);
  }
  .lbl {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--squidink, #232f3e);
    opacity: 0.8;
  }
  .val {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0.2rem 0;
  }
  .text-purple {
    color: var(--violet, #7c5aed);
  }
  .text-blue {
    color: #2074d5;
  }
  .text-pink {
    color: #df2a5d;
  }
  .sub {
    font-size: 0.75rem;
    opacity: 0.6;
  }
  .svg-wrap {
    width: 100%;
    margin-bottom: 0.75rem;
  }
  .caption {
    font-size: 0.85rem;
    line-height: 1.5;
    opacity: 0.8;
    margin: 0;
  }
</style>
