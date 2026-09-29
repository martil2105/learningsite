<script>
  /* App.svelte for pastor-stambaugh-2012 */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import PaperCard from "./Components/PaperCard.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import ForecastLab from "./Components/ForecastLab.svelte";
  import TwoVariances from "./Components/TwoVariances.svelte";
  import PersistenceFig from "./Components/PersistenceFig.svelte";
  import katexify from "./katexify.js";

  let N = $state(100);
  let k = $state(30);
  let seed = $state(4);
  let reversion = $state("moderate");
  let doubt = $state("known");
  let horizon = $state(30);
  let pfDoubt = $state("unsure");
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <PaperCard>
    {#snippet cite()}
      Pástor, Ľ. and Stambaugh, R. F. (2012), "Are stocks really less volatile in the long run?", <em>Journal of Finance</em>, 67(2), 431–478.
    {/snippet}
    {#snippet claims()}
      Returns that revert make the record look calmer over long horizons than over short ones. But an investor doesn't know the mean return,
      today's expected return or how long expected returns stay high or low, and those doubts grow with the horizon. From where she stands,
      stocks are more volatile per year over thirty years than over one.
    {/snippet}
    {#snippet rebuild()}
      Why not knowing the mean adds a fraction k/N to the variance per year, the paper's five-part split of an investor's variance in a small
      model of our own, and why doubt about how persistent expected returns are pushes the long-run variance up.
    {/snippet}
    {#snippet later()}
      Later work found that the answer turns on the beliefs an investor brings to the data. Some reasonable priors bring back calmer long runs,
      and others don't.
    {/snippet}
  </PaperCard>

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we've been handed two centuries of yearly stock returns and asked a simple question: are stocks riskier over thirty years than
        over one? One way to answer is to measure. We work out the variance of one-year returns, then the variance of thirty-year returns, and
        divide the second by thirty so that the two are on the same per-year footing. For US stocks the usual finding is that the thirty-year
        figure comes out lower. Bad years tend to be followed by better ones, so the long run is calmer than the short run. That tendency is
        called <span class="bold">mean reversion</span>, and it's a favourite argument for holding stocks when we're young.
      </p>
      <p>
        Pástor and Stambaugh accepted the measurement and changed the question. An investor doesn't care about the variance of past thirty-year
        stretches. She cares about how uncertain the next thirty years are, given what she knows now, and she doesn't know the model that
        produced the data. Let's start with the simplest thing she doesn't know.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The mean we have to estimate</h3>
      <p>
        Let's take a world with no mean reversion at all. Each year stocks beat bonds by a random amount, drawn independently with the same
        mean and a volatility of 20%, as in the <a href="../time-diversification/">time diversification</a> article. We don't know the mean, so
        we estimate it by averaging the years of data we have. The lab below draws one such history and turns it into an estimate. Then it draws
        a hundred possible futures from the true world, which we can't see.
      </p>
    </section>

    <Figure id="fig-forecast" title="Forecasting with a mean we had to estimate" sub="Draw another history, then change how many years of data we have.">
      {#snippet children(w)}
        <ForecastLab width={w} bind:N bind:k bind:seed />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dashed line is the true trend and the solid blue line is ours. Draw a few histories and watch how often the grey futures escape
          the blue band.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The blue band is the forecast we'd make if our estimate were the truth. When the history lands near the true trend, as the first one
        does, the band misses about as many futures as it should. If you draw a few more, you'll see our estimate wander above and below the truth, and the blue
        band starts to miss a lot of futures. The trouble is that we can't tell which kind of history we've got, and any error in the slope gets
        multiplied by the number of years we look ahead.
      </p>
      <p>
        That's the whole effect, and we can write it in one line. Over k years, the total we'll earn is k years of surprises plus k times the
        error in our estimate of the mean. With N years of data, that error has a variance of σ²/N, so the variance of our forecast, per year,
        is
      </p>
      <div class="math-display">{@html katexify("\\frac{1}{k}\\,\\mathrm{Var}(\\text{total over } k \\text{ years}) = \\sigma^2\\left(1 + \\frac{k}{N}\\right)", true)}</div>
      <p>
        The surprises add the same variance every year. The error in the mean adds more the further we look, because it pushes every one of
        those years in the same direction. With a century of data, a thirty-year forecast carries 30% more variance per year than a one-year
        forecast, and a band built to hold nine futures in ten holds only about 85% of them on average. The pink band allows for this, and averaged over all the histories we might get, it misses one future in ten. The paper's own example looks fifty years ahead with its 206 years of
        data, which gives about 24% more. And if we look as far ahead as our data reach back, the error in the mean contributes as much variance
        as all the year-to-year surprises put together. You can see it in the lab if you switch to fifty years of data and drag the horizon out to fifty.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Where mean reversion comes from</h3>
      <p>
        Now let's give our world some mean reversion. Pástor and Stambaugh use what they call a <span class="bold">predictive system</span>.
        Each year's return is the expected return for that year plus a surprise. The expected return isn't fixed. It drifts around a long-run
        average, and a share {@html katexify("\\beta")} of any move away from that average is still there a year later, so
        {@html katexify("\\beta")} measures how <span class="bold">persistent</span> expected returns are. The last ingredient is what makes
        returns revert. When the surprise is bad, the expected return tends to rise, so a bad year raises the returns we can expect afterwards.
      </p>
      <div class="math-display">{@html katexify("r_{t+1} = \\mu_t + u_{t+1}, \\qquad \\mu_{t+1} - \\bar\\mu = \\beta\\,(\\mu_t - \\bar\\mu) + w_{t+1}, \\qquad \\operatorname{corr}(u, w) = \\rho", true)}</div>
      <p>
        Here {@html katexify("\\mu_t")} is the expected return, {@html katexify("\\bar\\mu")} its long-run average, and
        {@html katexify("u")} and {@html katexify("w")} are the yearly surprises to the return and to the expected return. The correlation
        {@html katexify("\\rho")} between them is negative, and the more negative it is, the stronger the mean reversion. We'll pin our world
        down with numbers of our own. Stocks have a one-year volatility of 20%, moving expected returns account for 5% of the one-year
        variance, and the persistence is 0.83, the median of the paper's prior for it. Our investor has 206 years of returns, as the
        paper does, and nothing else.
      </p>
      <p>
        With those numbers we can work out two different variances for the next k years. The first is the world's, the one that a long enough
        record of k-year stretches would measure. The second is our investor's, the variance she should expect given what her 206 years can
        and can't tell her. The paper splits the second into five pieces.
      </p>
      <p>
        First, the <span class="bold">surprises</span>, the year-to-year noise, which adds the same amount every year.
      </p>
      <p>
        Second, <span class="bold">mean reversion</span>. Bad surprises raise later expected returns, which pulls the total back, so this
        piece is negative.
      </p>
      <p>
        Third, <span class="bold">future expected returns</span>. Expected returns will keep drifting over the next k years, and those drifts
        add up.
      </p>
      <p>
        Fourth, <span class="bold">today's expected return</span>. Past returns can't tell our investor exactly where the expected return
        stands today, and an error in that starting point echoes through the years that follow.
      </p>
      <p>
        And finally, <span class="bold">estimation risk</span>. She doesn't know the long-run average either, which is the piece we met in
        the first lab.
      </p>
    </section>

    <Figure id="fig-two" title="The world's variance and the investor's" sub="Change the mean reversion and how sure we are about persistence, then drag the horizon.">
      {#snippet children(w)}
        <TwoVariances width={w} bind:reversion bind:doubt bind:k={horizon} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Both lines are variance per year, in units of the one-year variance. The black line is the world and the blue line is our investor.
          The bars split her variance at the marked horizon into the five pieces.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With the persistence known, the world's variance per year at thirty years is about 59% of the one-year figure. That's the mean
        reversion the measurement finds. Our investor's is a bit higher, about 66%, because the pieces that come from what she doesn't know
        grow with the horizon, but she'd still say stocks are calmer in the long run. The bars show how the pieces add up. Mean reversion takes
        away about 0.81, and future expected returns and her two kinds of ignorance put back nearly two thirds of that.
      </p>
      <p>
        Now let's make her less sure. If you switch the persistence to "0.66 to 1", she believes it's somewhere in that range without knowing
        where. Her thirty-year figure rises to about 0.81, and her fifty-year figure to about 0.87. If you also switch the mean reversion to
        weak, it goes above one, to about 1.06 at thirty years and 1.18 at fifty. From where she stands, stocks are then riskier per year over
        the long run. But why should a doubt that's centred on the same 0.83 make such a difference?
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Why doubt about persistence matters</h3>
      <p>
        The chart below answers that question. For every persistence from 0.5 to almost 1, it draws our investor's variance per year at
        thirty years if she knew the persistence exactly. The shaded band is the range she thinks it could be in.
      </p>
    </section>

    <Figure id="fig-persistence" title="What doubt about persistence does" sub="Try each range, and each strength of mean reversion.">
      {#snippet children(w)}
        <PersistenceFig width={w} bind:reversion bind:doubt={pfDoubt} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue curve is her variance if she knew the persistence, and the pink line is its average across the shaded range. The dot marks
          the middle of the range.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Across most of the range the curve is low and fairly flat, but past about 0.9 it climbs steeply. A persistent expected return is one
        that stays high or low for decades, so a shift in it doesn't wash out before our thirty years are up. When our range of doubt reaches
        into that steep part, it pulls the average well above the curve's value at 0.83. In other words, the doubt doesn't cancel out, because
        being wrong in one direction costs much more than being wrong in the other. If you pick the narrower range, from 0.75 to 0.91, you'll see the pink line sit only just above the dot, because that range stays out of the steep part. The curve does come back down just short of 1. That's
        because at a persistence of exactly 1 the expected return never moves at all, and 206 years of data pin down something that never
        moves fairly well.
      </p>
      <p>
        There's a neat way to see where the steep part starts. If our investor knew everything, her variance per year in the very long run
        would settle at
      </p>
      <div class="math-display">{@html katexify("\\sigma_u^2\\,\\bigl(1 + 2\\rho d + d^2\\bigr), \\qquad d = \\frac{\\sigma_w}{\\sigma_u\\,(1 - \\beta)}", true)}</div>
      <p>
        where {@html katexify("\\sigma_u")} and {@html katexify("\\sigma_w")} are the volatilities of the two kinds of surprise, and
        {@html katexify("d")} measures how much a shift in the expected return moves the long-run total compared with a surprise to the return.
        That's a parabola in {@html katexify("d")}. It's lowest at {@html katexify("d = -\\rho")}, where it's {@html katexify("1 - \\rho^2")}
        of the surprises' variance, so with a correlation of −0.7, mean reversion can take away at most about half. As persistence rises,
        {@html katexify("d")} grows without limit. Once it passes {@html katexify("-2\\rho")}, the long run is riskier than the short run even
        for someone who knows everything, and with our numbers that happens at a persistence of about 0.95.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the paper found</h3>
      <p>
        Our model holds everything fixed except the persistence and the two unknowns that come from the data. The paper doesn't. It treats every
        parameter as uncertain, and it gives the investor predictors such as the dividend yield, which tell her something about today's
        expected return but not everything. Then it estimates the whole system on US returns from 1802 to 2007.
      </p>
      <p>
        In the paper's benchmark case, the variance per year at a thirty-year horizon comes out about 45% higher than at one year, and at fifty
        years about 80% higher. Across the different prior beliefs the paper tries, the fifty-year figure runs from about 1.5 to about 2 times
        the one-year figure. Mean reversion still does a lot of work, and the paper says so, but the investor's uncertainties more than make up
        for it, especially her uncertainty about the expected return. The authors also draw a practical conclusion. Target-date funds move
        savers out of stocks as retirement approaches, and the paper argues that the same uncertainties make such funds unappealing for a class
        of investors who'd otherwise like them.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What came later</h3>
      <p>
        The split into five pieces is plain algebra, so the debate that followed was about the beliefs an investor brings to the data. In 2018
        Carvalho, Lopes and McCulloch estimated similar models and concluded that, under the priors they consider reasonable, US stocks are
        less volatile in the long run after all.
      </p>
      <p>
        The same year, Avramov, Cederburg and Lučivjanská took their priors from asset-pricing models. Priors from habit-formation and
        prospect-theory models strengthened the belief in mean reversion and made stocks look safer over long horizons, while a prior from a
        long-run-risk model did the opposite. Our persistence chart shows why the priors carry so much weight. A little belief in very
        persistent expected returns goes a long way, and the data can't rule it out.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our rebuild is much smaller than the paper, in three ways.</p>
      <p>
        First, we fixed the volatility, the share of variance that comes from moving expected returns, and the correlation, and let only
        persistence be uncertain. The paper's investor is unsure about all of them, which is a large part of why its answers are bigger than
        ours.
      </p>
      <p>
        Second, our investor learns only from past returns. Real investors also watch valuation ratios, which narrow the doubt about today's
        expected return but bring parameters of their own to estimate.
      </p>
      <p>
        And finally, like the paper, we measured risk by variance. Over long horizons the shape of the distribution matters too, and the time
        diversification article showed that the chance of ending behind and the size of the shortfall can move in opposite directions.
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
