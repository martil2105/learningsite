<script>
  /* App.svelte for cocco-gomes-maenhout-2005 */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import PaperCard from "./Components/PaperCard.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import PolicyLab from "./Components/PolicyLab.svelte";
  import CostLab from "./Components/CostLab.svelte";
  import katexify from "./katexify.js";

  // shared by both figures, so a setting chosen in one carries to the other
  let g = $state(5);
  let cap = $state(1);
  let rho = $state(0);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <PaperCard link="https://econpapers.repec.org/RePEc:oup:rfinst:v:18:y:2005:i:2:p:491-533">
    {#snippet cite()}
      Cocco, J. F., Gomes, F. J. and Maenhout, P. J. (2005), "Consumption and portfolio choice over the life cycle", <em>Review of Financial
      Studies</em>, 18(2), 491–533.
    {/snippet}
    {#snippet claims()}
      Pay works like a safe asset, so the share of savings invested in stocks should roughly fall as a worker ages. The paper solves a
      realistically calibrated model with pay that can't be traded and with borrowing limits. It finds that ignoring pay altogether has large
      utility costs, while ignoring only its risk costs about a tenth as much, unless we allow for a disastrous pay shock.
    {/snippet}
    {#snippet rebuild()}
      A small life-cycle model of our own, solved backwards by computer, with risky pay and a limit on borrowing. We'll see how the share in
      stocks moves with age, what the limit costs, and how much depends on the link between pay and stocks.
    {/snippet}
    {#snippet later()}
      Viceira (2001) had already asked how pay that can't be traded changes the share for investors with long horizons. Benzoni,
      Collin-Dufresne and Goldstein (2007) asked what changes if pay and stocks are tied together over the long run, which is the next
      article.
    {/snippet}
  </PaperCard>

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're 25, with a steady job and a little saved, and that nobody will lend us money to buy stocks. In the
        <a href="../human-capital/">human capital</a> article, Merton's rule asked a 25-year-old for dozens of times her savings in stocks,
        and any limit on borrowing stopped her far short of it. So what does a saver in that position actually hold, and how much does the
        limit cost her? Cocco, Gomes and Maenhout answered with a computer, in a model where pay is risky. Before we look at what a small
        version of that model says, have a guess.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Pay that isn't safe</h3>
      <p>
        In the human capital article our pay was as safe as a bond. Real pay isn't. Each year there's a chance of a raise, a lost job or a
        stalled career, and much of that risk has nothing to do with the stock market. So let's give our worker a
        <span class="bold">permanent income</span> that takes a random step each year, up or down by about 10%, unrelated to stocks for now.
        Her income also grows with a hump: by 3% a year for ten years, then 1% a year for twenty, and not at all in her last ten working years.
      </p>
      <p>
        Each year she chooses how much to consume and how much to save. She also chooses what share of her savings goes into stocks, and
        that share can't go above a limit. She retires at 65 on 70% of her final pay, which is safe, and she lives to 89. Stocks pay a
        4% premium over a safe 2% with a volatility of 15.7%, and she discounts the future by 4% a year. These numbers are ours, chosen to be
        plain rather than to match the paper.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Solving a life backwards, by computer</h3>
      <p>
        The <a href="../samuelson-merton-1969/">Samuelson and Merton</a> article solved a lifetime of choices backwards from the last year.
        We'll do the same here, but with risky pay and a limit there's no formula to lean on. So for each year she might be in, and each
        amount of cash she might have, the computer tries many choices of saving and stocks and keeps the best one, given how well she'll
        do next year. We measure her cash in units of her permanent income, which takes the trend out of her pay.
      </p>
      <p>
        In symbols, let {@html katexify("V_t(x)")} be the best value she can reach from age {@html katexify("t")} on, starting with cash
        {@html katexify("x")}. Each year she picks consumption {@html katexify("c")} and a share {@html katexify("\\alpha")} of her savings
        for stocks, and the computer solves
      </p>
      <div class="math-display">{@html katexify("V_t(x) = \\max_{c,\\,\\alpha}\\left\\{ \\frac{c^{1-\\gamma}}{1-\\gamma} + \\beta\\,\\mathbb{E}\\!\\left[ N^{1-\\gamma}\\,V_{t+1}(x') \\right] \\right\\}", true)}</div>
      <p>
        with next year's cash given by
      </p>
      <div class="math-display">{@html katexify("x' = \\frac{(x-c)\\,\\big(r_f + \\alpha\\,(R - r_f)\\big)}{N} + y'", true)}</div>
      <p>
        Here {@html katexify("R")} is the stock's gross return and {@html katexify("r_f")} the safe one. The growth of her permanent income,
        shock included, is {@html katexify("N")}, and {@html katexify("y'")} is next year's pay in units of permanent income. The factor
        {@html katexify("N^{1-\\gamma}")} turns next year's value back into this year's units.
      </p>
      <p>
        That takes a few seconds for each setting, so we solved every setting ahead of time. Then we ran 4,000 workers through each of them,
        with the same luck in every setting, to see who ends up holding what. Switch the controls to compare settings, and notice how the
        limit and the correlation between pay and stocks change the picture.
      </p>
    </section>

    <Figure id="fig-policy" title="A working life, solved backwards" sub="Start at risk aversion 5 with no borrowing, then try the other settings.">
      {#snippet children(w)}
        <PolicyLab width={w} bind:g bind:cap bind:rho />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue band covers the middle 80% of 4,000 workers, and the line is the median worker. The dashed line is the limit on the share.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's start with a risk aversion of 5 and no borrowing. The median worker holds all of her savings in stocks, the most she's allowed,
        until she's about 55, and at 45 about 88% of workers are at that limit. Then the share falls, to 85% at 60 and 78% at 65, as her savings grow. The
        Merton share of her savings alone would have been about 32%, so it's her pay that makes the difference. Her future pay is a large
        bond-like asset, and while it lasts, her savings can hold more stock than they otherwise would.
      </p>
      <p>
        If you switch the limit to 2 to 1, you'll see the median worker hold twice her savings in stocks until she's 37, and still 134% at 45.
        So a looser limit doesn't remove the problem. A young worker with safe-looking pay runs into any limit we choose.
      </p>
      <p>
        Risk aversion matters a lot. At 3 the median worker sits at the no-borrowing limit for her whole life. At 10 the limit binds only for a
        few years, since a cautious worker saves more and her larger savings soon hold stocks well below the limit. Her share falls from 100% at 25 to
        65% at 35 and about a third by 65.
      </p>
      <p>
        The second chart shows why the share falls with age. Our savings grow while the pay still to come shrinks, so the bond-like part of
        what we own gets smaller and our savings hold more of the total. At risk aversion 5 the median worker has saved about 8 years of
        pay by 65.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">When pay moves with stocks</h3>
      <p>
        So far pay and stocks have been unrelated, which is the case the paper leans on when it says pay is mostly idiosyncratic. Let's give
        them a mild link, a correlation of 0.3, so that our pay tends to fall a little when stocks do. At a risk aversion of 5 and no
        borrowing, the median worker's share at 45 drops from 100% to 73%, and it's down to 52% at 60. At a risk aversion of 10 she holds
        nothing at all in her twenties.
      </p>
      <p>
        You'll also see a jump at 65, when her pay stops and a safe pension takes its place. The part of her wealth that moved with stocks is
        gone, so her savings can hold more of them again.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the limit costs</h3>
      <p>
        A limit that binds must cost something, and we can measure it. Let's ask how much more a worker with no borrowing would need to
        consume every year of her life to be as well off as a worker who can hold up to twice her savings in stocks. We start both from the
        same cash at 25. Scaling every year's consumption by {@html katexify("1+g")} scales her value by {@html katexify("(1+g)^{1-\\gamma}")},
        so the gain {@html katexify("g")} solves
      </p>
      <div class="math-display">{@html katexify("(1+g)^{1-\\gamma}\\,V_{\\text{none}} = V_{2:1} \\quad\\Longrightarrow\\quad g = \\left(\\frac{V_{\\text{none}}}{V_{2:1}}\\right)^{\\frac{1}{\\gamma-1}} - 1", true)}</div>
      <p>
        where {@html katexify("V_{\\text{none}}")} and {@html katexify("V_{2:1}")} are her values at 25 with no borrowing and with the 2 to 1 limit.
      </p>
    </section>

    <Figure id="fig-cost" title="What a ban on borrowing costs" sub="Pick a risk aversion, then change how pay moves with stocks.">
      {#snippet children(w)}
        <CostLab width={w} bind:g bind:rho />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar is the extra consumption, every year, that makes a worker with no borrowing as well off as one who may hold 2 to 1.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With pay unrelated to stocks, the ban costs a worker with a risk aversion of 3 about 3.0% of her consumption, one with 5 about 1.6%,
        and one with 10 about 0.16%. So the limit costs the bold the most, and the cautious almost nothing, since a cautious worker wouldn't
        have borrowed much anyway. If you switch the correlation to 0.3, you'll see each bar shrink, to 1.5%, 0.17% and nothing at all.
      </p>
      <p>
        That's the case for letting savers borrow. A saver who's willing to take more risk and whose pay doesn't move with the market loses
        the most when she can't borrow, and she's the one who gains from a loan. What our 2 to 1 limit leaves out is the price of the loan,
        which is the subject of the <a href="../cost-of-leverage/">cost of leverage</a> article.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our rebuild is much smaller than the paper, in four ways.</p>
      <p>
        First, our model has one kind of pay shock, no spell of unemployment, no disaster, no house and no cost of taking part in the stock
        market. Its numbers are ours as well. The paper's findings about what ignoring pay costs, and what ignoring only its risk costs, are
        theirs, and we haven't tested them.
      </p>
      <p>
        Second, our answers come from 4,000 simulated workers, so the middle 80% and the fractions at the limit are estimates. The medians are
        steadier, but a point or two on them isn't meaningful.
      </p>
      <p>
        Third, we stopped at a limit of 2 to 1, and borrowing costs nothing beyond the safe rate. At 3 to 1 the worst year in our model, when
        stocks fall by about a third, would take all of a worker's savings, and our solver can't handle that.
      </p>
      <p>
        And finally, the answers depend on a risk aversion nobody knows. We tried 3, 5 and 10, and across that range the cost of the limit
        changes by a factor of eighteen.
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
