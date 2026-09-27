<script>
  import { PRE, POP, M, B, num, int, pct, psiFmt } from "../experiments.js";
  import katexify from "../katexify.js";
  const online = PRE.segments[0];
</script>

<h1 class="body-header">The case for PSI, made properly</h1>

<p class="body-text">
  It would be easy to read the last few sections as an argument that PSI is
  worthless. It isn't, and it's worth being precise about why, because the same
  reason explains why the fix at the end is a subtraction rather than a
  replacement.
</p>

<p class="body-text">
  <span class="bold">First, it needs no outcomes.</span> This isn't a minor
  convenience. It's the whole game. A consumer loan written in January can't be
  called good or bad until the following January at the earliest. Add a
  twelve-month definition of default, a performance window and the time it
  takes to assemble the data, and the first honest backtest of a scorecard lands
  somewhere between eighteen and thirty months after it goes live. Every measure
  of whether a model is <em>right</em>, including AUC, the Gini, calibration and
  the observed-against-expected table in the last section, runs on that clock.
  PSI, on the other hand, is available on the first working day of the month.
  No other statistic in the pack can say anything at all that early, and the
  industry didn't adopt PSI because it was confused.
</p>

<p class="body-text">
  <span class="bold">Second, it decomposes.</span> The sum runs over bins, and
  every term is non-negative, so "PSI is {psiFmt(online.truePsi)}" can always be
  refined into "and {pct((PRE.mirror.termsDown[0] + PRE.mirror.termsDown[1]) / PRE.mirror.psiDown, 0)}
  of it is the bottom two deciles filling up". That's a real finding about a
  real channel, and it comes free with the number.
</p>

<p class="body-text">
  <span class="bold">Third, it estimates something.</span> Because PSI is the
  Kullback–Leibler divergence <span class="mono">J</span> rather than an index,
  it converges to a population quantity as the month gets longer, and that
  quantity doesn't depend on the sample size. Everything in this article that
  looks like a repair, whether it's the floor, the correction or the critical
  value, is only possible because PSI is a real estimator of a real thing. An
  index would have had nothing to correct toward.
</p>

<p class="body-text">
  <span class="bold">Finally, at a sensible sample size, it works.</span> On the
  Online channel, with {int(online.n)} applications, the reading ranged from
  {psiFmt(online.q05)} to {psiFmt(online.q95)} across simulated months, against
  a floor of {psiFmt(online.floor)}. That's an unmistakable signal, correctly
  detected, months before any outcome existed. The complaint in this article
  isn't that PSI failed to see the shift. It's that the pack printed
  <em>no significant change</em> underneath it.
</p>

<h2 class="sub-header">What the alternatives actually offer</h2>

<p class="body-text">
  Every replacement proposed for PSI over the years has the same shape, and
  most of them have the same problem. A Kolmogorov–Smirnov statistic has a null
  distribution that scales like <span class="mono">1/√N</span>, so a fixed KS
  threshold is wrong in exactly the same way as a fixed PSI threshold. A
  chi-square test of homogeneity is <em>PSI with the scaling left in</em>. It's
  the same statistic to first order, just honestly labelled, and at a few
  million transactions a month it rejects everything, which is why nobody uses
  it at that scale. Earth-mover distance keeps the sign and the units, which is
  a real advantage, but it needs a metric on the score, and a raw scorecard
  point doesn't obviously have one.
</p>

<p class="body-text">
  None of them is a way out, because the thing everyone actually wants, a
  label-free statistic that says whether the model is still right, doesn't
  exist. A shift in the inputs isn't the same event as a model going wrong, and
  no amount of looking at inputs will turn one into the other. PSI's honest job
  description is narrow but useful: <span class="bold">it says whether the
  population the model is scoring is the population it was fitted on, with a
  known sampling distribution, before any outcome is available.</span> Read that
  way, it's a good statistic that has been asked the wrong question for thirty
  years.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
  @media screen and (max-width: 950px) { .sub-header { max-width: 80%; font-size: 1.18rem; } }
</style>
