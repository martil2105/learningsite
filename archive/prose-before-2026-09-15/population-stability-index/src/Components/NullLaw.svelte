<script>
  /*
    The theorem, and a picture of it that is a simulation rather than an
    illustration: 60,000 monitoring months drawn from a population that did not
    move, against the chi-square density, with nothing fitted.

    The result is Yurdakul & Naranjo (2020), Theorem 3.3. What is added here is
    the split of the floor into a part that is fresh noise every month and a
    part that was frozen into the bin edges on the day the model was built.
  */
  import katexify from "../katexify.js";
  import { PRE, M, B, num, int, psiFmt, pct, floorOf, nullBand } from "../experiments.js";
  const nullAt = (n) => PRE.nullGrid.find((g) => g.N === n) || nullBand(n);
  import { linear, pathOf, areaOf, ticks } from "../chart.js";
  import { SIGNAL, SIGNAL_WASH, THEORY, MARK, INK, AXIS, TICK, LABEL, RULE, FLOOR } from "../palette.js";

  let pick = 2;
  $: ov = PRE.overlay[pick];

  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  const H = 220;
  const mg = { l: 42, r: 14, t: 14, b: 34 };
  $: pw = Math.max(60, BW - mg.l - mg.r);
  $: nb = ov.density.length;
  $: xMax = ov.width * nb;
  $: hx = linear(0, xMax, mg.l, mg.l + pw);
  $: yMax = Math.max(...ov.density, ...ov.chi2) * 1.1;
  $: hy = linear(0, yMax, H - mg.b, mg.t);
  /* Reactive: each reads hx / hy / ov. */
  $: barX = (i) => hx(i * ov.width);
  $: barW = () => Math.max(0.8, hx(ov.width) - hx(0) - 0.8);
  $: theory = pathOf(ov.chi2.map((d, i) => [hx((i + 0.5) * ov.width), hy(d)]));

  $: caption =
    "B = " + ov.B + " bins, N = " + int(ov.N) + " applications, M = " + int(M) +
    ", " + int(ov.reps) + " months. Simulated mean " + num(ov.mean, 3) + " against a theoretical " +
    (ov.B - 1) + ", simulated sd " + num(ov.sd, 3) + " against " +
    num(Math.sqrt(2 * (ov.B - 1)), 3) + ", and " + pct(ov.tail, 2) +
    " of months above the 95th percentile of the chi-square.";

  const label = (o) => "B=" + o.B + ", N=" + int(o.N);
  const worst = PRE.chiApprox.filter((c) => c.B === 10);
</script>

<h1 class="body-header">PSI has a sampling distribution</h1>

<p class="body-text">
  Suppose nothing has moved. The bins still will not come out at exactly their
  expected shares, because a month is a sample. Write each bin's shortfall as a
  fraction of what was expected, <span class="mono">u = (a − e)/e</span>, and
  expand the logarithm:
</p>

<div class="eq">{@html katexify("\\sum_i (a_i-e_i)\\ln\\frac{a_i}{e_i} = \\sum_i e_i u_i\\left(u_i - \\tfrac{u_i^2}{2} + \\cdots\\right) \\approx \\sum_i \\frac{(a_i-e_i)^2}{e_i}", true)}</div>

<p class="body-text">
  The leading term is Pearson's chi-square statistic, divided by the sample
  size. So PSI is not a strange object with no distribution: to first order it
  is the oldest goodness-of-fit statistic in statistics, in different units.
  With <span class="mono">N</span> applications this month and
  <span class="mono">M</span> in the development sample, the scaled version has
  the law that statistic always has:
</p>

<div class="eq">{@html katexify("\\left(\\tfrac{1}{N}+\\tfrac{1}{M}\\right)^{-1}\\mathrm{PSI} \\;\\;\\xrightarrow{\\;d\\;}\\;\\; \\chi^2_{B-1}", true)}</div>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth} />
  <div class="pills">
    {#each PRE.overlay as o, i}
      <button class="pill" class:on={pick === i} on:click={() => (pick = i)}>{label(o)}</button>
    {/each}
  </div>
  <div class="ftitle">{int(ov.reps)} simulated months of a population that did not move, against the chi-square density — nothing fitted</div>
  <svg class="overlay" width={BW} height={H} viewBox="0 0 {BW} {H}" role="img"
       aria-label="the simulated distribution of the scaled statistic against the chi-square density">
    {#each ticks(0, yMax, 4) as t}
      <line x1={mg.l} y1={hy(t)} x2={mg.l + pw} y2={hy(t)} stroke="#eef1f5" stroke-width="1" />
      <text x={mg.l - 6} y={hy(t) + 3.2} text-anchor="end" font-size="9" fill={TICK} font-family="var(--font-mono, monospace)">{num(t, 2)}</text>
    {/each}
    {#each ov.density as d, i}
      <rect class="simbar" x={barX(i)} y={hy(d)} width={barW()} height={Math.max(0, hy(0) - hy(d))} fill={SIGNAL} opacity="0.5" />
    {/each}
    <path class="chi" d={theory} fill="none" stroke={THEORY} stroke-width="2.2" />
    <line x1={mg.l} y1={H - mg.b} x2={mg.l + pw} y2={H - mg.b} stroke={AXIS} stroke-width="1" />
    {#each ticks(0, xMax, 5) as t}
      <text x={hx(t)} y={H - mg.b + 13} text-anchor="middle" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{num(t, 0)}</text>
    {/each}
    <text x={mg.l + pw / 2} y={H - 3} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">PSI × (1/N + 1/M)⁻¹</text>
  </svg>
  <div class="legend">
    <span class="key"><i class="sw sig" />simulated months</span>
    <span class="key"><i class="ln th" />chi-square with {ov.B - 1} degrees of freedom</span>
  </div>
  <p class="cap">{caption}</p>
</div>

<p class="body-text">
  A chi-square with <span class="mono">B − 1</span> degrees of freedom has mean
  <span class="mono">B − 1</span>. Undo the scaling and the consequence is the
  one sentence this article exists for:
</p>

<div class="eq">{@html katexify("\\mathbb{E}\\big[\\mathrm{PSI}\\;\\big|\\;\\text{nothing moved}\\big] \\;=\\; (B-1)\\left(\\tfrac{1}{N}+\\tfrac{1}{M}\\right)", true)}</div>

<p class="body-text">
  This is a <span class="bold">bias</span>, not a spread. Because every term is
  non-negative, a noisy month cannot read low to make up for one that read
  high — the noise all points the same way. At ten bins and a
  {int(M)}-application development sample, the average reading on a channel that
  did not move at all is {psiFmt(nullAt(180).mean)} on {int(180)} applications,
  {psiFmt(nullAt(9300).mean)} on {int(9300)}, and {psiFmt(nullAt(200000).mean)} on
  {int(200000)} — simulated, not predicted. Same population. Same model. Same
  month.
</p>

<h2 class="sub-header">One half of the floor never goes away</h2>

<p class="body-text">
  The two terms are not the same kind of thing. The
  <span class="mono">1/N</span> half is fresh noise: a different draw every
  month, averaging to nothing over a year of readings. The
  <span class="mono">1/M</span> half is not noise at all after the first day —
  the bin edges were cut from one particular development sample, and whatever
  that sample got slightly wrong is frozen into every future reading in the same
  direction, for the life of the model.
</p>

<p class="body-text">
  Here it is worth {psiFmt(PRE.frozenByB[B].psiFrozen)} — a permanent floor
  under every month's reading for this scorecard, which is small because the
  development sample was large. Build on {int(2000)} applications instead and
  the same term is {psiFmt((B - 1) / 2000)}, and no amount of monitoring will
  ever see below it.
</p>

<h2 class="sub-header">Where the approximation gives out</h2>

<p class="body-text">
  It is the result the rest of the article leans on, so it is worth being
  explicit about where it stops holding. Below roughly twenty applications per
  bin the chi-square is no longer a good description, and it fails in the
  direction that makes the argument here stronger, not weaker: the real floor is
  <em>higher</em> than the formula says.
</p>

<div class="fig narrow">
  <table class="valid">
    <thead>
      <tr><th>applications per bin</th><th class="r">real floor ÷ formula</th><th class="r">months above the 5% critical value</th></tr>
    </thead>
    <tbody>
      {#each worst as c}
        <tr>
          <td class="mono">{num(c.perBin, 0)}</td>
          <td class="r mono" class:bad={c.ratio > 1.02}>{num(c.ratio, 3)}</td>
          <td class="r mono" class:bad={c.tail > 0.06}>{pct(c.tail, 1)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="cap">
    Ten bins, {int(M)} in the development sample, 80,000 simulated months per
    row; the Monte Carlo error on the middle column is about
    ±{num(PRE.chiApprox[0].ratioSe, 3)}. The bottom of the table is where the
    formula and the world agree; the top is where a monitoring pack for a small
    segment lives.
  </p>
</div>

<p class="body-text">
  Every band this article draws below twenty per bin is therefore simulated
  rather than taken from the formula. Drawing the formula there would flatter it
  at exactly the sample sizes the argument is about.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .eq { max-width: 600px; margin: 1.2rem auto; overflow-x: auto; overflow-y: hidden; padding: 0.2rem 0; text-align: center; }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  .fig { max-width: 700px; margin: 1.4rem auto; padding: 0 0.75rem; }
  .fig.narrow { max-width: 600px; }
  .measure { width: 100%; height: 0; }
  .ftitle { font-family: var(--font-main); font-size: 0.74rem; color: #718096; margin-bottom: 0.15rem; line-height: 1.3; }
  .cap { font-family: var(--font-main); font-size: 0.72rem; color: #718096; line-height: 1.45; margin: 0.4rem 0 0 0; }

  .pills { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.45rem; }
  .pill {
    font-family: var(--font-mono, monospace); font-size: 0.7rem; padding: 0.22rem 0.5rem;
    border: 1px solid #cbd5e0; background: var(--white); border-radius: 999px;
    color: #4a5568; cursor: pointer;
  }
  .pill.on { border-color: var(--primary); color: var(--primary); background: rgba(124, 90, 237, 0.07); }

  .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 0.9rem; font-family: var(--font-main); font-size: 0.7rem; color: #4a5568; margin-top: 0.1rem; }
  .key { display: inline-flex; align-items: center; gap: 0.3rem; }
  .ln { width: 15px; height: 0; border-top: 2.4px solid; display: inline-block; }
  .ln.th { border-color: #2f7d32; }
  .sw { width: 13px; height: 9px; display: inline-block; background: rgba(32, 116, 213, 0.5); }

  .valid { border-collapse: collapse; width: 100%; font-family: var(--font-main); font-size: 0.84rem; }
  .valid th { text-align: left; font-weight: 700; font-size: 0.7rem; color: #718096; border-bottom: 1px solid #cbd5e0; padding: 0.3rem 0.4rem 0.3rem 0; line-height: 1.25; }
  .valid td { padding: 0.24rem 0.4rem 0.24rem 0; color: var(--squid-ink); border-bottom: 1px solid #eef1f5; }
  .valid .r { text-align: right; padding-right: 0; }
  .valid .mono { font-family: var(--font-mono, monospace); font-size: 0.94em; }
  .valid .bad { color: #df2a5d; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .eq { max-width: 84%; font-size: 0.82rem; }
    .fig { padding: 0 0.5rem; }
    .fig.narrow { max-width: 84%; }
  }
</style>
