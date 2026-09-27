<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import GuessFigure from "./Components/GuessFigure.svelte";
  import BasketLab from "./Components/BasketLab.svelte";
  import SquareLawFigure from "./Components/SquareLawFigure.svelte";
  import ChainFigure from "./Components/ChainFigure.svelte";
  import katexify from "./katexify.js";

  const trueIdx = katexify(`P^{*} = \\Big(\\sum_i w_i\\, r_i^{\\,1-\\sigma}\\Big)^{\\frac{1}{1-\\sigma}}`, true);
  const las = katexify(`P_L = \\sum_i w_i\\, r_i, \\qquad P_P = \\Big(\\sum_i w_i' \\,/\\, r_i\\Big)^{-1}, \\qquad P_F = \\sqrt{P_L\\,P_P}`, true);
  const square = katexify(`\\ln P_L - \\ln P^{*} \\;\\approx\\; \\tfrac12\\,\\sigma\\,\\operatorname{Var}_w(\\ln r)`, true);
  const two = katexify(`\\operatorname{Var}_w(\\ln r) = w\\,(1-w)\\,(\\ln R)^2`, true);
  const reversal = katexify(`P_F(0,1)\\,P_F(1,0) = 1, \\qquad P_L(0,1)\\,P_L(1,0) \\ge 1`, true);
  const sigma = katexify(`\\sigma`);
  const ri = katexify(`r_i`);
  const wi = katexify(`w_i`);
  const wpi = katexify(`w_i'`);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Let's say that last year you spent a fifth of your budget on energy, for
      heating, electricity and fuel, and the other four-fifths on everything
      else. This year the price of energy doubles, and nothing else changes
      price. Here's a question that sounds as if it should have one answer: how
      much more income would you need this year to be exactly as well off as you
      were last year?
    </p>
    <p>
      The obvious answer is 20%, because that's what it would cost to buy last
      year's shopping again. Take a moment to make your own guess before we
      look at it more carefully.
    </p>
  </section>

  <GuessFigure />

  <section class="body-text">
    <p>
      The right answer depends on something about you that the question didn't
      mention, which is how readily you'd switch away from energy now that it
      costs more. Economists measure that with the
      <span class="bold">elasticity of substitution</span>, written {@html sigma},
      which says how much the ratio of what you buy of two goods changes when
      their relative price changes. At {@html sigma} = 0 you never switch, so you
      need the full 20%. At {@html sigma} = 1, which is the case where you
      always spend the same share of your budget on each good, you need 14.9%.
      At {@html sigma} = 2 you need only 11.1%. The amount you'd need is called
      the <span class="bold">true cost-of-living index</span>, and the 20% from
      buying last year's shopping again is only right for someone who never
      switches.
    </p>
    <p>
      That's the textbook's lesson about price indices, and it's usually stated
      in one line: a fixed basket overstates the cost of living, because people
      substitute away from what got dearer. It's true, and in the rest of this
      article we'll see exactly how big the overstatement is, why it's often
      small, and a way around it that doesn't need to know {@html sigma} at all.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The household's choice</h3>
    <p>
      The figure below draws the problem. Last year's basket is the point
      <b>A</b>, and the grey curve through it is every basket that would leave
      you exactly as well off as <b>A</b> did, which is called an
      <span class="bold">indifference curve</span>. The red line runs through
      <b>A</b> at this year's prices, so every basket on it costs what last
      year's shopping costs now. That's the fixed-basket answer, which
      statisticians call the <span class="bold">Laspeyres index</span>.
    </p>
    <p>
      But you don't have to buy <b>A</b>. The cheapest basket that's just as
      good is the point <b>B</b>, where a line with the same slope only just
      touches the curve, and that dashed line is what the true index costs. The
      gap between the two parallel lines is the overstatement. Drag the
      elasticity and watch <b>B</b> slide along the curve. The more readily you
      switch, the further <b>B</b> moves from <b>A</b>, and the wider the gap
      becomes.
    </p>
  </section>

  <BasketLab />

  <section class="body-text">
    <p>
      There's a second standard index in the chart. The
      <span class="bold">Paasche index</span> uses this year's basket instead of
      last year's: it asks how much more <b>B</b> costs now than it would have
      cost last year. Since <b>B</b> is not the cheapest good-enough basket at
      last year's prices, Paasche errs in the other direction, and for this
      household it always lands below the truth. At {@html sigma} = 1 it says
      11.1%, against a true 14.9% and a fixed-basket 20%.
    </p>
    <p>
      So the two indices a statistician can compute bracket the right answer,
      and where the answer sits inside the bracket depends on {@html sigma},
      which no survey of prices and purchases records directly. That sounds like
      the end of the story, and the rest of this article is about why it isn't.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">How big is the overstatement?</h3>
    <p>
      If you set energy's multiplier back to 1 in the lab, every index agrees,
      whatever {@html sigma} is. The same happens if every price rises by the
      same proportion, because then there's no reason to switch between goods,
      and a fixed basket is exactly right. The overstatement comes entirely from
      prices moving apart, and it turns out to have a simple size. In log
      points, it's approximately half of {@html sigma} times the variance of the
      price changes across goods, weighted by budget shares.
    </p>
    <p>
      The figure below plots the overstatement against the size of the energy
      shock on logarithmic axes, one solid line for each value of
      {@html sigma}. The lines are straight with a slope of 2, which is the
      signature of a square law: halve the shock and the overstatement falls to
      a quarter, and a larger {@html sigma} shifts the whole line up in
      proportion.
    </p>
  </section>

  <SquareLawFigure />

  <section class="body-text">
    <p>
      That's why the bias is small in an ordinary year. If relative prices move
      apart by about 5%, in the sense of a standard deviation of the price
      changes across the basket, and {@html sigma} is 1, the overstatement is
      about 0.125 of a percentage point a year. The Boskin Commission's review
      of the American consumer price index in 1996 estimated a total upward
      bias of 1.1 points a year, of which only 0.15 came from substitution
      between broad categories of goods. Most of the rest came from new
      products and quality changes, which no choice of formula fixes. A shock
      that doubles one price is a different matter, since it's far out on the
      horizontal axis, where the overstatement is measured in whole points.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">An answer that doesn't need σ</h3>
    <p>
      Now for the dashed lines in the same figure. They belong to the
      <span class="bold">Fisher index</span>, which is simply the geometric mean
      of the Laspeyres and Paasche indices, so it can be computed from prices
      and the two baskets actually bought, with no knowledge of
      {@html sigma}. Its error is far smaller: when energy's price rises by 5%
      and {@html sigma} is 1, it's about a hundred times smaller than the fixed
      basket's. Its lines also have a slope of 3 rather than 2, so it shrinks
      eight times over when the shock is halved, and the advantage grows as
      shocks get smaller.
    </p>
    <p>
      You can see the same thing in the lab. With energy doubling and
      {@html sigma} = 1, Fisher says 15.5% against the true 14.9%, which closes
      88% of the fixed basket's gap. With a 25% rise in energy instead, it says
      4.58% against a true 4.56%, closing 96% of it. And if you drag
      {@html sigma} anywhere between 0 and 3, the Fisher bar follows the truth,
      because the household's new basket carries the information about how it
      switched. Fisher is exact when {@html sigma} = 0, since the two baskets
      are then the same.
    </p>
    <p>
      Why does averaging two wrong answers give a nearly right one? For small
      price changes, the Laspeyres and Paasche errors are almost exactly equal
      and opposite, and a geometric mean cancels the equal parts. What's left
      over is the difference between the two errors, which is a whole order
      smaller. Indices with this property, which approximate the true index to
      second order for any smooth homothetic preferences, are called
      <span class="bold">superlative</span>, a term due to Erwin Diewert, and
      Fisher and the closely related Törnqvist index are the two in common use.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Chaining, and where it breaks</h3>
    <p>
      The other fix statisticians use is to update the basket often. Instead of
      comparing this December with last December, they compare each month with
      the one before and multiply the monthly changes together, which is called
      <span class="bold">chaining</span>. When energy doubles in twelve equal
      monthly steps, chaining brings the fixed basket down from 20% to 15.2%,
      and chained Fisher lands within a few thousandths of a point of the true
      14.9%. Each month's price change is small, and the square law makes each
      month's error smaller still.
    </p>
    <p>
      But chaining has a failure of its own, and you can see it by switching
      the figure to a good that goes a quarter off every other month and makes
      up a fifth of the budget. Prices return exactly to where they started
      every two months, so the true index does too. The chained fixed basket
      doesn't. In a sale month the household's basket leans towards the cheap
      good, and valuing that basket at the full price the next month registers
      a rise that's bigger than the fall that preceded it. After two years of
      prices going nowhere, the chained fixed basket says the cost of living has
      risen by 17.2%, and the chained Paasche index says it has fallen by 14.7%.
    </p>
  </section>

  <ChainFigure />

  <section class="body-text">
    <p>
      Chained Fisher stays exactly on the truth at every even month. That's
      because Fisher passes what index-number theory calls the
      <span class="bold">time reversal test</span>: the index from month 0 to
      month 1, multiplied by the index from month 1 back to month 0, is exactly
      1. The fixed basket fails it, and the failure always points upwards, so
      every round trip adds a little to a chained fixed-basket index.
    </p>
    <p>
      For the household in this article, whose tastes never change, that makes
      chained Fisher immune to this kind of drift. Real shoppers are not so
      tidy, and it's worth saying plainly that superlative indices can drift
      too. When shoppers stock up during a sale and buy less afterwards, their
      purchases no longer reflect a fixed set of preferences, and Ivancic,
      Diewert and Fox found large drift in chained superlative indices computed
      from weekly supermarket scanner data for exactly that reason.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The maths</h3>
    <p>
      Let's write {@html ri} for good <i>i</i>'s price this year divided by its
      price last year, {@html wi} for its share of last year's budget and
      {@html wpi} for its share of this year's. For a household with a constant
      elasticity of substitution {@html sigma}, the true index is
    </p>
    <p class="eq">{@html trueIdx}</p>
    <p>
      which is the Laspeyres index when {@html sigma} = 0 and a weighted
      geometric mean of the price changes when {@html sigma} = 1. The three
      indices a statistician can compute are
    </p>
    <p class="eq">{@html las}</p>
    <p>
      and none of them contains {@html sigma}. Expanding the true index to
      second order in the log price changes gives the square law,
    </p>
    <p class="eq">{@html square}</p>
    <p>and with two goods and only energy's price changing, by a factor <i>R</i>,</p>
    <p class="eq">{@html two}</p>
    <p>
      The Fisher index matches the true one to second order for every
      {@html sigma}, so its error starts at third order. The chaining result is
      the time reversal test:
    </p>
    <p class="eq">{@html reversal}</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      The household in this article is convenient in several ways that real
      households aren't.
    </p>
    <p>
      First, a single elasticity links every pair of goods. Real baskets have
      close substitutes, such as two brands of coffee, and near-complements,
      such as petrol and cars, so statisticians use different formulas at
      different levels of aggregation. Second, the household's preferences are
      <span class="bold">homothetic</span>, meaning its budget shares don't
      depend on its income. Real budget shares do, so rich and poor households
      face different true indices, and no single number is right for both.
      Third, the goods never change. New products and changes in quality were
      the largest source of bias in the Boskin Commission's estimate, and
      they're a problem for every formula alike. And finally, Fisher needs this
      year's basket, which arrives late. The United States has published a
      chained consumer price index built on the Törnqvist formula since August
      2002, and its final values arrive between fourteen and twenty-five months
      after the month they describe.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Where this leaves the fixed basket</h3>
    <p>
      A fixed basket overstates how much more it costs to live as well as
      before, and the textbook is right about that. What it leaves out is the
      size: roughly half of {@html sigma} times the variance of the price
      changes, which is nothing when prices move together and grows with the
      square of how far apart they move. It also leaves out the most useful
      fact about the problem, which is that the unobservable {@html sigma} is
      recorded after all, in the basket people actually buy, and the Fisher
      index uses it without ever having to name it.
    </p>
    <p>Thanks for reading!</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Sources and notes</h3>
    <p>
      Superlative index numbers are from W. Erwin Diewert, "Exact and
      superlative index numbers", <i>Journal of Econometrics</i> 4(2), 1976,
      pages 115–145. The Boskin Commission's estimates are from its 1996 report
      to the Senate Finance Committee, <i>Toward a More Accurate Measure of the
      Cost of Living</i>, as tabulated in the US General Accounting Office's
      report GGD-00-50 (2000). The scanner-data drift is from Lorraine Ivancic,
      W. Erwin Diewert and Kevin J. Fox, "Scanner data, time aggregation and the
      construction of price indexes", <i>Journal of Econometrics</i> 161(1),
      2011, pages 24–35. The chained CPI is described in the Bureau of Labor
      Statistics' introduction to the C-CPI-U.
    </p>
    <p>
      The household, its numbers, the figures and every value quoted are mine.
      Every number in this article is re-derived by
      <span class="mono">verify/check-numbers.mjs</span> from the same modules
      the page draws from, the true index is checked against a direct
      minimisation of the cost of reaching the old indifference curve, and the
      figures are checked in rendered pixels at 390px and 1280px. The page is
      built on the scaffold and design system of Amazon's
      <a href="https://mlu-explain.github.io/">MLU-Explain</a>, used under CC
      BY-SA 4.0.
    </p>
  </section>
</main>

<style>
  main {
    padding-bottom: 4rem;
  }

  .eq {
    margin: 0.6rem 0;
  }

  .mono {
    font-family: var(--font-mono);
    font-size: 0.9em;
  }
</style>
