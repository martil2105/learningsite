<script>
  /*
    The first of the two free parameters nobody records. B is chosen by whoever
    wrote the function, never appears in the monitoring report, and is worth a
    factor of fourteen on the same data.
  */
  import { PRE, M, num, int, psiFmt, pct } from "../experiments.js";
  import { linear, pathOf, ticks } from "../chart.js";
  import { SIGNAL, FLOOR, MARK, THEORY, INK, AXIS, TICK, LABEL, RULE } from "../palette.js";

  const SW = PRE.binSweep;
  const N = PRE.binSweepMeta.N;
  const SHIFT = PRE.binSweepMeta.shiftPoints;
  const DPI = PRE.dpi;
  let sel = SW.findIndex((s) => s.B === 10);
  $: cur = SW[sel];

  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  const H = 230;
  const mg = { l: 44, r: 14, t: 16, b: 38 };
  $: pw = Math.max(60, BW - mg.l - mg.r);
  $: band = pw / SW.length;
  $: yMax = Math.max(...SW.map((s) => s.rawMean)) * 1.1;
  $: sy = linear(0, yMax, H - mg.t - mg.b + mg.t, mg.t);
  /* Reactive, never const: both read band / sy. */
  $: bx = (i) => mg.l + band * i + band * 0.15;
  $: bw = () => Math.max(1.5, band * 0.7);
  $: truePath = pathOf(SW.map((s, i) => [mg.l + band * i + band / 2, sy(s.adjTarget)]));
  /* where the bins get too thin for the correction to work - the same limit
     the validity table in the previous section measures, arriving again */
  const THIN = 60;
  $: thinFrom = SW.findIndex((s) => s.perBin < THIN);

  const first = SW[0], last = SW[SW.length - 1];
  const ratio = last.rawMean / first.rawMean;
  const NEST = PRE.nested;
  const nestOk = NEST.every((r, i) => i === 0 || r.psi >= NEST[i - 1].psi - 1e-12);
</script>

<h1 class="body-header">The two settings that aren't in the report</h1>

<p class="body-text">
  A monitoring pack prints a channel, a date, a sample size and a number. What
  it doesn't print is how many bins that number was computed over, or what the
  function did about an empty bin. Both of these settings change the answer, but
  only one of them is well known.
</p>

<h2 class="sub-header">Bins</h2>

<p class="body-text">
  Using ten bins is a convention, not a result. To see what the choice does,
  let's take the Motor dealer channel, which has a real {int(SHIFT)}-point drift
  and {int(N)} applications, and compute its PSI at every bin count from two to
  a hundred. The month, the data and the shift all stay the same. Drag the
  slider to change the bin count.
</p>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth} />
  <div class="ftitle">What the pack would print, split into the part that moved and the part that is the sample size</div>
  <svg class="sweep" width={BW} height={H} viewBox="0 0 {BW} {H}" role="img"
       aria-label="the reading at each bin count, split into the real movement and the noise floor">
    {#each ticks(0, yMax, 4) as t}
      <line x1={mg.l} y1={sy(t)} x2={mg.l + pw} y2={sy(t)} stroke="#eef1f5" stroke-width="1" />
      <text x={mg.l - 6} y={sy(t) + 3.2} text-anchor="end" font-size="9" fill={TICK} font-family="var(--font-mono, monospace)">{num(t, 2)}</text>
    {/each}
    {#if thinFrom >= 0}
      <rect x={mg.l + band * thinFrom} y={mg.t} width={Math.max(0, pw - band * thinFrom)} height={sy(0) - mg.t} fill="#f5f7f9" />
      <text x={mg.l + pw - 4} y={mg.t + 10} text-anchor="end" font-size="9" fill={LABEL} font-family="var(--font-main)">under {THIN} applications per bin</text>
    {/if}
    {#each SW as s, i}
      <rect class="flr" data-b={s.B} x={bx(i)} y={sy(s.rawMean)} width={bw()} height={Math.max(0, sy(s.rawMean - s.floor) - sy(s.rawMean))}
            fill={FLOOR} opacity={sel === i ? 0.85 : 0.5} />
      <rect class="sig" data-b={s.B} x={bx(i)} y={sy(s.rawMean - s.floor)} width={bw()} height={Math.max(0, sy(0) - sy(s.rawMean - s.floor))}
            fill={SIGNAL} opacity={sel === i ? 1 : 0.72} />
    {/each}
    <path class="truth" d={truePath} fill="none" stroke={THEORY} stroke-width="2" stroke-dasharray="4 3" />
    <line x1={mg.l} y1={sy(0)} x2={mg.l + pw} y2={sy(0)} stroke={AXIS} stroke-width="1" />
    {#each SW as s, i}
      {#if [2, 5, 10, 20, 50, 100].includes(s.B)}
        <text x={mg.l + band * i + band / 2} y={sy(0) + 13} text-anchor="middle" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{s.B}</text>
      {/if}
    {/each}
    <text x={mg.l + pw / 2} y={H - 4} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">number of bins</text>
  </svg>
  <div class="legend">
    <span class="key"><i class="sw sig" />what really moved</span>
    <span class="key"><i class="sw fl" />the noise floor, (B−1)(1/N + 1/M)</span>
    <span class="key"><i class="ln th" />what the correction is estimating</span>
  </div>
  <label class="ctl">
    <input class="bins" aria-label="number of bins" type="range" min="0" max={SW.length - 1} step="1" bind:value={sel} />
    <span class="cv sweepcv" data-b={cur.B}>
      {cur.B} bins, {num(cur.perBin, 0)} per bin  ·  prints {psiFmt(cur.rawMean)}  ·  floor {psiFmt(cur.floor)}  ·  corrected {psiFmt(cur.adjMean)}
    </span>
  </label>
</div>

<p class="body-text">
  The printed number runs from {psiFmt(first.rawMean)} at {first.B} bins to
  {psiFmt(last.rawMean)} at {last.B}. That's a factor of {num(ratio, 0)}, on data
  that did exactly one thing. The corrected number, on the other hand, runs from
  {psiFmt(SW.find((s) => s.B === 2).adjMean)} to
  {psiFmt(last.adjMean)} and tracks the dashed line, which is the quantity that
  subtraction estimates: the divergence between the two populations, with the
  development sample's own frozen error taken off along with the rest of the
  floor. So finer bins really do see a little more of the shift, but the rest of
  the climb is floor.
</p>

<p class="body-text">
  The shaded right-hand end of the chart is where that stops being true. It's
  the same failure we saw at the top of the validity table in the section on
  PSI's sampling distribution, just wearing a different hat. More bins at a
  fixed {int(N)} applications means fewer applications in each bin, and below
  about {int(60)} per bin, the chi-square formula <em>understates</em> the real
  floor. As a result, the subtraction doesn't take off enough, and the corrected
  reading starts climbing again on what's left over. At {int(100)} bins, there
  are {num(SW[SW.length - 1].perBin, 0)} applications in each, and about a fifth
  of what remains is still floor. This gives us a reason to keep the bin count
  modest that has nothing to do with how big the raw number looks. Past a
  certain point, more bins stop adding resolution and start adding noise that
  the correction can't reach.
</p>

<p class="body-text">
  There's a reason why refining the bins can only push the raw number up. PSI
  is a divergence, and divergences obey a data-processing inequality: throwing
  information away, for example by merging two adjacent bins, can never
  increase one. Across
  {int(DPI.trials)} merges of random pairs, {DPI.violations === 0 ? "not one increased PSI" : DPI.violations + " increased PSI"}. And if we
  take a genuinely nested chain, with {NEST[NEST.length - 1].B} quantile bins
  merged two at a time down to {NEST[0].B}, PSI climbs the whole way from coarse
  to fine:
</p>

<div class="chain">
  {#each NEST as r, i}
    <span class="ch">
      <span class="cb">{r.B}</span>
      <span class="cp">{psiFmt(r.psi)}</span>
    </span>
    {#if i < NEST.length - 1}<span class="arrow">→</span>{/if}
  {/each}
</div>

<p class="body-text">
  However, quantile bins at two different counts aren't nested, so nothing
  forces the middle of that first chart to rise smoothly, and in fact it doesn't
  quite. The true divergence at {int(8)} bins is
  {psiFmt(SW.find((s) => s.B === 8).truePsi)}, which is fractionally below the
  {psiFmt(SW.find((s) => s.B === 6).truePsi)} at {int(6)}. The inequality is
  about refinement, not about the size of the number.
</p>

<p class="body-text">
  The practical consequence is both duller and worse than "PSI depends on the
  bins". It's that <span class="bold">two teams monitoring the same model with
  the same data will report different numbers against the same threshold</span>,
  and nothing in the report will say why. So fix the bin count, fix the edges,
  and write both of them on the page.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .fig { max-width: 700px; margin: 1.4rem auto; padding: 0 0.75rem; }
  .measure { width: 100%; height: 0; }
  .ftitle { font-family: var(--font-main); font-size: 0.74rem; color: #718096; margin-bottom: 0.15rem; line-height: 1.3; }
  .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 0.9rem; font-family: var(--font-main); font-size: 0.7rem; color: #4a5568; margin-top: 0.1rem; }
  .key { display: inline-flex; align-items: center; gap: 0.3rem; }
  .sw { width: 13px; height: 9px; display: inline-block; }
  .sw.sig { background: #2074d5; }
  .sw.fl { background: rgba(138, 148, 162, 0.6); }
  .ln { width: 15px; height: 0; border-top: 2.2px dashed; display: inline-block; border-color: #2f7d32; }
  .ctl { display: block; margin-top: 0.35rem; }
  .cv { display: block; font-family: var(--font-mono, monospace); font-size: 0.72rem; color: var(--squid-ink); line-height: 1.4; }
  input[type="range"] { width: 100%; accent-color: var(--primary); margin: 0.1rem 0; }

  .chain {
    max-width: 600px; margin: 1rem auto; display: flex; flex-wrap: wrap;
    align-items: center; justify-content: center; gap: 0.3rem 0.5rem;
  }
  .ch { display: inline-flex; flex-direction: column; align-items: center; }
  .cb { font-family: var(--font-heavy); font-size: 0.78rem; color: var(--squid-ink); }
  .cp { font-family: var(--font-mono, monospace); font-size: 0.72rem; color: #2074d5; }
  .arrow { color: #cbd5e0; font-size: 0.9rem; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .fig { padding: 0 0.5rem; }
    .chain { max-width: 84%; }
  }
</style>
