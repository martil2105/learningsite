<script>
  /* App.svelte for etf-premiums */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import ArbFigure from "./Components/ArbFigure.svelte";
  import SellOffLab from "./Components/SellOffLab.svelte";
  import GapRegression from "./Components/GapRegression.svelte";
  import katexify from "./katexify.js";

  let pLab = $state(0.2);
  let pReg = $state(0.2);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we own shares in an <span class="bold">exchange-traded fund</span>, or ETF, a fund that holds a basket of securities and
        whose own shares trade on a stock exchange all day. Ours holds a few hundred corporate bonds and tracks a bond index, much like the
        stock indices in the <a href="../index-construction/">index construction</a> article. Once a day the fund publishes its
        <span class="bold">net asset value</span>, or NAV, the value of its bonds per share of the fund. When the ETF's price is above its
        NAV we say it trades at a <span class="bold">premium</span>, and below it at a <span class="bold">discount</span>.
      </p>
      <p>
        Most days the two are close. But on 12 March 2020, in the middle of the Covid sell-off, LQD, iShares' big investment-grade corporate
        bond ETF, closed at a 5.0% discount to its NAV. Was the ETF broken that day, or was something
        else going on? To answer that, let's first see what keeps an ETF's price close to its bonds in the first place.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How the price stays close</h3>
      <p>
        A few big trading firms, called <span class="bold">authorised participants</span> or APs, have a special deal with our fund. An AP can
        hand the fund a basket of the bonds it holds and get new ETF shares back, which is called a <span class="bold">creation</span>. Or it
        can hand ETF shares back and get the bonds, which is a <span class="bold">redemption</span>. The swap is made in kind, bonds for
        shares, so our fund never has to buy or sell a bond in the market to meet it.
      </p>
      <p>
        Now suppose buyers push our ETF's price above what its bonds are worth. An AP can buy the bonds, create new shares and sell them at the
        higher price, and that extra selling pushes the price back down. If the price falls below what the bonds are worth, it runs the other
        way. The AP pays something to trade the bonds each time, so it only acts when the gap is bigger than its cost. Let's call that cost
        {@html katexify("c")}, there and back.
      </p>
    </section>

    <Figure id="fig-arb" title="When an AP steps in" sub="Drag the price, then the AP's cost.">
      {#snippet children(w)}
        <ArbFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The pink line is what a creation earns and the blue line what a redemption earns, per $100, at each gap between the ETF's price and
          what its bonds are worth. In the grey band both lose money, so nobody acts.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you drag the price to 0.8% above the bonds with a cost of 0.3%, you'll see the AP create shares and make 50 cents on every $100.
        Its selling then pushes the price back to the edge of the band. Inside the band nothing happens. So arbitrage keeps our price within
        {@html katexify("c")} of what the bonds are worth. But notice what the band is drawn around. It's what the bonds are
        <span class="bold">worth</span> today, and that isn't quite the same thing as the NAV.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A NAV built from last trades</h3>
      <p>
        To work out our NAV, the fund needs a price for every bond, and many bonds don't trade every day. Let's say a share
        {@html katexify("p")} of our bonds trade on any given day, and the rest keep the price they last traded at. With many bonds, the NAV
        then closes a share {@html katexify("p")} of its gap to what the bonds are really worth, {@html katexify("V_t")}, every day:
      </p>
      <div class="math-display">{@html katexify("\\text{NAV}_t = \\text{NAV}_{t-1} + p\\,\\big(V_t - \\text{NAV}_{t-1}\\big)", true)}</div>
      <p>
        On average the prices in it are {@html katexify("(1-p)/p")} days old, which is four days if a fifth of the bonds trade each day. On a
        quiet day that hardly matters, because the bonds haven't moved much in four days. In a sell-off it matters a lot, and the lab below
        runs one.
      </p>
    </section>

    <Figure id="fig-selloff" title="A sell-off in the bonds" sub="Drag the size of the fall, then the share of bonds that trade each day.">
      {#snippet children(w)}
        <SellOffLab width={w} bind:p={pLab} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The ETF's price follows the bonds down, and the NAV follows more slowly. The bars below are the premium the fund reports, and the
          grey band is where arbitrage would keep it if the NAV were up to date.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's start with a fall of 10% over five days, with a fifth of the bonds trading each day. Our ETF's price falls with the bonds, since
        APs keep it there, but our NAV lags, and by the fifth day the fund reports a discount of 5.6%. That's far outside the band, and yet no
        AP can make money from it. Buying the ETF and redeeming it would get us bonds worth what we paid, not what the NAV says. The discount
        belongs to the NAV, not to the price.
      </p>
      <p>
        Once the fall stops, our NAV closes a fifth of what's left of its gap every day, and five days later the discount is down to 1.9%. If
        you drag the share of bonds that trade up to 100%, the discount disappears, because the NAV is never out of date. And a bigger fall
        makes a deeper discount, roughly in proportion. LQD, for its part, closed at a discount of 0.19% the next day.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Who closes the gap?</h3>
      <p>
        The sell-off showed us one gap, and on an ordinary day there are two. Writing {@html katexify("P")} for the ETF's price, the premium
        the fund reports splits exactly into two parts, in logs:
      </p>
      <div class="math-display">{@html katexify("\\ln\\frac{P}{\\text{NAV}} \\;=\\; \\underbrace{\\ln\\frac{P}{V}}_{\\text{the price's gap}} \\;+\\; \\underbrace{\\ln\\frac{V}{\\text{NAV}}}_{\\text{the NAV's gap}}", true)}</div>
      <p>
        The first part is the price's own gap from what the bonds are worth. Buying and selling push it around, arbitrage keeps
        it inside the band, and it's the price that closes it. The second part is how far the NAV has fallen behind, and the NAV closes it by catching up, at a rate of
        {@html katexify("p")} a day. We can't see {@html katexify("V")}, but we can see who moves. Let's simulate a thousand ordinary days of
        our fund, with the bonds moving 1% a day and a little buying and selling pressure on the ETF, and ask what today's premium says about
        tomorrow.
      </p>
    </section>

    <Figure id="fig-gap" title="Who moves after a premium" sub="Drag the share of bonds that trade each day.">
      {#snippet children(w)}
        <GapRegression width={w} bind:p={pReg} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each dot is one simulated day. The black lines are the best straight-line fits, and their slopes say how much of today's premium
          each side makes up tomorrow.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With a fifth of our bonds trading each day, the NAV's slope is 0.19. So after a discount of 5%, the NAV tends to fall about 1% the next
        day, closing a fifth of the gap, just as the recursion says. The price's slope is close to zero, which means today's discount says
        almost nothing about where the price goes tomorrow. So most of our premium here is the NAV's gap, and the NAV is the one that moves.
      </p>
      <p>
        If you drag the share of bonds that trade up, you'll see the NAV's slope follow it, and the price's slope turn more negative. Our premium is smaller then, and more of what's left is the price's own gap, which arbitrage and fading pressure close from the price
        side. That's a test we can run on real funds without ever seeing {@html katexify("V")}: if the NAV does the moving, the discount was
        the NAV's.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our fund is a simple one, and it differs from a real one in four ways.</p>
      <p>
        First, real NAVs don't use only last trades. Bond funds use prices from pricing services, which estimate what a bond would sell for
        and are often slow to move too. Our share of bonds that trade each day is a stand-in for how quickly those estimates catch up.
      </p>
      <p>
        Second, our AP's cost is fixed, and in a real sell-off it isn't. Bonds get harder to trade, the band widens, and some APs step back,
        so part of a real discount can be the price's gap as well. BlackRock's own work for the SEC gives one example from March 2020 where the NAV's gap was most of it. On
        the 24th, its big high-yield bond ETF, HYG, closed at a 2.4% premium to its NAV, while its premium over a running estimate of what its
        bonds were worth averaged about 0.4% during the day.
      </p>
      <p>
        Third, the same thing happens with no bonds at all. An ETF of Japanese stocks trading in New York has a NAV from Tokyo's close, which is
        hours old during the New York day, so its premium carries the NAV's gap every day.
      </p>
      <p>
        And finally, trading in kind has consequences we haven't looked at, including for tax, where a US fund can hand out its bonds or stocks
        instead of selling them.
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
