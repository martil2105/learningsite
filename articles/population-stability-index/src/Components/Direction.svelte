<script>
  /*
    PSI is a magnitude. The mirror pair is the clean experiment for that: mass
    is linear in the mixture weight, so moving the thin-file share the same
    distance either side of its development value moves every bin by the SAME
    amount of mass in opposite directions - measured antisymmetry 1.1e-16, which
    is machine precision and not an approximation.

    The Pearson parts then come out identical to eight decimals, so the whole
    gap between the two readings is the cubic term and beyond - the part of PSI
    that is not chi-square.
  */
  import { PRE, B, num, int, pct, psiFmt } from "../experiments.js";
  import { linear, ticks } from "../chart.js";
  import { SIGNAL, MARK, FLOOR, INK, AXIS, TICK, LABEL, RULE } from "../palette.js";

  const MI = PRE.mirror;
  const AM = PRE.additiveMirror;
  const half = AM.find((r) => Math.abs(r.d - 0.05) < 1e-9);
  const big = AM[AM.length - 1];

  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  const H1 = 132, H2 = 132;
  const mg = { l: 42, r: 14, t: 12, b: 30 };
  $: pw = Math.max(60, BW - mg.l - mg.r);
  $: band = pw / B;
  /* Reactive: all read band / the scales below. */
  $: slotX = (i) => mg.l + band * i;
  $: dMax = Math.max(...MI.shiftUp.map(Math.abs)) * 1.15;
  $: dy = linear(-dMax, dMax, H1 - mg.b, mg.t);
  $: tMax = Math.max(...MI.termsUp, ...MI.termsDown) * 1.12;
  $: ty = linear(0, tMax, H2 - mg.b, mg.t);
  $: bw = () => Math.max(1.5, band / 2 - 2);
</script>

<h1 class="body-header">A magnitude, with the sign thrown away</h1>

<p class="body-text">
  Let's compare two months at the same channel. In one, the share of thin-file
  applicants rises from {pct(PRE.population.thinShare, 0)} to {pct(0.52, 0)},
  and in the other, it falls to {pct(0.22, 0)}. Because the population is a
  mixture, those two moves take exactly the same amount of mass out of each
  decile and put it back in the other direction. The measured antisymmetry is
  {MI.maxAntisymmetry.toExponential(1)}, which is the last bit of a double.
</p>

<p class="body-text">
  So the two moves are the same size, and they're opposite in every way that
  matters to the lender. The approval rate moves
  {num(Math.abs(MI.approvalDown), 2)} points down in one month and
  {num(MI.approvalUp, 2)} points up in the other. In other words, one is a
  channel getting worse, and the other is a channel getting better.
</p>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth} />
  <div class="ftitle">How far each decile moved from its expected share</div>
  <svg class="shifts" width={BW} height={H1} viewBox="0 0 {BW} {H1}" role="img"
       aria-label="the signed deviation of each decile, for the two mirrored months">
    <line x1={mg.l} y1={dy(0)} x2={mg.l + pw} y2={dy(0)} stroke={AXIS} stroke-width="1" />
    {#each [-0.03, 0, 0.03] as t}
      <text x={mg.l - 6} y={dy(t) + 3.2} text-anchor="end" font-size="9" fill={TICK} font-family="var(--font-mono, monospace)">{t > 0 ? "+" : ""}{num(t * 100, 0)}</text>
    {/each}
    {#each MI.shiftUp as d, i}
      <rect class="up" x={slotX(i) + 2} y={Math.min(dy(d), dy(0))} width={bw()} height={Math.max(0.8, Math.abs(dy(d) - dy(0)))} fill={SIGNAL} opacity="0.85" />
      <rect class="dn" x={slotX(i) + band / 2 + 1} y={Math.min(dy(MI.shiftDown[i]), dy(0))} width={bw()} height={Math.max(0.8, Math.abs(dy(MI.shiftDown[i]) - dy(0)))} fill={MARK} opacity="0.85" />
    {/each}
    <text x={mg.l - 6} y={mg.t + 2} text-anchor="end" font-size="8.5" fill={LABEL} font-family="var(--font-main)">pts</text>
  </svg>

  <div class="ftitle second">What each decile contributes to PSI</div>
  <svg class="terms" width={BW} height={H2} viewBox="0 0 {BW} {H2}" role="img"
       aria-label="the contribution of each decile, for the two mirrored months">
    {#each ticks(0, tMax, 3) as t}
      <line x1={mg.l} y1={ty(t)} x2={mg.l + pw} y2={ty(t)} stroke="#eef1f5" stroke-width="1" />
      <text x={mg.l - 6} y={ty(t) + 3.2} text-anchor="end" font-size="9" fill={TICK} font-family="var(--font-mono, monospace)">{num(t, 3)}</text>
    {/each}
    {#each MI.termsUp as t, i}
      <rect class="up" x={slotX(i) + 2} y={ty(t)} width={bw()} height={Math.max(0.8, ty(0) - ty(t))} fill={SIGNAL} opacity="0.85" />
      <rect class="dn" x={slotX(i) + band / 2 + 1} y={ty(MI.termsDown[i])} width={bw()} height={Math.max(0.8, ty(0) - ty(MI.termsDown[i]))} fill={MARK} opacity="0.85" />
    {/each}
    <line x1={mg.l} y1={ty(0)} x2={mg.l + pw} y2={ty(0)} stroke={AXIS} stroke-width="1" />
    {#each [0, 2, 4, 6, 8] as i}
      <text x={slotX(i) + band / 2} y={ty(0) + 13} text-anchor="middle" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{i + 1}</text>
    {/each}
    <text x={mg.l + pw / 2} y={H2 - 2} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">decile of the development sample, lowest scores on the left</text>
  </svg>
  <div class="legend">
    <span class="key"><i class="sw sig" />thin files fall to {pct(0.22, 0)} — the channel improves, PSI {psiFmt(MI.psiUp)}</span>
    <span class="key"><i class="sw mk" />thin files rise to {pct(0.52, 0)} — the channel deteriorates, PSI {psiFmt(MI.psiDown)}</span>
  </div>
</div>

<p class="body-text">
  The top panel is a perfect mirror, but the bottom one isn't. PSI calls the
  improvement <span class="bold">{num(MI.psiUp / MI.psiDown, 2)} times worse</span>
  than the deterioration, so if the pack had a threshold anywhere between the
  two readings, it would open an investigation into the good news.
</p>

<h2 class="sub-header">Why does this happen?</h2>

<p class="body-text">
  It isn't the famous <span class="mono">r</span> against
  <span class="mono">1/r</span> asymmetry, because that needs the ratios to be
  reciprocal, and these aren't. If we take the quadratic part of PSI on its own
  (the Pearson statistic, which is what the chi-square law is about), it comes
  out identical for the two months to eight decimal places:
  {num(MI.quadUp, 6)} against {num(MI.quadDown, 6)}. So the entire difference
  lives in the cubic term and beyond.
</p>

<p class="body-text">
  What that cubic term tells us is this: if we move the same amount of
  <em>mass</em> out of a bin as into it, the move out costs more. At a decile
  that loses or gains half its share, it costs {num(half.ratio, 2)} times more,
  and at one that loses or gains {pct(big.d / 0.1, 0)} of its share, it costs
  {num(big.ratio, 2)} times more. As a result, a shift that empties the crowded
  end of the distribution scores higher than a shift that fills it, whatever
  that shift means for the book.
</p>

<div class="tablewrap">
  <table class="t">
    <thead>
      <tr><th>mass moved, as a share of a decile</th><th class="r">cost when the bin fills</th><th class="r">cost when it empties</th><th class="r">ratio</th></tr>
    </thead>
    <tbody>
      {#each AM.filter((r, i) => i % 2 === 1) as r}
        <tr>
          <td class="mono">{pct(r.d / 0.1, 0)}</td>
          <td class="r mono">{num(r.fill, 5)}</td>
          <td class="r mono">{num(r.empty, 5)}</td>
          <td class="r mono">{num(r.ratio, 2)}×</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<p class="body-text">
  It's worth stressing that none of this is a defect in the formula.
  <span class="mono">J</span> is a divergence, and divergences don't have signs,
  so asking one which way the population went is asking the right object the
  wrong question. The defect is in summing the terms and printing only the
  total. Every ingredient of the direction is in the bottom panel above,
  computed on the way to the number and then thrown away.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
  .fig { max-width: 660px; margin: 1.4rem auto; padding: 0 0.75rem; }
  .measure { width: 100%; height: 0; }
  .ftitle { font-family: var(--font-main); font-size: 0.74rem; color: #718096; margin-bottom: 0.1rem; }
  .ftitle.second { margin-top: 0.4rem; }
  .legend { display: flex; flex-direction: column; gap: 0.2rem; font-family: var(--font-main); font-size: 0.72rem; color: #4a5568; margin-top: 0.2rem; }
  .key { display: inline-flex; align-items: center; gap: 0.35rem; }
  .sw { width: 13px; height: 9px; display: inline-block; flex: 0 0 auto; }
  .sw.sig { background: #2074d5; }
  .sw.mk { background: #df2a5d; }

  .tablewrap { max-width: 600px; margin: 1.1rem auto; overflow-x: auto; }
  .t { border-collapse: collapse; width: 100%; font-family: var(--font-main); font-size: 0.84rem; }
  .t th { text-align: left; font-weight: 700; font-size: 0.7rem; color: #718096; border-bottom: 1px solid #cbd5e0; padding: 0.3rem 0.5rem 0.3rem 0; line-height: 1.25; }
  .t td { padding: 0.26rem 0.5rem 0.26rem 0; color: var(--squid-ink); border-bottom: 1px solid #eef1f5; }
  .t .r { text-align: right; padding-right: 0; }
  .t .mono { font-family: var(--font-mono, monospace); font-size: 0.94em; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .fig { padding: 0 0.5rem; }
    .tablewrap { max-width: 84%; }
  }
</style>
