<script>
  import { PRE, POP, M, B, num, int, pct, psiFmt } from "../experiments.js";
  import katexify from "../katexify.js";
  const online = PRE.segments[0];
</script>

<h1 class="body-header">The case for PSI, made properly</h1>

<p class="body-text">
  It would be easy to read the last few sections as an argument that the whole
  thing is worthless. It is not, and the reason is worth being precise about,
  because it is also the reason the fix at the end is a subtraction rather than a
  replacement.
</p>

<p class="body-text">
  <span class="bold">It needs no outcomes.</span> This is not a minor
  convenience, it is the whole game. A consumer loan written in January cannot
  be called good or bad until the following January at the earliest, and a
  twelve-month definition of default plus a performance window plus the time to
  assemble the data means the first honest backtest of a scorecard lands
  somewhere between eighteen and thirty months after it goes live. Every measure
  of whether a model is <em>right</em> — AUC, the Gini, calibration, the
  observed-against-expected table in the last section — is on that clock. PSI is
  available on the first working day of the month. There is no other statistic
  in the pack that can say anything at all that early, and the industry did not
  adopt it because it was confused.
</p>

<p class="body-text">
  <span class="bold">It decomposes.</span> The sum is over bins and every term is
  non-negative, so "PSI is {psiFmt(online.truePsi)}" is always refinable into
  "and {pct((PRE.mirror.termsDown[0] + PRE.mirror.termsDown[1]) / PRE.mirror.psiDown, 0)}
  of it is the bottom two deciles filling up". That is a real finding about a
  real channel, and it arrives free with the number.
</p>

<p class="body-text">
  <span class="bold">It estimates something.</span> Because PSI is the
  Kullback–Leibler divergence <span class="mono">J</span> rather than an index,
  it converges to a population quantity as the month gets longer, and that
  quantity does not depend on the sample size. Everything in this article that
  looks like a repair — the floor, the correction, the critical value — is
  available only because PSI is a real estimator of a real thing. An index would
  have had nothing to correct toward.
</p>

<p class="body-text">
  <span class="bold">And at a sensible sample size it works.</span> On the Online
  channel, {int(online.n)} applications, the reading was
  {psiFmt(online.q05)} to {psiFmt(online.q95)} across simulated months against a
  floor of {psiFmt(online.floor)} — an unmistakable signal, correctly detected,
  months before any outcome existed. The complaint in this article is not that
  PSI failed to see the shift. It is that the pack printed
  <em>no significant change</em> underneath it.
</p>

<h2 class="sub-header">What the alternatives actually offer</h2>

<p class="body-text">
  Every replacement proposed for PSI over the years has the same shape and most
  have the same problem. A Kolmogorov–Smirnov statistic has a null distribution
  that scales like <span class="mono">1/√N</span>, so a fixed KS threshold is
  wrong in exactly the way a fixed PSI threshold is wrong. A chi-square test of
  homogeneity is <em>PSI with the scaling left in</em> — the same statistic to
  first order, honestly labelled, and at a few million transactions a month it
  rejects everything, which is why nobody uses it there. Earth-mover distance
  keeps the sign and the units, which is a real advantage, and needs a metric on
  the score, which a raw scorecard point does not obviously have.
</p>

<p class="body-text">
  None of them is a way out, because the thing everyone actually wants — a
  label-free statistic that says whether the model is still right — does not
  exist. A shift in the inputs is not the same event as a model going wrong, and
  no amount of looking at inputs will turn one into the other. PSI's honest job
  description is narrow and useful: <span class="bold">it says whether the
  population the model is scoring is the population it was fitted on, with a
  known sampling distribution, before any outcome is available.</span> Read that
  way it is a good statistic that has been asked the wrong question for thirty
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
