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
    <section class="prose-section">
      <p>
        Every economics curriculum introduces <strong>price elasticity of demand</strong> with a familiar formula: the percentage change in quantity demanded divided by the percentage change in price. We are told that some goods — like petrol, insulin, or basic foodstuffs — are <em>inelastic</em>, while luxury holidays and restaurant meals are <em>elastic</em>.
      </p>

      <p>
        That framing is fundamentally misleading. Elasticity is not a property of a good at all. On a single, straight demand curve, elasticity takes every value from zero to infinity. The very same good is deeply inelastic at low prices and aggressively elastic at high prices.
      </p>

      <p>
        What the elasticity number actually is, is a <strong>ratio of two geometric lengths</strong>. Whenever you pick any point on any demand curve ever drawn, that point cuts its own tangent line into two pieces. The price elasticity of demand is identically the upper segment divided by the lower segment.
      </p>
    </section>

    <!-- 1. The Hook: RulerLab -->
    <RulerLab />

    <section class="prose-section">
      <p>
        In the interactive lab above, you can drag the operating point across five diverse demand curve families — straight linear, constant elasticity, exponential, quadratic, and logistic — each pinned to pass through the exact same coordinate {@html katexify("(p = 25, q = 45)")}.
      </p>

      <p>
        At each point {@html katexify("(p, q)")}, the tangent line strikes the quantity axis at {@html katexify("(0, q - p \\cdot q')")} and the price axis at {@html katexify("(p - q/q', 0)")}. Notice what happens to the lengths:
      </p>

      {@html defEps}

      <p>
        Because the upper segment has length {@html katexify("p \\sqrt{1 + (q')^2}")} and the lower segment has length {@html katexify("(q / |q'|) \\sqrt{1 + (q')^2}")}, the radical terms cancel completely. The length ratio simplifies directly to {@html katexify("|q' \\cdot p / q|")}. The geometry and the calculus are not merely close approximations: they are bit-for-bit identical on every smooth curve.
      </p>

      <p>
        This reveals what <strong>unit elasticity</strong> ({@html katexify("|\\varepsilon| = 1")}) really means: it is the point where the tangent is cut exactly in half.
      </p>
    </section>

    <!-- 2. Along The Line: AlongTheLine -->
    <AlongTheLine />

    <section class="prose-section">
      <p>
        Consider what this geometric bisection means along an ordinary linear demand curve. On the straight line {@html katexify("q = 75 - 1.2p")}, the slope {@html katexify("q' = -1.2")} never changes by a single millimeter. Yet the elasticity runs through every possible magnitude:
      </p>

      {@html linClosedForm}

      <p>
        At {@html katexify("p = 5")}, the elasticity is {@html katexify("0.087")} — an extreme price increase produces barely a flicker in quantity. At {@html katexify("p = 60")}, the elasticity reaches {@html katexify("24.0")} — buyers vanish at the slightest price nudge. That represents a <strong>276× variation</strong> on a single, fixed curve.
      </p>

      <p>
        Because {@html katexify("|\\varepsilon| = p / (P_{\\max} - p)")}, the demand line is split cleanly into two equal halves: the good is strictly inelastic across the bottom half of prices ({@html katexify("p < 31.25")}), strictly elastic across the top half ({@html katexify("p > 31.25")}), and unit elastic at the exact geometric midpoint.
      </p>
    </section>

    <!-- 3. Revenue and the Peak: RevenueFigure -->
    <RevenueFigure />

    <section class="prose-section">
      <p>
        Why do business managers care so intensely about the unit elasticity threshold? Because total revenue {@html katexify("R(p) = p \\cdot q(p)")} is driven by the race between price and quantity. If we differentiate logarithmic revenue with respect to logarithmic price, we uncover an exact identity:
      </p>

      {@html dlnR}

      <p>
        When demand is inelastic ({@html katexify("|\\varepsilon| < 1")}), the derivative is positive: raising prices expands total revenue because buyers do not cut back proportionally. When demand is elastic ({@html katexify("|\\varepsilon| > 1")}), the derivative is negative: price increases destroy revenue.
      </p>

      <p>
        Consequently, revenue peaks at the exact price where {@html katexify("|\\varepsilon| = 1")}. As shown in Figure 3, this holds across linear, exponential, quadratic, and logistic demands alike. Only the constant elasticity specification ({@html katexify("|\\varepsilon| = 1.6")}) has no interior peak, because its responsiveness exceeds unity everywhere.
      </p>
    </section>

    <!-- 4. Two Observations, Four Answers: TwoPointsFigure -->
    <TwoPointsFigure />

    <section class="prose-section">
      <p>
        Empirical data rarely arrives with a pre-drawn calculus curve. More often, an analyst observes just two data points — for instance, sales of 57 units at £20 followed by 33 units at £30.
      </p>

      <p>
        How should we compute elasticity between these two points? Standard textbooks suggest several formulas, but they deliver four wildly conflicting answers:
      </p>

      <ul class="bullet-list">
        <li>The point elasticity at the first observation is <strong>0.842</strong> (inelastic).</li>
        <li>The point elasticity at the second observation is <strong>2.182</strong> (elastic).</li>
        <li>The standard <strong>midpoint (arc) formula</strong> gives <strong>1.333</strong>.</li>
        <li>The <strong>log-difference formula</strong> gives <strong>1.348</strong>.</li>
      </ul>

      <p>
        This is a <strong>2.59× spread</strong> from the exact same pair of numbers. Why does this happen? Because choosing a calculation method is secretly choosing a functional form for demand:
      </p>

      {@html midEq}

      <p>
        The midpoint formula yields {@html katexify("4/3 = 1.333")} because it is the exact point elasticity of a <em>straight line</em> evaluated at the midpoint price {@html katexify("p = 25")}. Meanwhile, the log-difference formula yields {@html katexify("1.348")} because it solves for the exponent of a <em>constant-elasticity curve</em> {@html katexify("q = k \\cdot p^{-\\alpha}")} passing through both points:
      </p>

      {@html logEq}
    </section>

    <!-- 5. Formula Drift: FormulaFigure -->
    <FormulaFigure />

    <section class="prose-section">
      <p>
        What happens when you apply the midpoint formula to a constant elasticity market, or the log formula to a linear market? As the price gap widens, both formulas begin to drift.
      </p>

      <p>
        As shown in Figure 5, the error remains under {@html katexify("0.15\\%")} for modest price changes below {@html katexify("10\\%")}. This explains why students and analysts rarely notice the inconsistency: for small homework gaps, either formula works as an effective approximation.
      </p>

      <p>
        The deeper mathematical explanation lies in <strong>Jensen's inequality</strong>. On a straight line, the arithmetic average of two quantities {@html katexify("(q_1 + q_2)/2")} is identical to the quantity evaluated at the average price {@html katexify("q((p_1 + p_2)/2)")}. But on a convex demand curve, the chord lies strictly above the curve: the quantity at the average price is {@html katexify("0.52\\%")} smaller at a {@html katexify("10\\%")} price gap, {@html katexify("14.2\\%")} smaller at {@html katexify("50\\%")}, and {@html katexify("77.7\\%")} smaller at a {@html katexify("100\\%")} gap.
      </p>
    </section>

    <section class="prose-section limits-section">
      <h3>Scope and Limitations</h3>
      <p>
        This explainer focuses strictly on own-price elasticity of demand in a static, single-period framework with no income effects. We have examined the properties of an established demand curve. Where that curve comes from — and why ordinary market transactions fail to identify it without exogenous supply shifts — is the subject of our previous chapter, <a href="../supply-and-demand/">Supply &amp; Demand</a>. How a profit-maximising firm exploits this elasticity to set markups is the subject of <a href="../markup-and-elasticity/">Markup &amp; Elasticity</a>.
      </p>
    </section>

    <Conclusion />
    <Resources />
  </main>
</div>

<style>
  :global(:root) {
    --squidink: #232f3e;
    --primary: #2074d5;
    --violet: #7c5aed;
    --paper: #ffffff;
    --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --font-heavy: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .page-wrap {
    min-height: 100vh;
    background: #ffffff;
    color: var(--squidink);
    font-family: var(--font-main);
  }

  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }

  .prose-section {
    max-width: 680px;
    margin: 1.75rem auto;
  }

  p {
    font-size: 1.05rem;
    line-height: 1.68;
    color: #334155;
    margin: 0 0 1.25rem 0;
  }

  strong {
    color: var(--squidink);
    font-weight: 700;
  }

  em {
    font-style: italic;
  }

  .bullet-list {
    margin: 1rem 0 1.5rem 1.5rem;
    padding: 0;
  }

  .bullet-list li {
    font-size: 1rem;
    line-height: 1.6;
    color: #334155;
    margin-bottom: 0.5rem;
  }

  .limits-section {
    background: #f8fafc;
    border-left: 3px solid #94a3b8;
    padding: 1rem 1.25rem;
    border-radius: 4px;
    margin: 2.5rem auto;
  }

  .limits-section h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: var(--font-mono);
  }

  .limits-section p {
    font-size: 0.95rem;
    margin: 0;
    color: #475569;
  }

  .limits-section a {
    color: var(--violet);
    text-decoration: underline;
    font-weight: 600;
  }
</style>
