<script>
  /* App.svelte for merton-model */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import SolveLab from "./Components/SolveLab.svelte";
  import FallFigure from "./Components/FallFigure.svelte";
  import WhoseFigure from "./Components/WhoseFigure.svelte";
  import PathsFigure from "./Components/PathsFigure.svelte";
  import katexify from "./katexify.js";

  const callEq = katexify("E = V \\, N(d_1) - F e^{-rT} N(d_2)", true);
  const volEq = katexify("\\sigma_E = N(d_1) \\, \\frac{V}{E} \\, \\sigma_V", true);
  const ddEq = katexify("d_2 = \\frac{\\ln(V/F) + (r - \\sigma_V^2/2)\\,T}{\\sigma_V \\sqrt{T}}, \\qquad \\text{chance of default} = N(-d_2)", true);
  const shiftEq = katexify("N^{-1}(\\text{market's chance}) = N^{-1}(\\text{real chance}) + \\lambda \\sqrt{T}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say a firm owes its lenders $70, due in a year. Everything it owns is worth more than that today, though nobody outside the firm
        can say exactly how much. If the firm's assets are worth more than $70 when the debt is due, the lenders get paid and the shareholders
        keep the rest. If they're worth less, the shareholders walk away and the lenders take what's there.
      </p>
      <p>
        So the shares are a <span class="bold">call option</span> on the firm's assets: the right, but not the duty, to buy them for $70 in a
        year. Robert Merton wrote this down in 1974, and the article on capital structure used it to price a loan. This time we'll run it the
        other way. We can't see what a firm's assets are worth, but we can see what its shares are worth and how much they move. It turns out
        those two numbers are enough to tell us how far the firm is from default, and how likely the market thinks it is to get there.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Two clues</h3>
      <p>
        Our firm's shares are worth $30 in total, and they move about 60% a year. The safe rate is 3%. If the assets are worth
        {@html katexify("V")} and move by {@html katexify("\\sigma_V")} a year, Fischer Black and Myron Scholes's formula for a call gives the
        value of the shares:
      </p>
      <div class="math-display">{@html callEq}</div>
      <p>
        Here {@html katexify("F")} is the $70 we owe, {@html katexify("T")} is the year until it's due, and {@html katexify("d_1")} and
        {@html katexify("d_2")} depend on the assets and their volatility. We know {@html katexify("E")}, but we don't know
        {@html katexify("V")} or {@html katexify("\\sigma_V")}, so this one equation leaves a whole curve of possible firms. Here's a question
        before we find the right one.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <p>
        The second clue is how much the shares move. A share is a claim on whatever is left after the debt, so it moves more than the assets
        do:
      </p>
      <div class="math-display">{@html volEq}</div>
      <p>
        That's a second curve of possible firms, and the firm we're looking at is the one that sits on both. You can move both clues in the
        chart below.
      </p>
    </section>

    <Figure id="fig-solve" title="Two clues, one firm" sub="Drag what the shares are worth and how much they move.">
      {#snippet children(w)}
        <SolveLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue curve is every firm whose shares would be worth what we see, and the pink curve is every firm whose shares would move as much
          as we see. The circle is where they cross.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With the sliders where they start, the curves cross at assets worth $97.78 that move 18.81% a year. Notice that the blue curve is
        nearly flat. Shares this far from default are worth almost exactly the assets minus what the debt is worth today, so the share price
        pins down the assets. The pink curve is steep, so the shares' volatility pins down the assets' volatility. If you drag the volatility
        up, the circle slides to the right along an almost flat line: much the same assets, but riskier ones. Now try dragging what the shares are worth down while keeping their volatility where it is. The circle drops, and our firm's assets end up closer to its debt, which is where the next section picks up.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Why the shares move more</h3>
      <p>
        Our shares move 3.19 times as much as the assets. Most of that is leverage, which we met in the article on capital structure. Our shareholders own $30 of claims on $97.78 of assets, so
        a 1% move in the assets is about a 3.3% move in the shares. The factor {@html katexify("N(d_1)")}, 0.98 here, trims it a little,
        because very close to the debt the shares stop gaining or losing the whole move.
      </p>
      <p>
        That multiple isn't fixed, though, as we're about to see. It grows as the firm gets closer to default, because the same dollar off the assets is a bigger
        share of what's left for the shareholders. Let's keep the assets exactly as risky as the solver found them and only change what
        they're worth.
      </p>
    </section>

    <Figure id="fig-fall" title="When the assets fall" sub="Drag the change in what the firm's assets are worth.">
      {#snippet children(w)}
        <FallFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          For each value of the assets, the first chart shows how much the shares move, and the second shows the market's chance of default on
          a log scale. The grey ring is where our firm starts.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you drag the assets down 10%, the shares lose 31%, and how much they move rises from 60% to 75% a year. Meanwhile the chance of default
        triples, from 3.27% to 9.99%. A 20% fall takes the shares down 60% and their volatility to 97%. So a falling share price comes with
        a rising share volatility, even though the assets are exactly as risky as before. Fischer Black pointed this out in 1976, and it's
        called the <span class="bold">leverage effect</span>. It's one of the reasons offered for why the stock market gets more volatile
        after it falls.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Distance to default</h3>
      <p>
        The number in the formula that matters most is {@html katexify("d_2")}. It counts how many standard deviations of a year's moves our assets would have to fall before they're worth less than the debt. Moody's KMV, which sells default probabilities built on this model, calls a version of it the <span class="bold">distance to default</span>:
      </p>
      <div class="math-display">{@html ddEq}</div>
      <p>
        Our firm is 1.84 standard deviations from default, so the formula gives a 3.27% chance that its assets end the year below $70.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Whose chance of default?</h3>
      <p>
        There's a catch, and it's in the formula. It grows the assets at the safe rate, 3%, rather than at the rate investors expect them to
        earn. That's how option prices work. Black and Scholes price the shares as if every asset earned the safe rate, because a hedged
        position does, and the probabilities they use along the way are <span class="bold">risk-neutral probabilities</span>. They're the
        probabilities that make prices come out right, with bad outcomes weighted up because they tend to arrive in bad times. They aren't the
        chances of things happening.
      </p>
      <p>
        Investors expect our firm's assets to earn more than 3%, so the real chance of default is lower. How much lower depends on the
        assets' <span class="bold">Sharpe ratio</span> {@html katexify("\\lambda")}, their expected return above the safe rate divided by
        their volatility:
      </p>
      <div class="math-display">{@html shiftEq}</div>
      <p>
        In words, the market's chance and the real chance sit a fixed distance apart on the normal curve, {@html katexify("\\lambda \\sqrt{T}")}
        standard deviations. We can even estimate {@html katexify("\\lambda")} from the shares, because in Merton's model the shares and the
        assets have the same Sharpe ratio from moment to moment. Leverage multiplies the expected extra return and the volatility by the same
        factor, so their ratio doesn't change.
      </p>
      <p>
        A typical firm's Sharpe ratio is its correlation with the market times the market's own, something like 0.5 × 0.4 = 0.2. At that, our
        firm's real chance of default is 2.06%, and the 3.27% that the shares imply is 1.59 times as large.
      </p>
    </section>

    <Figure id="fig-whose" title="The market's chance against the real one" sub="Drag the Sharpe ratio.">
      {#snippet children(w)}
        <WhoseFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each curve shows how many times the real chance of default the market's chance is, for a loan due in a year and for one due in ten
          years. The dots are our firm and a safer one.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Since the two chances are a fixed distance apart on the normal curve, the ratio between them is largest far out in the tail. Our
        safer firm, with shares worth $40 that move 45% and debt of $60, has a market's chance of 0.29% and a real chance of 0.16%, so its
        ratio is 1.88 rather than 1.59. And the distance grows with the square root of time, so for a ten-year loan with our firm's real chance of default, the ratio would be 3.86. If you drag the Sharpe ratio to zero, both curves fall flat onto 1, since investors who don't mind risk expect every
        asset to earn the safe rate.
      </p>
      <p>
        So our share price does imply a chance of default, but it's the one investors price, not the one they expect. That's the right number
        for valuing the firm's debt, and it overstates how often firms like ours really default. The next article is about what happens when
        we compare the yields on corporate bonds with the defaults that really happen.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Default before the debt is due</h3>
      <p>
        Merton's firm can only default on the day its debt is due. If its assets fall below $70 in March and recover by December, nothing
        happens. Fischer Black and John Cox suggested in 1976 that a firm should default the first time its assets touch a line instead, which
        is closer to how loan covenants and bankruptcy work.
      </p>
    </section>

    <Figure id="fig-paths" title="A year of our firm's assets" sub="Switch the rule for what counts as a default.">
      {#snippet children(w)}
        <PathsFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each line is a possible year for the assets, growing at the rate investors expect. Lines that default under the chosen rule are
          pink.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With a Sharpe ratio of 0.2, 2.06% of years end with the assets below the debt, but 4.60% touch it at some point, more than twice as
        many. For assets with no drift it would be exactly twice. That's the mirror argument we used for margin calls in the article on short selling: every path that touches the line and ends above it has a mirror image that ends below. Our assets drift upwards, so more of the
        paths that touch the line climb back, and the ratio is a little more than two. If you switch the rule in the chart, you'll see the 4 pink lines become 9, close to what the formulas give for 200 years.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our firm was simple on purpose, and that left a few things out.</p>
      <p>
        First, our firm owes one loan, due on one day. Real firms owe money on many dates. Moody's KMV puts the line at about the short-term
        debt plus half the long-term debt, a rule it found by looking at when firms actually defaulted.
      </p>
      <p>
        Second, Merton's lenders get back 93 cents on the dollar when our firm defaults, since its assets are worth just under the debt at
        that point and nothing is lost in bankruptcy. Holders of senior unsecured bonds have historically recovered about 45 cents. That's
        one reason Merton's lenders would charge our firm only 0.23 points over the safe rate.
      </p>
      <p>
        Third, we used the normal curve, which is too thin in its tails. Moody's KMV doesn't turn its distance to default into a probability with the normal
        curve at all. It looks up how often firms at that distance defaulted in its own history.
      </p>
      <p>
        And finally, our inputs are noisy. The shares' volatility has to be estimated from past prices, and the assets' volatility moves in
        proportion with it. Sreedhar Bharath and Tyler Shumway found in 2008 that a rough version of the distance to default forecasts defaults slightly better than the full model. It has the same form but doesn't solve for the assets at all, and they found that other information adds to both.
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
