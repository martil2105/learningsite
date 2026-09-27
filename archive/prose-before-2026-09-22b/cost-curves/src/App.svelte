<script>
  /* App.svelte for cost-curves */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import CostSplit from "./Components/CostSplit.svelte";
  import AverageAndMarginal from "./Components/AverageAndMarginal.svelte";
  import Envelope from "./Components/Envelope.svelte";
  import PlantLab from "./Components/PlantLab.svelte";
  import MarginalCross from "./Components/MarginalCross.svelte";
  import PenaltyFigure from "./Components/PenaltyFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";

  const ratioEq = katexify("\\frac{q_{\\text{tangency}}}{q_{\\text{cheapest}}} = \\left(\\frac{2k}{f + k}\\right)^{1/3}", true);
  const envelopeEq = katexify("SRMC(q_t, k) = LRMC(q_t)", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="prose-section">
      <p>
        Every introductory microeconomics course presents a famous diagram: a sequence of U-shaped <strong>short-run average cost curves</strong> nestled against a smooth, sweeping curve underneath them. We are taught that this boundary is the <strong>long-run average cost curve</strong> — the lower envelope representing the lowest possible unit cost achievable when a firm is free to build any plant size it wishes.
      </p>
      <p>
        Almost every textbook draws this picture with a subtle, pervasive flaw. It shows each short-run curve touching the long-run curve at that short-run curve's own lowest point. That picture is mathematically impossible everywhere except at a single, unique output.
      </p>
      <p>
        In 1931, the renowned economist Jacob Viner famously instructed his draughtsman, Dr. Y.K. Wong, to draw a long-run envelope that passed through the minimum point of every short-run curve while never rising above any of them. Wong objected that such a line could not be drawn. Viner insisted, later acknowledging in a sheepish footnote that Wong was right and the geometry was unyielding.
      </p>
    </section>

    <CostSplit />

    <section class="prose-section">
      <p>
        To understand why the envelope behaves as it does, let us examine how a firm's costs are constructed. In the short run, capital equipment and factories cannot be altered instantaneously. A firm operates with a fixed plant size $k$, paying a fixed capital fee $r \cdot k$ alongside an overhead licence fee $f$.
      </p>
      <p>
        Producing output $q$ requires variable inputs such as labour and raw materials. Because existing machines become congested as volume climbs, marginal productivity declines and variable costs escalate rapidly — here modelled as $w \cdot q^3 / k$. A larger plant dampens this congestion, making high outputs cheaper to produce, but incurs higher fixed overheads.
      </p>
    </section>

    <AverageAndMarginal />

    <section class="prose-section">
      <p>
        Dividing total expenditure by output produces <strong>average cost</strong> ($AC = C/q$). Taking the derivative produces <strong>marginal cost</strong> ($MC = dC/dq$). Whenever marginal cost lies below average cost, the next unit produced costs less than the running average, pulling average cost downward. When marginal cost rises above average cost, it pulls average cost upward.
      </p>
      <p>
        It follows as an identity that marginal cost cuts average cost at the exact minimum of the average cost curve. The ratio $MC / AC$ is mathematically identical to the <strong>output elasticity of cost</strong>: at the minimum of average cost, this elasticity is precisely one.
      </p>
    </section>

    <Envelope />

    <section class="prose-section">
      <p>
        In the long run, time horizons expand and capital is no longer fixed. If a firm expects to produce a given volume $q$, it can tailor the factory size $k$ to minimise total expenditure. Setting the marginal benefit of capital against its rental cost yields the cost-minimising plant size $k^*(q) = \sqrt{w/r} \cdot q^{1.5}$.
      </p>
      <p>
        Evaluating short-run cost at this optimal plant size traces the <strong>long-run average cost curve</strong> ($LRAC$). The long-run curve is literally the lower envelope of all conceivable plant sizes: at each output, it matches the short-run curve of the plant designed for that volume, while sitting strictly below all other plants.
      </p>
    </section>

    <PlantLab />

    <section class="prose-section">
      <p>
        Now we encounter the central discovery: at what point does each short-run curve actually touch the long-run envelope?
      </p>
      <p>
        For any plant size $k$, the tangency occurs at output $q_t(k) = k^{2/3}$. However, that plant's own lowest unit cost occurs at output $q_m(k) = (k(f+k)/2)^{1/3}$. The ratio between the tangency output and the plant's cheapest scale is given by an exact closed form:
      </p>
      <div class="math-callout">
        {@html ratioEq}
      </div>
      <p>
        This ratio equals <strong>exactly one</strong> if and only if k = f. When f = 100, plant k = 100 is the unique plant that operates at the global minimum of the long-run curve (q = 21.54). At that single point, the tangency marker and the plant minimum marker coincide bit-for-bit.
      </p>
      <p>
        Everywhere else, they diverge. When demand is modest (k = 25), the plant touches the envelope at q = 8.55 — operating <strong>26% below</strong> its own most efficient scale of 11.60. When demand is large (k = 400), the plant touches the envelope at q = 54.29 — operating <strong>17% above</strong> its cheapest scale.
      </p>
    </section>

    <MarginalCross />

    <section class="prose-section">
      <p>
        Does this mean firms are building the wrong plants? Not at all: firms build the <em>right</em> plant, but deliberately operate it away from its private minimum cost.
      </p>
      <p>
        Why would a firm building a small plant operate on the downward-sloping segment of its average cost curve? Because building a smaller plant to reach minimum average cost would make marginal production excessively expensive. By the <strong>envelope theorem</strong>, the short-run marginal cost curve cuts the long-run marginal cost curve exactly at the tangency output:
      </p>
      <div class="math-callout">
        {@html envelopeEq}
      </div>
      <p>
        The decision is governed by marginal costs, not average costs. The firm chooses a plant size that equates marginal cost to the long-run marginal cost of output.
      </p>
    </section>

    <PenaltyFigure />

    <section class="prose-section">
      <p>
        Why did economists and textbooks continue drawing the tangency at the minimum for generations without anyone complaining? The answer lies in the <strong>flatness of the cost envelope</strong>.
      </p>
      <p>
        Because cost functions are smooth and convex, the penalty for building a slightly suboptimal plant size is strictly <strong>second-order ($O(e^2)$)</strong>. As shown in the table above, an error of $\pm 5\%$ in factory capacity increases total production cost by barely $0.1\%$. Even a catastrophic $50\%$ miscalculation raises costs by only $7.3\%$. The very flatness that made Viner's drawing mistake invisible on paper is what makes real-world capacity decisions remarkably forgiving in practice.
      </p>
    </section>

    <section class="prose-section limits-section">
      <h3>Model Limits &amp; Boundary Conditions</h3>
      <p>
        Every economic model simplifies reality to isolate a mechanism. In this analysis:
      </p>
      <ul>
        <li>
          <strong>Fixed vs variable factor divisibility:</strong> Capital is treated as a continuous choice in the long run but completely rigid in the short run. Real factories face adjustment costs, lumpiness, and multi-period construction delays.
        </li>
        <li>
          <strong>Cubic cost structure:</strong> Variable costs scale as $q^3$, reflecting rising congestion of fixed machines. While this guarantees clean closed forms, empirical cost curves often exhibit broad flat bottoms before capacity constraints bind.
        </li>
        <li>
          <strong>Absence of market demand:</strong> This explainer explores the cost side in isolation. In the subsequent article, <em>Perfect Competition</em>, we introduce market demand and price-taking entry to see how market clearing selects the equilibrium firm scale.
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
