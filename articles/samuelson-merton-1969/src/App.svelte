<script>
  /* App.svelte for samuelson-merton-1969 */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import PaperCard from "./Components/PaperCard.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import LifetimeLab from "./Components/LifetimeLab.svelte";
  import katexify from "./katexify.js";

  let kase = $state("samuelson");
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <PaperCard>
    {#snippet cite()}
      Samuelson, P. A. (1969), "Lifetime portfolio selection by dynamic stochastic programming", <em>Review of Economics and Statistics</em>,
      51(3), 239–246; and Merton, R. C. (1969), "Lifetime portfolio selection under uncertainty: the continuous-time case", in the same issue,
      247–257.
    {/snippet}
    {#snippet claims()}
      If we solve a lifetime of portfolio choices backwards from the last year, an investor whose dislike of risk is in proportion to their
      wealth holds the same share in stocks every year, whatever their age and however rich they are. Holding more because we're young
      doesn't follow.
    {/snippet}
    {#snippet rebuild()}
      The backward solution itself, run in the browser on a coin-flip market, and two changes to the setup that bring the horizon back: a
      floor we must stay above, and returns that revert.
    {/snippet}
    {#snippet later()}
      Much of lifecycle finance since then has been about the ways out of the result, and about which of them real savers face. The biggest
      is the wage we haven't earned yet.
    {/snippet}
  </PaperCard>

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say two people are saving for the same kind of goal. One of them has thirty years to go and the other has one. For as long as
        there's been investment advice, it has said that the first should hold more in stocks, because she has time to recover from a bad year.
        In 1969 Paul Samuelson and Robert Merton published two papers, side by side in the same issue of the same journal, that tested that
        advice by solving the whole lifetime of choices at once. Before we look at their answer, have a guess.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Solving it backwards</h3>
      <p>
        A lifetime of choices looks hard, because what we should do this year depends on what we'll do in every year after it. Samuelson's
        trick, called <span class="bold">dynamic programming</span>, is to start at the end. With one year to go, there's nothing after it, so
        we just pick the share that makes our final wealth most valuable to us. With two years to go, we pick this year's share knowing that
        next year we'll make that one-year choice well, whatever happens. With three, we lean on the answer for two, and so on back to today.
      </p>
      <p>
        Let's run that on a small market of our own. Each year the stock goes up 25% or down 11%, with equal chances, and a safe bond pays 2%.
        That's a premium of 5 points a year and a volatility of 18%, the same stocks as in the <a href="../merton-share/">Merton share</a>
        article. We'll value final wealth the way Samuelson did, with an <span class="bold">isoelastic</span> utility,
        {@html katexify("u(W) = W^{1-\\gamma}/(1-\\gamma)")}, where {@html katexify("\\gamma")} is our risk aversion. We'll set it to 2. The lab
        below solves the problem backwards from the last year, for every number of years to go up to thirty, and draws the best share in stocks
        at three different levels of wealth.
      </p>
    </section>

    <Figure id="fig-lifetime" title="The best share in stocks, year by year" sub="Start with Samuelson's setup, then change it.">
      {#snippet children(w)}
        <LifetimeLab width={w} bind:kase />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Time runs left to right, from thirty years to go down to one. The lines are levels of wealth, or last year's move when returns
          revert, and the dashed line is Samuelson's share.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        In Samuelson's setup you'll see the three lines lie on top of each other, flat along the dashed line at about 84%. The share with thirty years to
        go is the share with one year to go, and it doesn't matter whether we're rich or poor. It's close to the 77% of the Merton share
        article, which assumed continuous trading, and the small gap comes from our market moving only once a year, in two steps.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Why the horizon drops out</h3>
      <p>
        The reason is a property of the isoelastic utility. Scaling our wealth up or down scales every outcome by the same factor, so the best
        share can't depend on how rich we are. The backward step then does something neat. With one year to go, the value of arriving at
        wealth {@html katexify("W")} after choosing well is just a constant times the utility we started from:
      </p>
      <div class="math-display">{@html katexify("V_1(W) = K_1\\,\\frac{W^{1-\\gamma}}{1-\\gamma}, \\qquad V_k(W) = K_k\\,\\frac{W^{1-\\gamma}}{1-\\gamma}", true)}</div>
      <p>
        So with two years to go we face the same problem as with one, only multiplied by a constant that no choice of ours can change. The same
        is true with three years to go, and with thirty. Every year's problem is the last year's problem, so every year's answer is the same
        share. Merton solved the continuous-time version, with consumption along the way, and got the share in closed form,
        {@html katexify("(\\mu - r)/(\\gamma\\sigma^2)")}. Both papers let the investor spend as they go, and the share still doesn't move.
      </p>
      <p>
        That's why the old advice doesn't follow on its own. A young investor does have time to recover from a bad year, but she also has time
        for more bad years, and for this kind of investor the two cancel. It's the same point Samuelson made about repeated bets in 1963, made
        this time with the whole machinery of a lifetime.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Ways out</h3>
      <p>
        The result is sharp because its assumptions are sharp, and loosening any of them lets the horizon back in. The lab can show two of the ways out.
      </p>
      <p>
        First, let's give our investor a <span class="bold">floor</span>. Suppose she must end with at least one unit of wealth, and values
        only what's above it: {@html katexify("u(W) = (W - F)^{1-\\gamma}/(1-\\gamma)")}. If you switch the lab to the floor, you'll see the
        lines spread apart and slope down as time passes. With twice the floor, the best share is about 61% with thirty years to go and about
        43% with one. The solution turns out to be simple. She keeps enough in bonds to guarantee the floor, which costs less the further away
        it is, and invests the rest at Samuelson's share. So the young hold more stock here, but only because their floor is cheaper to
        guarantee.
      </p>
      <p>
        Second, let's make returns <span class="bold">revert</span>. After an up year, the next year is up with a chance of 0.4, and after a
        down year with a chance of 0.6, which keeps the long-run average the same. If you switch the lab to returns that revert, you'll see the best share depend on last year, and on the horizon
        too. After a down year, a one-year investor holds about 145%, while anyone with three or more years to go holds about 153%.
        After an up year the two are about 24% and 31%. The long-horizon investor holds about 8 points more stock in both states, because a
        bad year now comes with better odds later, which cushions the long run. That extra is called a <span class="bold">hedging
        demand</span>. In our market it stops growing after a couple of years, because its memory lasts a single year, and with expected
        returns that stay high or low for longer it would stretch further.
      </p>
      <p>
        And finally, the biggest way out is one the lab doesn't show: a <span class="bold">wage</span>. Samuelson and Merton's investor has
        only her savings. A young worker also has decades of pay to come, which behaves much like a bond. If we count its present value
        {@html katexify("H")} as part of wealth, the share of savings in stocks becomes the old share times {@html katexify("1 + H/W")}, which
        starts large and falls as the pay is earned. That's the subject of the next article.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What came later</h3>
      <p>
        Merton widened the result in 1971 to a whole family of utilities, including our floor. In 1973 he showed that when investment
        opportunities change over time, investors add hedging demands like the one in our reverting market. Campbell and Viceira worked out how
        big those demands are for realistic mean reversion in 1999, and found that they can be large, above all for cautious investors. In 1992 Bodie, Merton and
        Samuelson put the wage into the problem, and showed that being able to work more after a bad year makes the young willing to hold even
        more stock.
      </p>
      <p>
        Samuelson also spent years arguing against a tempting shortcut. Over a long horizon, the share that maximises the growth rate of wealth
        almost surely ends up ahead of any other, so why not always hold it? His answer came in a 1979 note written entirely in words of one
        syllable. Ending ahead almost surely isn't the same as being better, because the rare paths where the growth rule ends far behind still
        count for anyone more cautious than it assumes.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our rebuild is smaller than the papers in three ways.</p>
      <p>
        First, our market moves in two steps once a year. That's enough for the backward solution to find a flat line to within its own search
        precision, but real returns have fatter tails, and the exact share depends on them.
      </p>
      <p>
        Second, our investor cares only about her final wealth. The papers also let her consume along the way, which changes how much she
        spends each year but not the share she holds.
      </p>
      <p>
        And finally, we let her borrow freely at the safe rate. In the reverting market after a down year the best share is well over 100%, and
        most of us couldn't borrow that cheaply. A cap on borrowing would flatten both lines at 100% whenever they'd rise above it.
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
