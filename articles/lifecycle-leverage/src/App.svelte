<script>
  /* App.svelte for lifecycle-leverage */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import ExposureLab from "./Components/ExposureLab.svelte";
  import CapLab from "./Components/CapLab.svelte";
  import katexify from "./katexify.js";

  let rule = $state("all");
  let k = $state(10);
  let cap = $state(2);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're starting work, and we put one unit a year into stocks for forty years. We count in units, so a saver who deposits 1 each
        year finishes with some number of units, which we'll call years of deposits. Nobody touches the account until the end. The market's
        returns in those forty years decide how much we finish with, but they don't all decide it equally. Before we look at how unequally, have
        a guess.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">The market doesn't count years</h3>
      <p>
        A return of 10% in the first year and a return of 10% in the last are the same size, but they hit very different piles. In the first year
        the account holds one unit. In the last it holds nearly everything we'll ever have. What matters for the final answer is how much money
        is riding on the market in each year, as a share of what we finish with. We'll call that a year's <span class="bold">exposure</span>.
      </p>
      <p>
        Let's set it up. Stocks earn 7% a year on average against 2% for a safe rate, with a volatility of 18%, and each year's return is
        independent of the others. In year {@html katexify("s")} we hold a multiple {@html katexify("e_s")} of our wealth in stocks, so
        {@html katexify("e_s = 1")} means all of it, and {@html katexify("e_s = 2")} means we've borrowed as much as we own and put both in
        stocks. For now we borrow at the safe rate, which is generous, and we'll come back to that under the costs.
      </p>
      <p>
        A unit deposited at the start of year {@html katexify("j")} grows, in expectation, by
      </p>
      <div class="math-display">{@html katexify("G_j = \\prod_{s \\ge j}\\bigl(1 + r + e_s(\\mu - r)\\bigr)", true)}</div>
      <p>
        where {@html katexify("r")} is the safe rate and {@html katexify("\\mu")} the stock return. The share of our final wealth that is in the
        account during year {@html katexify("s")} is then the deposits made so far, grown to the end, over all of them. The money riding on the
        market in that year is that share times our multiple:
      </p>
      <div class="math-display">{@html katexify("\\omega_s = \\frac{\\sum_{j \\le s} G_j}{\\sum_j G_j}, \\qquad E_s = e_s\\,\\omega_s", true)}</div>
      <p>
        To a first approximation, each year's return moves the log of our final wealth by {@html katexify("E_s")} times the surprise, and the
        years are independent, so their contributions to the variance add up:
      </p>
      <div class="math-display">{@html katexify("\\mathrm{Var}\\,[\\ln W_T] \\approx \\sigma^2 \\sum_s E_s^{\\,2}", true)}</div>
      <p>
        The squares are what matter. One big year adds more to the variance than two years half its size. So for a given total exposure
        {@html katexify("\\sum_s E_s")}, the spread is smallest when every year carries the same. We'll measure how close we are to that with
        <span class="bold">effective years</span>,
      </p>
      <div class="math-display">{@html katexify("N_{\\mathrm{eff}} = \\frac{\\bigl(\\sum_s E_s\\bigr)^2}{\\sum_s E_s^{\\,2}}", true)}</div>
      <p>
        which is the number of equal-sized bets that would give the same variance for the same total. It's 40 when every year carries the same
        exposure, and it falls as the exposure bunches into a few years.
      </p>
    </section>

    <Figure id="fig-exposure" title="Money riding on the market, year by year" sub="Start with all stocks, then drag the number of last years and try the other rules.">
      {#snippet children(w)}
        <ExposureLab width={w} bind:rule bind:k />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The upper chart is the share of her wealth in stocks in each year. The lower chart is the exposure of each year. The red bars are the
          last years you've chosen, and the dashed line is the height every bar would have if the exposure were spread evenly.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's start with all stocks, which is where the lab begins. In the first year the account holds one unit, and that's 7% of what we'll
        finish with, so the market's first return is a 7% bet. By year 10 the bet is 53%, by year 20 it's about 80%, by year 30 it's 93%, and
        in year 40 it's all of it. The last ten years carry 34% of the exposure and 41% of the variance, and the first ten carry 11% of the
        exposure. Effective years come to 35.2, so forty years of saving have the spread of about 35 equal ones.
      </p>
      <p>
        So the answer to the question above is the last decade, but its lead is smaller than it looks. A third of the exposure in a quarter of
        the years is lumpy, not lopsided. If you drag the slider up to 20 years, you'll see that the last twenty carry 74% of the variance. What is lopsided is the start. The first ten years carry only 11% of the exposure, since we have almost
        nothing in the market to lose or gain, and that's where lifecycle leverage comes in.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Borrowing to fill the early years</h3>
      <p>
        Suppose the young saver borrows so that her small pile behaves like a bigger one, and holds less stock late, when the pile is large. The
        rule in the lab does that. It borrows up to a cap while she's young, and once the cap stops binding it keeps the money riding on the
        market at a constant level. Each capped rule is set so that its total exposure equals that of the all-stocks saver, which keeps the expected premium
        the same to a first approximation. It's the same total bet, just spread differently in time, and that's what makes the comparison fair.
      </p>
      <p>
        Pick "Cap 2" in the lab and you'll see the bars level off. She borrows as much as she owns in the first year, holds 2 to 1 for five years, and is back to lending by year
        17. She finishes at 75% in stocks. Her exposure climbs to 75% by year 6 and stays there, and effective years rise to 39.0. The last ten
        years now carry 26% of the exposure, against 25% if it were spread perfectly evenly.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What it buys</h3>
      <p>
        Effective years are a first-order measure, so let's see what a simulation of 100,000 savers says. The chart below draws, for each cap,
        the change from a saver at 100% stocks in the spread of the log of final wealth, the 5th percentile and the median. If you drag the cap
        from none up to 4 to 1, you'll see the spread and the median fall and the 5th percentile rise.
      </p>
    </section>

    <Figure id="fig-cap" title="What a cap on leverage changes" sub="Drag the cap and read the three lines.">
      {#snippet children(w)}
        <CapLab width={w} bind:cap />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each line is the change against a saver at 100% stocks, so below the zero line is lower. Every rule has the same total exposure.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At a cap of 2 to 1, the spread falls by 8% and the 5th percentile rises by 14%, from 41 years of deposits to 47. The median falls by 2%,
        from 145 to 142. That's a real change, and it isn't a large one. Each further step buys less. Effective years are 38.2, 39.0, 39.6 and
        39.8 at caps of 1.5, 2, 3 and 4 to 1, and a saver with no cap would have to borrow 6.4 to 1 in her first year to reach 40. Going from 2
        to 4 to 1 takes the fall in the spread from 8% to 9%.
      </p>
      <p>
        The glide path in the lab does the opposite of borrowing. It starts at 90% in stocks and slides to 40%, as many target-date funds do.
        Its spread is 43% lower than all stocks, which sounds better than any cap. But it's a smaller bet: its total exposure is 16.1, against
        28.6, and its median final wealth is 24% lower, at 110 years of deposits against 145. A lower spread from a smaller bet isn't the same
        as a better spread from the same bet, which is why only the capped rules were set to equal exposure.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our rebuild leaves out a great deal, in four ways.</p>
      <p>
        First, we borrowed at the safe rate. Nobody can, and the gap between what we pay and what we earn on the loan works against this idea
        from the first year. The <a href="../cost-of-leverage/">next article</a> puts a spread on the loan and shows how quickly it shrinks the
        benefit.
      </p>
      <p>
        Second, the comparison is only approximate. The identity is first order, and against the simulation it overstates the spread by 6% for
        all stocks and 9% for a cap of 2, though it ranks the rules in the same order. Equal exposure also matches the premium only to first
        order: the average final wealth is about 5% lower at a cap of 2, and the median 2% lower, and that's what the smaller spread costs us.
        We measured the spread of the log of wealth for a reason. The spread of wealth itself is driven by a few extremely lucky savers, and it
        barely moves: its coefficient of variation is 1.11 at 100% stocks and about 1.07 for every cap from 2 to 1 up. A simulation can't
        pin that number down, since the lucky few are rare, but the log of wealth it measures well.
      </p>
      <p>
        Third, the market is kind to a borrower here. Returns are independent from year to year, with the same 7% and 18% every year, and the
        loan can't be recalled. A broker can sell an account out well before it's wiped out. At 4 to 1 a fall of a little over 23% wipes out the
        pile. For these stocks that happens about one year in 26, and we let the saver carry on with her next deposit, which a real one might
        not be able to do.
      </p>
      <p>
        And finally, the plan is ours. It's one unit a year, flat, with no link between pay and stocks and nothing else we own. The
        <a href="../human-capital/">human capital</a> article reaches borrowing from the other side, by counting future pay as part of our
        wealth. Here we counted only savings and asked how the market's risk is spread across the years. Whether the old claim that stocks get
        safer with time holds is a separate question, taken up in the <a href="../time-diversification/">time diversification</a> article.
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
