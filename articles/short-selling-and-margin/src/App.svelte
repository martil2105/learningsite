<script>
  /* App.svelte for short-selling-and-margin */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import AccountLab from "./Components/AccountLab.svelte";
  import PathsLab from "./Components/PathsLab.svelte";
  import katexify from "./katexify.js";

  let side = $state("long");
  let sigma = $state(0.3);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we like a stock at $100 a share and want more of it than we can pay for. We can buy on <span class="bold">margin</span>,
        which means borrowing part of the price from our broker, with the shares as security for the loan. Or, if we think the stock will fall,
        we can <span class="bold">sell it short</span>: borrow shares from someone who owns them, sell them today, and buy them back later to
        return. Either way we're trading with borrowed money or borrowed shares, and the broker has a rule to make sure it gets them back.
      </p>
      <p>
        The <a href="../cost-of-leverage/">cost of leverage</a> article priced the loan. This one is about the rule that comes with it, and
        it starts with a question about when the rule kicks in.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">How a margin account works</h3>
      <p>
        In the United States the rule comes as two numbers. The <span class="bold">initial margin</span> is the share of the price we must pay
        with our own money when we open the position, and it's 50% under the Federal Reserve's Regulation T. The
        <span class="bold">maintenance margin</span> is the share of the shares' value that our own money in the account must stay above
        afterwards. FINRA's Rule 4210 sets it at 25% for a long position at least, and many brokers ask for more.
      </p>
      <p>
        Our own money in the account is our <span class="bold">equity</span>, what we'd walk away with if we closed the position today. Let's
        buy 100 shares at $100, paying $5,000 ourselves and borrowing $5,000. If the price moves to {@html katexify("P")}, the shares are worth
        {@html katexify("100P")}, we still owe $5,000, and the broker calls when
      </p>
      <div class="math-display">{@html katexify("\\underbrace{100P - 5{,}000}_{\\text{our equity}} \\;<\\; 25\\% \\times 100P \\quad\\Longleftrightarrow\\quad P < \\$66.67", true)}</div>
      <p>
        With an initial margin {@html katexify("m")} and a maintenance margin {@html katexify("k")}, the same steps give the fall that brings
        the call:
      </p>
      <div class="math-display">{@html katexify("\\text{fall to the call} = \\frac{m - k}{1 - k}", true)}</div>
      <p>
        That's a third with our numbers. Our equity and the broker's requirement are both straight lines in the price, so the call comes where
        they cross, and the lab below draws them.
      </p>
    </section>

    <Figure id="fig-account" title="One margin account" sub="Drag the price, then switch to a short.">
      {#snippet children(w)}
        <AccountLab width={w} bind:side />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The green line is our equity at each price and the dashed pink line is the least the broker will accept. Where the green line is
          below the pink one, in the shaded part, the account gets a margin call.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's drag the price down from $100. Our equity falls by $100 for every dollar off the share price, while the requirement falls by only
        $25, so the green line catches the pink one at $66.67. By then we've lost two thirds of our $5,000. And our
        <span class="bold">leverage</span>, the shares' value divided by our equity, has doubled from 2 to 4.
      </p>
      <p>
        That's the part the words "2 to 1" hide. Leverage in a margin account isn't a setting. It rises as the trade goes against us, and the
        call comes when it reaches one over the maintenance margin:
      </p>
      <div class="math-display">{@html katexify("\\text{leverage at the call} = \\frac{\\text{shares}}{\\text{equity}} = \\frac{1}{k}", true)}</div>
      <p>
        So a 25% rule lets us get to 4 to 1 before anyone calls. A fund that resets its leverage every day, like the ones in the
        <a href="../volatility-drag/">volatility drag</a> article, is the opposite design: it sells after a fall so its leverage never drifts.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Meeting the call</h3>
      <p>
        Say the price opens at $60, having dropped past the call overnight. Our equity is $1,000, and the broker wants 25% of $6,000, which is
        $1,500, so we're $500 short. We can put in $500 of cash. Or we can sell shares, but that's much more expensive than it sounds. Every
        dollar of shares we sell repays a dollar of loan, so our equity doesn't change, and the requirement falls by only 25 cents. To cover
        a gap of $500 we'd have to sell
      </p>
      <div class="math-display">{@html katexify("\\text{shares to sell} = \\frac{\\text{shortfall}}{k} = \\frac{\\$500}{0.25} = \\$2{,}000", true)}</div>
      <p>
        which is four times the shortfall. If you set the price to $60 in the lab, you'll see both numbers in the last two boxes. When many
        accounts meet their calls by selling at once, that multiple is part of why the selling can push prices down further.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Selling short</h3>
      <p>
        A short works the other way round. We borrow 100 shares through our broker and sell them for $10,000, and the cash stays in the
        account. Regulation T also asks us to put in half the value again, $5,000, so the account holds $15,000 and we owe 100 shares. We pay a
        fee to borrow them, and any dividends go to the lender. FINRA's maintenance margin for a short is 30% of the shares' value, and our
        equity is the cash less what the shares we owe are worth. So the broker calls when
      </p>
      <div class="math-display">{@html katexify("\\underbrace{15{,}000 - 100P}_{\\text{our equity}} \\;<\\; 30\\% \\times 100P \\quad\\Longleftrightarrow\\quad P > \\$115.38", true)}</div>
      <p>which in general is a rise of</p>
      <div class="math-display">{@html katexify("\\text{rise to the call} = \\frac{m - k}{1 + k}", true)}</div>
      <p>
        If you switch the lab to a short, you'll see the lines cross at $115.38. The price only has to rise 15.4% for the call, and we've lost
        30.8% of our deposit when it comes. We'd be wiped out at $150, a rise of 50%, which mirrors the long's fall of 50%. So the two
        positions can lose the same amount, and the difference is all in when the broker steps in.
      </p>
      <p>
        Why so much sooner? A short's position grows as it goes wrong, since the shares we owe get more valuable, and the requirement grows
        with them. A long's position shrinks as it goes wrong, and its requirement shrinks too. That's the {@html katexify("1 + k")} in place
        of {@html katexify("1 - k")}. Even with the same 25% rule for both, you'll find the short is called after a rise of 20%, against the
        long's fall of a third. And since a price has no ceiling, a short has no ceiling on what it can lose, although the call usually stops
        us long before.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How often does it happen?</h3>
      <p>
        A rise of 15% and a fall of 33% sound like different sizes of move, and in the way prices actually move they're further apart still.
        Prices move in percentages, so the distance that matters is the log of the move. It's 0.41 down to $66.67 and only 0.14 up to
        $115.38, almost three times closer. For a price that's as likely to end the year up as down, with volatility
        {@html katexify("\\sigma")}, the chance of touching a level a log distance {@html katexify("b")} away within {@html katexify("T")} years
        is
      </p>
      <div class="math-display">{@html katexify("P(\\text{call within } T) = 2\\,\\Phi\\!\\left(-\\frac{b}{\\sigma\\sqrt{T}}\\right)", true)}</div>
      <p>
        where {@html katexify("\\Phi")} is the standard normal distribution function. That comes from the reflection principle, since every
        path that touches the level has a mirror image that ends beyond it. The lab below draws 40 possible years for one stock.
      </p>
    </section>

    <Figure id="fig-paths" title="Forty possible years" sub="Drag the volatility.">
      {#snippet children(w)}
        <PathsLab width={w} bind:sigma />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each grey line is one possible year of daily prices, on a log scale. A dot marks the first day a path reaches the short's call (pink)
          or the long's (blue), and the small chart gives the chance of each within a year.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At 30% volatility, a long bought on 50% margin is called within the year with a chance of 17.7%, and a short with a chance of 63.3%,
        more than three times as often. In our 40 years, 7 call the long and 25 call the short. If you drag the volatility down to 20%, the gap
        gets wider, 4.3% against 47.4%, which is eleven times. A calmer stock makes the long's call rare, but not the short's, because the
        short's call is so close.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our account is a simple one, and it leaves out five things.</p>
      <p>
        First, the rules we used are the US minimums. Brokers set their own higher requirements for many stocks and can raise them at short
        notice, and other countries' rules differ.
      </p>
      <p>
        Second, we've left out the interest on the loan and the fee for borrowing shares. Both drain our equity a little every day, so they
        bring the call closer the longer we hold.
      </p>
      <p>
        Third, the formula for the chance of a call watches the price all the time, while our paths are daily and many brokers check at
        the close. A price can also jump past the call overnight, which is how an account ends up well short of the
        requirement before anyone can act.
      </p>
      <p>
        Fourth, a short has risks a long doesn't. The lender can ask for the shares back, and a stock that's hard to borrow can become
        expensive or impossible to keep short, sometimes just as the price is rising.
      </p>
      <p>
        And finally, our stock has no drift in its log price. A stock we expect to rise makes the long's call rarer and the short's more
        likely, which only widens the gap we found.
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
