<script>
  /*
    What the two thresholds do, in both directions.

    Left of the story: below a couple of hundred applications they fire on
    populations that did not move. Right of it: because the threshold is a fixed
    number, the shift it can detect does not shrink as data arrives - it is flat
    from two hundred applications to a million.
  */
  import { PRE, M, B, num, int, pct, psiFmt, POP, AMBER, RED, amberPoints, redPoints } from "../experiments.js";
  import { chi2Inv } from "../stats.js";
  import { linear, log as logScale, pathOf, ticks, shortN } from "../chart.js";
  import { SIGNAL, MARK, FLOOR, THEORY, INK, AXIS, TICK, LABEL, RULE, MARK_WASH } from "../palette.js";

  /* The sample size at which a fixed threshold IS a 5% test. Solved, not typed. */
  const c95 = chi2Inv(0.95, B - 1);
  const nFor = (th) => 1 / (th / c95 - 1 / M);
  const nAmber = nFor(AMBER), nRed = nFor(RED);

  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  $: half = BW > 680 ? Math.floor((BW - 16 - 2) / 2) : Math.min(440, BW);
  $: twoUp = BW > 680;
  const H = 200;
  const mg = { l: 40, r: 16, t: 14, b: 36 };
  $: pw = Math.max(60, half - mg.l - mg.r);

  const G = PRE.nullGrid;
  const P2 = PRE.power;
  $: fx = logScale(G[0].N, G[G.length - 1].N, mg.l, mg.l + pw);
  $: fy = linear(0, 1, H - mg.b, mg.t);
  $: amberPath = pathOf(G.map((g) => [fx(g.N), fy(g.pAmber)]));
  $: redPath = pathOf(G.map((g) => [fx(g.N), fy(g.pRed)]));

  $: px = logScale(P2[0].N, P2[P2.length - 1].N, mg.l, mg.l + pw);
  $: py = linear(0, 32, H - mg.b, mg.t);
  $: fixedPath = pathOf(P2.map((p) => [px(p.N), py(p.fixedPts)]));
  $: adaptivePath = pathOf(P2.map((p) => [px(p.N), py(p.adaptivePts)]));

  const NT = [100, 1000, 10000, 100000];
  const NT2 = [200, 1000, 10000, 100000, 1000000];

  const g50 = G.find((g) => g.N === 50);
  const g100 = G.find((g) => g.N === 100);
  const g170 = G.find((g) => g.N === 170);
  const g500 = G.find((g) => g.N === 500);
  const pBig = P2[P2.length - 1];
  const pSmall = P2[0];
</script>

<h1 class="body-header">Two ways for a fixed line to be wrong</h1>

<p class="body-text">
  If we apply a fixed threshold to a statistic whose floor moves with
  <span class="mono">N</span>, the threshold has to be wrong at every sample
  size but one. It's worth looking at both halves of that problem, because they
  fail in opposite ways, and the second one is the more expensive.
</p>

<h2 class="sub-header">Below a couple of hundred applications, it's a noise detector</h2>

<p class="body-text">
  Let's start with populations that didn't move at all. At {int(50)}
  applications a month, a reading averages {psiFmt(g50.mean)}, and it crosses
  <span class="mono">0.25</span> (the line that says <em>significant change,
  review the model</em>) in {pct(g50.pRed, 0)} of months. At {int(100)}
  applications, it crosses <span class="mono">0.10</span> in
  {pct(g100.pAmber, 0)} of them. By {int(500)}, the whole problem has gone away.
</p>

<div class="figs" class:stack={!twoUp}>
  <div class="measure" bind:clientWidth={boxWidth} />
  <div class="fig" style="width: {half}px">
    <div class="ftitle">Months flagged, on a population that did not move</div>
    <svg width={half} height={H} viewBox="0 0 {half} {H}" role="img"
         aria-label="the false alarm rate of each threshold against the number of applications">
      {#each [0, 0.25, 0.5, 0.75, 1] as t}
        <line x1={mg.l} y1={fy(t)} x2={mg.l + pw} y2={fy(t)} stroke="#eef1f5" stroke-width="1" />
        <text x={mg.l - 6} y={fy(t) + 3.2} text-anchor="end" font-size="9" fill={TICK} font-family="var(--font-mono, monospace)">{pct(t, 0)}</text>
      {/each}
      <line x1={fx(nAmber)} y1={mg.t} x2={fx(nAmber)} y2={H - mg.b} stroke={RULE} stroke-width="1" stroke-dasharray="2 4" />
      <path class="amber" d={amberPath} fill="none" stroke={SIGNAL} stroke-width="2.2" />
      <path class="red" d={redPath} fill="none" stroke={MARK} stroke-width="2.2" />
      <text x={fx(nAmber) + 4} y={mg.t + 10} font-size="9" fill={LABEL} font-family="var(--font-main)"
            stroke="#fff" stroke-width="3" paint-order="stroke">N = {num(nAmber, 0)}</text>
      <line x1={mg.l} y1={H - mg.b} x2={mg.l + pw} y2={H - mg.b} stroke={AXIS} stroke-width="1" />
      {#each NT as t}
        <text x={fx(t)} y={H - mg.b + 13} text-anchor="middle" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{shortN(t)}</text>
      {/each}
      <text x={mg.l + pw / 2} y={H - 4} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">applications in the month</text>
    </svg>
    <div class="legend">
      <span class="key"><i class="ln sig" />crosses 0.10</span>
      <span class="key"><i class="ln mark" />crosses 0.25</span>
    </div>
  </div>

  <div class="fig" style="width: {half}px">
    <div class="ftitle">The smallest real shift each rule can catch, four months in five</div>
    <svg width={half} height={H} viewBox="0 0 {half} {H}" role="img"
         aria-label="the detectable shift under a fixed threshold and under a sample-size-aware one">
      {#each ticks(0, 32, 4) as t}
        <line x1={mg.l} y1={py(t)} x2={mg.l + pw} y2={py(t)} stroke="#eef1f5" stroke-width="1" />
        <text x={mg.l - 6} y={py(t) + 3.2} text-anchor="end" font-size="9" fill={TICK} font-family="var(--font-mono, monospace)">{t}</text>
      {/each}
      <path class="fixed" d={fixedPath} fill="none" stroke={MARK} stroke-width="2.4" />
      <path class="adaptive" d={adaptivePath} fill="none" stroke={SIGNAL} stroke-width="2.4" />
      <text x={px(P2[3].N)} y={py(P2[3].fixedPts) - 7} font-size="9.5" fill={MARK} font-family="var(--font-main)"
            stroke="#fff" stroke-width="3" paint-order="stroke">the fixed 0.10 line</text>
      <text x={px(P2[4].N)} y={py(P2[4].adaptivePts) + 14} font-size="9.5" fill={SIGNAL} font-family="var(--font-main)"
            stroke="#fff" stroke-width="3" paint-order="stroke">a 5% test at this N</text>
      <line x1={mg.l} y1={H - mg.b} x2={mg.l + pw} y2={H - mg.b} stroke={AXIS} stroke-width="1" />
      {#each NT2 as t}
        <text x={px(t)} y={H - mg.b + 13} text-anchor="middle" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{shortN(t)}</text>
      {/each}
      <text x={mg.l + pw / 2} y={H - 4} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">applications in the month</text>
      <text x={mg.l - 6} y={mg.t - 3} text-anchor="end" font-size="8.5" fill={LABEL} font-family="var(--font-main)">pts</text>
    </svg>
    <div class="legend">
      <span class="key">both at 80% power, ten bins</span>
    </div>
  </div>
</div>

<p class="body-text">
  If we solve for the sample size at which <span class="mono">0.10</span> is
  exactly a 5% test, it comes out at
  <span class="bold">{num(nAmber, 0)} applications</span>, with ten bins and this
  development sample. The <span class="mono">0.25</span> line is a 5% test at
  {num(nRed, 0)}. Those are the only two monitoring windows on which the
  conventional thresholds are calibrated tests of anything. Above those sizes,
  the thresholds are conservative, and below them, they're really just a report
  on your volume.
</p>

<h2 class="sub-header">Above that, the line stops moving</h2>

<p class="body-text">
  The second chart shows the half that costs money. Because
  <span class="mono">0.10</span> is a fixed number and PSI is an estimate of a
  fixed population quantity, the shift that trips the threshold is the shift
  that <em>equals</em> it, and more data can't make that shift any smaller. The
  rule needs {num(pSmall.fixedPts, 1)} score points at {int(pSmall.N)}
  applications and {num(pBig.fixedPts, 1)} at {int(pBig.N)}. In other words,
  all that extra data buys us nothing.
</p>

<p class="body-text">
  If we run the same test with the threshold set from
  <span class="mono">N</span> instead, the smallest shift it can catch goes from
  {num(pSmall.adaptivePts, 1)} points to {num(pBig.adaptivePts, 1)}. That's
  exactly what a bigger sample is supposed to do.
</p>

<h2 class="sub-header">What 0.10 and 0.25 actually are</h2>

<p class="body-text">
  It follows that, in normal use, the two thresholds aren't tests at all.
  They're effect sizes, and since nobody chose them as effect sizes, it's worth
  translating them into the units the business runs on:
</p>

<div class="tablewrap">
  <table class="eff">
    <thead>
      <tr><th>reading</th><th class="r">score points</th><th class="r">standard deviations</th><th class="r">approval rate</th></tr>
    </thead>
    <tbody>
      {#each PRE.psiToPoints as p}
        <tr class:hl={p.psi === AMBER || p.psi === RED}>
          <td class="mono">{num(p.psi, 3)}</td>
          <td class="r mono">{num(p.points, 1)}</td>
          <td class="r mono">{num(p.sd, 3)}</td>
          <td class="r mono">{num(p.dApprovalPP, 1)} pts</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<p class="body-text">
  By the time a channel's score distribution has moved far enough to turn the
  cell amber, its approval rate has already fallen by
  {num(Math.abs(amberPoints.dApprovalPP), 1)} points, and by the time it turns
  red, it has fallen by {num(Math.abs(redPoints.dApprovalPP), 1)}. Those aren't
  early warnings. When an entire acquisition channel moves by half a standard
  deviation, that isn't drift. It's a different book.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  .figs { max-width: 760px; margin: 1.4rem auto; padding: 0 0.75rem; display: flex; gap: 16px; justify-content: center; align-items: flex-start; flex-wrap: wrap; }
  .figs.stack { flex-direction: column; align-items: center; }
  .measure { width: 100%; height: 0; }
  .ftitle { font-family: var(--font-main); font-size: 0.74rem; color: #718096; margin-bottom: 0.15rem; line-height: 1.3; min-height: 2rem; }

  .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 0.9rem; font-family: var(--font-main); font-size: 0.7rem; color: #4a5568; }
  .key { display: inline-flex; align-items: center; gap: 0.3rem; }
  .ln { width: 15px; height: 0; border-top: 2.4px solid; display: inline-block; }
  .ln.sig { border-color: #2074d5; }
  .ln.mark { border-color: #df2a5d; }

  .tablewrap { max-width: 600px; margin: 1.1rem auto; overflow-x: auto; }
  .eff { border-collapse: collapse; width: 100%; font-family: var(--font-main); font-size: 0.86rem; }
  .eff th { text-align: left; font-weight: 700; font-size: 0.7rem; color: #718096; border-bottom: 1px solid #cbd5e0; padding: 0.3rem 0.5rem 0.3rem 0; }
  .eff td { padding: 0.26rem 0.5rem 0.26rem 0; color: var(--squid-ink); border-bottom: 1px solid #eef1f5; }
  .eff .r { text-align: right; padding-right: 0; }
  .eff .mono { font-family: var(--font-mono, monospace); font-size: 0.94em; }
  .eff tr.hl td { background: rgba(223, 42, 93, 0.07); font-weight: 600; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .figs { padding: 0 0.5rem; }
    .tablewrap { max-width: 84%; }
  }
</style>
