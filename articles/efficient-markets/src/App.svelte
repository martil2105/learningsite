<script>
  /* App.svelte for efficient-markets */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import HistoryBars from "./Components/HistoryBars.svelte";
  import VRFigure from "./Components/VRFigure.svelte";
  import WorldLab from "./Components/WorldLab.svelte";
  import ProfitFigure from "./Components/ProfitFigure.svelte";
  import katexify from "./katexify.js";

  const vrDef = katexify("\\text{VR}(q) = \\frac{\\operatorname{Var}(\\text{a } q\\text{-day return})}{q \\times \\operatorname{Var}(\\text{a one-day return})}", true);
  const vrSum = katexify("\\text{VR}(q) = 1 + 2\\sum_{k=1}^{q-1}\\left(1 - \\frac{k}{q}\\right)\\rho_k", true);
  const staleEq = katexify("o_t = \\pi\\, o_{t-1} + (1 - \\pi)\\, f_t \\qquad\\Rightarrow\\qquad \\rho_k = \\pi^k", true);
  const rollEq = katexify("\\operatorname{Cov}(\\text{today's change}, \\text{tomorrow's}) = -\\frac{s^2}{4}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's go back to 1962 with a very simple rule. At the end of each day, we look at the US stock market. If it went up, we hold it
        tomorrow, and if it went down, we sit in Treasury bills instead.
      </p>
      <p>
        Over the next 25 years, on paper, this rule earned 30.5% a year. Simply holding the market earned 9.5%, and our rule did three times
        as well while sitting out almost half the days. From 2000 to 2026, though, the same rule earned 0.3% a year, against 8.6% for holding
        the market.
      </p>
      <p>
        So was there really money on the table in the 1960s and 70s? To answer that, we need to know what an efficient market should look like,
        how to test for it, and what the test can and can't tell us about profits.
      </p>
    </section>

    <Figure id="fig-history" title="A century of US daily returns, five years at a time" sub="Switch between the two views, and drag the slider to pick a window.">
      {#snippet children(w)}
        <HistoryBars width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar is one five-year window. In the first view the grey band shows where a random walk's autocorrelation would usually land. In
          the second, the bars are the rule on paper and the black ticks are what holding the market earned.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The first view shows the <span class="bold">lag-1 autocorrelation</span>, the correlation between one day's return and the next
        day's. From the 1940s to the 1980s it sat well above the grey band, and in 1967 to 1971 it reached 0.33. Then it fell, and since 2002
        it has hovered around zero or below. If you switch to the second view, you'll see the rule's paper profits follow the same path. It did
        best when the autocorrelation was highest, and it stopped working when the autocorrelation went away.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What a random walk looks like</h3>
      <p>
        The idea of an <span class="bold">efficient market</span> is that prices already reflect what's known, so the next change in a price
        comes from news nobody could have predicted. Paul Samuelson showed in 1965 that properly anticipated prices should move this way, and
        Eugene Fama made it the centre of a whole field. If tomorrow's change can't be predicted from today's, the price follows a
        <span class="bold">random walk</span>, and every autocorrelation between days is zero.
      </p>
      <p>
        One way to test that is to compare risk over different horizons. In a random walk, days are independent, so the variance of a
        {@html katexify("q")}-day return is {@html katexify("q")} times the variance of a one-day return. Andrew Lo and Craig MacKinlay built
        their 1988 test on the ratio of the two, the <span class="bold">variance ratio</span>:
      </p>
      <div class="math-display">{@html vrDef}</div>
      <p>
        A random walk gives 1 at every horizon. When days do remember each other, the ratio adds up the autocorrelations
        {@html katexify("\\rho_k")} between days {@html katexify("k")} apart, with the nearest ones counting most:
      </p>
      <div class="math-display">{@html vrSum}</div>
      <p>
        So positive autocorrelations push the ratio above 1, which means a month is riskier than 21 separate days would suggest. Negative ones
        pull it below 1.
      </p>
    </section>

    <Figure id="fig-vr" title="The variance ratio of US daily returns" sub="Choose a period.">
      {#snippet children(w)}
        <VRFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue line is the variance ratio at each horizon. The dashed line is a random walk, and the grey band is two of its standard
          errors either side.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        From 1962 to 1986, the ratio climbs to 1.58 at 21 days, nine standard errors above a random walk. That's about as clear a rejection
        as statistics ever gives us. If you switch to 2000 to 2026, it sits below 1 instead, at 0.78. So by this test the US market wasn't a
        random walk in either period, just in opposite directions.
      </p>
      <p>
        Does that mean prices were predictable, and that someone could have made money from it? Not necessarily. The test looks at the prices
        that were <em>recorded</em>, and those aren't always prices anyone could trade at. Let's build two markets that are efficient by
        construction and see what the test makes of them.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Two efficient markets that fail the test</h3>
      <p>
        In both of our markets, the true value is a random walk. Each day it moves by a return {@html katexify("f_t")} with an average of 0.04%
        and a volatility of 1%, and nothing anyone knows today can predict tomorrow's move. Only the way the price is written down differs.
      </p>
      <p>
        In the first market, the price we see is an index of a great many stocks, and on any day a share {@html katexify("\\pi")} of them
        doesn't trade at all. Those keep their last price until they trade again, and then catch up on everything they missed. So the
        index's recorded return {@html katexify("o_t")} is part today's news and part yesterday's catching up:
      </p>
      <div class="math-display">{@html staleEq}</div>
      <p>
        That's the same recursion as the appraisal smoothing in the article on the Sharpe ratio, and it gives the index
        <span class="bold">stale prices</span>, with an autocorrelation of {@html katexify("\\pi")} at one day, {@html katexify("\\pi^2")} at
        two, and so on.
      </p>
      <p>
        In the second market, we see one stock, and each day's last trade happens at the dealer's bid or ask with equal odds. Its trade
        price bounces between the two around the true value, which is called the <span class="bold">bid–ask bounce</span>. Richard Roll
        showed in 1984 that with a spread of {@html katexify("s")}, the bounce gives consecutive changes a negative covariance:
      </p>
      <div class="math-display">{@html rollEq}</div>
    </section>

    <Figure id="fig-world" title="Two ways to record a random walk" sub="Switch between the two markets, and drag the slider.">
      {#snippet children(w)}
        <WorldLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          In the top panel, the blue line is the true value and the pink one is the price we record. Below, the pink line is the recorded
          price's variance ratio from the formula, and the open dots are the same ratio measured on 25 simulated years.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With stale prices, the recorded index trails the true value by a day or two. With 30% of stocks idle each day, its lag-1
        autocorrelation is 0.3 and its variance ratio reaches 1.80 at 21 days. That's not far from the US market in the 1960s and 70s.
      </p>
      <p>
        If you switch to the bounce, you'll see the recorded price zigzag around the true value. With a spread of 1% its lag-1
        autocorrelation is −0.17 and its variance ratio falls to 0.68. Roll's formula also works backwards: from the recorded prices alone we
        can recover the spread, which is how his estimator is still used to measure trading costs in old data.
      </p>
      <p>
        Both markets fail the random-walk test badly, and in opposite directions, even though their true values are random walks. The test
        is right that the recorded prices are predictable. What it can't tell us is whether that predictability is money.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The profit that isn't there</h3>
      <p>
        Let's run our rule in both markets for 25 years. In the stale market we buy after a recorded rise, as we did with the real data. In
        the bounce market the autocorrelation is negative, so we buy after a recorded fall instead.
      </p>
    </section>

    <Figure id="fig-profit" title="The rule on paper and for real" sub="Switch between the two markets.">
      {#snippet children(w)}
        <ProfitFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each line is what $1 grows to, on a log scale. The pink line trades at the recorded prices, the blue one at the prices we could
          really get, and the grey dashed line holds the market all the time.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        On paper, the rule earns about 31% a year in the stale market and about 30% in the bounce market, in the long run. For real it earns
        about 5% in both before costs, which is just the market's own return for the half of the days we're in it. The rule has no edge at
        all.
      </p>
      <p>
        The gap between the two lines is the recording. With stale prices, the paper rule buys today's index at a level that's partly
        yesterday's, but an order we place now trades at today's true value, which already includes the news the index hasn't caught up with.
        With the bounce, the paper rule buys at a trade that happened at the bid, while we'd have to buy at the ask. Paying the spread each time the rule changes its mind turns that into a loss of about 48% a year.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Back to the real data</h3>
      <p>
        So how much of the 1960s and 70s was stale prices? A careful way to find out is to compare an index with its futures contract, which
        trades all the time at the index's real level. Dong-Hyun Ahn, Jacob Boudoukh, Matthew Richardson and Robert Whitelaw did this across
        many countries in 2002. They found that the indices' returns were positively autocorrelated while their futures' were close to zero,
        most of all when trading was thin, which points to recording rather than to slow-moving investors.
      </p>
      <p>
        Since the 1980s, trading has grown many times over, with index futures, index funds and electronic markets, and the daily autocorrelation has gone with it. Most of our rule's 30% a year was probably never there to be had.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>The variance ratio is a good test, and there are four things to keep in mind when reading it.</p>
      <p>
        First, its standard errors assume days are independent with a constant variance, and volatility clusters. Lo and MacKinlay's
        version that allows for it gives wider bands. From 1962 to 1986 the rejection survives easily, at 6.5 standard errors instead of 9.1.
        The dip below 1 since 2000 doesn't: it's 1.7 standard errors instead of 3.5.
      </p>
      <p>
        Second, a single window can mislead. The −0.23 of 2017 to 2021 is mostly the spring of 2020, and without the ten weeks from late
        February to the end of April it's −0.06.
      </p>
      <p>
        Third, not all predictability is a recording artefact. Returns over months and years do show patterns, such as momentum and the slow
        swing of the equity premium, which the articles on factor models and on long-run volatility look at. Fama called the catch the
        <span class="bold">joint hypothesis problem</span>: any test of efficiency is also a test of what returns should be, so a predictable
        return can be a reward for risk rather than a mistake.
      </p>
      <p>
        And finally, even real predictability has to beat trading costs, as the bounce market shows. A pattern that needs us to trade every
        day has to be large to survive paying the spread.
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
