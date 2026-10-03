<script>
  /* App.svelte for equity-premium */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import BandLab from "./Components/BandLab.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import FreqBands from "./Components/FreqBands.svelte";
  import RollingChart from "./Components/RollingChart.svelte";
  import SplitLab from "./Components/SplitLab.svelte";
  import katexify from "./katexify.js";

  const seEq = katexify("\\text{standard error} = \\frac{\\sigma}{\\sqrt{T}}", true);
  const monthEq = katexify("12 \\times \\frac{1}{12T} \\sum_{\\text{months}} r_m \\;=\\; \\frac{1}{T} \\sum_{\\text{months}} r_m", true);
  const splitEq = katexify(
    "R_t = \\frac{D_t}{P_{t-1}} + \\frac{P_t - P_{t-1}}{P_{t-1}}, \\qquad R^{D}_t = \\frac{D_t}{P_{t-1}} + \\frac{D_t - D_{t-1}}{D_{t-1}}",
    true
  );
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're deciding how much of our savings to keep in shares for the next thirty years. The number that matters most is the
        <span class="bold">equity premium</span>, the extra return shares earn on average over safe short-term bills. A premium of 5% a year
        and one of 10% lead to very different plans, so it's worth asking how well we actually know it.
      </p>
      <p>
        The usual answer is to look at history. US shares have the longest clean record, and over the last century they beat bills by a wide
        margin. It's wide enough that Rajnish Mehra and Edward Prescott argued in 1985 that standard economic models can't explain it. In this
        article we'll measure that margin, put a band of uncertainty around it, and then estimate it a second way, from the dividends companies paid.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A century of premiums</h3>
      <p>
        Kenneth French publishes the return of the whole US stock market and of one-month Treasury bills for every year since 1927. The chart
        below shows the gap between them, year by year, up to 2025.
      </p>
    </section>

    <Figure id="fig-band" title="A century of yearly premiums" sub="Drag the sliders, or pick a preset, to choose which years we average.">
      {#snippet children(w)}
        <BandLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar is one year's market return above bills. The blue line is the average over the chosen years and the shaded strip is its 95%
          band, which the ruler underneath shows at a larger scale, beside a dashed outline of the band for all 99 years.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Over all 99 years the average premium is 8.9% a year, and that's the number most of us carry around. But look at the bars. In a typical
        year the premium lands a long way from its average, and the standard deviation of the yearly premiums is 20.1 points.
      </p>
      <p>
        An average of noisy numbers is noisy too. Its <span class="bold">standard error</span> is the typical size of its own error, and for an
        average over {@html katexify("T")} years it's the yearly standard deviation divided by the square root of {@html katexify("T")}:
      </p>
      <div class="math-display">{@html seEq}</div>
      <p>
        With 99 years that comes to 2.0 points, so the 95% band runs from 4.9% to 12.8%. A century of data puts the premium somewhere in a range
        about 8 points wide, and both of the premiums we started with sit inside it.
      </p>
      <p>
        If you try the two presets, you'll see that the halves of the century agree on the average but are each less sure of it. From 1927 to
        1975 the premium averaged 8.5%, with a band from 1.9% to 15.0%. From 1976 to 2025 it averaged 9.3%, with a band from 4.7% to 13.8%.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">More often isn't more precise</h3>
      <p>
        One obvious fix is to use more observations. French also publishes monthly returns, which turn our 99 years into 1,188 months. Before
        we look, let's make a guess.
      </p>
    </section>

    <GuessCard />

    <Figure id="fig-freq" title="Yearly and monthly returns give the same band" sub="Drag the slider to change how many years of data we have.">
      {#snippet children(w)}
        <FreqBands width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each dot is an average premium and each strip its 95% band, from the same years of yearly or monthly returns. The dashed strip is what
          we'd get if every month were as informative as a whole extra year.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        From monthly returns the average comes out at 8.3% with a standard error of 1.9 points, almost the same as the 2.0 from yearly ones. As
        you drag the slider, the two bands widen and narrow together, and both stay far wider than the imagined one. The number of years matters, and
        how finely we slice them hardly matters at all.
      </p>
      <p>
        The reason is simple once we write the average down. Twelve times the average monthly return over {@html katexify("T")} years is just
        the sum of all the monthly returns divided by {@html katexify("T")}:
      </p>
      <div class="math-display">{@html monthEq}</div>
      <p>
        That sum is roughly the market's total growth above bills from the first month to the last, and slicing the years more finely doesn't
        change where the market started or where it ended. Robert Merton made this point in 1980. Frequent data pins down volatility very well,
        but the mean only gets sharper as the calendar runs.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Thirty years at a time</h3>
      <p>
        A band from 4.9% to 12.8% is a statement about the whole century. Most of us, though, meet the premium as a shorter record, such as
        the history of a fund or the last few decades of an index. The chart below slides a window of years through the century and plots its
        average at the window's last year.
      </p>
    </section>

    <Figure id="fig-rolling" title="The average premium, one window at a time" sub="Switch the window length, and drag the slider to pick out one window.">
      {#snippet children(w)}
        <RollingChart width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue line is each window's average and the shaded area its 95% band. The dashed line is the average over every year, and the pink
          and green dots mark the lowest and highest windows.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The lowest thirty-year average, from 1965 to 1994, is 4.7%, and the highest, from 1932 to 1961, is 14.2%. Both are honest measurements
        of the same market. Someone who learned finance in 1962 and someone who learned it in 1995 would have carried very different numbers,
        and each would have had the data to back it up.
      </p>
      <p>
        Longer windows narrow the range but don't close it. With twenty-year windows it runs from 2.5% to 16.1%, and even fifty-year windows
        run from 5.4% to 10.0%. Neighbouring windows share most of their years, so the line moves slowly and its swings look more deliberate
        than they are.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What dividends say</h3>
      <p>
        There's a second way to estimate the premium, and it starts from what owning shares pays. In any year, a share's return is its
        dividend yield plus the growth in its price. Over long periods prices can only grow faster than dividends if investors keep paying more
        for each dollar of dividends, and that can't go on for ever.
      </p>
      <p>
        Eugene Fama and Kenneth French used that idea in 2002. They kept the dividend yield and swapped the growth in prices for the growth in
        dividends:
      </p>
      <div class="math-display">{@html splitEq}</div>
      <p>
        The two averages differ only by how much faster prices grew than dividends, which is the rise in the
        <span class="bold">price-to-dividend ratio</span>, the price we pay for a dollar of yearly dividends. For this we need a longer record
        that includes dividends, so we'll use Robert Shiller's S&amp;P composite data from 1871, after inflation. These are real returns rather
        than premiums over bills, but subtracting the bill rate would lower both estimates alike, so the gap between them is the same.
      </p>
    </section>

    <Figure id="fig-split" title="Realised returns against the dividend estimate" sub="Choose a period.">
      {#snippet children(w)}
        <SplitLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The grey part of each bar is the average dividend yield, which both estimates share. Above it sits price growth in the realised bar and
          dividend growth in the other, and the whiskers are 95% bands.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        From 1871 to 1950 the two estimates nearly agree, 8.1% realised against 7.6% from dividends. Switch to 1951 to 2000, though, and they
        come apart. Shares returned 9.3% a year after inflation, but dividends support only 4.6%. Over those fifty years the price of a dollar
        of dividends rose from 14 to 83, and that rise is the whole gap.
      </p>
      <p>
        The dividend estimate is also much tighter. Over 1951 to 2000 its standard error is 0.6 points against 2.2 for realised returns,
        because dividends grow far more smoothly than prices move. If you extend the period to 2022, the gap narrows a little, to 8.3% against
        5.1%, as the ratio falls back to 59.
      </p>
      <p>
        Fama and French's reading is that the realised average after 1950 includes a large gain investors didn't expect, as the price of
        dividends climbed. The realised average is still a fair record of what happened. It's just a less reliable guide to what shares were
        expected to earn.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Both estimates rest on choices, and four of them are worth knowing.</p>
      <p>
        First, these are US numbers, and we look at the US record partly because it turned out well. Philippe Jorion and William Goetzmann
        showed in 1999 that the US had one of the best records of the century's markets, and that markets interrupted by war or revolution
        tend to be left out of long samples. Global data from Elroy Dimson, Paul Marsh
        and Mike Staunton give the world as a whole a lower premium than the US.
      </p>
      <p>
        Second, which average we mean. Our 8.9% is an average of yearly premiums. The average of log premiums, which is what compounds over a
        long holding, is 6.5%, and the gap grows with volatility.
      </p>
      <p>
        Third, dividends aren't the only way companies pay out any more. Since the 1980s US firms have bought back more and more of their own
        shares, so dividend growth may understate how fast payouts grew, and the dividend estimate may lean low in recent decades.
      </p>
      <p>
        And finally, a band around a past average assumes the premium stayed the same the whole time. If it moved, as the windows suggest it
        might have, then a century of data describes a century of different premiums rather than one.
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
