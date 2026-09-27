<script>
  /*
    Two waterfalls on ONE shared rent axis.

    Sharing the axis is the whole point of the figure: both flats are the same
    6.5 km from the centre, and the reader is meant to be able to lay a finger
    across the two distance bars and see that they are different lengths. Give
    each chart its own scale and that comparison quietly stops being true.

    Colour here encodes polarity, not identity - which way the feature pushed
    the prediction - so it uses the two-hue pair rather than the categorical
    triple, and every bar is labelled with its own signed number besides.
  */
  import { scaleLinear } from "d3-scale";
  import { FEATURES } from "../datasets.js";
  import { EXPLAINED, krPlain, krSigned } from "../explain.js";
  import { PUSH_UP, PUSH_DOWN } from "../palette.js";

  // Rows in descending order of influence, the way a SHAP waterfall is read.
  const CHARTS = EXPLAINED.map((e) => {
    const order = FEATURES.map((f, i) => i).sort((a, b) => Math.abs(e.phi[b]) - Math.abs(e.phi[a]));
    let running = e.baseline;
    const bars = order.map((i) => {
      const from = running;
      running += e.phi[i];
      return {
        i,
        from,
        to: running,
        phi: e.phi[i],
        label: FEATURES[i].short,
        value: e.x[i].toFixed(FEATURES[i].digits) + (FEATURES[i].unit ? " " + FEATURES[i].unit : ""),
      };
    });
    return { ...e, bars };
  });

  const all = CHARTS.flatMap((c) => [c.baseline, c.prediction, ...c.bars.flatMap((b) => [b.from, b.to])]);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo;

  let width = 320;
  $: narrow = width < 520;
  $: labelW = narrow ? 74 : 104;
  $: valueW = narrow ? 64 : 78;
  $: plotW = Math.max(90, width - labelW - valueW - 8);
  $: xScale = scaleLinear()
    .domain([lo - span * 0.06, hi + span * 0.06])
    .range([labelW, labelW + plotW]);

  const ROW = 27;
  const BAR = 15;
  $: H = ROW * 5 + 26;
</script>

<figure class="wf">
  <figcaption class="wf-cap">
    Two listings, one rent axis. Both are 6.5 km from the centre and on floor 1.
  </figcaption>
  <div class="measure" bind:clientWidth={width} />

  {#each CHARTS as c}
    <div class="wf-block">
      <div class="wf-title">
        {c.label} — {c.x[0]} m², {c.x[1]} km, floor {c.x[2]}
      </div>
      <svg viewBox="0 0 {Math.max(200, width)} {H}" width={Math.max(200, width)} height={H}>
        <!-- start: the market average -->
        <text class="row-label" x={labelW - 8} y={ROW * 0.5 + 4} text-anchor="end">market average</text>
        <line class="anchor" x1={xScale(c.baseline)} x2={xScale(c.baseline)} y1={ROW * 0.5 - 9} y2={ROW * 4.5} />
        <circle cx={xScale(c.baseline)} cy={ROW * 0.5} r="3.5" fill="#4a5568" />
        <text class="row-value" x={labelW + plotW + 8} y={ROW * 0.5 + 4}>{krPlain(c.baseline)}</text>

        {#each c.bars as b, k}
          {@const y = ROW * (k + 1)}
          {@const x0 = xScale(Math.min(b.from, b.to))}
          {@const x1 = xScale(Math.max(b.from, b.to))}
          <text class="row-label" x={labelW - 8} y={y + 4} text-anchor="end">{b.label}</text>
          <text class="row-sub" x={labelW - 8} y={y + 14} text-anchor="end">{b.value}</text>
          <!-- connector down from where the previous bar ended -->
          <line class="connector" x1={xScale(b.from)} x2={xScale(b.from)} y1={y - ROW + 6} y2={y - BAR / 2} />
          <rect
            x={x0}
            y={y - BAR / 2}
            width={Math.max(2, x1 - x0)}
            height={BAR}
            rx="3"
            fill={b.phi >= 0 ? PUSH_UP : PUSH_DOWN}
          />
          <text
            class="row-value"
            x={labelW + plotW + 8}
            y={y + 4}
            fill={b.phi >= 0 ? PUSH_UP : PUSH_DOWN}>{krSigned(b.phi)}</text
          >
        {/each}

        <!-- end: this listing's prediction -->
        <text class="row-label strong" x={labelW - 8} y={ROW * 4.5 + 4} text-anchor="end">prediction</text>
        <line class="connector" x1={xScale(c.prediction)} x2={xScale(c.prediction)} y1={ROW * 3.5 + 6} y2={ROW * 4.5} />
        <circle cx={xScale(c.prediction)} cy={ROW * 4.5} r="4" fill="#232f3e" />
        <text class="row-value strong" x={labelW + plotW + 8} y={ROW * 4.5 + 4}>{krPlain(c.prediction)}</text>

        {#each xScale.ticks(narrow ? 3 : 5) as t}
          <text class="tick" x={xScale(t)} y={H - 6} text-anchor="middle">{(t / 1000).toFixed(0)}k</text>
        {/each}
      </svg>
    </div>
  {/each}

  <div class="wf-key">
    <span class="key-item"><span class="sw" style="background:{PUSH_UP}" /> pushes the rent up</span>
    <span class="key-item"><span class="sw" style="background:{PUSH_DOWN}" /> pushes it down</span>
    <span class="key-note">bars sum to prediction − market average, exactly</span>
  </div>
</figure>

<style>
  .wf {
    max-width: 660px;
    margin: 1.8rem auto;
    padding: 1rem 1.1rem 0.8rem 1.1rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .wf-cap {
    font-family: var(--font-main);
    font-size: 0.83rem;
    color: #718096;
    margin-bottom: 0.7rem;
  }

  .wf-block + .wf-block {
    margin-top: 0.9rem;
    padding-top: 0.9rem;
    border-top: 1px solid #eef1f5;
  }

  .wf-title {
    font-family: var(--font-main);
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--squidink);
    margin-bottom: 0.15rem;
  }

  svg {
    max-width: 100%;
    display: block;
  }

  .row-label {
    font-family: var(--font-main);
    font-size: 11.5px;
    fill: #4a5568;
  }

  .row-label.strong {
    font-weight: 700;
    fill: var(--squidink);
  }

  .row-sub {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    fill: #9aa5b1;
  }

  .row-value {
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    fill: #4a5568;
  }

  .row-value.strong {
    font-weight: 700;
    fill: var(--squidink);
  }

  .anchor {
    stroke: #c3ccd8;
    stroke-dasharray: 3 3;
  }

  .connector {
    stroke: #cbd3dc;
    stroke-width: 1;
  }

  .tick {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    fill: #9aa5b1;
  }

  .wf-key {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #718096;
    margin-top: 0.6rem;
    padding-top: 0.55rem;
    border-top: 1px solid #eef1f5;
  }

  .key-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .sw {
    width: 14px;
    height: 8px;
    border-radius: 2px;
    display: inline-block;
  }

  .key-note {
    margin-left: auto;
    font-style: italic;
  }

  @media screen and (max-width: 950px) {
    .wf {
      max-width: 94%;
      padding: 0.8rem 0.7rem;
    }

    .key-note {
      margin-left: 0;
    }
  }
</style>
