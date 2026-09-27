<script>
  /*
    App.svelte for elasticity
  */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import RulerLab from "./Components/RulerLab.svelte";
  import AlongTheLine from "./Components/AlongTheLine.svelte";
  import RevenueFigure from "./Components/RevenueFigure.svelte";
  import TwoPointsFigure from "./Components/TwoPointsFigure.svelte";
  import FormulaFigure from "./Components/FormulaFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";

  const defEps = katexify(`|\\varepsilon| = \\left| \\frac{\\mathrm{d} q}{\\mathrm{d} p} \\cdot \\frac{p}{q} \\right|`, true);
  const linClosedForm = katexify(`|\\varepsilon| = \\frac{p}{P_{\\max} - p} = \\frac{Q_{\\max} - q}{q}`, true);
  const dlnR = katexify(`\\frac{\\mathrm{d} \\ln R}{\\mathrm{d} \\ln p} = 1 - |\\varepsilon|`, true);
  const midEq = katexify(`\\varepsilon_{\\text{mid}} = \\frac{(q_2 - q_1) / \\bar{q}}{(p_2 - p_1) / \\bar{p}}`, true);
  const logEq = katexify(`\\varepsilon_{\\text{log}} = \\frac{\\ln(q_2) - \\ln(q_1)}{\\ln(p_2) - \\ln(p_1)}`, true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        The <span class="bold">price elasticity of demand</span> measures how
        strongly buyers respond to a change in price: it's the percentage change
        in the quantity they buy divided by the percentage change in the price.
        Most of us first meet it through examples of goods, some <em>inelastic</em>,
        like petrol, insulin or basic foods, and some <em>elastic</em>, like
        holidays abroad and restaurant meals.
      </p>
      <p>
        Most courses also point out that elasticity changes as we move along a
        demand curve, and it's worth taking that point further than they
        usually do. On a single straight demand curve, elasticity takes every
        value from zero to infinity, so the same good is very inelastic at low
        prices and very elastic at high ones. In other words, elasticity
        belongs to a point on a curve rather than to the good.
      </p>
      <p>
        So what is the number, exactly? It turns out to be a
        <span class="bold">ratio of two lengths</span>. Pick any point on a
        smooth demand curve, of any shape, and it cuts its own tangent line into
        two pieces. The price elasticity of demand is the length of the upper
        piece divided by the length of the lower one. Let's try it: drag the
        point below, and switch between the five curves.
      </p>
    </section>

    <RulerLab />

    <section class="body-text">
      <h3 class="body-header">Why the ratio works</h3>
      <p>
        In the lab, we can drag the point along five kinds of demand curve: a
        straight line, a constant-elasticity curve, an exponential, a quadratic
        and a logistic curve. All five are pinned so that they pass through the
        same point, {@html katexify("(p = 25, q = 45)")}. Notice that we've put
        price on the horizontal axis, so the upper piece of the tangent runs
        from the point to the quantity axis, and the lower piece runs to the
        price axis. As you drag the point, keep an eye on the two readouts:
        the ratio you can measure on screen and the formula from calculus
        always agree.
      </p>
      <p>
        Why does the ratio work? At a point {@html katexify("(p, q)")} where the
        curve's slope is {@html katexify("q'")}, the tangent meets the quantity
        axis at {@html katexify("(0, q - p \\cdot q')")} and the price axis at
        {@html katexify("(p - q/q', 0)")}. So the upper piece has length
        {@html katexify("p \\sqrt{1 + (q')^2}")} and the lower piece has length
        {@html katexify("(q / |q'|) \\sqrt{1 + (q')^2}")}. The square roots cancel,
        and the ratio of the two lengths is
        {@html katexify("|q' \\cdot p / q|")}, which is the definition of the
        point elasticity:
      </p>

      {@html defEps}

      <p>
        So the geometry and the calculus aren't just close to each other.
        They're the same number on every smooth curve, and that tells us what
        <span class="bold">unit elasticity</span>,
        {@html katexify("|\\varepsilon| = 1")}, means: it's the point that cuts
        its tangent exactly in half.
      </p>
    </section>

    <AlongTheLine />

    <section class="body-text">
      <h3 class="body-header">Half inelastic, half elastic</h3>
      <p>
        Let's see what this means on an ordinary straight demand curve,
        {@html katexify("q = 75 - 1.2p")}. Its slope,
        {@html katexify("q' = -1.2")}, is the same all the way along the line,
        and yet its elasticity runs through every possible value:
      </p>

      {@html linClosedForm}

      <p>
        At p = 5, the elasticity is only 0.087, so buyers barely respond to a
        price change there. At p = 60, it's 24.0, which means even a small price
        rise drives many of them away. That's a variation of 276× on a single,
        fixed curve.
      </p>
      <p>
        Because {@html katexify("|\\varepsilon| = p / (P_{\\max} - p)")}, the line
        splits cleanly into two halves. The good is inelastic across the bottom
        half of the price range, where p &lt; 31.25, elastic across the top
        half, where p &gt; 31.25, and unit elastic at the midpoint. So if we
        want to call this good elastic or inelastic, we first have to say which
        price we're talking about.
      </p>
    </section>

    <RevenueFigure />

    <section class="body-text">
      <h3 class="body-header">Where revenue peaks</h3>
      <p>
        Why does unit elasticity matter so much to a firm setting a price?
        Because total revenue, {@html katexify("R(p) = p \\cdot q(p)")}, depends
        on a race between the price and the quantity. If we differentiate the
        log of revenue with respect to the log of price, we get an exact
        identity:
      </p>

      {@html dlnR}

      <p>
        When demand is inelastic, with {@html katexify("|\\varepsilon| < 1")}, the
        derivative is positive, so raising the price raises revenue, because
        buyers don't cut back proportionally. When demand is elastic, with
        {@html katexify("|\\varepsilon| > 1")}, the derivative is negative, so a
        price rise loses revenue.
      </p>
      <p>
        As a result, revenue peaks exactly where
        {@html katexify("|\\varepsilon| = 1")}. If you switch between the
        curves in the chart above, you'll see that this holds for the linear,
        exponential, quadratic and logistic curves alike. Only the
        constant-elasticity curve, with {@html katexify("|\\varepsilon| = 1.6")},
        has no peak inside the range, because its elasticity is above one
        everywhere.
      </p>
    </section>

    <TwoPointsFigure />

    <section class="body-text">
      <h3 class="body-header">Which formula is right?</h3>
      <p>
        Real data rarely comes with a smooth curve attached. More often, we
        have just two observations: for instance, sales of 57 units at
        £20, and then 33 units at £30.
      </p>
      <p>
        How should we compute the elasticity between them? The usual formulas
        give four different answers:
      </p>

      <ul class="bullet-list">
        <li>The point elasticity at the first observation is 0.842, which is inelastic.</li>
        <li>The point elasticity at the second observation is 2.182, which is elastic.</li>
        <li>The <span class="bold">midpoint formula</span>, also called the arc formula, gives 1.333.</li>
        <li>The <span class="bold">log-difference formula</span> gives 1.348.</li>
      </ul>

      <p>
        That's a 2.59× spread from the same pair of numbers. Why does it
        happen? Because choosing a way to calculate the elasticity quietly
        chooses a shape for the demand curve, even if we never draw it. The midpoint formula is
      </p>

      {@html midEq}

      <p>
        and it gives {@html katexify("4/3 = 1.333")} because it's exactly the
        point elasticity of a <em>straight line</em> through the two
        observations, taken at the midpoint price, p = 25. The log-difference
        formula is
      </p>

      {@html logEq}

      <p>
        and it gives 1.348 because it's the exponent of the
        <em>constant-elasticity curve</em>
        {@html katexify("q = k \\cdot p^{-\\alpha}")} that passes through both
        points.
      </p>
    </section>

    <FormulaFigure />

    <section class="body-text">
      <h3 class="body-header">What's behind the drift</h3>
      <p>
        What happens if we use the midpoint formula on a constant-elasticity
        market, or the log formula on a linear one? As the gap between our two
        prices widens, both formulas drift away from the truth, and the table
        under the chart above lets us see by how much.
      </p>
      <p>
        For small price changes, though, both errors are tiny, which is why
        students and analysts rarely notice the problem: for the small gaps in
        most exercises, either formula is a good approximation.
      </p>
      <p>
        The reason underneath is <span class="bold">Jensen's inequality</span>,
        which says that for a curved function, the average of the values isn't
        the value at the average. On a straight line, the average of two quantities,
        {@html katexify("(q_1 + q_2)/2")}, is the quantity at the average
        price, {@html katexify("q((p_1 + p_2)/2)")}. On a convex demand curve,
        though, the chord lies above the curve, so the quantity at the average
        price is smaller: by 0.52% at a 10% price gap, 14.2% at a 50% gap and
        77.7% at a 100% gap.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        This article leaves a few things out, and they're worth naming.
      </p>
      <p>
        First, we've only looked at own-price elasticity, which is how the
        quantity of a good responds to its own price, and not at how it
        responds to other prices or to income.
      </p>
      <p>
        Second, everything here is static. There's a single period and no
        income effects, so we haven't asked how buyers' responses change over
        time.
      </p>
      <p>
        And finally, we've taken the demand curve as given. Where that curve
        comes from, and why ordinary market transactions can't identify it
        without an outside shift in supply, is the subject of the article on
        <a href="../supply-and-demand/">supply and demand</a>. How a firm uses
        the elasticity to set its markup is the subject of the article on
        <a href="../markup-and-elasticity/">markup and elasticity</a>.
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

  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }

  .bullet-list {
    margin: 1rem 0 1.25rem 1.25rem;
    padding: 0;
  }

  .bullet-list li {
    line-height: 1.5;
    margin-bottom: 0.4rem;
  }
</style>
