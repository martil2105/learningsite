<script>
  /*
    App.svelte for supply-and-demand
  */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import TwoCurves from "./Components/TwoCurves.svelte";
  import TheQuestion from "./Components/TheQuestion.svelte";
  import CloudLab from "./Components/CloudLab.svelte";
  import MixFigure from "./Components/MixFigure.svelte";
  import R2Figure from "./Components/R2Figure.svelte";
  import BracketFigure from "./Components/BracketFigure.svelte";
  import ShifterFigure from "./Components/ShifterFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";

  const demandEq = katexify(`\\text{demand: } q = 120 - 3p + u, \\quad u \\sim \\mathcal{N}(0, \\tau_d^2)`, true);
  const supplyEq = katexify(`\\text{supply: } q = 20 + 2p + v, \\quad v \\sim \\mathcal{N}(0, \\tau_s^2)`, true);
  const bracketEq = katexify(`\\frac{B_{\\text{hi}}}{B_{\\text{lo}}} = \\frac{-\\text{Var}(q)/\\text{Cov}(p,q)}{-\\text{Cov}(p,q)/\\text{Var}(p)} = \\frac{\\text{Var}(p)\\,\\text{Var}(q)}{\\text{Cov}(p,q)^2} = \\frac{1}{R^2}`, true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="prose-section">
      <p>
        Every introductory economics textbook begins with the same iconic diagram: a downward-sloping <strong>demand curve</strong> representing consumer willingness to pay, and an upward-sloping <strong>supply curve</strong> representing producer costs. Where the two scissors cross, the market finds its clearing price and quantity.
      </p>

      <p>
        This picture is clean, intuitive, and mathematically simple. But when a quantitative practitioner actually enters a market to measure real transactions, those neat lines are nowhere to be found. Instead, we observe a noisy scatter of prices and quantities recorded month by month. The standard impulse is to fit a line through that cloud with ordinary least squares and declare that we have found the demand curve.
      </p>

      <p>
        That impulse is almost always wrong. In fact, a line fitted through market transactions is neither demand nor supply: it is a weighted mixture of both, and the statistical goodness of fit everyone is taught to prize is the very factor measuring our failure to pin down the truth.
      </p>
    </section>

    <!-- 1. The Setup Band: TwoCurves -->
    <TwoCurves />

    <section class="prose-section">
      <p>
        To understand why a cloud of transactions can be so deceptive, consider what causes the market crossing to move in the first place. When unobserved factors — such as consumer tastes or household incomes — shift the demand curve, suppliers respond by moving along their cost structure. As demand moves back and forth, the resulting equilibria trace out the <em>supply curve</em>.
      </p>

      <p>
        Conversely, when input costs or weather conditions shift supply, consumers adjust their purchases along their valuation schedule, tracing out the <em>demand curve</em>. In other words, a curve is revealed only when it stands perfectly still while the other curve does all the moving.
      </p>

      <p>
        Now let's test what happens when both forces operate simultaneously.
      </p>
    </section>

    <!-- 2. The Question First: TheQuestion -->
    <TheQuestion />

    <section class="prose-section">
      <p>
        In the eighteen-month sample above, fitting a straight line through the observed prices and quantities produced an upward-sloping line. A naive observer might conclude that this commodity is a rare curiosity where higher prices induce greater demand.
      </p>

      <p>
        In truth, demand in this market is entirely orthodox: consumers buy substantially less when the price rises (slope = −3.0). The positive slope appeared because demand shocks were larger and more frequent than supply shocks over those eighteen months. The data was reflecting supply responses to shifting demand, not consumer demand itself.
      </p>
    </section>

    <!-- 3. The Hook: CloudLab -->
    <CloudLab />

    <section class="prose-section">
      <p>
        Let's formalise this intuition. In our linear market, demand and supply are governed by:
      </p>

      <div class="math-card">
        {@html demandEq}
        {@html supplyEq}
      </div>

      <p>
        Here, u and v represent independent random shocks hitting the two sides of the market. Let {@html katexify("w = \\tau_d^2 / (\\tau_d^2 + \\tau_s^2)")} denote the <strong>demand-shock share</strong> — the proportion of total variance coming from shifts in buyer demand.
      </p>

      <p>
        When w = 0, supply shifts alone, and the fitted line recovers the exact demand slope of −3.00. When w = 1, demand shifts alone, and the fitted line recovers the exact supply slope of +2.00. Between these extremes, the fitted slope is not an arbitrary number: it is a straight line connecting the two truths.
      </p>
    </section>

    <!-- 4. MixFigure -->
    <MixFigure />

    <section class="prose-section">
      <p>
        As the shock mix shifts from w = 0 to w = 1, the ordinary least squares slope changes according to the linear equation <strong>slope = w · S − (1 − w) · B</strong>. Equivalently, the fitted slope divides the interval [−B, S] in the exact ratio of the two shock variances, {@html katexify("\\tau_d^2 / \\tau_s^2")}.
      </p>

      <p>
        This produces a dangerous pitfall at <strong>w* = B / (B + S) = 0.60</strong>. At this exact ratio, the covariance between price and quantity is zero, and the cloud is completely horizontal. A casual glance might suggest that demand is perfectly inelastic or that consumers are indifferent to price. In reality, demand is highly price-sensitive, but its downward slope is perfectly cancelled in the covariance by upward-sloping supply shocks.
      </p>
    </section>

    <!-- 5. R2Figure -->
    <R2Figure />

    <section class="prose-section">
      <p>
        This leads directly to the <strong>identification problem</strong>, first articulated by Philip and Elmer Working in 1927. Standard statistical metrics cannot rescue us here. In fact, $R^2 = 1.0$ at both ends of the spectrum: when the cloud fits demand perfectly, and when it fits supply perfectly. At the flat cloud ($w^* = 0.60$), $R^2 = 0$.
      </p>

      <p>
        A high $R^2$ simply tells us that one curve was substantially more stable than the other; it provides zero evidence as to <em>which</em> curve stood still.
      </p>
    </section>

    <!-- 6. BracketFigure (The Headline Identity) -->
    <BracketFigure />

    <section class="prose-section">
      <p>
        If we cannot identify a single demand curve, what can we say about the market? In 1984, Steven Klepper and Edward Leamer proved that when transaction data slopes downward, the observed moments still establish strict diagnostic bounds.
      </p>

      <p>
        The standard forward regression of quantity on price yields a conservative lower bound for the demand slope magnitude, <strong>B_lo = −Cov(p, q) / Var(p)</strong>. The reverse regression of price on quantity, inverted, yields an upper bound, <strong>B_hi = −Var(q) / Cov(p, q)</strong>.
      </p>

      <p>
        The ratio between these two bounds is an exact mathematical identity:
      </p>

      <div class="math-card">
        {@html bracketEq}
      </div>

      <p>
        This is the core insight: <strong>R² is not a measure of goodness of fit; it is the exact reciprocal of our identification failure</strong>. When R² = 0.22, the true demand elasticity is free over an interval spanning a factor of 4.64×.
      </p>
    </section>

    <!-- 7. ShifterFigure -->
    <ShifterFigure />

    <section class="prose-section">
      <p>
        How do economists break out of this bracket? The answer is not more observations: increasing the sample size simply estimates the confounded moments with greater precision, leaving the $1/R^2$ bracket unchanged.
      </p>

      <p>
        Instead, we require an <strong>instrumental variable</strong>: an external shock $Z$ that shifts supply without entering consumer demand. By measuring how average price and quantity change across different states of the instrument, the two-point slope isolates pure supply shifts and recovers the true demand curve.
      </p>
    </section>

    <!-- Conclusion & Resources -->
    <Conclusion />
    <Resources />
  </main>
</div>

<style>
  .page-wrap {
    width: 100%;
    min-height: 100vh;
    background: var(--paper, #f1f3f3);
  }
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  .prose-section {
    max-width: 680px;
    margin: 2rem auto;
    font-size: 1.05rem;
    line-height: 1.7;
    color: var(--squidink, #232f3e);
  }
  p {
    margin: 0 0 1.2rem 0;
  }
  .math-card {
    background: #ffffff;
    border: 1px solid #d4dada;
    border-left: 4px solid var(--violet, #7c5aed);
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    overflow-x: auto;
  }
</style>
