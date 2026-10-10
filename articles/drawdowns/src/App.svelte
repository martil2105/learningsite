<script>
  /* App.svelte for drawdowns */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import PathLab from "./Components/PathLab.svelte";
  import ScaleFigure from "./Components/ScaleFigure.svelte";
  import NextFigure from "./Components/NextFigure.svelte";
  import DeepFigure from "./Components/DeepFigure.svelte";
  import UsFigure from "./Components/UsFigure.svelte";
  import katexify from "./katexify.js";

  let sr = $state(0.5);
  const zeroEq = katexify("\\mathbb{E}[D_T] = \\sqrt{\\tfrac{\\pi}{2}} \\; \\sigma \\sqrt{T} \\qquad \\text{(no edge)}", true);
  const edgeEq = katexify("\\mathbb{E}[D_T] \\approx \\frac{\\sigma^2}{\\mu} \\left( \\tfrac{1}{2} \\ln \\frac{\\mu^2 T}{\\sigma^2} + 0.64 \\right) \\qquad \\text{(an edge, a long record)}", true);
  const backEq = katexify("\\mathbb{E}[\\text{years to get back}] = \\frac{d}{\\mu}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're about to launch a fund built on a trading strategy we believe in. We have ten years of backtest, and in its worst stretch our strategy fell about 30% below the highest value it had reached before. That fall is the backtest's
        <span class="bold">maximum drawdown</span>: a <span class="bold">drawdown</span> is how far the strategy sits below its last peak, and
        the maximum is the deepest one in the record.
      </p>
      <p>
        Investors look at that number early, and many funds turn it into a rule. If live trading ever falls further than the backtest's worst,
        something must have changed, so we switch the strategy off. It sounds careful, since the backtest has shown us how bad things get.
        Here's a question to try before we test the rule.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <p>
        So within ten years, our careful rule switches off half of the strategies that are still working perfectly well. Let's watch it happen
        to one of them.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">One strategy, forty years</h3>
      <p>
        Our strategy earns 7.5% a year above cash with a volatility of 15%, so its Sharpe ratio is 0.5. We'll measure both on the log of its
        value, and we'll let its days be independent of each other, so nothing about it ever changes. The first ten years are our backtest, and
        the thirty after them are live. Live trading measures its drawdowns from its own start, the way a new fund does.
      </p>
    </section>

    <Figure id="fig-path" title="A backtest, then thirty live years" sub="Press &quot;Another path&quot; to run the same strategy again, or change its Sharpe ratio.">
      {#snippet children(w)}
        <PathLab width={w} bind:sr />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The shading in the second chart is how far the strategy sits below its last peak, and the blue staircase is the worst fall so far.
          The pink dashed line carries the backtest's worst into the live years, and the pink dot marks the first time live trading goes past it.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        In the first path, the backtest's worst fall is 28.9%, and live trading goes past it in its fifth year. If you press "Another path" a
        few times, you'll see that it sometimes takes more than a decade, and in one of the paths it doesn't happen in thirty years. But more often than not, the line gets crossed in the end. If you set the Sharpe ratio to zero, the same random days carry no edge, and you'll see the falls get deeper and the staircase step down faster. At a Sharpe ratio of 1, the strategy pulls away from its dips quickly, and much of the staircase's descent comes in the first few years.
      </p>
      <p>
        Notice that each staircase only ever steps down. The worst fall so far can't get smaller, and every extra year is another chance to beat it. So the maximum drawdown isn't really a property of the strategy. It's a property of the strategy and the length of the record
        together, and a ten-year backtest and thirty live years are records of different lengths.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How fast does the worst get worse?</h3>
      <p>
        Let's measure that. A random walk wanders about as far as the square root of the time it has been walking, so its dips do too. For a strategy with no edge, whose log value is a random walk, the expected worst drawdown in log points grows exactly like the square root of the years we watch:
      </p>
      <div class="math-display">{@html zeroEq}</div>
      <p>
        An edge changes this. Malik Magdon-Ismail and his co-authors worked out the expected worst drawdown of a random walk with a drift
        {@html katexify("\\mu")} in 2004, and for a long record it grows only like the logarithm of the years:
      </p>
      <div class="math-display">{@html edgeEq}</div>
    </section>

    <Figure id="fig-scale" title="The typical worst fall, by years watched" sub="Switch between years and the strategy's own units.">
      {#snippet children(w)}
        <ScaleFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each curve is the median of the worst drawdown at 15% volatility. In the strategy's own units, the curves for every Sharpe ratio above
          zero lie on the wide grey line, between a square-root shape for short records and a logarithmic one for long ones.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With no edge, the typical worst fall is 15.8% in a year, 42.0% in ten and 66.4% in forty. Our strategy, at a Sharpe ratio of 0.5,
        starts almost the same, with 13.6% in a year. It then bends away, reaching 29.5% in ten years and only 40.8% in forty.
      </p>
      <p>
        Both formulas measure the depth in units of {@html katexify("\\sigma^2/\\mu")} and the time in units of
        {@html katexify("\\sigma^2/\\mu^2")}, which is one over the Sharpe ratio squared. If you switch to the strategy's own units, you'll see
        why: measured that way, every strategy with an edge has the same worst drawdown, and the curves for 0.25, 0.5 and 1 become three
        stretches of one line. The square root rules for the first stretch of that line, and the logarithm after it. For our strategy the unit
        of time is four years, for a Sharpe ratio of 0.25 it's sixteen, and for a Sharpe ratio of 1 it's one. It's the same yardstick that
        measures the long run in the article on the Kelly criterion.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Live trading against the backtest</h3>
      <p>
        Now we can go back to our rule. The chance that live trading goes past the backtest's worst depends on how long each of them runs.
      </p>
    </section>

    <Figure id="fig-next" title="Going past the backtest's worst" sub="Switch the length of the backtest, or take the edge away.">
      {#snippet children(w)}
        <NextFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each curve is the chance that live trading has already gone past the backtest's worst drawdown, against the years it has run. The grey
          line marks as many live years as the backtest had.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With our ten-year backtest, live trading goes past the backtest's worst within a year only 4.0% of the time, so the rule looks safe at
        first. But the chance grows with every year. It's 31.0% within five years, 50.0% within ten, 68.4% within twenty and 82.4% within
        forty.
      </p>
      <p>
        The half at ten years isn't a coincidence of our numbers. If you switch the backtest's length or set the Sharpe ratio to zero, the curve
        still passes through 50% exactly where live trading has run as long as the backtest did. That's because two stretches of the same
        strategy of the same length are two draws of the same thing, and each is as likely as the other to hold the deeper fall. With no edge there's even a mirror. Live trading goes past the worst of ten backtest years within five years 27.2% of the time and within twenty years 72.8% of the time, and the two add up to one. That's because without an edge only the ratio of the two lengths matters, and halving it is the same as doubling it with the roles swapped.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How deep is too deep?</h3>
      <p>
        Maybe our rule just needs a deeper line. Let's say we'd accept switching off a working strategy 1 time in 20, and set the line where
        that happens. The question is how often the line catches a strategy whose edge has gone.
      </p>
    </section>

    <Figure id="fig-deep" title="A working strategy and a dead one" sub="Drag the line, or switch how many years of live trading we wait.">
      {#snippet children(w)}
        <DeepFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The two curves show how likely each worst drawdown is, for a strategy that still works and for one with no edge left. The shading is
          the share of each that goes past the line.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Over five live years, a working strategy goes past a fall of 40.6% 1 time in 20. A strategy with no edge at all goes past it only 24.1%
        of the time, so three dead strategies in four survive the rule. Waiting longer helps, but slowly. Over two years the line sits at 31.4%
        and catches 15.1% of dead strategies, and over ten years it sits at 47.3% and catches 35.4%.
      </p>
      <p>
        The reason is that a drawdown is mostly made of volatility, which both of our strategies share, and only a little of drift, which is
        the thing we want to test. The two curves overlap so much because they differ only in the part that's small.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Climbing back</h3>
      <p>
        The other half of a drawdown is the time it takes to recover. Here the random walk has a neat answer. If our strategy sits
        {@html katexify("d")} log points below its peak, the expected time to get back there is
      </p>
      <div class="math-display">{@html backEq}</div>
      <p>
        This is Wald's identity at work: the drift covers the distance at {@html katexify("\\mu")} a year on average, and the volatility, which
        adds as much up as down, doesn't enter at all. For our strategy, a fall of 30% takes 4.8 years to make up on average. A strategy with no edge does get back in the end, but its expected time to get back is infinite. So the time spent below a peak is even less of a guide to whether an edge has gone than the depth is, since a working strategy can easily spend years down there.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What a random walk leaves out</h3>
      <p>
        Everything so far assumed independent days with a fixed volatility. Let's hold the real US stock market up against that, using the
        daily returns in Kenneth French's data library from July 1926 to August 2026. Over that century the market's log value grew 9.8% a
        year with a volatility of 17.5%.
      </p>
    </section>

    <Figure id="fig-us" title="The US market below its last peak" sub="Each dip is a fall from the highest value before it, dividends included.">
      {#snippet children(w)}
        <UsFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The pink lines come from a random walk with the market's own drift and volatility, run for the same hundred years.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        A random walk like that has a typical worst fall of 50.9% in a century, and only 1 century in 100 goes past 74.1%. The fall of 2007 to
        2009, at 54.6%, is about what the random walk expects. But from September 1929 to July 1932 the market fell 84.1%, and it took until
        February 1945 to get back. A random walk with the market's own drift and volatility falls that far in about 1 century in 2,400. The climbs back were quicker than the random walk expects, too. From the low of 1932, the market's drift alone would take 18.8 years on average to make up the fall, and it took 12.6. From the low of March 2009 it would take 8.1, and it took 3.0.
      </p>
      <p>
        The difference is that real volatility comes in clusters, and from 1929 to 1932 it ran at about twice its average. A random walk with one fixed volatility rarely produces a crash like that, so for real markets its drawdowns are closer to a floor than a forecast.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our random walk made drawdowns easy to reason about, and it left some things out on purpose.</p>
      <p>
        First, we knew the edge. In practice we estimate it from the backtest, and a Sharpe ratio estimated from ten years of data has a standard error of about 0.3, so we may not even know whether there was an edge to lose.
      </p>
      <p>
        Second, our days were independent and our volatility was fixed. The US market shows that real drawdowns can be much deeper, and a strategy whose risk is scaled down when volatility rises can have shallower ones.
      </p>
      <p>
        Third, real backtests are chosen. A strategy picked from many for its small drawdown has a backtest worst that's luckier than typical,
        so live trading goes past it sooner than our coin toss says.
      </p>
      <p>
        And finally, we measured falls in log points and turned them into money at the end. That's what makes the formulas clean, and it means
        the averages in the formulas are averages of log falls, not of percentages.
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
