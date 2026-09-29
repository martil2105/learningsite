<script>
  /* App.svelte for benzoni-collin-dufresne-goldstein-2007 */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import PaperCard from "./Components/PaperCard.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import HumpLab from "./Components/HumpLab.svelte";
  import HorizonLab from "./Components/HorizonLab.svelte";
  import EdgeLab from "./Components/EdgeLab.svelte";
  import katexify from "./katexify.js";

  // shared by all three figures, so a setting chosen in one carries to the others
  let h = $state(5);
  let g = $state(2);
  let age = $state(25);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <PaperCard link="https://econpapers.repec.org/RePEc:bla:jfinan:v:62:y:2007:i:5:p:2123-2167">
    {#snippet cite()}
      Benzoni, L., Collin-Dufresne, P. and Goldstein, R. S. (2007), "Portfolio choice over the life-cycle when the stock and labor markets are
      cointegrated", <em>Journal of Finance</em>, 62(5), 2123–2167.
    {/snippet}
    {#snippet claims()}
      When pay and dividends are tied together over the long run, a young worker's future pay behaves like stock, and an older worker's,
      with less time left for the tie to act, behaves like a bond. The paper finds that plausible calibrations have the young take substantial
      short positions in stocks, and that holdings over a life are hump-shaped.
    {/snippet}
    {#snippet rebuild()}
      A small model of our own, in which pay follows dividends with a lag. We'll see how much of our future pay behaves like stock at each age,
      what that does to the share of savings in stocks, and how sensitive the answer is to the lag.
    {/snippet}
    {#snippet later()}
      Cocco, Gomes and Maenhout (2005), the previous article, found that with pay unrelated to stocks the share stays at the borrowing limit
      for decades. The next two articles ask what a life of borrowing looks like, and what it costs.
    {/snippet}
  </PaperCard>

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're 25, with half a year's pay saved and 27 years of pay still to earn. In the
        <a href="../human-capital/">human capital</a> article that made our future pay a huge bond, and Merton's rule asked us to hold about 43
        times our savings in stocks. It also said that if our pay moved with the market, we should hold less. Benzoni, Collin-Dufresne and
        Goldstein asked what happens when pay doesn't move with the market this year, but is tied to it over decades. Before we look at what a
        small version of their model says, have a guess.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Pay that follows dividends</h3>
      <p>
        Dividends are what companies pay out to their owners, and over the long run they move with stock prices. Pay is tied to dividends in a
        similar way, since both come out of what firms earn. Two series that each wander, but stay tied together so that a gap between them
        tends to be pulled back, are called <span class="bold">cointegrated</span>. That's all we'll need from the idea.
      </p>
      <p>
        Let's make that concrete. Say the stock market gets a surprise, up or down, and dividends follow it. Our pay doesn't move at once.
        Each year it closes a fixed fraction {@html katexify("\\varphi")} of the gap that's left, so after {@html katexify("s")} years it has
        followed the surprise by
      </p>
      <div class="math-display">{@html katexify("\\beta(s) = 1 - (1-\\varphi)^{s}", true)}</div>
      <p>
        We'll describe {@html katexify("\\varphi")} by its <span class="bold">half-life</span>, the number of years pay takes to close half of
        the gap. With a half-life of 5 years, pay has followed 13% of the surprise after one year, half of it after five, and 94% after twenty.
        So a payday next year is nearly a bond, and a payday twenty years away is nearly a stock. That's the paper's central idea: the same job
        is bond-like over a paycheck and stock-like over a career.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">One loading for a whole career</h3>
      <p>
        Our future pay is a string of paydays, and each is worth its present value, discounted at 2% as before. So the loading of the whole
        string on stocks is the average of {@html katexify("\\beta(s)")} over the paydays left, weighted by what each is worth today:
      </p>
      <div class="math-display">{@html katexify("\\beta_H = \\frac{\\sum_s \\mathrm{DF}_s\\,\\beta(s)}{\\sum_s \\mathrm{DF}_s}, \\qquad \\mathrm{DF}_s = (1+r)^{-s}", true)}</div>
      <p>
        The rule from the <a href="../human-capital/">human capital</a> article then carries over, with {@html katexify("\\beta_H")} in place of
        the loading we picked by hand. Here {@html katexify("\\pi^*")} is the Merton share of everything we own, {@html katexify("H")} is the
        present value of future pay and {@html katexify("W")} is our savings:
      </p>
      <div class="math-display">{@html katexify("\\text{share of savings} = \\pi^* + \\left(\\pi^* - \\beta_H\\right)\\frac{H}{W}", true)}</div>
      <p>
        In words, we hold the stock that our pay doesn't already hold for us. We'll use the same plan as before, with pay of 1 a year from 25 to
        65 and half a year's pay saved at 25. Stocks have a 5% premium and 18% volatility, and with a risk aversion of 2 that gives a Merton share
        of 77%. Future pay is then 27 years of pay at 25, or 55 times our savings. If the loading is high enough, our pay already holds more stock than we want in
        total, and the rule tells us to hold none. That happens when {@html katexify("\\beta_H")} passes {@html katexify("\\pi^*(1 + W/H)")},
        which at 25 is about 78.6%.
      </p>
    </section>

    <Figure id="fig-hump" title="Pay tied to dividends, over a career" sub="Drag the half-life, then try the other risk aversions.">
      {#snippet children(w)}
        <HumpLab width={w} bind:h bind:g />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dashed line in the upper chart is the rule when pay is as safe as a bond. The lower chart shows how much of our future pay behaves
          like stock, against the level above which the rule holds none.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's start with a half-life of 5 years and a risk aversion of 2, which is where the lab begins. You'll see the rule ask a 25-year-old
        for a small short position, −9% of her savings, against about 4,300% when pay is as safe as a bond. By 30 the share is 85%, and it peaks at about 122% at 45 before falling to
        100% at 60 and to the Merton 77% at 65. That hump is the shape the paper reports, and it's very unlike the bond case, where the share
        falls from the start.
      </p>
      <p>
        Why does the young worker's share collapse? At 25 almost everything she owns is future pay, and in this model most of that is
        stock-like. Her loading is 78.7%, just above the 78.6% at which the rule holds nothing. If you drag the half-life down to 2 years,
        she's short 720% of her savings, which is about 3.6 years of pay. If you drag it up to 20, she holds 1,996% at 25, and the share falls
        with age again, as it did in the bond case.
      </p>
      <p>
        The lower chart shows what lifts the share. The loading falls with age, since the distant paydays that behave like stock are the ones
        that run out first. At a half-life of 2 years it goes from 92% at 25 to 75% at 55. Later the share comes back down toward 77%, because
        our savings catch up with our future pay and the pay matters less.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Why the young are the stock-like ones</h3>
      <p>
        Let's look at one age at a time. The chart below draws {@html katexify("\\beta(s)")} for every payday still to come, with each dot sized
        by what that payday is worth today. The dashed line is the average of the dots, and the dotted line is the level above which the rule
        holds no stock. Drag the age up, and you'll see the curve lose its far end and the average fall well below the dotted line.
      </p>
    </section>

    <Figure id="fig-horizon" title="The loading, one age at a time" sub="Drag the age, then change the half-life.">
      {#snippet children(w)}
        <HorizonLab width={w} bind:h bind:g bind:age />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The grey curve is the whole schedule. The blue part is the paydays that are left at this age.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At 25 the dots run along the whole curve. The near ones are worth the most, but there are so many far ones that the average still sits
        at 79%. By 45 only twenty paydays are left and the average is 66%, and by 55, with ten left, it's 48%. So what makes a young worker's pay
        stock-like isn't any single paycheck. It's that most of what she'll earn is a long way off.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A knife-edge</h3>
      <p>
        The sign of the young worker's share depends on her loading sitting a whisker above or below the level at which the rule holds none.
        The chart below draws the share at 25 against the half-life, one line for each risk aversion, and rings the point where each crosses
        zero. At a risk aversion of 2 that happens at a half-life of 5.0 years. Move the half-life by half a year, from 5 to 5.5, and the share
        at 25 goes from −9% to 98%.
      </p>
    </section>

    <Figure id="fig-edge" title="The share at 25, against the half-life" sub="Drag the half-life, then pick a risk aversion.">
      {#snippet children(w)}
        <EdgeLab width={w} bind:h bind:g />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each ring marks the half-life at which that line reaches zero. The vertical line is the half-life chosen above.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The crossing point moves a long way with risk aversion. At 3 it's 13.9 years and at 4 it's 22.2, so at a risk aversion of 4 the
        25-year-old is short for every half-life we let you pick. That's a fact about our plan, where future pay is 55 times our savings, so a
        small change in the loading swings the answer. It isn't a number from the paper, which reports only that plausible calibrations lead
        the young to short stocks. At a risk aversion of 2 the hump is just as fragile. It lasts only up to a half-life of about 5.8 years, and
        beyond that the share is highest at 25 and falls from there.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our rebuild is much smaller than the paper, in four ways.</p>
      <p>
        First, our rule isn't the paper's solution. It holds the Merton share of everything we own, less the stock our pay already holds. That's
        exact for a one-year investor whose pay moves by these loadings, and only an approximation over a career. The paper solves the whole
        lifetime problem, and we haven't tested its findings.
      </p>
      <p>
        Second, we chose the half-life. The paper takes how tightly pay and dividends are tied from data, so every half-life here is a
        what-if, and we don't say which one is right.
      </p>
      <p>
        Third, we put no limit on borrowing or short selling. A young worker who's short 720% of her savings is short 3.6 years of pay, which
        few people could manage. With the limit from the <a href="../cocco-gomes-maenhout-2005/">previous article</a>, she'd hold nothing for
        as long as the rule says to be short.
      </p>
      <p>
        And finally, the plan is ours. Savings of half a year's pay set against 27 years still to earn is what makes the answer so sensitive, and
        the knife-edge at 5 years belongs to that plan, not to the paper.
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
