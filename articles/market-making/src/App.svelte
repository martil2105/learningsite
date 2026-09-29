<script>
  /* App.svelte for market-making */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import BayesFigure from "./Components/BayesFigure.svelte";
  import TradeLab from "./Components/TradeLab.svelte";
  import LearnChart from "./Components/LearnChart.svelte";
  import BillChart from "./Components/BillChart.svelte";
  import katexify from "./katexify.js";

  // the share of informed traders is shared by the first two figures
  let mu = $state(0.1);
  let horizon = $state(100);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we make a market in one stock. All day we post a price at which we'll buy, called the <span class="bold">bid</span>, and a
        price at which we'll sell, called the <span class="bold">ask</span>, and anyone who wants to trade can take one of them. In the
        <a href="../order-book/">order book</a> article we walked through a book that was already full of quotes like ours. This time we're the
        ones setting them, and our question is how far apart to put them.
      </p>
      <p>
        Here's the catch. The stock is worth either $99 or $101, and we don't know which, but some of the people who trade with us do. Before
        we work out what that does to our quotes, have a guess.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">What a buy order tells us</h3>
      <p>
        Let's work out the ask first. Suppose a buy order arrives. The trader might be one of the informed, who buy only when the stock is
        worth $101, or one of the rest, who buy half the time whatever it's worth. So buy orders turn up more often when the stock is worth
        $101, and after seeing one we should think $101 a little more likely than we did. The ask that breaks even is what the stock is worth
        to us once we've seen the buy:
      </p>
      <div class="math-display">{@html katexify("\\text{ask} = \\mathbb{E}[\\,V \\mid \\text{buy}\\,] = \\$99 + \\$2 \\times P(V = \\$101 \\mid \\text{buy})", true)}</div>
      <p>
        The figure below splits all the traders who might arrive by what the stock is worth and by who they are. The pink cells are the ones
        who send us a buy order, and the question is how much of the pink sits in the $101 column.
      </p>
    </section>

    <Figure id="fig-bayes" title="Who sends a buy order" sub="Drag the share of traders who know.">
      {#snippet children(w)}
        <BayesFigure width={w} bind:mu />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each column is one value the stock could have, and the heights are shares of all the traders who arrive. The ask is the average
          value over the pink cells, and the bid is the average over the blue ones.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With one trader in ten informed, 27.5% of all orders are buys that come when the stock is worth $101, and 22.5% are buys that come
        when it's worth $99. So a buy means $101 with a chance of 55%, and our ask is $100.10. The bid works the same way from the blue
        cells and comes to $99.90. If a share {@html katexify("\\mu")} of traders are informed and we start at even odds, the chance after a
        buy is {@html katexify("(1+\\mu)/2")}, and the quotes are
      </p>
      <div class="math-display">{@html katexify("\\text{ask} = \\$100 + \\mu \\times \\$1, \\qquad \\text{bid} = \\$100 - \\mu \\times \\$1, \\qquad \\text{spread} = \\mu \\times \\$2", true)}</div>
      <p>
        So the spread is the share of informed traders times the range of values the stock could have. If you drag the share to zero, the
        spread closes, because a buy order no longer tells us anything. At 50% it's a whole dollar. This is the market Lawrence Glosten and
        Paul Milgrom described in 1985, in its simplest form. We're assuming other market makers compete with us, so none of us can quote
        wider than the break-even spread and keep the business.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Who pays the spread?</h3>
      <p>
        It's tempting to think of the spread as our income, and a trader who knows nothing does pay it. On average they lose half the spread,
        10 cents. They buy 10 cents above, or sell 10 cents below, what the stock was worth to us before they arrived, and since they know
        nothing, that's what it's worth to them too. But a trader who does know takes 90 cents from us, because they buy at $100.10 a stock worth $101, or sell at $99.90 one
        worth $99.
      </p>
      <p>
        Nine traders in ten pay us 10 cents and one in ten takes 90 cents, so we break even. With a spread {@html katexify("s")} and a range
        {@html katexify("D")} of $2, the two sides of our ledger are
      </p>
      <div class="math-display">{@html katexify("(1-\\mu)\\,\\frac{s}{2} \\;=\\; \\mu\\,\\frac{D - s}{2}", true)}</div>
      <p>
        and with {@html katexify("s = \\mu D")} both come to {@html katexify("\\mu(1-\\mu)D/2")}, which is 9 cents a trade. In other words, the
        spread doesn't pay us at all. It moves money from the traders who don't know to the traders who do, and we stand in the middle and
        break even. A real market maker also has to be paid for its time and for the risk of holding stock, and we'll come back to that at
        the end.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Watching the price learn</h3>
      <p>
        Our quotes don't stay where they start. After a buy we think $101 more likely, so both quotes move up, and after a sell they move down.
        In fact each buy multiplies the odds of $101 by {@html katexify("(1+\\mu)/(1-\\mu)")}, which is 11/9 when one trader in ten knows,
        and each sell divides them by the same amount. The lab below runs a day of trading, one trader at a time, with the stock really worth
        $101.
      </p>
    </section>

    <Figure id="fig-trades" title="One day of trades" sub="Step through the trades, then try another day or a different share who know.">
      {#snippet children(w)}
        <TradeLab width={w} bind:mu />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The pink and blue lines are our ask and bid before each trade, and the dots are the trades at the prices they paid. A ringed dot is
          a trader who knew, which we can see here and the market maker never can.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's run the first day to 300 trades. You'll see the quotes drift up towards $101 and close in on each other. The informed only ever
        buy, so buys outnumber sells, and each one teaches us a little. By the end the traders who didn't know are $10.06 down, the ones who
        knew are $11.44 up, and we're $1.39 down. Notice that the three scores always add up to zero, whatever you do, because every cent a
        trader gains is a cent we lose.
      </p>
      <p>
        Now try the second day. After a good start, a run of random sellers pushes our quotes down towards $99 before trade 60, although
        the stock is worth $101, and they stay below $100 for most of the day. The traders who knew buy cheaply all the while. By trade 300 the traders who didn't know have lost
        $70.83, and we're $23.58 ahead. So breaking even is a promise about the average trade, not about any one day.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How fast does the price learn?</h3>
      <p>
        Since each trade multiplies the odds by the same factor, it moves the log of the odds by a fixed step, up for a buy and down for a
        sell. When the stock is worth $101, buys come with a chance of {@html katexify("(1+\\mu)/2")}, so on average the log odds climb by
        {@html katexify("\\mu")} times that step on every trade. For a small share of informed traders that's about
      </p>
      <div class="math-display">{@html katexify("\\mu \\,\\ln\\frac{1+\\mu}{1-\\mu} \\;\\approx\\; 2\\mu^2 \\text{ per trade}", true)}</div>
      <p>
        and the square in it is the whole story of the next chart. Meanwhile the spread depends on how sure we are. If our belief that the
        stock is worth $101 is {@html katexify("x")}, the spread is
      </p>
      <div class="math-display">{@html katexify("s = \\frac{4\\mu\\, x(1-x)\\, D}{1 - \\mu^2 + 4\\mu^2 x(1-x)}", true)}</div>
      <p>
        which is {@html katexify("\\mu D")} at even odds and closes as we become sure either way. Let's average it over a great many days and
        see how quickly it closes.
      </p>
    </section>

    <Figure id="fig-learn" title="How fast the spread closes" sub="Switch between half and a tenth of the opening width.">
      {#snippet children(w)}
        <LearnChart width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each line is the average spread after a given number of trades, as a share of the first spread, with trades on a log scale. The
          dots mark where each line crosses the dashed level.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        On a log scale the three lines have the same shape and are simply shifted along. With 20% of traders informed, the average spread
        halves after 22 trades. With 10% it takes 85, and with 5% it takes 341. Each time we halve the informed share, the price needs about
        four times as many trades, and if you switch to a tenth of the opening width you'll see the same factor. So a market with fewer
        informed traders has a narrower spread, and a price that stays wrong for much longer.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Who pays for a piece of news?</h3>
      <p>
        Let's put the last two sections together. On every trade the traders who don't know pay half the spread on average, and the spread
        stays open until the price has learned. Suppose the stock's true value is news that only some traders have, and everyone else finds
        out when it's announced. What do the uninformed pay, in all, before then? Let's call that total the bill.
      </p>
      <p>
        If the news never comes out, we add up the half-spreads over every trade until the price has learned. For a small share of informed
        traders the total has a neat limit:
      </p>
      <div class="math-display">{@html katexify("\\text{bill} \\;\\approx\\; \\ln 2 \\times \\frac{(1-\\mu)\\,D}{\\mu}", true)}</div>
      <p>
        That's $12.48 when one trader in ten knows and $26.34 when one in twenty does. Halving the informed share halves the spread, but the
        price takes four times as many trades to learn, so the bill roughly doubles. The same amount goes to the traders who know, and none of
        it stays with us. An announcement caps the bill, though, and the chart below adds it up only to the trade when the news comes out.
      </p>
    </section>

    <Figure id="fig-bill" title="What the uninformed pay before the news is out" sub="Switch when the news comes out.">
      {#snippet children(w)}
        <BillChart width={w} bind:n={horizon} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue line is the bill when the news comes out after the chosen number of trades, and the dashed line is the bill when it never
          does. The dot marks the largest bill, and the chart stops at $30.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With the news out after 100 trades, the bill is small when hardly anyone knows, because the spread is narrow. It's small again when
        many do, because the price learns within a few trades. In between, the spread is wide enough to cost something and stays open for
        most of the wait, and the bill peaks at 12% informed, at $6.22. If you switch to 1,000 trades, the peak moves down to 4%. As a
        rough guide, the peak sits near 1.2 divided by the square root of the number of trades.
      </p>
      <p>
        So a narrow spread isn't the same thing as a cheap market for the traders who don't know. It can mean the news is leaking into the
        price slowly, and that they'll be paying for it for longer.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our market is the simplest version of Glosten and Milgrom's, and it leaves a lot out, in four ways.</p>
      <p>
        First, our spread is all adverse selection, the cost of trading with people who know more. Real market makers also pay for their time
        and systems, and for the risk of holding stock they didn't want, and those costs widen the spread whether or not anyone is informed.
        Studies that split real spreads into these parts find all of them.
      </p>
      <p>
        Second, every trade here is one share, and an informed trader trades as soon as they arrive. In Albert Kyle's model from the same year,
        a single insider chooses how much to trade and hides among the random orders, which changes how quickly the price learns.
      </p>
      <p>
        Third, the stock has two possible values, and the informed know which it is for certain. With more values, or with information that's
        only a hint, the maths gets messier, but the quotes are still the value given a buy and the value given a sell.
      </p>
      <p>
        And finally, the bill is per piece of news. In a market where news keeps arriving, the price never finishes learning, and what
        matters is how much is still unknown on an ordinary day, which our two-value stock can't tell us.
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
