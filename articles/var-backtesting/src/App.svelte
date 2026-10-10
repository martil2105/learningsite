<script>
  /* App.svelte for var-backtesting */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import ZoneLab from "./Components/ZoneLab.svelte";
  import DaysFigure from "./Components/DaysFigure.svelte";
  import CenturyLab from "./Components/CenturyLab.svelte";
  import ShuffleFigure from "./Components/ShuffleFigure.svelte";
  import katexify from "./katexify.js";

  let p = $state(0.01);
  let model = $state("century");
  let block = $state(103);
  const lrEq = katexify("\\text{LR} = -2 \\ln \\frac{(1 - p)^{\\,n - k} \\, p^{\\,k}}{(1 - k/n)^{\\,n - k} \\, (k/n)^{\\,k}}", true);
  const daysEq = katexify("n \\approx \\left( \\frac{z_{0.95} \\sqrt{p_0 (1 - p_0)} + z_{0.8} \\sqrt{p_1 (1 - p_1)}}{p_1 - p_0} \\right)^{2}", true);
  const varEq = katexify("\\text{Var}(K) = n p (1 - p) \\left[ 1 + 2 \\sum_{k=1}^{n-1} \\left(1 - \\frac{k}{n}\\right) \\rho_k \\right]", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Every evening, our bank's risk model sends the regulator one number: the 99% <span class="bold">value at risk</span> of our trading
        book for tomorrow. If the model is right, tomorrow's loss will be bigger than that number on only one day in a hundred. A day when
        the loss is bigger is called an <span class="bold">exception</span>, and counting exceptions is how a value-at-risk model gets
        checked.
      </p>
      <p>
        Over a year of 250 trading days, a right model should have about 2.5 exceptions. Since 1996 the Basel rules have turned that count
        into a <span class="bold">traffic light</span>. Up to four exceptions in the last 250 days is green, five to nine is yellow, and ten
        or more is red. In the green zone our capital for market risk is three times our average value at risk. Each exception in the yellow
        zone raises that multiplier a little, and the red zone takes it to four.
      </p>
      <p>
        It's a simple test, and it's hard to argue with. Before we look at what the count can and can't tell us, here's a question to try.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <p>
        So a model that's wrong by a factor of two passes the regulator's test almost as often as it fails it. Let's see where that comes from.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A count of rare events</h3>
      <p>
        If our model is right, every day is an exception with the same 1% chance, whatever happened the day before. The count over 250 days is
        then a <span class="bold">binomial</span> count, like the number of times a hundred-sided die lands on one in 250 throws. Its average
        is 2.5 and its standard deviation is 1.57, so it's quite normal for a right model to have one exception in a year, or four.
      </p>
    </section>

    <Figure id="fig-zones" title="Exceptions in a year of 250 days" sub="Drag the model's real exception rate, or use the two buttons.">
      {#snippet children(w)}
        <ZoneLab width={w} bind:p />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue bars are the chance of each count for a model whose real rate is on the slider, and the grey caps are a right model's. The
          shaded bands are the traffic light's zones.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With the slider at 1%, most of the blue sits in the green band, but not all of it. A right model lands in the yellow zone in 10.8% of
        years, about one year in nine, and in the red zone in 0.03%. That's no accident, because the zones were drawn from this same binomial.
        A count stays green while a right model would see more exceptions than that in at least 5% of years, and it turns red once a right model would see more in fewer than 0.01% of years.
      </p>
      <p>
        Now press "Twice too many". The blue bars slide to the right, but they still overlap the grey caps a lot. Our optimistic model is green in
        43.9% of years, yellow in 53.1% and red in only 3.0%. On average its multiplier is 3.32, against a right model's 3.05, which is
        about 9% more capital.
      </p>
      <p>
        That isn't the whole story, though, because our optimistic model also reports a smaller number every evening. On the US stock market's
        daily losses since 1927, the loss beaten on 2% of days is 22% smaller than the loss beaten on 1% of them. So even after its bigger
        multiplier, the optimistic model holds 15% less capital than an honest one, and if you drag the slider further right, the gap only
        grows. If losses were normal, the penalty would nearly make up the difference, and the optimistic model would hold only about 4% less.
        It's the fat tails of real losses that make optimism pay so well.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A test with more statistics in it</h3>
      <p>
        A statistician would put the same question as a formal test. Paul Kupiec proposed one in 1995. It compares how likely our count
        {@html katexify("k")} in {@html katexify("n")} days is under the promised rate {@html katexify("p")} with how likely it is under the
        rate we actually saw, {@html katexify("k/n")}:
      </p>
      <div class="math-display">{@html lrEq}</div>
      <p>
        If the model is right, this ratio behaves like a chi-squared variable with one degree of freedom, so we reject the model when it's
        above 3.84. Over 250 days, that accepts any count from 1 to 6. You might notice that it rejects zero as well, since a model with no exceptions in a whole year is probably too cautious. Against our model with twice too many exceptions, though, Kupiec's test says "reject" in
        only 24% of years. A formal test can't find information that the count doesn't hold.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How many days would we need?</h3>
      <p>
        If one year holds too little, the obvious fix is to count over more of them. Let's use the one-sided version of the test, which only
        treats too many exceptions as evidence against us, the way the traffic light does. With 250 days it rejects at six or more, which a
        right model reaches 4.1% of the time.
      </p>
    </section>

    <Figure id="fig-days" title="How long it takes to catch a model" sub="Switch the model's real rate to move the dot.">
      {#snippet children(w)}
        <DaysFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each curve is the chance of catching a model with the real rate on its label, against the days we count over. The dot marks where
          the chosen curve climbs above the dashed line for good, and the grey vertical line is one year.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With 2% picked, the readouts are for our model with twice too many exceptions, and one year of data catches it 38% of the time. To catch it 80% of the time, we need
        1,015 days, which is about four years. A model that's only half as far off, with a real rate of 1.5%, takes 3,295 days, about
        13 years. A model at 3% takes 340, and the readouts give the same numbers for whichever rate you pick.
      </p>
      <p>
        The curves are jagged because a count is a whole number. As the days go up, the count that triggers a rejection moves up one exception
        at a time, and each step knocks the curve back a little. Underneath the jags there's a simple rule, which comes from treating the count
        as roughly normal, with {@html katexify("p_0")} the promised rate and {@html katexify("p_1")} the real one:
      </p>
      <div class="math-display">{@html daysEq}</div>
      <p>
        The gap between the two rates sits squared under everything else. So if we want to catch a model that's half as far off, we need
        three or four times as many days. Four years of the same model is a lot to ask, since banks change their models and their books all
        the time. That's the first thing a count can't do for us.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A century of real days</h3>
      <p>
        The second problem only shows up on real data. Let's hold one position, a dollar in the whole US stock market, and run four
        value-at-risk models over the daily returns in Kenneth French's data library, from 1927 to August 2026. We'll split the last 26,000
        days into 104 blocks of 250, the length of a regulator's year, so that the newest block ends on the last day we have.
      </p>
      <p>
        Our first model cheats. It <span class="bold">knows the century</span>, and it reports the same number every evening: the loss
        beaten on 1% of all 26,000 days, which is 3.09%. The second is <span class="bold">historical simulation</span>, the most common
        model at banks, and each evening it reports the third-largest loss of the last 250 days. The third is
        <span class="bold">RiskMetrics</span>, the model J.P. Morgan published in 1994. It assumes normal returns, with a volatility built
        from recent squared returns, where each day counts 0.94 times as much as the day after it. The fourth,
        <span class="bold">filtered historical simulation</span>, uses the same volatility, but it takes the shape of the tail from the last
        1,000 days, each day's loss divided by that day's volatility.
      </p>
    </section>

    <Figure id="fig-century" title="Four models on the US market" sub="Switch the model, then drag the block or click a bar to see its days.">
      {#snippet children(w)}
        <CenturyLab width={w} bind:model bind:block />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The bars count each block's exceptions against the zones. In the second chart the blue line sits at minus the value at risk, so each
          pink day is a loss that went past it.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's start with the model that knows the century, which is the one the lab opens on. Over all 26,000 days it has exactly 260 exceptions, 1.00% of them, so a count over
        the whole century can't find anything wrong with it. Block by block, though, it's red 8 times and yellow 10 times, and 49 of its
        blocks have no exceptions at all. A right model would be red about once in 4,000 blocks, and it would have no exceptions in about 8 of
        our 104. If you press "1931–32" or "2008–09", you'll see why: the line stays where it was while the market falls apart around it.
      </p>
      <p>
        Switch to historical simulation and you'll see its line react, but slowly, since a bad day takes a whole year to leave its window. Its rate over the century is
        1.46%, with 3 red blocks and 30 yellow ones. RiskMetrics reacts quickly, but its normal tails are too thin, so it has 2.13% exceptions
        and is red in 9 blocks. Only the filtered model comes close, with 1.07% of days, no red blocks and 15 yellow ones, where a right model
        would have about 11.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Exceptions come in bunches</h3>
      <p>
        Our first model shows that the count can be right while the model is wrong. What it gets wrong is <span class="bold">when</span> the
        exceptions come. To see this, let's keep its 260 exceptions and move each one to a randomly chosen day.
      </p>
    </section>

    <Figure id="fig-shuffle" title="The same exceptions, in a different order" sub="Switch between the real order and a shuffled one, and shuffle as often as you like.">
      {#snippet children(w)}
        <ShuffleFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each tick in the two strips is one exception. The bars count the blocks with each number of exceptions, and the grey caps show what
          independent days at the same rate would give.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Switch to the shuffled order, and the same 260 exceptions give no red blocks and only about as many empty ones as the binomial expects. If you press "Shuffle again" a few times, you'll see the red doesn't come back. So all of the century model's red came from the order of its days, not from how many there were. There's an identity behind this. Let's write
        {@html katexify("\\rho_k")} for the correlation between a day being an exception and the day {@html katexify("k")} days later being
        one. Then the variance of a count over {@html katexify("n")} days is
      </p>
      <div class="math-display">{@html varEq}</div>
      <p>
        The binomial is the case where every {@html katexify("\\rho_k")} is zero. For the model that knows the century, the bracket comes to
        10.3 from the correlations, and we get 10.4 if we measure it directly over every 250-day window. So its yearly count spreads about ten
        times as much as a right model's would. You may recognise the bracket from the article on efficient markets, where the same sum turned
        daily correlations into the variance ratio. Here it's applied to exceptions instead of returns.
      </p>
      <p>
        Peter Christoffersen suggested in 1998 that we test the timing directly. After an exception, the chance of another one the next day
        should still be 1%. For the century model it's 9.6%, and for historical simulation it's 9.2%. RiskMetrics brings it down to 5.6% and
        the filtered model to 4.3%, which is still four times too high, and Christoffersen's test rejects all four of our models.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the rules do now</h3>
      <p>
        The Basel Committee's newer market-risk rules, finished in 2019, kept the traffic light. A bank's capital is now built on a 97.5%
        expected shortfall, but the backtest still counts exceptions of a 99% value at risk over 250 days, with the same zones. The multiplier
        on the capital runs from 1.5 in the green zone to 2 in the red. Each trading desk is counted on its own as well, and a desk with more
        than 12 exceptions in a year loses the right to use its model. The count has survived because it's simple, and because expected
        shortfall can't be checked in the same way.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Counting exceptions is cheap and hard to dispute, which is why it has lasted. It has some limits beyond the two we've seen.</p>
      <p>
        First, a count ignores how big each exception was. A loss just past the line and one ten times the line count the same, so the
        backtest tells us nothing about the tail beyond the value at risk.
      </p>
      <p>
        Second, our position never changed. A bank's book changes every day, so its exceptions come from different portfolios. The bank has to
        work out what yesterday's book would have made today without fees or new trades, and that hypothetical result is one of the numbers compared with the value at risk.
      </p>
      <p>
        Third, the filtered model's 1,000-day window is our own choice, made with the whole century in view, so part of its good score is
        hindsight. With a century of data in front of us, it's easy to find a model that passes on that century.
      </p>
      <p>
        And finally, a regulator sees much less than we did here. Our counts covered a hundred years of one simple position, while a bank's supervisor sees one year at a time, of a book that keeps changing.
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
