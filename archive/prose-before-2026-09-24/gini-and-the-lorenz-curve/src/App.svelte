<script>
  /* App.svelte for gini-and-the-lorenz-curve */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import ThreeRoutes from "./Components/ThreeRoutes.svelte";
  import TwoPopulations from "./Components/TwoPopulations.svelte";
  import AtkinsonFigure from "./Components/AtkinsonFigure.svelte";
  import TopShareFigure from "./Components/TopShareFigure.svelte";
  import CapFigure from "./Components/CapFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";

  const pairEq = katexify("G = \\frac{\\sum_{i=1}^n \\sum_{j=1}^n |x_i - x_j|}{2 n^2 \\mu}", true);
  const lorenzAreaEq = katexify("G = 1 - 2 \\int_0^1 L(p) \\, dp = \\frac{A}{A + B}", true);
  const lognormEq = katexify("G_{\\text{lognormal}} = 2\\Phi\\left(\\frac{\\sigma}{\\sqrt{2}}\\right) - 1", true);
  const atkinsonEq = katexify("A(\\varepsilon) = 1 - \\frac{1}{\\mu} \\left( \\frac{1}{n} \\sum_{i=1}^n x_i^{1-\\varepsilon} \\right)^{\\frac{1}{1-\\varepsilon}}", true);
  const arEq = katexify("AR = 2 \\cdot AUC - 1", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="prose-section">
      <p>
        From United Nations development reports to World Bank dashboards, one metric dominates conversations about economic fairness: the <strong>Gini coefficient</strong>. We are told that a nation with a Gini of 0.25 is egalitarian, while a nation with 0.50 is deeply unequal.
      </p>
      <p>
        Yet condensing the rich, multi-dimensional distribution of an entire society into a single decimal number hides critical structural realities.
      </p>
      <p>
        What does the Gini coefficient actually calculate? Why can two economies with identical Gini scores represent entirely incompatible moral universes? And why is the exact same mathematical curve used by credit bureaus and machine learning engineers to score default risk?
      </p>
    </section>

    <ThreeRoutes />

    <section class="prose-section">
      <p>
        Most introductory courses teach the Gini coefficient as a pure geometric artifact: the normalized area between the 45-degree line of perfect equality and the cumulative <strong>Lorenz curve</strong>:
      </p>
      <div class="math-callout">
        {@html lorenzAreaEq}
      </div>
      <p>
        While geometrically clear, this definition conceals the metric's intuitive real-world meaning. In 1912, Italian statistician Corrado Gini formulated the metric through <strong>expected pairwise distance</strong>:
      </p>
      <div class="math-callout">
        {@html pairEq}
      </div>
      <p>
        If you select two citizens completely at random from a population, the expected dollar gap between their incomes divided by twice the society's average income is <em>identically equal</em> to the Gini coefficient.
      </p>
      <p>
        Under a continuous lognormal income distribution with variance $\sigma^2$, this reduces to an exact closed form:
      </p>
      <div class="math-callout">
        {@html lognormEq}
      </div>
    </section>

    <TwoPopulations />

    <section class="prose-section">
      <p>
        Now consider the fundamental pathology of single-number inequality metrics: <strong>Lorenz curves can cross</strong>.
      </p>
      <p>
        Consider two distinct societies:
      </p>
      <ul>
        <li>
          <strong>Society P:</strong> 30% of citizens survive on $\$4,000$, while 70% earn $\$10,000$.
        </li>
        <li>
          <strong>Society Q:</strong> 85% of citizens earn a comfortable $\$8,000$, while 15% capture $\$19,769$.
        </li>
      </ul>
      <p>
        Both societies produce the <strong>exact same Gini coefficient of 0.1537</strong>. Yet their social structures are polar opposites. In Society P, severe poverty afflicts the bottom third. In Society Q, poverty is non-existent, but a wealthy elite captures outsized gains.
      </p>
    </section>

    <AtkinsonFigure />

    <section class="prose-section">
      <p>
        Which society is fairer? In 1970, British economist Anthony Atkinson proved a foundational impossibility theorem: <strong>whenever Lorenz curves cross, no single inequality index can rank them without making an explicit ethical judgment</strong>.
      </p>
      <p>
        Atkinson introduced an explicit parameter $\varepsilon \ge 0$ representing society's <strong>inequality aversion</strong>:
      </p>
      <div class="math-callout">
        {@html atkinsonEq}
      </div>
      <p>
        When $\varepsilon$ is low ($\varepsilon &lt; 0.4633$), the observer cares primarily about elite concentration, ranking Society Q as more unequal. But when $\varepsilon &gt; 0.4633$, the observer prioritizes poverty eradication, inverting the ranking to declare Society P more unequal. At $\varepsilon = 8.0$, Society P is judged 2.6 times more unequal than Society Q!
      </p>
    </section>

    <TopShareFigure />

    <section class="prose-section">
      <p>
        The Gini coefficient is mathematically concentrated around the median of the distribution. As a result, it is remarkably blind to extreme wealth at the top tail.
      </p>
      <p>
        Comparing a power-law Pareto distribution against a lognormal distribution with the <em>exact same Gini of 0.400</em> reveals that the Pareto economy concentrates <strong>2.5 times more wealth in the top 1%</strong>, and <strong>5.5 times more wealth in the top 0.1%</strong>.
      </p>
    </section>

    <CapFigure />

    <section class="prose-section">
      <p>
        This exact geometric dilemma reappears in modern machine learning and credit risk analytics.
      </p>
      <p>
        When banks build credit scorecards or machine learning models to detect loan defaults, they plot the Cumulative Accuracy Profile (CAP) curve. The <strong>Accuracy Ratio ($AR$)</strong>—which is identical to the Gini coefficient—measures how cleanly the model separates good borrowers from bad:
      </p>
      <div class="math-callout">
        {@html arEq}
      </div>
      <p>
        Just like with income distributions, two predictive models can share the exact same Gini ($AR = 0.523$) while having crossing CAP curves. Model B catches 40% of defaults in the riskiest decile, while Model A catches only 25.6%—a massive 14.4-point difference that a simple Gini or AUC score completely obscures.
      </p>
    </section>

    <section class="prose-section limits-section">
      <h3>Model Limits &amp; Practical Applications</h3>
      <p>
        When working with distributional inequality in economics or data science:
      </p>
      <ul>
        <li>
          <strong>Never report a single scalar:</strong> Always report percentile ratios (e.g. P90/P10, P90/P50) and top wealth shares alongside the Gini coefficient.
        </li>
        <li>
          <strong>Evaluate models at operational thresholds:</strong> In classification models, never rely solely on global AUC or Gini; measure precision and recall at your actual business decision cut-off.
        </li>
        <li>
          <strong>Income vs wealth:</strong> Income Gini is typically 0.30–0.45, while wealth Gini often exceeds 0.75 due to compound interest and generational accumulation.
        </li>
      </ul>
    </section>

    <Conclusion />
    <Resources />
  </main>
</div>

<style>
  .page-wrap {
    max-width: 46rem;
    margin: 0 auto;
    padding: 2rem 1.25rem 5rem 1.25rem;
  }
  .content-container {
    width: 100%;
  }
  .prose-section {
    margin-bottom: 2rem;
  }
  .prose-section p {
    font-size: 1.1rem;
    line-height: 1.7;
    color: var(--squidink, #232f3e);
    margin: 0 0 1.25rem 0;
  }
  .math-callout {
    background: var(--paper, #f1f3f3);
    padding: 1rem;
    margin: 1.5rem 0;
    text-align: center;
    border-left: 3px solid var(--violet, #7c5aed);
    overflow-x: auto;
  }
  .limits-section {
    background: rgba(35, 47, 62, 0.03);
    border: 1px solid var(--stone, #d4dada);
    padding: 1.5rem;
    margin: 3rem 0;
  }
  .limits-section h3 {
    font-size: 1.2rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 1rem 0;
  }
  .limits-section ul {
    margin: 0;
    padding-left: 1.25rem;
  }
  .limits-section li {
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 0.75rem;
  }
</style>
