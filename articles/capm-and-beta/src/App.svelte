<script>
  /* App.svelte for capm-and-beta */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import BetaScatter from "./Components/BetaScatter.svelte";
  import SortLab from "./Components/SortLab.svelte";
  import AlphaBars from "./Components/AlphaBars.svelte";
  import katexify from "./katexify.js";

  const betaEq = katexify("\\beta_i = \\frac{\\operatorname{Cov}(r_i, r_m)}{\\operatorname{Var}(r_m)}", true);
  const capmEq = katexify("E[r_i] - r_f = \\beta_i \\big(E[r_m] - r_f\\big)", true);
  const relEq = katexify("\\text{slope through the sorting betas} = \\text{premium} \\times \\frac{s^2}{s^2 + e^2}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we own two shares. When the market rises 1% in a month, the first tends to rise about 0.6% and the second about 1.6%, and they
        fall in the same proportions when it falls. That sensitivity is the share's <span class="bold">beta</span>. The second share swings with
        the market far more than the first, and those swings are the one kind of risk we can't get rid of by holding many shares.
      </p>
      <p>
        The <span class="bold">capital asset pricing model</span>, or CAPM, turns that into a prediction: the second share should earn more on
        average, in proportion to its beta. It's the first model of risk and return most of us learn, and it comes with a very clean test. In
        this article we'll run that test, see how the test itself bends the answer, and then look at what US shares have actually done since
        1963.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A beta is a slope</h3>
      <p>
        If we plot a share's monthly return above the risk-free rate against the market's, its beta is the slope of the best straight line
        through the dots:
      </p>
      <div class="math-display">{@html betaEq}</div>
      <p>
        Single shares are noisy, so we'll use portfolios. Every June, Kenneth French sorts US shares into ten groups by their betas over the
        previous five years, and publishes the monthly returns of each group. The chart below plots one group's months against the market's,
        from July 1963 to August 2026.
      </p>
    </section>

    <Figure id="fig-scatter" title="A beta is a slope" sub="Drag through the ten groups, from the lowest betas to the highest.">
      {#snippet children(w)}
        <BetaScatter width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each dot is a month. The blue line's slope is the beta the group actually had, and the dashed line is what a beta of 1 would look like.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Notice the two readouts. The top group was put together from shares whose past betas averaged 2.66, but once it was formed it moved
        with the market at a beta of only 1.60. If you drag down to the lowest group, you'll see the same thing in reverse: sorted at 0.22, it
        then had a beta of 0.59. We'll come back to that gap, because it turns out to matter a lot.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The CAPM's line</h3>
      <p>
        William Sharpe and John Lintner worked out what happens in the 1960s. If investors all hold the market portfolio, mixed with lending or
        borrowing at the risk-free rate {@html katexify("r_f")}, then every share's expected excess return is its beta times the market's:
      </p>
      <div class="math-display">{@html capmEq}</div>
      <p>
        That's a straight line, the <span class="bold">security market line</span>. It starts at zero excess return for a beta of zero and rises
        by the market premium for every unit of beta. In our sample the market earned 7.2% a year above bills, so a share with a beta of 1.6
        should earn 11.6%, and one with a beta of 0.6 should earn 4.3%. Risk that has nothing to do with the market earns nothing extra,
        because a diversified investor doesn't carry it.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A test that flattens the line on its own</h3>
      <p>
        The obvious test is the one French's groups make possible. We sort shares by their estimated betas, wait, and plot each group's average
        return against its beta. If the dots fall on the CAPM's line, the model passes.
      </p>
      <p>
        The trouble is that an estimated beta is the true beta plus noise. When we sort on it, the top group collects shares whose betas really
        are high and shares that just had a lucky run of moving with the market. The second kind drift back towards 1 afterwards, so the top
        group's beta falls and the bottom group's rises. Let's build a world where the CAPM holds exactly and see what that does to the test.
        Our true betas spread around 1 with a standard deviation of 0.45, and each estimate adds noise with a standard deviation we can set.
      </p>
    </section>

    <Figure id="fig-world" title="Testing the CAPM where it's true" sub="Switch the x axis, then drag the noise in each estimated beta.">
      {#snippet children(w)}
        <SortLab width={w} mode="world" id="wl" />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each dot is a group of shares sorted on its estimated beta. In this world every share earns exactly what the CAPM says, so any gap
          between the blue line and the dashed one comes from how we measured beta.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Against the betas we sorted on, the dots lie on a line that's far too flat: 3.0 points of return per unit of beta instead of the CAPM's
        7.2. If you switch to the betas the groups then had, every dot jumps onto the dashed line. Nothing about the returns changed, only the
        ruler. If you drag the noise to zero, the two rulers agree and the flat line disappears.
      </p>
      <p>
        The size of the flattening has a simple form. With true betas spread by {@html katexify("s")} and noise of {@html katexify("e")},
      </p>
      <div class="math-display">{@html relEq}</div>
      <p>
        and the fraction at the end, called the <span class="bold">reliability</span> of the estimates, is also how far the groups' betas
        shrink towards 1 once they're formed. We set the noise to 0.54 so that our world shrinks by the same amount as French's US groups,
        whose spread fell from 2.44 to 1.01, or to 41%. So a line drawn through sorting betas in US data would come out at about two fifths of
        its true slope even if the CAPM held.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The line in US data</h3>
      <p>
        Now let's run the same test on the real groups. The chart below has the same two rulers, and the CAPM line uses the 7.2% the market
        actually earned.
      </p>
    </section>

    <Figure id="fig-us" title="Testing the CAPM on US shares, 1963 to 2026" sub="Switch between the betas the groups were sorted on and the betas they then had.">
      {#snippet children(w)}
        <SortLab width={w} mode="us" id="us" />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each dot is one of French's ten value-weighted groups, plotted at its average return above bills. The dashed line is what the CAPM
          predicts from the market's own return over the same months.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Against the sorting betas the US line is almost flat, 1.3 points per unit of beta, and we now know most of that is the ruler. If you
        switch to the betas the groups then had, the line steepens to 3.4 points, but it stops well short of the CAPM's 7.2, and it crosses zero
        beta at 4.6% a year instead of at zero. Fixing the measurement accounts for part of the flat line. The rest is in the returns.
      </p>
      <p>
        How sure can we be? If we refit the line every month and average, following Eugene Fama and James MacBeth's method, the slope comes out
        at 3.4 with a standard error of 3.0. That alone can't rule out the CAPM's 7.2, since sixty-three years of monthly returns are still a
        noisy sample. The split into halves points the same way, though: 1.2 against a premium of 4.8 up to 1994, and 5.0 against 9.6 since.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Low beta, high alpha</h3>
      <p>
        A flatter line means the low-beta groups sit above the CAPM's prediction and the high-beta groups below it. The distance from the line
        is a group's <span class="bold">alpha</span>, the average return the CAPM doesn't account for.
      </p>
    </section>

    <Figure id="fig-alpha" title="Each group's alpha against the CAPM" sub="Each bar is a beta group's alpha a year; the whiskers are two standard errors either side.">
      {#snippet children(w)}
        <AlphaBars width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Green bars earned more than their betas called for and pink bars less. A whisker that crosses zero means that group's alpha could be
          noise on its own.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The lowest-beta group earned 2.5% a year more than its beta called for, and the highest earned 2.9% less. A portfolio that buys the
        lowest group and sells the highest has a beta of about −1, so the CAPM says it should lose money, yet its alpha is 5.4% a year, with a
        t-statistic of 2.2. Fischer Black, Michael Jensen and Myron Scholes found the same flat line in 1972, on data that ended before ours
        begins.
      </p>
      <p>
        The most popular explanation is about borrowing. If we'd like more market exposure than our money allows and can't borrow, we buy
        high-beta shares instead. Enough investors doing that pushes those shares' prices up and their returns down, which is what Andrea
        Frazzini and Lasse Pedersen argued in 2014.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our test is a clean version of a messy question, and four things limit it.</p>
      <p>
        First, the market. The CAPM is about the portfolio of every risky asset, and we used US shares. Richard Roll pointed out in 1977 that a
        test with the wrong market can reject a true CAPM or accept a false one.
      </p>
      <p>
        Second, the noise in the returns. Even with the betas fixed, the dots wobble, and the standard error on the slope is about as large as
        the gap we're trying to measure. The alphas carry the evidence more directly than the slope does.
      </p>
      <p>
        Third, betas move. Some of the shrinking we blamed on noise is real change, as firms and their businesses change over five years. Our
        world folds both into one number.
      </p>
      <p>
        And finally, these are value-weighted groups of US shares. Equal-weighted groups give a flatter line still, and other countries and
        periods give their own answers.
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
