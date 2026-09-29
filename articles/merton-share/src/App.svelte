<script>
  /* App.svelte for merton-share */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import ShareLab from "./Components/ShareLab.svelte";
  import EstimateFig from "./Components/EstimateFig.svelte";
  import katexify from "./katexify.js";

  let gamma = $state(2);
  let premium = $state(0.05);
  let sigma = $state(0.18);
  let N = $state(100);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we have some savings and two places to put them. A safe account pays a fixed rate, and a stock fund is expected to beat it
        by 5 points a year, with a volatility of 18%. We'll keep the same share of our savings in stocks all the time, selling a little after
        good years and buying a little after bad ones. How big should that share be?
      </p>
      <p>
        In 1969 Robert Merton gave an answer that fits in one fraction, and it's become known as the <span class="bold">Merton share</span>.
        It's the starting point for the rest of this part of the site, including the question of how much stock a young saver should hold.
        Before we write it down, let's see what it's the answer to.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What a share is worth</h3>
      <p>
        To compare shares, we need a way to put a value on a risky position. Let's use its <span class="bold">certainty equivalent</span>, the
        safe return we'd happily swap it for. How much safe return we'd give up to avoid risk depends on how much we dislike it, and we'll
        measure that with a number {@html katexify("\\gamma")}, our <span class="bold">risk aversion</span>. We'll assume our dislike of risk
        is about proportions, so that losing a tenth of our wealth feels the same whether we're rich or poor. For an investor like that, a
        share {@html katexify("\\pi")} held in stocks is worth this much over the safe rate {@html katexify("r")}:
      </p>
      <div class="math-display">{@html katexify("\\text{CE} - r = \\pi\\,(\\mu - r) - \\frac{\\gamma\\,\\pi^2\\sigma^2}{2}", true)}</div>
      <p>
        Here {@html katexify("\\mu - r")} is the premium and {@html katexify("\\sigma")} the volatility. The first term is what the premium
        adds, and it grows in step with the share. The second is what the risk costs, and it grows with the square of the share, because
        doubling our stake quadruples the variance of our returns. At a risk aversion of 2, each unit of variance costs us one unit of return.
        The lab below draws this for every share from nothing to 300%, which would mean borrowing twice our savings to buy more stocks.
      </p>
    </section>

    <Figure id="fig-share" title="What each share in stocks is worth" sub="Change the risk aversion, the premium and the volatility.">
      {#snippet children(w)}
        <ShareLab width={w} bind:gamma bind:premium bind:sigma />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue curve is what a share is worth, as a safe return over the safe rate. The dashed line is what the premium alone would add, and
          the gap between them is the cost of risk.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With a risk aversion of 2, the curve peaks at a share of about 77%, where holding stocks is worth about 1.93 points a year over the safe
        rate. If you switch the risk aversion to 1, the peak moves to about 154%, so an investor who dislikes risk that little would borrow to
        buy stocks. At 4 the share halves to about 39%, and at 8 it halves again. We can find the peak by setting the curve's slope to zero:
      </p>
      <div class="math-display">{@html katexify("\\pi^* = \\frac{\\mu - r}{\\gamma\\,\\sigma^2}", true)}</div>
      <p>
        That's Merton's share. It's the premium divided by the variance, scaled down by our risk aversion. Nothing in it mentions our age, our
        wealth or how many years we'll invest for. Merton and Samuelson showed in 1969 that for this kind of investor, with returns that are
        independent from year to year, the same share is best at every horizon. The next article works through why.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A flat top</h3>
      <p>
        Notice how flat the curve is near its peak. All in stocks, at 100%, is worth about 1.76 points a year, which keeps about 91% of the
        best we can do. In fact the curve has the same shape whatever we put in. If we hold {@html katexify("x")} times the Merton share, we
        keep
      </p>
      <div class="math-display">{@html katexify("2x - x^2 = 1 - (1 - x)^2", true)}</div>
      <p>
        of the best gain. Half the Merton share keeps three quarters of it, and so does one and a half times the share. Twice the Merton share
        keeps nothing, so it's worth no more than the safe rate, and anything beyond that is worse than holding no stocks at all. With a risk
        aversion of 1 this is the famous result about betting. The share that makes our wealth grow fastest is the premium over the variance,
        called the <span class="bold">Kelly</span> share, and betting twice that leaves us growing no faster than the safe rate.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Which premium goes in?</h3>
      <p>
        The formula needs the arithmetic premium, the average of yearly returns. It's easy to type in the average of log returns instead,
        because that's what a growth rate over many years measures. For our stocks that's 5% minus {@html katexify("\\sigma^2/2")}, or about
        3.4%. If you move the premium slider down to 3.4%, you'll see the share fall from 77% to about 52%, a third less stock for the same
        stocks. If we write {@html katexify("m")} for the log premium, the right share is
        {@html katexify("(m + \\sigma^2/2)/(\\gamma\\sigma^2)")}, which gives us back 77%.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The premium we have to estimate</h3>
      <p>
        So far we've acted as if we knew the premium. In practice we estimate it from past returns, and earlier articles in this section showed
        how blurry that estimate is. With {@html katexify("N")} years of data, the average premium has a standard error of
        {@html katexify("\\sigma/\\sqrt{N}")}, so a share worked out from it has a standard error of
        {@html katexify("1/(\\gamma\\sigma\\sqrt{N})")}. With a century of data and a risk aversion of 2, that's about 28 points, so a true
        share of 77% could easily come out as 49% or 105%.
      </p>
      <p>
        Because the top of the curve is flat, most of those errors don't cost much. The expensive ones are out in the tails, and the average cost
        has a tidy form. An investor who plugs in the average of {@html katexify("N")} years keeps, on average,
      </p>
      <div class="math-display">{@html katexify("1 - \\frac{1}{N \\cdot \\text{SR}^2}", true)}</div>
      <p>
        of the best gain, where {@html katexify("\\text{SR} = (\\mu - r)/\\sigma")} is the stocks' <span class="bold">Sharpe ratio</span>.
        The risk aversion has dropped out. With our stocks the Sharpe ratio is about 0.28, so a century of data keeps about 87% of the gain,
        and 30 years keeps about 57%. At about 13 years, which is {@html katexify("1/\\text{SR}^2")}, the average loss uses up the whole gain,
        and our plug-in investor does no better than someone who never held stocks.
      </p>
    </section>

    <Figure id="fig-estimate" title="Plugging in an estimated premium" sub="Change how many years of data each investor has.">
      {#snippet children(w)}
        <EstimateFig width={w} bind:N />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each dot is an investor. The pink ones hold a share worth less than no stocks at all, because it's below zero or more than twice the
          true share.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you switch to 13 years of data, you'll see about a third of our investors land in the pink, and on average they keep nothing. With a
        century of data, almost none of them do. The spread of the shares shrinks only with the square root of the years, which is why the
        second panel climbs so slowly.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>The Merton share is only as good as its assumptions, and three of them matter most here.</p>
      <p>
        First, it's the answer for returns that are independent from year to year, with a constant premium and volatility. If returns revert,
        or if the premium itself moves, the best share can change with the horizon, and the Pástor and Stambaugh article showed that doubt
        about those dynamics can push either way.
      </p>
      <p>
        Second, it treats our savings as all of our wealth. For a young saver most wealth is future wages, and a later article shows how that
        changes the answer, often towards holding far more stock than the formula alone suggests.
      </p>
      <p>
        And finally, borrowing isn't free. Past 100% the formula assumes we can borrow at the safe rate, and most of us can't, which bends the
        curve down beyond that point.
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
