<script>
  /* App.svelte for perfect-competition */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import TheFirm from "./Components/TheFirm.svelte";
  import EntryRun from "./Components/EntryRun.svelte";
  import TheLastFirm from "./Components/TheLastFirm.svelte";
  import SawtoothFigure from "./Components/SawtoothFigure.svelte";
  import WelfareFigure from "./Components/WelfareFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";

  const mcEq = katexify("MC(q) = c + \\gamma q", false);
  const acEq = katexify("AC(q) = \\frac{f}{q} + c + \\frac{1}{2} \\gamma q", false);
  const minScaleEq = katexify("q^* = \\sqrt{\\frac{2f}{\\gamma}} = 10, \\quad AC^* = c + \\sqrt{2 f \\gamma} = 20", true);
  const priceClearEq = katexify("P(n) = \\frac{A + n c / \\gamma}{B + n / \\gamma}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="prose-section">
      <p>
        In standard economic textbooks, <strong>perfect competition</strong> is introduced as an idealised state: thousands of atomistic price-takers, price equal to marginal cost, and long-run economic profits ground down to absolute zero.
      </p>
      <p>
        Yet in real markets, firms are not infinitesimal dust. They are indivisible legal and physical entities that enter one at a time. Each entrant brings its own overhead and adds a discrete chunk of output to market supply.
      </p>
      <p>
        When firms are whole numbers, the classical picture of a flat, frictionless horizontal supply curve fractures. In its place emerges a dynamic sequence of entry decisions, persistent integer rents, and a long-run supply curve that is not flat at all, but a <strong>sawtooth</strong>.
      </p>
    </section>

    <TheFirm />

    <section class="prose-section">
      <p>
        To understand the mechanics of entry, we begin with a single representative firm facing cost structure:
      </p>
      <div class="math-callout">
        {@html acEq} &emsp; and &emsp; {@html mcEq}
      </div>
      <p>
        With overhead $f = 50$, baseline operating cost $c = 10$, and capacity slope $\gamma = 1$, the plant reaches its lowest unit cost at:
      </p>
      <div class="math-callout">
        {@html minScaleEq}
      </div>
      <p>
        At any market price above $P = 20$, producing at marginal cost ($P = MC$) generates positive economic profit ($\pi &gt; 0$). At any price below $20$, unit costs exceed price and every operating firm bleeds cash.
      </p>
    </section>

    <EntryRun />

    <section class="prose-section">
      <p>
        When existing firms earn supernormal profits, entrepreneurs outside the industry notice. Capital flows toward high returns: new firms enter, building factories and bringing additional supply to market.
      </p>
      <p>
        Given linear market demand $Q_D(P) = A - B P$, each additional entrant shifts aggregate supply rightward. Market price clears at:
      </p>
      <div class="math-callout">
        {@html priceClearEq}
      </div>
      <p>
        With each new firm, market price falls, each incumbent contracts its individual production toward $q^* = 10$, and industry profit margins compress. The simulation above traces this exact cascade from a solitary monopolist ($n = 1$) down to competitive equilibrium.
      </p>
    </section>

    <TheLastFirm />

    <section class="prose-section">
      <p>
        Now consider the critical friction: <strong>firms cannot enter in fractions</strong>.
      </p>
      <p>
        If market demand requires $n^* = 59.5$ firms to drive price exactly to $AC^* = 20$, what happens? The 59th firm enters happily, earning positive profits. But a potential 60th entrant calculates post-entry price: if it enters, the market will be flooded, price will drop to $\$19.93$, and all 60 firms will lose $\$0.66$ per period.
      </p>
      <p>
        The 60th firm stays out. Free entry halts at $n = 59$. As a result, the 59 incumbent firms enjoy a persistent <strong>integer rent</strong> ($\pi = \$4.35$ each) that cannot be competed away by free entry. The lumpiness of the firm acts as a natural barrier to entry.
      </p>
    </section>

    <SawtoothFigure />

    <section class="prose-section">
      <p>
        This indivisibility transforms the textbook long-run supply curve. Rather than being perfectly horizontal at $P = 20$, competitive supply is a <strong>sawtooth curve</strong>.
      </p>
      <p>
        For any fixed number of firms $n$, small increases in demand travel up the short-run supply curve, driving price above $20$. Price continues climbing until demand is strong enough to allow an additional firm to break even post-entry. At that tipping point, an entrant arrives, market supply jumps discretely, and price snaps back down toward minimum average cost.
      </p>
    </section>

    <WelfareFigure />

    <section class="prose-section">
      <p>
        Does decentralized free entry achieve the social optimum? Total economic surplus is the sum of consumer surplus and producer surplus.
      </p>
      <p>
        In this baseline market, total surplus peaks at $n = 60$ ($TS = \$9,000$). Decentralized entry aligns remarkably well with social welfare because firms take market prices as given and enter until marginal profit is exhausted.
      </p>
      <p>
        Yet as we will see in the subsequent chapters, this harmony breaks down the moment firms possess market power or when product differentiation enters the equation.
      </p>
    </section>

    <section class="prose-section limits-section">
      <h3>Model Assumptions &amp; Real-World Boundaries</h3>
      <p>
        The classical model of perfect competition rests on strict assumptions that provide clean benchmarks:
      </p>
      <ul>
        <li>
          <strong>Homogeneous products:</strong> Consumers view goods from all sellers as perfect substitutes. In practice, brand, location, and packaging differentiate products.
        </li>
        <li>
          <strong>Symmetric technology:</strong> Every entrant has access to the identical cost curve $C(q)$. In reality, incumbents often enjoy lower costs due to learning-by-doing or prime real estate.
        </li>
        <li>
          <strong>Instantaneous adjustment:</strong> Entry occurs without friction as soon as $\pi &gt; 0$. In real industries, permitting, construction, and financing introduce significant lag.
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
