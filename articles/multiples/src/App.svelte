<script>
  /* App.svelte for multiples */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import GrowthLab from "./Components/GrowthLab.svelte";
  import FadeChart from "./Components/FadeChart.svelte";
  import StoryMap from "./Components/StoryMap.svelte";
  import katexify from "./katexify.js";

  const growthEq = katexify("g = b \\times \\text{ROE}", true);
  const priceEq = katexify("P = \\frac{(1-b)\\,E_1}{r-g} = \\frac{E_1\\,(1 - g/\\text{ROE})}{r-g}", true);
  const peEq = katexify("\\frac{P}{E_1} = \\frac{1 - g/\\text{ROE}}{r - g}", true);
  const pvgoEq = katexify("\\text{PVGO} = \\frac{E_1}{r} \\times \\frac{g}{r-g} \\times \\left(1 - \\frac{r}{\\text{ROE}}\\right)", true);
  const pbEq = katexify("\\frac{P}{B} - 1 = \\frac{\\text{ROE} - r}{r - g}", true);
  const rEq = katexify("r = \\frac{E_1}{P} + g\\left(1 - \\frac{B}{P}\\right)", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Here are two shares we might buy. One trades at 25 times next year's earnings and the other at 12.5. The usual reading is that
        investors expect the first company to grow much faster, and that's why they're paying twice as much for each dollar it earns.
      </p>
      <p>
        That ratio is the <span class="bold">P/E</span>, the price of a share divided by its earnings. We'll use next year's earnings
        throughout, which makes it what's called a forward P/E. It's the most quoted of the <span class="bold">valuation multiples</span>,
        ratios of a price to a single number from a company's accounts, and analysts use them to compare companies quickly. In this article
        we'll take one company apart to see what its P/E is made of. The answer turns on a number the usual reading leaves out: the return the
        company earns on the money it reinvests.
      </p>
      <p>Before we start, here's a pair of firms to try the usual reading on.</p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">What does growth cost?</h3>
      <p>
        Let's start with Firm A, which pays out all of its $1 of earnings every year. Its shareholders want 8% a year, so its share is worth
        $1 divided by 0.08, which is $12.50, and its P/E is 12.5.
      </p>
      <p>
        Firm B can't grow for free. To earn more next year, it has to put more money to work this year, and it gets that money by keeping back
        part of its earnings instead of paying them out. The return a firm earns on the money its shareholders have put in is called its
        <span class="bold">return on equity</span>, or ROE. If it keeps back a share {@html katexify("b")} of its earnings and earns its ROE on
        them, then its book value, its earnings and its dividends all grow at
      </p>
      <div class="math-display">{@html growthEq}</div>
      <p>
        Firm B keeps back half and earns 8%, so it grows 4% a year. But it pays out only 50 cents next year, not $1. In the
        <a href="../dividend-discount-model/">dividend discount model</a>, a share is worth next year's dividend divided by the gap between the
        return we need and the growth, so with {@html katexify("r")} for the return we need and {@html katexify("E_1")} for next year's
        earnings,
      </p>
      <div class="math-display">{@html priceEq}</div>
      <p>
        For Firm B that's 50 cents divided by 0.04, which is $12.50 again. Its dividends start at half of Firm A's and then grow, and at a
        return on equity of 8% the two streams are worth the same. Dividing by earnings gives us the P/E,
      </p>
      <div class="math-display">{@html peEq}</div>
      <p>
        and if we set the return on equity equal to {@html katexify("r")}, the top becomes {@html katexify("(r-g)/r")}. The growth cancels, and
        the P/E is {@html katexify("1/r")} whatever {@html katexify("g")} is.
      </p>
      <p>
        You'll often see this written as the payout ratio over {@html katexify("r-g")}, and it's tempting to raise the growth in that formula
        while keeping the payout fixed. But since growth is the plowback times the ROE, that quietly raises the return on equity too. At a payout
        of a half, 4% growth needs an ROE of 8%, and 6% growth needs 12%.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Growth on a chart</h3>
      <p>
        Let's put the formula on a chart. The lab below draws the P/E against growth for a firm whose shareholders need 8%, and it starts
        with a firm that earns 12% on its equity and grows 6% a year.
      </p>
    </section>

    <Figure id="fig-growth" title="P/E against growth" sub="Drag the return on equity, then the growth a year.">
      {#snippet children(w)}
        <GrowthLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Every curve starts from the same P/E when there's no growth. The dashed line is a return on equity equal to what shareholders need,
          and the grey curves are other returns on equity.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With a return on equity of 12% and growth of 6%, our share trades at 25 times earnings, twice Firm A's multiple. If you drag the return
        on equity down to 8%, you'll see the curve fall onto the dashed line. Now the P/E is 12.5 at every growth rate, and dragging the growth
        just slides the dot along a flat line. Below 8% the curve turns down. At a return on equity of 6%, growing 3% a year takes the P/E from
        12.5 to 10, because each dollar we keep back is worth less than a dollar once it's reinvested.
      </p>
      <p>
        So the usual reading is right for firms that earn more than their shareholders need, and only for them. Growth works as a multiplier.
        What it multiplies is the margin between the return on equity and {@html katexify("r")}, and when that margin is zero, growth adds
        nothing at all.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How much of the price is growth?</h3>
      <p>
        We can split any price into two parts. The first is what the share would be worth if the firm paid out everything and never grew,
        which is {@html katexify("E_1/r")}, or $12.50 for our firm. The second is what's left over, called the
        <span class="bold">present value of growth opportunities</span>, or PVGO. With a little algebra, it comes out as
      </p>
      <div class="math-display">{@html pvgoEq}</div>
      <p>
        For any growth above zero, the first two terms are positive, so PVGO has the same sign as ROE − r. At 12% and 6% growth is worth $12.50, half our price.
        At 6% and 3% it's worth −$2.50, so growing makes the share worth less than not growing at all.
      </p>
      <p>
        The same margin shows up in another multiple, the <span class="bold">price-to-book ratio</span> or P/B, which is the price divided by
        the book value per share, {@html katexify("B")}. Since {@html katexify("E_1 = \\text{ROE} \\times B")}, the same algebra gives
      </p>
      <div class="math-display">{@html pbEq}</div>
      <p>
        so a share trades above its book value exactly when the firm earns more than its shareholders need, at any growth rate. Firm B, growing
        4% at a return on equity of 8%, trades at its book value. That gives us a way to read the two multiples together: the P/B tells us
        whether the firm earns more than it costs, and the P/E tells us how much the market makes of that margin.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How long does the margin have to last?</h3>
      <p>
        Our formula lets a 12% return on equity last for ever. Real firms rarely keep a margin like that for long, since competitors move in, so
        it's worth asking how much of the P/E depends on how long it lasts. Let's say our firm reinvests at its high return on equity for a
        number of years, and after that, new money earns only {@html katexify("r")}, so new investment adds nothing.
      </p>
    </section>

    <Figure id="fig-fade" title="P/E against how long the margin lasts" sub="Switch between the two firms, then drag the number of years.">
      {#snippet children(w)}
        <FadeChart width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dashed line is the P/E with a margin that never ends, and the dotted line is the P/E with no margin at all. The pink marker shows
          when the firm has earned half the value of its growth.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Ten years at 12% gives a P/E of 14.6, and thirty years gives 17.9. To earn its 25, our firm has to keep its margin for ever, and half
        the value of its growth comes from money it reinvests after year 37. That's the same slow tail we met in the dividend discount model,
        where each year counts {@html katexify("(1+g)/(1+r)")} as much as the year before it.
      </p>
      <p>
        The second firm reaches the same P/E of 25 another way, with a return on equity of 20% and growth of 5%. If you switch to it, you'll
        see its curve rise faster: ten years give it 15.6, and it has earned half the value of its growth by about year 25. A wider margin
        with slower growth puts more of the value close at hand. That's one reason investors who worry about competition tend to care more
        about the return on equity than about growth.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What can't a P/E tell us?</h3>
      <p>
        So far we've gone from the firm to its multiple. In practice we usually go the other way: we see a price and ask what it says about
        the firm. A P/E and a P/B together pin down the return on equity, since dividing the P/B by the P/E gives {@html katexify("E_1/B")}. But
        they don't pin down the return shareholders need. If we rearrange the price formula, we get
      </p>
      <div class="math-display">{@html rEq}</div>
      <p>so every growth rate comes with a required return of its own.</p>
    </section>

    <Figure id="fig-story" title="One P/E, a line of stories" sub="Drag the growth along the line, then try the presets.">
      {#snippet children(w)}
        <StoryMap width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The line holds every pair of growth and required return that fits the P/E and the price-to-book ratio on the sliders.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        A share at 20 times earnings and three times book earns 15% on its equity. That fits a safe firm that needs 5% and never grows, a firm
        that needs 7% and grows 3%, and a riskier one that needs 9% and grows 6%. Nothing in the two multiples picks one story out of the line,
        and that's the sense in which a high P/E can't tell low risk from high growth.
      </p>
      <p>
        There's one place where the line lies flat. If you choose the preset at book, you'll see that a share at its book value has a required
        return equal to its earnings yield, 8% here, whatever it grows. Below book the line slopes down, so faster growth goes with a lower
        required return. That's because each extra point of growth now costs the shareholders money, and only a lower required return can make
        up for it at the same price.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our firm is about as simple as a firm can be, and four things from real ones are missing.</p>
      <p>
        First, accounting. The return on equity in our formulas is the return on the money shareholders have actually put in. When we read a
        company's accounts, though, its book value leaves a lot out, such as brands and research that were expensed rather than added to the
        balance sheet. So a reported ROE can sit far from the economic one, and a P/B far from 1 for reasons that have nothing to do with the
        margin.
      </p>
      <p>
        Second, earnings move. If we build a P/E on a bad year's earnings it looks high, and on a good year's it looks low, even if the price
        hasn't moved at all. That's why some analysts average earnings over several years before they divide.
      </p>
      <p>
        Third, comparisons. When we value a company at the P/E of its peers, we're assuming it shares their required return, their growth and
        their return on equity, all three at once. If a peer earns 20% on its equity and our company earns 8%, borrowing the peer's multiple borrows its
        margin too.
      </p>
      <p>
        And finally, nothing in our firm ever changes. Its return on equity, its payout and its required return stay the same every year. Real
        margins fade, as we saw, and real firms change how much they reinvest. Richer models, such as the residual income model, allow for
        both, and they still turn on the gap between the return on equity and {@html katexify("r")}.
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
