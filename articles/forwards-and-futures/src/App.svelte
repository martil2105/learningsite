<script>
  /* App.svelte for forwards-and-futures */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import OilFigure from "./Components/OilFigure.svelte";
  import CarryLab from "./Components/CarryLab.svelte";
  import ForecastFigure from "./Components/ForecastFigure.svelte";
  import CeilingFigure from "./Components/CeilingFigure.svelte";
  import MarginFigure from "./Components/MarginFigure.svelte";
  import katexify from "./katexify.js";

  const carryEq = katexify("F = S \\, e^{(r - q)T} = 100 \\times e^{0.04 - 0.015} = 102.53", true);
  const oilEq = katexify("F \\le S \\, e^{rT} + \\text{the cost of storing until } T", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        On Monday 20 April 2020, a barrel of oil for delivery in Cushing, Oklahoma, in May cost minus $37.63. Sellers were paying buyers to
        take it. On the same day, a barrel for delivery a month later, in June, cost $20.43. Oil hadn't become worthless overnight. What was
        running out was somewhere to keep it.
      </p>
      <p>
        Prices for delivery at a later date are <span class="bold">forward prices</span>, and it's natural for us to read them as forecasts: if oil
        for June costs more than oil for May, the market must expect prices to rise. Let's see where forward prices really come from, and why that Monday makes sense once we do. You can switch between the Friday before and that Monday in the chart below.
      </p>
    </section>

    <Figure id="fig-oil" title="Two prices for oil" sub="Switch the day.">
      {#snippet children(w)}
        <OilFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">Each bar is the settlement price of a barrel of oil for delivery in that month, on the day chosen.</p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        On the Friday before, the two prices were $18.27 and $25.03, so oil for June cost $6.76 more than oil for May. By Monday evening the
        gap was $58.06. We'll come back to that number once we know what it measures.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Two ways to own something in a year</h3>
      <p>
        Let's start with something simpler than oil: a share index that stands at $100 and pays dividends of 1.5% a year, when the safe rate
        is 4%. A <span class="bold">forward</span> is an agreement made today to buy the index in a year, at a price fixed today. Nothing
        changes hands until then.
      </p>
      <p>
        There are two ways to end up owning the index in a year. We can agree a forward price today, or we can buy the index now with borrowed
        money and hold it. Buying now costs a year's interest but earns a year's dividends, so after a year we owe:
      </p>
      <div class="math-display">{@html carryEq}</div>
      <p>
        That's the <span class="bold">cost of carry</span>, and it's the only forward price that doesn't hand someone free money. You can
        quote a different price in the lab below and see who'd take it.
      </p>
    </section>

    <Figure id="fig-carry" title="Buying now against agreeing a price" sub="Drag the quoted price, the safe rate and the dividend yield.">
      {#snippet children(w)}
        <CarryLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The first chart is forty possible years for the index, with the blue line showing what it costs to buy now and carry it. The second
          shows what each piece of the trade pays at the end of the year, wherever the index ends.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With the quoted price at $104, we can borrow $98.51, buy 0.985 of a unit of the index and reinvest its dividends, so that our holding grows to exactly one unit by the end of the year. We also sell it forward at $104. When the year is up we hand over the index, collect $104, repay the $102.53 we owe and keep $1.47, whatever the index has done. In the second chart, the index and the
        forward pay in opposite directions, and the blue line, the two together, is flat. Every one of the forty years ends on it.
      </p>
      <p>
        If you drag the quoted price below $102.53, the trade turns around: we borrow the index, sell it, lend the money and buy forward. Only at
        $102.53 is there nothing to do. And notice what never came into it: we didn't need a view on where the index was going. Here's a question about that.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">A price, not a forecast</h3>
      <p>
        Both of our traders should accept $102.53. The one who expects $112 might be tempted to pay more, but at any price above $102.53, someone
        would sell her the forward and lock in the difference by buying the index today. The forward price is pinned down by today's prices,
        not by anyone's expectations.
      </p>
    </section>

    <Figure id="fig-forecast" title="Where investors expect the index to be" sub="Drag the return investors expect.">
      {#snippet children(w)}
        <ForecastFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The pink line is where investors expect the index to be, and the shaded band holds the middle 90% of where it could be. The blue line
          is the cost of carrying the index, and it ends at the forward price.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's say investors expect the index to return 8% a year, dividends included. Then they expect it at $106.72 in a year, and if we buy forward at $102.53, we expect to make $4.18. That's the reward for carrying the index's risk without paying for it upfront, the same
        premium a shareholder earns. If you drag the expected return down to 4%, the safe rate, the pink and blue lines meet. Only investors
        who don't care about risk expect a forward price to come true.
      </p>
      <p>
        So a forward price above today's price, which traders call <span class="bold">contango</span>, doesn't mean the market expects a rise.
        Here it's just interest minus dividends.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Oil can be stored, but not lent</h3>
      <p>
        For the arbitrage to work in both directions, we need to be able to buy the index and also to borrow it and sell it. Shares can be
        borrowed. Oil, mostly, can't: the people who hold it have refineries to run, and nobody keeps spare barrels to lend out. So for oil, only one side of our argument works:
      </p>
      <div class="math-display">{@html oilEq}</div>
      <p>
        If the forward price is above the cost of buying oil now, storing it and financing it, we can buy, store and sell forward. If it's
        below, the only people who can profit are those who already hold oil, by selling it now and buying it back forward, and they may
        prefer to keep it.
      </p>
    </section>

    <Figure id="fig-ceiling" title="Which prices an arbitrage rules out" sub="Switch between the index and oil, and drag the quoted price.">
      {#snippet children(w)}
        <CeilingFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Pink prices hand someone a riskless profit. For the index only the cost of carrying survives, and for oil, anything below it does.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's say oil costs $60 a barrel today and $0.50 a barrel a month to store. Buying now, storing it for a year and paying the interest
        costs $68.56, so no price for delivery in a year can sit above that. Below it, anything goes. If you switch to oil, the quoted price starts at $64. At that price, the people holding oil would rather keep it than sell now, buy forward and save $4.56. So having oil on hand must be
        worth at least that to them. Economists call this the <span class="bold">convenience yield</span>, and when it's large the forward
        price can fall below today's price, which is called <span class="bold">backwardation</span>. Nothing about it can be arbitraged away.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Back to April 2020</h3>
      <p>
        Now our two oil prices make sense. Holding a barrel from May to June costs a month of storage and interest, so the June price can't be
        more than the May price plus that cost. On 20 April, June oil was $58.06 above May oil. If anyone could have stored a barrel for a month for less than that, they could have bought oil for May, kept it and sold it for June at a profit. So a month of storage at Cushing must have cost at least $58.06 a barrel to anyone who could find it.
      </p>
      <p>
        Our ceiling held. What changed was the cost of carrying oil. With the tanks nearly full, it shot up, and the price of oil that had to
        be taken in May fell until someone with space would take it, which meant paying them to.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Futures settle every day</h3>
      <p>
        A forward is a private agreement, and nothing is paid until delivery. A <span class="bold">futures contract</span> is the same
        agreement traded on an exchange, with one difference: gains and losses are paid every day. If the futures price rises by $1, the
        buyer is paid $1 by the seller that evening, into a margin account, and the contract carries on from the new price. The futures price
        is the forward price for what's left of the year, so on the last day it meets the index.</p><p>Why would we want that? A forward's loser might not pay at the end, and the bigger the loss, the likelier that gets. Settling every day means nobody ever owes more than a day's move, and the exchange stands between every buyer and every seller. Let's see what the daily payments do to what we end up with.
      </p>
    </section>

    <Figure id="fig-margin" title="A year of daily settlement" sub="Switch the year.">
      {#snippet children(w)}
        <MarginFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The first chart shows the index and the futures price. The second shows the margin account of the tailed position, with interest,
          and the circle is what a forward agreed at the start pays at the end. The third shows how far one contract held all year drifts from
          the tailed position.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Daily payments earn or cost interest, so one contract held all year doesn't quite match a forward. In our year that rises, the forward
        pays $21.39 and one futures contract pays $21.83, because its gains arrived early and earned interest. In the year that rises and falls
        back, the forward loses $9.27 and the futures contract loses only $8.94, since its early gains earned interest before its later losses cost any. If you switch to the year that falls, it's the other way round: the forward loses $27.24 and the futures contract $27.88, because its losses came early and cost interest.
      </p>
      <p>
        The fix is called <span class="bold">tailing</span>. We hold a little less than one contract early on, {@html katexify("e^{-r(T-t)}")}
        of them, so that each day's payment, grown with interest to the end of the year, is exactly that day's change in the futures price.
        Then the payments add up to the futures price at the end minus the futures price at the start, the index minus $102.53, which is the
        forward's payoff on every path. That's why futures prices and forward prices are the same when interest rates don't move, as John
        Cox, Jonathan Ingersoll and Stephen Ross showed in 1981.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our index and our oil were simpler than real ones, and that left a few things out.</p>
      <p>
        First, we held interest rates still. When rates move with the price, as they do for bond futures, the interest on a futures buyer's gains and losses no longer cancels out on average, and futures and forward prices drift apart. For interest rate futures the gap has a name, the
        convexity adjustment.
      </p>
      <p>
        Second, we ignored trading costs and the fees for borrowing shares, so even for the index the price an arbitrage allows is a narrow
        band rather than one number. Index futures trade close to their cost of carry, but not exactly on it.
      </p>
      <p>
        Third, daily settlement brings a risk of its own. A hedge that's right on paper can need a lot of cash long before it pays off. A
        firm that promises to deliver oil for years and hedges with short-term futures can face margin calls every day the price rises, which
        is roughly what happened to Metallgesellschaft in 1993.
      </p>
      <p>
        And finally, real futures come with delivery rules: where the oil has to go and when trading stops. On 20 April 2020, with the May
        contract about to stop trading, those rules mattered as much as the price of oil.
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
