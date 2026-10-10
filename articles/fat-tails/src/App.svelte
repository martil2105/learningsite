<script>
  /* App.svelte for fat-tails */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import CountLab from "./Components/CountLab.svelte";
  import TailFigure from "./Components/TailFigure.svelte";
  import KurtosisLab from "./Components/KurtosisLab.svelte";
  import katexify from "./katexify.js";

  const zEq = katexify("z = \\frac{r - \\bar r}{s}", true);
  const powerEq = katexify("P(\\text{a day beyond } x) \\approx C\\, x^{-\\alpha}", true);
  const momentEq = katexify("E\\left[|z|^p\\right] < \\infty \\quad\\text{only for}\\quad p < \\alpha", true);
  const kurtEq = katexify("\\text{kurtosis} = \\frac{\\text{average of } (r - \\bar r)^4}{\\left(\\text{average of } (r - \\bar r)^2\\right)^2}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        On Monday 19 October 1987, the US stock market fell 17.4% in a single day. Let's measure that against a normal day. Over the whole
        century from 1926, the market's daily return has had a standard deviation of 1.08%, so the fall was 16.2 standard deviations below an
        average day.
      </p>
      <p>
        If daily returns followed a normal distribution with that average and spread, a fall that size would come along about once every
        1.7 × 10⁵⁶ years. That's far longer than the universe has existed, many times over. Yet it happened, within living memory, and it
        wasn't the only day of its kind. So how often do big days really come?
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Counting the big days</h3>
      <p>
        We have French's daily returns for the US market from July 1926 to August 2026, which is 26,317 days. Let's put each one on a common
        scale by measuring it in standard deviations from the average day:
      </p>
      <div class="math-display">{@html zEq}</div>
      <p>Then we can count how many days land beyond any size we pick, and compare that with what the normal distribution expects.</p>
    </section>

    <Figure id="fig-count" title="A century of days, by size" sub="Drag the slider to choose how big a day has to be.">
      {#snippet children(w)}
        <CountLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar counts the days of one size, on a log scale, and the black curve is what a normal distribution with the same average and
          spread would give. The pink bars are the days beyond the threshold on either side.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Near the middle there are more quiet days than the normal expects, about one and a half times as many. A little further out, between one and two and a half standard deviations, there are only about half as many. Beyond three standard deviations the bars pull away from the curve for good. At five standard deviations the normal expects
        such a day about once every 6,600 years, and the data have 101 of them, 51 falls and 50 rises, or about one a year. If you drag the
        slider out to ten, the normal's wait becomes 2.5 × 10²⁰ years, and we still have 9 days.
      </p>
      <p>
        Notice how the normal curve bends down faster and faster, while the bars beyond a few standard deviations trail off much more
        slowly. That difference in shape is what people mean by <span class="bold">fat tails</span>.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A straight line on a log–log chart</h3>
      <p>
        To see the shape of a tail, let's plot the share of days at least {@html katexify("x")} standard deviations out against
        {@html katexify("x")}, with both axes on a log scale. On such a chart a <span class="bold">power law</span>,
      </p>
      <div class="math-display">{@html powerEq}</div>
      <p>is a straight line with a slope of {@html katexify("-\\alpha")}, which we call the <span class="bold">tail exponent</span>.</p>
    </section>

    <Figure id="fig-tail" title="The tails on a log–log chart" sub="Choose a tail, and how many of the largest days the fit uses.">
      {#snippet children(w)}
        <TailFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The coloured line is the share of US days beyond each size, the black curve is the normal's, and the green dashed line is a
          power law fitted through the largest days.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The normal curve drops off a cliff, but the US days fall along a fairly straight line. Fitted through the 200 largest days, the exponent is about 3.1 for both falls and rises. The physicists Parameswaran Gopikrishnan, Eugene Stanley and their colleagues found exponents near 3 for individual US stocks, and later for market indices, and called it the <span class="bold">inverse cubic law</span>.
      </p>
      <p>
        An exponent of 3 means that a day twice as large is about 8 times rarer. That's a much gentler fall than the normal's. In our data,
        days beyond ten standard deviations are 11 times rarer than days beyond five, while the normal says they should be rarer by a factor of about 4 × 10¹⁶.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What an exponent of 3 does</h3>
      <p>
        A power-law tail also tells us which averages exist. For a tail exponent {@html katexify("\\alpha")}, the average of
        {@html katexify("|z|^p")} is finite only when {@html katexify("p")} is smaller than {@html katexify("\\alpha")}:
      </p>
      <div class="math-display">{@html momentEq}</div>
      <p>
        With {@html katexify("\\alpha")} near 3, the variance ({@html katexify("p = 2")}) exists, so a standard deviation means something.
        But the fourth power ({@html katexify("p = 4")}) has no finite average, and that's what the most popular measure of fat tails is built
        on. The <span class="bold">kurtosis</span> is
      </p>
      <div class="math-display">{@html kurtEq}</div>
      <p>
        which is 3 for a normal distribution. If the fourth moment doesn't exist, the kurtosis of a sample has no true value to settle at.
        Let's see what that looks like by simulating Student t distributions, which have power-law tails whose exponent we can choose.
      </p>
    </section>

    <Figure id="fig-kurt" title="Kurtosis that settles, and kurtosis that doesn't" sub="Drag the slider to change the sample size, and switch the US window length.">
      {#snippet children(w)}
        <KurtosisLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          In the top panel each line is one simulated sample's kurtosis as it grows, and the dashed line is 6, the true kurtosis with an
          exponent of 6. In the bottom panel, the pink part of each bar is what the window's single biggest day contributes.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With an exponent of 6, the four samples wander at first and then settle near 6. With an exponent of 3, they never settle. Each new
        extreme day knocks the kurtosis up, and quiet stretches let it drift down until the next one. If we simulate many samples, the typical kurtosis with an exponent of 3 is about 15 after 1,000 days, and it roughly doubles each time the sample grows tenfold, to around 70 after 100,000. The longer we look, the bigger it gets.
      </p>
      <p>
        The US market's kurtosis behaves the same way. Over the whole century it's 19.1, but window by window it swings from 5.2 in 1977 to
        1986 to 73.3 in 1987 to 1996. In that decade, one day, 19 October 1987, supplies 84% of the whole. So a kurtosis measured on a sample
        tells us mostly about the worst day the sample happens to contain.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Fat tails change how we should read a few common numbers, and four things are worth keeping in mind.</p>
      <p>
        First, risk measures built on the normal get the tails wrong in a particular way. The normal puts 1% of days beyond 2.33 standard
        deviations down, and the data have 1.87% there. At the normal's 0.1% line, the data have 0.83%, eight times as many. Closer in it's
        the other way round: at the normal's 5% line the data have only 4.1%, because fat tails come with a thin middle. The next article,
        on value at risk, picks this up.
      </p>
      <p>
        Second, the tail exponent is an estimate too. Fitted through the 50 largest falls it's 3.9, and through the largest 800 it's 2.7,
        because the further in we go the less the days follow a pure power law. If you try the different fits in the log–log chart, you'll
        see the line swing.
      </p>
      <p>
        Third, some of the fat tail comes from volatility that changes over time. A calm year and a stormy year mixed together look fat-tailed
        even if each one alone were normal. The article on volatility clustering, two along, separates the two effects.
      </p>
      <p>
        And finally, adding days together thins the tails without removing them. Monthly returns have a kurtosis of 10.4, lower than the
        daily 19.1, but there are still 17 months beyond three standard deviations where a normal expects about three.
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
