<script>
  /* App.svelte for time-diversification */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import HorizonLab from "./Components/HorizonLab.svelte";
  import OddsDepth from "./Components/OddsDepth.svelte";
  import TailBottom from "./Components/TailBottom.svelte";
  import katexify from "./katexify.js";

  let view = $state("annual");
  let T = $state(30);
  let tail = $state(20);
  let sigma = $state(0.2);
  let premium = $state(0.06);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're 25 and putting money aside that we won't touch for thirty years. We can buy a stock index fund or a safe bond. Most advice
        says that at our age we should lean towards stocks, and one reason we often hear is that we have time on our side. Over one year stocks can
        fall a long way, but over thirty years the good years and the bad years have a chance to cancel out. This idea is called
        <span class="bold">time diversification</span>: spreading our bets across many years, the way diversification spreads them across many stocks.
      </p>
      <p>
        Part of that is true, and we'll see which part. The chance that stocks end up behind bonds really does fall as we hold them for longer. What
        doesn't fall is how far behind they are when it happens. For a long stretch of years, that gets worse, not better.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Our two investments</h3>
      <p>
        Let's keep the model simple. Our bond grows at a safe rate every year. Our stock fund is expected to return 6 percentage points a year more
        than the bond, with a volatility of 20%, and each year's return is independent of the last. We'll measure everything as the value of the
        stocks divided by the value of the bonds, both starting from the same amount. A ratio of 1 means we're level. Below 1, stocks have ended up
        behind.
      </p>
      <p>
        One detail matters for everything that follows. An expected return 6 points higher doesn't mean the typical path grows 6 points a year
        faster. Volatility takes half its square off the growth rate, so the <span class="bold">median growth gap</span>, the gap our middle path
        grows at, is {@html katexify("0.06 - 0.2^2/2")}, or 4% a year. The <a href="../volatility-drag/">volatility drag</a> article has the same
        half-variance working on leveraged funds.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Two rulers for the same years</h3>
      <p>
        The lab below draws 200 possible futures for our ratio, forty years each. It opens with the ruler most people have in mind, the
        <span class="bold">yearly average</span>: the growth gap per year that each path has averaged so far. Drag the horizon and watch the band of
        paths. It's wide at one year and narrows steadily after that, because averaging over more years cancels more of the noise.
      </p>
    </section>

    <Figure id="fig-lab" title="Stocks against bonds, year by year" sub="Drag the horizon, then switch the ruler to the money at the end.">
      {#snippet children(w)}
        <HorizonLab width={w} bind:view bind:T bind:tail />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each grey line is one possible future. The blue line is the median and the pink line is a bad outcome, one that only one path in twenty
          (or in a hundred) does worse than. The pink zone is where stocks are behind bonds.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        On this ruler, time looks like it's on our side. After one year, a 1-in-20 bad outcome has stocks growing about 29 points slower than bonds.
        After thirty years, the same bad outcome has them only about 2 points a year behind. The spread of the yearly average shrinks like one over
        the square root of the horizon, which is the law of large numbers doing its job.
      </p>
      <p>
        Now switch the ruler to <span class="bold">money at the end</span>, the ratio itself, on a logarithmic axis. The funnel turns into a fan.
        The median path pulls ahead, reaching about 3.3 times the bonds after thirty years. The bad outcomes spread out too. After one year, the
        1-in-20 path has 25% less than the bonds. After thirty years it has 45% less. The spread of our money grows like the square root of the
        horizon, because a 2-point shortfall kept up for thirty years compounds into a large one.
      </p>
      <p>
        Here's what doesn't change when we switch. Whichever ruler we use, the same paths end behind bonds: 28 of our 200 at thirty years. A yearly
        average below zero and money below the bonds' are the same event, so the chance is the same on both rulers, and at thirty years it's about
        14%. What the rulers disagree about is how bad being behind is.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Lower odds, deeper shortfalls</h3>
      <p>
        Let's put the two halves of that side by side. The first chart below is the chance that stocks end behind bonds. It falls the whole way:
        42% at one year, 26% at ten and 14% at thirty. That's the part of the advice that holds up.
      </p>
      <p>
        The second chart asks a different question. If our stocks do end behind, how far behind are they on average? At one year it's 13% of the
        bonds' value. At ten years it's 29%, and at thirty it's 37%. So as we hold for longer, we're less likely to be behind, but a bad result is
        a much bigger one.
      </p>
    </section>

    <Figure id="fig-odds" title="How often, and by how much" sub="Try a calmer or a rougher stock market.">
      {#snippet children(w)}
        <OddsDepth width={w} {T} bind:sigma />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The vertical line follows the horizon in the lab above. Notice that the pink line never turns down, while the dashed line rises for a while
          and then falls.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you switch to a calmer market at 15% volatility, both effects are milder, and the chance of being behind after thirty years drops to
        about 4%. In a rougher one at 25%, it's still about 26% after thirty years, and the average shortfall when it happens is nearly half the
        bonds' value.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The worst case keeps getting worse</h3>
      <p>
        There's a tidy formula behind the fan. After {@html katexify("T")} years, the log of our ratio is normally distributed with mean
        {@html katexify("mT")} and standard deviation {@html katexify("\\sigma\\sqrt{T}")}, where {@html katexify("m")} is the 4% median growth gap
        and {@html katexify("\\sigma")} is the 20% volatility. A bad outcome sits {@html katexify("z")} standard deviations below the median, with
        {@html katexify("z")} negative (about −1.64 for one in twenty). So the bad outcome is
      </p>
      <div class="math-display">{@html katexify("\\ln(\\text{ratio}) = mT + z\\sigma\\sqrt{T}", true)}</div>
      <p>
        The first term grows in a straight line and the second, which is negative, grows like a square root. At first the square root wins, so the
        bad outcome sinks. Later the straight line wins and it recovers. If we write the formula in terms of {@html katexify("\\sqrt{T}")}, it's a
        parabola, and its lowest point is at
      </p>
      <div class="math-display">{@html katexify("T^* = \\left(\\frac{z\\sigma}{2m}\\right)^2, \\qquad \\text{ratio at } T^* = \\exp\\!\\left(-\\frac{z^2\\sigma^2}{4m}\\right)", true)}</div>
      <p>
        That's the white circle on the pink line in the lab, when the ruler is set to money. For a 1-in-20 bad outcome, it keeps getting worse for
        17 years and bottoms out 49% behind the bonds. For a 1-in-100 outcome it keeps sinking for 34 years, down to 74% behind. The rarer the
        outcome we worry about, the longer we have to wait before time starts helping with it.
      </p>
    </section>

    <Figure id="fig-bottom" title="How long each bad outcome keeps getting worse" sub="Change the premium that stocks are expected to earn over bonds.">
      {#snippet children(w)}
        <TailBottom width={w} bind:premium />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar ends where that bad outcome is at its worst. Dark bars fall inside forty years of saving, and pale bars fall beyond it.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The premium matters a lot here, because it's squared in the bottom of the formula. If you drop it from 6% to 4%, the median growth gap
        halves from 4% to 2%, and the 1-in-20 outcome keeps getting worse for about 68 years instead of 17. That's longer than anyone saves for. At
        8% it turns around after about 8 years. Since nobody knows the premium for the next thirty years, this is the part of the answer we should
        hold most loosely.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">So is time on our side?</h3>
      <p>
        It's worth giving the advice its best case. If we multiply the chance of being behind by the average shortfall when we are, we get the
        average shortfall over all outcomes, the dashed line in the second chart. It's about 5.5% of the bonds' value at one year, rises to a peak
        of about 7.8% at around seven years, and falls to about 5.1% at thirty. Meanwhile the median path keeps pulling further ahead. By that
        measure, thirty years of stocks really are a bit less risky than one.
      </p>
      <p>
        So whether time diversifies depends on how we measure risk. The chance of losing says yes. The size of the loss when we lose says no, and
        the rarer the loss the longer it says no. The average loss says yes, eventually. None of these is the wrong question, but they aren't the
        same question, and "you have time on your side" quietly answers the first one.
      </p>
      <p>
        Two other ways of measuring give sharper answers. Samuelson argued in 1963 that if we'd turn down a bet at every level of wealth, repeating it doesn't make it acceptable, and <a href="../samuelson-1963/">the next article</a> rebuilds his argument. Bodie showed in 1995 that insuring stocks against
        ending behind bonds costs more the longer the horizon, which <a href="../bodie-1995/">the article after that</a> works through. The real case
        for holding more stocks when we're young turns out to rest on something else, the wages we haven't earned yet, which later articles in
        this section come to.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our model is simpler than the world in a few ways that matter.</p>
      <p>
        First, each year's return is independent of the last, and we know the premium and the volatility. If returns tend to reverse over long
        periods, long horizons look safer than here. If we're honest that we don't know the premium, they look riskier, which is what Pástor and
        Stambaugh found when they put that uncertainty into the calculation.
      </p>
      <p>
        Second, the most quoted evidence for time diversification is a single market's history. "Stocks have beaten bonds over every twenty-year
        period" usually counts overlapping windows, and a century of data only holds five twenty-year periods that don't overlap. The United States
        was also one of the best stock markets of the century, so its history isn't a random draw.
      </p>
      <p>
        And finally, we compared a single amount invested once with a bond whose growth is certain. Real savers add money every year, and real
        bonds carry inflation risk of their own. Both change the numbers, though not the shape of the fan.
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
