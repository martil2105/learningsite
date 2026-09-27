<script>
  /*
    The hook. One manipulable object: the bin count.

    Everything on screen is the same node, the same column and the same gain
    function; the slider changes only which candidate splits you are allowed to
    look at. That is the entire idea of histogram-based split finding, and the
    reason it is worth building as an interaction rather than a diagram is that
    the reader can watch the candidate set collapse by two orders of magnitude
    while the answer barely moves - and then keep going, to where it does.

    The lower panel is the same x axis showing where the bin edges fall. On a
    skewed column the edges bunch up where the rows are, because they are
    quantiles rather than equal widths, and that is why the candidates in the
    upper panel bunch there too.
  */
  import { scaleLinear } from "d3-scale";
  import {
    BIN_SETTINGS, BINNED, EXACT_CURVE, EXACT_BEST, X_RANGE, kept, int, pct,
  } from "../experiments.js";
  import { FEATURES, TRAIN_COLS, N_TRAIN } from "../datasets.js";
  import { EXACT, HIST, ACCENT, SMILE, MUTED, FAINT, INK } from "../palette.js";

  const F = FEATURES[0];
  let idx = BIN_SETTINGS.length - 1; // start at 255, the default
  $: setting = BINNED[idx];
  $: keptFrac = kept(setting);
  // Built in script: an inline version had a conditional clause that assembled
  // itself into the middle of the sentence, and it was pinned at 255 while the
  // slider moved.
  $: caption =
    "At max_bin = " + setting.maxBin + ", the histogram scores " +
    int(setting.candidates.length) + " of the " + int(EXACT_CURVE.length) +
    " possible cuts (" + pct(setting.candidates.length / EXACT_CURVE.length, 1) +
    " of them) and keeps " + pct(keptFrac, 2) + " of the gain. " +
    (keptFrac > 0.99
      ? "Drag the slider down to see where that stops being true."
      : "The exact scan would have cut at " + EXACT_BEST.threshold.toFixed(2) + ".");

  // A coarse occupancy profile of the column, drawn once, so the reader can see
  // where the rows actually are. Fixed 90 slots - this is the picture of the
  // data, not of any particular binning.
  const PROFILE = (() => {
    const slots = 90;
    const lo = X_RANGE[0];
    const hi = EXACT_CURVE[EXACT_CURVE.length - 1].threshold * 1.04;
    const c = new Array(slots).fill(0);
    for (let i = 0; i < N_TRAIN; i++) {
      const s = Math.min(slots - 1, Math.floor(((TRAIN_COLS[0][i] - lo) / (hi - lo)) * slots));
      // rows beyond the drawn range pile into the last slot, which is honest:
      // the profile is a picture of where the rows are, and they are not there
      c[s]++;
    }
    return c;
  })();
  const PROFILE_MAX = Math.max(...PROFILE);

  // ------------------------------------------------------------- layout
  let width = 320;
  /*
    A measured width can arrive as 0 - the binding fires before layout, and a
    sticky panel that is momentarily zero-width reports zero. Every scale built
    from it then has an inverted range, which shows up as a negative <rect>
    width in the console and, in the worst case, as a chart drawn backwards.
    Clamp once, here, and use the clamped value everywhere below.
  */
  $: W = Math.max(260, width);
  $: narrow = W < 520;
  $: GH = narrow ? 190 : 230; // gain panel
  $: BH = narrow ? 76 : 88; // bin panel, with a row for its own axis label
  $: H = GH + BH + 8;
  $: margin = { top: 16, right: narrow ? 10 : 14, bottom: 30, left: narrow ? 44 : 56 };
  $: plotW = Math.max(120, W - margin.left - margin.right);

  /*
    The axis stops at the last usable cut, not at the last row. This column is
    heavily skewed and its top third holds so few rows that min_data_in_leaf
    forbids splitting there at all - every candidate and all but the last bin
    edge live below this. Drawing to the maximum would spend half the chart on
    empty space.
  */
  const X_MAX = EXACT_CURVE[EXACT_CURVE.length - 1].threshold * 1.04;
  $: x = scaleLinear().domain([X_RANGE[0], X_MAX]).range([margin.left, margin.left + plotW]);
  $: yGain = scaleLinear()
    .domain([0, EXACT_BEST.gain * 1.08])
    .range([GH - margin.bottom, margin.top]);

  /*
    Max-preserving downsample. Drawing 5,961 line segments is wasteful and
    drawing every n-th point can miss the peak, which is the one part of this
    curve that must be exactly right. Keeping the highest-gain candidate in each
    pixel column preserves the maximum exactly and everything else visually.

    Reactive, not a plain const: it closes over `x`, which changes with the
    measured W.
  */
  $: curvePath = (() => {
    const cols = Math.max(60, Math.round(plotW));
    const best = new Array(cols).fill(null);
    for (const p of EXACT_CURVE) {
      const c = Math.min(cols - 1, Math.max(0, Math.round(((p.threshold - X_RANGE[0]) / (X_MAX - X_RANGE[0])) * (cols - 1))));
      if (!best[c] || p.gain > best[c].gain) best[c] = p;
    }
    return best
      .filter(Boolean)
      .map((p, i) => (i ? "L" : "M") + " " + x(p.threshold).toFixed(1) + " " + yGain(Math.max(0, p.gain)).toFixed(1))
      .join(" ");
  })();

  $: slotW = plotW / PROFILE.length;
  $: binTop = GH + 8;
  /*
    Square-root heights. This column is skewed enough that on a linear scale the
    modal slice is the only visible bar and the rest of the distribution reads as
    an empty strip - which is the opposite of the point, since the whole panel
    exists to show where the rows are. Labelled on the chart.
  */
  $: yProfile = (c) => binTop + BH - 30 - Math.sqrt(c / PROFILE_MAX) * (BH - 46);
</script>

<div class="lab">
  <div class="measure" bind:clientWidth={width} />

  <div class="lab-head">
    <span class="lab-title">The first split, on {F.name}</span>
    <span class="lab-sub">{int(N_TRAIN)} rows · one node · one column</span>
  </div>

  <svg viewBox="0 0 {W} {H}" width={W} height={H}>
    <!-- gain panel -->
    {#each yGain.ticks(4) as t}
      <line class="grid" x1={margin.left} x2={margin.left + plotW} y1={yGain(t)} y2={yGain(t)} />
      <text class="tick" x={margin.left - 7} y={yGain(t) + 3.5} text-anchor="end">
        {t === 0 ? "0" : (t / 1000).toFixed(0) + "k"}
      </text>
    {/each}
    <text class="axis-title" x={margin.left} y={11}>split gain</text>

    {#each setting.candidates as c}
      <line class="cand-stem" x1={x(c.threshold)} x2={x(c.threshold)} y1={yGain(0)} y2={yGain(Math.max(0, c.gain))} />
    {/each}
    <path class="curve" d={curvePath} stroke={EXACT} />
    {#each setting.candidates as c}
      <circle cx={x(c.threshold)} cy={yGain(Math.max(0, c.gain))} r={setting.nBins > 64 ? 1.9 : 3.2} fill={HIST} />
    {/each}

    <!-- the two winners -->
    <line class="pick exact-pick" x1={x(EXACT_BEST.threshold)} x2={x(EXACT_BEST.threshold)} y1={yGain(0)} y2={margin.top - 2} />
    {#if setting.best}
      <line class="pick hist-pick" x1={x(setting.best.threshold)} x2={x(setting.best.threshold)} y1={yGain(0)} y2={margin.top - 2} />
      <circle cx={x(setting.best.threshold)} cy={yGain(setting.best.gain)} r="5" fill={SMILE} stroke="#fff" stroke-width="1.6" />
    {/if}

    <line class="axis" x1={margin.left} x2={margin.left + plotW} y1={yGain(0)} y2={yGain(0)} />

    <!-- bin panel: where the edges fall, over the shape of the column -->
    <text class="axis-title" x={margin.left} y={binTop + 10}>
      where the rows are (√ scale), and where {setting.nBins} bins put their edges
    </text>
    {#each PROFILE as c, i}
      <rect
        x={margin.left + i * slotW}
        y={yProfile(c)}
        width={Math.max(0.6, slotW - 0.6)}
        height={binTop + BH - 16 - yProfile(c)}
        fill={MUTED}
        opacity="0.35"
      />
    {/each}
    {#each setting.edges as e}
      <line class="edge" x1={x(e)} x2={x(e)} y1={binTop + 14} y2={binTop + BH - 30} />
    {/each}
    <line class="axis" x1={margin.left} x2={margin.left + plotW} y1={binTop + BH - 30} y2={binTop + BH - 30} />
    {#each x.ticks(narrow ? 5 : 8) as t}
      <text class="tick" x={x(t)} y={binTop + BH - 16} text-anchor="middle">{t}</text>
    {/each}
    <text class="axis-title" x={margin.left + plotW / 2} y={binTop + BH - 2} text-anchor="middle">
      {F.name} ({F.unit})
    </text>
  </svg>

  <div class="control">
    <label for="binslider">max_bin</label>
    <input
      id="binslider"
      type="range"
      min="0"
      max={BIN_SETTINGS.length - 1}
      step="1"
      bind:value={idx}
    />
    <span class="binval">{setting.maxBin}</span>
  </div>

  <div class="readout">
    <div class="stat">
      <span class="stat-label">candidates scored</span>
      <span class="stat-value">{int(setting.candidates.length)}</span>
      <span class="stat-note">of {int(EXACT_CURVE.length)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">of the best gain that exists</span>
      <span class="stat-value" class:warn={keptFrac < 0.95}>{pct(keptFrac, 2)}</span>
      <span class="stat-note">{int(setting.best.gain)} vs {int(EXACT_BEST.gain)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">split chosen</span>
      <span class="stat-value">{setting.best.threshold.toFixed(2)}</span>
      <span class="stat-note">exact picks {EXACT_BEST.threshold.toFixed(2)}</span>
    </div>
  </div>

  <div class="legend">
    <span class="lg"><span class="sw line" style="background:{EXACT}" />every cut the exact scan would score</span>
    <span class="lg"><span class="sw" style="background:{HIST}" />the cuts a {setting.nBins}-bin histogram offers</span>
    <span class="lg"><span class="sw" style="background:{SMILE}" />what it picks</span>
  </div>

  <p class="caption">{caption}</p>
</div>

<style>
  .lab {
    max-width: 640px;
    margin: 2rem auto 1rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1rem 1rem 0.9rem 1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .measure {
    width: 100%;
    height: 0;
  }

  svg {
    max-width: 100%;
    display: block;
  }

  .lab-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.35rem;
  }

  .lab-title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--squidink);
  }

  .lab-sub {
    font-family: var(--font-mono, monospace);
    font-size: 0.73rem;
    color: #718096;
  }

  .grid {
    stroke: #eef1f5;
  }

  .axis {
    stroke: #b6bfcc;
  }

  .curve {
    fill: none;
    stroke-width: 1.3;
    opacity: 0.55;
  }

  .cand-stem {
    stroke: #2074d5;
    stroke-width: 1;
    opacity: 0.18;
  }

  .pick {
    stroke-width: 1.4;
    stroke-dasharray: 3 3;
  }

  .exact-pick {
    stroke: #df2a5d;
    opacity: 0.7;
  }

  .hist-pick {
    stroke: #ff9900;
  }

  .edge {
    stroke: var(--violet);
    stroke-width: 1;
    opacity: 0.6;
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    fill: #9aa5b1;
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 10.5px;
    font-weight: 600;
    fill: #718096;
  }

  .control {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin: 0.7rem 0 0.2rem 0;
  }

  .control label {
    font-family: var(--font-mono, monospace);
    font-size: 0.8rem;
    color: #4a5568;
  }

  input[type="range"] {
    flex: 1 1 auto;
    accent-color: var(--violet);
    min-width: 100px;
  }

  .binval {
    font-family: var(--font-mono, monospace);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--violet);
    min-width: 2.6rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .readout {
    display: flex;
    flex-wrap: wrap;
    gap: 1.2rem;
    margin: 0.5rem 0 0.4rem 0;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .stat-label {
    font-family: var(--font-main);
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: #9aa5b1;
  }

  .stat-value {
    font-family: var(--font-mono, monospace);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--squidink);
    font-variant-numeric: tabular-nums;
  }

  .stat-value.warn {
    color: #df2a5d;
  }

  .stat-note {
    font-family: var(--font-main);
    font-size: 0.7rem;
    color: #9aa5b1;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-bottom: 0.5rem;
  }

  .lg {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-family: var(--font-main);
    font-size: 0.71rem;
    color: #718096;
  }

  .sw {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: inline-block;
  }

  .sw.line {
    height: 2px;
    border-radius: 1px;
  }

  .caption {
    font-family: var(--font-main);
    font-size: 0.8rem;
    line-height: 1.5;
    color: #718096;
    margin: 0.2rem 0 0.2rem 0;
  }

  @media screen and (max-width: 950px) {
    .lab {
      max-width: 92%;
      padding: 0.75rem;
    }

    .readout {
      gap: 0.9rem;
    }

    .stat-value {
      font-size: 1rem;
    }
  }
</style>
