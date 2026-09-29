<script>
  /* App.svelte for human-capital */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import LifeLab from "./Components/LifeLab.svelte";
  import katexify from "./katexify.js";

  let age = $state(25);
  let beta = $state(0);
  let cap = $state("none");
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're 25, with half a year's pay in savings and forty years of work ahead of us. How much of those savings should be in
        stocks? The <a href="../samuelson-merton-1969/">previous article</a> showed that for Samuelson's investor the horizon doesn't matter,
        so the answer would be the <a href="../merton-share/">Merton share</a>, about 77% with our usual stocks, at 25 or at 64. But his savings
        were all his wealth. Ours aren't, and that turns out to change the answer by a lot.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Pay we haven't earned yet</h3>
      <p>
        Most of what a young worker owns is her future pay. Economists call it <span class="bold">human capital</span>, and we can put a value
        on it the way we'd value any stream of payments. Let's say our pay is steady and safe, one unit a year until 65, and value it like a
        bond, at a safe rate of 2%. At 25 that's worth about 27 years of pay, fifty-five times our savings. As we work, the paydays left get
        fewer and the value falls, while our savings grow. We'll assume we save a tenth of our pay each year and our savings grow by 4% a year.
      </p>
      <p>
        Now let's apply Merton's rule to everything we own, savings {@html katexify("W")} plus future pay {@html katexify("H")}. The rule asks
        for {@html katexify("\\pi^*(W + H)")} in stocks, and the future pay can't hold any, since it's a bond. So all of it has to come from
        our savings, and the share of savings in stocks is
      </p>
      <div class="math-display">{@html katexify("\\frac{\\pi^*(W + H)}{W} = \\pi^*\\left(1 + \\frac{H}{W}\\right)", true)}</div>
      <p>
        The lab below draws our wealth over a working life, and under it this share. Drag the age from 25 to 65 and watch how fast the share
        falls.
      </p>
    </section>

    <Figure id="fig-life" title="Our wealth and the stocks the rule asks for" sub="Drag the age, then try the other two controls.">
      {#snippet children(w)}
        <LifeLab width={w} bind:age bind:beta bind:cap />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          In the first panel, the blue line is how much the rule wants in stocks, in years of pay. In the second, the same amount as a share of
          savings, which starts far above the top of the chart.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At 25 the rule asks for about 4,300% of our savings in stocks, forty-three times what we have. That sounds absurd, but it's only 77% of
        everything we own, pay included. By our mid-thirties, when future pay is about ten times our savings, the share is down to about 850%.
        It falls below 300% at about 48, below 200% at about 53, and below 100% only at about 62. At 65, with no pay left to come, it's back
        at the Merton share.
      </p>
      <p>
        The first panel shows the same story in money. The rule wants about 21 years of pay in stocks at 25 and about 9 at 65. So it asks for the most stock at the start of our working life, when we have the least savings to hold it in. A saver who keeps 100% of her savings
        in stocks does the opposite, holding almost nothing at 25 and the most at 65.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">When pay moves with the market</h3>
      <p>
        So far our pay has been as safe as a bond. For some jobs it isn't. A stockbroker's bonus, or a job at a company that suffers in a
        downturn, rises and falls with the market. Let's say a share {@html katexify("\\beta")} of our future pay behaves like stocks. Then
        our human capital already holds {@html katexify("\\beta H")} of stocks for us, and our savings need to hold less. With a little
        rearranging, the share becomes
      </p>
      <div class="math-display">{@html katexify("\\pi^* + (\\pi^* - \\beta)\\,\\frac{H}{W}", true)}</div>
      <p>
        In other words, the young should hold more stock than the Merton share only if their pay is less like stocks than the Merton
        portfolio is. If you drag the pay slider to about 77%, you'll see the share go flat at the Merton share for the whole of life. Our
        pay is then a Merton portfolio of its own, so the horizon drops out again. If you drag it to 100%, the rule says to sell stocks
        short until about 47. Still, for a 25-year-old the rule asks for more than all her savings in stocks unless about three quarters of her
        pay moves with the market, and most people's pay is much safer than that.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A limit on borrowing</h3>
      <p>
        Nobody can borrow forty-three times their savings at the safe rate, so the rule runs straight into whatever limit we face. If you
        switch the lab to no borrowing, you'll see the dashed line sit at 100% of savings until about 62 and only then follow the rule down. With
        a limit of 200%, which is roughly what a margin account allows, it sits at the limit until about 53.
      </p>
      <p>
        So for a young saver with safe pay, the interesting question isn't whether to hold stocks, or even whether to hold only stocks. It's
        how close to the limit to go and how to get there, since borrowing costs more than the safe rate and some ways of borrowing are much
        riskier than others. That's where the rest of this section goes.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our lab is a clean version of a messy problem, in three ways.</p>
      <p>
        First, real pay isn't as safe as a bond. We can lose a job or fall ill, and a career can stall. Risk like that isn't tied to the stock
        market, so it doesn't make pay stock-like, but it does make it worth less as a bond, which shrinks the extra stock the rule asks for.
      </p>
      <p>
        Second, our savings follow a fixed plan, growing by 4% a year. In practice they'd rise and fall with the stocks we hold, and the rule
        would rebalance as they do, holding less after a crash and more after a boom.
      </p>
      <p>
        And finally, the rule assumes we can borrow at the safe rate and never be forced to sell. Neither is true for most of us, and the next
        articles put a price on both.
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
