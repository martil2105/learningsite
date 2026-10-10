<script>
  /* App.svelte for duration-and-convexity */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import SeesawFigure from "./Components/SeesawFigure.svelte";
  import PriceCurve from "./Components/PriceCurve.svelte";
  import HorizonLab from "./Components/HorizonLab.svelte";
  import SpreadFigure from "./Components/SpreadFigure.svelte";
  import HumpFigure from "./Components/HumpFigure.svelte";
  import katexify from "./katexify.js";

  const waitEq = katexify("D = \\frac{1}{P} \\sum_{t=1}^{T} t \\cdot \\text{PV}_t", true);
  const moveEq = katexify("\\frac{\\Delta P}{P} \\approx -\\frac{D}{1 + y}\\,\\Delta y + \\tfrac{1}{2}\\,C\\,\\Delta y^2", true);
  const slopeEq = katexify("\\frac{d \\ln W_H}{d \\ln (1 + r)} = H - D", true);
  const bendEq = katexify("\\ln W_D(r) - \\ln W_D(y) \\approx \\tfrac{1}{2}\\,\\text{Var}(t)\\,\\Delta^2, \\qquad \\Delta = \\ln \\frac{1 + r}{1 + y}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        In the article on bond prices and yields, we bought a 30-year bond with an 8% coupon for $100 and let interest rates move just after we
        bought it. Two things happened, and they pulled in opposite directions. The bond's price jumped at once, and every coupon was
        reinvested at the new rate for the rest of the bond's life.
      </p>
      <p>
        Which of the two wins depends on when we need the money. Let's say we run a pension fund that has to pay out at a known date. If we
        need the money soon, only the price matters. If we can wait 30 years, only the reinvestment does. Here's a question about a horizon in
        between.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <p>
        So at that one horizon, a move in rates either way leaves us better off. The number 12.2 is our bond's
        <span class="bold">duration</span>, and it has three jobs. Let's take them one at a time.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The average wait</h3>
      <p>
        The first job is the one Frederick Macaulay gave it in 1938. If we weight each payment's date by its share of the price, the average
        date is how long we wait for our money:
      </p>
      <div class="math-display">{@html waitEq}</div>
      <p>
        There's a nice way to picture it. Let's stand each payment's value today on a beam at its date. The duration is the place where we'd
        put a finger under the beam to balance it.
      </p>
    </section>

    <Figure id="fig-seesaw" title="Where the payments balance" sub="Drag the coupon and the maturity.">
      {#snippet children(w)}
        <SeesawFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar is a payment's value today at an 8% yield, standing on its date. The pink triangle is the point where the beam balances.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        For our bond the beam balances at 12.2 years, long before the 30 years to maturity. That's because the coupons in the early years are
        worth more today than the distant ones. The last payment, $108, is worth only $10.73 today, about 11% of the price. If you drag the
        coupon to zero, all the weight sits at the end and the balance point is the maturity itself. If you shorten the bond, the balance
        point moves with it.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The slope of the price</h3>
      <p>
        The second job is the one traders use every day. Duration also says how far a bond's price moves when its yield moves a little, and
        it's no coincidence that one number does both. Here's why. When the rate goes up, a payment due in {@html katexify("t")} years loses about {@html katexify("t")} times as much of its value as a payment due in one year, because it's discounted {@html katexify("t")} times. So the whole price falls by the average of those dates, weighted by each payment's share of the price, which is the average wait. Put exactly, the slope of the log price against the log of {@html katexify("1 + y")} is minus the average wait, and to second order
      </p>
      <div class="math-display">{@html moveEq}</div>
      <p>
        The first term is duration's straight line, and {@html katexify("D/(1+y)")}, 11.26 for our bond, is called
        <span class="bold">modified duration</span>. The second term is <span class="bold">convexity</span>, {@html katexify("C")}, which
        measures how much the price curve bends away from that line.
      </p>
    </section>

    <Figure id="fig-curve" title="Price against yield" sub="Drag the move in the yield.">
      {#snippet children(w)}
        <PriceCurve width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue dot is the real price after the move, the grey dot is duration's guess, and the pink line between them is what the straight
          line misses.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        For a one-point fall in the yield, the price rises 12.41%. Duration guesses 11.26%, and with convexity added the guess is 12.32%.
        Bigger moves need the convexity more. A four-point fall raises the price 69.17%, where the straight line says 45.03%, and a four-point
        rise loses 32.22% rather than 45.03%. The curve bends upwards, so the straight line always overstates the losses and understates the
        gains. The article on the dividend discount model found the same bend in the price of a share.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The horizon where the two cancel</h3>
      <p>
        Now for the third job, the one in our question. Let's hold the bond for {@html katexify("H")} years and then sell it, with every
        coupon reinvested at whatever rate we land on. In the article on bond prices and yields we saw that our money is then the bond's price
        at the new rate, grown at the new rate: {@html katexify("W_H(r) = P(r)\\,(1+r)^H")}. Taking logs and one derivative tells us how our
        money responds to the rate:
      </p>
      <div class="math-display">{@html slopeEq}</div>
      <p>
        The price pulls our money down with a strength of {@html katexify("D")}, and the reinvestment pushes it up with a strength of
        {@html katexify("H")}. So if we sell before the average wait, a rise in rates hurts us, and if we sell after it, a fall does.
      </p>
    </section>

    <Figure id="fig-horizon" title="Selling after H years" sub="Drag how long we hold the bond, or press the button.">
      {#snippet children(w)}
        <HorizonLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue curve is our money when we sell, against the promise of 8% a year, for each rate we might land on just after buying. The black
          line is exactly the promise.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With five years, a fall to 4% leaves us 40.08% ahead of the promise and a rise to 12% leaves us 18.70% behind. At 25 years the picture
        flips, and a fall leaves us 34.15% behind while a rise puts us 68.25% ahead. Somewhere in between the curve has to turn. If you press
        the button, you'll see that at the average wait it has no slope at 8% at all, and it becomes a valley whose floor is the promise. Every move, up or down, leaves us a little ahead: 6.91% if rates fall to 4%, 5.47% if they rise to 12%, and exactly the promise only if they stay at 8%.
      </p>
      <p>
        Choosing bonds whose duration matches the date we need the money is called <span class="bold">immunisation</span>. Our pension fund doesn't need a zero-coupon bond that matures on the day the money is due, which may not exist or may yield less. A coupon bond whose average wait matches the date does the same job, as long as rates move the way they did here. Frank Redington
        described it for life insurers in 1952, and it's still how pension funds and insurers match their bonds to their payments.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Why the floor is the promise</h3>
      <p>
        The valley comes from the next derivative of the same expression. At the average wait the slope is zero, and the bend turns out to be
        the variance of the payment dates around their average. So for a move of {@html katexify("\\Delta")} in the log of {@html katexify("1 + r")},
        the gain is about
      </p>
      <div class="math-display">{@html bendEq}</div>
      <p>
        The more spread out the payments are, the deeper the valley. A single zero-coupon bond maturing in 12.2 years has all its money on one
        date, so its variance is zero, and it gives exactly the promise whatever happens. A barbell of 2-year and 30-year zeros, mixed so that
        it waits 12.2 years on average, spreads its money as far as it can go.
      </p>
    </section>

    <Figure id="fig-spread" title="Three ways to wait 12.2 years" sub="Switch the readouts between the three.">
      {#snippet children(w)}
        <SpreadFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          All three hold $100 with the same average wait and are sold at it. Each curve is that one's money against the promise.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you switch between the three, you'll see the single zero stay on the promise. Our coupon bond's payments sit 9.4 years either side of their average, measured as a standard
        deviation, and it gains 6.91% if rates fall to 4%. The barbell's spread is 13.5 years, and it gains 14.57%.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Is convexity free?</h3>
      <p>
        This looks too good to be true. If the barbell gains from every move and never loses, why would anyone hold the single zero? Something
        has to give, and it's our picture of rates. We moved every rate by the same amount, once. If the whole set of rates really did move only in parallel, the barbell would beat the zero every time. A trader could buy the barbell, sell the zero, put nothing down, and come out ahead whichever way rates went, which would be free money. Jonathan Ingersoll, Jeffrey Skelton and Roman Weil
        pointed out in 1978 that a market can't work that way.
      </p>
      <p>
        Two things take the free lunch away. First, short and long rates don't move together. If the 2-year rate falls while the 30-year rate
        rises, the barbell can lose against the zero, and that's a risk our valley doesn't show. Second, the market charges for convexity. If yields move by about a point a year, the barbell's extra convexity is worth about 0.78% a year. So for the two to be a fair deal, the barbell has to yield about that much less than the zero. It's one reason the longest yields can sit a little below slightly shorter ones, which the
        next article takes up.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A longer bond with a shorter wait</h3>
      <p>
        One last surprise. We'd expect a longer bond to have a longer duration, and for a zero it does, since its duration is its maturity. A long enough bond that pays coupons, though, waits about as long as a bond that pays forever. That's a
        <span class="bold">perpetuity</span>, and its average wait is {@html katexify("(1+y)/y")}, which is 13.5 years at 8%.
      </p>
    </section>

    <Figure id="fig-hump" title="The average wait against maturity" sub="Switch between the three coupons.">
      {#snippet children(w)}
        <HumpFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">All three bonds yield 8%. The dashed line is the wait of a bond that never matures.</p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you pick the 8% coupon, you'll see its wait climb towards 13.5 years and never pass it. A bond with a 2% coupon does pass it: its average wait peaks at 16.4
        years for a 34-year bond, and a 100-year bond with the same coupon waits only 13.6 years. So beyond 34 years, a longer bond has a
        shorter duration. Up to that point, adding years pushes the big final payment further out. After it, the final payment is discounted so
        heavily that it barely counts, and the wait settles back to the perpetuity's.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Duration packs a lot into one number, and it does it by leaving some things out.</p>
      <p>
        First, we moved rates once, just after buying. Real rates keep moving, and the average wait drifts as time passes and as rates change,
        so an immunised fund has to rebalance to keep its duration matched to its date. A year after we buy our bond, the date we need the money is 11.2 years away, while the bond's average wait has only fallen to 12.1 years, because a bond's wait shrinks more slowly than the calendar. After ten years the date is 2.2 years away, and the bond still waits 10.6.
      </p>
      <p>
        Second, every rate moved by the same amount. Real curves twist, and matching durations doesn't protect us against a change in shape,
        which is why funds also watch how spread out their payments are.
      </p>
      <p>
        Third, duration is a first-order idea. Over a big move the straight line misses a lot, as the price curve showed, and convexity is only
        the next term.
      </p>
      <p>
        And finally, we assumed every bond pays in full. For a bond that might default, a move in rates and a change in the risk of default
        come tangled together.
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
