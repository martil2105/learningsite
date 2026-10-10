<script>
  /* App.svelte for yield-curve-and-forwards */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import BootLab from "./Components/BootLab.svelte";
  import CouponFigure from "./Components/CouponFigure.svelte";
  import BreakEvenFigure from "./Components/BreakEvenFigure.svelte";
  import ForecastLab from "./Components/ForecastLab.svelte";
  import katexify from "./katexify.js";

  let sigma = $state(0.01);
  let prem = $state(0);
  const avgEq = katexify("y \\approx \\sum_{t} w_t \\, s_t, \\qquad w_t = \\frac{t \\cdot \\text{PV}_t}{\\sum_u u \\cdot \\text{PV}_u}", true);
  const fwdEq = katexify("(1 + s_2)^2 = (1 + s_1)(1 + f_2)", true);
  const vasEq = katexify("f(T) = \\mathbb{E}[r_T] + \\pi \\left(1 - e^{-\\kappa T}\\right) - \\frac{\\sigma^2}{2\\kappa^2} \\left(1 - e^{-\\kappa T}\\right)^2", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        If we ask how much it costs to borrow, the honest answer is another question: for how long? A one-year loan to the US government pays
        one rate, a ten-year loan another and a thirty-year loan a third. If we plot those rates against the length of the loan, we get the
        <span class="bold">yield curve</span>, which is probably the most watched chart in finance.
      </p>
      <p>
        There are really three curves hiding in that chart, though. Most government bonds pay coupons, so the yields quoted in the news are
        yields to maturity of coupon bonds. Underneath them sit <span class="bold">spot rates</span>, the yields of zero-coupon bonds, one for
        each maturity. And from the spot rates we can read off <span class="bold">forward rates</span>, the rates the market lets us lock in
        today for a loan that starts later. Let's build all three from a handful of bond prices, and then ask what the forward rates are telling
        us.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Bootstrapping the spot rates</h3>
      <p>
        Our market has five government bonds, maturing in one to five years, with coupons from 2% to 4%. We can't see a spot rate directly,
        since every bond but the shortest pays more than once. What we can do is work up the curve one maturity at a time. The 1-year bond pays
        only once, so its price gives the 1-year spot rate. The 2-year bond pays twice, and we already know what its first payment is worth, so
        what's left of its price must be paying for the second. That gives the 2-year spot rate, and so on. This is called <span class="bold">bootstrapping</span>. If you press "Next bond" in the chart below, you'll see each step's sum written out under it.
      </p>
    </section>

    <Figure id="fig-boot" title="Five bonds, one maturity at a time" sub="Press &quot;Next bond&quot;, and drag the error once all five are in.">
      {#snippet children(w)}
        <BootLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Blue dots are spot rates and pink steps are the forward rates between them. The grey rings are each bond's own yield to maturity.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With all five bonds in, the spot rates come out at 2.55%, 2.98%, 3.32%, 3.58% and 3.78%, which are exactly the rates we used to price
        the bonds in the first place. Notice that each bond's own yield sits a little below its spot rate, 3.74% against 3.78% for the 5-year
        bond, and the next section is about why.
      </p>
      <p>
        Now drag the error slider. If the 3-year bond's price is 25 cents too high, perhaps because its last trade was stale, the 3-year spot
        rate moves from 3.32% to 3.23%, about a tenth of a point. The forward rates move three times as far, and in opposite directions. The one
        from year 2 to year 3 falls from 3.99% to 3.72%, and the one from year 3 to year 4 rises from 4.37% to 4.66%. A forward rate is a
        difference between neighbouring spot rates, so it magnifies their errors. That's why forward curves built from real prices come out
        jagged unless they're smoothed.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A yield is an average of spot rates</h3>
      <p>
        A coupon bond's yield to maturity is the one rate that prices all of its payments, while each payment really deserves its own spot rate.
        So the yield has to be some kind of average of the spot rates, and to first order it's a simple one. Each spot rate is weighted by its
        payment's share of the bond's average wait, the duration from the previous article:
      </p>
      <div class="math-display">{@html avgEq}</div>
    </section>

    <Figure id="fig-coupon" title="One maturity, different yields" sub="Drag the coupon of a ten-year bond.">
      {#snippet children(w)}
        <CouponFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The bars show how much weight each year's spot rate gets in the bond's yield, and the dashed line is the spot rates averaged with those
          weights.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        A ten-year bond with a 10% coupon puts a third of its weight on the years before the last, where spot rates are lower. So it yields only 4.15%, and the weighted average of the spot rates comes to 4.15% too. If you drag the coupon to zero, all of the weight moves to year
        ten and the yield rises to the 10-year spot rate, 4.29%. So on an upward-sloping curve, two bonds with the same maturity can have
        different yields, and the one with the higher coupon yields less. This is the <span class="bold">coupon effect</span>, and it's why a
        curve of yields to maturity mixes up the curve we care about with the coupons of whichever bonds happen to be on it.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Forward rates</h3>
      <p>
        Now for the third curve. Suppose we want to lend for two years. We can buy the 2-year zero, or we can buy the 1-year zero and lend again
        next year at whatever the 1-year rate is then. The second plan wins if next year's rate turns out high enough, and the rate at which the
        two plans tie is the <span class="bold">forward rate</span> for the second year:
      </p>
      <div class="math-display">{@html fwdEq}</div>
    </section>

    <Figure id="fig-breakeven" title="Two ways to lend for two years" sub="Drag next year's 1-year rate.">
      {#snippet children(w)}
        <BreakEvenFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The flat line is what the 2-year zero pays, the rising one is what lending twice pays, and the circle is where they tie.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With our spot rates of 2.55% and 2.98%, the 2-year zero turns $100 into $106.06, and lending twice only matches it if next year's rate
        is 3.42%. At today's 2% it would give $104.60. The forward rate is a break-even, and we worked it out from today's prices alone.
      </p>
      <p>
        The same logic works for any pair of dates, so every spot rate is an average of the forward rates before it, compounded together. That's why, on a rising curve, the forward rates sit above the spot rates and climb faster. In the bootstrap chart, the forward rate for the fifth year is 4.60%, against a 5-year spot rate of 3.78%.
      </p>
      <p>
        None of this involves a forecast, but it's very tempting to read forward rates as one. The <span class="bold">expectations hypothesis</span> does just
        that: it says each forward rate is the market's best guess of the future short rate, so an upward-sloping curve means rates are
        expected to rise. Let's test that idea in a world where we know exactly what investors expect. Here's a question first.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Why forwards aren't forecasts</h3>
      <p>
        Our world runs on Oldřich Vašíček's 1977 model of the short rate, which wanders at random but is pulled back towards a long-run level.
        We'll set it up so that investors expect the short rate to stay at 4% forever. The model then gives the forward rate in closed form:
      </p>
      <div class="math-display">{@html vasEq}</div>
      <p>
        Here {@html katexify("\\kappa")} is how fast the rate is pulled back, and we use 0.1, a half-life of about seven years. The volatility {@html katexify("\\sigma")} is how much the rate moves in a year, and {@html katexify("\\pi")} is the premium investors ask for holding long bonds. The middle term pushes forward rates up, and the last term pulls them down.
      </p>
    </section>

    <Figure id="fig-forecast" title="What investors expect, and what the curve says" sub="Drag the volatility of rates and the premium.">
      {#snippet children(w)}
        <ForecastLab width={w} bind:sigma bind:prem />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dashed line is the short rate investors expect, the blue line is the forward rate and the green line is the zero-coupon yield. The
          shading shows how much the premium adds and the convexity takes away.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With the sliders where they start, no premium and a volatility of a point a year, the forward rate for 30 years from now is 3.55%, 0.45
        points below the 4% that everyone expects. That's the convexity from the previous article at work. A long bond's price is a curved
        function of rates, so uncertainty about rates raises its value, and a higher price means a lower yield. The effect grows with the square
        of the volatility: at 1.5 points it's 1.02 points, and if you drag the volatility to zero, the forward curve lies flat on the
        expectation.
      </p>
      <p>
        Now add a premium. Investors who want an extra return for holding long bonds push long yields up. If you drag the premium to half a point, the 30-year forward rate rises to 4.02%. You'll also see a hump appear in the middle, because the premium builds up with maturity faster than the convexity, which grows with its square. So one and the same expected path for rates can come with a forward curve that rises, falls or stays flat, depending on two things the curve doesn't show us. John Cox, Jonathan Ingersoll and Stephen Ross showed in 1981 that the
        different versions of the expectations hypothesis can't even all be true at once, and convexity is the reason.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the data say</h3>
      <p>
        If forward rates were forecasts, a forward rate above today's short rate should predict that rates will rise by the gap, and the extra return on long bonds over the next year should be impossible to predict. Eugene Fama and Robert
        Bliss tested this in 1987 on US Treasury bonds. Over the following year, the gap between a forward rate and the 1-year rate mostly
        predicted the extra return on the long bond, almost one for one, rather than a rise in rates. It explained about 18% of the variation in
        those returns, and John Cochrane and Monika Piazzesi found in 2005 that the result had held up well since.
      </p>
      <p>
        In the language of our lab, the premium isn't a fixed number at all. It moves over time, and much of what moves the slope of the curve
        is the premium moving.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our curves were cleaner than real ones, and that left a few things out.</p>
      <p>
        First, we built our curve from five bonds priced exactly off a smooth curve. Real bonds have stale prices and differ in liquidity and tax treatment. So real curves are fitted with smooth shapes, such as Charles Nelson and Andrew Siegel's curve or splines, which give up an exact match in return for forward rates that aren't jagged.
      </p>
      <p>
        Second, Vašíček's model has one source of randomness, so all rates move together, and its volatility never changes. Real curves twist,
        and their volatility changes, which changes the size of the convexity term along with it.
      </p>
      <p>
        Third, our premium was a number we chose. In the data it moves around, and estimating it is a whole literature of its own. Our convexity term came straight from the model, and as the article on duration and convexity showed, it's something the market charges for, so its size in real yields depends on how volatile investors think rates will be.
      </p>
      <p>
        And finally, we mixed conventions. The bonds compound once a year and the model compounds continuously, which makes a small difference
        at these rates and none to the conclusions.
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
