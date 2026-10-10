<script>
  /* App.svelte for put-call-parity */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import PayoffFigure from "./Components/PayoffFigure.svelte";
  import ModelsLab from "./Components/ModelsLab.svelte";
  import IvLab from "./Components/IvLab.svelte";
  import PalmFigure from "./Components/PalmFigure.svelte";
  import katexify from "./katexify.js";

  const payEq = katexify("\\max(S_T - K, 0) - \\max(K - S_T, 0) = S_T - K", true);
  const parityEq = katexify("C - P = S - K e^{-rT}", true);
  const fwdEq = katexify("F = K + e^{rT} (C - P)", true);
  const boxEq = katexify("(C_{90} - P_{90}) - (C_{110} - P_{110}) = 20 \\, e^{-rT}", true);
  const amEq = katexify("S - K \\;\\le\\; C - P \\;\\le\\; S - K e^{-rT}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Here's a strange fact about options. Take a call and a put on the same share, with the same strike and the same expiry date. However
        we model the share, whatever we believe about crashes or rallies, the call's price minus the put's price is fixed by three things we can
        look up: the share price, the strike and the interest rate.
      </p>
      <p>
        This is <span class="bold">put–call parity</span>, and it's one of the few results in option pricing that needs no model at all. Let's
        see why it holds, what it lets us read off option prices, and what happened in March 2000, when it seemed to fail.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A call minus a put</h3>
      <p>
        A <span class="bold">call</span> is the right to buy a share at a fixed price, the strike {@html katexify("K")}, on a fixed date. A
        <span class="bold">put</span> is the right to sell it at the strike. Options that can only be used on that date are called European.
        At expiry the call pays the amount by which the share ends above the strike, and the put pays the amount by which it ends below.
        You can move the strike and where the share ends in the chart below.
      </p>
    </section>

    <Figure id="fig-payoff" title="What a call and a put pay" sub="Drag the strike and where the share ends, and switch to the difference.">
      {#snippet children(w)}
        <PayoffFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue line is what a call pays at expiry and the pink line is what a put pays, against where the share ends. When you switch to the
          difference, the black line is the call's payoff minus the put's.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If we buy the call and sell the put, we've given away the share's falls below the strike and kept its rises above it, so we're
        exposed to the whole move. With the strike at $100 and the share ending at $120, the call pays $20, the put pays nothing and the difference is $20. If the share ends at $80 instead, the call pays nothing, the put pays $20 and the difference is −$20. If you switch the chart to the difference, you'll see the two bends cancel into a straight line:
      </p>
      <div class="math-display">{@html payEq}</div>
      <p>
        That's exactly what a forward contract to buy the share at {@html katexify("K")} pays. Two things that pay the same in every outcome
        must cost the same today, or someone buys the cheap one, sells the dear one and keeps the difference. A forward to buy at
        {@html katexify("K")} is worth the share price minus the strike's present value, so for a share that pays no dividends:
      </p>
      <div class="math-display">{@html parityEq}</div>
      <p>
        Our share stands at $100, the safe rate is 4% and the options run for a year, so a call minus a put struck at $100 is worth $3.92.
        Here's a question before we put that to work.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Why it holds so tightly</h3>
      <p>
        Parity isn't just a theory that prices drift towards. It's how options are traded. A market maker who sells a call to a customer
        usually doesn't want to bet on the share, so she buys the share and a put at the same strike. Together, the three pay the strike at
        expiry whatever happens, a trade called a <span class="bold">conversion</span>, and she prices the call so that this riskless package
        earns the safe rate. The reverse trade, a reversal, keeps prices from straying the other way. So we should expect option prices to sit
        on parity, give or take the cost of trading, unless one of the three legs can't be traded.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Whatever the model</h3>
      <p>
        The guess card had no interest and no dividends, so a call and a put struck at today's price must cost the same, $12 each, in any model. Most people's first instinct is that the put should depend on how likely a crash is. It does, and so does the call, by the same amount.
        Let's price our options in two different worlds. In the first the share moves smoothly, with a volatility of 20% a year. In the second
        it moves less day to day but has a 10% chance of a 30% crash during the year. Both are priced so that the share itself costs $100.
      </p>
    </section>

    <Figure id="fig-models" title="Two models, one difference" sub="Switch the model and drag the strike.">
      {#snippet children(w)}
        <ModelsLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Solid lines are call and put prices against the strike in the chosen model, and dashed ones are the other model's. The black line is
          the call minus the put.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        In the smooth world, a call struck at $110 costs $5.66 and the put costs $11.35. If you switch to the world with crashes, the call
        costs $4.53 and the put $10.22. The two models disagree about both prices, and the dashed lines show they disagree at every strike,
        but the call minus the put is −$5.69 in both. That's the value of a forward to buy at $110, and the black line doesn't move at all
        when you switch.
      </p>
      <p>
        Notice what this means for <span class="bold">implied volatility</span>, the volatility that makes Black and Scholes's formula match an
        option's price. In the crash world, options struck at $80 imply 20.4% and options struck at $120 imply 16.6%, a skew, since crashes
        make low strikes dearer. But the call and the put at each strike imply the same volatility, because whatever moves one moves the
        other. The skew belongs to the strike, not to calls or puts.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The forward hiding in option prices</h3>
      <p>
        Parity also runs the other way. If we can see a call and a put, we can read off the forward price the market is using:
      </p>
      <div class="math-display">{@html fwdEq}</div>
      <p>
        For our share that's $104.08, the share price grown at 4%. But as the article on forwards showed, a share that pays dividends has a lower forward price. So does a share that costs something to borrow, since anyone who'd sell it short has to pay a fee to its lender. Option prices include all of that, so the forward they imply is the one that's really available. Let's see what happens when
        we forget it.
      </p>
    </section>

    <Figure id="fig-iv" title="Same strike, same volatility?" sub="Drag the borrowing fee, and switch the forward we use.">
      {#snippet children(w)}
        <IvLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each line is the volatility we'd work out from calls or puts at each strike, when every option is really priced at 25%. A gap in the
          blue line means no volatility at all gives that call's price.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With a 3% fee for borrowing the share, the forward price is $101.01, not $104.08. If we work out volatilities as though it were
        $104.08, the put at $100 seems to imply 28.17% and the call 20.45%, when the truth is 25% for both. Below a strike of $84.50, the call
        is worth less than our wrong forward says any call can be, and no volatility gives its price. If you switch to the forward the options imply, the two lines fall onto one flat line at 25%. And if you drag the fee to zero, they meet without any help, since the share price grown at 4% is then the right forward.
      </p>
      <p>
        So when calls and puts at the same strike seem to disagree, the first suspect isn't the market, it's our forward. And if we trust the
        options, the gap tells us what it costs to borrow the share.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Palm, March 2000</h3>
      <p>
        On 2 March 2000, the computer company 3Com sold a small part of its subsidiary Palm, maker of the PalmPilot, to the public. It said it would hand its own shareholders the rest later that year, about 1.525 Palm shares for every 3Com share. At the end of the first day,
        Palm closed at $95.06, so a 3Com share held about $144.97 of Palm. A 3Com share closed at $81.81. Owen Lamont and Richard Thaler, who
        studied the episode in 2003, pointed out that the market was pricing everything else 3Com owned at less than nothing.
      </p>
      <p>
        The obvious trade was to buy 3Com and sell Palm short. That needs Palm shares to borrow, and almost none could be had. Palm's options
        show what that shortage was worth. On 17 March, with Palm at $55.25, they valued a Palm share for delivery at each expiry like this:
      </p>
    </section>

    <Figure id="fig-palm" title="What Palm's options said it was worth" sub="Switch the expiry.">
      {#snippet children(w)}
        <PalmFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar runs from the price at which options let us sell a Palm share for delivery then to the price at which they let us buy one.
          The pink line is what a Palm share cost that day.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Using November options struck at $55, selling the call, buying the put and borrowing the strike's present value raised $39.12, 29% below
        the share price, and buying a share through the options cost $42.62. We get both numbers from Lamont and Thaler's quotes to the cent.
        If parity had held at the share price, we could have bought a share through the options for $42.62 and sold a real one short for
        $55.25. The $12.63 difference is what the options said it would cost to borrow a Palm share until November. The gap grows with time, from 14% for May to 21% for August and 29% for November, like a fee that runs by the month.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A loan made of options</h3>
      <p>
        Since a call minus a put is a forward, two of them at different strikes make something with no risk at all. A call minus a put at $90,
        less a call minus a put at $110, pays $20 whatever happens:
      </p>
      <div class="math-display">{@html boxEq}</div>
      <p>
        This is a <span class="bold">box spread</span>, and in both of our models it costs $19.22, the present value of $20 at 4%. Buying a box
        lends money and selling one borrows it, so box prices tell us the interest rate the options market is using.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">American options</h3>
      <p>
        Everything so far was about European options. Most options on single US shares are American, which can be used at any time before expiry, while options on the S&P 500 index itself are European. An American put can be worth using early, since getting the strike now earns interest. So for American options on a share
        that pays no dividends, parity becomes a band:
      </p>
      <div class="math-display">{@html amEq}</div>
      <p>
        At our $100 strike, the call minus the put can be anywhere from $0 to $3.92. Where it sits in that band depends on how much the right to use the put early is worth, and that does depend on a model.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our options were cleaner than real ones, and that left a few things out.</p>
      <p>
        First, real options have a bid and an ask, so parity holds between two ranges rather than at one price. That's why Palm's options gave
        a range for each expiry, and a gap has to be wider than the spread before anyone can trade on it.
      </p>
      <p>
        Second, parity needs the dividends and borrowing fees until expiry, and for real shares those aren't known in advance. Traders usually
        turn parity around and back them out of the options, as we did for Palm.
      </p>
      <p>
        And finally, parity says what must be true if the trade can be done. When shares can't be borrowed, as with Palm, or the trade ties up
        capital that's needed elsewhere, prices can sit outside parity for a long time, and nothing forces them back until the shares can be
        borrowed again.
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
