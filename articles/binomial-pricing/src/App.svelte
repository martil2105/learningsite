<script>
  /* App.svelte for binomial-pricing */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import CopyLab from "./Components/CopyLab.svelte";
  import ReturnFigure from "./Components/ReturnFigure.svelte";
  import TreeLab from "./Components/TreeLab.svelte";
  import ConvergeFigure from "./Components/ConvergeFigure.svelte";
  import TrinomialLab from "./Components/TrinomialLab.svelte";
  import katexify from "./katexify.js";

  const qEq = katexify("q = \\frac{S(1 + r) - S_d}{S_u - S_d} = \\frac{105 - 90}{120 - 90} = 0.5, \\qquad C = \\frac{q\\,C_u + (1 - q)\\,C_d}{1 + r}", true);
  const omegaEq = katexify("\\mathbb{E}[R_C] - r = \\Omega \\, \\big(\\mathbb{E}[R_S] - r\\big), \\qquad \\Omega = \\frac{\\Delta \\, S}{C}", true);
  const crrEq = katexify("u = e^{\\sigma \\sqrt{\\Delta t}}, \\qquad d = \\frac{1}{u}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        An option's price feels like it should depend on what people expect. A call pays off if the share rises, so surely someone who
        thinks a rise is likely should pay more for one than someone who doesn't. Let's test that on the smallest market we can build: one
        share, one year and two possible outcomes. Here's a question first.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Copying the call</h3>
      <p>
        The answer comes from a trick we can play with the share and the bank. Our share is at $100 and will be at $120 or $90 in a year, and the bank pays 5%. The call pays $20 if
        the share rises and nothing if it falls. Suppose we hold some shares and borrow some money instead. If we can choose the amounts so that our portfolio pays exactly what the call pays in both cases, the call can't cost anything other than what our portfolio costs. Otherwise someone would buy the cheap one, sell the dear one and pocket the difference. Try to find that portfolio below.
      </p>
    </section>

    <Figure id="fig-copy" title="Copy the call" sub="Drag how many shares to hold and how much to owe the bank.">
      {#snippet children(w)}
        <CopyLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The tree shows what the share is worth after a year, what the call pays and what our portfolio pays in each branch. The readouts say
          what the portfolio costs today.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you set the sliders to two thirds of a share and $60 owed, the portfolio pays $80 less $60 if the share rises, which is $20, and $60 less $60 if it falls, which is nothing. That's exactly what the call pays. We can also find the copy with a little algebra. The shares have to make up the $20 gap between the call's two payoffs out of the share's $30 gap, so we need two thirds of a share. The loan is whatever brings the lower branch to zero. That ratio, the change in the call's payoff over the change in the share's, is called the <span class="bold">hedge ratio</span> or delta. Owing $60 next year means borrowing $57.14 today, so the portfolio costs two thirds of $100 less $57.14, which comes to $9.52. That's the price of the call.
      </p>
      <p>
        Notice what we didn't use. Nowhere did we need the chance that the share rises. Ann and Ben can both build the copy, so both should
        pay $9.52, and if a dealer offered the call to Ann for more, she'd be better off building the copy herself.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A price, not a probability</h3>
      <p>
        There's a tidier way to write the price. Let's look for the chance of a rise that would make the share earn exactly the safe rate, and call it {@html katexify("q")}. Then the call's price is its average payoff under that chance, discounted at the safe rate:
      </p>
      <div class="math-display">{@html qEq}</div>
      <p>
        Here {@html katexify("q")} is the <span class="bold">risk-neutral probability</span>, and for our share it's one half. It isn't anyone's
        belief. It's the chance a world without risk premiums would need to price the share at $100, and since the call is a copy of shares
        and a loan, the same {@html katexify("q")} prices the call too. It's the same idea as the market's chance of default in the article on
        the Merton model.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the real chance does decide</h3>
      <p>
        So the real chance {@html katexify("p")} doesn't set the call's price. It still matters to anyone holding the call, though, because it
        sets what they can expect to earn. The call is two thirds of a share bought with borrowed money, so its expected return is the share's,
        levered up:
      </p>
      <div class="math-display">{@html omegaEq}</div>
    </section>

    <Figure id="fig-return" title="What the real chance does set" sub="Drag the real chance that the share rises.">
      {#snippet children(w)}
        <ReturnFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The lines are the expected returns of the share and the call over the year, for each real chance of a rise. The call's price is the
          same everywhere.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The call holds $66.67 of shares and costs $9.52, so it's leveraged 7.0 to 1, and its expected return above the safe rate is seven
        times the share's. If Ann is right and the rise is 90% likely, the share is expected to return 17% and the call 89%. If Ben is right
        and it's 10% likely, the share is expected to return −7% and the call −79%. If you drag the chance to 50%, both lines meet at the safe
        5%, because that's the risk-neutral chance. Ann and Ben disagree about what the call will earn, and agree about what it costs. It's also why a call is such a risky thing to own: in our example a 10-point swing in the share's expected return is a 70-point swing in the call's.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Many steps</h3>
      <p>
        Two outcomes in a year is a toy, but the trick survives when we chop the year into steps. In 1979, John Cox, Stephen Ross and Mark
        Rubinstein built a tree in which the share goes up by {@html katexify("u")} or down by {@html katexify("d")} at every step, with the
        sizes set by its volatility {@html katexify("\\sigma")}:
      </p>
      <div class="math-display">{@html crrEq}</div>
      <p>
        Let's take four steps of a quarter each, a volatility of 20% and a safe rate of 5% a year. At the end of the tree the call's value is
        just its payoff. One step earlier, each node is a one-step tree like the one above, so its value is the risk-neutral average of the
        two nodes after it, discounted for a quarter. You can work backwards through the tree in the chart below, one column at a time.
      </p>
    </section>

    <Figure id="fig-tree" title="Pricing backwards through a tree" sub="Press &quot;Step back&quot; to fill in the call's value, one column at a time.">
      {#snippet children(w)}
        <TreeLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Grey numbers are share prices at each node, and blue numbers are the call's value there, filled in from the end of the year.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's do one node by hand. Take the top node after three steps, where the share is at $134.99. A quarter later it's at $149.18, where the call pays $49.18, or at $122.14, where it pays $22.14. The risk-neutral average of those two, discounted for a quarter, is $36.23, the value the tree writes at that node. After four presses we've worked our way to today, and the tree says the call is worth $9.97. The risk-neutral chance of a rise at each step is 0.5378, and the copy
        at the start holds 0.629 of a share. The copy has to change at every node, buying shares after rises and selling after falls, which is
        the idea behind <span class="bold">delta hedging</span>.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Towards Black and Scholes</h3>
      <p>
        More steps make the tree a better picture of a share that moves all the time. As the steps get smaller, the tree's price settles on
        Black and Scholes's formula, which for our option is $10.45. You can see how it gets there below.
      </p>
    </section>

    <Figure id="fig-converge" title="More steps, closer to Black and Scholes" sub="Drag the number of steps.">
      {#snippet children(w)}
        <ConvergeFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">Each dot is the tree's price with that many steps, and the pink line is Black and Scholes's price.</p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The tree doesn't creep up on the answer, it zigzags. With an even number of steps, the middle node at the end sits exactly at the
        strike, and the price comes out low. With an odd number, it comes out high. So 50 steps give $10.41 and 51 give $10.49. The gap shrinks
        roughly in proportion to one over the number of steps: 100 steps miss by 2 cents and 1,000 by a fifth of a cent. And the real chance of a rise never appears at any step.</p><p>That's worth pausing on. In our tree we could give each step any real chance of a rise we like, and the price wouldn't move. As the steps get smaller, a world where investors expect 12% a year and one where they expect 5% produce paths that look alike step by step, with the same volatility and only a slightly different tilt. Pricing only needs the volatility, which is why Black and Scholes's formula has the safe rate in it and no expected return.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A third branch</h3>
      <p>
        Everything so far rested on one assumption: at every step the share can only go one of two ways. Let's give it a third. Our share can
        now end the year at $120, $105 or $90. The portfolio that copied the call before, two thirds of a share and $60 owed, still pays $20
        and $0 in the outer branches, but at $105 it pays $10, where the call pays $5. With two things to trade and three outcomes to match, no
        portfolio copies the call.
      </p>
      <p>
        Arbitrage still rules some prices out, since the call can't cost less than a portfolio it always beats, or more than one that always
        beats it. But here it leaves a whole range, from $4.76 to $9.52. Which price inside it the market picks depends on who's buying. Economists call a market where every payoff can be copied <span class="bold">complete</span>, and our three-branch market isn't. Let's
        take an investor whose taste for risk doesn't change with her wealth, and who prices the share and the bank correctly.
      </p>
    </section>

    <Figure id="fig-tri" title="Three branches, a range of prices" sub="Drag the real chances.">
      {#snippet children(w)}
        <TrinomialLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The shaded band holds every price that arbitrage doesn't rule out. The blue line is the price with two branches, and the pink dot is what our
          investor would pay.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With a 30% chance of the middle branch, and the rest split 60 to 40 between a rise and a fall, she pays $8.09. If you drag the middle
        branch's chance to zero, we're back to two branches and her price is $9.52, the copy's. Drag it to 90% and she pays $5.24. If you drag the split between a rise and a fall instead, her risk aversion has to change a lot to keep the share at $100: from 1.41 at 60% to 3.82 at 75%. Her price barely moves, from $8.09 to $7.99. What matters most is how likely the branch our copy gets wrong is. So with a
        third branch the real chances are back in the price, together with how she feels about risk. The real chance never mattered because
        of anything special about options. It dropped out because the tree let us copy the option exactly.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our trees were simpler than markets, and that left a few things out.</p>
      <p>
        First, the tree needs the share's volatility. The real chance of a rise drops out, but the size of the moves doesn't, and volatility
        has to be estimated, or read back from option prices.
      </p>
      <p>
        Second, copying needs trading at every step, at no cost. Real hedgers trade less often and pay a spread each time, so the copy is only
        approximate and the price is really a band.
      </p>
      <p>
        Third, real shares have more than two branches. They jump, and their volatility changes, so real markets look more like our third
        branch than our first tree. That's one reason option prices carry premiums that a two-branch tree can't explain, which show up as the
        volatility smile.
      </p>
      <p>
        And finally, we priced European calls. The same tree prices American options, by checking at every node whether using the option now
        is worth more than holding it, which is how most American options are priced in practice.
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
