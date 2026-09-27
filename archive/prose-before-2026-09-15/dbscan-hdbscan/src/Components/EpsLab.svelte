<script>
  /*
    The hook. One control that matters: eps.

    Under the map is the entire sweep - every distinct clustering the knob can
    produce, drawn as a staircase of cluster counts against eps, with the range
    that recovers every stop shaded. That strip is the article. On the first
    dataset it has a band in it; on the second it has none, at any minPts, and
    the reader can go and check by moving both controls.

    The sweep is enumerated exactly rather than sampled: between two
    consecutive breakpoints the answer cannot change, so what is drawn is every
    answer that exists, not a picture of a grid search.
  */
  import MapPanel from "./MapPanel.svelte";
  import { DATA, scene, verdict, M_DEFAULT, plural, m, int } from "../experiments.js";
  import { INK, ACCENT, GOOD, NOISE, LABEL, FAINT, hue } from "../palette.js";

  const M_OPTIONS = [4, 8, 12, 20];
  const EPS_LO = 1;
  const EPS_HI = 40;
  const START = { platforms: 9.0, "cafe-bakery-park": 5.0, "whole-day": 14.0 };

  let id = "platforms";
  let mPts = M_DEFAULT;
  let eps = START[id];
  let touched = false;

  function pick(nextId) {
    id = nextId;
    eps = START[nextId];
    touched = true;
  }
  function reset() {
    id = "platforms";
    mPts = M_DEFAULT;
    eps = START.platforms;
    touched = false;
  }

  $: S = scene(id, mPts);
  $: shot = S.at(eps);
  $: vd = verdict(S.sc, shot.rec, shot.nClusters);
  $: maxK = Math.max(3, ...S.sweep.filter((r) => r.lo <= EPS_HI).map((r) => r.nClusters));

  /* ------------------------------------------------------------- the strip */
  let stripWidth = 320;
  $: SW = Math.max(260, stripWidth);
  $: SH = 96;
  $: sTop = 12;
  $: sBot = SH - 18;
  // No horizontal margin, so the range input below lines up with the drawing.
  $: sx = (e) => ((e - EPS_LO) / (EPS_HI - EPS_LO)) * SW;
  $: sy = (k) => sBot - (k / maxK) * (sBot - sTop);
  /* Contiguous runs merged into one rectangle each. Fifty-three abutting rects
     render as fifty-three rects with hairline seams between them, which reads
     as a striped region rather than a band. */
  $: bands = (() => {
    const out = [];
    for (const r of S.sweep) {
      if (r.found !== S.sc.nStops || r.lo >= EPS_HI) continue;
      const last = out[out.length - 1];
      if (last && Math.abs(last.hi - r.lo) < 1e-9) last.hi = r.hi;
      else out.push({ lo: r.lo, hi: r.hi });
    }
    return out;
  })();
  $: steps = S.sweep.filter((r) => r.lo < EPS_HI && r.hi > EPS_LO);
  /* One continuous staircase - treads and risers - rather than a scatter of
     disconnected horizontal dashes. */
  $: stepPath = steps
    .map((r, i) => (i ? "L " : "M ") + sx(Math.max(r.lo, EPS_LO)).toFixed(2) + " " + sy(r.nClusters).toFixed(2) +
                   " L " + sx(Math.min(r.hi, EPS_HI)).toFixed(2) + " " + sy(r.nClusters).toFixed(2))
    .join(" ");
  $: bandLabel =
    bands.length === 0
      ? "no value of eps finds every stop"
      : "eps " + bands[0].lo.toFixed(1) + "–" + Math.min(bands[bands.length - 1].hi, EPS_HI).toFixed(1) +
        " m finds every stop";
  $: epsLine = "eps = " + eps.toFixed(1) + " m";
  $: countLine = plural(S.sweep.length, "distinct clustering", "distinct clusterings") + " in this sweep";

  const EPS_TICKS = [1, 5, 10, 15, 20, 25, 30, 35, 40];

  function fromPointer(ev, node) {
    const rect = node.getBoundingClientRect();
    const s = rect.width / SW;               // the viewBox may be scaling
    const e = EPS_LO + ((ev.clientX - rect.left) / s / SW) * (EPS_HI - EPS_LO);
    return Math.min(EPS_HI, Math.max(EPS_LO, Math.round(e * 10) / 10));
  }
  let stripNode;
  let dragging = false;
  function down(ev) {
    dragging = true;
    touched = true;
    eps = fromPointer(ev, stripNode);
    stripNode.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  }
  function move(ev) {
    if (!dragging) return;
    eps = fromPointer(ev, stripNode);
  }
  function up(ev) {
    if (!dragging) return;
    dragging = false;
    if (stripNode.hasPointerCapture(ev.pointerId)) stripNode.releasePointerCapture(ev.pointerId);
  }
</script>

<section class="lab">
  <div class="card">
    <div class="measure" bind:clientWidth={stripWidth} />

    <div class="head">
      <span class="title">One phone, one day, every position it logged</span>
      <div class="pills" role="group" aria-label="which day">
        {#each DATA as d}
          <button class="pill" class:on={id === d.id} on:click={() => pick(d.id)} aria-pressed={id === d.id}>{d.name}</button>
        {/each}
      </div>
    </div>

    <p class="blurb">{S.sc.blurb}</p>

    <div class="legend">
      <span class="key"><i class="dot ink" />in a cluster</span>
      <span class="key"><i class="dot noise" />noise</span>
      <span class="key"><i class="swatch" />a cluster: everywhere within {eps.toFixed(1)} m of a core ping</span>
    </div>

    <MapPanel pts={S.sc.pts} labels={shot.labels} core={S.core} {eps} maxHeight={340} />

    <!-- The whole sweep, so the reader can see the landscape the slider moves
         through rather than only the point they are standing on. -->
    <div class="striphead">
      <span class="sublabel">clusters found, at every eps</span>
      <span class="sublabel dim">{countLine}</span>
    </div>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
      class="stage"
      role="application"
      tabindex="0"
      aria-label="The whole eps sweep. Left and right arrows change eps; hold shift for larger steps."
      on:keydown={(ev) => {
        const step = ev.shiftKey ? 1 : 0.1;
        if (ev.key === "ArrowLeft") { eps = Math.max(EPS_LO, Math.round((eps - step) * 10) / 10); touched = true; ev.preventDefault(); }
        if (ev.key === "ArrowRight") { eps = Math.min(EPS_HI, Math.round((eps + step) * 10) / 10); touched = true; ev.preventDefault(); }
      }}
    >
      <svg
        bind:this={stripNode}
        class="strip"
        viewBox="0 0 {SW} {SH}"
        width={SW}
        height={SH}
        aria-hidden="true"
        on:pointerdown={down}
        on:pointermove={move}
        on:pointerup={up}
        on:pointercancel={up}
      >
        <rect class="stripbg" x="0" y={sTop} width={SW} height={sBot - sTop} />
        {#each bands as b}
          <rect class="band" x={sx(Math.max(b.lo, EPS_LO))} y={sTop}
                width={Math.max(1.5, sx(Math.min(b.hi, EPS_HI)) - sx(Math.max(b.lo, EPS_LO)))} height={sBot - sTop} />
        {/each}
        <path class="steps" d={stepPath} />
        {#each EPS_TICKS as t}
          <line class="stick" x1={sx(t)} x2={sx(t)} y1={sBot} y2={sBot + 3} />
          <text class="tick" x={sx(t)} y={SH - 5} text-anchor={t === EPS_LO ? "start" : t === EPS_HI ? "end" : "middle"}>{t}</text>
        {/each}
        <line class="cursor" x1={sx(eps)} x2={sx(eps)} y1={sTop - 4} y2={sBot + 2} />
        <circle class="cursordot" cx={sx(eps)} cy={sy(shot.nClusters)} r="3.6" />
        <text class="ymax" x="4" y={sTop + 9}>{maxK}</text>
      </svg>
    </div>

    <div class="controls">
      <label class="slider">
        <span class="clabel">eps</span>
        <input type="range" min={EPS_LO} max={EPS_HI} step="0.1" bind:value={eps} on:input={() => (touched = true)}
               aria-label="eps, the radius in metres" />
        <span class="cvalue">{eps.toFixed(1)} m</span>
      </label>
      <div class="pills small" role="group" aria-label="minPts">
        <span class="clabel">minPts</span>
        {#each M_OPTIONS as opt}
          <button class="pill" class:on={mPts === opt} on:click={() => { mPts = opt; touched = true; }} aria-pressed={mPts === opt}>{opt}</button>
        {/each}
      </div>
    </div>

    <div class="foot">
      <div class="readout" class:good={vd.ok} class:bad={!vd.ok}>{vd.line}</div>
      <div class="sub">
        <span class="mono">{bandLabel}</span>
        <span class="dim">{touched ? "" : "— drag the slider, or the strip above it"}</span>
        <button class="reset" on:click={reset}>reset</button>
      </div>
    </div>
  </div>
</section>

<style>
  .measure { width: 100%; height: 0; }

  .lab { display: flex; justify-content: center; margin: 2rem auto 1rem auto; padding: 0 0.75rem; }

  .card {
    width: 100%;
    max-width: 700px;
    background: #ffffff;
    border-radius: 10px;
    padding: 1rem 1.1rem 0.9rem 1.1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
  .title { font-family: var(--font-main); font-size: 0.92rem; font-weight: 700; color: var(--squidink); }

  .blurb { font-family: var(--font-main); font-size: 0.78rem; color: #718096; margin: 0.35rem 0 0 0; }

  .pills { display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; }
  .pills.small { gap: 0.22rem; }

  .pill {
    font-family: var(--font-main);
    font-size: 0.72rem;
    line-height: 1;
    padding: 0.34rem 0.5rem;
    border: 1px solid #dbe1e8;
    background: #fff;
    color: #4a5568;
    border-radius: 5px;
    cursor: pointer;
  }
  .pill:hover { border-color: var(--violet); }
  .pill.on { background: var(--violet); border-color: var(--violet); color: #fff; font-weight: 700; }

  .legend {
    display: flex; flex-wrap: wrap; gap: 0.5rem 0.9rem; margin: 0.55rem 0 0.4rem 0;
    font-family: var(--font-main); font-size: 0.72rem; color: #4a5568;
  }
  .key { display: inline-flex; align-items: center; gap: 0.3rem; }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .dot.ink { background: #232f3e; }
  .dot.noise { background: #8a94a2; }
  .swatch { width: 13px; height: 9px; display: inline-block; background: rgba(32, 116, 213, 0.13); border: 1px solid #2074d5; }

  .striphead { display: flex; justify-content: space-between; align-items: baseline; margin: 0.7rem 0 0.1rem 0; }
  .sublabel { font-family: var(--font-main); font-size: 0.72rem; font-weight: 600; color: #4a5568; }
  .sublabel.dim { font-weight: 400; color: #9aa5b1; }

  .stage { outline: none; }
  .stage:focus-visible { box-shadow: 0 0 0 2px var(--violet); border-radius: 6px; }

  .strip { display: block; max-width: 100%; touch-action: none; cursor: ew-resize; }
  .stripbg { fill: #f7f9fb; }
  .band { fill: rgba(47, 125, 50, 0.18); }
  .steps { fill: none; stroke: #232f3e; stroke-width: 1.5; stroke-linejoin: round; }
  .cursor { stroke: #7c5aed; stroke-width: 1.6; }
  .cursordot { fill: #7c5aed; stroke: #fff; stroke-width: 1.4; }
  .stick { stroke: #cbd5e0; }
  .tick { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }
  .ymax { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }

  .controls { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.55rem; }
  .slider { display: flex; align-items: center; gap: 0.5rem; flex: 1 1 260px; min-width: 220px; }
  .slider input { flex: 1 1 auto; min-width: 0; accent-color: var(--violet); }
  .clabel { font-family: var(--font-mono, monospace); font-size: 0.76rem; color: #718096; }
  .cvalue { font-family: var(--font-mono, monospace); font-size: 0.76rem; color: var(--squidink); font-weight: 700; min-width: 3.6rem; }

  .foot { margin-top: 0.55rem; }
  .readout { font-family: var(--font-main); font-size: 0.84rem; font-weight: 700; min-height: 1.1rem; }
  .readout.bad { color: #df2a5d; }
  .readout.good { color: #2f7d32; }

  .sub {
    display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap;
    margin-top: 0.2rem; font-size: 0.75rem; color: #718096; min-height: 1rem;
  }
  .mono { font-family: var(--font-mono, monospace); }
  .dim { color: #9aa5b1; }

  .reset {
    margin-left: auto; font-family: var(--font-main); font-size: 0.72rem;
    border: none; background: none; color: var(--violet); cursor: pointer; padding: 0; text-decoration: underline;
  }

  @media screen and (max-width: 950px) {
    .card { padding: 0.8rem 0.7rem 0.7rem 0.7rem; }
    .legend { font-size: 0.68rem; gap: 0.4rem 0.7rem; }
    .readout { font-size: 0.8rem; }
    .pill { font-size: 0.68rem; padding: 0.3rem 0.42rem; }
  }
</style>
