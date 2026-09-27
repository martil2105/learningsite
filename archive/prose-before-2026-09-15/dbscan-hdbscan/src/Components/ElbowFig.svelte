<script>
  /*
    The k-distance curve, with the window drawn on the same axis.

    Both quantities the section argues about are distances, so both live on the
    y-axis: the elbow is a horizontal line and the range of eps that works is a
    horizontal band. Whether the recipe lands is then something you look at
    rather than something you are told.
  */
  import { scene, strayScene, DATA, kdistCurve, num, int } from "../experiments.js";
  import { INK, ACCENT, GOOD, BAD, TICK, NOISE, HANDLE } from "../palette.js";

  export let id = "platforms";
  export let mPts = 8;
  export let stray = false;

  $: S = stray ? strayScene(id, mPts) : scene(id, mPts);
  $: curve = kdistCurve(S.core);
  $: kn = S.knee;
  $: win = S.win;

  let boxWidth = 320;
  $: BW = Math.max(260, boxWidth);
  $: margin = { top: 10, right: 12, bottom: 30, left: BW < 420 ? 38 : 44 };
  $: H = 260;
  $: plotW = Math.max(120, BW - margin.left - margin.right);
  $: plotH = H - margin.top - margin.bottom;
  $: yMax = Math.max(20, Math.ceil(Math.max(curve[curve.length - 1], win.hi || 0) / 10) * 10);
  $: X = (i) => margin.left + (i / (curve.length - 1)) * plotW;
  $: Y = (v) => margin.top + plotH - (Math.min(v, yMax) / yMax) * plotH;
  $: linePath = curve.map((v, i) => (i ? "L " : "M ") + X(i).toFixed(2) + " " + Y(v).toFixed(2)).join(" ");
  $: chord = "M " + X(0).toFixed(2) + " " + Y(curve[0]).toFixed(2) +
             " L " + X(curve.length - 1).toFixed(2) + " " + Y(curve[curve.length - 1]).toFixed(2);
  /* A round step, so the axis reads 0 10 20 30 rather than 0 9 18 26. */
  $: yTicks = Array.from({ length: yMax / 10 + 1 }, (_, i) => i * 10);
  $: inside = win.lo !== null && kn.eps >= win.lo && kn.eps <= win.hi;
  $: bandTop = win.hi === null ? 0 : Y(win.hi);
  $: bandH = win.lo === null ? 0 : Math.max(1, Y(win.lo) - Y(win.hi));
  // Sentences built in the script: an {#if} strips its body's leading space.
  $: elbowLabel = "elbow: eps = " + num(kn.eps, 2) + " m";
  $: windowLabel =
    win.lo === null
      ? "no eps recovers every stop"
      : "eps " + num(win.lo, 1) + "–" + num(win.hi, 1) + " m recovers every stop";
  $: verdictLabel = win.lo === null ? "nothing to hit" : inside ? "the elbow lands inside" : "the elbow misses";
</script>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth} />
  <svg viewBox="0 0 {BW} {H}" width={BW} height={H} aria-hidden="true">
    {#each yTicks as t}
      <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={Y(t)} y2={Y(t)} />
      <text class="tick" x={margin.left - 6} y={Y(t) + 3.2} text-anchor="end">{t}</text>
    {/each}

    {#if win.lo !== null}
      <rect class="band" x={margin.left} y={bandTop} width={plotW} height={bandH} />
    {/if}

    <path class="chord" d={chord} />
    <path class="curve" d={linePath} />

    <line class="elbow" x1={margin.left} x2={margin.left + plotW} y1={Y(kn.eps)} y2={Y(kn.eps)} />
    <circle class="elbowdot" cx={X(kn.index)} cy={Y(kn.eps)} r="4" />
    <text class="elbowlab" x={margin.left + 6} y={Y(kn.eps) - 6}>{elbowLabel}</text>

    <text class="axis-title" x={margin.left + plotW / 2} y={H - 3} text-anchor="middle">pings, sorted</text>
    <text class="axis-title" transform="translate(11 {margin.top + plotH / 2}) rotate(-90)" text-anchor="middle">
      distance to the {mPts}th nearest, m
    </text>
  </svg>
  <div class="cap">
    <span class="key"><i class="ln curve" />the sorted curve</span>
    <span class="key"><i class="ln chord" />the chord it is measured against</span>
    <span class="key"><i class="ln elbow" />the elbow</span>
    <span class="key"><i class="sw" />{windowLabel}</span>
    <span class="verdict" class:good={inside} class:bad={!inside}>{verdictLabel}</span>
  </div>
</div>

<style>
  .measure { width: 100%; height: 0; }
  .fig { width: 100%; }
  svg { display: block; max-width: 100%; }

  .grid { stroke: #eef1f5; }
  .band { fill: rgba(47, 125, 50, 0.17); }
  .curve { fill: none; stroke: #232f3e; stroke-width: 1.8; }
  .chord { fill: none; stroke: #9aa5b1; stroke-width: 1.2; stroke-dasharray: 4 4; }
  .elbow { stroke: #7c5aed; stroke-width: 1.6; stroke-dasharray: 6 3; }
  .elbowdot { fill: #7c5aed; stroke: #fff; stroke-width: 1.4; }
  .elbowlab {
    font-family: var(--font-main); font-size: 10.5px; font-weight: 700; fill: #7c5aed;
    stroke: #fff; stroke-width: 3px; paint-order: stroke;
  }

  .tick { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }
  .axis-title { font-family: var(--font-main); font-size: 10.5px; font-weight: 600; fill: var(--squidink); }

  .cap {
    display: flex; flex-wrap: wrap; gap: 0.35rem 0.85rem; align-items: center;
    margin-top: 0.4rem; font-family: var(--font-main); font-size: 0.71rem; color: #4a5568;
  }
  .key { display: inline-flex; align-items: center; gap: 0.3rem; }
  .ln { width: 15px; height: 0; display: inline-block; border-top: 2px solid; }
  .ln.curve { border-color: #232f3e; }
  .ln.chord { border-top-style: dashed; border-color: #9aa5b1; }
  .ln.elbow { border-top-style: dashed; border-color: #7c5aed; }
  .sw { width: 13px; height: 9px; display: inline-block; background: rgba(47, 125, 50, 0.3); }
  .verdict { margin-left: auto; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; }
  .verdict.good { color: #2f7d32; background: rgba(47, 125, 50, 0.12); }
  .verdict.bad { color: #df2a5d; background: rgba(223, 42, 93, 0.1); }
</style>
