<script>
  import { PRE, SEGS, M, B, num, int, pct, psiFmt, floorOf, amberPoints } from "../experiments.js";
  const online = PRE.segments[0];
  const broker = PRE.segments[3];
</script>

<h1 class="body-header">The thing to remember</h1>

<p class="body-text">
  Every PSI you'll ever read is really two numbers added together. One of them
  is how far the population moved. The other is
  <span class="mono">(B − 1)(1/N + 1/M)</span>, and it's there whether anything
  moved or not, because every term in the sum is non-negative, so noise has
  nowhere to cancel.
</p>

<p class="body-text">
  On {int(broker.n)} applications with ten bins, that second number is
  {psiFmt(floorOf(broker.n))}, which is most of a reading. On
  {int(online.n)}, it's {psiFmt(floorOf(online.n))}, which is next to nothing.
  So a fixed threshold applied to their sum is really a rule about sample size
  that has been written down as a rule about model risk, and it will keep being
  read the wrong way round. The quiet channel in this article's pack outscored
  the one that lost {int(Math.abs(online.damage.dApprovals))} approvals in
  {pct(broker.pBeatsOnline, 0)} of months. About one month in
  {Math.round(1 / broker.pAmber)}, it crosses the amber line on a population
  that didn't move at all. Meanwhile, {online.name}, the channel that lost those
  approvals, stayed green in every month of the simulated year.
</p>

<p class="body-text">
  The repair is a single subtraction, and every monitoring system in the world
  can make it today, because <span class="mono">B</span>,
  <span class="mono">N</span> and <span class="mono">M</span> are already on the
  page. What it buys is a number that means the same thing on a broker panel as
  on a national channel, which is all anyone wanted from a stability index in
  the first place.
</p>

<p class="body-text">
  What it doesn't buy is a model that's still right. PSI never looks at an
  outcome, which is exactly why it arrives two years before anything else, and
  also exactly why it can't tell you the one thing you most want to know. The
  calibration can slip forty points and the losses can double without the
  histogram moving at all. So keep PSI, fix its threshold, print its bins, and
  put something beside it that knows what the model was for.
</p>

<p class="body-text">
  Finally, treat the 0.10 line as what it turned out to be. It isn't a
  tolerance. It's {num(amberPoints.points, 0)} score points, which is about a
  third of a standard deviation of an entire acquisition channel and
  {num(Math.abs(amberPoints.dApprovalPP), 0)} points of approval rate. By the
  time a population has moved that far, nobody needs a statistic to notice.
</p>

<p class="body-text">
  Thanks for reading!
</p>

<p class="body-text small">
  This article is built on the scaffold and design system of Amazon's
  <a href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a>,
  used under CC BY-SA 4.0. The chi-square result is due to Yurdakul and Naranjo.
  Every number on this page is re-derived from the article's own modules by
  <span class="mono">verify/check-numbers.mjs</span>, and the population
  quantities (bin masses, approval rates, bad rates and AUC) are exact integrals
  against the generating distribution rather than simulations.
</p>

<style>
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
  .small { font-size: 0.84rem; color: #4a5568; margin-top: 2rem; }
  @media screen and (max-width: 950px) { .small { font-size: 0.8rem; } }
</style>
