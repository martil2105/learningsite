<script>
  /* App.svelte for anarkulova-cederburg-odoherty-2022 */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import PaperCard from "./Components/PaperCard.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import MarketsLab from "./Components/MarketsLab.svelte";
  import LuckFig from "./Components/LuckFig.svelte";
  import katexify from "./katexify.js";

  let seed = $state(3);
  let T = $state(30);
  let n = $state(39);
  let Y = $state(130);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <PaperCard>
    {#snippet cite()}
      Anarkulova, A., Cederburg, S. and O'Doherty, M. S. (2022), "Stocks for the long run? Evidence from a broad sample of developed markets",
      <em>Journal of Financial Economics</em>, 143(1), 409–433.
    {/snippet}
    {#snippet claims()}
      Long-run stock returns are usually judged from the US record, which belongs to the market that did best. Pooling 39 developed markets
      from 1841 to 2019, the paper estimates a 12% chance that a diversified stock investor loses to inflation over thirty years.
    {/snippet}
    {#snippet rebuild()}
      A world of 39 identical markets, where the luckiest record makes long-run losses look almost impossible, and a formula for how far off
      that record is.
    {/snippet}
    {#snippet later()}
      The same authors used the pooled data to argue that an all-stock mix of home and foreign markets, held for life, beats the usual
      age-based funds.
    {/snippet}
  </PaperCard>

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we want to know how often stocks lose to inflation over thirty years. The natural place to look is the longest and best-kept
        record we have, which is the US one, and in that record a thirty-year real loss almost never happens. The trouble is how the US came to
        have the longest and best-kept record. Its market became the world's largest because it did so well, so the record we study most is the
        record of a winner.
      </p>
      <p>
        That worry isn't new. In 1999 Jorion and Goetzmann collected price indices for 39 markets going back to the 1920s, and found that US
        stocks had the highest real return of them all. Anarkulova, Cederburg and O'Doherty went further. They gathered total returns for 39
        developed markets, some reaching back to 1841, and asked what those records imply for someone saving for thirty years. Before we look at
        their answer, let's see how much a winner's record can mislead us on its own.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Thirty-nine identical markets</h3>
      <p>
        Let's build a world where we know the truth. It has 39 stock markets, and they're identical. In each of them, the real value of the
        market grows by 4% a year on average, measured in logs, with a volatility of 20%, and every year is drawn independently of the others.
        We let the world run for 130 years. Any difference between the markets' records is luck, because there's nothing else for them to
        differ in. The lab below draws one such world and colours the market that ended richest in blue. Then it works out what each record
        says about losing to inflation.
      </p>
    </section>

    <Figure id="fig-markets" title="The luckiest of thirty-nine identical markets" sub="Drag the horizon, then draw a few new worlds.">
      {#snippet children(w)}
        <MarketsLab width={w} bind:seed bind:T />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each grey line is a market and the blue one ended richest. The second panel turns the records into the chance of losing to inflation
          over each horizon.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        In the world the lab opens on, the luckiest market grew by about 7.8% a year, nearly twice the true 4%. Its record says that a
        thirty-year real loss happens about 2.3% of the time. The truth, for every one of these markets, is about 13.7%, and pooling all 39
        records gets us much closer to it. If you draw a few new worlds, you'll see the numbers move, but the pattern doesn't change. Across
        many worlds, the luckiest record typically puts the thirty-year chance at about 1.7%.
      </p>
      <p>
        That's a gap of about the same size as the one the paper found between its pooled markets and the US on its own, which we'll come to
        below. Here it comes from luck and nothing else.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How far ahead is the luckiest?</h3>
      <p>
        We can work out the size of the effect. A record of {@html katexify("Y")} years estimates the growth rate with a standard error of
        {@html katexify("\\sigma/\\sqrt{Y}")}, which is about 1.75 points a year for us. The best of {@html katexify("n")} records sits, on
        average, a certain number of standard errors above the truth. That number is the expected largest of {@html katexify("n")} draws from a
        standard normal distribution, which we'll write {@html katexify("\\mathbb{E}[\\max_n]")}. For 39 markets it's about 2.15, so the
        luckiest record overstates growth by
      </p>
      <div class="math-display">{@html katexify("\\mathbb{E}[\\max_n]\\,\\frac{\\sigma}{\\sqrt{Y}} \\approx 2.15 \\times \\frac{20\\%}{\\sqrt{130}} \\approx 3.8 \\text{ points a year}", true)}</div>
      <p>
        That overstated growth goes straight into the chance of a loss. A record with growth {@html katexify("m")} and volatility
        {@html katexify("\\sigma")} puts the chance of a real loss over {@html katexify("T")} years at
        {@html katexify("\\Phi(-m\\sqrt{T}/\\sigma)")}, where {@html katexify("\\Phi")} is the standard normal distribution function. If we add
        the luck to {@html katexify("m")}, the number inside {@html katexify("\\Phi")} moves by
      </p>
      <div class="math-display">{@html katexify("\\mathbb{E}[\\max_n]\\,\\sqrt{T / Y}", true)}</div>
      <p>
        It doesn't depend on the growth rate or the volatility at all, only on how many markets we chose from, the horizon, and the length of
        the record. At thirty years, with 130 years of records and 39 markets, it's about one standard deviation, which is the difference
        between 13.7% and 1.7%. The shift grows with the horizon, like the error in the mean in the
        <a href="../pastor-stambaugh-2012/">Pástor and Stambaugh</a> article, because a mistake in the growth rate compounds year after year.
      </p>
    </section>

    <Figure id="fig-luck" title="The truth and the luckiest record, by horizon" sub="Change how many markets we choose from and how long the records are.">
      {#snippet children(w)}
        <LuckFig width={w} bind:n bind:Y />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The black curve is the true chance of a real loss, and the blue curve is what the luckiest record implies on average. Pick one market
          and the two curves meet, because there's nothing to choose.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Choosing from more markets makes things worse, but only a little, since the expected maximum grows very slowly with
        {@html katexify("n")}. If you switch to 100 markets, you'll see the luck premium rise only to about 4.4 points. Longer records help, and they're slow too. If you switch to 180 years of record, the luck premium only falls to
        about 3.2 points a year. None of this needs the markets to be different. If they really do differ, as real ones do, then the winner's
        record mixes a better market with better luck, and the pooled record is the fairer guide to a market we couldn't have picked in
        advance.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the paper found</h3>
      <p>
        The paper's data cover 39 developed markets, with total returns that include dividends, adjusted for inflation. Some records go back to
        1841 and others only a few decades. To turn them into thirty-year outcomes, the authors use a <span class="bold">block bootstrap</span>.
        They build many artificial thirty-year histories by stringing together randomly chosen stretches of real history, each about ten years
        long on average and each from a randomly chosen market. That keeps the bad decades intact, the wars, the hyperinflations and the long
        slumps, rather than averaging them away.
      </p>
      <p>
        The published estimate is a 12% chance of losing to inflation over thirty years. In the working-paper version, the same method run on
        US data alone gives about 1%, and the pooled chance falls only slowly with the horizon, from about 15% at ten years to about 13% at
        thirty. The same version puts the thirty-year chance at about 4% for a portfolio of foreign markets, so spreading across countries does
        much of what a long horizon doesn't. Bonds and bills did worse still, losing to inflation over thirty years about 27% and 37% of the
        time. So the paper isn't an argument against stocks. It's an argument against believing they're safe.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What came later</h3>
      <p>
        The authors carried the pooled data into a study of saving for retirement, circulated from 2023. They compare lifetime strategies
        across the same developed markets, and find that an even split between home and foreign stocks, held for a whole working life, beats
        the usual age-based funds that move into bonds. It comes out ahead on wealth at retirement, on money to spend in retirement and on
        money left over. That's the last paper in this section, and it leans on the tail we've seen here: stocks lose often enough to matter,
        but bonds lose more often.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our world is simpler than the real one in three ways.</p>
      <p>
        First, our markets are identical, so luck is the only thing that separates them. Real markets differ in their laws, their wars and
        their inflation, and the winner's record then mixes a better market with better luck.
      </p>
      <p>
        Second, our years are drawn from a normal distribution, one at a time. Real records have crashes, hyperinflations and runs of bad years,
        which fatten the left tail. That's why the paper keeps its blocks about ten years long, and it's one reason the real loss chance falls
        so slowly with the horizon.
      </p>
      <p>
        And finally, we studied the market that ended richest. Nobody studies the US record because it came first in a ranking. We study it
        because it's the biggest and best documented, which comes to much the same thing, since markets get big by doing well.
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
