<script>
  /*
    PSI against what a month actually cost. Thirty-four population shifts, every
    quantity an exact integral against the generating mixture rather than a
    simulation, so the scatter has no sampling noise in it at all - what you see
    is the relationship, not an estimate of it.
  */
  import { PRE, POP, num, int, pct, psiFmt, B } from "../experiments.js";
  import { linear, log as logScale, ticks, pathOf } from "../chart.js";
  import { SIGNAL, MARK, FLOOR, INK, AXIS, TICK, LABEL, RULE, THEORY } from "../palette.js";

  const S = PRE.scenarios;
  const base = POP.badPer1000;
  const concept = S.filter((s) => s.kind === "concept");
  const covar = S.filter((s) => s.kind !== "concept");
  const worst = [...S].sort((a, b) => b.dBadPer1000 - a.dBadPer1000).slice(0, 4);
  const allConcept = worst.every((w) => w.kind === "concept");
  /* the pair with nearly equal readings and opposite consequences */
  const pairA = S.find((s) => s.kind === "spread" && s.param === 1.2);
  const pairB = S.find((s) => s.kind === "mix" && s.param === 0.22);
  const c40 = concept[concept.length - 1];

  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  const H = 250;
  const mg = { l: 48, r: 16, t: 16, b: 40 };
  $: pw = Math.max(60, BW - mg.l - mg.r);
  $: sx = logScale(0.0002, 0.4, mg.l, mg.l + pw);
  $: sy = linear(-2, 7.2, H - mg.b, mg.t);
  const XT = [0.001, 0.01, 0.1];
  const XL = ["0.001", "0.01", "0.1"];

  let hover = null;
  $: tip = hover
    ? hover.label + " — PSI " + psiFmt(hover.psi) + ", " +
      (hover.dBadPer1000 >= 0 ? "+" : "−") + num(Math.abs(hover.dBadPer1000), 2) +
      " bad loans per 1,000, approval " + num(hover.dApprovalPP, 2) + " points"
    : "Hover a point. Everything left of 0.01 is inside the green band; everything right of 0.1 opens an investigation.";
</script>

<h1 class="body-header">What a reading is worth</h1>

<p class="body-text">
  The chart below plots {int(S.length)} different months, and each one is
  something that can happen to this population. The population can drift down
  or up, spread out or tighten, or see its thin-file share move. A new lead
  source can appear at the bottom of the book, or the scorecard's calibration
  can slip while the score distribution stays exactly where it was. Along one
  axis, we plot the PSI that each month produces, and along the other, the
  number of bad loans per thousand applications that it leaves the lender
  holding.
</p>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth} />
  <svg class="scatter" width={BW} height={H} viewBox="0 0 {BW} {H}" role="img"
       aria-label="PSI against the change in bad loans per thousand applications, for thirty-four population shifts"
       on:mouseleave={() => (hover = null)}>
    <rect x={mg.l} y={mg.t} width={Math.max(0, sx(0.1) - mg.l)} height={H - mg.t - mg.b} fill="#f5f7f9" />
    {#each ticks(-2, 7, 5) as t}
      <line x1={mg.l} y1={sy(t)} x2={mg.l + pw} y2={sy(t)} stroke={t === 0 ? "#cbd5e0" : "#eef1f5"} stroke-width="1" />
      <text x={mg.l - 6} y={sy(t) + 3.2} text-anchor="end" font-size="9" fill={TICK} font-family="var(--font-mono, monospace)">{t > 0 ? "+" : ""}{t}</text>
    {/each}
    <line x1={sx(0.1)} y1={mg.t} x2={sx(0.1)} y2={H - mg.b} stroke={MARK} stroke-width="1.3" />
    <line x1={sx(0.25)} y1={mg.t} x2={sx(0.25)} y2={H - mg.b} stroke={MARK} stroke-width="1.3" />
    <text x={sx(0.1) - 4} y={mg.t + 9} text-anchor="end" font-size="9" fill={MARK} font-family="var(--font-main)"
          stroke="#fff" stroke-width="3" paint-order="stroke">0.10</text>

    {#each covar as s}
      <circle class="cov" cx={sx(Math.max(0.00021, s.psi))} cy={sy(s.dBadPer1000)} r={hover === s ? 6 : 4}
              fill={SIGNAL} opacity="0.75" stroke="#fff" stroke-width="1"
              on:mouseenter={() => (hover = s)} />
    {/each}
    {#each concept as s}
      <circle class="con" cx={sx(Math.max(0.00021, s.psi))} cy={sy(s.dBadPer1000)} r={hover === s ? 6.5 : 4.6}
              fill={MARK} stroke="#fff" stroke-width="1.2"
              on:mouseenter={() => (hover = s)} />
    {/each}

    <line x1={mg.l} y1={H - mg.b} x2={mg.l + pw} y2={H - mg.b} stroke={AXIS} stroke-width="1" />
    {#each XT as t, i}
      <text x={sx(t)} y={H - mg.b + 13} text-anchor="middle" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{XL[i]}</text>
    {/each}
    <text x={mg.l + pw / 2} y={H - 16} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">PSI, logarithmic</text>
    <text x={mg.l - 40} y={mg.t - 4} text-anchor="start" font-size="9" fill={LABEL} font-family="var(--font-main)">extra bad loans per 1,000</text>
  </svg>
  <p class="tip">{tip}</p>
  <div class="legend">
    <span class="key"><i class="dot sig" />the population moved</span>
    <span class="key"><i class="dot mk" />the population did not move — the calibration did</span>
  </div>
</div>

<p class="body-text">
  As we can see, there's no relationship at all. The four most expensive months
  in that chart are the four furthest to the left, all of them well inside the
  green band. The most expensive of all leaves {num(c40.dBadPer1000, 2)} extra
  bad loans per thousand, which is {pct(c40.badPer1000 / base - 1, 0)} more than
  the book was built to carry, and it has a PSI of {psiFmt(c40.psi)}. Meanwhile,
  the readings above <span class="mono">0.10</span> are almost all population
  drifts down, which cost the lender volume rather than losses. That's because
  fewer applications clear the cut-off, so the accepted book barely changes.
  Every one of those months leaves the lender with {num(Math.max(...S.filter((s) => s.psi > 0.1).map((s) => s.dBadPer1000)), 2)}
  or fewer extra bad loans per thousand, and most of them leave it with fewer
  than it started with.
</p>

<p class="body-text">
  And within the band, the sign isn't even fixed. For example, these two months
  score within
  {psiFmt(Math.abs(pairA.psi - pairB.psi))} of each other:
</p>

<div class="pair">
  <div class="pc">
    <div class="pl">the population tightened</div>
    <div class="pv">PSI {psiFmt(pairA.psi)}</div>
    <div class="pd">approval {num(pairA.dApprovalPP, 2)} points · <b>{num(pairA.dBadPer1000, 2)}</b> bad loans per 1,000</div>
  </div>
  <div class="pc">
    <div class="pl">the thin-file share fell</div>
    <div class="pv">PSI {psiFmt(pairB.psi)}</div>
    <div class="pd">approval +{num(pairB.dApprovalPP, 2)} points · <b>+{num(pairB.dBadPer1000, 2)}</b> bad loans per 1,000</div>
  </div>
</div>

<h2 class="sub-header">The failure PSI can't be blamed for</h2>

<p class="body-text">
  The red points deserve a paragraph of their own, because they're less a
  failure of PSI than a fact about what it's for. Nothing about the population
  changed in any of them. The same applicants arrive with the same scores in the
  same proportions, and what moved is the relationship between score and
  default. That could be a recession, a change in what a bureau field means, or
  a shift in the products people are applying for. The reading doesn't move at
  all, because PSI never looks at an outcome. What those four points show is
  the development sample's own frozen error and nothing else.
</p>

<p class="body-text">
  The uncomfortable part is that the rest of the standard pack doesn't catch it
  either. A calibration slip of {c40.param} score points leaves the
  rank-ordering nearly intact, so AUC only moves from {num(POP.auc, 3)} to
  {num(c40.auc, 3)}, which is a change no governance committee would act on.
  Meanwhile, the bad rate on the approved book goes from
  {pct(POP.acceptedBad, 2)} to {pct(c40.acceptedBad, 2)}.
</p>

<div class="tablewrap">
  <table class="t">
    <thead>
      <tr><th>decile</th><th class="r">bad rate the model expects</th><th class="r">bad rate it gets</th><th class="r">ratio</th></tr>
    </thead>
    <tbody>
      {#each c40.param ? PRE.conceptBands[PRE.conceptBands.length - 1].byBin : [] as r, i}
        <tr>
          <td>{i + 1}{i === 0 ? " — lowest scores" : i === B - 1 ? " — highest scores" : ""}</td>
          <td class="r mono">{pct(r.expected, 2)}</td>
          <td class="r mono">{pct(r.observed, 2)}</td>
          <td class="r mono hot">{num(r.observed / r.expected, 2)}×</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="cap">
    What does catch it is comparing observed against expected, band by band.
    However, that comparison needs outcomes, which is why it arrives two years
    late and why nobody wants it to be the only thing watching.
  </p>
</div>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
  .fig { max-width: 680px; margin: 1.4rem auto; padding: 0 0.75rem; }
  .measure { width: 100%; height: 0; }
  .tip { font-family: var(--font-main); font-size: 0.73rem; color: #4a5568; min-height: 2.2em; margin: 0.2rem 0 0 0; line-height: 1.4; }
  .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 0.9rem; font-family: var(--font-main); font-size: 0.7rem; color: #4a5568; }
  .key { display: inline-flex; align-items: center; gap: 0.3rem; }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .dot.sig { background: #2074d5; }
  .dot.mk { background: #df2a5d; }

  .pair { max-width: 600px; margin: 1rem auto; display: flex; gap: 0.6rem; flex-wrap: wrap; }
  .pc { flex: 1 1 240px; border: 1px solid #e2e8f0; border-radius: 5px; padding: 0.5rem 0.6rem; background: var(--white); }
  .pl { font-family: var(--font-main); font-size: 0.72rem; color: #718096; }
  .pv { font-family: var(--font-heavy); font-size: 1.15rem; color: var(--squid-ink); }
  .pd { font-family: var(--font-main); font-size: 0.74rem; color: #4a5568; margin-top: 0.15rem; }
  .pd b { font-family: var(--font-mono, monospace); color: var(--squid-ink); }

  .tablewrap { max-width: 600px; margin: 1.1rem auto; overflow-x: auto; }
  .t { border-collapse: collapse; width: 100%; font-family: var(--font-main); font-size: 0.84rem; }
  .t th { text-align: left; font-weight: 700; font-size: 0.7rem; color: #718096; border-bottom: 1px solid #cbd5e0; padding: 0.3rem 0.5rem 0.3rem 0; line-height: 1.25; }
  .t td { padding: 0.24rem 0.5rem 0.24rem 0; color: var(--squid-ink); border-bottom: 1px solid #eef1f5; }
  .t .r { text-align: right; padding-right: 0; }
  .t .mono { font-family: var(--font-mono, monospace); font-size: 0.94em; }
  .t .hot { color: #df2a5d; }
  .cap { font-family: var(--font-main); font-size: 0.72rem; color: #718096; margin: 0.35rem 0 0 0; line-height: 1.45; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .fig { padding: 0 0.5rem; }
    .pair, .tablewrap { max-width: 84%; }
  }
</style>
