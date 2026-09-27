<script>
  /* App.svelte for bodie-1995 */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import PaperCard from "./Components/PaperCard.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import PutLab from "./Components/PutLab.svelte";
  import PriceGap from "./Components/PriceGap.svelte";
  import katexify from "./katexify.js";

  let T = $state(1);
  let sigma = $state(0.2);
  let premium = $state(0.06);
  let gapPremium = $state(0.06);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <PaperCard>
    {#snippet cite()}
      Bodie, Z. (1995), "On the risk of stocks in the long run", <em>Financial Analysts Journal</em>, 51(3), 18–22.
    {/snippet}
    {#snippet claims()}
      If stocks became less risky the longer we held them, insuring them against ending behind a safe bond would cost less for longer horizons.
      Option pricing says the cost rises with the horizon, so a long horizon doesn't make stocks safer.
    {/snippet}
    {#snippet rebuild()}
      The price of that insurance at every horizon, the real chance that it pays out, and why the price never uses the premium stocks are
      expected to earn.
    {/snippet}
    {#snippet later()}
      Critics called the argument circular, because option prices leave out expected returns by design, and the debate moved on to what we
      should mean by risk.
    {/snippet}
  </PaperCard>

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's pick up where the <a href="../time-diversification/">time diversification</a> article left off. We're young, we're saving for the
        long run, and we're told stocks get safer the longer we hold them. Suppose a bank offers us a guarantee to go with our stock fund. After
        a set number of years, if our stocks are worth less than a safe bond bought with the same money would be, the bank pays us the
        difference. We can never end up behind the bond.
      </p>
      <p>
        What should that guarantee cost? If stocks really do get safer with time, a thirty-year guarantee ought to be cheap, since the bank will
        rarely have to pay. Bodie's short paper asks exactly this question, and gets the opposite answer. Before we look, have a guess.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">The guarantee is a put option</h3>
      <p>
        The guarantee pays us the gap between the bond's value and our stocks' value, whenever that gap is positive. That's a
        <span class="bold">put option</span> on our stocks, the right to sell them at a fixed price, with the fixed price set at what the bond
        would be worth. Options like this have a standard price, from the model Black, Scholes and Merton worked out in 1973. With the fixed
        price set at the bond's value, most of the formula cancels, and the cost as a share of the money we insure is
      </p>
      <div class="math-display">{@html katexify("\\text{cost} = 2N\\!\\left(\\frac{\\sigma\\sqrt{T}}{2}\\right) - 1", true)}</div>
      <p>
        Here {@html katexify("N")} is the standard normal distribution, {@html katexify("\\sigma")} is the stocks' volatility and
        {@html katexify("T")} is the number of years. The lab below draws that cost against the horizon, and under it the chance that our stocks
        really do end behind the bond, from the same model we used in the time diversification article. It opens at one year. Drag the horizon out
        to thirty and watch both panels.
      </p>
    </section>

    <Figure id="fig-put" title="The cost of the guarantee, and the chance we'll need it" sub="Drag the horizon, then try the premium slider.">
      {#snippet children(w)}
        <PutLab width={w} bind:T bind:sigma bind:premium />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue curve is what the guarantee costs and the pink curve is how often it pays out. Notice which of the two moves when you change the
          premium.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At one year, with 20% volatility, the guarantee costs about 8.0% of the money we insure. At ten years it costs 24.8%, and at thirty years
        41.6%, about five times as much as one year. By around 45 years it would cost half of everything we put in. Meanwhile the chance that the
        bank has to pay falls from 42% to 14%. So the guarantee gets much more expensive at exactly the horizons where it's less likely to be
        needed.
      </p>
      <p>
        If you switch the volatility, you'll see the cost move a lot. At 15%, thirty years of insurance costs about 31.9%, and at 25% it's about
        50.6%. Now try the premium slider. The pink curve jumps around, because a bigger premium makes stocks much less likely to end behind. The
        blue curve doesn't move at all.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Only volatility and time</h3>
      <p>
        The formula has only one input, {@html katexify("\\sigma\\sqrt{T}")}, the volatility scaled up to the whole horizon. That has a neat
        consequence: any two guarantees with the same {@html katexify("\\sigma\\sqrt{T}")} cost the same. Thirty years at 20% volatility costs
        exactly as much as 7½ years at 40%. The bond's interest rate isn't there either, because we measured everything relative to the bond.
      </p>
      <p>
        The missing premium is the surprising part, and it's the heart of how options are priced. A bank selling this guarantee doesn't have to
        sit and hope. It can hedge by holding a changing mix of our stocks and the bond, selling more stocks as they fall. What that hedge costs
        depends on how much stocks move, not on which way they're expected to go. Later articles in this section work through that hedge
        properly. For now, the lesson is that the guarantee's price comes from volatility and time alone.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Why the price rises while the odds fall</h3>
      <p>
        So the price rises with the horizon while the chance of a payout falls. How can both be true? It helps to compare the price with the
        payout we'd actually expect from the guarantee, averaging over outcomes with the real-world odds. The chart below draws both, as shares of
        the money insured.
      </p>
    </section>

    <Figure id="fig-gap" title="What the guarantee costs, and what we'd expect it to pay" sub="Change the premium stocks are expected to earn.">
      {#snippet children(w)}
        <PriceGap width={w} {T} bind:premium={gapPremium} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue line is the price and the pink line is the average payout. The shaded gap between them is what we pay beyond the average payout.
          Try a zero premium.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With the usual 6% premium, the expected payout starts at about 5.5% of our money for one year, rises to a peak of about 7.8% around seven
        years, and then falls to about 5.1% at thirty. That's the same hump we saw in the time diversification article, because it is the same
        quantity: the average shortfall over all outcomes. The price, meanwhile, keeps climbing. At one year it's about 1.5 times the expected
        payout, and at thirty years it's about 8.2 times.
      </p>
      <p>
        If you set the premium to zero, the pink line lands on the blue one. The price of the guarantee is its average payout in a world where
        stocks earn no premium at all. In our world they do earn one, so the guarantee pays out less, on average, than its price assumes, and the gap is
        what we pay for being paid in bad times. A dollar that arrives after a thirty-year stretch in which stocks fell far behind bonds is worth
        more to us than a dollar on an ordinary day. And as the time diversification article showed, those shortfalls get deeper the longer the
        horizon.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What came later</h3>
      <p>
        Bodie's note set off a debate in the same journal. The sharpest reply came from Dempsey, Hudson, Littler and Keasey in 1996. Their point
        was that option prices never use the expected return, by construction, so the put can't tell us whether stocks are riskier over long
        horizons. It tells us what it costs to hedge them. Our premium slider shows the point they were making: we can make stocks as attractive
        as we like, and the price of the guarantee won't notice.
      </p>
      <p>
        Both sides were right about something. The price is a fact about the market: if we want a guarantee that we'll never end behind the bond,
        that's what it costs, and it's roughly what a pension fund promising such a floor would have to set aside. Whether that cost measures risk is a question
        about what we mean by the word, and the three measures we've now seen give three different answers. The chance of ending behind falls
        with the horizon, the average shortfall rises and then falls, and the price of removing the shortfall rises. Pástor and Stambaugh later
        came at the question from yet another direction, by asking what happens once we admit we don't know the premium.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our rebuild leans on the same assumptions as Bodie's, and each of them matters at long horizons.</p>
      <p>
        First, we priced with constant volatility and returns that are independent from year to year. If stock returns tend to reverse over long
        periods, the volatility that matters for a thirty-year guarantee is lower than the yearly figure suggests, and the guarantee would be cheaper.
      </p>
      <p>
        Second, almost nobody sells a thirty-year put on the stock market. Our price is what hedging would cost if the bank could trade freely and
        cheaply for thirty years, which is a model's answer rather than a quote.
      </p>
      <p>
        And finally, the guarantee covers every shortfall, however small. A guarantee that only paid out below, say, 80% of the bond's value would
        cost much less, so the price tells us about full protection, not about how much protection we might reasonably want.
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
