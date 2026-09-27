<script>
  /* App.svelte for monopolistic-competition */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import OneFirm from "./Components/OneFirm.svelte";
  import ElasticityFigure from "./Components/ElasticityFigure.svelte";
  import VarietyLab from "./Components/VarietyLab.svelte";
  import ScaleFigure from "./Components/ScaleFigure.svelte";
  import ExcessCapacityFigure from "./Components/ExcessCapacityFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";

  const demandEq = katexify("q_i = \\frac{E \\cdot p_i^{-\\sigma}}{\\sum_{j=1}^n p_j^{1-\\sigma}}", true);
  const epsEq = katexify("|\\varepsilon_i| = \\sigma - (\\sigma - 1) s_i = \\sigma - \\frac{\\sigma - 1}{n}", true);
  const nEq = katexify("n^* = \\frac{E/f + \\sigma - 1}{\\sigma}", true);
  const shortfallEq = katexify("1 - \\frac{x}{x_{\\text{DS}}} = \\frac{1}{n}", true);
  const excessVarietyEq = katexify("n_{\\text{market}} - n_{\\text{planner}} = \\frac{\\sigma - 1}{\\sigma} < 1", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="prose-section">
      <p>
        In pure perfect competition, all sellers provide identical commodities. In pure monopoly, a single firm supplies the entire industry. Yet the overwhelming majority of modern consumer markets—coffee shops, restaurants, software apps, craft breweries, and sneakers—inhabit the rich middle ground of <strong>monopolistic competition</strong>.
      </p>
      <p>
        Each business produces a distinctive variety that consumers cherish. If your favourite café raises prices by ten cents, you do not instantly abandon them for a competitor down the road. But neither can the café charge fifty dollars a cup: close substitutes surround it.
      </p>
      <p>
        This reveals the central economic conflict: <strong>variety is not free</strong>. Consumers love variety, but setting up a storefront requires paying a fixed overhead cost $f$. If an economy spreads its workforce across ten thousand tiny boutiques, it pays ten thousand overhead rents, leaving fewer resources to actually brew coffee. How does a competitive market decide how many varieties to create?
      </p>
    </section>

    <OneFirm />

    <section class="prose-section">
      <p>
        In 1977, Avinash Dixit and Joseph Stiglitz formulated the modern mathematical architecture of differentiated markets using Constant Elasticity of Substitution (CES) preferences. Total consumer expenditure across the sector is $E$. Given a menu of prices, demand for brand $i$ equals:
      </p>
      <div class="math-callout">
        {@html demandEq}
      </div>
      <p>
        The parameter $\sigma &gt; 1$ governs substitutability: as $\sigma \to \infty$, varieties become identical commodities; as $\sigma \to 1$, varieties become completely non-substitutable essentials.
      </p>
      <p>
        Almost every intermediate textbook claims that each firm faces a constant price elasticity equal to $\sigma$. But this is only an asymptotic approximation. When the market has a finite number of firms $n$, each firm occupies an expenditure share $s_i = 1/n$. The exact price elasticity is:
      </p>
      <div class="math-callout">
        {@html epsEq}
      </div>
    </section>

    <ElasticityFigure />

    <section class="prose-section">
      <p>
        Why does the true elasticity fall below $\sigma$? When an entrepreneur raises their price in a finite industry, they push up the general consumer price index. Because the outside alternative is now slightly more expensive, fewer consumers switch away than a naive model predicts.
      </p>
      <p>
        In a market with only two varieties ($n = 2$) and $\sigma = 4$, the perceived elasticity is not $4.0$, but $2.5$. Only as dozens of competitors enter does the market share $1/n$ shrink to near zero and restore the textbook elasticity.
      </p>
    </section>

    <VarietyLab />

    <section class="prose-section">
      <p>
        Capital flows into profitable sectors. As long as operating revenue exceeds variable costs plus fixed overhead, entrepreneurs start new brands. Setting profit to zero yields the exact free-entry variety count:
      </p>
      <div class="math-callout">
        {@html nEq}
      </div>
      <p>
        Comparing this decentralized market outcome to an idealized social planner yields three beautiful mathematical identities:
      </p>
      <div class="math-callout">
        <strong>Scale Shortfall:</strong> {@html shortfallEq}
      </div>
      <p>
        Each firm produces at scale <em>x</em> = <em>E</em> / (<em>n</em> <em>p</em>), falling short of the large-group production capacity <em>x</em><sub>DS</sub> = <em>f</em>(<em>&sigma;</em> &minus; 1)/<em>c</em> by <em>exactly</em> 1/<em>n</em>.
      </p>
      <div class="math-callout">
        <strong>Variety Overprovision:</strong> {@html excessVarietyEq}
      </div>
      <p>
        A benevolent central planner maximizing consumer utility subject to resource constraints chooses <em>n</em><sub>planner</sub> = <em>E</em> / (<em>f</em> <em>&sigma;</em>). The free market creates more varieties because each entrant steals revenue from incumbents. Yet remarkably, the market's overprovision is strictly bounded: it creates exactly (<em>&sigma;</em> &minus; 1)/<em>&sigma;</em> excess varieties—<strong>always less than a single firm</strong>!
      </p>
    </section>

    <ScaleFigure />

    <section class="prose-section">
      <p>
        As aggregate expenditure $E$ expands, market size drives individual firms toward efficiency. In small markets, fixed costs force firms to run small, expensive production batches. In large markets, thousands of varieties proliferate, yet each individual firm reaches its full operational scale.
      </p>
    </section>

    <ExcessCapacityFigure />

    <section class="prose-section">
      <p>
        For decades after Edward Chamberlin's 1933 treatise, economists criticized monopolistic competition for creating "excess capacity"—alleging that downward-sloping demand curves force firms to operate to the left of minimum average cost.
      </p>
      <p>
        As shown above, this critique collapses under modern analysis. With fixed overhead and constant marginal costs, average cost decreases monotonically forever: there is no finite minimum. Operating with unexhausted scale economies is not a market failure; it is the necessary cost of enjoying differentiated goods.
      </p>
    </section>

    <section class="prose-section limits-section">
      <h3>Model Limits &amp; Boundary Conditions</h3>
      <p>
        The Dixit-Stiglitz model provides an exceptionally tractable foundation, with specific simplifications:
      </p>
      <ul>
        <li>
          <strong>Symmetric substitution:</strong> Every variety substitutes equally well for every other variety. In physical retail or localized services, spatial competition (Hotelling / Salop circle) introduces localized rivalry.
        </li>
        <li>
          <strong>Constant expenditure share:</strong> Total sector spending $E$ is invariant to price. In general equilibrium, consumer spending on the differentiated sector responds to prices in other sectors.
        </li>
        <li>
          <strong>Identical cost structures:</strong> Entrants all pay identical overhead $f$ and marginal cost $c$. In heterogeneous firm models (e.g. Melitz 2003), productivity varies widely across entrants.
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
