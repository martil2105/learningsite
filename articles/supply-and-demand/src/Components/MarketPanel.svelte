<script>
  /*
    MarketPanel.svelte
    Shared two-curve panel built for supply-and-demand and imported by surplus-and-efficiency.
    Fixed scales: quantity q ∈ [0, 130], price p ∈ [0, 45].
    Classes: line demand, line supply, line fit, line reverse, dot obs, crossing-dot.
  */
  import { linear, clampW } from "../chart.js";
  import { A, B, C, S, p0, q0 } from "../market.js";

  let {
    mkt = { A, B, C, S },
    points = [],
    fittedLine = null,
    reverseLine = null,
    showTrueCurves = true,
    showCrossing = true,
    crossing = { p: p0, q: q0 },
    shading = null, // for surplus-and-efficiency: { type: 'triangle'|'misalloc'|'both', q, pBar, N }
    height = 320,
    ariaLabel = "Supply and demand market panel",
    children
  } = $props();

  const M = { top: 20, right: 20, bottom: 42, left: 48 };
  const Q_MAX = 130;
  const P_MAX = 45;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let x = $derived(linear(0, Q_MAX, M.left, W - M.right));
  let y = $derived(linear(0, P_MAX, height - M.bottom, M.top));

  // Inverse demand: p = (A - q)/B
  const pDemand = (q) => (mkt.A - q) / mkt.B;
  // Inverse supply: p = (q - C)/S
  const pSupply = (q) => (q - mkt.C) / mkt.S;

  const qTicks = [0, 20, 40, 60, 80, 100, 120];
  const pTicks = [0, 10, 20, 30, 40];

  // Helper for line endpoints clipped to plot bounds
  function fitLinePath(fit) {
    if (!fit) return "";
    // fit has slope (dq/dp) and intercept (q = intercept + slope*p) OR slope m = dp/dq
    // In our market: slope is dq/dp, q = qBar + b*(p - pBar).
    // Let's compute p for q = 0 and q = Q_MAX, or q for p = 0 and p = P_MAX
    const { slope, meanP = p0, meanQ = q0 } = fit;
    if (Math.abs(slope) < 1e-6) {
      // flat in q-p: q is constant meanQ, meaning vertical in (q, p) plot!
      // Wait: regression of q on p: q = meanQ + slope*(p - meanP).
      // When p runs 0 to P_MAX, q runs meanQ + slope*(0 - meanP) to meanQ + slope*(P_MAX - meanP).
      const qStart = meanQ + slope * (0 - meanP);
      const qEnd = meanQ + slope * (P_MAX - meanP);
      return `M ${x(qStart)} ${y(0)} L ${x(qEnd)} ${y(P_MAX)}`;
    }
    const qAtP0 = meanQ + slope * (0 - meanP);
    const qAtPMax = meanQ + slope * (P_MAX - meanP);
    return `M ${x(qAtP0)} ${y(0)} L ${x(qAtPMax)} ${y(P_MAX)}`;
  }

  // Reverse regression: regression of p on q: p = meanP + (Cov/Vq)*(q - meanQ)
  function reverseLinePath(rev) {
    if (!rev) return "";
    const { slopePQ, meanP = p0, meanQ = q0 } = rev; // slopePQ = dp/dq
    const pAtQ0 = meanP + slopePQ * (0 - meanQ);
    const pAtQMax = meanP + slopePQ * (Q_MAX - meanQ);
    return `M ${x(0)} ${y(pAtQ0)} L ${x(Q_MAX)} ${y(pAtQMax)}`;
  }
</script>

<div class="market-panel" role="region" aria-label={ariaLabel}>
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <svg
    width={W}
    height={height}
    viewBox={`0 0 ${W} ${height}`}
    role="img"
    aria-label={ariaLabel}
  >
    <defs>
      <clipPath id="plot-area">
        <rect x={M.left} y={M.top} width={W - M.left - M.right} height={height - M.top - M.bottom} />
      </clipPath>
    </defs>

    <!-- Grid and axes -->
    <g class="axis-grid" aria-hidden="true">
      {#each qTicks as qt}
        <line class="grid-line" x1={x(qt)} y1={M.top} x2={x(qt)} y2={height - M.bottom} />
        <text class="tick-label" x={x(qt)} y={height - M.bottom + 15} text-anchor="middle">{qt}</text>
      {/each}
      {#each pTicks as pt}
        <line class="grid-line" x1={M.left} y1={y(pt)} x2={W - M.right} y2={y(pt)} />
        <text class="tick-label" x={M.left - 7} y={y(pt) + 4} text-anchor="end">{pt}</text>
      {/each}
      <line class="rule" x1={M.left} y1={height - M.bottom} x2={W - M.right} y2={height - M.bottom} />
      <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={height - M.bottom} />
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={height - 4} text-anchor="middle">quantity, q</text>
      <text
        class="axis-title"
        x={14}
        y={(M.top + height - M.bottom) / 2}
        text-anchor="middle"
        transform={`rotate(-90 14 ${(M.top + height - M.bottom) / 2})`}
      >
        price, p
      </text>
    </g>

    <!-- Optional shading for surplus-and-efficiency -->
    <g class="shading-group" clip-path="url(#plot-area)">
      {#if shading}
        {#if shading.triangle && shading.q < (crossing?.q ?? q0)}
          <!-- Deadweight loss triangle between q and q0 -->
          <path
            class="shade triangle"
            d={`M ${x(shading.q)} ${y(pDemand(shading.q))} L ${x(crossing?.q ?? q0)} ${y(crossing?.p ?? p0)} L ${x(shading.q)} ${y(pSupply(shading.q))} Z`}
            fill="#df2a5d"
            fill-opacity="0.28"
          />
        {/if}
        {#if shading.misalloc && shading.q > 0}
          <!-- Misallocation rectangle/band -->
          <rect
            class="shade misalloc"
            x={x(0)}
            y={Math.min(y(pDemand(0)), y(shading.pBar ?? 0))}
            width={x(shading.q) - x(0)}
            height={Math.abs(y(pDemand(shading.q)) - y(shading.pBar ?? 0))}
            fill="#2074d5"
            fill-opacity="0.22"
          />
        {/if}
        {#if shading.q}
          <!-- Vertical quantity line for quota or ceiling -->
          <line
            class="line qty-line"
            x1={x(shading.q)}
            y1={M.top}
            x2={x(shading.q)}
            y2={height - M.bottom}
            stroke="#7c5aed"
            stroke-width="1.75"
            stroke-dasharray="4 3"
          />
        {/if}
      {/if}
    </g>

    <!-- Curves and lines clipped to plot area -->
    <g class="curves-group" clip-path="url(#plot-area)">
      {#if showTrueCurves}
        <!-- Demand curve: q from 0 to A = 120 -->
        <path
          class="line demand curve demand"
          d={`M ${x(0)} ${y(pDemand(0))} L ${x(Math.min(mkt.A, Q_MAX))} ${y(pDemand(Math.min(mkt.A, Q_MAX)))}`}
          stroke="#2074d5"
          stroke-width="2.5"
          fill="none"
        />
        <!-- Supply curve: q from C to Q_MAX -->
        <path
          class="line supply curve supply"
          d={`M ${x(Math.max(0, mkt.C))} ${y(pSupply(Math.max(0, mkt.C)))} L ${x(Q_MAX)} ${y(pSupply(Q_MAX))}`}
          stroke="#df2a5d"
          stroke-width="2.5"
          fill="none"
        />
      {/if}

      <!-- Reverse regression line (dashed) -->
      {#if reverseLine}
        <path
          class="line reverse"
          d={reverseLinePath(reverseLine)}
          stroke="#2f7d32"
          stroke-width="2"
          stroke-dasharray="4 4"
          fill="none"
        />
      {/if}

      <!-- Fitted regression line (solid) -->
      {#if fittedLine}
        <path
          class="line fit"
          d={fitLinePath(fittedLine)}
          stroke="#2f7d32"
          stroke-width="2.5"
          fill="none"
        />
      {/if}

      <!-- Observation dots -->
      {#each points as pt}
        <circle
          class="dot obs"
          cx={x(pt.q)}
          cy={y(pt.p)}
          r="4"
          fill="#8a94a2"
          fill-opacity="0.8"
          stroke="#ffffff"
          stroke-width="1"
        />
      {/each}

      <!-- Equilibrium crossing dot -->
      {#if showCrossing && crossing}
        <circle
          class="crossing-dot"
          cx={x(crossing.q)}
          cy={y(crossing.p)}
          r="5"
          fill="#232f3e"
          stroke="#ffffff"
          stroke-width="1.5"
        />
      {/if}

      <!-- Children snippet for custom overlays -->
      {@render children?.({ x, y, W, H: height, M })}
    </g>

    <!-- Labels placed with halos -->
    {#if showTrueCurves}
      <text class="curve-label demand-label" x={x(100)} y={y(pDemand(100)) - 8} fill="#2074d5">Demand</text>
      <text class="curve-label supply-label" x={x(85)} y={y(pSupply(85)) + 18} fill="#df2a5d">Supply</text>
    {/if}
  </svg>
</div>

<style>
  .market-panel {
    position: relative;
    width: 100%;
    margin: 0 auto;
  }
  .measure {
    width: 100%;
    height: 0;
    padding: 0;
    margin: 0;
  }
  svg {
    display: block;
    overflow: visible;
  }
  .grid-line {
    stroke: #e5e9e9;
    stroke-width: 1px;
    shape-rendering: crispEdges;
  }
  .rule {
    stroke: #232f3e;
    stroke-width: 1.5px;
    shape-rendering: crispEdges;
  }
  .tick-label {
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    fill: #232f3e;
    opacity: 0.75;
  }
  .axis-title {
    font-family: var(--font-main, sans-serif);
    font-size: 0.82rem;
    font-weight: 700;
    fill: #232f3e;
    letter-spacing: 0.5px;
  }
  .curve-label {
    font-family: var(--font-main, sans-serif);
    font-size: 0.8rem;
    font-weight: 700;
    paint-order: stroke fill;
    stroke: #ffffff;
    stroke-width: 3px;
    stroke-linejoin: round;
  }
</style>
