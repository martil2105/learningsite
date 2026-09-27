<script>
  /* App.svelte for dividend-discount-model */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import StreamLab from "./Components/StreamLab.svelte";
  import GapCurve from "./Components/GapCurve.svelte";
  import TwoStage from "./Components/TwoStage.svelte";
  import katexify from "./katexify.js";

  let r = $state(0.08);
  let g = $state(0.05);
  let gap = $state(0.03);

  const priceEq = katexify("P = \\sum_{t=1}^{\\infty} \\frac{D_1 (1+g)^{t-1}}{(1+r)^t} = \\frac{D_1}{r - g}", true);
  const tailEq = katexify("\\left(\\frac{1+g}{1+r}\\right)^{T}", true);
  const durEq = katexify("-\\frac{1}{P}\\frac{dP}{dr} = \\frac{1}{r - g}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're thinking about buying a share in a company that will pay
        us a dividend of $1 next year. What should we pay for it? The cleanest
        answer in finance is that a share is worth the money it will pay us,
        adjusted for when that money arrives. For a share, that money is the
        dividend: a payment next year, another the year after, and so on for as
        long as the company exists. A dollar we'll get in ten years is worth less
        than a dollar today, so we <span class="bold">discount</span> each payment
        back to the present and add them up. That's the
        <span class="bold">dividend discount model</span>, which John Burr
        Williams set out in 1938.
      </p>
      <p>
        We'll use its simplest version, where dividends grow at a constant rate for
        ever. It's too simple to value a real company on its own, but it shows us
        three things that carry over to the fancier models built on it. The price
        depends on the discount rate and the growth rate only through their
        difference. Most of the value comes from dividends decades away. And
        because of that, a share behaves like a very long bond: small changes in
        the discount rate move its price a lot, and not symmetrically.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Pricing a growing stream</h3>
      <p>
        Say the company pays a dividend of {@html katexify("D_1")} next year, and
        that dividends grow at a rate {@html katexify("g")} a year after that. We
        discount at a rate {@html katexify("r")}, the return we want for holding a
        share with this much risk. The dividend in year {@html katexify("t")} is
        {@html katexify("D_1 (1+g)^{t-1}")}, and today it's worth that divided by
        {@html katexify("(1+r)^t")}. Adding up every year gives us a geometric
        series, and as long as {@html katexify("r > g")} it has a short sum:
      </p>
      <div class="math-display">{@html priceEq}</div>
      <p>
        This is the <span class="bold">Gordon growth model</span>, after Myron
        Gordon. With a $1 dividend next year, a discount rate of 8% and growth of
        5%, we'd pay $1 / 0.03, or $33.33, for the share. Notice what we don't
        need: {@html katexify("r")} and {@html katexify("g")} never appear on their
        own, only their gap. A discount rate of 10% with growth of 7% gives the
        same $33.33, and so does 5% with 2%.
      </p>
      <p>
        We can also turn the formula around. Dividing both sides by
        {@html katexify("P")} gives {@html katexify("D_1 / P = r - g")}, so the
        dividend yield is the gap. A share yielding 3% is one where the market's
        discount rate sits three points above the growth it expects. And if we
        believe a growth forecast, the price tells us the return the market is
        asking for: {@html katexify("r = D_1/P + g")}.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Where does the value come from?</h3>
      <p>
        The lab below draws the stream, and you can drag both rates. Each bar is
        one year's dividend in today's money, and the dashed pink line is the
        dividend itself, growing until it leaves the chart. The line in the lower
        panel is our running total as a share of the price, and the dark bars are the years
        that make up the first half of the value.
      </p>
    </section>

    <Figure id="fig-stream" title="A share as a stream of dividends" sub="Drag the discount rate and the growth rate.">
      {#snippet children(w)}
        <StreamLab width={w} bind:r bind:g />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Watch where the running total crosses half the price, and notice
          that the stream carries on past the edge of the chart.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At 8% and 5%, each year's payment is worth 1.05 / 1.08 of the year before,
        about 97%. So the bars shrink slowly, and the tail matters a great deal.
        Three quarters of the price, 75.4%, comes from dividends paid after year
        10, and half of it comes from after year 24.6. The share of the value
        arriving after year {@html katexify("T")} is
      </p>
      <div class="math-display">{@html tailEq}</div>
      <p>
        so when we move {@html katexify("g")} closer to {@html katexify("r")}, the
        half-way year runs away from us. If you try growth of 6.5% with the same 8%
        discount rate, you'll see the price double to about $67, and half of it
        now comes after about year 50. Here the gap isn't quite the whole story.
        A discount rate of 10% with growth of 7% gives the same price as 8% and 5%. The half-way year moves, though, from 24.6 to 25.1, because the timing depends on the ratio of the growth factors rather than on the gap alone.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A share is a long bond</h3>
      <p>
        Value that arrives late leaves us exposed to the discount rate. Bond
        traders measure that exposure with <span class="bold">duration</span>,
        the percentage fall in price for a small rise in the rate. For a growing
        stream it comes out as simply
      </p>
      <div class="math-display">{@html durEq}</div>
      <p>
        which is the gap again, turned upside down. At a 3% gap the duration is 33
        years, which puts our share in the same league as a 30-year government
        bond that pays no coupon. The weighted-average wait for the dividends,
        the other thing people mean by duration, is {@html katexify("(1+r)/(r-g)")},
        or 36 years. So the gap has three jobs at once: it's the dividend yield,
        the inverse of the price and the inverse of the duration. Dechow, Sloan and
        Soliman proposed in 2004 that we measure real stocks' durations the same
        way, from forecast cash flows.
      </p>
      <p>
        Duration is a straight-line guess, though, and the real curve bends. In the
        chart below we plot the price against the gap. At a 3% gap, duration
        predicts that a one-point rise in the discount rate cuts the price by a
        third. The curve says a quarter: the price goes from $33.33 to $25. A
        one-point fall doesn't add a third either. It adds half, taking the price
        to $50. This bend is called <span class="bold">convexity</span>, and here
        it's large because the curve is a hyperbola.
      </p>
    </section>

    <Figure id="fig-gap" title="Price against the gap" sub="Drag the gap between the discount rate and growth.">
      {#snippet children(w)}
        <GapCurve width={w} bind:gap />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dark dashed line is the straight-line guess that duration makes.
          Compare it with the pink dot, a one-point rise in the discount rate,
          and the green dot, a one-point fall.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you slide the gap, you'll see the sensitivity change with it. A share
        with a 6% gap, one with a high yield and modest growth, loses about 14%
        when the discount rate rises a point. A share with a 2% gap, with a low
        yield and high expected growth, loses a third. That's one reason growth
        stocks, whose value sits even further in the future, tend to fall hardest
        when interest rates rise.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What we don't know</h3>
      <p>
        The same sensitivity makes the model hard to use, because we don't know
        {@html katexify("r")} or {@html katexify("g")} to anything like a point.
        If we're unsure whether the gap is 2% or 4%, the price is somewhere
        between $25 and $50 per dollar of dividend, a factor of two. No amount of
        care over next year's dividend fixes that, which is why analysts argue
        about growth and discount rates far more than about the cash flows they
        can actually see.
      </p>
      <p>
        Real valuations deal with this by forecasting the next few years one by
        one, where a company's plans give us something to go on, and then
        assuming a steady growth rate after that. The lump that covers everything
        after the forecast is called the <span class="bold">terminal value</span>,
        and it's just our formula applied from the end of the forecast onward.
        In the lab below, our company grows fast for a while and then settles at
        4% a year, and we discount at 8%.
      </p>
    </section>

    <Figure id="fig-twostage" title="Forecast years and everything after" sub="Drag the early growth rate and how long it lasts.">
      {#snippet children(w)}
        <TwoStage width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Blue bars are the years we'd forecast one by one, and pink bars are
          the ones the terminal value covers. The strip underneath splits the
          price between the two.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With 12% growth for ten years and 4% after that, the forecast years we'd
        work so hard on make up a quarter of the price, and the terminal value is
        75% of it. If you stretch the forecast to 20 years, the terminal value
        still carries 64%. So the detailed forecast mostly decides where the
        terminal value starts from, and the terminal growth rate and the discount
        rate decide what it's worth.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our model is the simplest one there is, and three of its simplifications matter.</p>
      <p>
        First, it counts only dividends. Many companies return cash through
        buybacks as well, and some pay no dividend at all. We can still use the
        model if we count every payment to shareholders, or if we value the cash
        the business generates instead, but then we can't read the price off a
        single yield.
      </p>
      <p>
        Second, growth can't stay above the discount rate for ever, and the
        formula breaks when it does. A company growing faster than that today has
        to slow down in our forecast at some point, which is what the two-stage
        version does.
      </p>
      <p>
        And finally, the discount rate isn't constant in reality. Campbell and Shiller built the tool for studying this in 1988. The work that followed, summed up by Cochrane in 2011, found that most of the movement in
        the market's dividend yield comes from changing discount rates rather than
        changing dividend forecasts. That's the sensitivity we've just seen,
        working through the market as a whole.
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
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
