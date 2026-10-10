<script>
  /* App.svelte for credit-spread-puzzle */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import HistoryFigure from "./Components/HistoryFigure.svelte";
  import ModelLab from "./Components/ModelLab.svelte";
  import MultipleFigure from "./Components/MultipleFigure.svelte";
  import NoiseFigure from "./Components/NoiseFigure.svelte";
  import katexify from "./katexify.js";

  let corr = $state(0.5);
  let sharpe = $state(0.43);
  let theta = $derived(corr * sharpe);
  const lossEq = katexify("s = -\\frac{1}{T} \\ln\\big(1 - P\\,(1 - R)\\big)", true);
  const shiftEq = katexify("\\text{market's chance} = N\\big(N^{-1}(P) + \\lambda \\sqrt{T}\\big), \\qquad \\lambda = \\text{correlation} \\times \\text{the market's Sharpe ratio}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        When a company borrows by selling bonds, it pays a higher yield than the government does, because it might not pay at all. The extra
        yield is the bond's <span class="bold">credit spread</span>. The obvious explanation is that it covers what we'd expect defaults to cost lenders on average, the way an insurance premium covers the claims an insurer expects. Let's test that with a century of data.
      </p>
      <p>
        Moody's has published the average yields of long-term corporate bonds rated Aaa and Baa every month since 1919. Its safest
        grade is Aaa, and Baa is the lowest grade that still counts as investment grade. Let's look at how much more Baa bonds yielded than Aaa bonds, month by month.
      </p>
    </section>

    <Figure id="fig-history" title="A century of Baa over Aaa" sub="Switch the years to average over.">
      {#snippet children(w)}
        <HistoryFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The black line is each month's gap between the two yields, and the blue line is its average over the shaded years. The dashed line is
          how much of the gap expected defaults explain, which we'll work out in the next section.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Over the whole century, Baa bonds yielded 1.16 points a year more than Aaa bonds, and that's the number we want to explain. As we'd expect, the gap jumps when defaults are most feared. It reached 5.64 points in May 1932 and 3.38 points in December 2008. But it never closes: even its narrowest month, January 1966, paid 0.32 points. If you switch to 2002 to 2026, you'll see the gap averaged 1.01 points, a little less than over the whole century, with the 2008 crisis as its peak.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What defaults cost</h3>
      <p>
        To judge whether 1.16 points is a lot, we need to know how often these bonds default and how much is lost when they do. Moody's follows every firm it rates, which gives us both numbers. Of the firms rated Baa in 1970 to 2001, 4.89% defaulted within ten years, against 0.63% of the firms rated Aaa.
        When a firm defaults, holders of its senior unsecured bonds have recovered about 44.9 cents on the dollar, so they lose 55.1 cents. If
        a lender expects to lose a share {@html katexify("P\\,(1 - R)")} of the money over {@html katexify("T")} years, the extra yield that
        just covers it is:
      </p>
      <div class="math-display">{@html lossEq}</div>
      <p>
        We get 0.27 points a year for Baa bonds and 0.035 for Aaa bonds, so defaults explain a gap of only 0.24 points between them, the dashed line in the chart. We're comparing Baa with Aaa rather than with government bonds because both are long corporate bonds, averaged the same way, so most of what they have in common cancels out. If you switch the chart to 1970 to 2001, the same years as the default rates, you'll see the gap averaged 1.09
        points, 4.6 times what defaults cost. This is the <span class="bold">credit spread puzzle</span>: corporate bonds pay several times the
        losses their defaults cause.
      </p>
      <p>
        But should we expect anything else? A lender who's paid exactly the expected loss is paid nothing for taking the risk. So let's ask how
        much a model of default thinks that risk is worth. Here's a question first.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Paying for when defaults happen</h3>
      <p>
        In the previous article, we found that the market's chance of default sits a fixed distance from the real chance on the normal curve,
        {@html katexify("\\lambda \\sqrt{T}")} standard deviations. Bonds are priced with the market's chance, so in our model a lender is paid as if the bond defaults with the market's chance rather than the real one. The market's chance is higher because defaults tend
        to happen in bad times, when losing money hurts most.
      </p>
      <p>
        For a bond, the {@html katexify("\\lambda")} that matters is the firm's correlation with the market times the market's own Sharpe
        ratio, since only the part of a firm's risk that moves with the market earns a premium:
      </p>
      <div class="math-display">{@html shiftEq}</div>
      <p>
        Long Chen, Pierre Collin-Dufresne and Robert Goldstein used a correlation of 0.5 and a Sharpe ratio of 0.43 in 2009. That gives us {@html katexify("\\lambda")} = 0.215, and over ten years it moves the market's chance 0.68 standard deviations out from the real one.
        You can change both numbers in the lab below.
      </p>
    </section>

    <Figure id="fig-model" title="What a model of default pays" sub="Drag the correlation and the market's Sharpe ratio.">
      {#snippet children(w)}
        <ModelLab width={w} bind:corr bind:sharpe />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar is the model's spread over ten years: grey pays for expected losses and blue pays for when defaults happen. The pink line is
          what Baa bonds really paid over Aaa bonds in 1970 to 2001.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With the sliders where they start, the market's chance of a Baa default within ten years is 16.5%, more than three times the real
        4.89%, and the model's Baa spread is 0.95 points a year. For Aaa bonds it's 0.19 points. So the model's gap between them is 0.76
        points, 69% of what Baa bonds really paid over Aaa bonds. Paying lenders for when defaults happen takes us most of the way from 0.24 to 1.09 points.
      </p>
      <p>
        Notice how the bars are built. For Baa bonds the blue part is about two and a half times the grey part, and for Aaa bonds it's about four and a half times. If you drag the correlation to zero, the blue parts vanish and we're back to the 0.24 points that expected losses explain, since a bond that doesn't move with the market earns no premium in this model.</p><p>How far is the rest? If you drag the correlation up to 0.7, the model explains 99% of the 1.09 points. Keeping the correlation at 0.5, we'd
        need a market Sharpe ratio of 0.61, about 40% more than the 0.43 we started with.
      </p>
    </section>

    <Figure id="fig-multiple" title="Spreads as a multiple of expected losses" sub="Switch the horizon.">
      {#snippet children(w)}
        <MultipleFigure width={w} {theta} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The curve is the model's spread divided by what expected defaults cost, at the correlation and Sharpe ratio set in the lab above. The
          dots are Aaa and Baa bonds.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        This answers our question. The model pays Aaa bonds 5.56 times their expected loss and Baa bonds 3.48 times. The market's chance sits
        a fixed distance from the real chance on the normal curve, so the ratio between them is largest far out in the tail, which is where the
        safest bonds live. So the safest bonds should have the biggest multiples, and "spreads are several times expected losses" is what a
        model of default predicts, not a puzzle in itself. If you switch the horizon to four years, both multiples shrink, to 4.34 and 2.73,
        because the distance grows with the square root of time.
      </p>
      <p>
        The real puzzle is narrower. It's that the spreads we see are bigger still than a sensible price of risk can explain, and the shortfall
        is largest for short-term bonds. Jing-Zhi Huang and Ming Huang found in 2012 that across a range of models, credit risk explained only a small part of investment-grade spreads, and a smaller part at short maturities. It explained much more of the spreads on junk bonds. Chen, Collin-Dufresne and Goldstein argued that the missing piece is timing. Defaults bunch up in recessions, which is exactly
        when investors fear losses most, so the price of risk rises just when defaults do.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How sure is 4.89%?</h3>
      <p>
        So far we've treated 4.89% as known. It comes from 32 years of Moody's records, and that's less information than it looks. Defaults
        come in waves, since a recession hits many firms at once. So the firms in one year's group don't default independently of each other, and the groups formed in neighbouring years share most of their ten years. Our 32 years hold far fewer independent pieces of evidence than the thousands of firms in them suggest.
      </p>
      <p>
        Let's build a world where we know the answer. Each year a common shock hits every firm, and each firm also has its own luck, as in
        <span class="bold">Oldřich Vašíček's one-factor model</span> of defaults. Baa firms in our world default within ten years exactly
        4.89% of the time. A 32-year record averages the ten-year default rates of the groups formed in its first 23 years, the way Moody's
        averages its own, and we've generated 2,000 such records.
      </p>
    </section>

    <Figure id="fig-noise" title="What 32 years of records can show" sub="Drag how much firms' fortunes move together.">
      {#snippet children(w)}
        <NoiseFigure width={w} {theta} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar counts simulated 32-year records by the ten-year default rate they show, with any above 20% in the last bar. The dashed line
          is the true rate, and the blue band holds the middle 90% of records.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With firms' fortunes moving together with a correlation of 0.15, the middle 90% of records show anything from 1.7% to 10.1%. Bank
        regulators' rules for large firms assume correlations between 0.12 and 0.24, so this isn't an extreme setting. Over that range of
        default rates, the model's Baa spread runs from 0.43 to 1.64 points, wide enough to hold almost anything we might compare it with. The
        typical record also comes in low, at 4.39%, because a 32-year record usually misses the worst decade: 59% of our records show less than the true 4.89%. If you drag the correlation down to 0.05, the band narrows to 2.9% to 7.6%, and at 0.3 it stretches from 0.9% to 13.0%.
      </p>
      <p>
        Peter Feldhütter and Stephen Schaefer made a version of this argument in 2018. Estimating default rates from a longer history, and
        borrowing strength from neighbouring ratings, they found that Black and Cox's model matched the level of investment-grade spreads well.
        What's left unexplained is in junk bonds, whose model spreads are too low, partly because those bonds are hard to trade.</p><p>None of this says that spreads are fair. It says that with only a few decades of defaults to go on, we can't easily tell a model that's off by half from one that's right. So it's worth being careful with any claim about exactly how much of a spread is unexplained.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our comparison was simple, and a few things in it deserve a second look.</p>
      <p>
        First, Moody's yields are averages of long bonds, with 20 years or more to run, while our default rates are for ten years. The bonds in
        each average also change over time as they're upgraded, downgraded or repaid early. Comparing Baa with Aaa, rather than with government
        bonds, takes out much of what the two have in common.
      </p>
      <p>
        Second, we kept the recovery fixed at 44.9 cents. Recoveries are lower in recessions, when defaults are many, so defaults cost more
        exactly when they bunch.
      </p>
      <p>
        Third, our model only lets a firm default when its debt is due, and it uses one price of risk for every year. Chen, Collin-Dufresne and
        Goldstein's version of Black and Cox's model gives 0.90 points for Baa and 0.18 for Aaa at the same inputs, close to our 0.95 and 0.19.
      </p>
      <p>
        And finally, part of what corporate bonds pay over government bonds has nothing to do with default. Edwin Elton and his coauthors found in 2001 that state taxes explain a large part of the spread over Treasuries, since interest on US government bonds is exempt from them. Much of the rest, they found, moves with the same things as the risk premium on shares.
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
