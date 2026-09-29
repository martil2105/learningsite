<script>
  /* App.svelte for dividends-and-buybacks */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import PayoutLab from "./Components/PayoutLab.svelte";
  import AccretionMap from "./Components/AccretionMap.svelte";
  import katexify from "./katexify.js";
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we run a firm with more cash than it needs. For each of our shares, the firm owns a business worth $80 that earns $6 a year,
        and $20 of cash that earns 3% a year after tax. So a share is worth $100 and earns $6.60, which is its
        <span class="bold">earnings per share</span>, or EPS. Its <span class="bold">P/E</span>, the price divided by the earnings per share,
        is 15.2.
      </p>
      <p>
        We've decided to hand $10 a share back to our shareholders. We can pay it as a <span class="bold">dividend</span>, cash to every
        shareholder, or spend it on a <span class="bold">buyback</span>, buying some of our own shares from whoever wants to sell. Before we
        work through the two, have a guess.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Two ways to hand back $10</h3>
      <p>
        Let's start with the dividend. Once it's paid, the firm has $10 less cash per share, so each share is worth $90, and each shareholder
        has a $90 share and $10 of cash. That's $100, as before.
      </p>
      <p>
        Now the buyback. We spend the same money buying shares at $100, which is what they're worth, so we buy back one share in ten. The
        shareholders who sell get $100 for a share worth $100. The firm is now worth $900 for every $1,000 it was worth before, and it has
        nine shares for every ten, so each share that stays is still worth $100. Again everyone has $100 for each share they held. Merton
        Miller and Franco Modigliani made this argument in 1961: before tax, and at a fair price, how a firm pays out doesn't change what its
        shareholders have.
      </p>
    </section>

    <Figure id="fig-payout" title="The same $10, paid two ways" sub="Drag the size of the payout, then the price the buyback pays.">
      {#snippet children(w)}
        <PayoutLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The first chart is what each kind of shareholder gains or loses, for each share they held, against what it was worth before the
          payout. The second is earnings per share before the payout and after each way of making it.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At a fair price the first chart is empty, since nobody gains or loses anything. The second chart isn't. Earnings per share fall to $6.30
        after the dividend, because the firm has less cash earning interest. After the buyback they rise to $7.00, because the same earnings,
        less that interest, are shared among fewer shares. So the two ways of paying out are 11% apart on EPS and level on wealth. If you drag the payout up, you'll see the
        gap in EPS widen while the first chart stays empty.
      </p>
      <p>
        The P/E moves too, from 15.2 to 14.3, and you'll see it's the same 14.3 after either one. A buyback is often said to make a share
        look cheaper, but a dividend of the same size does exactly the same. What lowered the P/E was paying out cash that earned only 3%,
        which is worth 33 times what it earns, and keeping the business, which is worth 13.3 times what it earns.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Paying the wrong price</h3>
      <p>
        The buyback only matched the dividend because we paid what the shares were worth. If you drag the price to 10% above that, you'll see the first chart come to life. We now pay
        $110 for shares worth $100, so we buy back slightly fewer of them, and the sellers gain $10 on each. The money comes from the
        shareholders who stay: each share that stays is now worth $99. If a share is worth {@html katexify("V")} and we buy back a share
        {@html katexify("q")} of the shares at a price {@html katexify("P_b")}, each share that stays is worth
      </p>
      <div class="math-display">{@html katexify("V - \\frac{q}{1-q}\\,\\big(P_b - V\\big)", true)}</div>
      <p>
        so a buyback is a dividend plus a trade between the shareholders who sell and the ones who stay, at the gap between the price and
        the value. It runs the other way too. If our managers know the shares are cheap and buy at $90, each share that stays gains $1.25, and
        the sellers are the ones who lose.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">When does a buyback raise earnings per share?</h3>
      <p>
        Back to a fair price. The buyback raised EPS because the cash we spent was earning less than the shares we bought. If the firm earns
        {@html katexify("E")} a share at a price {@html katexify("P")}, and the cash it spends would have earned {@html katexify("r")} after
        tax, a little algebra gives
      </p>
      <div class="math-display">{@html katexify("\\text{EPS after} > \\text{EPS before} \\quad\\Longleftrightarrow\\quad \\frac{E}{P} > r \\quad\\Longleftrightarrow\\quad \\text{P/E} < \\frac{1}{r}", true)}</div>
      <p>
        where {@html katexify("E/P")} is the <span class="bold">earnings yield</span>. Ours is 6.6% and the cash earns 3%, so the buyback raises
        EPS. If we paid for the buyback with a loan instead, {@html katexify("r")} would be the interest rate after tax, and the same rule
        applies. The map below draws it.
      </p>
    </section>

    <Figure id="fig-map" title="Where a buyback raises EPS" sub="Drag what the cash earns, then what the business earns.">
      {#snippet children(w)}
        <AccretionMap width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The curve is where the earnings yield equals the yield on the cash. Below it a buyback raises earnings per share, and above it the
          buyback lowers them. The dot is our firm.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you drag the cash's yield up, you'll see our dot rise towards the curve and cross it at 7.5%, which is what the business itself
        earns on its value. From there a buyback lowers EPS. So whether a buyback raises earnings per share is mostly a statement about
        interest rates. When rates are low, almost every buyback raises EPS, whether or not it's a good use of the money.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Why doesn't the price rise with EPS?</h3>
      <p>
        If each share earns 6.1% more after the buyback and is still worth $100, something has to give, and it's risk. The $20 of cash was
        steadying the share. With half of it gone, more of each share is the business and less is cash, so the share moves more with the
        market. If the business has a beta of 1 and cash a beta of 0, the share's <span class="bold">beta</span>, how much it moves with the
        market, rises from 0.80 to 0.89.
      </p>
      <p>
        With the return a share needs rising with its risk, from 6.6% to 7.0%, we can price the share before and after, since the business
        doesn't grow:
      </p>
      <div class="math-display">{@html katexify("P = \\frac{\\text{EPS}}{\\text{return needed}} = \\frac{\\$6.60}{6.6\\%} = \\frac{\\$7.00}{7.0\\%} = \\$100", true)}</div>
      <p>
        Earnings per share and the return we need both rise by 6.1%, and they cancel. It's the same point Modigliani and Miller made about
        borrowing: earnings that come with more risk aren't worth more, because investors ask more of them. If our business grew, we'd price
        it as in the <a href="../dividend-discount-model/">dividend discount model</a> article, and the two would still cancel.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our firm lives in Modigliani and Miller's world, and four things from the real one are missing.</p>
      <p>
        First, tax. Before tax the dividend and the buyback are the same. After tax the buyback usually wins, because a dividend is taxed on
        the whole payout for every shareholder, while a buyback is taxed only on the gain, and only for the shareholders who choose to sell.
      </p>
      <p>
        Second, we knew what a share was worth. Real managers may know more than the market, which is why a buyback at the wrong price
        matters, and why the market often reads a buyback as a sign that managers think the shares are cheap.
      </p>
      <p>
        Third, our business earns the same $6 for ever, whatever we do with the cash. If paying it out changed what the firm invests in, the
        payout could change the firm's value, and that's a question about the investment, not the payout.
      </p>
      <p>
        And finally, people. Managers paid on earnings per share have a reason to prefer a buyback that raises EPS, even when it adds nothing
        to what the shares are worth.
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
