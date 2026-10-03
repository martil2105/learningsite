<script>
  /* App.svelte for factor-models */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import AlphaLab from "./Components/AlphaLab.svelte";
  import PriceBars from "./Components/PriceBars.svelte";
  import katexify from "./katexify.js";

  const regEq = katexify("r_t - r_{f,t} = \\alpha + \\beta\\,(r_{m,t} - r_{f,t}) + \\sum_k b_k f_{k,t} + \\varepsilon_t", true);
  const idEq = katexify("\\alpha_{\\text{small}} - \\alpha_{\\text{big}} = \\sum_{k \\text{ added}} b_k \\times \\alpha_{k\\,|\\,\\text{small}}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say someone shows us a strategy. Every month it buys the cheapest US shares, measured by book value against market value, and
        sells the most expensive. From July 1963 to August 2026 it earned 3.5% a year, and it did so while leaning slightly against the market,
        so the CAPM says it should have earned a little less than nothing. The return it earned beyond what our model expects is its
        <span class="bold">alpha</span>, and here the alpha is 4.5% a year.
      </p>
      <p>
        Is that skill, a free lunch, or a risk the CAPM doesn't see? We can't answer that without choosing a model, because an alpha is always
        measured against one. In this article we'll see how an alpha moves when we change the model, using Kenneth French's published
        factor returns. Here's a question to start with.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Alpha is an intercept</h3>
      <p>
        A <span class="bold">factor</span> is a portfolio that stands for one source of return, usually long one kind of share and short
        another. French publishes five besides the market: size (small minus big, SMB), value (HML), profitability (RMW), investment (CMA) and
        momentum (Mom). To measure an asset's alpha, we regress its monthly return above bills on the market and whichever factors our model
        includes:
      </p>
      <div class="math-display">{@html regEq}</div>
      <p>
        The <span class="bold">loadings</span> {@html katexify("b_k")} say how much of each factor the asset behaves like, and the intercept
        {@html katexify("\\alpha")} is whatever average return is left over. The CAPM is the version with the market alone.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Where does the alpha go?</h3>
      <p>
        When we add factors to a model, the alpha changes by an amount we can write down exactly. Each added factor takes away the asset's
        loading on it times that factor's own alpha against the smaller model:
      </p>
      <div class="math-display">{@html idEq}</div>
      <p>
        This holds exactly in any sample, because it's how least squares works when we add regressors (it's a form of the
        Frisch–Waugh theorem). So each factor comes with a price: its own alpha against the CAPM. The chart below shows those prices for our
        sample.
      </p>
    </section>

    <Figure id="fig-price" title="What each factor earns beyond the CAPM" sub="Each bar is a factor's own CAPM alpha a year, with two standard errors.">
      {#snippet children(w)}
        <PriceBars width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Read each bar as a price. An asset that loads on a factor has that factor's alpha taken away from its own, once per unit of loading,
          when the factor joins the model.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Momentum carries the highest price, at 8.3% a year, and size the lowest, at 0.9%. Now let's watch the identity work. The lab below
        starts from an asset's CAPM alpha and adds the factors you choose, one bar for each.
      </p>
    </section>

    <Figure id="fig-alpha" title="From the CAPM to a bigger model" sub="Pick an asset, then switch factors on and off or try the model buttons.">
      {#snippet children(w)}
        <AlphaLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The grey bar is the CAPM alpha. Each coloured step is one added factor's loading times its price, and the blue bar is what's left,
          with a whisker of two standard errors.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <h3 class="body-header">Value, explained by investment</h3>
      <p>
        If you switch on the five-factor model for value, you'll see the 4.5% fall to −0.3%. Nearly all of it goes in one step. Value loads
        1.00 on the investment factor, whose own alpha is 4.1%, so that step alone takes away 4.1 points. Profitability takes 0.6 more and size
        about 0.1. In other words, the cheap shares in the value portfolio are, to a close approximation, the shares of firms that invest
        conservatively, and once the model pays for investment, value has nothing left to add. Eugene Fama and Kenneth French reported this in
        2015, when they introduced the five-factor model.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Alpha can grow</h3>
      <p>
        Adding a factor doesn't always shrink an alpha. If you pick momentum and switch on value, you'll see its alpha rise from 8.3% to 9.8%.
        Recent winners tend to be expensive shares, so momentum loads −0.33 on value, and minus a negative loading times value's 4.5% adds 1.5
        points. The same thing happens the other way round: with momentum in the model, value's alpha grows from 4.5% to 5.9%. A factor that an
        asset leans against makes its alpha bigger, which is why value and momentum are often held together.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The lowest-beta shares</h3>
      <p>
        In the <a href="../capm-and-beta/">CAPM article</a>, the tenth of US shares with the lowest betas earned 2.5% a year more than the
        CAPM allowed, with a t-statistic of 2.6. If you pick that asset and try the model buttons, you'll see the alpha fall to 1.7% with three
        factors and to 0.3% with five, a t-statistic of 0.4. Profitability and investment do most of it on their own: with just those two, the
        alpha is −0.1%. Low-beta shares turn out to be shares of profitable firms that invest conservatively, and in a model that already pays
        for those, a low beta earns nothing extra.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>The identity is exact, but what we make of the numbers isn't, for four reasons.</p>
      <p>
        First, the factors were chosen after looking at the data. Researchers have proposed hundreds of them, and with enough tries some will
        explain any alpha by luck. A factor that earns its place should work in other periods and other countries too.
      </p>
      <p>
        Second, these are paper portfolios. They ignore trading costs and the cost of shorting, and momentum, which trades a lot, would give
        up part of its 8.3% in practice, how much depending on how carefully it's traded.
      </p>
      <p>
        Third, every alpha here has a standard error of roughly one to two points a year. The −0.3% left for value is a small number with a wide band
        around it, not a precise zero.
      </p>
      <p>
        And finally, the statistics can't tell us which model is right. Whether investment is a risk that deserves a reward or a mistake
        investors keep making is a question about why the factor pays, and the regression is silent on that.
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
