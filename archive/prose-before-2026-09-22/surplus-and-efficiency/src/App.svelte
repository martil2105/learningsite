<script>
  /*
    App.svelte for surplus-and-efficiency
  */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import SpineFigure from "./Components/SpineFigure.svelte";
  import TheTriangle from "./Components/TheTriangle.svelte";
  import TheQueue from "./Components/TheQueue.svelte";
  import RationLab from "./Components/RationLab.svelte";
  import RatioFigure from "./Components/RatioFigure.svelte";
  import InstrumentFigure from "./Components/InstrumentFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import { q0 } from "./market.js";

  const gapEq = katexify(`\\text{gap}(q) = P_d(q) - P_s(q) = 50 - k \\cdot q, \\quad k = \\frac{B + S}{B \\cdot S} = \\frac{5}{6}`, true);
  const tsEq = katexify(`\\text{TS}(q) = \\int_0^q \\text{gap}(u)\\,\\mathrm{d}u = \\left(\\frac{A}{B} + \\frac{C}{S}\\right) q - \\frac{1}{2} k q^2`, true);
  const identityCEq = katexify(`\\frac{\\text{Total Loss}}{\\text{TS}^*} = d^2 + d(1 - d) = d`, true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="prose-section">
      <p>
        In microeconomic theory, the market clearing quantity where supply equals demand is praised for achieving <strong>Pareto efficiency</strong>: it maximises the <strong>total surplus</strong>, or the sum of consumer valuations minus producer costs across all traded units.
      </p>

      <p>
        When governments intervene to restrict output — whether through production quotas, tariffs, or price ceilings — introductory courses demonstrate the resulting harm using a familiar shaded wedge: the <strong>Harberger deadweight loss triangle</strong>. Because this triangle shrinks with the square of the quantity cut, economists have often concluded that the social cost of minor market interference is trivially small. A 10% supply shortfall, after all, sacrifices only 1% of the total surplus.
      </p>

      <p>
        That reassuring calculation is only half the accounting. When quantity is suppressed by a price ceiling that prevents the market from clearing, the units that still trade must be rationed somehow. If they are distributed by lottery, queueing, or personal ties rather than to whoever values them most, the resulting <strong>misallocation loss</strong> is not second order: it is <em>first order</em>.
      </p>
    </section>

    <!-- 1. The Comparison Spine: SpineFigure -->
    <SpineFigure />

    <section class="prose-section">
      <p>
        Figure 1 holds the two loss channels side by side. In the left panel, we see <strong>the wrong quantity</strong>: {q0} units would have traded in competitive equilibrium, but only 44 are supplied, leaving mutually beneficial trades unmade. In the right panel, we see <strong>the wrong people</strong>: 84 willing buyers compete for those 44 units, and random rationing hands them out without regard to buyer valuation.
      </p>

      <p>
        When you add the two channels together, a startling regularity emerges:
      </p>

      {@html identityCEq}

      <p>
        The triangle costs {@html katexify("d^2")}. The misallocation costs {@html katexify("d(1 - d)")}. Their sum is identically {@html katexify("d")}, the fractional quantity cut itself. In any linear market with random rationing, cutting output by 27% destroys <em>exactly</em> 27% of the total potential surplus.
      </p>
    </section>

    <!-- 2. Channel 1: TheTriangle -->
    <TheTriangle />

    <section class="prose-section">
      <p>
        To understand why the triangle behaves so differently from rationing, examine the marginal surplus gap between buyer valuation and seller cost:
      </p>

      {@html gapEq}

      <p>
        Integrating this surplus gap from zero to {@html katexify("q")} yields total economic surplus:
      </p>

      {@html tsEq}

      <p>
        Because {@html katexify("P_d(q^*) = P_s(q^*)")}, the marginal gains from trade approach zero as quantity nears 60. The trades that disappear first when quantity is restricted are precisely those where the buyer barely valued the good above the producer's cost. This is why a blind numerical search finds the surplus maximum at exactly {@html katexify("q^* = 60")}, and why a 1% cut costs just {@html katexify("0.01\\%")} of total welfare.
      </p>
    </section>

    <!-- 3. Channel 2: TheQueue -->
    <TheQueue />

    <section class="prose-section">
      <p>
        A downward-sloping linear demand curve is literally a uniform distribution of consumer valuations. The equation {@html katexify("q = 120 - 3p")} describes 120 potential buyers whose maximum willingness to pay spans evenly from £0 to £40.
      </p>

      <p>
        When a price ceiling is imposed at £12, suppliers produce only 44 units. But at £12, every consumer with a valuation above £12 wants to buy — meaning 84 willing buyers queue for 44 units.
      </p>

      <p>
        Under a price mechanism, those 44 units go exclusively to the 44 consumers who value them most (between £25.33 and £40, averaging £32.67). But under random rationing, units are scattered uniformly across the entire pool of 84 applicants (averaging £26.00). That £6.67 degradation in average value per unit destroys £293.33 of economic surplus — nearly three times the £106.67 lost from the missing trades.
      </p>
    </section>

    <!-- 4. The Hook: RationLab -->
    <RationLab />

    <section class="prose-section">
      <p>
        In practice, non-price rationing is rarely pure lottery. Queues select on the opportunity cost of time, while waiting lists may favour established buyers. In the Rationing Lab above, the sorting efficiency parameter {@html katexify("\\theta")} captures this degree of allocation quality.
      </p>

      <p>
        When {@html katexify("\\theta = 0")}, rationing is fully random. When {@html katexify("\\theta = 1")}, units find their way to the highest-valuation consumers (as happens under a production quota or frictionless secondary resale). Notice that even when sorting is 50% efficient ({@html katexify("\\theta = 0.50")}), rationing misallocation remains larger than the deadweight loss triangle.
      </p>
    </section>

    <!-- 5. Ratio and Crossing: RatioFigure -->
    <RatioFigure />

    <section class="prose-section">
      <p>
        Dividing the two losses reveals our second linear identity:
      </p>

      {@html katexify(`\\frac{\\text{Misallocation}}{\\text{Triangle}} = \\frac{q}{q^* - q} = \\frac{1 - d}{d}`, true)}

      <p>
        The ratio of rationing destruction to triangle destruction depends on only one variable: the number of units that still trade divided by the number of units that no longer do.
      </p>

      <p>
        As shown in Figure 5, the two curves intersect at exactly {@html katexify("d = 0.50")}, where misallocation reaches its theoretical maximum of 25% of total surplus. For any policy intervention that restricts output by less than half, the harm from misallocating surviving units is strictly greater than the harm from missing trades.
      </p>
    </section>

    <!-- 6. Instrument Choice: InstrumentFigure -->
    <InstrumentFigure />

    <section class="prose-section">
      <p>
        This analysis delivers a decisive lesson for public policy: the welfare cost of an output reduction is determined primarily by the <em>regulatory instrument</em>, not the size of the shortfall.
      </p>

      <p>
        A production quota of 54 units (a 10% cut) lets price rise to £22, ensuring goods flow to those who value them most; it costs 1% of total surplus. A price ceiling of £17 produces the exact same 54 units, but suppresses the clearing price, inducing rationing that destroys 10% of total surplus. At identical quantities, the price ceiling inflicts {@html katexify("1/d = 10\\times")} the economic damage of the quota.
      </p>
    </section>

    <section class="prose-section limits-section">
      <h3>Scope and Analytical Boundaries</h3>
      <p>
        Our derivations assume linear demand and supply with zero income effects, allowing consumer surplus to serve as an exact monetary metric of welfare (we formalise equivalent and compensating variation in our companion essay, <em>Welfare Measures</em>). If secondary markets operate without transaction costs, resale re-establishes efficient allocation and eliminates misallocation entirely — though physical queueing often dissipates the surplus as waiting costs instead.
      </p>
      <p>
        Note that the triangle formula {@html katexify("\\frac{1}{2} k (q^* - q)^2")} is mathematically identical to the tax deadweight loss {@html katexify("\\frac{1}{2} t^2 \\frac{BS}{B + S}")} examined in <a href="../tax-incidence/">Tax Incidence</a>, where a tax rate {@html katexify("t")} induces a quantity cut {@html katexify("q^* - q = t \\frac{BS}{B + S}")}. Finally, while this chapter examines the total <em>size</em> of the surplus, the equitable division of that surplus between buyers and sellers is the subject of <em>Bargaining &amp; the Surplus</em>.
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
    max-width: 740px;
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
    margin: 0 0 0.75rem 0;
    color: #475569;
    line-height: 1.55;
  }
  .limits-section p:last-child {
    margin-bottom: 0;
  }

  .limits-section a {
    color: var(--violet);
    text-decoration: underline;
    font-weight: 600;
  }
</style>
