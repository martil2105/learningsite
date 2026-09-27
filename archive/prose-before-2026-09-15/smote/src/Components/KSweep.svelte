<script>
  /*
    The sweep, as small multiples rather than three coloured lines in one box.

    Three scenarios is three categorical levels and the two saturated colours on
    this page already mean "real" and "synthetic". Repainting them to mean
    "one kind" and "two kinds" for one figure would cost more than it buys.
    Three panels on a shared y axis compare just as well and need no legend.

    The spread curve is a different quantity in different units and gets its own
    panel with its own labelled axis. It is never drawn on the same axes as the
    contamination rate, however tempting the shared x is.
  */
  import { scaleLinear } from "d3-scale";
  import { SCEN, HOOK, VAR_IDENTITY, K_DEFAULT, pct, num } from "../experiments.js";
  import { INK, GREEN, ACCENT, LABEL, TICK, AXIS } from "../palette.js";

  let hoverK = null;

  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  $: narrow = BW < 620;
  $: cols = narrow ? 1 : 3;
  // Splitting a row exactly in half (or thirds) is a knife-edge: asking for one
  // pixel more than the row has makes flex-wrap drop a whole panel below, and
  // every layout check stays green while it does.
  $: panelW = cols === 1 ? BW : Math.floor((BW - 2 * 14 - 2) / 3);

  const KS = HOOK.sweep.map((r) => r.k);
  const K_MAX = Math.max(...KS);
  const Y_MAX = 0.5;

  $: mS = { top: 22, right: 8, bottom: 38, left: cols === 1 ? 40 : 34 };
  $: pw = Math.max(90, panelW - mS.left - mS.right);
  $: ph = cols === 1 ? 150 : 128;
  $: hS = ph + mS.top + mS.bottom;
  $: xS = scaleLinear().domain([1, K_MAX]).range([mS.left, mS.left + pw]);
  $: yS = scaleLinear().domain([0, Y_MAX]).range([mS.top + ph, mS.top]);
  // Reactive: these read xS and yS, which move with the measured width.
  $: pathS = (rows) => rows.map((r, i) => (i ? "L" : "M") + " " + xS(r.k) + " " + yS(r.contaminated)).join(" ");
  $: atK = (s, k) => s.sweep.find((r) => r.k === k);

  /* the spread panel */
  $: mV = { top: 14, right: 12, bottom: 38, left: 44 };
  $: vw = Math.max(120, BW - mV.left - mV.right);
  $: vh = 150;
  $: hV = vh + mV.top + mV.bottom;
  $: xV = scaleLinear().domain([1, K_MAX]).range([mV.left, mV.left + vw]);
  $: yV = scaleLinear().domain([0.6, 1.08]).range([mV.top + vh, mV.top]);
  $: pathV = HOOK.sweep.map((r, i) => (i ? "L" : "M") + " " + xV(r.k) + " " + yV(r.spreadRatio)).join(" ");

  function track(ev, w, m, scale) {
    const rect = ev.currentTarget.getBoundingClientRect();
    const s = rect.width / w;
    const px = (ev.clientX - rect.left) / s;
    const k = Math.round(scale.invert(px));
    hoverK = k >= 1 && k <= K_MAX ? k : null;
  }

  // Built here: an {#if} in the template would glue the figure to the next word.
  $: hoverLine =
    hoverK === null
      ? "Hover the panels to read every scenario at the same k."
      : "At k = " + hoverK + ": " + SCEN.map((s) => s.short + " " + pct(atK(s, hoverK).contaminated, 1)).join(" · ");
</script>

<h1 class="body-header">How much of it lands in the wrong place</h1>

<p class="body-text">
  The whole sweep, then. For every <span class="mono">k</span> from 1 to
  {K_MAX} — one is degenerate, {K_MAX} is every other point — twenty thousand
  synthetic rows, and the share of them that landed where legitimate
  transactions are denser. The dot marks the default.
</p>

<div class="wrap">
  <div class="card">
    <!-- Measured INSIDE the card. As a sibling of it in a flex row this
         reported the flex item's own width, every panel came out laid out for
         the wrong box, and the three-across row silently became a column. -->
    <div class="measure" bind:clientWidth={boxWidth} />
    <div class="grid-row" style="--cols:{cols}">
      {#each SCEN as s}
        <div class="cell">
          <svg
            viewBox="0 0 {panelW} {hS}"
            width={panelW}
            height={hS}
            on:pointermove={(e) => track(e, panelW, mS, xS)}
            on:pointerleave={() => (hoverK = null)}
          >
            <text class="p-title" x={mS.left} y={12}>{s.name}</text>
            {#each [0, 0.25, 0.5] as t}
              <line class="grid" x1={mS.left} x2={mS.left + pw} y1={yS(t)} y2={yS(t)} />
              <text class="tick" x={mS.left - 5} y={yS(t) + 3.5} text-anchor="end">{pct(t)}</text>
            {/each}
            {#each [1, 5, 10, 15, 20] as t}
              <text class="tick" x={xS(t)} y={mS.top + ph + 15} text-anchor="middle">{t}</text>
            {/each}
            {#if hoverK !== null}
              <line class="hair" x1={xS(hoverK)} x2={xS(hoverK)} y1={mS.top} y2={mS.top + ph} />
              <circle cx={xS(hoverK)} cy={yS(atK(s, hoverK).contaminated)} r="3.4" fill={ACCENT} />
            {/if}
            <path class="ln" d={pathS(s.sweep)} stroke={INK} />
            <circle cx={xS(K_DEFAULT)} cy={yS(atK(s, K_DEFAULT).contaminated)} r="4" fill={INK} />
            <text class="val" x={xS(K_DEFAULT) + 8} y={yS(atK(s, K_DEFAULT).contaminated) - 9}>
              {pct(atK(s, K_DEFAULT).contaminated, 1)}
            </text>
            <text class="axis-title" x={mS.left + pw / 2} y={hS - 5} text-anchor="middle">neighbours, k</text>
          </svg>
        </div>
      {/each}
    </div>
    <div class="hoverline">{hoverLine}</div>
  </div>
</div>

<p class="body-text">
  Two readings of the same picture. The first is that the default is not a safe
  default — it is a bet that every kind of fraud you have labelled shows up at
  least {K_DEFAULT} times, and on the left-hand panel that bet wins at every
  <span class="mono">k</span> while on the right it has already lost at
  <span class="mono">k = {K_DEFAULT}</span>. The second is that nothing in the
  method can tell you which panel you are on. The rate on the y axis is
  computable here only because the data is invented.
</p>

<p class="body-text">
  And the spread, for the same sweep. This is the exact ratio of the synthetic
  cloud's total variance to the real one's — computed in closed form from the
  points and the neighbour table rather than estimated from a sample, so the
  wobble is the effect and not the noise.
</p>

<div class="wrap">
  <div class="card">
    <!-- The panel title is HTML rather than an <svg><text>, because an svg text
         node does not wrap and this one is longer than a phone. -->
    <div class="panel-title">spread of the synthetic rows, relative to the real ones</div>
    <svg viewBox="0 0 {BW} {hV}" width={BW} height={hV}>
      {#each [0.65, 0.8, 1.0] as t}
        <line class="grid" x1={mV.left} x2={mV.left + vw} y1={yV(t)} y2={yV(t)} />
        <text class="tick" x={mV.left - 5} y={yV(t) + 3.5} text-anchor="end">{num(t, 2)}</text>
      {/each}
      <line class="same" x1={mV.left} x2={mV.left + vw} y1={yV(1)} y2={yV(1)} />
      <line class="ident" x1={mV.left} x2={mV.left + vw} y1={yV(VAR_IDENTITY)} y2={yV(VAR_IDENTITY)} stroke={GREEN} />
      <!-- Anchored at the LEFT end: the curve arrives at exactly this value on
           the right, so a label there sits on top of the line it is labelling. -->
      <text class="ident-label" x={mV.left + 3} y={yV(VAR_IDENTITY) - 6} fill={GREEN}>
        2/3 − 1/(3(n−1)) = {num(VAR_IDENTITY, 3)}
      </text>
      <path class="ln" d={pathV} stroke={INK} />
      <circle cx={xV(K_DEFAULT)} cy={yV(HOOK.sweep.find((r) => r.k === K_DEFAULT).spreadRatio)} r="4" fill={INK} />
      <text class="val" x={xV(K_DEFAULT) + 8} y={yV(HOOK.sweep.find((r) => r.k === K_DEFAULT).spreadRatio) - 8}>
        {num(HOOK.sweep.find((r) => r.k === K_DEFAULT).spreadRatio, 2)} at k = {K_DEFAULT}
      </text>
      {#each [1, 5, 10, 15, 20] as t}
        <text class="tick" x={xV(t)} y={mV.top + vh + 15} text-anchor="middle">{t}</text>
      {/each}
      <text class="axis-title" x={mV.left + vw / 2} y={hV - 5} text-anchor="middle">neighbours, k</text>
    </svg>
  </div>
</div>

<style>
  .measure { width: 100%; height: 0; }

  .wrap {
    display: flex;
    justify-content: center;
    margin: 1.4rem auto;
    padding: 0 0.75rem;
  }

  .card {
    width: 100%;
    max-width: 680px;
    background: #ffffff;
    border-radius: 10px;
    padding: 0.85rem 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .grid-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    justify-content: flex-start;
  }

  .cell { flex: 0 0 auto; }

  svg { max-width: 100%; display: block; }

  .grid { stroke: #eef1f5; }
  .same { stroke: #cbd5e0; stroke-width: 1; }
  .ident { stroke-width: 1.4; stroke-dasharray: 5 4; }
  .hair { stroke: #cbd5e0; stroke-width: 1; }
  .ln { fill: none; stroke-width: 2; stroke-linejoin: round; }

  .p-title { font-family: var(--font-main); font-size: 10.5px; font-weight: 700; fill: #4a5568; }
  .tick { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }
  /* A halo, so a value label stays readable where it crosses its own line. */
  .val {
    font-family: var(--font-main);
    font-size: 10px;
    font-weight: 700;
    fill: var(--squidink);
    stroke: #ffffff;
    stroke-width: 3px;
    paint-order: stroke;
  }
  .ident-label {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    stroke: #ffffff;
    stroke-width: 3px;
    paint-order: stroke;
  }
  .axis-title { font-family: var(--font-mono, monospace); font-size: 10px; fill: #718096; }

  .panel-title {
    font-family: var(--font-main);
    font-size: 0.78rem;
    font-weight: 700;
    color: #4a5568;
    margin: 0 0 0.2rem 0;
    line-height: 1.35;
  }

  .hoverline {
    margin-top: 0.4rem;
    font-family: var(--font-main);
    font-size: 0.73rem;
    color: #718096;
    min-height: 1rem;
  }

  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
</style>
