<script>
  /* App.svelte for diversification */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import RiskCurve from "./Components/RiskCurve.svelte";
  import CovGrid from "./Components/CovGrid.svelte";
  import UniverseFan from "./Components/UniverseFan.svelte";
  import katexify from "./katexify.js";

  let sigma = $state(0.4);
  let rho = $state(0.2);
  let n = $state(10);

  const varEq = katexify("\\sigma_p^2 = \\sigma^2\\left(\\rho + \\frac{1 - \\rho}{n}\\right)", true);
  const gainEq = katexify("\\text{extra growth} = \\tfrac12\\left(\\sigma^2 - \\sigma_p^2\\right)", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we have some money to put into the stock market, and we're
        deciding between buying one company's shares and spreading the money over
        many. We've all heard that we shouldn't put all our eggs in one basket.
        Let's put numbers on that advice. We'll build portfolios out of stocks that
        are identical on paper, all with the same expected return, the same
        volatility and the same correlation with each other, and see what holding
        more of them buys us.
      </p>
      <p>
        Two answers come out. The first is about risk. Volatility falls fast as we
        add stocks and then levels off at a floor set by how the stocks move
        together, and the distance to that floor shrinks like
        {@html katexify("1/n")} whatever the correlation. The second is about
        growth, and it's the one people tend to miss. Diversifying doesn't change
        our expected return at all, but it raises the rate at which our money
        compounds. Over thirty years that gap is large enough that most single
        stocks finish behind the portfolio they're part of.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Risk falls, then stops</h3>
      <p>
        Let's take stocks that each have a volatility of 40% a year, a fair figure
        for a single listed company, and a correlation of 0.2 between any two of
        them. One stock on its own swings by 40%. If we split our money equally
        across two, the volatility falls to 31%. With ten it's 21%, with thirty it's
        19%, and it never gets below about 18% however many we add. The lab below
        draws the whole curve, and you can change both the volatility and the
        correlation.
      </p>
    </section>

    <Figure id="fig-curve" title="Portfolio risk against the number of stocks" sub="Drag the number of stocks, then try a higher correlation.">
      {#snippet children(w)}
        <RiskCurve width={w} bind:sigma bind:rho bind:n />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue curve is the volatility of an equal-weighted portfolio, and the
          shaded band is the floor, the part of the risk that comes from the stocks
          moving together.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The curve comes from one line of algebra. With {@html katexify("n")}
        stocks at equal weights, each with volatility {@html katexify("\\sigma")}
        and pairwise correlation {@html katexify("\\rho")}, the portfolio's
        variance is
      </p>
      <div class="math-display">{@html varEq}</div>
      <p>
        The first term doesn't depend on {@html katexify("n")} at all. That's the
        floor, {@html katexify("\\rho\\sigma^2")}, and its square root is the 17.9%
        we saw. The second term is the part we can diversify away, and it shrinks
        like {@html katexify("1/n")}. So ten stocks remove 90% of the variance that
        can be removed and twenty remove 95%, for any correlation and any
        volatility. What changes with them is how much risk is left in absolute
        terms. If you move the correlation up, you'll see the floor rise and the
        curve reach it sooner.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Why is the floor where it is?</h3>
      <p>
        A portfolio's variance is a sum over every pair of holdings, including
        each holding paired with itself. With equal weights of
        {@html katexify("1/n")}, every pair gets a weight of
        {@html katexify("1/n^2")}, so the variance is just the average of an
        {@html katexify("n \\times n")} grid of numbers. The diagonal holds the
        {@html katexify("n")} variances, and everything else holds covariances.
      </p>
    </section>

    <Figure id="fig-grid" title="The portfolio's variance is the average of this grid" sub="Drag the number of stocks and watch the diagonal thin out.">
      {#snippet children(w)}
        <CovGrid width={w} {sigma} {rho} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Pink cells on the diagonal are each stock's variance, and blue cells
          are the covariance of each pair, drawn lighter because they're smaller.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With six stocks, a sixth of the cells are variances. With a hundred, it's
        one cell in a hundred, and the average of the grid is almost the average
        covariance. That's what the floor is. The risk of a stock that's all its
        own, a failed product or a fraud, sits on the diagonal and gets averaged
        away. The risk that stocks share, a recession or a jump in interest rates,
        sits everywhere else and doesn't. Holding more stocks can't touch it,
        which is why a later article in this section argues that it's the only
        risk the market pays us for bearing.
      </p>
      <p>
        This is also where the old rule that 30 stocks is enough comes from. Meir
        Statman made that case in 1987, and with our numbers thirty stocks sit
        about a point above the floor. Later work by Campbell, Lettau, Malkiel and
        Xu found that individual stocks had become more volatile on their own,
        which raises the second term and means we need more stocks for the same
        result. The {@html katexify("1/n")} share doesn't change, but the level
        it's a share of does.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The part the risk numbers hide</h3>
      <p>
        So far diversification looks like a trade we'd make for comfort. Every
        stock in our universe has the same expected return, say 8% a year, so the
        portfolio's expected return is 8% too. We've cut the swings without giving
        up any average return, which is already a good deal. It's better than it
        looks, though, because an average return isn't what our money compounds
        at.
      </p>
      <p>
        As the <a href="../volatility-drag/">volatility drag</a> article showed,
        wealth grows at roughly the expected return minus half the variance. A
        single stock at 40% volatility compounds at about
        {@html katexify("8\\% - \\tfrac12 (0.4)^2 = 0\\%")} a year. A large
        portfolio of them compounds at about
        {@html katexify("8\\% - \\tfrac12 (0.179)^2 = 6.4\\%")}. They have the
        same expected return, but one grows and the other goes nowhere. The gap is
        half the variance we removed:
      </p>
      <div class="math-display">{@html gainEq}</div>
      <p>
        That's 6.4 percentage points a year with our numbers, and over thirty
        years it compounds to a factor of about seven. So the typical stock, the
        one in the middle, ends the period worth about a seventh of what the
        portfolio is worth, and only about one stock in six ends ahead of it. The
        chance of a stock finishing ahead after {@html katexify("T")} years is
        {@html katexify("\\Phi\\!\\left(-\\tfrac12\\sqrt{(1-\\rho)\\sigma^2 T}\\right)")},
        which falls the longer we wait.
      </p>
    </section>

    <Figure id="fig-universe" title="Four hundred stocks and their portfolio" sub="Drag the number of years, and draw another universe.">
      {#snippet children(w)}
        <UniverseFan width={w} {sigma} {rho} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Thin lines are eighty of the stocks, green when they're ahead of the
          portfolio. The thick blue line is the equal-weighted portfolio of all of
          them, rebalanced monthly, and the dashed pink line is the middle of the
          pack at each date.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        In the universe drawn here, the portfolio turns each dollar into $7.36 over
        thirty years, while the middle stock ends at $1.03. Of the four hundred
        stocks, 16.5% finish ahead of the portfolio, close to the formula's 16.4%.
        If you draw a few more universes, you'll see the portfolio's own result
        move around a lot, because the market as a whole is still risky. The
        share of stocks beating it barely moves, though, because it comes from the
        stocks' own risk alone, and that's the part we diversified away.
      </p>
      <p>
        The stocks that do beat the portfolio tend to beat it by a lot. The
        average of all four hundred final values stays close to the portfolio's,
        but the typical one is far below it, so a few huge winners make up the
        difference. Real markets look the same. Hendrik Bessembinder found in 2018
        that most US stocks since 1926 returned less over their lifetimes than
        one-month Treasury bills, and that the best-performing 4% of companies
        account for the entire net gain of the stock market. Our model gets that
        shape with nothing but volatility and compounding. An investor holding a
        handful of stocks is mostly betting on catching one of the few.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our stocks are identical on paper, and real ones aren't. Four differences matter.</p>
      <p>
        First, stocks in the same industry move together more than stocks in
        different ones, so ten bank shares diversify far less than ten shares
        from ten industries.
      </p>
      <p>
        Second, correlations aren't fixed. Longin and Solnik found in 2001 that
        correlations between equity markets rise in bear markets, so the floor
        tends to rise just when we'd like it to be low.
      </p>
      <p>
        Third, rebalancing to equal weights costs trading fees, and taxes can make
        it expensive.
      </p>
      <p>
        And finally, the floor itself is the risk of the stock market as a whole.
        Getting below it takes other assets, such as bonds, that move differently
        from stocks.
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
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
