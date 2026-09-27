<script>
  /*
    The closing loop: the same month the article opened on, with the floor
    subtracted and the band printed next to the reading. Same seed, same draw,
    same counts - drawMonth is shared with FourReports - so nothing here is a
    second, luckier month.
  */
  import { PRE, SEGS, M, B, drawMonth, nullBand, floorOf, criticalOf,
           num, int, pct, psiFmt, POP } from "../experiments.js";
  import { linear, log as logScale } from "../chart.js";
  import { SIGNAL, MARK, FLOOR, INK, AXIS, TICK, LABEL, RULE, ZONE } from "../palette.js";

  let month = 1;
  $: rows = drawMonth(month);
  $: table = SEGS.map((s, i) => {
    const v = rows[i].psi;
    const band = nullBand(s.n);
    return {
      ...s, reading: v, band,
      floor: floorOf(s.n), adj: v - floorOf(s.n),
      beyond: v > band.q95,
    };
  });

  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  $: wide = BW > 620;
  $: barW = Math.max(90, Math.min(240, BW * 0.3));
  $: bx = logScale(1e-4, 0.35, 0, barW);
  $: bclamp = (v) => Math.max(0, Math.min(barW, bx(Math.max(1.05e-4, v))));
</script>

<h1 class="body-header">What to print instead</h1>

<p class="body-text">
  Fixing this doesn't need a new statistic, a new library or a model-risk paper.
  All it needs is four columns where there's currently one.
</p>

<h2 class="sub-header">1. Subtract the floor</h2>

<p class="body-text">
  The floor, <span class="mono">(B − 1)(1/N + 1/M)</span>, is built from three
  numbers the pack already knows. Subtracting it turns a reading that can't be
  compared across channels into one that can. Here's the month this article
  opened on, with just that one change.
</p>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth} />
  <div class="tablewrap">
    <table class="fixedpack">
      <thead>
        <tr>
          <th>channel</th>
          <th class="r">N</th>
          <th class="r">PSI</th>
          <th class="r">floor</th>
          <th class="r">corrected</th>
          {#if wide}<th>against the no-drift band</th>{/if}
          <th>band</th>
        </tr>
      </thead>
      <tbody>
        {#each table as r}
          <tr>
            <td class="nm">{r.name}</td>
            <td class="r mono">{int(r.n)}</td>
            <td class="r mono">{num(r.reading, 4)}</td>
            <td class="r mono dim">−{num(r.floor, 4)}</td>
            <td class="r mono strong" class:pos={r.adj > 0.002}>{num(r.adj, 4)}</td>
            {#if wide}
              <td>
                <svg width={barW} height="16" viewBox="0 0 {barW} 16" role="img" aria-label="reading against the no-drift band">
                  <line x1="0" y1="8" x2={barW} y2="8" stroke="#eef1f5" stroke-width="1" />
                  <rect x={bclamp(r.band.q05)} y="3" width={Math.max(1.5, bclamp(r.band.q95) - bclamp(r.band.q05))} height="10" fill="rgba(138,148,162,0.35)" />
                  <circle cx={bclamp(r.reading)} cy="8" r="3.6" fill={r.beyond ? SIGNAL : FLOOR} stroke="#fff" stroke-width="1.2" />
                </svg>
              </td>
            {/if}
            <td class="vd" class:beyond={r.beyond}>{r.beyond ? "outside" : "inside"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="ctl">
    <button class="pill" on:click={() => (month += 1)}>next month</button>
    <span class="cap">
      The grey bar shows where a reading would fall 90% of the time if that
      channel's population hadn't moved, and the dot is this month's reading. A
      dot outside its bar means the test is firing, which also happens about one
      month in twenty on a channel that didn't move.
    </span>
  </div>
</div>

<p class="body-text">
  What the correction buys us is comparability, and it buys it on average
  rather than in every single month. Over a long run, the corrected readings
  settle at {psiFmt(SEGS[0].expAdj)} for Online, {psiFmt(SEGS[2].expAdj)} for
  Motor dealer, and {psiFmt(SEGS[1].expAdj)} for both channels that didn't
  move. That's the same number at {int(SEGS[3].n)} applications as at
  {int(SEGS[1].n)}, which is exactly what the raw column couldn't manage. In any
  <em>particular</em> month, however, the readings still wander, which is why
  the band beside them isn't just decoration.
</p>

<p class="body-text">
  Try pressing <em>next month</em> through a whole year, and watch the last
  column rather than the numbers. When each channel is compared against its own
  no-drift band at the 5% level, Online is flagged in {pct(SEGS[0].pFlag, 0)} of
  months and Motor dealer in {pct(SEGS[2].pFlag, 0)}, while the two channels
  that didn't move are flagged in {pct(SEGS[1].pFlag, 0)} and
  {pct(SEGS[3].pFlag, 0)} of them. Those last two numbers aren't failures.
  They're what a five per cent test does, stated in advance, on a statistic
  whose distribution is known, and that's something the fixed thresholds never
  offered in either direction.
</p>

<h2 class="sub-header">2. Print the band, not just the number</h2>

<p class="body-text">
  The corrected reading is an estimate, and estimates have error bars. At
  {int(SEGS[3].n)} applications, its standard error is
  {psiFmt(Math.sqrt(2 * (B - 1)) * (1 / SEGS[3].n + 1 / M))}, which is larger
  than most of the shifts anyone cares about. So the honest output for that
  channel isn't a corrected number at all. It's a sentence:
  <em>this window can't distinguish a {num(PRE.power[0].fixedPts, 0)}-point
  shift from nothing, and here's the band</em>. A corrected value that comes out
  negative isn't a bug either. It's what an unbiased estimate of a non-negative
  quantity does when the quantity is near zero, and it carries information.
</p>

<p class="body-text">
  If we want a single number, the sample-size-aware critical value takes just
  one line, and it's the test the thresholds were pretending to be:
</p>

<div class="crit">
  <span class="mono">PSI &gt; χ²<sub>0.95, B−1</sub> × (1/N + 1/M)</span>
  <span class="sep">·</span>
  <span class="cx">{int(180)} applications → {psiFmt(criticalOf(180))}</span>
  <span class="cx">{int(9300)} → {psiFmt(criticalOf(9300))}</span>
  <span class="cx">{int(44000)} → {psiFmt(criticalOf(44000))}</span>
</div>

<h2 class="sub-header">3. Write down the bins</h2>

<p class="body-text">
  The bin count, the edges and the zero substitute belong in the report next to
  the number, because all three change it, and right now none of them is
  visible. Freeze the edges at the development sample and never re-derive them,
  otherwise the series isn't really a series. And if a characteristic gains a
  level that didn't exist at development time, say so in words rather than
  letting a default argument decide how alarming it is.
</p>

<h2 class="sub-header">4. Say what it costs, not what it scores</h2>

<p class="body-text">
  PSI comes in units nobody has an intuition for, but every reading can be
  translated into units people do understand. For example, this month's Online
  shift amounts to
  {num(Math.abs(PRE.segments[0].damage.dMean), 1)} points of mean score,
  {num(Math.abs(PRE.segments[0].damage.dApprovalPP), 1)} points of approval rate
  and {int(Math.abs(PRE.segments[0].damage.dApprovals))} fewer approvals. At the
  other end of the scale, consider a transaction-monitoring model scoring
  {int(PRE.large.N)} transactions a month. There, a PSI of
  {num(PRE.large.psi, 2)}, deep inside the green, is
  {num((PRE.large.psi - PRE.large.floor) / (Math.sqrt(2 * (B - 1)) * (1 / PRE.large.N + 1 / M)), 0)}
  standard errors above its floor. With a rule that alerts on the worst
  {pct(0.01, 0)} of transactions, it also means {num(PRE.large.alertRatio, 2)}
  times the alert volume. That's {num((PRE.large.alertRatio - 1) * 100, 0)} per
  cent more work for the investigations team, reported as
  <em>no significant change</em>.
</p>

<h2 class="sub-header">5. Let it be a number, not a colour</h2>

<p class="body-text">
  The traffic light is what turns a statistic with a known sampling
  distribution into a verdict with none. It also fails a palette check, which is
  a small thing next to the rest, but it's worth knowing. The conventional amber
  sits at {num(1.92, 2)}:1 against this page, below the 3:1 floor for a mark,
  and every amber dark enough to clear that floor collapses toward either the
  green or the red under the most common form of colour blindness. In other
  words, there's no accessible green-amber-red, and there was never a good
  reason for the verdict to be three colours in the first place.
</p>

<h2 class="sub-header">What this doesn't fix</h2>

<p class="body-text">
  There are three things this doesn't fix, so let's state them plainly. First,
  the chi-square law assumes the month is an independent sample, and a real
  month isn't. Applications arrive in correlated bursts, campaigns run for
  weeks, and a serially dependent population has a wider null band than the
  formula says, so the correction gives us the floor rather than the whole
  answer. Second, below about twenty applications per bin, the formula
  understates the floor, so the band has to be simulated. And third, none of
  this touches PSI's two blind spots: what happens inside a bin, and what
  happens to the relationship between the score and the outcome. Those aren't
  calibration problems. They're part of what PSI is, and the answer to them is a
  different measurement, not a better threshold.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
  .fig { max-width: 760px; margin: 1.4rem auto; padding: 0 0.75rem; }
  .measure { width: 100%; height: 0; }
  .tablewrap { overflow-x: auto; }
  .fixedpack { border-collapse: collapse; width: 100%; font-family: var(--font-main); font-size: 0.84rem; }
  .fixedpack th { text-align: left; font-weight: 700; font-size: 0.7rem; color: #718096; border-bottom: 1px solid #cbd5e0; padding: 0.3rem 0.5rem 0.3rem 0; white-space: nowrap; }
  .fixedpack td { padding: 0.32rem 0.5rem 0.32rem 0; color: var(--squid-ink); border-bottom: 1px solid #eef1f5; white-space: nowrap; }
  .fixedpack .r { text-align: right; padding-right: 0.6rem; }
  .fixedpack .nm { font-family: var(--font-heavy); }
  .fixedpack .mono { font-family: var(--font-mono, monospace); font-size: 0.94em; }
  .fixedpack .dim { color: #a0aec0; }
  .fixedpack .strong { font-weight: 700; }
  .fixedpack .strong.pos { color: #2074d5; }
  .vd { font-size: 0.72rem; color: #8a94a2; }
  .vd.beyond { color: #2074d5; font-weight: 700; }

  .ctl { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 0.6rem; flex-wrap: wrap; }
  .pill {
    font-family: var(--font-main); font-size: 0.76rem; padding: 0.3rem 0.66rem;
    border: 1px solid var(--primary); background: var(--white); border-radius: 999px;
    color: var(--primary); cursor: pointer; white-space: nowrap;
  }
  .cap { font-family: var(--font-main); font-size: 0.72rem; color: #718096; line-height: 1.45; flex: 1 1 240px; }

  .crit {
    max-width: 600px; margin: 1rem auto; display: flex; flex-wrap: wrap; align-items: center;
    gap: 0.3rem 0.7rem; font-size: 0.8rem; color: var(--squid-ink);
    background: #f8fafb; border: 1px solid #e8ecf0; border-radius: 5px; padding: 0.55rem 0.7rem;
  }
  .crit .sep { color: #cbd5e0; }
  .cx { font-family: var(--font-mono, monospace); font-size: 0.74rem; color: #4a5568; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .fig { padding: 0 0.5rem; }
    .crit { max-width: 84%; }
  }
</style>
