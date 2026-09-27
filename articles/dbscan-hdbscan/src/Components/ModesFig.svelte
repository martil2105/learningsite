<script>
  /*
    The hard limit both methods share, and the size of the gap between the
    theory and the practice.

    An equal mixture of two isotropic Gaussians is unimodal exactly when the
    centres are closer than 2 sigma - p''(0) < 0 at the midpoint iff mu < sigma
    - so below that there is one mode and no density method can find two
    clusters, at any parameter, ever. Above it there are two, and they are
    still not findable for a long way, which is the part worth drawing.

    Left: the cloud, with the mixture density along the axis joining the centres
    underneath it, sharing the same x. Right: what the best possible split
    scores against what the best density clustering over every (eps, minPts)
    manages.
  */
  import { twoModes, twoModeProfile, PRE, num } from "../experiments.js";
  import { fitEqual } from "../plot.js";
  import { INK, NOISE, ACCENT, GOOD, BAD, hue } from "../palette.js";

  export let sep = 3.0;
  const SD = PRE.config.MODE_SD;
  const N = PRE.config.MODE_N;
  const CX = 150;
  const CY = 110;

  $: data = twoModes(sep, N, SD, 77);
  $: prof = twoModeProfile(sep, SD, 160);
  $: bimodal = sep > 2;

  /* --------------------------------------------------------------- panel A */
  let aWidth = 320;
  $: AW = Math.max(240, aWidth);
  $: PROF_H = 54;
  $: AH = 236;
  $: aMargin = { top: 8, right: 10, bottom: PROF_H + 26, left: 10 };
  $: span = Math.max(4 * SD, 2.2 * prof.half + 3 * SD);
  $: aExt = { x0: CX - span, x1: CX + span, y0: CY - 3.4 * SD, y1: CY + 3.4 * SD };
  $: aPlot = fitEqual(aExt, AW, AH, aMargin);
  $: profTop = AH - PROF_H - 22;
  $: profY = (v) => profTop + PROF_H - v * (PROF_H - 4);
  $: profPath =
    "M " + aPlot.X(CX + prof.xs[0]).toFixed(2) + " " + profY(0).toFixed(2) + " " +
    prof.xs.map((x, i) => "L " + aPlot.X(CX + x).toFixed(2) + " " + profY(prof.ys[i]).toFixed(2)).join(" ") +
    " L " + aPlot.X(CX + prof.xs[prof.xs.length - 1]).toFixed(2) + " " + profY(0).toFixed(2) + " Z";
  $: modeWord = bimodal ? "two modes" : "one mode";

  /* --------------------------------------------------------------- panel B */
  const M = PRE.modes;
  let bWidth = 320;
  $: BW = Math.max(240, bWidth);
  $: BH = 236;
  $: bMargin = { top: 12, right: 12, bottom: 30, left: 34 };
  $: bPlotW = Math.max(100, BW - bMargin.left - bMargin.right);
  $: bPlotH = BH - bMargin.top - bMargin.bottom;
  $: sepLo = M[0].sep;
  $: sepHi = M[M.length - 1].sep;
  $: bx = (s) => bMargin.left + ((s - sepLo) / (sepHi - sepLo)) * bPlotW;
  $: by = (v) => bMargin.top + bPlotH - v * bPlotH;
  $: pathOf = (key) => M.map((r, i) => (i ? "L " : "M ") + bx(r.sep).toFixed(2) + " " + by(r[key]).toFixed(2)).join(" ");
  $: here = M.reduce((a, b) => (Math.abs(b.sep - sep) < Math.abs(a.sep - sep) ? b : a));
  $: bTicksX = [1, 2, 3, 4, 5, 6, 7].filter((t) => t >= sepLo && t <= sepHi);
  $: bTicksY = [0, 0.25, 0.5, 0.75, 1];
</script>

<div class="panes">
  <div class="pane">
    <div class="measure" bind:clientWidth={aWidth} />
    <div class="ptitle">{num(sep, 1)}σ apart — the density has {modeWord}</div>
    <svg viewBox="0 0 {AW} {AH}" width={AW} height={AH} aria-hidden="true">
      {#each data.pts as p, i}
        <circle class="pt" cx={aPlot.X(p[0])} cy={aPlot.Y(p[1])} r="1.5" fill={INK} />
      {/each}
      <line class="mid" x1={aPlot.X(CX)} x2={aPlot.X(CX)} y1={aPlot.box.y} y2={aPlot.box.y + aPlot.box.h} />
      <path class="prof" d={profPath} />
      <line class="profbase" x1={aPlot.X(CX - span)} x2={aPlot.X(CX + span)} y1={profY(0)} y2={profY(0)} />
      <line class="midprof" x1={aPlot.X(CX)} x2={aPlot.X(CX)} y1={profY(0)} y2={profY(prof.centre)} />
      <circle class="dip" cx={aPlot.X(CX)} cy={profY(prof.centre)} r="3" />
      <text class="clab" x={aPlot.X(CX)} y={AH - 6} text-anchor="middle">density along the axis joining them</text>
    </svg>
  </div>

  <div class="pane">
    <div class="measure" bind:clientWidth={bWidth} />
    <div class="ptitle">The best possible, and the best achievable</div>
    <svg viewBox="0 0 {BW} {BH}" width={BW} height={BH} aria-hidden="true">
      {#each bTicksY as t}
        <line class="grid" x1={bMargin.left} x2={bMargin.left + bPlotW} y1={by(t)} y2={by(t)} />
        <text class="tick" x={bMargin.left - 5} y={by(t) + 3.2} text-anchor="end">{t}</text>
      {/each}
      <line class="two" x1={bx(2)} x2={bx(2)} y1={bMargin.top} y2={bMargin.top + bPlotH} />
      <path class="ln bayes" d={pathOf("bayes")} />
      <path class="ln best" d={pathOf("best")} />
      <line class="cursor" x1={bx(here.sep)} x2={bx(here.sep)} y1={bMargin.top} y2={bMargin.top + bPlotH} />
      <circle class="cd bayes" cx={bx(here.sep)} cy={by(here.bayes)} r="3.4" />
      <circle class="cd best" cx={bx(here.sep)} cy={by(here.best)} r="3.4" />
      {#each bTicksX as t}
        <text class="tick" x={bx(t)} y={BH - 15} text-anchor="middle">{t}</text>
      {/each}
      <text class="axis-title" x={bMargin.left + bPlotW / 2} y={BH - 3} text-anchor="middle">separation, in σ</text>
      <text class="axis-title" transform="translate(9 {bMargin.top + bPlotH / 2}) rotate(-90)" text-anchor="middle">
        adjusted Rand
      </text>
    </svg>
  </div>
</div>

<style>
  .panes { display: flex; gap: 14px; align-items: flex-start; }
  .pane { flex: 1 1 0; min-width: 0; }
  .measure { width: 100%; height: 0; }
  .ptitle { font-family: var(--font-main); font-size: 0.78rem; font-weight: 700; color: var(--squidink); margin-bottom: 0.2rem; }
  svg { display: block; max-width: 100%; }

  .pt { opacity: 0.55; }
  .mid { stroke: #cbd5e0; stroke-width: 1; stroke-dasharray: 3 3; }
  .prof { fill: rgba(32, 116, 213, 0.18); stroke: #2074d5; stroke-width: 1.5; }
  .profbase { stroke: #b6bfcc; stroke-width: 1; }
  .midprof { stroke: #7c5aed; stroke-width: 1.2; stroke-dasharray: 2 2; }
  .dip { fill: #7c5aed; stroke: #fff; stroke-width: 1.2; }
  .clab { font-family: var(--font-main); font-size: 9.5px; fill: #9aa5b1; }

  .grid { stroke: #eef1f5; }
  .two { stroke: #df2a5d; stroke-width: 1.3; stroke-dasharray: 5 3; }
  .ln { fill: none; stroke-width: 2; }
  .ln.bayes { stroke: #8a94a2; }
  .ln.best { stroke: #2074d5; }
  .cd { stroke: #fff; stroke-width: 1.3; }
  .cd.bayes { fill: #8a94a2; }
  .cd.best { fill: #2074d5; }
  .cursor { stroke: #7c5aed; stroke-width: 1.4; }
  .tick { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }
  .axis-title { font-family: var(--font-main); font-size: 10px; font-weight: 600; fill: var(--squidink); }

  @media screen and (max-width: 950px) {
    .panes { flex-direction: column; }
    .pane { width: 100%; }
  }
</style>
