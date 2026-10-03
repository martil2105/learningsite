<script>
  /* App.svelte for sharpe-ratio */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import MemoryFigure from "./Components/MemoryFigure.svelte";
  import SmoothLab from "./Components/SmoothLab.svelte";
  import HorizonChart from "./Components/HorizonChart.svelte";
  import katexify from "./katexify.js";

  const srEq = katexify("\\text{SR} = \\frac{\\text{average return} - \\text{risk-free rate}}{\\text{volatility}}", true);
  const varEq = katexify("\\operatorname{Var}\\left(R_1 + \\dots + R_{12}\\right) = \\sigma^2 \\left(12 + 2\\sum_{k=1}^{11} (12 - k)\\, \\rho_k\\right)", true);
  const smoothEq = katexify("R^{o}_t = (1-a)\\,R_t + a\\,R^{o}_{t-1}", true);
  const volEq = katexify("\\sigma_{\\text{reported}} = \\sigma \\sqrt{\\frac{1-a}{1+a}}", true);
  const hidEq = katexify("\\operatorname{Var}\\left(R^{o}_1 + \\dots + R^{o}_q\\right) = \\sigma^2\\,(q - h), \\qquad h = \\frac{2a\\,(1 - a^{q})}{1 - a^2}", true);
  const unEq = katexify("R_t = \\frac{R^{o}_t - a\\,R^{o}_{t-1}}{1 - a}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Imagine we're choosing between two funds that hold the same kind of assets. Fund A owns listed shares, so its prices come from the market
        every day. Fund B owns buildings, which hardly ever trade, so its prices come from appraisers, who start from last month's valuation and
        move it only part of the way towards where the market seems to be. Underneath, the two funds earn the same returns.
      </p>
      <p>
        The number we'd usually reach for to compare funds like these is the <span class="bold">Sharpe ratio</span>, the average return above the
        risk-free rate divided by the volatility of the returns:
      </p>
      <div class="math-display">{@html srEq}</div>
      <p>
        It tells us how much return a fund earns for each unit of risk it takes, and it's usually quoted per year. Here's the puzzle we'll work
        through.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">From a month to a year</h3>
      <p>
        Most funds report monthly returns, so we work out the Sharpe ratio per month first and then turn it into a yearly figure. The usual way
        is to multiply by {@html katexify("\\sqrt{12}")}. Over a year, the average return adds up twelve times. If the months are independent,
        the variance adds up twelve times too, so the volatility grows only by {@html katexify("\\sqrt{12}")}, and their ratio grows by
        {@html katexify("12/\\sqrt{12} = \\sqrt{12}")}.
      </p>
      <p>
        That last step needs the months not to remember each other. If this month's return is correlated with last month's, the variance of a
        year picks up a covariance for every pair of months:
      </p>
      <div class="math-display">{@html varEq}</div>
      <p>
        where {@html katexify("\\sigma")} is the monthly volatility and {@html katexify("\\rho_k")} is the correlation between returns
        {@html katexify("k")} months apart. Andrew Lo used this in 2002 to turn monthly Sharpe ratios into yearly ones properly. Let's see how
        much a little memory adds.
      </p>
    </section>

    <Figure id="fig-memory" title="How memory adds up over a year" sub="Drag the correlation between one month and the next.">
      {#snippet children(w)}
        <MemoryFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dashed line is how the variance would grow if the months didn't remember each other. The blue curve is how it grows when each
          month is correlated with the one before.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With a correlation of 0.1 between one month and the next, and 0.1 to the power of {@html katexify("k")} between months
        {@html katexify("k")} apart, a year's variance comes to 14.4 months' worth instead of 12. So the {@html katexify("\\sqrt{12}")} rule
        overstates the yearly Sharpe ratio by 9.6%. If you drag the correlation below zero, as for returns that tend to reverse, you'll see the
        curve dip under the line, and at −0.1 the rule understates the ratio by 8.8%.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Prices that remember</h3>
      <p>
        Our Fund B's memory doesn't come from the market at all. It comes from the way its prices are set. Let's say each month's reported return
        is a share {@html katexify("1 - a")} of the true return and a share {@html katexify("a")} of last month's reported return:
      </p>
      <div class="math-display">{@html smoothEq}</div>
      <p>
        That's roughly what appraisers do when they move last month's value only part of the way to the new one. This
        <span class="bold">smoothing</span> doesn't change the average return, but it spreads each month's news over the months that follow,
        so the reported returns are calmer than the true ones. In fact the reported volatility is
      </p>
      <div class="math-display">{@html volEq}</div>
      <p>and the reported returns are correlated with their own past, by {@html katexify("a^k")} at {@html katexify("k")} months apart.</p>
    </section>

    <Figure id="fig-smooth" title="One history, two reports" sub="Drag the smoothing, then show the unsmoothed series.">
      {#snippet children(w)}
        <SmoothLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue line is what a dollar in the fund was really worth, and the pink line is what was reported. The readouts are long-run
          values, not estimates from this one history.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Our true returns average 6% a year above the risk-free rate with a volatility of 15%, so the true Sharpe ratio is 0.40. At a smoothing
        of 0.6, the reported volatility is half the true one, 7.5%, while the average stays at 6%. So the reported Sharpe ratio comes out at
        0.80, which is Fund B's. If you push the smoothing to 0.8, you'll see it triple, to 1.20. Notice how the pink line shaves the peaks and
        troughs off the blue one, most clearly at the top near year 9 and in the fall that follows it.
      </p>
      <p>
        Since our reported returns remember each other, this is what Lo's correction is for. If we give it the true correlations of the
        reported returns, the yearly Sharpe ratio falls from 0.80 to 0.44. That's most of the way back to 0.40, but not all of it.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The months the correction can't see</h3>
      <p>
        Why doesn't it get all the way back? Lo's formula does what it says: it gives the Sharpe ratio of the yearly returns the fund reports.
        The trouble is that those yearly returns are smoothed too. Each reported year leaves some of its last months' news for the next year,
        and carries in some of the year before's. If we add up the reported returns over {@html katexify("q")} months, the variance comes to
      </p>
      <div class="math-display">{@html hidEq}</div>
      <p>
        So smoothing hides about {@html katexify("h")} months of variance, and {@html katexify("h")} barely changes with the horizon. At a
        smoothing of 0.6 it's 1.87 months, which is a big share of a year but a small share of five.
      </p>
    </section>

    <Figure id="fig-horizon" title="How far each figure is off, by horizon" sub="Drag the smoothing.">
      {#snippet children(w)}
        <HorizonChart width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each line is a reported Sharpe ratio divided by the true one. The pink line scales the monthly ratio by the square root of the
          horizon, and the blue line uses Lo's correction.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At one year, Lo's correction leaves our Sharpe ratio 9% too high at a smoothing of 0.6, and 24% too high at 0.8. Over five years the
        same corrections are only 2% and 4% too high, because the hidden months are now spread over sixty. The square-root rule never gets any
        better, since it doesn't look at the memory at all. The reported yearly returns even remember each other a little, with a correlation
        of 0.09 from one year to the next at a smoothing of 0.6.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Undoing the smoothing</h3>
      <p>
        If we know {@html katexify("a")}, we can run the smoothing backwards. Each true return is the reported one with last month's share
        taken out, scaled back up:
      </p>
      <div class="math-display">{@html unEq}</div>
      <p>
        If you show the unsmoothed series in the lab, you'll see it land right on the blue line. David Geltner proposed this for property
        indices built from appraisals in 1993, and Mila Getmansky, Andrew Lo and Igor Makarov fitted a more general version to hedge fund
        returns in 2004.
      </p>
      <p>
        In practice we don't know {@html katexify("a")}, so we have to estimate it from how strongly the reported returns remember last month.
        With five years of monthly data, that estimate comes out at 0.54 on average when the truth is 0.6, so the correction falls short again.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our fund is simpler than a real one in four ways.</p>
      <p>
        First, our true returns are independent from month to month, so the only memory is the smoothing. Real returns may have a little
        memory of their own, and in a short history it's hard to tell the two apart.
      </p>
      <p>
        Second, our smoothing follows one simple rule. Real appraisals and stale prices smooth in messier ways, which is why Getmansky, Lo and
        Makarov let the weights on past months be anything that adds up to one.
      </p>
      <p>
        Third, a Sharpe ratio estimated from a few years of returns is noisy whatever we do. With ten years of monthly returns, its standard
        error for a fund like ours is about 0.32, nearly as large as the ratio itself.
      </p>
      <p>
        And finally, smoothing isn't the only way to make a Sharpe ratio look good. A fund that sells insurance, such as options against a
        crash, can report years of calm returns before one large loss. The Sharpe ratio only sees the volatility, so it can't see that loss
        coming.
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
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  :global(sub), :global(sup) {
    text-transform: none;
  }
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
