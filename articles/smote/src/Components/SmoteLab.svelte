<script>
  /*
    The hook. One manipulable object: a single labelled fraud row, which the
    reader can pick up and put anywhere on the plane.

    Everything else follows from where it is. Its k nearest FRAUD neighbours
    are recomputed, the k segments to them are drawn, and the synthetic rows
    SMOTE would place on those segments are drawn with them. The point of the
    figure is that none of that machinery ever looks at the blue-grey cloud it
    is drawing straight through.

    The children are deterministic: a fixed list of (slot -> lambda) drawn once
    from a seeded stream, with slot t assigned to neighbour t mod k. So they
    slide continuously along the segments as the point moves instead of
    reshuffling on every pointer event, and the count in the footer is an exact
    count of what is on screen rather than an estimate from a hidden sample.
  */
  import { onMount } from "svelte";
  import { HOOK, EXTENT, AMOUNT_TICKS, HOUR_TICKS, euros, clock, neighboursOf, normalTerritory, KIND_LABEL, K_DEFAULT } from "../experiments.js";
  import { fitEqual } from "../plot.js";
  import { mulberry32 } from "../rng.js";
  import { LEGIT, FRAUD, SYNTH, INK, HANDLE, LABEL, TICK, AXIS, FAINT, FRAUD_WASH, FRAUD_EDGE, ACCENT } from "../palette.js";

  const K_OPTIONS = [1, 3, 5, 9, 15];
  const N_CHILDREN = 180;
  const START = 4; // a card-testing row, in the middle of its own cluster

  // Fixed positions along each segment, drawn once.
  const SLOTS = (() => {
    const r = mulberry32(4242);
    return Array.from({ length: N_CHILDREN }, () => r());
  })();

  let k = K_DEFAULT;
  let sel = START;
  let pts = HOOK.minority.map((p) => p.slice());
  let touched = false;
  let hover = null;

  const INSET = 0.12;
  const clampX = (x) => Math.min(EXTENT.x1 - INSET, Math.max(EXTENT.x0 + INSET, x));
  const clampY = (y) => Math.min(EXTENT.y1 - INSET, Math.max(EXTENT.y0 + INSET, y));

  function reset() {
    pts = HOOK.minority.map((p) => p.slice());
    sel = START;
    // k too: a reset that leaves the reader's last k in place is half a reset,
    // and it puts the figure in a state the opening prose does not describe.
    k = K_DEFAULT;
    touched = false;
  }

  /* ------------------------------------------------------------- geometry */
  let boxWidth = 320; // the bind target, and only that
  $: BW = Math.max(280, boxWidth); // what every scale and layout uses
  $: narrow = BW < 560;
  $: margin = { top: 10, right: 12, bottom: 32, left: narrow ? 40 : 46 };
  $: plotW = Math.max(160, BW - margin.left - margin.right);
  $: plotH = Math.min(430, Math.max(230, plotW / 1.196));
  $: H = plotH + margin.top + margin.bottom;
  $: plot = fitEqual(EXTENT, BW, H, margin);

  // Reactive, not const: each of these reads `plot`, which moves with the
  // measured width. A const helper here is invisible to Svelte's dirty
  // tracking and lays half the chart out at the initial width.
  $: X = (p) => plot.X(p[0]);
  $: Y = (p) => plot.Y(p[1]);
  $: ringPath = (rings) =>
    rings
      .map((r) => r.map((p, i) => (i ? "L" : "M") + " " + plot.X(p[0]).toFixed(2) + " " + plot.Y(p[1]).toFixed(2)).join(" ") + " Z")
      .join(" ");

  /* --------------------------------------------------------------- SMOTE */
  $: nbrs = neighboursOf(pts, k);
  $: cand = nbrs[sel];
  $: kids = SLOTS.map((lam, t) => {
    const j = cand[t % cand.length];
    const a = pts[sel];
    const b = pts[j];
    const p = [a[0] + lam * (b[0] - a[0]), a[1] + lam * (b[1] - a[1])];
    return { p, j, bad: normalTerritory(p, HOOK) };
  });
  $: badCount = kids.filter((c) => c.bad).length;
  $: badShare = badCount / kids.length;

  // Sentences built here rather than in the template: an {#if} block strips the
  // leading whitespace of its contents, so "{n}{#if x} of{/if}" renders "180of".
  $: footLine =
    badCount === 0
      ? "All " + kids.length + " synthetic rows landed where fraud is the denser class."
      : badCount +
        " of the " +
        kids.length +
        " synthetic rows landed where legitimate transactions are denser — " +
        Math.round(100 * badShare) +
        "% of what SMOTE just invented.";
  $: handleLine = euros(pts[sel][0]) + " at " + clock(pts[sel][1]);
  $: hoverLine = !hover
    ? ""
    : hover.kind === "child"
    ? "synthetic · " + euros(hover.p[0]) + " at " + clock(hover.p[1]) + (hover.bad ? " · in normal territory" : "")
    : "labelled fraud · " + euros(hover.p[0]) + " at " + clock(hover.p[1]) + " · " + KIND_LABEL[HOOK.kinds[hover.i]];

  /* --------------------------------------------------------------- input

     Pointer events on the SVG rather than d3-drag: the node the drag would
     attach to does not exist at onMount, and this handles touch for free. */
  let svgNode;
  let dragging = false;

  function toData(ev) {
    const rect = svgNode.getBoundingClientRect();
    // The viewBox may be scaling, so client pixels are not user units.
    const s = rect.width / BW;
    return [plot.invX((ev.clientX - rect.left) / s), plot.invY((ev.clientY - rect.top) / s)];
  }

  function nearestFraud(d) {
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const dd = (pts[i][0] - d[0]) ** 2 + (pts[i][1] - d[1]) ** 2;
      if (dd < bd) { bd = dd; best = i; }
    }
    return { i: best, d2: bd };
  }

  function down(ev) {
    const d = toData(ev);
    const near = nearestFraud(d);
    // Within about ten screen pixels of a labelled fraud row: pick it up.
    const grab = (10 / plot.scale) ** 2;
    if (near.d2 < grab) {
      sel = near.i;
      dragging = true;
      touched = true;
      svgNode.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    }
  }

  function move(ev) {
    if (!dragging) return;
    const d = toData(ev);
    pts[sel] = [clampX(d[0]), clampY(d[1])];
    pts = pts;
  }

  function up(ev) {
    if (!dragging) return;
    dragging = false;
    if (svgNode.hasPointerCapture(ev.pointerId)) svgNode.releasePointerCapture(ev.pointerId);
  }

  function key(ev) {
    const stepSize = ev.shiftKey ? 0.25 : 0.06;
    const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    const m = map[ev.key];
    if (!m) return;
    touched = true;
    pts[sel] = [clampX(pts[sel][0] + m[0] * stepSize), clampY(pts[sel][1] + m[1] * stepSize)];
    pts = pts;
    ev.preventDefault();
  }
</script>

<section class="lab">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth} />

    <div class="head">
      <span class="title">One month of card transactions</span>
      <div class="kctl" role="group" aria-label="number of neighbours">
        <span class="klabel">k</span>
        {#each K_OPTIONS as opt}
          <button class="pill" class:on={k === opt} on:click={() => (k = opt)} aria-pressed={k === opt}>{opt}</button>
        {/each}
      </div>
    </div>

    <div class="legend">
      <span class="key"><i class="dot legit" />legitimate ({HOOK.majority.length})</span>
      <span class="key"><i class="dot fraud" />labelled fraud ({HOOK.minority.length})</span>
      <span class="key"><i class="dot synth" />synthetic ({kids.length})</span>
      <span class="key"><i class="swatch" />fraud is the denser class</span>
    </div>

    <!-- The keyboard affordance lives on the wrapper, not the <svg>: an svg is a
         noninteractive element and giving it a tabindex is an a11y error, but
         the arrow keys have to move the handle for anyone not using a pointer.
         role="application" is the correct role for a 2-D positional control and
         IS focusable, but Svelte 3's checker does not have it in its
         interactive-role list, so the rule is silenced deliberately here. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
      class="stage"
      role="application"
      tabindex="0"
      aria-label="Transactions by amount and time of day. Arrow keys move the selected fraud row; hold shift for larger steps."
      on:keydown={key}
    >
    <svg
      bind:this={svgNode}
      viewBox="0 0 {BW} {H}"
      width={BW}
      height={H}
      aria-hidden="true"
      on:pointerdown={down}
      on:pointermove={move}
      on:pointerup={up}
      on:pointercancel={up}
    >
      <!-- where fraud is the denser of the two classes -->
      <path class="wash" d={ringPath(HOOK.territory)} fill={FRAUD_WASH} stroke={FRAUD_EDGE} />

      <!-- axes -->
      {#each AMOUNT_TICKS as t}
        <line class="grid" x1={plot.X(t.v)} x2={plot.X(t.v)} y1={plot.box.y} y2={plot.box.y + plot.box.h} />
        <text class="tick" x={plot.X(t.v)} y={plot.box.y + plot.box.h + 15} text-anchor="middle">{t.t}</text>
      {/each}
      {#each HOUR_TICKS as t}
        <line class="grid" x1={plot.box.x} x2={plot.box.x + plot.box.w} y1={plot.Y(t.v)} y2={plot.Y(t.v)} />
        <text class="tick" x={plot.box.x - 6} y={plot.Y(t.v) + 3.5} text-anchor="end">{t.t}</text>
      {/each}
      <text class="axis-title" x={plot.box.x + plot.box.w / 2} y={H - 4} text-anchor="middle">transaction amount</text>
      <text
        class="axis-title"
        transform="translate(11 {plot.box.y + plot.box.h / 2}) rotate(-90)"
        text-anchor="middle">time of day</text>

      <!-- the legitimate field -->
      {#each HOOK.majority as p}
        <circle cx={X(p)} cy={Y(p)} r="1.7" fill={LEGIT} opacity="0.5" />
      {/each}

      <!-- the k segments SMOTE may interpolate along -->
      {#each cand as j}
        <line class="seg" x1={X(pts[sel])} y1={Y(pts[sel])} x2={X(pts[j])} y2={Y(pts[j])} stroke={INK} />
      {/each}

      <!-- the synthetic rows -->
      {#each kids as c, t}
        <circle
          class="kid"
          cx={X(c.p)}
          cy={Y(c.p)}
          r={c.bad ? 3 : 2.4}
          fill={SYNTH}
          stroke={c.bad ? INK : "none"}
          stroke-width={c.bad ? 1.3 : 0}
          on:pointerenter={() => (hover = { kind: "child", ...c })}
          on:pointerleave={() => (hover = null)}
        />
      {/each}

      <!-- the labelled fraud rows -->
      {#each pts as p, i}
        {#if i !== sel}
          <circle
            class="fraud"
            cx={X(p)}
            cy={Y(p)}
            r="3.6"
            fill={FRAUD}
            on:pointerenter={() => (hover = { kind: "fraud", p, i })}
            on:pointerleave={() => (hover = null)}
          />
        {/if}
      {/each}

      <!-- the one the reader is holding -->
      <g class="handle" class:dragging>
        <circle cx={X(pts[sel])} cy={Y(pts[sel])} r="11" fill="none" stroke={HANDLE} stroke-width="2" opacity="0.85" />
        <circle cx={X(pts[sel])} cy={Y(pts[sel])} r="4.6" fill={FRAUD} stroke="#ffffff" stroke-width="1.6" />
      </g>

      {#if !touched}
        <text class="hint" x={X(pts[sel]) + 18} y={Y(pts[sel]) - 12}>drag me</text>
      {/if}
    </svg>
    </div>

    <div class="foot">
      <div class="readout" class:bad={badCount > 0} class:good={badCount === 0}>{footLine}</div>
      <div class="sub">
        <span class="mono">{handleLine}</span>
        <span class="dim">{hoverLine || (touched ? "" : "— or use the arrow keys")}</span>
        <button class="reset" on:click={reset}>reset</button>
      </div>
    </div>
  </div>
</section>

<style>
  .measure { width: 100%; height: 0; }

  .lab {
    display: flex;
    justify-content: center;
    margin: 2rem auto 1rem auto;
    padding: 0 0.75rem;
  }

  .card {
    width: 100%;
    max-width: 680px;
    background: #ffffff;
    border-radius: 10px;
    padding: 1rem 1.1rem 0.9rem 1.1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--squidink);
  }

  .kctl { display: flex; align-items: center; gap: 0.25rem; }

  .klabel {
    font-family: var(--font-mono, monospace);
    font-size: 0.78rem;
    color: #718096;
    margin-right: 0.15rem;
  }

  .pill {
    font-family: var(--font-mono, monospace);
    font-size: 0.76rem;
    line-height: 1;
    padding: 0.32rem 0.46rem;
    border: 1px solid #dbe1e8;
    background: #fff;
    color: #4a5568;
    border-radius: 5px;
    cursor: pointer;
    min-width: 26px;
  }

  .pill:hover { border-color: var(--violet); }

  .pill.on {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
    font-weight: 700;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem 0.9rem;
    margin: 0.5rem 0 0.35rem 0;
    font-family: var(--font-main);
    font-size: 0.72rem;
    color: #4a5568;
  }

  .key { display: inline-flex; align-items: center; gap: 0.3rem; }

  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .dot.legit { background: #8a94a2; }
  .dot.fraud { background: #df2a5d; }
  .dot.synth { background: #2074d5; }

  .swatch {
    width: 13px;
    height: 9px;
    display: inline-block;
    background: rgba(223, 42, 93, 0.14);
    border: 1px solid rgba(223, 42, 93, 0.45);
  }

  svg {
    max-width: 100%;
    display: block;
    touch-action: none;
    cursor: crosshair;
    outline: none;
  }

  .stage { outline: none; }
  .stage:focus-visible { box-shadow: 0 0 0 2px var(--violet); border-radius: 6px; }

  .grid { stroke: #eef1f5; }
  .wash { stroke-width: 1; fill-rule: evenodd; }
  .seg { stroke-width: 1; opacity: 0.32; }
  .kid { opacity: 0.85; }
  .fraud { stroke: #ffffff; stroke-width: 1.2; }
  .handle { cursor: grab; }
  .handle.dragging { cursor: grabbing; }

  .hint {
    font-family: var(--font-main);
    font-size: 11px;
    font-weight: 700;
    fill: #ff9900;
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    fill: #9aa5b1;
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    font-weight: 600;
    fill: var(--squidink);
  }

  .foot { margin-top: 0.5rem; }

  .readout {
    font-family: var(--font-main);
    font-size: 0.84rem;
    font-weight: 700;
    min-height: 1.1rem;
  }

  .readout.bad { color: #df2a5d; }
  .readout.good { color: #2f7d32; }

  .sub {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-top: 0.2rem;
    font-size: 0.75rem;
    color: #718096;
    min-height: 1rem;
  }

  .mono { font-family: var(--font-mono, monospace); }
  .dim { color: #9aa5b1; }

  .reset {
    margin-left: auto;
    font-family: var(--font-main);
    font-size: 0.72rem;
    border: none;
    background: none;
    color: var(--violet);
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  @media screen and (max-width: 950px) {
    .card { padding: 0.8rem 0.7rem 0.7rem 0.7rem; }
    .legend { font-size: 0.68rem; gap: 0.4rem 0.7rem; }
    .readout { font-size: 0.8rem; }
  }
</style>
