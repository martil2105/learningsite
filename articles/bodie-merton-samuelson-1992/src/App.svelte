<script>
  /* App.svelte for bodie-merton-samuelson-1992 */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import PaperCard from "./Components/PaperCard.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import FlexLab from "./Components/FlexLab.svelte";
  import AcrossLab from "./Components/AcrossLab.svelte";
  import katexify from "./katexify.js";

  // shared by both figures, so a setting chosen in one carries to the other
  let a = $state(0.5);
  let g = $state(2);
  let ret = $state(-0.2);
  let W = $state(1);
  let n = $state(30);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <PaperCard link="https://ideas.repec.org/a/eee/dyncon/v16y1992i3-4p427-449.html">
    {#snippet cite()}
      Bodie, Z., Merton, R. C. and Samuelson, W. F. (1992), "Labor supply flexibility and portfolio choice in a life cycle model",
      <em>Journal of Economic Dynamics and Control</em>, 16(3–4), 427–449.
    {/snippet}
    {#snippet claims()}
      Being able to change our hours is a kind of insurance. If a bad year in the market can be paid for partly by working more, we can afford
      to take more risk with our savings beforehand. The paper uses the idea to explain why the young may hold more stock, and why consumption
      stays steadier than asset prices.
    {/snippet}
    {#snippet rebuild()}
      A version of the worker's problem that's simple enough to solve by hand, with one weight on consumption and one on leisure. It gives a
      single number for how much more stock the flexible worker holds, and it shows where that number comes from.
    {/snippet}
    {#snippet later()}
      Later work put flexible hours into models with risky pay, borrowing limits and a choice of when to retire. Gomes, Kotlikoff and Viceira
      (2008), for one, used a life-cycle model with flexible labour supply for a welfare analysis of life-cycle funds. Our rebuild leaves all of
      that out.
    {/snippet}
  </PaperCard>

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say two of us have the same job, the same savings and thirty years of work ahead, and that we work the same hours this year. The
        only difference is in the contract. One of us can work more or fewer hours whenever we like, and the other is stuck with this year's
        hours for good. When we each decide how much of our savings to put in stocks, should the two answers be the same? Before we look at
        what Bodie, Merton and Samuelson found, have a guess.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Hours are a second asset</h3>
      <p>
        Let's start with what a bad year in the market costs us. If our stocks fall, we have less to spend, and the obvious response is to
        consume less. If our hours are ours to choose, though, there's a second response: we can work more. Working more costs us leisure
        instead of consumption, so the loss is shared between the two. A worker who can't change her hours has only the first way out, and
        the whole loss lands on her consumption.
      </p>
      <p>
        To put numbers on that, we'll let our workers care about both. Each year a worker enjoys some consumption {@html katexify("C")} and some
        leisure {@html katexify("L")}, and she weighs them with a <span class="bold">Cobb–Douglas</span> utility, which puts a weight
        {@html katexify("a")} on consumption and {@html katexify("1-a")} on leisure:
      </p>
      <div class="math-display">{@html katexify("u(C, L) = \\frac{\\left(C^{a}L^{1-a}\\right)^{1-\\gamma}}{1-\\gamma}", true)}</div>
      <p>
        Here {@html katexify("\\gamma")} is her risk aversion, as in the <a href="../merton-share/">Merton share</a> article. Leisure isn't free.
        A year has one unit of time, and every unit she doesn't work costs her a unit of pay. We'll count pay in years of full-time pay, keep
        it as safe as a bond, and value it at 2%, the way we did in the <a href="../human-capital/">human capital</a> article. Thirty years of
        full-time pay are then worth about 22.4 years of pay, and we'll call that number {@html katexify("A")}.
      </p>
      <p>
        Now let's count what each of us owns. The flexible worker owns her savings {@html katexify("W")} plus all of her time, leisure
        included, which comes to {@html katexify("W + A")}, since any of it can be sold. The fixed worker owns her savings plus the pay from
        the hours {@html katexify("h")} she's stuck with, which comes to {@html katexify("W + hA")}.
      </p>
      <p>
        We'll also have both workers plan to spend what they own evenly over the years left. That fixes what they spend each year at
        {@html katexify("(W+A)/A")}. The flexible worker puts the share {@html katexify("1-a")} of it into leisure, so she works
      </p>
      <div class="math-display">{@html katexify("h = 1 - (1-a)\\,\\frac{W+A}{A} = a - (1-a)\\,\\frac{W}{A}", true)}</div>
      <p>
        of the year. With {@html katexify("a = \\tfrac12")}, one year's pay saved and thirty years to go, that's about 48% of full time. The
        fixed worker is stuck with those same hours, and she spends the same amount on consumption too.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Two workers, one bad year</h3>
      <p>
        Let's put the two workers side by side. Both have one year's pay saved, thirty years to go, the same hours and the same spending. Each
        holds the amount of stock that suits her, and we'll work out where those amounts come from in a moment. For now, let's take them as
        given, give the stocks a year, measured by how far they finish above or below the safe rate, and watch each worker re-plan. Drag the first slider to give the market a good or
        a bad year.
      </p>
    </section>

    <Figure id="fig-flex" title="Two workers and a year in the market" sub="Drag the market's year, then try the other two controls.">
      {#snippet children(w)}
        <FlexLab width={w} bind:a bind:g bind:ret />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The first chart shows what each worker consumes next year, and the second how many hours she works, both against the plan we made
          before the year began.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Let's take a bad year, with stocks 20% behind the safe rate. The flexible worker's hours rise from 48% of full time to about 56%, and
        her consumption falls by about 15%. The fixed worker can't work more, so her consumption takes the whole loss and falls by about 21%.
        That's the surprising part. She holds a third fewer stocks, about 12 years of pay against 18, and yet her consumption is exposed a
        third more.
      </p>
      <p>
        This is what the paper means by hours as insurance. For the same move in the market, the flexible worker's consumption swings less,
        so she can afford to hold more stock in the first place. If you drag the market's year up instead, you'll see the reverse: she works
        fewer hours and takes some of the gain as leisure. And if you raise the risk aversion to 10, you'll see the two workers hold almost the
        same stocks, about 1.1 times as much for the flexible one. The fixed worker's consumption still swings about 1.8 times as much.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Where the gap comes from</h3>
      <p>
        Both workers are Merton investors, so let's find each one's risk aversion and wealth, starting with the flexible worker. Once she
        splits her spending the best way between consumption and leisure, the Cobb–Douglas weights make the value of spending {@html katexify("x")}
        proportional to {@html katexify("x^{1-\\gamma}")}. So as far as her stocks go, spending is a single good with risk aversion
        {@html katexify("\\gamma")}, and her wealth is everything she owns. Her stocks are the Merton share of that:
      </p>
      <div class="math-display">{@html katexify("\\frac{\\mu - r}{\\gamma\\sigma^2}\\,(W + A)", true)}</div>
      <p>
        The fixed worker's problem is different. Her leisure is stuck, so only consumption is left to vary, and her utility is proportional to
        {@html katexify("C^{a(1-\\gamma)}")}. That's the same shape as before with a new risk aversion:
      </p>
      <div class="math-display">{@html katexify("\\gamma_C = 1 - a(1-\\gamma)", true)}</div>
      <p>
        With {@html katexify("a = \\tfrac12")} and {@html katexify("\\gamma = 2")} that's 1.5. It's lower than {@html katexify("\\gamma")}
        because consumption is only part of what she cares about. What she owns is {@html katexify("W + hA")}, which by our spending plan
        comes to {@html katexify("a(W+A)")}. So her stocks are
      </p>
      <div class="math-display">{@html katexify("\\frac{\\mu - r}{\\gamma_C\\sigma^2}\\,a\\,(W + A)", true)}</div>
      <p>
        Now we can divide the flexible worker's stocks by hers. The savings, the years left and the premium over volatility all cancel, and
        what's left is
      </p>
      <div class="math-display">{@html katexify("\\frac{\\gamma_C}{a\\gamma} = 1 + \\frac{1-a}{a\\gamma}", true)}</div>
      <p>
        With {@html katexify("a = \\tfrac12")} and {@html katexify("\\gamma = 2")} that's 1.5, the ratio of 18 to 12 in the lab. The gap is
        bigger when we care more about leisure, because there's more of our wellbeing that hours can protect, and it shrinks as we get more
        risk averse.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Does it depend on how much we've saved?</h3>
      <p>
        Nothing in that ratio mentions our savings or the years we have left, so let's test it. The chart below draws both workers' stocks at
        every level of savings, for four different numbers of years left. Drag the savings slider along, and you'll see the ratio in the
        readout stay where it is.
      </p>
    </section>

    <Figure id="fig-across" title="The same gap at every level of savings" sub="Drag the savings, then change the years left.">
      {#snippet children(w)}
        <AcrossLab width={w} bind:a bind:g bind:W bind:n />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The dashed line marks the savings at which a worker who spends evenly stops working. Past it our formulas no longer apply.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Both lines rise with savings, and the blue one stays a fixed multiple above the pink one all the way along. Our hours fall as we
        save, since leisure is something we buy with wealth, and the second chart shows them reaching zero. With thirty years to go that
        happens at about 22 years of pay saved, and past it the worker has retired and our formulas stop. If you choose ten years left, you'll
        see the dashed line move in to about 9 years of pay.
      </p>
      <p>
        The gap is a fixed share of everything we own, so it's biggest, compared with our savings, when most of what we own is time. That's
        one reason the young may hold more stock than the old, and it's the same reason the human capital article found, now with hours in it.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our rebuild is much smaller than the paper, in four ways.</p>
      <p>
        First, Cobb–Douglas is the simplest utility that gives a clean answer. It fixes the split of spending between consumption and leisure
        for good, and the neat factor goes with it if we change the weights over time or let leisure matter more as we age.
      </p>
      <p>
        Second, we had both workers spend what they own evenly over the years left, and that choice sets today's hours. If they plan to spend a
        fifth faster, the flexible worker holds about 1.9 times what the other does, and if a fifth slower, about 1.25 times. With
        {@html katexify("\\gamma = 2")} she holds less only if she plans to spend under half the even rate.
      </p>
      <p>
        Third, our hours can move freely, in any amount, at the same wage. Real hours are lumpy, since many jobs offer full time or nothing,
        and extra hours can be hardest to find in the very downturns when we'd want them.
      </p>
      <p>
        And finally, we kept pay as safe as a bond and let both workers borrow at the safe rate. Neither is true for most of us, and the next
        article, on Cocco, Gomes and Maenhout, takes both seriously.
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
