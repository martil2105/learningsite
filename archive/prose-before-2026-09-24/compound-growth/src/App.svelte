<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import LogScaleFigure from "./Components/LogScaleFigure.svelte";
  import SwingQuiz from "./Components/SwingQuiz.svelte";
  import DragFigure from "./Components/DragFigure.svelte";
  import FanLab from "./Components/FanLab.svelte";
  import katexify from "./katexify.js";

  const doubling = katexify(`T_2 = \\frac{\\ln 2}{\\ln(1+g)} \\approx \\frac{70}{100\\,g}`, true);
  const geo = katexify(`1 + G = \\big[(1+g_1)(1+g_2)\\cdots(1+g_n)\\big]^{1/n}`, true);
  const alt = katexify(`1 + G = \\sqrt{(1+a+s)(1+a-s)} = \\sqrt{(1+a)^2 - s^2} \\;\\approx\\; 1 + a - \\frac{s^2}{2(1+a)}`, true);
  const lognormal = katexify(`\\ln(1 + g_t) \\sim N(\\mu, \\sigma^2): \\qquad \\ln(1+A) = \\mu + \\tfrac12\\sigma^2, \\qquad \\ln(1+G) = \\mu`, true);
  const above = katexify(`\\Pr\\big(Y_t > \\mathrm{E}[Y_t]\\big) = \\Phi\\!\\left(-\\tfrac12\\,\\sigma\\sqrt{t}\\right)`, true);
  const sigmaI = katexify(`\\sigma`);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Let's start with two economies that begin the century equally rich. One
      grows by 2% a year and the other by 3%. That's a small difference, the
      sort that gets lost in a single year's statistical revisions, and yet
      after a hundred years the first economy is 7.2 times as rich as it was and
      the second is 19.2 times as rich, so the second is more than two and a
      half times as rich as the first.
    </p>
    <p>
      That's <span class="bold">compound growth</span>: each year's growth
      applies to everything the earlier years produced, so the economy grows by
      the same percentage of an ever larger amount. On an ordinary axis it
      looks like acceleration. On a <span class="bold">logarithmic axis</span>,
      where each step up multiplies rather than adds, constant growth is a
      straight line, and the steepness of the line is the growth rate. Switch
      between the two views below.
    </p>
  </section>

  <LogScaleFigure />

  <section class="body-text">
    <p>
      On the logarithmic axis, the two straight lines move apart at a constant
      rate, which means the ratio between the two economies grows like an
      economy of its own, at about one percentage point a year. That's where
      the most quoted rule in growth economics comes from, the
      <span class="bold">rule of 70</span>: something growing at <i>g</i>% a
      year doubles in about 70&#8202;/&#8202;<i>g</i> years.
    </p>
    <p class="eq">{@html doubling}</p>
    <p>
      The rule is exact at a growth rate of 1.98%, and at 2% the exact answer is
      35.0 years. It drifts at higher rates, which is why bankers use 72
      instead, since the rule of 72 is exact at 7.85%. Applied to the gap
      between our two economies, it says the richer one's lead doubles every
      71.0 years. So a single percentage point, sustained, is the difference
      between two economies that end the century at equal living standards and
      two that end it with one more than twice as rich as the other.
    </p>
    <p>
      That's the standard lesson, and it's right. But it quietly assumes that
      growth is steady, and real growth isn't. So here's a question about an
      economy whose growth goes up and down.
    </p>
  </section>

  <SwingQuiz />

  <section class="body-text">
    <h3 class="body-header">The average isn't the rate you grew at</h3>
    <p>
      A year of 8% growth followed by a year of 2% decline multiplies income by
      1.08 × 0.98, which is 1.0584, not 1.06. So two years of B grow the
      economy by less than two years of A, even though the growth rates average
      the same 3%. The rate B actually grew at, called its
      <span class="bold">compound annual growth rate</span>, is 2.88%, and
      over fifty years the missing tenth of a point adds up to a 6.1%
      difference in living standards.
    </p>
    <p>
      The simplest version of this is familiar to anyone who has watched a
      share price: a 10% fall followed by a 10% rise leaves you 1% worse off,
      not back where you started. A fall takes a bigger bite out of a larger
      number than the same rise adds back to a smaller one. In general, the
      compound growth rate is the geometric mean of the growth factors,
    </p>
    <p class="eq">{@html geo}</p>
    <p>
      and a geometric mean is always below the ordinary average unless
      everything is equal. For growth that alternates between <i>a</i> + <i>s</i>
      and <i>a</i> − <i>s</i>, the gap has an exact formula:
    </p>
    <p class="eq">{@html alt}</p>
    <p>
      So the penalty for swinging grows with the square of the swing. The figure
      below plots it for an average of 3%. Small swings cost almost nothing, but
      the cost grows quickly, and an economy that swings by 24.7 points either
      side of 3% doesn't grow at all.
    </p>
  </section>

  <DragFigure />

  <section class="body-text">
    <p>
      The dashed curve is the approximation in the formula above, the average
      minus half the squared swing, and it's hard to tell apart from the exact
      curve until the swings are very large. This penalty is often called
      <span class="bold">volatility drag</span>. For a rich country's GDP, whose
      growth rate moves by a couple of points from year to year, it's about two
      hundredths of a percentage point, which is why growth economists rarely
      mention it. As we'll see next, for anything more volatile it becomes the
      main event.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">When growth is uncertain</h3>
    <p>
      Alternating booms and busts are a toy. A better model makes each year's
      growth random: independent from year to year, with a spread measured by
      {@html sigmaI}, the standard deviation of the logarithm of the growth
      factor. The lab below runs 400 economies like that for fifty years, all
      with the same expected growth of 2% a year, and draws every one of them.
      Two lines summarise them. The dashed line is the
      <span class="bold">expected level</span>, the average across all
      possible economies, and the blue line is the
      <span class="bold">median</span>, the economy in the middle.
    </p>
  </section>

  <FanLab />

  <section class="body-text">
    <p>
      The dashed line never moves. Whatever you do to {@html sigmaI}, the
      expected level after fifty years is 2.69 times the starting level, because
      the expected growth is 2% every year. The median moves a lot. At a
      volatility of 2%, roughly what a country's GDP growth shows, the median
      economy ends up 2.66 times as rich and nearly half of the paths finish
      above the expected level. At 15%, which is more like the year-to-year
      swings in one household's earnings, the median ends up only 1.53 times as
      rich. And at 20%, typical of a single company's shares, the median economy
      is worth 0.99 of what it started with after fifty years: the typical path
      went nowhere while the expected one grew 2.69 times.
    </p>
    <p>
      The expected level is still correct, and it's reached the way an average
      of a skewed quantity usually is, by a few paths that do spectacularly well.
      The fraction of paths that end above it has an exact formula, and it
      shrinks as time passes:
    </p>
    <p class="eq">{@html above}</p>
    <p>
      After fifty years that's 47.2% at a volatility of 2%, 29.8% at 15% and 24.0%
      at 20%, and the simulated shares in the lab land close to those, as a
      sample of 400 should. Give it long enough, and almost every path ends up
      below the average of all of them.
    </p>
    <p>
      This difference between the average across possible outcomes and what
      happens along one path over time is the subject of what Ole Peters has
      called the <span class="bold">ergodicity problem</span> in economics. The
      practical upshot is a question worth asking of any forecast: is it a
      statement about the average of many outcomes, or about the one you're
      actually going to live through?
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The maths</h3>
    <p>
      A quantity growing at a constant rate <i>g</i> doubles in
      ln&#8202;2&#8202;/&#8202;ln(1&nbsp;+&nbsp;<i>g</i>) years, and since
      ln&#8202;2 is 0.693 and ln(1&nbsp;+&nbsp;<i>g</i>) is a little less than
      <i>g</i>, the right numerator for small rates is a little above 69, which
      is where 70 comes from. For random growth, if the logarithm of each year's
      growth factor is normal with mean <i>μ</i> and variance
      {@html sigmaI}<sup>2</sup>, the arithmetic and compound rates, <i>A</i> and
      <i>G</i>, satisfy
    </p>
    <p class="eq">{@html lognormal}</p>
    <p>
      so the expected level grows at <i>A</i> and the median at <i>G</i>, and
      their logarithms drift apart by exactly half the variance every year.
      After <i>t</i> years, the log of the level is normal with mean <i>μt</i>
      and standard deviation {@html sigmaI}√<i>t</i>, and the expected level sits
      ½{@html sigmaI}√<i>t</i> standard deviations above the median, which gives
      the share of paths above it.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      The lab makes growth independent from year to year and lognormal, and
      neither is quite true of economies.
    </p>
    <p>
      First, GDP tends to bounce back after a recession, at least partly, so bad
      years are followed by better-than-average ones more often than independence
      allows, and that reduces the drag. Second, real growth has fatter tails
      than a normal distribution, with rare collapses that are bigger than the
      model expects, and that increases it. Third, the volatility itself has to
      be estimated, usually from a few decades of data, which is a short sample
      for a number whose square matters. And finally, the expected level isn't
      wrong, just often irrelevant. It's the right number for the total of many
      independent paths added together, which is exactly why an insurer or a
      diversified investor can use it, and the wrong number for any one of them.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Where this leaves the average</h3>
    <p>
      Compound growth turns small differences in growth rates into large
      differences in living standards, and a one-point gap doubles the gap
      between two economies in about seventy years. What the rule assumes is
      steady growth. With swings, the rate an economy actually grows at is the
      average growth rate minus roughly half the variance, and with uncertain
      growth the expected path and the typical one drift apart for ever, at
      exactly that rate. For a whole country the difference is small. For a
      household, a firm or a portfolio, it can be the whole story.
    </p>
    <p>Thanks for reading!</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Sources and notes</h3>
    <p>
      The rule of 70 and the geometric mean are standard. The ergodicity framing
      is from Ole Peters, "The ergodicity problem in economics", <i>Nature
      Physics</i> 15, 2019, pages 1216–1221. The volatilities quoted for GDP, a
      household's earnings and a company's shares are round illustrative values,
      not estimates.
    </p>
    <p>
      The economies, the question, the figures and every value quoted are mine.
      Every number in this article is re-derived by
      <span class="mono">verify/check-numbers.mjs</span> from the same modules
      the page draws from, the exact share of paths above the expected level is
      checked against a separate simulation of 20,000 paths, and the figures are
      checked in rendered pixels at 390px and 1280px. The page is built on the
      scaffold and design system of Amazon's
      <a href="https://mlu-explain.github.io/">MLU-Explain</a>, used under CC
      BY-SA 4.0.
    </p>
  </section>
</main>

<style>
  main {
    padding-bottom: 4rem;
  }

  .eq {
    margin: 0.6rem 0;
  }

  .mono {
    font-family: var(--font-mono);
    font-size: 0.9em;
  }
</style>
