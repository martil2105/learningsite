<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import LogScaleFigure from "./Components/LogScaleFigure.svelte";
  import SwingQuiz from "./Components/SwingQuiz.svelte";
  import DragFigure from "./Components/DragFigure.svelte";
  import FanLab from "./Components/FanLab.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import {
    doublingTime, gapDoublingTime, ruleExactAt, compoundRate, zeroGrowthSwing,
    expectedLevel, medianLevel, shareAboveMean,
  } from "./growth.js";
  import {
    RICH, FAST, YEARS, STEADY, BOOM, BUST, Q_YEARS, MEAN_GROWTH, LAB_YEARS, LAB_PATHS,
    SIGMA_DEFAULT, SIGMA_GDP, SIGMA_EQUITY,
  } from "./datasets.js";

  const doubling = katexify(`T_2 = \\frac{\\ln 2}{\\ln(1+g)} \\approx \\frac{70}{100\\,g}`, true);
  const geo = katexify(`1 + G = \\big[(1+g_1)(1+g_2)\\cdots(1+g_n)\\big]^{1/n}`, true);
  const alt = katexify(`1 + G = \\sqrt{(1+a+s)(1+a-s)} = \\sqrt{(1+a)^2 - s^2} \\;\\approx\\; 1 + a - \\frac{s^2}{2(1+a)}`, true);
  const lognormal = katexify(`\\ln(1 + g_t) \\sim N(\\mu, \\sigma^2): \\qquad \\ln(1+A) = \\mu + \\tfrac12\\sigma^2, \\qquad \\ln(1+G) = \\mu`, true);
  const above = katexify(`\\Pr\\big(Y_t > \\mathrm{E}[Y_t]\\big) = \\Phi\\!\\left(-\\tfrac12\\,\\sigma\\sqrt{t}\\right)`, true);
  const sigmaI = katexify(`\\sigma`);

  // Every figure in the prose comes from the model the charts draw.
  const pct = (v, d = 0) => `${(100 * v).toFixed(d)}%`;
  const ratesB = Array.from({ length: Q_YEARS }, (_, t) => (t % 2 ? BUST : BOOM));
  const endA = (1 + STEADY) ** Q_YEARS;
  const endB = ratesB.reduce((a, g) => a * (1 + g), 1);
  const lab = (s) => ({ med: medianLevel(MEAN_GROWTH, s, LAB_YEARS).toFixed(2), above: pct(shareAboveMean(s, LAB_YEARS), 1) });
  const gdp = lab(SIGMA_GDP), home = lab(SIGMA_DEFAULT), stock = lab(SIGMA_EQUITY);
  const E50 = expectedLevel(MEAN_GROWTH, LAB_YEARS).toFixed(2);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's take two economies that start the century equally rich. Our first
        economy grows by {pct(RICH)} a year and our second by {pct(FAST)}. That's a small
        difference, the sort that can get lost in a single year's statistical
        revisions. Yet after a hundred years, the first economy is
        {((1 + RICH) ** YEARS).toFixed(1)} times as rich as it was, and the second
        is {((1 + FAST) ** YEARS).toFixed(1)} times as rich. So by the end, the
        second economy is more than two and a half times as rich as the first.
      </p>
      <p>
        That's <span class="bold">compound growth</span>: each year's growth
        applies to everything the earlier years produced, so our economies grow
        by the same percentage of an ever larger amount. On an ordinary axis,
        that looks like acceleration. On a
        <span class="bold">logarithmic axis</span>, where each step up multiplies
        rather than adds, constant growth is a straight line, and the steepness
        of the line is the growth rate. Switch between the two views below, and
        drag the year to follow our two economies.
      </p>
    </section>

    <LogScaleFigure />

    <section class="body-text">
      <p>
        On the logarithmic axis, our two straight lines move apart at a constant
        rate. That means the ratio between our two economies grows like an
        economy of its own, at about one percentage point a year. It's also where
        the most quoted rule in growth economics comes from, the
        <span class="bold">rule of 70</span>: something growing at <i>g</i>% a
        year doubles in about 70 / <i>g</i> years.
      </p>
      {@html doubling}
      <p>
        If we check the rule, it's exact at a growth rate of
        {pct(ruleExactAt(70), 2)}, and at
        {pct(RICH)} the exact answer is {doublingTime(RICH).toFixed(1)} years,
        which is where you'll see the rings on the chart. At higher rates the
        rule drifts, which is why bankers use 72 instead, since the rule of 72 is
        exact at {pct(ruleExactAt(72), 2)}. If we apply the exact formula to the
        gap between our two economies, the richer one's lead doubles every
        {gapDoublingTime(FAST, RICH).toFixed(1)} years. So a single percentage
        point, sustained for a century, leaves one economy more than twice as
        rich as the other.
      </p>
      <p>
        That's the standard lesson, and it's right. But it quietly assumes that
        growth is steady, and real growth isn't. So let's try a question about an
        economy whose growth goes up and down.
      </p>
    </section>

    <SwingQuiz />

    <section class="body-text">
      <h3 class="body-header">The average isn't the rate you grew at</h3>
      <p>
        Let's look at two years of B. A year of {pct(BOOM)} growth followed by a
        year of {pct(-BUST)} decline multiplies income by
        {(1 + BOOM).toFixed(2)} × {(1 + BUST).toFixed(2)}, which is
        {((1 + BOOM) * (1 + BUST)).toFixed(4)}. Two years of A multiply it by
        {(1 + STEADY).toFixed(2)} × {(1 + STEADY).toFixed(2)}, which is
        {((1 + STEADY) ** 2).toFixed(4)}. So two years of B grow our economy by
        less than two years of A, even though the growth rates average the same
        {pct(STEADY)}.
      </p>
      <p>
        The rate B actually grew at, called its
        <span class="bold">compound annual growth rate</span>, is
        {pct(compoundRate(ratesB), 2)}. Over fifty years, the missing tenth of a
        point adds up to a {pct(endA / endB - 1, 1)} difference in living
        standards.
      </p>
      <p>
        You may have met the simplest version of this with a share price: a 10%
        fall followed by a 10% rise leaves you 1% worse off, not back where you
        started. That's because a fall takes a bigger bite out of a larger number
        than the same rise adds back to a smaller one. In general, the compound
        growth rate is the geometric mean of the growth factors, which we can
        write as
      </p>
      {@html geo}
      <p>
        A geometric mean is always below the ordinary average unless everything
        is equal. For growth that alternates between <i>a</i> + <i>s</i> and
        <i>a</i> − <i>s</i>, we can even write the gap down exactly:
      </p>
      {@html alt}
      <p>
        So the penalty we pay for swinging grows with the square of the swing. The chart
        below plots it for our average of {pct(STEADY)}. If you drag the swing,
        you'll see that small swings cost almost nothing, but the cost grows
        quickly. An economy that swings by {(100 * zeroGrowthSwing(STEADY)).toFixed(1)}
        points either side of {pct(STEADY)} doesn't grow at all.
      </p>
    </section>

    <DragFigure />

    <section class="body-text">
      <p>
        The dashed curve is the approximation we wrote down above, the average
        minus half the squared swing, and it's hard to tell apart from the exact
        curve until the swings are very large. This penalty is often called
        <span class="bold">volatility drag</span>. For a rich country's GDP,
        whose growth rate moves by a couple of points from year to year, it's
        about two hundredths of a percentage point. That's why growth economists
        rarely mention it. But as we'll see next, for anything more volatile it
        becomes the main event.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">When growth is uncertain</h3>
      <p>
        Alternating booms and busts are a toy, so let's make each year's growth
        random instead. In our new model, growth is independent from year to
        year, with a spread measured by {@html sigmaI}, the standard deviation of
        the logarithm of the growth factor. The lab below runs {LAB_PATHS}
        economies like that for fifty years, all with the same expected growth of
        {pct(MEAN_GROWTH)} a year, and draws every one of them.
      </p>
      <p>
        Two lines summarise them. The dashed line is the
        <span class="bold">expected level</span>, the average across all
        possible economies, and the blue line is the
        <span class="bold">median</span>, the economy in the middle. Drag the
        volatility, or pick one of the presets, and watch which of the two lines
        moves.
      </p>
    </section>

    <FanLab />

    <section class="body-text">
      <p>
        The dashed line never moves. Whatever you do to {@html sigmaI}, the
        expected level after fifty years is {E50} times the starting level,
        because the expected growth is {pct(MEAN_GROWTH)} every year. The median,
        on the other hand, moves a lot.
      </p>
      <p>
        At a volatility of {pct(SIGMA_GDP)}, roughly what a country's GDP growth
        shows, our median economy ends up {gdp.med} times as rich, and nearly
        half of the paths finish above the expected level. At {pct(SIGMA_DEFAULT)},
        which is more like the year-to-year swings in one household's earnings,
        the median ends up only {home.med} times as rich. And at
        {pct(SIGMA_EQUITY)}, typical of a single company's shares, the median
        economy is worth {stock.med} of what it started with after fifty years.
        The typical path went nowhere, while the expected one grew {E50} times.
      </p>
      <p>
        So is the expected level wrong? No, it's still correct, but it's reached
        the way the average of a skewed quantity usually is, by a few paths that
        do very well. We can write down the fraction of paths that end above
        it exactly, and it shrinks as time passes:
      </p>
      {@html above}
      <p>
        After fifty years, that's {gdp.above} at a volatility of {pct(SIGMA_GDP)},
        {home.above} at {pct(SIGMA_DEFAULT)} and {stock.above} at
        {pct(SIGMA_EQUITY)}. The simulated shares in the lab land close to those,
        as a sample of {LAB_PATHS} should. If we wait long enough, almost every
        path ends up below the average of all of them.
      </p>
      <p>
        This gap between the average across possible outcomes and what happens
        along one path over time is the subject of what Ole Peters has called the
        <span class="bold">ergodicity problem</span> in economics. It leaves us
        with a useful question to ask of any forecast. Is it a statement about
        the average of many outcomes, or about the one you're actually going to
        live through?
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The maths</h3>
      <p>
        Let's collect the formulas. A quantity growing at a constant rate
        <i>g</i> doubles in ln 2 / ln(1&nbsp;+&nbsp;<i>g</i>) years. Since
        ln 2 is {Math.log(2).toFixed(3)} and ln(1&nbsp;+&nbsp;<i>g</i>) is a
        little less than <i>g</i>, the right numerator for small rates is a
        little above 69, which is where 70 comes from.
      </p>
      <p>
        For random growth, let's say the logarithm of each year's growth factor
        is normal with mean <i>μ</i> and variance {@html sigmaI}<sup>2</sup>.
        Then the arithmetic and compound rates, <i>A</i> and <i>G</i>, satisfy
      </p>
      {@html lognormal}
      <p>
        So our expected level grows at <i>A</i> and our median at <i>G</i>, and
        their logarithms drift apart by exactly half the variance every year.
        After <i>t</i> years, the log of the level is normal with mean <i>μt</i>
        and standard deviation {@html sigmaI}√<i>t</i>. The expected level sits
        ½{@html sigmaI}√<i>t</i> standard deviations above the median, and that
        gives us the share of paths above it.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Our lab makes growth independent from year to year and lognormal, and
        neither is quite true of economies.
      </p>
      <p>
        First, GDP tends to bounce back after a recession, at least partly. So
        bad years are followed by better-than-average ones more often than
        independence allows, and that reduces the drag.
      </p>
      <p>
        Second, real growth has fatter tails than a normal distribution, with
        rare collapses that are bigger than our model expects, and that increases
        the drag.
      </p>
      <p>
        Third, we have to estimate the volatility itself, usually from a few
        decades of data. That's a short sample for a number whose square
        matters.
      </p>
      <p>
        And finally, the expected level isn't wrong, just often irrelevant. It's
        the right number for the total of many independent paths added together,
        which is why an insurer or a diversified investor can use it. It's the
        wrong number for any one of those paths.
      </p>
    </section>

    <Conclusion />
    <Resources />
  </main>
</div>

<style>
  .page-wrap {
    min-height: 100vh;
  }
  /* global.css gives .body-text and .body-header 80% each on a phone, so a
     heading inside a section was indented to 64%. Inside a section it should
     line up with the paragraphs. */
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
