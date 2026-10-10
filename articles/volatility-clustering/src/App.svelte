<script>
  /* App.svelte for volatility-clustering */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import AcfFigure from "./Components/AcfFigure.svelte";
  import VolLab from "./Components/VolLab.svelte";
  import RankFigure from "./Components/RankFigure.svelte";
  import katexify from "./katexify.js";

  const garchEq = katexify("\\sigma_t^2 = \\omega + \\alpha\\, e_{t-1}^2 + \\beta\\, \\sigma_{t-1}^2", true);
  const fitEq = katexify("\\alpha = 0.10, \\qquad \\beta = 0.89, \\qquad \\alpha + \\beta = 0.989", true);
  const fcEq = katexify("E\\left[\\sigma_{t+h}^2\\right] - \\bar\\sigma^2 = (\\alpha + \\beta)^h \\left(\\sigma_t^2 - \\bar\\sigma^2\\right)", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's start with two bad days in the US stock market, more than thirty years apart. The first is 19 October 1987, the biggest one-day
        fall of the century. The second is a Monday in 1955, when investors came back from a weekend of news that the President had suffered
        a heart attack.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <p>
        Most of us would say 1987, and if we measure both days against the century's ordinary spread, it isn't close. But the market in
        September 1955 had been calm for months, while in the week before the 1987 crash it had already been swinging hard. A ruler that
        knows what the last few weeks were like gives a very different answer, and building that ruler is what this article is about.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Sign and size</h3>
      <p>
        We saw in the article on efficient markets that today's return says very little about whether tomorrow's will be up or down. That's
        about the <em>sign</em> of a move. Let's ask the same question about its <em>size</em>, the absolute return, and compare the two.
      </p>
    </section>

    <Figure id="fig-acf" title="Memory in the sign and in the size" sub="Drag the slider to move along the lags.">
      {#snippet children(w)}
        <AcfFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each line is a correlation between days a given number of days apart, using every day from 1926 to 2026. The grey band is where
          the correlation of returns would usually land if their direction had no memory, allowing for the clustering we're about to see.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The pink line, for returns, hugs zero. Apart from a small 0.05 at one day, no lag gets further than 0.03 from it, and the few that poke out of the grey band do so only slightly, about as often as chance would give us across this many lags. Knowing whether the market rose tells us next to nothing about whether it'll rise again.
      </p>
      <p>
        The blue line, for sizes, is another matter. A big day is followed by big days: the correlation is 0.30 between neighbouring days and 0.21 a month apart. If you drag the slider out to a year, you'll see it's still 0.11. That's <span class="bold">volatility clustering</span>. Benoit Mandelbrot noticed it in cotton prices in 1963: big changes tend to come after big changes, in either direction, and quiet days after quiet days.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A forecast of the spread</h3>
      <p>
        If the size of today's move says something about tomorrow's, we can forecast tomorrow's spread. The simplest model we can use for it is Tim Bollerslev's <span class="bold">GARCH(1,1)</span> from 1986, which builds on Robert Engle's ARCH. Each day's variance forecast
        mixes a constant, yesterday's squared surprise {@html katexify("e_{t-1}^2")} and yesterday's forecast:
      </p>
      <div class="math-display">{@html garchEq}</div>
      <p>If we choose the three numbers that make the century's returns most likely, we get</p>
      <div class="math-display">{@html fitEq}</div>
      <p>
        So each day, our forecast keeps 89% of yesterday's and adds 10% of yesterday's squared surprise. Because the two add up to nearly one,
        a shock fades slowly. After {@html katexify("h")} days, the gap between the forecast and its long-run level shrinks by a factor of
        {@html katexify("(\\alpha + \\beta)^h")}:
      </p>
      <div class="math-display">{@html fcEq}</div>
      <p>
        That gap halves every 64 trading days, about three months. The long-run level is a daily standard deviation of 1.11%, or 17.6% a
        year. Let's see the forecast at work.
      </p>
    </section>

    <Figure id="fig-vol" title="Three years with the forecast band" sub="Choose a stretch of three years.">
      {#snippet children(w)}
        <VolLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each thin line is one day's return. The shaded band is two of the forecast's standard deviations either side, made each morning from
          the days before, and the pink days are the ones that land outside it.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Notice how the band breathes. Around 1987 it's narrow through 1986, widens through the autumn of 1987, and after the crash the forecast for the
        next day jumps to a standard deviation of 5.9%. Then it shrinks back over the following months, as the formula says it should. If
        you switch to 1964, you'll see a quiet market in a narrow band. Its biggest day, the day the market reopened after President
        Kennedy's funeral in November 1963, was 3.6 standard deviations by the century's ruler and 3.4 by its own.
      </p>
      <p>
        Across the century, 5.1% of our days land outside the band, close to the 4.6% a normal distribution would give. In the stormy stretches,
        around 1987 and 2008, more days escape it, because the forecast takes a few days to catch up when a storm starts.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How much of the fat tail is clustering?</h3>
      <p>
        Now we can answer the opening question properly. Let's measure every day in standard deviations of its own forecast, and rank the
        biggest surprises both ways.
      </p>
    </section>

    <Figure id="fig-rank" title="The ten biggest days, two ways" sub="Switch the ruler.">
      {#snippet children(w)}
        <RankFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar is one day's size in standard deviations, with the date and the day's return above it. Pink bars are falls and blue bars
          are rises.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you switch to the century's ruler, you'll see the famous crashes and rebounds: 1987, 1929, 1933, 2008 and 2020. By the forecast's ruler most of them drop out. The fall of 12.0% on 16 March 2020 came after a month of wild days, so it was only 2.3 of its forecast's standard
        deviations. At the top instead is 26 September 1955, at 14.2, followed by the Friday the 13th fall of October 1989 and the outbreak of
        the Korean War in June 1950. The 1987 crash is still there, in fourth place at 8.5, because no forecast could have expected a fall
        that size even after a nervous week.
      </p>
      <p>
        So clustering explains a lot of the fat tails we met two articles ago, but not all of them. Measured against the forecast, the
        century's kurtosis falls from 19.1 to 7.3, and the days beyond five standard deviations fall from 101 to 26, where a normal would
        expect almost none. If we simulate centuries from our GARCH model with perfectly normal shocks, the typical one has 41 days beyond
        five of its standard deviations. Clustering on its own produces about two fifths of what we see, and the rest needs surprises that
        are fat-tailed themselves.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>GARCH(1,1) is the workhorse of volatility forecasting, and four things about it are worth knowing.</p>
      <p>
        First, its memory has the wrong shape. The model says the correlation of squared returns fades by a fixed factor every day, so it
        starts too high and dies too fast: 0.40 at one day against the data's 0.26, and 0.002 at 500 days against 0.021. If we need that slow tail, models with longer memory fit it better, such as Fulvio Corsi's HAR, which averages over a day, a week and a month.
      </p>
      <p>
        Second, falls raise volatility more than rises do. The correlation between today's return and tomorrow's size is −0.09, which our GARCH can't see because it squares the surprise. Versions such as the one by Lawrence Glosten, Ravi Jagannathan and David Runkle give falls
        their own weight.
      </p>
      <p>
        Third, the shocks themselves are fat-tailed, as the kurtosis of 7.3 shows. Bollerslev's own fix in 1987 was to draw them from a Student
        t distribution instead of a normal one.
      </p>
      <p>
        And finally, we've fitted one set of numbers to a whole century. Markets, trading hours and the number of stocks have all changed, and
        a model fitted to recent years can give a different half-life.
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
