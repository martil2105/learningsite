<script>
  /* App.svelte for npv-vs-irr */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import GuessCard from "./Components/GuessCard.svelte";
  import RateLab from "./Components/RateLab.svelte";
  import ReinvestFigure from "./Components/ReinvestFigure.svelte";
  import MineFigure from "./Components/MineFigure.svelte";
  import katexify from "./katexify.js";

  const npvEq = katexify("\\text{NPV}(r) = \\sum_{t=0}^{T} \\frac{c_t}{(1+r)^t}", true);
  const balEq = katexify("C_0 = 100, \\qquad C_t = C_{t-1}\\,(1+k) - c_t, \\qquad C_T = 0", true);
  const hazenEq = katexify("\\text{NPV}(r) = (k - r) \\times \\sum_{t=0}^{T-1} \\frac{C_t}{(1+r)^{t+1}}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        We have $100 to invest and two projects competing for it. The first pays us back $150 a year from now. The second pays
        nothing for four years and then $300 in year five. Money costs us 10% a year, which is what we could earn elsewhere at the same risk.
      </p>
      <p>
        There are two common ways to score a project. Its <span class="bold">net present value</span>, or NPV, is everything it pays us,
        discounted back to today at our 10%, minus what it costs. Its <span class="bold">internal rate of return</span>, or IRR, is the discount
        rate at which that NPV would be zero, so it's the rate of return the project earns on its own. The two rules agree on whether a single
        project is worth doing. They can disagree, though, on which of two projects is better. Have a guess which way they point here.
      </p>
    </section>

    <GuessCard />

    <section class="body-text">
      <h3 class="body-header">Two scores for one project</h3>
      <p>
        Let's work out both. If a project pays us {@html katexify("c_t")} in year {@html katexify("t")}, with the outlay as a negative
        {@html katexify("c_0")}, its NPV at a cost of capital {@html katexify("r")} is
      </p>
      <div class="math-display">{@html npvEq}</div>
      <p>
        and its IRR is the {@html katexify("r")} that makes this zero. At 10%, Quick's $150 is worth $136.36 today, so its NPV is $36.36, and
        its IRR is the rate that turns $100 into $150 in a year, which is 50%. Slow's $300 in five years is worth $186.28 today, so its NPV is
        $86.28, and its IRR is the rate that turns $100 into $300 in five years, which is 24.6%.
      </p>
      <p>
        So Quick has the higher IRR, and Slow the higher NPV. The NPV is the score that counts money: it says Slow makes us $86.28 richer today
        and Quick only $36.36. But the IRR isn't wrong about anything either. Quick really does earn 50% a year. It just doesn't earn it for
        long, and that's the part the IRR can't see.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Heights and areas</h3>
      <p>
        There's a neat way to put the two scores side by side. Let's treat a project as an account that earns its own IRR, which we'll call
        {@html katexify("k")}. The account starts with the $100 we put in, grows at {@html katexify("k")} every year, and pays out whatever the
        project pays us:
      </p>
      <div class="math-display">{@html balEq}</div>
      <p>
        Because {@html katexify("k")} is the rate that makes everything balance, the account ends at zero. Then, at any cost of capital
        {@html katexify("r")},
      </p>
      <div class="math-display">{@html hazenEq}</div>
      <p>
        The sum counts how much money the project keeps tied up, and for how long, in <span class="bold">dollar-years</span> discounted to
        today. So the NPV is the IRR's margin over our cost of capital, times the money tied up. Gordon Hazen published this identity in 2003.
      </p>
      <p>
        Quick ties up $100 for one year, which is 90.9 dollar-years at today's value, at a margin of 40 points. Slow's account grows at 24.6%
        for five years before it pays out, so it ties up 592.0 dollar-years at a margin of 14.6 points. In other words, ranking by IRR compares
        the heights of two rectangles, and ranking by NPV compares their areas.
      </p>
    </section>

    <Figure id="fig-rate" title="NPV and IRR, as heights and areas" sub="Drag the cost of capital, then switch to the other pair of projects.">
      {#snippet children(w)}
        <RateLab width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The first chart is each project's NPV at every cost of capital, with its IRR where the curve meets zero. In the second, each rectangle
          is as wide as the money the project ties up and as tall as its margin, so its area is its NPV.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At 10%, Slow's rectangle is much flatter than Quick's but more than six times as wide, so its area wins. If you drag the cost of
        capital up, both rectangles lose the same amount of height, which hurts the flat one far more. Slow's also gets narrower faster,
        because more of its money is tied up further in the future. At 18.9% the two areas match, and that's
        exactly where the two NPV curves cross in the first chart. Above it Quick wins, and past 24.6% Slow's rectangle drops below zero.
      </p>
      <p>
        The crossover has a meaning of its own. Slow is the same as Quick plus a second project that puts in $150 in year one and gets $300
        back in year five, and that second project has an IRR of 18.9%. So the rankings flip at the IRR of the difference between the two.
      </p>
      <p>
        If you switch to the second pair, you'll see the same picture with a different cause. Both projects last a year, but Large is ten
        times the size of Small. At 10% its margin is 20 points against Small's 40, and its rectangle is ten times as wide, so its NPV is
        $181.82 against $36.36. This time the rankings flip at 27.8%.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Does the IRR assume reinvestment?</h3>
      <p>
        You'll often read that the IRR assumes the money a project pays back is reinvested at the IRR. Our identity doesn't need anything like
        that, since both scores are just properties of the cash flows. But the claim points at a real question. Quick gives us $150 back after
        a year, and Slow keeps our money for four more. What would we do with Quick's money in the meantime?
      </p>
    </section>

    <Figure id="fig-reinvest" title="What Quick's money grows to by year five" sub="Drag the rate we earn on Quick's $150 for the four years after it pays.">
      {#snippet children(w)}
        <ReinvestFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The blue bar is Quick's payout grown at the rate on the slider, and the pink bar is what Slow pays at the same date.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At our 10%, Quick's $150 grows to $219.62 by year five, well short of Slow's $300. To catch up, we'd need to earn 18.9% on it, which is
        the crossover rate again. So the NPV at 10% has already answered the reinvestment question, because 10% is what money earns us
        elsewhere. If we really could earn 18.9% on it, that would be our cost of capital, and Quick would win on NPV too.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A project with two IRRs</h3>
      <p>
        When a project's cash flows change sign more than once, its NPV can be zero at more than one rate. Let's say we dig a mine for $100,
        sell $520 of ore next year, and pay $480 the year after to restore the land. The mine's NPV is zero at two rates, 20% and 300%, so it
        has two IRRs.
      </p>
    </section>

    <Figure id="fig-mine" title="The mine's NPV" sub="Drag the cost of capital.">
      {#snippet children(w)}
        <MineFigure width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The two open dots are the mine's IRRs. The readouts apply the identity at each one: the money tied up, times the margin, gives the same
          NPV both times.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At our 10% the mine loses $23.97, even though both of its IRRs are higher than 10%. The identity tells us why. If we run the mine as an
        account at 20%, the balance after the first year is −$400, because the mine has handed us more than we put in. For its second year,
        then, it's lending to us at 20%, and the money tied up comes out negative, at −239.67 dollar-years. A positive margin times a negative
        amount is a loss. At the 300% IRR the account looks different, but the product is the same −$23.97.
      </p>
      <p>
        So a high IRR on a project like this is a high interest rate that we pay, and borrowing at 20% when money costs us 10% is a bad deal.
        If you drag the cost of capital, you'll see the mine is only worth digging when the cost of capital lies between its two IRRs.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our projects are tidy, and four things about real ones are missing.</p>
      <p>
        First, we used one cost of capital for every year. We discounted Slow's payment in year five at the same 10% as Quick's in year one.
        When rates differ by horizon, the NPV should discount each year at its own rate, and the IRR has no single rate to be compared with.
      </p>
      <p>
        Second, the IRR can be moved by timing alone. Let's say a private equity fund calls $100 from its investors today and returns $200 in
        five years, an IRR of 14.9%. If it borrows the first year's money on a credit line at 3% and calls it a year later, the investors' IRR
        rises to 18.0%, while what they get back per dollar falls from 2.00 to 1.94. For investors whose money costs them 3%, the NPV doesn't
        change at all.
      </p>
      <p>
        Third, the NPV rule assumes we can fund every project worth doing. When money is rationed, we want the most NPV per dollar we can
        spend, which is a different ranking again.
      </p>
      <p>
        And finally, some cash flows have no IRR at all. A project that pays us $100 now, costs $250 next year and pays $200 the year after
        has a positive NPV at every rate. So the IRR rule has nothing to say about it, while the NPV still does.
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
