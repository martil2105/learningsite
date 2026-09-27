<script>
  /*
    What the whole exercise bought.

    Every number here is a balanced error rate INTEGRATED against the two
    class-conditional densities over the plane, not estimated on a held-out
    sample. The model never sees any of it, and there is no sampling error at
    all, so a difference of half a point between two rows is a real difference
    rather than a lucky draw.

    The "threshold tuned" rows are an ORACLE: the threshold that minimises the
    very quantity being reported. That is deliberately generous to the option
    this article ends up preferring, because the alternative - tuning it on a
    validation split - would make the comparison about how big the split was.
    Read those rows as an upper bound on what moving the threshold gets you.
  */
  import { scaleLinear } from "d3-scale";
  import ScatterPanel from "./ScatterPanel.svelte";
  import { VERDICT, HOOK, scen, pct, num, int } from "../experiments.js";
  import { INK, GREEN, SYNTH, LABEL } from "../palette.js";

  const hard = VERDICT.find((v) => v.id === "as-it-arrives");
  const hardSc = scen("as-it-arrives");

  const BOUNDS = [
    { rings: hardSc.boundaries.noneTuned, color: GREEN, label: "no resampling, threshold moved", dash: "none" },
    { rings: hardSc.boundaries.smoteHalf, color: SYNTH, label: "SMOTE, threshold 0.5", dash: "6 4" },
  ];

  const ROWS = [
    { key: "none", pick: "atHalf", label: "no resampling, threshold 0.5" },
    { key: "none", pick: "tuned", label: "no resampling, threshold moved" },
    { key: "smote", pick: "atHalf", label: "SMOTE" },
    { key: "borderline", pick: "atHalf", label: "Borderline-SMOTE" },
    { key: "enn", pick: "atHalf", label: "SMOTE, then ENN cleaning" },
  ];

  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  $: labelW = BW < 520 ? 132 : 178;
  $: mD = { top: 20, right: 46, bottom: 20, left: labelW };
  $: dw = Math.max(90, BW - mD.left - mD.right);
  const rowH = 21;
  $: dh = ROWS.length * rowH;
  $: hD = dh + mD.top + mD.bottom;
  $: xD = scaleLinear().domain([0, 0.52]).range([mD.left, mD.left + dw]);
  // Reactive: reads xD.
  $: cx = (v) => xD(v.balanced);
  $: rowY = (i) => mD.top + i * rowH + rowH / 2;
  $: valueOf = (s, r) => s[r.key][r.pick];
  $: bestOf = (s) => Math.min(...ROWS.map((r) => valueOf(s, r).balanced));
  /* Tie-tolerant: these are printed to one decimal, so highlighting exactly one
     of two rows that both read 2.4% is a chart contradicting its own labels. */
  $: isBest = (s, r) => valueOf(s, r).balanced <= bestOf(s) + 0.0005;

</script>

<h1 class="body-header">So what did it buy us?</h1>

<p class="body-text">
  Putting bad rows in a training set is only a problem if it changes what the
  model does, and the most reliable way to find out is to look at the decision
  boundary. The chart below uses the hardest of the three label sets. It
  compares what a nearest-neighbours classifier learns from the SMOTE-balanced
  data with what the same classifier learns from the original data, where the
  only change is moving the threshold at which it says "fraud".
</p>

<div class="wrap">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth} />
    <div class="chart-header">
      <span class="chart-title">Two ways to make the same classifier answer</span>
      <span class="chart-sub">{hardSc.name}</span>
    </div>
    <ScatterPanel sc={hardSc} showChildren={false} showSegments={false} boundaries={BOUNDS} maxHeight={340} />
    <div class="legend">
      {#each BOUNDS as b}
        <span class="key"><i class="line" style="background:{b.color}" />{b.label}</span>
      {/each}
    </div>
    <p class="cap">
      There's a third boundary that can't be drawn: the original data at the usual
      threshold of 0.5 has no boundary anywhere on the plane, because it never
      says fraud.
    </p>
  </div>
</div>

<p class="body-text">
  The two boundaries track each other closely. Both find all three places where
  the fraud actually is and draw much the same line around each of them, leaving
  only ragged detail along the edges. Across the whole plane, the two
  classifiers disagree about
  <span class="bold">{pct(hard.disagreement.cells, 1)}</span> of it
  ({pct(hard.disagreement.weighted, 1)} once you weight by where the
  transactions actually are), and on the two easier label sets, that falls to
  {VERDICT.slice(0, 2).map((v) => pct(v.disagreement.weighted, 1)).join(" and ")}.
  So two quite different procedures, one of which wrote down
  {int(hard.smote.synthetic)} rows that nobody observed, arrive at nearly the
  same classifier.
</p>

<div class="wrap">
  <div class="card">
    <div class="chart-header">
      <span class="chart-title">Balanced error rate</span>
      <span class="chart-sub">lower is better · k-nearest-neighbours, k = {HOOK.pre.methods ? 25 : 25}</span>
    </div>
    {#each VERDICT as s}
      <div class="dgroup">
        <div class="dtitle">{s.name}</div>
        <svg viewBox="0 0 {BW} {hD}" width={BW} height={hD}>
          {#each [0, 0.1, 0.2, 0.3, 0.4, 0.5] as t}
            <line class="grid" x1={xD(t)} x2={xD(t)} y1={mD.top - 4} y2={mD.top + dh} />
            <text class="tick" x={xD(t)} y={mD.top - 8} text-anchor="middle">{pct(t)}</text>
          {/each}
          {#each ROWS as r, i}
            <text class="rlab" x={mD.left - 8} y={rowY(i) + 3.5} text-anchor="end">{r.label}</text>
            <line class="rule" x1={mD.left} x2={mD.left + dw} y1={rowY(i)} y2={rowY(i)} />
            <circle
              cx={cx(valueOf(s, r))}
              cy={rowY(i)}
              r="5"
              fill={isBest(s, r) ? GREEN : INK}
              stroke="#ffffff"
              stroke-width="1.5"
            />
            <text
              class="rval"
              x={cx(valueOf(s, r)) + 10}
              y={rowY(i) + 3.5}
              fill={isBest(s, r) ? GREEN : INK}
            >{pct(valueOf(s, r).balanced, 1)}</text>
          {/each}
        </svg>
      </div>
    {/each}
    <p class="cap">
      These are integrated over the plane against the true class densities, so they
      aren't estimates. The "threshold moved" rows use the best possible threshold
      for this metric, which makes them an oracle, and therefore the most generous
      possible reading of that option.
    </p>
  </div>
</div>

<p class="body-text">
  SMOTE does an enormous amount of good here. On the hardest label set, it takes
  a classifier that catches none of the fraud and gets it to
  {pct(1 - hard.smote.atHalf.miss)}, and it's a similar story on the other two.
  Anyone who has watched a model refuse to predict the rare class knows exactly
  why the method is so popular.
</p>

<p class="body-text">
  But in all three cases, simply moving the threshold does just as much good, at
  no cost, without touching the data, and without inventing a single row. On the
  hardest label set, it achieves {pct(hard.none.tuned.balanced, 1)} compared with
  SMOTE's {pct(hard.smote.atHalf.balanced, 1)}, and on the other two,
  {VERDICT.map((v) => pct(v.none.tuned.balanced, 1) + " against " + pct(v.smote.atHalf.balanced, 1)).slice(0, 2).join(" and ")}.
  Each of those gaps is a tenth of a point, which is a dead heat. However, it's
  a dead heat in the same direction three times, and one of the two contestants
  had to generate {int(hard.smote.synthetic)} rows that weren't in the data.
</p>

<p class="body-text">
  The two remedies designed to patch exactly the failure this article is about,
  generating only from the border and cleaning up afterwards, don't change that.
  On the hardest set, they come in at
  {pct(hard.borderline.atHalf.balanced, 1)} and
  {pct(hard.enn.atHalf.balanced, 1)}, a few tenths either side of plain SMOTE,
  and still not clearly ahead of the threshold. They're fixing the symptom this
  article measures, but the approach they're competing against never had that
  symptom in the first place.
</p>

<p class="body-text">
  This isn't a new finding, and it's worth saying so. Elor and Averbuch-Elor
  compared balancing across weak learners and strong modern classifiers, and
  found that it helped the weak ones but not the strong ones. Van den Goorbergh
  and colleagues found that imbalance corrections left discrimination unchanged
  while wrecking calibration, and that adjusting the threshold gave the same
  classifications without the damage. What the picture above adds is
  <em>where</em> the damage comes from. It doesn't come from resampling as an
  abstract idea, but from a specific claim about specific points, which you can
  watch being made.
</p>

<style>
  .measure { width: 100%; height: 0; }

  .wrap { display: flex; justify-content: center; margin: 1.5rem auto; padding: 0 0.75rem; }

  .card {
    width: 100%;
    max-width: 680px;
    background: #ffffff;
    border-radius: 10px;
    padding: 0.9rem 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
  }

  .chart-title { font-family: var(--font-main); font-size: 0.9rem; font-weight: 700; color: var(--squidink); }
  .chart-sub { font-family: var(--font-mono, monospace); font-size: 0.72rem; color: #718096; }

  svg { max-width: 100%; display: block; }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.9rem;
    margin-top: 0.45rem;
    font-family: var(--font-main);
    font-size: 0.72rem;
    color: #4a5568;
  }

  .key { display: inline-flex; align-items: center; gap: 0.32rem; }
  .line { width: 15px; height: 3px; border-radius: 2px; display: inline-block; }

  .cap {
    margin: 0.55rem 0 0 0;
    font-family: var(--font-main);
    font-size: 0.73rem;
    line-height: 1.5;
    color: #718096;
  }

  .dgroup { margin-top: 0.7rem; }

  .dtitle {
    font-family: var(--font-main);
    font-size: 0.78rem;
    font-weight: 700;
    color: #4a5568;
    margin-bottom: 0.1rem;
  }

  .grid { stroke: #eef1f5; }
  .rule { stroke: #f4f6f8; stroke-width: 1; }
  .tick { font-family: var(--font-mono, monospace); font-size: 9.5px; fill: #9aa5b1; }
  .rlab { font-family: var(--font-main); font-size: 10.5px; fill: #4a5568; }
  .rval { font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 700; }
</style>
