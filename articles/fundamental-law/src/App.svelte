<script>
  /* App.svelte for fundamental-law */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import IcScatter from "./Components/IcScatter.svelte";
  import BreadthLab from "./Components/BreadthLab.svelte";
  import ManagerBars from "./Components/ManagerBars.svelte";
  import RiskLab from "./Components/RiskLab.svelte";
  import katexify from "./katexify.js";

  const lawEq = katexify("\\text{IR} \\approx \\text{IC} \\times \\sqrt{N}", true);
  const swingEq = katexify("\\text{IR} = \\frac{\\text{IC}}{\\sqrt{\\sigma^2 + \\left(1 + \\text{IC}^2 + \\sigma^2\\right)/N}}", true);
  const ratioEq = katexify("\\text{IR} = \\frac{\\text{average IC}}{\\text{standard deviation of the month's IC}}", true);
  const tcEq = katexify("\\text{IR} \\approx \\text{TC} \\times \\text{IC} \\times \\sqrt{N}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're choosing between two stock pickers. One makes a few confident calls, and the other makes a great many faint ones. Which
        is the better hire depends on how we measure skill and how we count calls, and finance has a famous one-line answer to both, Richard
        Grinold's <span class="bold">fundamental law of active management</span>.
      </p>
      <p>Before we get to the law, here are the two managers.</p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Skill is a small correlation</h3>
      <p>
        We usually measure a manager's skill by her <span class="bold">information coefficient</span>, or IC, the correlation between her
        forecasts and the returns that follow. Each month she scores every stock she covers, the stocks then do whatever they do, and the IC
        tells us how well the two line up. Let's look at one month of 500 forecasts against what happened next.
      </p>
    </section>

    <Figure id="fig-ic" title="One month of forecasts" sub="Drag the slider to change the information coefficient.">
      {#snippet children(w)}
        <IcScatter width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each dot is a stock, placed by its forecast and by the return that followed. The pink line is the best straight-line fit, and its slope
          is this month's estimate of the information coefficient.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At 0.02 we see a round blur and a fitted line that's barely tilted. A forecast with that IC gets the direction of a stock right
        50.6% of the time, against a coin's 50%, and even Manager A's 0.06 only lifts that to 51.9%. In this particular month the forecasts got
        53.0% of the stocks right, more than their real edge would give, so one month of 500 stocks can't tell us whether an IC of 0.02 is skill or luck.
      </p>
      <p>
        If you drag the slider up to 0.3, you'll see a tilt you can spot by eye. A stock forecast that good would be extraordinary, and the
        signals we meet in practice live down near the bottom of the slider.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Breadth</h3>
      <p>
        So how does anyone make money with so little edge? The answer is to make many bets at once. If we hold positions that follow our
        forecasts, each stock adds a little expected return and a little noise. The expected returns add up in step with the number of stocks {@html katexify("N")},
        but independent noise only adds up as the square root of {@html katexify("N")}.
      </p>
      <p>
        The ratio of the two is our <span class="bold">information ratio</span>, or IR, the active return we earn for each unit of active
        risk we take. It grows with the square root of the number of bets:
      </p>
      <div class="math-display">{@html lawEq}</div>
      <p>
        That's Grinold's law, and the number of independent bets is called <span class="bold">breadth</span>. Our managers rebalance every
        month, so a year holds twelve rounds of bets and the yearly ratio is the square root of twelve times the monthly one. That's where the
        textbook answer comes from: B's 0.02 over 1,000 stocks gives 2.2 a year, while A's 0.06 over 50 gives 1.5.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">When the IC itself moves</h3>
      <p>
        The law treats every month alike. In its world, each month's IC is the long-run IC plus noise from the particular stocks we
        happened to hold, and with enough stocks that noise averages away. Real signals don't behave like that. A value signal has good months and bad months across the whole market
        at once, as cheap shares as a group do well or badly. Let's call the standard deviation of that month-to-month swing
        {@html katexify("\\sigma")}.
      </p>
      <p>
        The swing hits every stock in the same month, so adding stocks can't diversify it away. Once we allow for it, the ratio becomes
      </p>
      <div class="math-display">{@html swingEq}</div>
      <p>
        With {@html katexify("\\sigma = 0")} this is Grinold's law again. With a swing, the noise from the stocks still shrinks as
        {@html katexify("N")} grows, but {@html katexify("\\sigma^2")} stays, and the ratio can never rise past the IC divided by
        {@html katexify("\\sigma")}.
      </p>
    </section>

    <Figure id="fig-breadth" title="Breadth with and without a swing" sub="Drag the sliders to change the signal, its swing and the number of stocks.">
      {#snippet children(w)}
        <BreadthLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dashed curve is Grinold's law and the blue curve allows for the swing. The green dotted line is the ceiling the blue curve
          approaches, and the dots mark the chosen number of stocks.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With an IC of 0.02 and a swing of 0.05, 500 stocks give us a ratio of 1.03 a year, against Grinold's 1.55. Quadrupling to 2,000
        stocks should double our ratio to 3.10. Instead it creeps up to 1.26, under a ceiling of 1.39.
      </p>
      <p>
        We can say the same thing in bets. With this swing, 500 stocks are worth 222 independent bets a month and 2,000 stocks are worth 333,
        and no number of stocks gets past 400. If you set the swing to zero, you'll see the two curves become one.
      </p>
      <p>
        Is a swing of 0.05 realistic? We can check against Edward Qian and Ronald Hua, who measured the IC of sixty quantitative strategies on US shares from 1987 to
        2003. On average it moved about one and a half times as much from period to period as noise from the stocks alone would explain. At
        500 stocks, a swing of 0.05 gives that same multiple.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The two managers again</h3>
      <p>Now let's go back to our two managers, and give both of their signals the same swing.</p>
    </section>

    <Figure id="fig-managers" title="The two managers, with a swing" sub="Drag the slider to add the same swing to both signals.">
      {#snippet children(w)}
        <ManagerBars width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar is a manager's information ratio a year, and the dashed tick across it is the ratio Grinold's law gives her.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With no swing, B is well ahead, 2.2 to 1.5. As you drag the slider, B's bar falls quickly while A's barely moves, and A takes the lead
        once the swing passes about 0.04. At 0.05 the order has flipped, with 1.38 for A against 1.17 for B.
      </p>
      <p>
        We've seen this arithmetic already. A's 50 stocks are so few that the noise from stocks dwarfs the swing, so adding it changes
        little. B's 1,000 stocks had averaged that noise almost away, so the swing becomes most of her risk.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Where the extra risk hides</h3>
      <p>
        This has a practical side for anyone running money. A manager sizes her positions with a risk model, which estimates her tracking error from the
        stocks' own volatilities and correlations. It has no way to know that her skill moves from month to month, so it reports the same risk
        with or without the swing.
      </p>
      <p>
        Let's simulate ten years of one manager's monthly returns against her benchmark, with her positions sized so that her risk model
        expects a tracking error of 4% a year.
      </p>
    </section>

    <Figure id="fig-risk" title="Ten years of active returns" sub="Choose a manager, and drag the slider to add the swing.">
      {#snippet children(w)}
        <RiskLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar is one month's return against the benchmark, and the green line is her expected return. The dashed lines sit two of the
          risk model's standard deviations either side of it, so about one month in twenty should land beyond them.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With no swing, B's months stay inside the lines, much as her model expects. Add a swing of 0.05 and the bars spill over, and her
        tracking error rises to 7.5% a year in the long run. Her average return doesn't change at all, because the swing averages out to zero,
        so she earns the same return for almost twice the risk. If you switch to A, the same swing only takes her to 4.2%.
      </p>
      <p>
        This was Qian and Hua's main point, and it gives us a neater way to write the ratio. The information ratio is simply the average IC
        divided by how much the IC moves from month to month:
      </p>
      <div class="math-display">{@html ratioEq}</div>
      <p>Grinold's law is the special case where the only movement comes from the stocks themselves.</p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our version of the law is still a simplification, and four things are worth knowing.</p>
      <p>
        First, the IC is an estimate. A manager's 0.02 comes from her past months, and with a swing of 0.05 we'd need about 45 months of returns
        before it's two standard errors away from zero.
      </p>
      <p>
        Second, constraints. Roger Clarke, Harindra de Silva and Steven Thorley added a <span class="bold">transfer coefficient</span> in 2002,
        the correlation between the positions a manager's forecasts call for and the ones she can actually hold. A fund that can't sell short
        can't act on part of its forecasts, and the ratio falls in proportion:
      </p>
      <div class="math-display">{@html tcEq}</div>
      <p>
        Third, trading costs. Breadth from rebalancing often isn't free, and every ratio on this page is before costs, which is part of why
        they're higher than most managers achieve.
      </p>
      <p>
        And finally, the swing is one way of saying the bets aren't independent. Stocks in the same industry or with the same style also move
        together within a month, and each shared movement cuts breadth in the same way. Zhuanxin Ding and Douglas Martin rebuilt the law on a
        factor model in 2017, with each month's IC treated as a factor return that varies over time.
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
