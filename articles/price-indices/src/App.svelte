<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import GuessFigure from "./Components/GuessFigure.svelte";
  import BasketLab from "./Components/BasketLab.svelte";
  import SquareLawFigure from "./Components/SquareLawFigure.svelte";
  import ChainFigure from "./Components/ChainFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import { shock, chained, smoothPath, salePath } from "./indices.js";
  import { W_ENERGY, R_DEFAULT, SMOOTH_MONTHS, SALE_SHARE, SALE_PRICE, SALE_MONTHS } from "./datasets.js";

  const trueIdx = katexify(`P^{*} = \\Big(\\sum_i w_i\\, r_i^{\\,1-\\sigma}\\Big)^{\\frac{1}{1-\\sigma}}`, true);
  const las = katexify(`P_L = \\sum_i w_i\\, r_i, \\qquad P_P = \\Big(\\sum_i w_i' \\,/\\, r_i\\Big)^{-1}, \\qquad P_F = \\sqrt{P_L\\,P_P}`, true);
  const square = katexify(`\\ln P_L - \\ln P^{*} \\;\\approx\\; \\tfrac12\\,\\sigma\\,\\operatorname{Var}_w(\\ln r)`, true);
  const two = katexify(`\\operatorname{Var}_w(\\ln r) = w\\,(1-w)\\,(\\ln R)^2`, true);
  const reversal = katexify(`P_F(0,1)\\,P_F(1,0) = 1, \\qquad P_L(0,1)\\,P_L(1,0) \\ge 1`, true);
  const sigma = katexify(`\\sigma`);
  const ri = katexify(`r_i`);
  const wi = katexify(`w_i`);
  const wpi = katexify(`w_i'`);

  // Every figure the prose quotes, from the same module the figures draw with.
  // A rise in an index, in per cent, to one or two decimals.
  const rise = (v, d = 1) => ((v - 1) * 100).toFixed(d);
  const fall = (v, d = 1) => ((1 - v) * 100).toFixed(d);
  // The share of the fixed basket's gap to the truth that Fisher closes.
  const closed = (r) => Math.round(((r.L - r.F) / (r.L - r.C)) * 100);
  const d0 = shock(R_DEFAULT, 0, W_ENERGY); // energy doubles, sigma = 0
  const d1 = shock(R_DEFAULT, 1, W_ENERGY); // … sigma = 1
  const d2 = shock(R_DEFAULT, 2, W_ENERGY); // … sigma = 2
  const q25 = shock(1.25, 1, W_ENERGY); // a 25% rise in energy, sigma = 1
  const smooth = chained(smoothPath(R_DEFAULT, SMOOTH_MONTHS), [W_ENERGY, 1 - W_ENERGY], 1).at(-1);
  const sale = chained(salePath(SALE_PRICE, SALE_MONTHS), [SALE_SHARE, 1 - SALE_SHARE], 1).at(-1);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say that last year our household spent a fifth of its budget on
        energy, for heating, electricity and fuel, and the other four-fifths on
        everything else. This year the price of energy doubles, and nothing else
        changes price. Here's a question that sounds as if it should have one
        answer: how much more income would we need this year to be exactly as
        well off as we were last year?
      </p>
      <p>
        The obvious answer is {rise(d0.L, 0)}%, because that's what it would cost
        to buy last year's shopping again. Before we look at it more carefully,
        take a moment to make your own guess with the slider below.
      </p>
    </section>

    <GuessFigure />

    <section class="body-text">
      <p>
        The right answer depends on something about our household that the
        question didn't mention, which is how readily we'd switch away from
        energy now that it costs more. Economists measure that with the
        <span class="bold">elasticity of substitution</span>, written
        {@html sigma}, which says how much the ratio of what we buy of two goods
        changes when their relative price changes.
      </p>
      <p>
        At {@html sigma} = 0 we never switch, so we need the full
        {rise(d0.C, 0)}%. At {@html sigma} = 1, where we always spend the same
        share of our budget on each good, we need {rise(d1.C)}%. At
        {@html sigma} = 2 we need only {rise(d2.C)}%. The amount we'd need is
        called the <span class="bold">true cost-of-living index</span>, and the
        {rise(d0.L, 0)}% from buying last year's shopping again is only right for
        a household that never switches.
      </p>
      <p>
        That's the standard lesson about price indices, and first courses
        usually state it in one line: a fixed basket overstates the cost of
        living, because people substitute away from what got dearer. It's true,
        and in the rest of this article we'll see how big the overstatement is,
        why it's often small, and a way around it that doesn't need to know
        {@html sigma} at all.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The household's choice</h3>
      <p>
        The figure below draws our problem. Last year's basket is the point
        <b>A</b>, and the grey curve through it is every basket that would leave
        us exactly as well off as <b>A</b> did, which is called an
        <span class="bold">indifference curve</span>. The pink line runs through
        <b>A</b> at this year's prices, so every basket on it costs what last
        year's shopping costs now. That's the fixed-basket answer, which
        statisticians call the <span class="bold">Laspeyres index</span>.
      </p>
      <p>
        But we don't have to buy <b>A</b>. The cheapest basket that's just as
        good is the point <b>B</b>, where a line with the same slope only just
        touches the curve, and the dark dashed line through it is what the true
        index costs.
        The gap between the two parallel lines is the overstatement. If you drag
        the elasticity, you'll see <b>B</b> slide along the curve. The more
        readily we switch, the further <b>B</b> moves from <b>A</b>, and the
        wider the gap becomes.
      </p>
    </section>

    <BasketLab />

    <section class="body-text">
      <p>
        There's a second standard index in the chart. The
        <span class="bold">Paasche index</span> uses this year's basket instead
        of last year's, so it asks how much more <b>B</b> costs now than it would
        have cost last year. <b>B</b> isn't the cheapest good-enough basket at
        last year's prices, so Paasche errs in the other direction, and for our
        household it always lands below the truth. At {@html sigma} = 1 it says
        {rise(d1.P)}%, against a true {rise(d1.C)}% and a fixed-basket
        {rise(d1.L, 0)}%.
      </p>
      <p>
        So the two indices a statistician can compute bracket the right answer.
        Where the answer sits inside the bracket depends on {@html sigma}, which
        no survey of prices and purchases records directly. That sounds like the
        end of the story, and the rest of this article is about why it isn't.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How big is the overstatement?</h3>
      <p>
        Let's start with the case where there's no overstatement at all. If you set
        energy's multiplier back to 1 in the lab, every index agrees, whatever
        {@html sigma} is. The same happens if every price rises by the same
        proportion, because then there's no reason to switch between goods, and
        a fixed basket is exactly right. So the overstatement comes entirely
        from prices moving apart, and it turns out to have a simple size. In log
        points, it's approximately half of {@html sigma} times the variance of
        the price changes across goods, weighted by budget shares.
      </p>
      <p>
        The figure below plots the overstatement against the size of the energy
        shock on logarithmic axes, with one solid line for each value of
        {@html sigma}. The lines are straight with a slope of 2, which is the
        signature of a square law. If we halve the shock, the overstatement
        falls to a quarter, and a larger {@html sigma} shifts the whole line up
        in proportion. You can drag the size of the shock to read off both
        errors for {@html sigma} = 1.
      </p>
    </section>

    <SquareLawFigure />

    <section class="body-text">
      <p>
        That's why the bias is small in an ordinary year. Let's say relative
        prices move apart by about 5%, in the sense of a standard deviation of
        the price changes across the basket, and {@html sigma} is 1. Then the
        overstatement is about 0.125 of a percentage point a year. The Boskin
        Commission's review of the American consumer price index in 1996
        estimated a total upward bias of 1.1 points a year, and only 0.15 of
        that came from substitution between broad categories of goods. Most of
        the rest came from new products and quality changes, which no choice of
        formula fixes.
      </p>
      <p>
        A shock that doubles one price is a different matter. It sits far out on
        the horizontal axis, where the overstatement is measured in whole
        points.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">An answer that doesn't need σ</h3>
      <p>
        Now let's look at the dashed lines in the same figure. They belong to
        the <span class="bold">Fisher index</span>, which is simply the
        geometric mean of the Laspeyres and Paasche indices. That means we can
        compute it from prices and the two baskets actually bought, with no
        knowledge of {@html sigma}. Its error is far smaller: when energy's price
        rises by 5% and {@html sigma} is 1, it's about a hundred times smaller
        than the fixed basket's. Its lines also have a slope of 3 rather than 2,
        so its error shrinks eightfold when the shock is halved, and the
        advantage grows as shocks get smaller.
      </p>
      <p>
        We can see the same thing in the lab. With energy doubling and
        {@html sigma} = 1, Fisher says {rise(d1.F)}% against the true
        {rise(d1.C)}%, which closes {closed(d1)}% of the fixed basket's gap. With
        a 25% rise in energy instead, it says {rise(q25.F, 2)}% against a true
        {rise(q25.C, 2)}%, closing {closed(q25)}% of it. And if you drag
        {@html sigma} anywhere between 0 and 3, the Fisher bar stays close to the
        truth, because our household's new basket carries the information about
        how it switched. Fisher is exact when {@html sigma} = 0, since the two
        baskets are then the same.
      </p>
      <p>
        Why does averaging two wrong answers give a nearly right one? For small
        price changes, the Laspeyres and Paasche errors are almost equal and
        opposite, and a geometric mean cancels the equal parts. What's left over
        is the difference between the two errors, which is a whole order
        smaller. Indices with this property are called
        <span class="bold">superlative</span>, a term due to Erwin Diewert. They
        approximate the true index to second order for any smooth
        <span class="bold">homothetic</span> preferences, meaning preferences
        whose budget shares don't depend on income. Fisher and the closely
        related Törnqvist index are the two in common use.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Chaining, and where it breaks</h3>
      <p>
        The other fix statisticians use is to update the basket often. Instead
        of comparing this December with last December, they compare each month
        with the one before and multiply the monthly changes together, which is
        called <span class="bold">chaining</span>. Let's say energy doubles in
        twelve equal monthly steps. Chaining brings the fixed basket down from
        {rise(d1.L, 0)}% to {rise(smooth.L)}%, and chained Fisher lands within a
        few thousandths of a point of the true {rise(smooth.C)}%. That's because
        each month's price change is small, and the square law makes each
        month's error smaller still.
      </p>
      <p>
        But chaining has a failure of its own. The figure below starts on a good
        that goes a quarter off every other month and makes up a fifth of the
        budget, and you can switch it to the smooth doubling with its first
        button. With the sale, prices return to where they started every two months, so the true
        index does too. The chained fixed basket doesn't. In a sale month our
        basket leans towards the cheap good, and valuing that basket at the full
        price the next month registers a rise that's bigger than the fall before
        it. After two years of prices going nowhere, the chained fixed basket
        says the cost of living has risen by {rise(sale.L)}%, and the chained
        Paasche index says it has fallen by {fall(sale.P)}%.
      </p>
    </section>

    <ChainFigure />

    <section class="body-text">
      <p>
        Chained Fisher stays on the truth at every even month, and that's
        because Fisher passes what index-number theory calls the
        <span class="bold">time reversal test</span>. The index from month 0 to
        month 1, multiplied by the index from month 1 back to month 0, is
        exactly 1. The fixed basket fails the test, and the failure always
        points upwards, so every round trip adds a little to a chained
        fixed-basket index.
      </p>
      <p>
        For our household, whose tastes never change, that makes chained Fisher
        immune to this kind of drift. Real shoppers aren't so tidy, and it's
        worth saying plainly that superlative indices can drift too. When
        shoppers stock up during a sale and buy less afterwards, their purchases
        no longer reflect a fixed set of preferences. That's the reason for the
        large drift that Ivancic, Diewert and Fox found in chained superlative
        indices computed from weekly supermarket scanner data.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The maths</h3>
      <p>
        Let's write {@html ri} for good <i>i</i>'s price this year divided by its
        price last year, {@html wi} for its share of last year's budget and
        {@html wpi} for its share of this year's. For a household with a
        constant elasticity of substitution {@html sigma}, the true index is
      </p>
      <p class="eq">{@html trueIdx}</p>
      <p>
        which is the Laspeyres index when {@html sigma} = 0 and a weighted
        geometric mean of the price changes when {@html sigma} = 1. The three
        indices a statistician can compute are
      </p>
      <p class="eq">{@html las}</p>
      <p>
        and none of them contains {@html sigma}. If we expand the true index to
        second order in the log price changes, we get the square law,
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
        Our household is convenient in several ways that real households
        aren't, and four of them matter here.
      </p>
      <p>
        First, a single elasticity links every pair of goods. Real baskets have
        close substitutes, such as two brands of coffee, and near-complements,
        such as petrol and cars, so statisticians use different formulas at
        different levels of aggregation.
      </p>
      <p>
        Second, our household's preferences are homothetic, so its budget
        shares don't depend on its income. Real budget shares do, which means
        rich and poor households face different true indices, and no single
        number is right for both.
      </p>
      <p>
        Third, the goods never change. New products and changes in quality were
        the largest source of bias in the Boskin Commission's estimate, and
        they're a problem for every formula alike.
      </p>
      <p>
        And finally, Fisher needs this year's basket, which arrives late. The
        United States has published a chained consumer price index built on the
        Törnqvist formula since August 2002, and its final values arrive between
        fourteen and twenty-five months after the month they describe.
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
  /* global.css gives .body-text and .body-header 80% each on a phone, so a
     heading inside a section was indented to 64%. Inside a section it should
     line up with the paragraphs. */
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  /* Wider than cost-curves' 720px, and with no side padding: the lab is laid
     out for up to 820px and every figure here carries its own 1rem gutter. The
     text column is still held to 600px by .body-text. */
  .content-container {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 0 4rem 0;
  }

  .eq {
    margin: 0.6rem 0;
  }
</style>
