<script>
  /* App.svelte for mean-variance-optimisation */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import WeightsLab from "./Components/WeightsLab.svelte";
  import MeanBlur from "./Components/MeanBlur.svelte";
  import CosCloud from "./Components/CosCloud.svelte";
  import YearsChart from "./Components/YearsChart.svelte";
  import katexify from "./katexify.js";

  const cosEq = katexify("\\text{Sharpe we get} = \\text{best Sharpe} \\times \\cos(\\text{angle between the arrows})", true);
  const approxEq = katexify("\\text{E}[\\cos] \\approx \\sqrt{\\frac{a^2}{a^2 + N}}, \\qquad a = \\text{SR}\\sqrt{T}", true);
  const yearsEq = katexify("T \\approx \\frac{N}{\\text{SR}^2} \\cdot \\frac{k^2}{1 - k^2}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're managing money across ten assets, and we want the best
        mix of them. In 1952 Harry Markowitz turned that question into a
        calculation. If we tell his method each asset's expected return, how
        volatile it is and how it moves with the others, it tells us the weights
        that give the most expected return for each level of risk. With a safe
        asset to borrow and lend at, the whole problem comes down to one
        portfolio, the one with the highest <span class="bold">Sharpe ratio</span>,
        which is the expected return above the safe rate per unit of volatility.
      </p>
      <p>
        The trouble is the inputs. In 2009 DeMiguel, Garlappi and Uppal took
        fourteen ways of choosing portfolios from the academic literature and fed
        them real data. None of them reliably beat the simplest rule there is,
        which is to put an equal share of our money in each asset. They estimated
        that the textbook optimiser would need around 3,000 months of data to win
        with 25 assets, which is 250 years. We'll see where a number like that
        comes from. A clean version of it falls out of one picture, and it shows
        that even if we knew every volatility and correlation perfectly, the
        averages alone would be enough to sink the optimiser.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">An optimiser with ten assets</h3>
      <p>
        Let's set up a world where we know the truth. We have ten assets, each
        with 20% volatility and a correlation of 0.3 with every other. Their
        expected returns above the safe rate are spread evenly from 2.4% to 7.4% a
        year. In this world the best portfolio has a Sharpe ratio of 0.50, and
        equal weights get 0.40, four fifths of the best. The best weights lean
        towards the high-return assets and go short the lowest ones.
      </p>
      <p>
        Now we play the optimiser. We don't see the truth, only a history of
        monthly returns drawn from it. We estimate the averages and the
        covariances from that history, plug them into Markowitz's formula, and
        then score the weights we get against the true inputs.
      </p>
    </section>

    <Figure id="fig-weights" title="The optimiser's weights against the best ones" sub="Drag the length of the history, and draw another one.">
      {#snippet children(w)}
        <WeightsLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Green bars are the best weights and pink bars are the ones the optimiser picks from the history it saw, both scaled to the same
          portfolio volatility. The Sharpe ratio uses the true inputs, so it's
          what the weights would really earn.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With thirty years of data, our optimiser's weights look nothing like the
        best ones. Big bets land on assets that happened to do well in our sample,
        and its Sharpe ratio comes out at 0.33, well below the 0.40 that equal
        weights get without estimating anything. If you draw a few more histories,
        you'll see the optimiser win now and then, but in about four histories out
        of five, equal weights do better. Even with a hundred years of data, the
        optimiser still loses to them more than one time in five.
      </p>
      <p>
        Now switch the lab to estimate the means only, with the true covariances
        handed to it. It barely helps. Over a thousand thirty-year histories, the
        average Sharpe ratio goes from 0.326 to 0.330. Chopra and Ziemba made this
        point in 1993: errors in expected returns matter far more to the optimiser
        than errors in variances or covariances. So from here on, we'll give the
        optimiser the covariances for free and look only at the means.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The mean blur</h3>
      <p>
        Why are averages so hard to pin down? If an asset's yearly returns have
        volatility {@html katexify("\\sigma")}, the average of
        {@html katexify("T")} years of them has a standard error of
        {@html katexify("\\sigma / \\sqrt{T}")}. For a stock market with 16%
        volatility and fifty years of data, that's
        {@html katexify("\\pm 2.3")} percentage points around the true value. To
        get it down to {@html katexify("\\pm 1")} point, we'd need 256 years.
      </p>
    </section>

    <Figure id="fig-blur" title="How precisely we can know an average return" sub="Drag the years of data, and switch how often we observe.">
      {#snippet children(w)}
        <MeanBlur width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The curve is the spread of the average return we'd estimate around the
          true value, and the band is one standard error each way. Notice that the
          width depends only on the length of the history.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you switch from monthly to daily data, the history holds about twenty times as many observations, and the curve doesn't move. Robert Merton pointed this out in
        1980. The estimate of the average depends only on where the price started
        and where it ended, so sampling more often in between adds nothing. It's
        the opposite of volatility, which we can pin down well from daily data.
      </p>
      <p>
        That's the asymmetry behind the lab. Our ten assets' expected returns are
        about half a point apart from their neighbours, while thirty years of data
        blur each one by about 3.7 points. The optimiser is sorting noise.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The answer is an angle</h3>
      <p>
        There's a way of looking at this that turns the whole problem into
        geometry. If we rescale the assets so that they're uncorrelated with unit
        volatility, the best portfolio becomes an arrow pointing in some
        direction, and its length is the best Sharpe ratio, 0.5. The estimated
        averages give us a second arrow, the true one plus a random error of the
        same size, {@html katexify("1/\\sqrt{T}")}, in every one of the
        {@html katexify("N")} directions. The optimiser follows the second arrow,
        and the Sharpe ratio it gets is
      </p>
      <div class="math-display">{@html cosEq}</div>
      <p>
        Only two things set that angle: the number of assets, and the best Sharpe
        ratio times the square root of the years of data, which we'll call
        {@html katexify("a = \\text{SR}\\sqrt{T}")}. We can see it in two
        dimensions, however many assets there are. Along the horizontal axis is
        the part of the estimate that points the right way, which is
        {@html katexify("a")} plus one unit of noise. Up the vertical axis is the
        error in all the other {@html katexify("N - 1")} directions rolled into
        one, and its typical size is {@html katexify("\\sqrt{N - 1}")}. Every dot
        in the chart below is one history.
      </p>
    </section>

    <Figure id="fig-cloud" title="Three hundred histories, seen from the best portfolio" sub="Drag the number of assets and the years of data.">
      {#snippet children(w)}
        <CosCloud width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each dot's angle from the horizontal axis sets the Sharpe ratio the
          optimiser gets. Green dots are histories where it beats equal weights.
          Both axes use the same units, so the angles on screen are the true ones.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With ten assets and thirty years, the signal {@html katexify("a")} is 2.7
        and the error in the other nine directions is typically 3. The dots scatter
        at wide angles, and the average Sharpe ratio lands near 0.33, which is what
        the full optimiser got in the first lab. If you push the years up, you'll
        see the cloud slide to the right and the angles close. If you push the
        number of assets up, the cloud rises, because every extra asset adds
        another direction to be wrong in.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How many years would we need?</h3>
      <p>
        Averaging the cosine over histories gives the expected share of the best
        Sharpe ratio. A good approximation is
      </p>
      <div class="math-display">{@html approxEq}</div>
      <p>
        and if we set that equal to the share that equal weights already get,
        {@html katexify("k")}, we can solve for the years:
      </p>
      <div class="math-display">{@html yearsEq}</div>
      <p>
        So the years we need grow in proportion to the number of assets, and with
        the inverse square of the Sharpe ratio. With our numbers, a best Sharpe of
        0.5 and equal weights at 80% of it, the chart below gives about 68 years
        for ten assets, 174 for twenty-five and 353 for fifty. That's with the
        covariances known perfectly. DeMiguel and colleagues estimated everything
        and got 3,000 months, 250 years, for twenty-five assets. Ours is about
        2,100 months for the easier problem, so the two numbers agree on the
        scale.
      </p>
    </section>

    <Figure id="fig-years" title="Share of the best Sharpe ratio against years of data" sub="Drag the share of the best Sharpe that equal weights already get.">
      {#snippet children(w)}
        <YearsChart width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each line is the optimiser's expected share with the covariances known,
          for a different number of assets. The dashed line is what equal weights
          get, and the circles mark where each line crosses it.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you slide the equal-weights share up to 90%, the years more than
        double, and if you slide it down to 60%, they fall to about a third. How
        good equal weights are depends on how different the assets really are,
        which we don't know either. When assets are broadly similar, as stocks in
        one market tend to be, equal weights start close to the best, and the
        optimiser has little to gain and a lot of noise to lose it to.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What people do instead</h3>
      <p>
        None of this means we should give up on the idea. It means we should stop
        trusting raw averages, and there are several ways to do that. Some
        approaches drop the means entirely and look for the portfolio with the
        lowest volatility, which needs only the covariances we can estimate well.
        Some pull the estimated averages towards a common value, or towards what
        market prices imply, which is the idea behind the Black and Litterman
        model. Some shrink the covariance matrix too, as Ledoit and Wolf proposed.
        And Jagannathan and Ma showed in 2003 that simply banning short positions
        acts like a kind of shrinkage. Each one gives up a little of the textbook
        answer's accuracy in exchange for far less noise, and each one moves the
        weights towards something that looks more like equal weights.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our world is kinder to the optimiser than a real one, in three ways.</p>
      <p>
        First, returns in our world are normal and don't change over time. Real
        returns have fat tails and their means drift, which makes old data worth
        even less.
      </p>
      <p>
        Second, our assets are all alike apart from their means. When volatilities
        and correlations differ too, errors in the covariances start to matter
        more, especially with many assets and short histories.
      </p>
      <p>
        And finally, our angle result assumes the covariances are known. That's
        what makes it clean, and it's also why its years are a floor rather than
        an estimate of what a real optimiser needs.
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
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
