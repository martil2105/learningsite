<script>
  /* App.svelte for index-construction */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import DriftFigure from "./Components/DriftFigure.svelte";
  import TurnoverChart from "./Components/TurnoverChart.svelte";
  import IndexLab from "./Components/IndexLab.svelte";
  import katexify from "./katexify.js";
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're building an index of 100 stocks, a single number that tracks how they're doing together, and a fund that holds
        them. Before anything else we have to decide how much of each stock to hold. The most common answer is to hold each in proportion to
        the company's market value, which gives a <span class="bold">cap-weighted</span> index, short for capitalisation. Most of the big
        stock indices work this way. The other simple answer is to hold the same amount of each, which gives an
        <span class="bold">equal-weighted</span> index.
      </p>
      <p>
        In the <a href="../diversification/">diversification</a> article we held stocks in equal weights and found that the portfolio grew
        faster than the stocks in it, by half the variance it removed. Here we'll ask whether a cap-weighted index misses out on that gain, and
        the answer turns out to depend on something neither index controls.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The index that never trades</h3>
      <p>
        Let's start with three stocks, A, B and C, worth the same, so both indices hold a third of each. Over a month A rises, B stays put and
        C falls by the same amount. Our cap-weighted index now holds 40% in A, 33.3% in B and 26.7% in C, and those are also the three
        companies' new shares of the total market value. So we already hold what we should, without a single trade. That's true for
        any moves at all, because a cap-weighted index is simply what we'd hold if we bought every company once and kept it.
      </p>
    </section>

    <Figure id="fig-drift" title="Three stocks, one month" sub="Drag how far A rises and C falls.">
      {#snippet children(w)}
        <DriftFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The bars are each index's weights after the month. The dashed outlines are where the equal-weighted index has to get back to, and
          the arrows are its trades.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Our equal-weighted index starts in the same place and drifts the same way, but then we have to trade back to a third each. We sell
        6.7% of the fund's value in A and buy the same amount of C. In other words, every time we rebalance we sell a little of what went up
        and buy a little of what went down. If you drag the moves to zero, you'll see that nothing needs to happen, and the further apart the
        stocks move, the more it trades.
      </p>
      <p>
        Our cap-weighted index isn't completely still, though. We'd trade when a company joins or leaves, and when a company issues or buys back shares.
        The published level is the index's total value divided by a number called the <span class="bold">divisor</span>, which is changed at
        those moments so that the level doesn't jump. But prices moving never make us trade.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How much does the equal-weighted index trade?</h3>
      <p>
        Let's give each of our 100 stocks its own moves with a volatility {@html katexify("\\sigma")} of 30% a year, on top of what the market
        does to all of them. If we rebalance {@html katexify("f")} times a year, each rebalance trades back about half the average distance
        from equal weights, and over a year we trade
      </p>
      <div class="math-display">{@html katexify("\\text{traded a year} \\approx \\sigma\\,\\sqrt{\\frac{f}{2\\pi}}", true)}</div>
      <p>
        of the fund. What we gain from those trades is a different matter. Each rebalance earns half the spread of the stocks' returns since
        the last one, and the spreads over a year add up to the same total however we slice the year. So the <span class="bold">rebalancing
        gain</span>, the extra growth our trades buy us, is about
      </p>
      <div class="math-display">{@html katexify("\\text{gain a year} \\approx \\tfrac{1}{2}\\,\\sigma^2", true)}</div>
      <p>
        whether we rebalance once a year or every day. The chart below puts the two side by side.
      </p>
    </section>

    <Figure id="fig-turnover" title="Trading more, gaining the same" sub="Drag the stock-specific volatility.">
      {#snippet children(w)}
        <TurnoverChart width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Both panels share the same axis of how often the index rebalances. The lines are the two formulas and the rings come from simulated
          daily moves.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At 30% volatility we trade 12% of the fund a year if we rebalance yearly, 24% quarterly, 41% monthly and 189% daily. The
        gain is 4.5% a year in every case. So rebalancing every day buys us nothing that rebalancing every quarter doesn't, and we'd trade about
        eight times as much. The S&amp;P 500's equal-weighted version, for one, rebalances once a quarter. If you drag the volatility, you'll
        see the trading grow in step with it and the gain with its square.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Where does the gain go?</h3>
      <p>
        So our equal-weighted index earns a steady 4.5% a year from rebalancing, and our cap-weighted one never rebalances. We'd naturally
        expect the equal-weighted index to pull ahead by about that much. To see whether it does, we can use an identity that splits the gap
        between our two indices exactly, for any returns at all:
      </p>
      <div class="math-display">{@html katexify("\\ln\\frac{\\text{EW}_T}{\\text{CW}_T} \\;=\\; \\underbrace{\\sum_t \\ln\\frac{A_t}{G_t}}_{\\text{rebalancing gain}} \\;+\\; \\underbrace{\\ln\\frac{\\bar{w}_T}{\\bar{w}_0}}_{\\text{change in concentration}}", true)}</div>
      <p>
        Here {@html katexify("A_t")} and {@html katexify("G_t")} are the arithmetic and geometric means of the stocks' returns over each
        period between rebalances (one plus the return, strictly), so each term of the sum is at least zero. And
        {@html katexify("\\bar{w}")} is the geometric mean of the cap-weighted index's weights, which is largest when the weights are equal and
        falls as the index concentrates in fewer companies. The identity comes from Robert Fernholz's work on what he called stochastic
        portfolio theory, and every step of it is ordinary algebra. The lab below runs 30 years of one market, and we rebalance every month.
      </p>
    </section>

    <Figure id="fig-index" title="Thirty years of two indices" sub="Try another market, then switch to a market where big firms slow down.">
      {#snippet children(w)}
        <IndexLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The first chart is what a dollar grows to in each index, on a log scale. In the second, the blue line is the gap between them, and
          the green and pink lines are the two parts it splits into, at every date.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        In our first market, a dollar grows to $9.92 in the equal-weighted index and $9.30 in the cap-weighted one. The rebalancing gain adds
        1.33 to the log of their ratio, about what the formula promised, but the change in concentration takes away 1.27, which leaves the
        equal-weighted index 0.06 ahead, or about 7%. Meanwhile our cap-weighted index has concentrated. One common measure is the
        <span class="bold">effective number of stocks</span>, one over the sum of the squared weights, which is 100 for equal weights and 1
        for a single stock. Ours has fallen from 100 to about 19.
      </p>
      <p>
        Let's try a few more markets. If you click through them, you'll see the gap move around by about a quarter either way. It stays centred near zero, while the gain is always
        about 1.3, and over many markets like these the concentration takes back about 97% of the gain on average. Why do the two parts cancel? In this market every stock has the same prospects, so the companies' sizes spread apart like
        a random walk, and the variance of their logs grows by {@html katexify("\\sigma^2")} every year. The geometric mean of the weights falls
        by about half of that variance, so the concentration term falls by about {@html katexify("\\tfrac{1}{2}\\sigma^2")} a year, which is the
        gain. What we earn in one index by selling the winners, we earn in the other by letting them run.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">When big firms slow down</h3>
      <p>
        That cancellation depends on concentration rising for ever, and real markets don't do that. If one company kept growing faster than
        the rest, it would end up as the whole market. So let's switch our market to one where each company's size is pulled a little back towards
        the average every year, and big firms grow more slowly than small ones.
      </p>
      <p>
        If you switch the market, you'll see the pink line flatten out. The index stops concentrating, and in our first market it settles at about 49 effective
        stocks while the gain keeps coming. The equal-weighted index ends 0.89 ahead there, 2.4 times as rich. Notice where our lead comes from, though. The
        equal-weighted index grows to $9.93, about what it did before, and it's the cap-weighted index that falls behind, to $4.07, because it
        keeps most of our money in the firms being pulled back.
      </p>
      <p>
        So the identity doesn't say which index is better. It says what the gap is made of. If the largest companies' share of the market keeps
        rising, the cap-weighted index gets the rebalancing gain back through concentration, and over a stretch when they pull ahead it's the
        one that wins. If their share only rises and falls, the equal-weighted index keeps most of its gain.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our two indices live in a simple market, and we've left four things out of it.</p>
      <p>
        First, trading costs money. Our rebalancing gain has to pay for the equal-weighted index's trading and any tax on it, and stocks in big
        indices often have less stock-specific volatility than 30%, which shrinks the gain with its square.
      </p>
      <p>
        Second, our stocks all have the same volatility and, in the first market, the same prospects. Real equal-weighted indices hold much
        more of the smaller companies than cap-weighted ones do, and smaller companies behave differently, so part of any real gap comes from
        that tilt rather than from rebalancing.
      </p>
      <p>
        Third, the identity is accounting. It holds exactly in any market we could build, which is its strength, but it can't tell us why
        concentration moved the way it did.
      </p>
      <p>
        And finally, our cap-weighted index never changes its members, and we never add new shares. A real one adds and drops companies and adjusts for share issues, which
        makes it trade a little and changes which firms the concentration falls on.
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
