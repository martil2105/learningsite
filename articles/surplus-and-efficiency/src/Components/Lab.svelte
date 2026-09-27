<script>
  /*
    The one manipulable object. Nothing here is about a subject — it exists so the
    stack is exercised end to end by something the checks can fail on: a measured
    width that scales, a viewBox, pointer input converted back to user units,
    KaTeX, keyboard access, and a geometric relation (the handle is ON the line)
    that verify/check-browser.mjs asserts in rendered pixels.

    Delete this file when you write the real hook, and keep the six comments.
  */
  import katexify from "../katexify.js";
  import { linear, ticks, clampW } from "../chart.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";

  const H = 260;
  const M = { top: 16, right: 20, bottom: 34, left: 46 };
  const X_AT = 3; // where on the x axis the handle sits
  const A_MIN = 0.2;
  const A_MAX = 1.8;

  // bind:clientWidth on a padded box includes the padding, and a box that has
  // not been laid out yet reports 0 — a scale whose range is then
  // [46, 0 - 20] runs backwards. So: measure a zero-height full-width child,
  // and clamp once into the value every scale and layout uses.
  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let a = $state(1.4);
  let dragging = $state(false);
  let svgEl;

  let x = $derived(linear(0, 4, M.left, W - M.right));
  let y = $derived(linear(0, 6, H - M.bottom, M.top));

  // A plain function that reads reactive state. Under Svelte 3 this was the
  // worst bug in the project — a const or function helper reading a `$:`
  // variable is invisible to dirty tracking, so attributes naming a reactive
  // variable directly updated and these did not: half a chart at the initial
  // width, half at the measured one, and no error. Runes track the read.
  function at(v) {
    return { cx: x(v), cy: y(a * v) };
  }

  let origin = $derived(at(0));
  let end = $derived(at(4));
  let handle = $derived(at(X_AT));
  let eq = $derived(katexify(`y = ${a.toFixed(2)}\\,x`, false));

  // Build any sentence containing a figure in the script block: `{n}{#if n} x{/if}`
  // renders "255x" because {#if} strips the leading whitespace of its body.
  let readout = $derived(
    `Slope a = ${a.toFixed(2)}, so at x = ${X_AT} the line is at y = ${(a * X_AT).toFixed(2)}`
  );

  let xTicks = $derived(ticks(0, 4, 4));
  let yTicks = $derived(ticks(0, 6, 4));

  function setFromEvent(e) {
    const r = svgEl.getBoundingClientRect();
    // The viewBox may be scaling the drawing, so client pixels are not user
    // units. Convert before inverting the scale.
    const s = r.width / W;
    const uy = (e.clientY - r.top) / s;
    const next = y.invert(uy) / X_AT;
    a = Math.min(A_MAX, Math.max(A_MIN, next));
  }

  function down(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging = true;
    setFromEvent(e);
  }
  function move(e) {
    if (dragging) setFromEvent(e);
  }
  function up() {
    dragging = false;
  }
  function key(e) {
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === "ArrowUp") {
      a = Math.min(A_MAX, a + step);
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      a = Math.max(A_MIN, a - step);
      e.preventDefault();
    }
  }
</script>

<section class="body-text">
  <h3 class="body-header">One thing to drag</h3>
  <p>
    Drag the handle, or focus the panel and use the arrow keys. The readout is
    computed from the same scale the line is drawn from, which is the only reason
    a check can tell whether the two agree.
  </p>
</section>

<div class="fig">
  <!-- The measuring div is the FIRST child of the box being sized. As a flex
       sibling of a card it reports its own negotiated width instead, every panel
       is laid out for the wrong box, and the symptom appears nowhere near the
       cause. -->
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <!-- Titles go in HTML above the SVG. An <svg><text> does not wrap, so a title
       longer than a phone is clipped with no error and no overflow. -->
  <p class="fig-title">{readout}</p>

  <!-- Every listener goes on this wrapping div, never on the <svg>: pointer
       handlers on the svg itself earn a11y_no_static_element_interactions, and
       the wrapper is where the role and the tabindex belong anyway. The svg is
       still bound, because the coordinate maths needs its rect.

       role="application" is correct here and Svelte's checker flags it twice
       regardless — the role is not in its interactive-role list — so both
       warnings are silenced deliberately rather than by removing the role. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="plot"
    role="application"
    tabindex="0"
    aria-label="Drag to change the slope, or use the up and down arrow keys"
    onkeydown={key}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
  >
    <svg bind:this={svgEl} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each xTicks as t}
          <line x1={x(t)} y1={H - M.bottom} x2={x(t)} y2={M.top} class="grid" />
          <text x={x(t)} y={H - M.bottom + 16} text-anchor="middle">{t}</text>
        {/each}
        {#each yTicks as t}
          <text x={M.left - 8} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        <line x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} class="rule" />
        <line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} class="rule" />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 2} text-anchor="middle">
          x
        </text>
      </g>

      <line
        class="model"
        x1={origin.cx}
        y1={origin.cy}
        x2={end.cx}
        y2={end.cy}
        stroke={SERIES[0]}
      />
      <circle
        class="handle"
        cx={handle.cx}
        cy={handle.cy}
        r={dragging ? 11 : 9}
        fill={SERIES[1]}
      />
    </svg>
  </div>

  <p class="eq">{@html eq}</p>
</div>

<style>
  .fig {
    max-width: 680px;
    margin: 1.5rem auto;
    padding: 0 1rem;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    margin: 0 0 0.4rem 0;
    color: var(--squidink);
  }

  .plot {
    outline-offset: 3px;
    touch-action: none;
  }

  .plot:focus-visible {
    outline: 2px solid var(--violet);
  }

  .plot svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .model {
    stroke-width: 2.5;
  }

  .handle {
    cursor: grab;
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: #8a94a2;
  }

  .grid {
    stroke: #e3e7ea;
    stroke-width: 1;
  }

  .rule {
    stroke: #8a94a2;
    stroke-width: 1;
  }

  .eq {
    text-align: center;
    margin: 0.8rem 0 0 0;
  }
</style>
