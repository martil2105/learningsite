<script>
  /* App.svelte for kelly-criterion */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import CoinLab from "./Components/CoinLab.svelte";
  import GrowthFigure from "./Components/GrowthFigure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import RaceLab from "./Components/RaceLab.svelte";
  import DrawdownLab from "./Components/DrawdownLab.svelte";
  import katexify from "./katexify.js";

  let share = $state(50);
  const growthEq = katexify("g(f) = 0.6\\,\\ln(1 + f) + 0.4\\,\\ln(1 - f)", true);
  const kellyEq = katexify("f^* = p - q = 0.6 - 0.4 = 20\\%", true);
  const stockEq = katexify("f^* = \\frac{m}{\\sigma^2} = \\frac{0.05}{0.18^2} \\approx 154\\%", true);
  const raceEq = katexify("P(\\text{Kelly ahead after } T \\text{ years}) = \\Phi\\!\\left(\\frac{|1 - c|\\,\\text{SR}\\,\\sqrt{T}}{2}\\right)", true);
  const fallEq = katexify("P(\\text{ever falling to } x) = x^{\\,2/c \\,-\\, 1}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say someone hands us $25 and a coin that lands heads 60% of the time. We can bet as much as we like on each flip, at even money,
        for half an hour. How much should we bet?
      </p>
      <p>
        In 2016 Victor Haghani and Richard Dewey ran this game for real. Most of their 61 players were students of finance or economics, or young professionals at finance firms. They had 30 minutes, which is time for about 300 flips, and winnings were capped at $250. With a coin
        this good it should have been easy money. Instead, 28% of the players went bust, and only 21% reached the cap.
      </p>
      <p>
        Let's run the game ourselves with 61 players of our own. Each one gets their own run of 300 flips, and every one of them bets the same
        share of their money on heads, every time.
      </p>
    </section>

    <Figure id="fig-coin" title="Sixty-one players, 300 flips" sub="Drag the slider to change the share of their money that every player bets on each flip.">
      {#snippet children(w)}
        <CoinLab width={w} bind:share />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each grey line is one player's money, on a log scale, and the blue line is the path of a typical player. Changing the share keeps
          every player's flips, so you're seeing the same luck bet in a different way. Lines that drop below 1¢ leave the chart.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At 50% the coin's edge doesn't seem to help at all. Most of our players end behind where they started, and plenty are left with
        pennies, even though every single flip was in their favour.
      </p>
      <p>
        If you drag the slider down to 20%, the picture turns around. Our middle player ends with $10,504, only 3 of the 61 finish behind,
        and 57 of them pass $250 along the way. So betting too much is far worse than betting too little, and somewhere in between there's a
        best share. Finding it is what the Kelly criterion does.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Kelly's rule</h3>
      <p>
        In 1956 John Kelly, a researcher at Bell Labs, asked which fixed share makes our money grow fastest. If we bet a share
        {@html katexify("f")}, each head multiplies our money by {@html katexify("1 + f")} and each tail by {@html katexify("1 - f")}. Over many
        flips about 60% of them are heads, so the average log return per flip is
      </p>
      <div class="math-display">{@html growthEq}</div>
      <p>
        We'll call this the <span class="bold">growth rate</span>, and Kelly's answer is the share that makes it as large as it can be. For an
        even-money bet that share is the chance of winning minus the chance of losing:
      </p>
      <div class="math-display">{@html kellyEq}</div>
    </section>

    <Figure id="fig-growth" title="Growth per flip, for every share" sub="Drag the slider to move along the curves.">
      {#snippet children(w)}
        <GrowthFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue curve is how fast a typical player's money grows, and the pink one is how fast the average over all players grows. The ring marks Kelly's share, and the small tick is where the blue curve comes back to zero.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The blue curve peaks at 20%, where a typical player's money grows by about 2% a flip. Past the peak it falls quickly, and at 38.9% it's
        back at zero, so a player betting that much makes no progress at all. Bet more than that and our money shrinks, even though the coin
        is on our side.
      </p>
      <p>
        The pink curve tells a different story, because the average keeps rising the more we bet. A player who bets everything on every flip
        has the highest average of all, about $1.4 × 10²⁵ after 300 flips. But that average comes from the one game in about 3.6 × 10⁶⁶ in
        which every flip lands heads, and in all the others she's broke. The average is carried by a player we'll never meet. That's why Kelly aims at the growth rate instead, because it sets what happens to the typical player. After 300 flips our middle player has
        {@html katexify("25\\,e^{300\\,g(f)}")} dollars, and that's largest at 20%.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">From coins to stocks</h3>
      <p>
        The same idea works in the stock market. Let's say stocks pay a premium of {@html katexify("m = 5\\%")} a year over cash, with a
        volatility of {@html katexify("\\sigma = 18\\%")}, as in the article on Merton's share. If we rebalance continuously, the share of our
        money in stocks that makes it grow fastest is
      </p>
      <div class="math-display">{@html stockEq}</div>
      <p>
        So the Kelly investor borrows a little to hold more than all her money in stocks. This is Merton's share for an investor with a risk
        aversion of 1, and that article shows that twice the Kelly share grows no faster than cash. Here we're after two other questions. How
        long does Kelly's bet take to pay off, and what does it put us through on the way?
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How long is the long run?</h3>
      <p>
        Kelly's bet comes with a famous promise. In 1961 Leo Breiman proved that a Kelly bettor's money eventually pulls ahead of anyone's
        who bets a different fixed share, and stays ahead, with probability one. The word "eventually" is doing a lot of work there, so let's
        put a number on it.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <p>Here are 40 pairs of investors. In each pair, both face the same market, and only the size of their bet differs.</p>
    </section>

    <Figure id="fig-race" title="Kelly against a rival" sub="Choose the rival's bet, and drag the slider to move through the years.">
      {#snippet children(w)}
        <RaceLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each grey line is one pair, drawn as Kelly's money divided by the rival's, so a line above 1 means Kelly is ahead. The blue curve
          below is the chance that Kelly is ahead after each number of years.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        For decades the lines wander on either side of 1, and as you drag the years along, only slowly do more of them settle above it. Against half Kelly, the chance
        that Kelly is ahead is 65% after 30 years. It takes 94 years to reach 75% and 341 years to reach 90%.
      </p>
      <p>
        Why so slow? Let's write {@html katexify("c")} for the rival's bet as a multiple of Kelly's, and SR for the Sharpe ratio
        {@html katexify("m/\\sigma")}. The gap between the two investors' log wealth drifts upwards by
        {@html katexify("(1 - c)^2\\,\\text{SR}^2/2")} a year, while it wobbles with a volatility of
        {@html katexify("|1 - c|\\,\\text{SR}")}. The drift is tiny next to the wobble, and after {@html katexify("T")} years
      </p>
      <div class="math-display">{@html raceEq}</div>
      <p>
        where {@html katexify("\\Phi")} is the normal distribution. You'll notice that the Sharpe ratio and the years only ever appear together, as
        {@html katexify("\\text{SR}\\sqrt{T}")}. That means the long run is measured in units of {@html katexify("1/\\text{SR}^2")}, which is
        13 years for our stocks.
      </p>
      <p>
        Our coin packs its edge into far less time. One flip has a Sharpe ratio of 0.204, not far below a whole year of stocks at 0.28, so 300 flips hold as much evidence as 162 years of the stock market. After 300 flips, a Kelly player is ahead of a half-Kelly player 81% of the time. Our investors reach the same 81% only
        after 162 years.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How far down</h3>
      <p>
        Kelly's bet doesn't only take a long time to prove itself. It can also take us a long way down first. Back in the coin game, a
        player betting exactly 20% sees her $25 cut to $12.50 at some point in 45% of games, even though the typical game ends with $10,504.
      </p>
      <p>
        In the stock market there's a neat formula for this. Measured against cash, the chance that an investor holding {@html katexify("c")}
        times the Kelly share ever falls to a fraction {@html katexify("x")} of today's money is
      </p>
      <div class="math-display">{@html fallEq}</div>
      <p>
        At full Kelly the exponent is 1, so the chance of ever falling to any fraction of today's money is that fraction itself. We halve our
        money at some point with probability one half, and lose 90% of it with probability 10%.
      </p>
    </section>

    <Figure id="fig-drawdown" title="Falling to a share of our money" sub="Drag the slider to change the bet, and choose how far ahead to look.">
      {#snippet children(w)}
        <DrawdownLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue curve is the chance of ever falling to each share of today's money. The dashed diagonal is full Kelly over an endless future,
          where the chance and the share are the same number.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you drag the bet down to half Kelly, the exponent becomes 3. The chance of ever halving falls from 50% to 12.5%, and the chance of
        losing 90% falls from 10% to 0.1%. Half the bet keeps three quarters of the growth, with half the volatility. That's a lot less pain for a small loss of growth, and it's one reason why many people who use Kelly's rule, Edward Thorp among them, bet only a fraction of it. If we hold 100% stocks with no borrowing, which is 0.65 of Kelly here, the chance of ever halving is 24%.
      </p>
      <p>
        These are chances over an endless future. If you switch to the next 30 years, they shrink, though at full Kelly not by much: the
        chance of halving within 30 years is still 42%.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Kelly's rule is clean because our model is clean, and four things in real markets push the other way.</p>
      <p>
        First, we never know the edge. Kelly's share is the premium divided by the variance, and the premium is an estimate. The article on
        Merton's share shows that a premium estimated from {@html katexify("N")} years keeps only
        {@html katexify("1 - 1/(N\\,\\text{SR}^2)")} of the gain, and an edge that turns out smaller than we thought pushes our bet over the peak.
        Betting a fraction of Kelly leaves room for that mistake.
      </p>
      <p>
        Second, prices jump. Our formulas assume we can rebalance continuously. If the market falls 20% in a day, as the S&amp;P 500 did in
        October 1987, a Kelly investor holding 154% loses 31% of her money before she can do anything about it. The article on fat tails looks
        at how often days like that come.
      </p>
      <p>
        Third, borrowing isn't free. Kelly's share of our stocks is more than all our money, and a loan at more than the safe rate lowers the
        best share, as the article on the cost of leverage shows.
      </p>
      <p>
        And finally, the fastest growth isn't the same as the most happiness. Kelly's rule is the right goal for an investor whose utility is
        the log of her wealth, and for nobody else. Paul Samuelson argued for decades that a long horizon doesn't change that, and in 1979 he
        wrote a whole article making the case in words of one syllable.
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
