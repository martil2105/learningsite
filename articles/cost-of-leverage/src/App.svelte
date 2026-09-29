<script>
  /* App.svelte for cost-of-leverage */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import KinkLab from "./Components/KinkLab.svelte";
  import LifeLab from "./Components/LifeLab.svelte";
  import CostLab from "./Components/CostLab.svelte";
  import katexify from "./katexify.js";

  // the spread is shared by all three figures, and the risk aversion by the first and the last
  let sp = $state(2);
  let g = $state(1);
  let gl = $state(2);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say the <a href="../lifecycle-leverage/">last article</a> has persuaded us to borrow while we're young. We go to the lender and find
        that the loan costs more than the safe rate we earn on our savings. The last article ignored that, and this one puts it back. We'll say
        safe savings earn 2% and the loan costs 4%, a spread of 2 points. Before we see what that does to Merton's rule, have a guess.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">One line, split in two</h3>
      <p>
        Let's start from the <a href="../merton-share/">Merton share</a>, which tells us how much of our wealth to hold in stocks if we can lend
        and borrow at the safe rate. Here {@html katexify("e")} is the premium stocks earn over the safe rate, {@html katexify("\\sigma")} is
        their volatility and {@html katexify("\\gamma")} is our risk aversion:
      </p>
      <div class="math-display">{@html katexify("\\pi = \\frac{e}{\\gamma\\sigma^{2}}", true)}</div>
      <p>
        With a premium of 5 points and a volatility of 18% that's 154% divided by {@html katexify("\\gamma")}. If our risk aversion is 1 we hold
        154%, and if it's 2 we hold 77%.
      </p>
      <p>
        Now let the loan cost {@html katexify("s")} more than the safe rate. Money we borrow to buy stocks earns only {@html katexify("e - s")},
        so if we borrow we'd hold {@html katexify("(e-s)/(\\gamma\\sigma^2)")}. But we borrow only if that comes to more than 100%, and we lend,
        holding the first share, only if the first comes to less. That leaves three cases:
      </p>
      <div class="math-display">{@html katexify("\\pi = \\begin{cases} \\dfrac{e}{\\gamma\\sigma^{2}} & \\text{if this is at most } 1 \\\\[6pt] \\dfrac{e-s}{\\gamma\\sigma^{2}} & \\text{if this is at least } 1 \\\\[6pt] 1 & \\text{otherwise} \\end{cases}", true)}</div>
      <p>
        The third case is the surprise, and it isn't a rounding effect. Suppose we're at exactly 100%. One more dollar of stock has to be
        borrowed, so it earns us {@html katexify("e - s")} and adds risk that costs us {@html katexify("\\gamma\\sigma^2")}, and we decline
        whenever the risk is the bigger. One dollar less of stock is a dollar lent at the safe rate. It gives up {@html katexify("e")} and removes
        the same risk, so we decline that too whenever the return is the bigger. Both hold when {@html katexify("\\gamma\\sigma^2")} lies
        between {@html katexify("e-s")} and {@html katexify("e")}, that is, for every risk aversion from {@html katexify("(e-s)/\\sigma^2")} to
        {@html katexify("e/\\sigma^2")}. Everyone in that band holds exactly 100%.
      </p>
    </section>

    <Figure id="fig-kink" title="One line, split at 100%" sub="Drag the spread, then the risk aversion.">
      {#snippet children(w)}
        <KinkLab width={w} bind:sp bind:g />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dashed line is what a saver would hold if she could borrow at the safe rate, and the blue line is what she holds when she pays the
          spread. The shaded strip is the range of risk aversions held at exactly 100%, and the dots mark the risk aversion you've chosen.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's read the lab where it starts, at a spread of 2 points and a risk aversion of 1, the saver from the guess. You'll see that at the
        safe rate she'd hold 154%. At the borrower's rate the rule gives 93%, which is under 100%, so she wouldn't borrow, and she sits at
        exactly 100%. The strip runs from 0.93 to 1.54, and every saver in it does the same.
      </p>
      <p>
        Each point of spread widens the strip by 0.31 at its lower end. If you drag the spread up, you'll see the strip start at 1.23 at one
        point, 0.62 at three and 0.31 at four. At five points, where the loan costs all of the premium, it runs down to zero and nobody
        borrows at all. Savers above the strip, at 1.54 or more, would hold under 100% anyway, so the spread doesn't touch them. Savers below it
        still borrow, but less: at a risk aversion of 0.5 the share falls from 309% to 185% when the spread is 2 points.
      </p>
      <p>
        So with a spread of 2 points, nobody with a risk aversion of 1 or more borrows. We should be careful about the edge, though. Try 0.9 and
        you'll see that a saver there still borrows, a little. The line doesn't stop at a wall, it bends.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The spread hits a young saver twice</h3>
      <p>
        Our saver in the <a href="../human-capital/">human capital</a> article had future pay worth many times her savings, and the rule asked
        her to hold about 43 times her savings in stocks at 25. With a spread, two things change. Her share of total wealth falls, since borrowed money earns less. And her future pay is
        worth less to her, because we're financing the leverage by borrowing against it, at the higher rate. So we discount her future pay at the
        rate she pays, and the share of her savings while she borrows becomes
      </p>
      <div class="math-display">{@html katexify("\\pi_b\\,\\frac{W + H_b}{W}, \\qquad H_b = \\sum_t \\frac{1}{(1 + r + s)^{t}}", true)}</div>
      <p>
        where {@html katexify("\\pi_b")} is the borrower's share of total wealth, {@html katexify("W")} is her savings and
        {@html katexify("H_b")} is the value of her paydays at the higher rate. As before, she lends once the lender's rule, with pay valued at
        the safe rate, drops below 100%, and in between she holds exactly 100%.
      </p>
    </section>

    <Figure id="fig-life" title="A working life with a spread" sub="Drag the spread, then pick a risk aversion.">
      {#snippet children(w)}
        <LifeLab width={w} bind:sp bind:g={gl} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The plan is the same as in the human capital article: pay of one unit a year from 25 to 65, and half a year's pay saved at the start. The
          dashed line is what the rule asks for at the safe rate.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's start with a risk aversion of 2. At the safe rate she'd hold 4,299% of her savings at 25, and you can see that by setting the
        spread to zero. At 2 points that becomes 1,879%, less than half. She borrows until about 55 instead of 62, then sits at exactly 100%
        until 62, and after that she lends as before.
      </p>
      <p>
        Now drag the spread up. At 3 points the share at 25 is 1,090% and she borrows only until about 48. At 4 points it's 480% and she borrows
        until about 38. At 5 points she never borrows, and she holds exactly 100% from 25 to 62. So the spread doesn't take a little off the
        leverage we found there. Most of it goes at spreads that are small next to the premium.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What it costs in return</h3>
      <p>
        The shares tell us what savers do, and not what they lose. To put a number on the loss, we can use each saver's certain return, the
        steady return we'd swap for a risky portfolio. With a share {@html katexify("\\pi")} in stocks it is
      </p>
      <div class="math-display">{@html katexify("r + e\\pi - s\\max(\\pi - 1,\\,0) - \\tfrac{1}{2}\\gamma\\sigma^{2}\\pi^{2}", true)}</div>
      <p>
        the safe rate, plus the premium on what we hold, less the spread on what we borrow, less a charge for the risk. Let's draw how much lower
        this is with the spread than without it, for every risk aversion. Drag the risk aversion and the spread, and you'll see the dot follow the line.
      </p>
    </section>

    <Figure id="fig-cost" title="The return given up" sub="Drag the risk aversion, then the spread.">
      {#snippet children(w)}
        <CostLab width={w} bind:sp bind:g />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The red line is the certain return a saver of each risk aversion gives up. The shaded strip is where she sits at exactly 100%, and the
          line is zero to its right.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        A saver who would never have borrowed loses nothing, which is why the line is flat at zero once the risk aversion passes the strip. A
        saver in the strip loses a little. At a risk aversion of 1 and a spread of 2 points it's 0.5 points a year, since she's held at a share
        she'd have wanted to exceed. A saver who still borrows loses the most: 1.3 points a year at 0.75 and 2.9 points at 0.5.
      </p>
      <p>
        Why so much? A borrower earns {@html katexify("(e-s)/\\sigma")} for each unit of volatility, which is the Sharpe ratio of stocks
        against what her money costs. A spread of 2 points takes it from 0.28 to 0.17. The reward for bearing risk grows with the square of it,
        so if we borrow either way we're left with
      </p>
      <div class="math-display">{@html katexify("\\frac{(e-s)^2}{e^2} = \\left(1 - \\frac{s}{e}\\right)^{2}", true)}</div>
      <p>
        of that reward. That's 64% at 1 point, 36% at 2, 16% at 3 and 4% at 4. So a spread that looks small next to the premium can take most of
        what we hoped leverage would earn.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Who borrows near the safe rate</h3>
      <p>
        Everything here turns on the spread, and we haven't said where the spread comes from. A <span class="bold">margin loan</span> is a loan
        against the shares we hold: we pay a rate above the safe rate, and the broker can sell the shares if they fall. Institutions that finance stock exposure
        through futures and similar contracts pay something close to the safe rate plus a small charge, and funds that reset their leverage
        every day do too, before their fees. A margin loan usually costs more, and consumer credit costs far more than that. So the same
        idea, borrowing to hold stocks early in life, looks very different depending on where our money comes from.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our rebuild leaves out a great deal, in four ways.</p>
      <p>
        First, the rule is Merton's, so it holds in his setting: returns that are independent from moment to moment, a spread that's the same
        for any amount we borrow, and no limit on how much. A lender who raises the rate as we borrow more would bend the line again, and a
        limit on borrowing, like the one in the <a href="../cocco-gomes-maenhout-2005/">Cocco, Gomes and Maenhout article</a>, would stop it
        altogether.
      </p>
      <p>
        Second, the rule for a working life is a rule of thumb. It's exact for one year, and close over a life in a small market we compared it
        with, but we haven't solved the full lifecycle problem with a spread. We also let her borrow against pay she hasn't earned, which few
        lenders would allow.
      </p>
      <p>
        Third, we've priced the loan and left out the risk of losing the position. A broker can sell shares that fall, and a margin call can
        arrive well before an account is worth nothing, as the <a href="../short-selling-and-margin/">short selling and margin</a> article works out. So the leverage we could keep is probably smaller than any of these lines show.
      </p>
      <p>
        And finally, the plan is ours. Our premium of 5 points, and half a year's pay saved at 25, set where the strip and the switch-over ages
        fall. Change them and the pictures move, though the shape of the kink doesn't. The same article
        has the plan behind the second chart.
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
