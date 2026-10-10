<script>
  /* App.svelte for bond-pricing-and-yield */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import PriceFigure from "./Components/PriceFigure.svelte";
  import PullFigure from "./Components/PullFigure.svelte";
  import RealisedLab from "./Components/RealisedLab.svelte";
  import RuleFigure from "./Components/RuleFigure.svelte";
  import katexify from "./katexify.js";

  const priceEq = katexify("P = \\sum_{t=1}^{T} \\frac{C}{(1 + y)^t} + \\frac{100}{(1 + y)^T}", true);
  const carryEq = katexify("P_t \\, (1 + y) = C + P_{t+1}", true);
  const wealthEq = katexify("W_T = P(r) \\, (1 + r)^T", true);
  const ruleEq = katexify("\\text{what we earn a year} \\;\\approx\\; y + \\left(1 - \\frac{D}{T}\\right)(r - y)", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we have $100 to lend for ten years, and we lend it by buying a bond. A <span class="bold">bond</span> pays us a fixed
        <span class="bold">coupon</span> every year, $5 on every $100 if its coupon is 5%, and hands back the $100 at the end, which is called
        <span class="bold">maturity</span>. The market sets its price, so the price moves when interest rates do.
      </p>
      <p>
        A bond is really a bundle of loans, one for each payment, all bought at once. A ten-year bond with a 5% coupon is ten small payments of
        $5 and one large one of $100, and each of them is worth less today the further away it is.
      </p>
      <p>
        To price a bond we discount each payment back to today. If we use one rate {@html katexify("y")} for every payment, then the rate that
        gives the market price is called the <span class="bold">yield to maturity</span>, or just the yield:
      </p>
      <div class="math-display">{@html priceEq}</div>
    </section>

    <Figure id="fig-price" title="One rate for every payment" sub="Drag the yield.">
      {#snippet children(w)}
        <PriceFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The grey outlines are a ten-year bond's payments, and the blue part of each is what it's worth today, so the price is the blue added
          up.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At a 4% yield our bond is worth $108.11, more than the $100 it will pay back, so it trades at a <span class="bold">premium</span>. If you
        drag the yield to 5%, it's worth exactly $100, because its 5% coupon is just what the market asks. At 6% it's worth $92.64, at a
        <span class="bold">discount</span>. Price and yield always move in opposite directions, since a higher rate shrinks every blue bar.
      </p>
      <p>
        The yield is how bonds are quoted, and it's usually read as the return we'll earn if we hold the bond to maturity. Most first courses add
        a caveat: that's only true if every coupon is reinvested at the same yield. It's worth seeing how much that caveat carries, so here's a
        question first.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <p>
        The 8% we thought we'd locked in isn't what we get, even though nothing defaulted and we never sold. Before we see why, let's look at
        what the yield does promise.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the yield promises</h3>
      <p>
        Suppose the yield never moves. Then every bond earns its yield, every year, whatever its coupon. That's because a bond's price today is
        next year's coupon plus next year's price, discounted for one year at the yield:
      </p>
      <div class="math-display">{@html carryEq}</div>
    </section>

    <Figure id="fig-pull" title="Three bonds at the same yield" sub="Switch the coupon.">
      {#snippet children(w)}
        <PullFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
        The first chart follows each bond's price as it ages. The second splits each year's return on the chosen bond into its coupon and
        its change in price, which always add up to the dashed line.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Our three ten-year bonds all yield 4%. The one with no coupon costs $67.56 and climbs to $100, so all of its return comes from its
        price. The one with an 8% coupon costs $132.44 and slides down to $100 as it ages, which looks like a loss every year. But it pays $8 a
        year, which is 6.04% of its price, and the coupon and the slide always add up to 4%.
      </p>
      <p>
        So a premium bond isn't a worse deal than a discount bond at the same yield. It just pays more of its return as coupons and gives some
        of it back as price. The coupon divided by the price, our 6.04%, is called the <span class="bold">current yield</span>, and it's
        sometimes quoted as if it were the return. For a premium bond it's too high, and for a discount bond it's too low. The yield is
        the fairer number, and it's why bonds are quoted by yield rather than by price. The prices of bonds with different coupons and
        maturities can't be compared directly, while their yields say what each one earns a year if nothing changes.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Where the money comes from</h3>
      <p>
        Holding to maturity is different, because the coupons arrive along the way and something has to happen to them. Let's go back to our
        30-year bond with an 8% coupon. If every coupon is reinvested at 8%, each $100 we put in turns into $1,006 after 30 years. Only $100 of
        that is the money we lent, and $240 is the coupons themselves. The other $666, two thirds of the whole, is interest earned on
        reinvested coupons.
      </p>
      <p>
        So the yield to maturity is partly a promise about a rate that isn't in the bond at all. When rates fall to 4%, the coupons earn 4%, the
        interest on them shrinks to $209, and the total comes to $549. That's how 8% turns into 5.84% a year. The share that comes from
        interest on coupons grows with the bond's life. If you drag the maturity down to 10 years in the lab below, you'll see it shrink
        to a sixth of the money, and on a 100-year bond it would be nearly all of it.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Held to maturity, when rates move</h3>
      <p>
        There's a neat way to see the whole thing at once. If rates move to {@html katexify("r")} just after we buy and stay there, then from
        that moment every payment is valued and reinvested at {@html katexify("r")}. So our position is worth the bond's price at
        {@html katexify("r")}, and it grows at {@html katexify("r")} all the way to maturity:
      </p>
      <div class="math-display">{@html wealthEq}</div>
      <p>
        Since we paid the price at the old yield, {@html katexify("P(y)")}, what we earn a year is
        {@html katexify("(1 + r)\\,\\big(P(r)/P(y)\\big)^{1/T} - 1")}.
      </p>
    </section>

    <Figure id="fig-realised" title="Holding to maturity" sub="Drag the coupon, the maturity and the new rate.">
      {#snippet children(w)}
        <RealisedLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The grey dashed line is what the yield promised, and the blue line is what our position is really worth, so the gap between their ends
          is the gap in the money we finish with. The circle marks where the two lines cross.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With the sliders where they start, the blue line jumps up the moment rates fall, because our bond is suddenly worth more. Then it grows
        at only 4%, the promise catches up with it after about 14 years, and at maturity we have $549 where we were promised $1,006.
      </p>
      <p>
        If you drag the new rate up to 12% instead, the blue line drops at first, because our bond loses value, and then it grows faster
        than the promise and overtakes it. We finish with $2,031 and earn 10.56% a year, more than the yield we bought at. So two things
        happen when rates move, and they pull in opposite directions. The price moves at once, and the reinvestment works slowly over the
        whole life. If we sold our bond a year after rates fell to 4%, we'd make 75.9% on it, almost all from the jump in its price. If we
        hold it for 30 years, the reinvestment wins and we end up behind. Somewhere in between, the two balance, at the circle in the
        chart, and that crossing is where the next article starts.
      </p>
      <p>
        If you drag the coupon to zero, the two lines end at the same place whatever the new rate, since a bond with no coupons has
        nothing to reinvest. Only a <span class="bold">zero-coupon bond</span> locks in its yield. That's why a pension fund that owes a
        known sum in 2045 can buy a zero maturing in 2045 and know today exactly what its money will earn. The US Treasury has let dealers
        split its bonds into separate zeros, one for each coupon and one for the principal, since 1985, and the pieces trade on their own
        as STRIPS.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How much of the yield survives?</h3>
      <p>
        Let's measure the average wait for our money, weighting each payment by its share of the price. It's called
        <span class="bold">Macaulay duration</span>, {@html katexify("D")}, after Frederick Macaulay, who defined it in 1938. To first order, we earn the yield on a share {@html katexify("D/T")} of the bond's life and the new rate on the rest:
      </p>
      <div class="math-display">{@html ruleEq}</div>
      <p>
        Here's where the rule comes from. When the rate falls by a point, our bond's price jumps by roughly {@html katexify("D")} percent at
        once, because the average wait also measures how far a price moves when rates change a little, as the next article shows. Then the
        reinvestment loses about a point a year for
        {@html katexify("T")} years. Net, we're behind by about {@html katexify("T - D")} points over the bond's life, which is a share
        {@html katexify("1 - D/T")} of a point a year.
      </p>
    </section>

    <Figure id="fig-rule" title="What we earn, against the new rate" sub="Switch between the four bonds.">
      {#snippet children(w)}
        <RuleFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue curve is what we earn a year for each new rate, and the dashed line is the rule, which touches the curve at the yield.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Our 30-year bond has an average wait of 12.2 years, 41% of its life, so the new rate sets 59% of what we earn. The rule says 5.62%
        when rates fall to 4%, and the exact answer is 5.84%. If rates rise to 12% instead, the rule says 10.38% and we really earn
        10.56%. A ten-year bond with the same coupon waits 7.2 years on average, 72% of its life, and earns 6.96%. A zero waits for its
        whole life, so its curve is flat at 8%. And a 100-year bond waits only 13.5 years, so it earns 4.71%,
        which is close to the new rate itself.
      </p>
      <p>
        Notice that the blue curve bends upwards, so it always sits above the rule. A fall in rates costs us a little less than the rule says,
        and a rise earns us a little more. That bend is the other half of the next article.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>We kept rates simple so that the reinvestment could be seen on its own. Here's what that left out.</p>
      <p>
        First, we moved rates once, just after buying, and kept them there. Real rates wander, and each coupon is reinvested at whatever the
        rate is on the day it arrives, so a coupon bond's return depends on the whole path of rates. Only a zero's doesn't.
      </p>
      <p>
        Second, we used one rate for every year. In practice a 2-year rate and a 30-year rate differ, and coupons usually get reinvested at
        shorter rates than the bond's own. The article after the next one is about that.
      </p>
      <p>
        Third, our coupons were paid once a year, while most government bonds pay twice a year. That changes the numbers a little, and the story
        not at all.
      </p>
      <p>
        And finally, we assumed the bond pays. A company's bond yields more because it might not, so for it the yield is a ceiling on what we
        earn rather than an estimate.
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
