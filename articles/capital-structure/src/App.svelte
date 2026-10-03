<script>
  /* App.svelte for capital-structure */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import ReturnsLab from "./Components/ReturnsLab.svelte";
  import SplitFigure from "./Components/SplitFigure.svelte";
  import YieldChart from "./Components/YieldChart.svelte";
  import TaxFigure from "./Components/TaxFigure.svelte";
  import katexify from "./katexify.js";

  const waccEq = katexify("r_A = \\frac{D}{V}\\,r_D + \\frac{E}{V}\\,r_E", true);
  const mm2Eq = katexify("r_E = r_A + \\left(r_A - r_D\\right)\\frac{D}{E}", true);
  const gapEq = katexify("\\underbrace{r_A + (r_A - 3\\%)\\tfrac{D}{E}}_{\\text{straight line}} \\;-\\; r_E \\;=\\; \\left(r_D - 3\\%\\right)\\frac{D}{E}", true);
  const yieldEq = katexify("\\text{error} = \\frac{D}{V}\\,\\big(\\text{yield} - r_D\\big)", true);
  const permEq = katexify("\\frac{\\tau\\, r_D\\, D}{r_D} = \\tau D", true);
  const rebEq = katexify("\\frac{\\tau\\, r_D\\, D}{r_A}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Imagine we run a firm that has never borrowed. Its assets are worth $100, and our shareholders expect them to earn 8% a year. A bank offers us a
        loan at 3%. Since 3% is a lot less than 8%, it's natural to think that swapping some of our shares for a loan would make our firm
        cheaper to fund. Franco Modigliani and Merton Miller took this question apart in 1958, and their answer is still where finance courses
        start.
      </p>
      <p>
        The number we care about is our <span class="bold">cost of capital</span>, the average return our investors expect, weighted by what
        each group's claim is worth. It's the return our assets have to earn to keep everyone paid. Before we work through it, have a guess.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Splitting the same returns</h3>
      <p>
        Borrowing doesn't change our assets. They earn the same 8% on average whatever we do, and the loan only changes who gets which part of
        it. Lenders are paid first, and our shareholders get what's left. If the firm is worth {@html katexify("V")}, with debt
        {@html katexify("D")} and equity {@html katexify("E")}, the 8% on the whole firm is the weighted average of what the two groups expect:
      </p>
      <div class="math-display">{@html waccEq}</div>
      <p>
        Here {@html katexify("r_A")} is the return on our assets, {@html katexify("r_D")} what lenders expect and {@html katexify("r_E")} what
        shareholders expect. If we solve for the shareholders' return, we get <span class="bold">Modigliani and Miller's second
        proposition</span>:
      </p>
      <div class="math-display">{@html mm2Eq}</div>
      <p>
        With half the firm funded by a loan at 3%, the ratio of debt to equity is 1, so our shareholders now expect 8% plus 5%, which is 13%.
        Half of 13% and half of 3% is 8% again. The loan is cheap, but it makes our shares riskier, because the same ups and downs now fall on
        half as much equity, and the shareholders ask for more to hold them. Their first proposition says the same thing in dollars: the firm is
        worth $100 however we split it.
      </p>
      <p>
        In this version, the shareholders' expected return climbs a straight line as we borrow more, and that's the picture most courses draw.
        It assumes the loan stays safe, though, and a loan can't stay safe for ever. The more we borrow, the likelier it is that our assets end
        the year worth less than we owe.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">When the loan isn't safe</h3>
      <p>
        To see what happens then, let's give our firm a one-year loan and let its assets move. Next year they're worth whatever they turn out
        to be, with an expected return of 8% and a volatility we can set. Lenders get what they're owed if the assets cover it, and everything
        there is if they don't. This is Robert Merton's model of a firm's debt, and it lets us price our loan and our shares for any amount of
        borrowing.
      </p>
    </section>

    <Figure id="fig-returns" title="Expected returns against borrowing" sub="Drag the debt-to-equity ratio, then the volatility of the firm's assets.">
      {#snippet children(w)}
        <ReturnsLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dashed line is the straight line we'd get if the loan were safe. The solid lines are what shareholders and lenders really expect,
          and the flat line is the cost of capital.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At a debt-to-equity ratio of 1 our loan is nearly safe, and the shareholders' line sits on the straight one at 13%. If you drag the
        ratio to 3, you'll see the two come apart. The straight line says 23.0%, but our shareholders actually expect 21.0%. The loan now goes
        unpaid in 12.9% of years, so the lenders carry some of our firm's risk and expect 3.7% rather than 3%. Whatever risk the lenders take
        on is risk our shareholders don't have to be paid for.
      </p>
      <p>
        The gap has a simple size. The second proposition still holds, as long as we use what lenders expect instead of 3%. So the
        shareholders' return falls below the straight line by
      </p>
      <div class="math-display">{@html gapEq}</div>
      <p>
        and the flat line doesn't move at all. At every amount of borrowing and every volatility, our cost of capital is 8%. If you drag the
        volatility down to 10%, you'll see the loan stay safe almost all the way, and the straight line holds up to a ratio of 3.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Where does the bend come from?</h3>
      <p>
        Let's look at the loan from the lenders' side. The chart below splits next year's assets between the two groups, with the volatility at
        25%. Lenders get everything up to what they're owed, and shareholders get the rest, so the two parts always add up to the whole firm.
        That's why borrowing can't change what our firm is worth: whatever the split, the two claims together are just the assets. If you drag
        the ratio, you'll see the pink area grow and the blue one shrink while the line along their top stays where it is.
      </p>
    </section>

    <Figure id="fig-split" title="Who gets what next year" sub="Drag the debt-to-equity ratio.">
      {#snippet children(w)}
        <SplitFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          In the first chart the pink area goes to lenders and the blue area to shareholders. The second chart shows how likely each value of
          the assets is, with the values where the loan isn't repaid in pink.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At a ratio of 3 we owe $78.89 at the end of the year. Most of the time our assets cover it, and the lenders' payment is the same flat
        amount. But in the pink tail of the second chart, the assets fall short and the lenders take a loss. Their payment then moves with the
        firm, just like a share, and that's the risk they're paid extra for. Our shareholders keep everything above the loan, which makes their
        shares a call option on the firm's assets, with the amount we owe as its strike. So we can price the shares with the Black–Scholes
        formula, and the loan is worth whatever is left of the $100.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The yield is a promise</h3>
      <p>
        When we work out a cost of capital in practice, the return lenders expect is hard to see. What we can see is the yield on the firm's
        bonds, so that's the number most valuations use for the cost of debt. For a safe loan the two are the same. For a risky one they
        aren't, because the <span class="bold">yield</span> is what lenders earn if they're paid in full, and sometimes they aren't.
      </p>
    </section>

    <Figure id="fig-yield" title="The cost of capital, worked out with the yield" sub="Switch the volatility, then drag the debt-to-equity ratio.">
      {#snippet children(w)}
        <YieldChart width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The flat line is the real cost of capital, and the pink line is what we get if we use the loan's yield as the cost of debt.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At a ratio of 3 and a volatility of 25%, our loan promises 5.2% and lenders expect 3.7%. With the yield in its place, the cost of
        capital comes out at 9.15% instead of 8%, and the error grows the more we borrow. Its size is the share of debt times the gap between
        the two rates:
      </p>
      <div class="math-display">{@html yieldEq}</div>
      <p>
        In the trade-off theory of capital structure, the cost of capital does rise once a firm borrows a lot, because financial distress is
        costly. Our pink line rises in the same way, but there's no distress cost in it at all. It comes from using a promise as if it were an
        expectation.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">So what does debt do? Taxes</h3>
      <p>
        In Modigliani and Miller's world, borrowing changes nothing about what our firm is worth. In most tax systems, though, interest is paid
        out of profits before tax and dividends after, so each dollar of interest saves the firm some tax. With a tax rate {@html katexify("\\tau")} and a loan
        {@html katexify("D")} at a rate {@html katexify("r_D")}, we save {@html katexify("\\tau\\, r_D D")} a year. How much that's worth
        depends on how long the loan stays.
      </p>
      <p>
        If the loan is permanent, and the saving is as safe as the loan itself, we discount the saving at the loan's own rate, and the loan
        adds
      </p>
      <div class="math-display">{@html permEq}</div>
      <p>
        to the firm's value. That's the correction Modigliani and Miller made in 1963, and at a tax rate of 22% a $50 loan adds $11. But most
        firms don't keep one fixed loan for ever. If we keep our loan at a fixed share of the firm's value instead, adjusting it as we go, the
        savings rise and fall with the firm. Then we discount them at the assets' 8%, and the loan adds
      </p>
      <div class="math-display">{@html rebEq}</div>
      <p>which comes to $4.13.</p>
    </section>

    <Figure id="fig-tax" title="What the tax saving adds" sub="Drag the tax rate and the size of the loan.">
      {#snippet children(w)}
        <TaxFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue line is a permanent loan and the pink line is a loan kept at a fixed share of the firm's value. The dotted line is the firm
          with no loan.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At our 3% and 8%, the second kind of loan adds three eighths as much as the first. If you drag the tax rate, you'll see both lines tilt
        together, with the pink one always at three eighths of the blue one's slope. So taxes are what give debt its value, but how much value
        depends on a borrowing policy that the usual formula doesn't mention.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our firm is simpler than a real one, and four things are missing from it.</p>
      <p>
        First, distress. Firms close to default lose customers, staff and suppliers, and they pay lawyers. None of that is in our model, and
        it's the usual reason given for why firms borrow less than the tax saving alone would suggest.
      </p>
      <p>
        Second, our loan lasts one year, and our assets follow a smooth lognormal path. Real firms have many loans that come due at different
        times, and the value of their assets can jump.
      </p>
      <p>
        Third, nobody can see the volatility of a firm's assets. We'd have to back it out of the prices of the shares and the bonds, and that
        estimate comes with its own error.
      </p>
      <p>
        And finally, investors pay tax too. Interest is often taxed more heavily than dividends and capital gains in investors' hands, which
        takes back part of the firm's saving, as Miller pointed out in 1977.
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
