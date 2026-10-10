<script>
  /* App.svelte for value-at-risk */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import BondsLab from "./Components/BondsLab.svelte";
  import PairFigure from "./Components/PairFigure.svelte";
  import katexify from "./katexify.js";

  let n = $state(1);
  let alpha = $state(0.95);
  const varEq = katexify("\\text{VaR}_\\alpha = \\text{the smallest loss } \\ell \\text{ with } P(L \\le \\ell) \\ge \\alpha", true);
  const esEq = katexify("\\text{ES}_\\alpha = \\frac{1}{1 - \\alpha} \\int_\\alpha^1 \\text{VaR}_u \\, du", true);
  const subEq = katexify("\\rho(A + B) \\le \\rho(A) + \\rho(B)", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we run the risk desk at a bank, and the board wants a single number that says how much we could lose next year. The
        standard answer since the 1990s is <span class="bold">value at risk</span>, or VaR. At a level of 95%, it's the loss that we'll exceed
        in only one year in twenty:
      </p>
      <div class="math-display">{@html varEq}</div>
      <p>
        J.P. Morgan made it popular with its RiskMetrics system in 1994, and two years later the Basel Committee built bank capital rules
        for market risk on it. It's easy to explain, and it's one number. Before we look at how it works, here's a question about two bonds.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <p>
        That's a strange result. We spread our money over two bonds instead of one, which is what we're usually told to do, and our measure of risk went up from nothing to $30. Let's see where it comes from.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A height and an area</h3>
      <p>
        Let's line up every possible year from the best to the worst, and plot the loss at each level {@html katexify("u")}, the share of
        years that do better. This is the <span class="bold">quantile function</span>, and value at risk is simply its height at
        {@html katexify("\\alpha")}.
      </p>
      <p>
        The other number in this article, <span class="bold">expected shortfall</span> or ES, is the average loss in the worst
        {@html katexify("1 - \\alpha")} of years. That's the average height of the same curve to the right of {@html katexify("\\alpha")}, or
        the area under it divided by the width:
      </p>
      <div class="math-display">{@html esEq}</div>
      <p>
        In our lab, we split $100 equally over a number of bonds. Each bond defaults with a 4% chance, independently, and loses 60% of the
        money in it when it does.
      </p>
    </section>

    <Figure id="fig-bonds" title="Splitting $100 over more bonds" sub="Drag the slider to change the number of bonds, and switch the level.">
      {#snippet children(w)}
        <BondsLab width={w} bind:n bind:alpha />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          In the top panel the pink dot is the value at risk, a height. The shading is the area under the curve beyond the level, and the
          dashed rectangle has the same area, so its height is the expected shortfall. The bottom panel shows both numbers for every number
          of bonds.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With one bond, the curve is flat at zero until 96% and then jumps to the $60 we'd lose in a default. The level 95% falls on the flat
        part, so the value at risk is zero. The expected shortfall sees the jump beyond it: the worst 5% of years contain the 4% with a
        default, and their average loss is $48.
      </p>
      <p>
        If you drag the slider to 2 bonds, the chance of at least one default rises to 7.84%, so a default now reaches the level and the
        value at risk jumps to $30. As you keep adding bonds, the value at risk wanders up and down, from $12 at 5 bonds back up to $12 at 10,
        and down to $4.20 at 100. It never gets back to zero, though. With many bonds the loss settles at its average of $2.40, which is
        more than the single bond's zero.
      </p>
      <p>
        The expected shortfall falls the whole way, from $48 with one bond to $5.12 with 100. It agrees with what we learned about
        diversification, and the value at risk doesn't. So by the reckoning of a 95% VaR, the safest way to hold $100 of these bonds is to put it all in one of them.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Why VaR can be fooled</h3>
      <p>
        Value at risk reads one point of our curve and ignores everything beyond it. If all of a position's losses live in the last 4% of years, its 95% value at risk is zero however big they are. When we put two such positions together, we can push a loss across the line.
      </p>
      <p>
        In 1999 Philippe Artzner, Freddy Delbaen, Jean-Marc Eber and David Heath wrote down four properties a sensible risk measure
        {@html katexify("\\rho")} should have, and called a measure with all four <span class="bold">coherent</span>. The one that VaR breaks
        is <span class="bold">subadditivity</span>, which says that holding two positions together can't be riskier than the two apart:
      </p>
      <div class="math-display">{@html subEq}</div>
    </section>

    <Figure id="fig-pair" title="Apart and together" sub="Switch between the two pairs, and drag the correlation for the normal one.">
      {#snippet children(w)}
        <PairFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The grey bars measure the two positions separately and add them up. The coloured bars measure them held together, so
          subadditivity says a coloured bar should never stand above the grey one beside it.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If we hold $100 in each of two bonds, each value at risk is zero, and together it's $60. The expected shortfall goes the right way: $48 for
        each bond, $96 for the two added up, and $61.92 for the two held together. Carlo Acerbi and Dirk Tasche showed in 2002 that expected
        shortfall is subadditive for every loss distribution, because the average of the worst years of a sum can't be worse than the sum of
        the averages of the worst years of each part.
      </p>
      <p>
        If you switch to two normal losses, VaR behaves as well. A normal value at risk is a fixed multiple of the standard deviation, 1.64 at
        95%, and the standard deviation of a sum is never more than the sum of the standard deviations. You'll see the coloured bars reach the
        grey ones only at a correlation of 1. So our trouble with VaR comes from lumpy or lopsided losses like defaults, sold options and fat tails, which are exactly the losses a risk desk like ours worries about most.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the regulators did</h3>
      <p>
        In 2016 the Basel Committee's new rules for market risk, the Fundamental Review of the Trading Book, replaced the 99% value at risk
        with a 97.5% expected shortfall. The two levels were chosen to match for normal losses: the 97.5% expected shortfall is 2.34 standard
        deviations, and the 99% value at risk is 2.33. So if our book is well behaved, our capital barely changes, while a book with lumpy or fat-tailed losses now pays for what lies beyond the line.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Expected shortfall fixes one of our problems, and it brings some of its own.</p>
      <p>
        First, it needs the tail. Value at risk needs one quantile, and expected shortfall needs the average of everything beyond it, which
        is where we have the fewest data. The article on fat tails shows how unsettled the far tail of US returns is.
      </p>
      <p>
        Second, it's harder to check. We can test a value at risk by counting the years that exceed it. Tilmann Gneiting showed in 2011 that expected shortfall can't be scored on its own in the same way, although later work showed it can be scored together with the value at risk.
      </p>
      <p>
        Third, our bonds default independently. Real defaults come together in recessions, so diversification helps less, and with many bonds the value at risk settles at the loss of a bad year for the economy rather than at the average. That correlated case is the model behind the Basel rules for
        credit risk.
      </p>
      <p>
        And finally, a single number is still a single number. Two books with the same expected shortfall can have very different worst years, so it's worth looking at our whole curve too.
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
