<script>
  import { PRE, SEGS, M, B, num, int, pct, psiFmt, floorOf, amberPoints } from "../experiments.js";
  const online = PRE.segments[0];
  const broker = PRE.segments[3];
</script>

<h1 class="body-header">The thing to remember</h1>

<p class="body-text">
  Every PSI you will ever read is two numbers added together. One of them is how
  far the population moved. The other is
  <span class="mono">(B − 1)(1/N + 1/M)</span>, and it is there whether anything
  moved or not, because every term in the sum is non-negative and noise has
  nowhere to cancel.
</p>

<p class="body-text">
  On {int(broker.n)} applications with ten bins that second number is
  {psiFmt(floorOf(broker.n))}, which is most of a reading. On
  {int(online.n)} it is {psiFmt(floorOf(online.n))}, which is none of one. A
  fixed threshold applied to their sum is therefore a rule about sample size
  that has been written down as a rule about model risk, and it will keep being
  read the wrong way round. The quiet channel in this article's pack outscored
  the one that lost {int(Math.abs(online.damage.dApprovals))} approvals in
  {pct(broker.pBeatsOnline, 0)} of months; about one month in
  {Math.round(1 / broker.pAmber)} it crosses the amber line on a population that
  did not move at all; and {online.name}, the channel that lost those
  approvals, stayed green in every month of the simulated year.
</p>

<p class="body-text">
  The repair is one subtraction, and it is available in every monitoring system
  in the world today, because <span class="mono">B</span>,
  <span class="mono">N</span> and <span class="mono">M</span> are already on the
  page. What it buys is a number that means the same thing on a broker panel and
  on a national channel — which is the only thing anyone wanted from a stability
  index in the first place.
</p>

<p class="body-text">
  What it does not buy is a model that is still right. PSI never looks at an
  outcome, which is exactly why it arrives two years before anything else and
  exactly why it cannot tell you the one thing you most want to know. The
  calibration can slip forty points, the losses can double, and the histogram
  will not move at all. Keep PSI, fix its threshold, print its bins, and put
  something beside it that knows what the model was for.
</p>

<p class="body-text">
  And treat the 0.10 line for what it turned out to be. It is not a tolerance.
  It is {num(amberPoints.points, 0)} score points — about a third of a standard
  deviation of an entire acquisition channel, and
  {num(Math.abs(amberPoints.dApprovalPP), 0)} points of approval rate. By the
  time a population has moved that far, nobody needed a statistic to notice.
</p>

<p class="body-text small">
  Built on the scaffold and design system of Amazon's
  <a href="https://mlu-explain.github.io/" target="_blank" rel="noreferrer">MLU-Explain</a>,
  used under CC BY-SA 4.0. The chi-square result is due to Yurdakul and Naranjo;
  every number on this page is re-derived from the article's own modules by
  <span class="mono">verify/check-numbers.mjs</span>, and the population
  quantities — bin masses, approval rates, bad rates, AUC — are exact integrals
  against the generating distribution rather than simulations.
</p>

<style>
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
  .small { font-size: 0.84rem; color: #4a5568; margin-top: 2rem; }
  @media screen and (max-width: 950px) { .small { font-size: 0.8rem; } }
</style>
