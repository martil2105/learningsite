<script>
  /*
    The hook. One manipulable object: drag any coalition's payoff.

    Everything else on screen is a consequence of those seven numbers - the six
    orderings, the marginal contribution in every cell, and the three averages
    along the bottom. The averages are the Shapley values, and the point of
    building it this way is that the reader never has to take the formula on
    trust: the answer is a column mean they can see being taken.

    The presets are not decoration. Each one is a game chosen so that an axiom
    becomes observable - a null player paid zero, two interchangeable players
    paid the same, a unanimity game splitting evenly.
  */
  import { scaleLinear } from "d3-scale";
  import { PRESETS, PLAYERS, PAYOFF_MAX, PAYOFF_STEP } from "../game.js";
  import { shapleyExact } from "../shapley.js";
  import { PLAYER_COLORS, INK, MUTED, FAINT, SMILE } from "../palette.js";

  const N = 3;
  const INITIALS = PLAYERS.map((p) => p.name[0]);
  // Editable coalitions, in reading order: singletons, pairs, everyone.
  const SLOTS = [
    { mask: 1, label: "A" },
    { mask: 2, label: "B" },
    { mask: 4, label: "C" },
    { mask: 3, label: "AB" },
    { mask: 5, label: "AC" },
    { mask: 6, label: "BC" },
    { mask: 7, label: "ABC" },
  ];

  let payoffs = PRESETS[0].payoffs.slice();
  let presetKey = PRESETS[0].key;
  let hoveredRow = null;

  $: preset = PRESETS.find((p) => p.key === presetKey) || null;
  $: game = payoffs;
  $: result = shapleyExact(N, (m) => game[m]);
  $: phi = result.phi;
  $: rows = result.rows;

  // One shared scale for every marginal-contribution bar, so a cell in one row
  // is directly comparable with a cell in another and with the average below.
  $: allMarginals = rows.flatMap((r) => r.marginals);
  $: cellMax = Math.max(10, ...allMarginals.map((m) => Math.abs(m)));
  $: cellMin = Math.min(0, ...allMarginals);
  $: cellScale = scaleLinear().domain([Math.min(cellMin, 0), cellMax]).range([0, 100]);
  $: zeroPct = cellScale(0);

  function applyPreset(p) {
    presetKey = p.key;
    payoffs = p.payoffs.slice();
    hoveredRow = null;
  }

  const fmt = (x) => (Math.abs(x % 1) < 0.005 ? x.toFixed(0) : x.toFixed(1));
  const signed = (x) => (x > 0 ? "+" : x < 0 ? "−" : "") + fmt(Math.abs(x));

  // ------------------------------------------------------- payoff editor
  // Starts small: if the resize binding is slow or never fires, the chart is
  // briefly narrow rather than drawn wider than its box and clipped.
  let editorWidth = 320;
  let svgNode;
  let dragSlot = null;

  $: compact = editorWidth < 480;
  const H = 168;
  $: margin = { top: 22, right: 6, bottom: 34, left: compact ? 26 : 34 };
  $: plotW = Math.max(160, editorWidth - margin.left - margin.right);
  $: band = plotW / SLOTS.length;
  // A 2px surface gap either side of every bar.
  $: barW = Math.max(14, Math.min(compact ? 34 : 48, band - 12));
  $: yScale = scaleLinear().domain([0, PAYOFF_MAX]).range([H - margin.bottom, margin.top]);
  /*
    These MUST be reactive declarations, not plain consts.

    A `const` helper that closes over a `$:` variable is invisible to Svelte's
    dirty tracking: the identity of the function never changes, so a template
    expression like x={slotX(i)} is never re-evaluated when `band` changes. The
    result is not a crash but something worse - the parts of the chart whose
    attributes happen to mention a reactive variable directly update, and the
    parts that only call the helper stay laid out at the initial width. Half the
    chart then disagrees with the other half.
  */
  $: slotX = (i) => margin.left + band * i + band / 2;

  // Bars with a rounded data-end, anchored flat on the baseline. Reactive for
  // the same reason as slotX above: it closes over yScale and barW.
  $: barPath = (cx, value) => {
    const y = yScale(value);
    const y0 = yScale(0);
    const h = Math.max(0, y0 - y);
    const r = Math.min(4, h, barW / 2);
    const x = cx - barW / 2;
    if (h <= 0.5) return "M " + x + " " + y0 + " h " + barW;
    return (
      "M " + x + " " + y0 +
      " V " + (y + r) +
      " a " + r + " " + r + " 0 0 1 " + r + " " + -r +
      " h " + (barW - 2 * r) +
      " a " + r + " " + r + " 0 0 1 " + r + " " + r +
      " V " + y0 + " Z"
    );
  };

  function setPayoff(slotIndex, rawValue) {
    const clamped = Math.max(0, Math.min(PAYOFF_MAX, rawValue));
    const snapped = Math.round(clamped / PAYOFF_STEP) * PAYOFF_STEP;
    if (payoffs[SLOTS[slotIndex].mask] === snapped) return;
    const next = payoffs.slice();
    next[SLOTS[slotIndex].mask] = snapped;
    payoffs = next;
    presetKey = null;
  }

  function valueAt(event) {
    const rect = svgNode.getBoundingClientRect();
    // With a viewBox the SVG may be scaled down by max-width, so convert client
    // pixels back into user units instead of assuming they map 1:1.
    const scale = rect.width > 0 && editorWidth > 0 ? rect.width / editorWidth : 1;
    return yScale.invert((event.clientY - rect.top) / scale);
  }

  function onPointerDown(i, event) {
    dragSlot = i;
    event.target.setPointerCapture(event.pointerId);
    setPayoff(i, valueAt(event));
  }

  function onPointerMove(event) {
    if (dragSlot === null) return;
    setPayoff(dragSlot, valueAt(event));
  }

  function onPointerUp() {
    dragSlot = null;
  }

  function onKey(i, event) {
    const step = event.shiftKey ? PAYOFF_STEP * 4 : PAYOFF_STEP;
    const current = payoffs[SLOTS[i].mask];
    if (event.key === "ArrowUp" || event.key === "ArrowRight") setPayoff(i, current + step);
    else if (event.key === "ArrowDown" || event.key === "ArrowLeft") setPayoff(i, current - step);
    else return;
    event.preventDefault();
  }

  // ------------------------------------------------------- row narration
  function describeRow(row) {
    const parts = row.coalitions.map((c, k) => {
      const who = PLAYERS[c.player].name;
      const before = k === 0 ? 0 : row.coalitions[k - 1].value;
      const verb = k === 0 ? "starts alone" : k === row.coalitions.length - 1 ? "joins last" : "joins";
      return (
        who + " " + verb + ": the group goes from " + fmt(before) + " to " + fmt(c.value) +
        ", so " + who + " is credited " + signed(c.value - before)
      );
    });
    return parts.join(". ") + ".";
  }
</script>

<section class="hook">
  <div class="hook-card">
    <header class="hook-head">
      <div>
        <h3 class="hook-title">Every order they could have arrived in</h3>
        <p class="hook-sub">
          Drag any bar to change what a group is worth. Everything below recomputes.
        </p>
      </div>
      <div class="presets" role="group" aria-label="Example games">
        {#each PRESETS as p}
          <button
            class="preset"
            class:on={presetKey === p.key}
            on:click={() => applyPreset(p)}>{p.name}</button
          >
        {/each}
      </div>
    </header>

    <!-- ---------------------------------------------- the value function -->
    <div class="editor">
      <div class="measure" bind:clientWidth={editorWidth} />
      <svg
        bind:this={svgNode}
        viewBox="0 0 {editorWidth} {H}"
        width={editorWidth}
        height={H}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}
        on:pointercancel={onPointerUp}
        role="group"
        aria-label="Coalition payoffs. Drag a bar, or focus one and use the arrow keys."
      >
        {#each yScale.ticks(4) as t}
          <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={yScale(t)} y2={yScale(t)} />
          <text class="tick" x={margin.left - 7} y={yScale(t) + 4} text-anchor="end">{t}</text>
        {/each}

        {#each SLOTS as slot, i}
          {@const cx = slotX(i)}
          {@const value = payoffs[slot.mask]}
          <path class="bar" class:active={dragSlot === i} d={barPath(cx, value)} />
          <text class="bar-value" x={cx} y={yScale(value) - 7} text-anchor="middle">{value}</text>
          <text class="bar-label" x={cx} y={H - margin.bottom + 17} text-anchor="middle">{slot.label}</text>
          <!-- Generous invisible hit target, and the keyboard handle. -->
          <rect
            class="handle"
            x={cx - band / 2 + 2}
            y={margin.top - 14}
            width={band - 4}
            height={H - margin.bottom - margin.top + 20}
            tabindex="0"
            role="slider"
            aria-label="Payoff for {slot.label}"
            aria-valuemin="0"
            aria-valuemax={PAYOFF_MAX}
            aria-valuenow={value}
            on:pointerdown={(e) => onPointerDown(i, e)}
            on:keydown={(e) => onKey(i, e)}
          />
        {/each}
        <line class="axis" x1={margin.left} x2={margin.left + plotW} y1={yScale(0)} y2={yScale(0)} />
      </svg>
      <p class="editor-note">
        What each group could bill on its own, in thousands.
        <span class="key">
          {#each PLAYERS as p, i}
            <span class="key-item">
              <span class="dot" style="background:{PLAYER_COLORS[i]}" />{INITIALS[i]} = {p.name}
            </span>
          {/each}
        </span>
      </p>
      {#if preset}
        <p class="preset-blurb"><span class="bold">{preset.name}.</span> {preset.blurb}</p>
      {:else}
        <p class="preset-blurb">Your own game. The three averages below still add up to {payoffs[7]}.</p>
      {/if}
    </div>

    <!-- ---------------------------------------------- the orderings table -->
    <div class="table-wrap">
      <table class="orders">
        <thead>
          <tr>
            <th class="order-col" scope="col">Order<span class="wide-only">: who arrives when</span></th>
            {#each PLAYERS as p, i}
              <th scope="col" style="color:{PLAYER_COLORS[i]}">
                <span class="dot" style="background:{PLAYER_COLORS[i]}" />{p.name}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each rows as row, r}
            <tr
              class:lit={hoveredRow === r}
              on:mouseenter={() => (hoveredRow = r)}
              on:mouseleave={() => (hoveredRow = null)}
              on:focusin={() => (hoveredRow = r)}
              on:click={() => (hoveredRow = r)}
            >
              <th class="order-col" scope="row" tabindex="0">
                {#each row.order as p, k}
                  <span class="chip" style="border-color:{PLAYER_COLORS[p]}; color:{PLAYER_COLORS[p]}"
                    >{INITIALS[p]}</span
                  >{#if k < row.order.length - 1}<span class="arrow">→</span>{/if}
                {/each}
              </th>
              {#each row.marginals as m, i}
                <td>
                  <span class="cell">
                    <span class="cell-track">
                      <span class="cell-zero" style="left:{zeroPct}%" />
                      <span
                        class="cell-bar"
                        style="background:{PLAYER_COLORS[i]};
                               left:{Math.min(cellScale(m), zeroPct)}%;
                               width:{Math.abs(cellScale(m) - zeroPct)}%"
                      />
                    </span>
                    <span class="cell-num">{fmt(m)}</span>
                  </span>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr>
            <th class="order-col" scope="row"
              >Average<span class="wide-only"> — the Shapley value</span></th
            >
            {#each phi as value, i}
              <td>
                <span class="cell">
                  <span class="cell-track">
                    <span class="cell-zero" style="left:{zeroPct}%" />
                    <span
                      class="cell-bar tall"
                      style="background:{PLAYER_COLORS[i]};
                             left:{Math.min(cellScale(value), zeroPct)}%;
                             width:{Math.abs(cellScale(value) - zeroPct)}%"
                    />
                  </span>
                  <span class="cell-num strong">{fmt(value)}</span>
                </span>
              </td>
            {/each}
          </tr>
        </tfoot>
      </table>
    </div>

    <p class="readout">
      {#if hoveredRow !== null}
        {describeRow(rows[hoveredRow])}
      {:else}
        {phi.map((x, i) => PLAYERS[i].name + " " + fmt(x)).join(", ")} — and they sum to
        {fmt(phi.reduce((a, b) => a + b, 0))}, exactly what the three of them are worth together.
        Hover or tap a row to walk through it.
      {/if}
    </p>
  </div>
</section>

<style>
  .hook {
    max-width: 760px;
    margin: 2rem auto 1rem auto;
    padding: 0 1rem;
  }

  .hook-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1.2rem 1.3rem 1rem 1.3rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .hook-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.6rem;
  }

  .hook-title {
    font-family: var(--font-main);
    font-size: 1.02rem;
    font-weight: 700;
    color: var(--squidink);
    margin: 0;
  }

  .hook-sub {
    font-family: var(--font-main);
    font-size: 0.83rem;
    color: #718096;
    margin: 0.2rem 0 0 0;
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .preset {
    font-family: var(--font-main);
    font-size: 0.74rem;
    padding: 5px 9px;
    border-radius: 999px;
    border: 1px solid #d9dee5;
    background: #ffffff;
    color: #4a5568;
    cursor: pointer;
    transition: all 140ms ease;
  }

  .preset:hover {
    border-color: var(--violet);
    color: var(--violet);
  }

  .preset.on {
    background: var(--violet);
    border-color: var(--violet);
    color: #ffffff;
  }

  /* Zero-height ruler: its clientWidth is the padded box's content width. */
  .measure {
    width: 100%;
    height: 0;
  }

  .editor {
    margin-top: 0.4rem;
  }

  svg {
    max-width: 100%;
    display: block;
    touch-action: none;
  }

  .grid {
    stroke: #eef1f5;
  }

  .axis {
    stroke: #cbd3dc;
  }

  .bar {
    fill: #56637a;
    transition: fill 120ms ease;
  }

  .bar.active {
    fill: #ff9900;
  }

  .handle {
    fill: transparent;
    cursor: ns-resize;
    outline: none;
  }

  .handle:focus-visible {
    stroke: var(--violet);
    stroke-width: 2;
    stroke-dasharray: 3 3;
  }

  .bar-value {
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    fill: var(--squidink);
    pointer-events: none;
  }

  .bar-label {
    font-family: var(--font-main);
    font-size: 12px;
    font-weight: 700;
    fill: #4a5568;
    pointer-events: none;
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    fill: #9aa5b1;
  }

  .editor-note {
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #718096;
    margin: 0.15rem 0 0 0;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .key {
    display: flex;
    gap: 0.7rem;
  }

  .key-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    display: inline-block;
  }

  .preset-blurb {
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: #4a5568;
    line-height: 1.5;
    margin: 0.7rem 0 0 0;
    padding: 0.55rem 0.7rem;
    background: var(--paper);
    border-radius: 6px;
    border-left: 3px solid var(--violet);
  }

  .table-wrap {
    overflow-x: auto;
    margin-top: 1rem;
  }

  .orders {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-main);
    font-size: 0.85rem;
  }

  .orders th,
  .orders td {
    padding: 5px 6px;
    text-align: left;
  }

  .orders thead th {
    font-size: 0.78rem;
    letter-spacing: 0.3px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 7px;
    white-space: nowrap;
  }

  .orders thead th .dot {
    margin-right: 5px;
  }

  .order-col {
    color: #4a5568;
    font-weight: 400;
    white-space: nowrap;
    width: 1%;
    padding-right: 14px !important;
    outline: none;
  }

  tbody tr {
    transition: background 120ms ease;
  }

  tbody tr.lit {
    background: #f5f2ff;
  }

  tbody tr:focus-within {
    background: #f5f2ff;
  }

  .chip {
    display: inline-block;
    width: 19px;
    height: 19px;
    line-height: 17px;
    text-align: center;
    border: 1.5px solid;
    border-radius: 5px;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .arrow {
    color: #b6bfcc;
    margin: 0 3px;
    font-size: 0.75rem;
  }

  .cell {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .cell-track {
    position: relative;
    flex: 1 1 auto;
    min-width: 34px;
    height: 9px;
    background: #f0f3f7;
    border-radius: 2px;
  }

  .cell-zero {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 1px;
    background: #c3ccd8;
  }

  .cell-bar {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 2px;
    min-width: 1px;
  }

  .cell-bar.tall {
    top: -3px;
    bottom: -3px;
  }

  .cell-num {
    font-family: var(--font-mono, monospace);
    font-size: 0.78rem;
    color: #4a5568;
    width: 3.1em;
    text-align: right;
    flex: 0 0 auto;
  }

  .cell-num.strong {
    color: var(--squidink);
    font-weight: 700;
  }

  tfoot th,
  tfoot td {
    border-top: 2px solid #d9dee5;
    padding-top: 9px !important;
  }

  tfoot .order-col {
    color: var(--squidink);
    font-weight: 700;
  }

  .readout {
    font-family: var(--font-main);
    font-size: 0.82rem;
    color: #4a5568;
    line-height: 1.55;
    margin: 0.85rem 0 0 0;
    min-height: 3.2em;
  }

  .bold {
    font-family: var(--font-heavy);
  }

  @media screen and (max-width: 950px) {
    .hook {
      padding: 0 0.5rem;
    }

    .hook-card {
      padding: 0.9rem 0.8rem;
    }

    .orders {
      font-size: 0.8rem;
    }

    .orders th,
    .orders td {
      padding: 5px 4px;
    }

    .order-col {
      padding-right: 8px !important;
    }

    .cell-num {
      font-size: 0.71rem;
      width: 2.7em;
    }

    /* The long footer label was setting the first column's width and pushing
       Cleo's column off a 390px screen. */
    .wide-only {
      display: none;
    }

    .cell-track {
      min-width: 22px;
    }

    .cell {
      gap: 5px;
    }

    .chip {
      width: 17px;
      height: 17px;
      line-height: 15px;
      font-size: 0.68rem;
    }

    .arrow {
      margin: 0 1px;
    }

    .editor-note {
      font-size: 0.72rem;
    }
  }
</style>
