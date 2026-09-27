<script>
  /* App.svelte for order-book */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Figure from "./Components/Figure.svelte";
  import BookChart from "./Components/BookChart.svelte";
  import WalkLab from "./Components/WalkLab.svelte";
  import GrowthChart from "./Components/GrowthChart.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";

  let shape = $state("flat");
  let q = $state(5000);
  let gq = $state(10000);

  const shareEq = katexify("\\frac{\\text{average} - \\text{best}}{\\text{last} - \\text{best}} = \\frac{a+1}{a+2}", true);
  const reachEq = katexify("x^{*} = \\left(\\frac{(a+1)\\,Q}{k}\\right)^{1/(a+1)}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we want to buy 5,000 shares, and the price on our screen says
        $100.00. That number is a convenience. Behind it sits the
        <span class="bold">order book</span>, the list of every order that
        traders have left with the exchange and that hasn't traded yet, with
        buyers on one side and sellers on the other. The number we see is usually
        the midpoint between the best buyer and the best seller, and it's a price
        nobody can actually trade at.
      </p>
      <p>
        We'll build a small book of our own, send orders into it, and see what
        they pay. Two things come out of it. The average price we pay sits a fixed
        share of the way from the best quote to the worst price we reach, and the
        shape of the book sets that share. The shape also decides how our cost
        grows as the order gets bigger. When the book is flat, the cost grows in
        proportion to size. When the book gets thicker the further we go from
        the best quote, it grows with the square root of size.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Two kinds of order</h3>
      <p>
        There are two ways we can ask for a trade. A <span class="bold">limit
        order</span> names a price: buy up to 500 shares, paying $99.97 or less.
        If nobody's selling that cheaply, our order joins the book and waits. A
        <span class="bold">market order</span> names only a size: buy 500 shares
        now, at whatever price it takes. It trades straight away against the
        orders that are already waiting, starting with the best one.
      </p>
      <p>
        The chart below is a book at a quiet moment. Each bar is a price level,
        and its height is the number of shares waiting there. Buyers' orders, the
        <span class="bold">bids</span>, are on one side and sellers' orders, the
        <span class="bold">asks</span>, are on the other. The best bid is $99.99
        and the best ask is $100.01, so the <span class="bold">spread</span>, the
        gap between them, is two cents, and the midpoint is $100.00.
      </p>
    </section>

    <Figure id="fig-book" title="A quiet order book">
      {#snippet children(w)}
        <BookChart width={w} shape="flat" annotate={true} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Blue bars are buyers waiting and pink bars are sellers waiting, the
          same number of shares at every price here. Notice that nothing waits at
          the midpoint itself.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        That gap in the middle is the whole point. If we want to buy right now, we
        pay the best ask, a cent above the midpoint. If we want to sell right now,
        we get the best bid, a cent below it. That cent is what we pay for being
        in a hurry. The traders whose limit orders sit in the book earn it, in
        return for waiting and for the risk that the price moves away before
        anyone trades with them.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Walking the book</h3>
      <p>
        A cent a share is what a small order pays. A big one pays more, because it
        runs out of shares at the best price and has to keep going. Let's send
        our market buy for 5,000 shares into the book above. The first 500 fill at
        $100.01 and the next 500 at $100.02, and we keep climbing until the tenth
        level, at $100.10, finishes the order. Traders call this
        <span class="bold">walking the book</span>.
      </p>
      <p>
        Our average price is $100.055, which is half way between the best ask and
        the last price we hit. That's no coincidence. Every level holds the same
        number of shares, so the prices we pay are spread evenly between the first
        and the last, and their average lands in the middle. If you try any size
        that uses up whole levels in the lab below, such as 1,500 or 8,000 shares,
        you'll see a flat book put us half way every time.
      </p>
    </section>

    <Figure id="fig-walk" title="A market buy walking the book" sub="Drag the order size, and switch the shape of the book.">
      {#snippet children(w)}
        <WalkLab width={w} bind:shape bind:q />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dark part of each pink bar is what our order takes. The solid line
          is the average price we pay and the dashed line is the last price we
          hit.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Real books are rarely flat, so switch the lab to the second shape and
        you'll see what changes.
        Here the book gets thicker as we move away from the best price: 100
        shares at the best ask, 200 a cent further out, 300 after that. Now 5,500
        shares clear ten levels and we hit the same last price of $100.10, but our
        average is $100.07, two thirds of the way. More of our order fills at the
        far levels, because that's where more of the shares are, and that pulls
        the average outward.
      </p>
      <p>
        The third shape grows faster still, with the square of the distance. If you
        pick it, you'll see our average move to about three quarters of the way. We can say this in
        general. If the number of shares waiting a distance {@html katexify("x")}
        from the best price grows like {@html katexify("x^a")}, the average fill
        sits this share of the way to the last price:
      </p>
      <div class="math-display">{@html shareEq}</div>
      <p>
        That's a half for the flat book, where {@html katexify("a = 0")}, two
        thirds for the linear one and three quarters for the square one. The
        formula is for a book whose depth changes smoothly. Our book has prices in
        whole cents, so the flat and linear books hit it on the nose whenever the
        order uses up whole levels, and the square book gets closer to it from
        above as orders grow. When an order stops part way through a level, the
        lab's readout moves away from the rule. The last price counts in full, but
        we only bought a few shares there.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How does the cost grow with size?</h3>
      <p>
        The share tells us where the average sits. How far we walk in the first
        place depends on the shape too. In the flat book each extra level holds
        another 500 shares, so if we double the order we walk twice as far. In the
        linear book, the number of shares within {@html katexify("x")} levels of
        the best price grows like {@html katexify("x^2")}, because each level holds
        more than the one before. To take twice as many shares we only have to go
        about 1.41 times as far, and to take four times as many we go twice as
        far. In general, an order for {@html katexify("Q")} shares reaches
      </p>
      <div class="math-display">{@html reachEq}</div>
      <p>
        levels, where {@html katexify("k")} measures how thick the book is. The
        exponent {@html katexify("1/(a+1)")} is the whole story: it's 1 for the
        flat book, a half for the linear one and a third for the square one. On
        log scales we get straight lines with those slopes, and if you drag the
        order size in the chart below, you can watch the three markers spread
        apart.
      </p>
    </section>

    <Figure id="fig-growth" title="How far an order walks" sub="Drag the order size to move the markers along the three lines.">
      {#snippet children(w)}
        <GrowthChart width={w} bind:q={gq} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Both axes are logarithmic. The lines are the smooth rule for each shape,
          and the faint dots are orders that use up whole levels of the book in
          the lab.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If we put the two pieces together, we have the cost of a market order. Per
        share, it's half the spread plus the average distance we walk. The first
        part is fixed. The second grows in proportion to size in a flat book, and
        with the square root of size in the linear one. We pay that cost on every
        share, so if we double an order in a flat book, it costs us roughly four
        times as much to execute.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The round trip</h3>
      <p>
        One way to feel the size of these costs is to buy and immediately sell
        back. Nothing about the company has changed, yet we lose money. In the
        flat book, buying 5,000 shares and selling them straight back costs us 11
        cents a share: two cents of spread and nine cents of walking, split between
        the buy and the sell. That's $550 gone on half a million dollars of stock.
        The last readout in the lab shows the round trip for any size and shape,
        and you can think of it as what the market charges for turning cash into
        stock and back again in a hurry.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Why the square root matters</h3>
      <p>
        The linear book isn't just a middle option. Across many markets, the price
        move caused by a large order grows roughly with the square root of its
        size, so buying four times as much moves the price about twice as far.
        This <span class="bold">square-root law</span> has been measured on
        stocks, futures and options. It holds for large orders that are split up
        and executed over hours or days, not only for single market orders.
      </p>
      <p>
        That leaves us with a puzzle. The book we can see at any moment is far too
        thin for a day's worth of buying, and it refills between the slices. The
        explanation that Tóth and colleagues proposed in 2011 moves our picture
        from the visible book to a <em>latent</em> one, made of the orders traders
        would place if the price came to them. Suppose that latent book thins out
        in a V towards the current price, with depth growing linearly with
        distance. Then walking it gives square-root impact, for the same reason our
        linear book does, and we can think of the lab's second shape as a still
        frame of that argument.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our book is simple on purpose, and four of its simplifications matter.</p>
      <p>
        First, it's frozen while the order walks it, and real books aren't. After
        a large order, new limit orders arrive and the book refills, which is why
        traders split big orders into small ones and spread them over time.
      </p>
      <p>
        Second, other traders see the order and react. Some pull their sell orders
        until the buying is done, which makes the book thinner just when we need
        it.
      </p>
      <p>
        Third, many exchanges allow hidden orders that don't show in the book at
        all, so the depth we see understates what's there, and exchange fees and
        rebates shift the true cost by a fraction of a cent.
      </p>
      <p>
        And finally, the average book we see on a screen isn't flat either.
        Studies of stock order books find that depth tends to peak a few ticks
        away from the best price rather than at it.
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
