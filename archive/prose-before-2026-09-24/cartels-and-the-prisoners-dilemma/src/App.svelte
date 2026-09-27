<script>
  /* App.svelte for cartels-and-the-prisoners-dilemma */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import TheQuestion from "./Components/TheQuestion.svelte";
  import TheAnswer from "./Components/TheAnswer.svelte";
  import MergerLab from "./Components/MergerLab.svelte";
  import FreeRideFigure from "./Components/FreeRideFigure.svelte";
  import ThresholdFigure from "./Components/ThresholdFigure.svelte";
  import WelfareFigure from "./Components/WelfareFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";

  const pi0Eq = katexify("\\pi(n) = \\frac{(a - c)^2}{(n + 1)^2}", true);
  const memEq = katexify("\\pi_{\\text{member}}(n, k) = \\frac{(a - c)^2}{k (n - k + 2)^2}", true);
  const outEq = katexify("\\pi_{\\text{outsider}}(n, k) = \\frac{(a - c)^2}{(n - k + 2)^2}", true);
  const ratioEq = katexify("\\pi_{\\text{outsider}} = k \\cdot \\pi_{\\text{member}}", true);
  const condEq = katexify("k (n - k + 2)^2 < (n + 1)^2", true);
  const mMaxEq = katexify("m_{\\text{max}} \\approx \\lfloor\\sqrt{n}\\rfloor - 2", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="prose-section">
      <p>
        In popular imagination, corporate collusion is an easy path to riches: competing firms quietly meet in a back room, agree to raise prices, and divide up the monopoly profits.
      </p>
      <p>
        Yet in industrial economics, cartels are notorious for being fragile, short-lived, and economically self-defeating. In 1983, economists Stephen Salant, Sheldon Switzer, and Robert Reynolds uncovered a startling mathematical paradox: <strong>unless a cartel encompasses almost every firm in the industry, colluding actually reduces members' profits</strong>.
      </p>
      <p>
        Why does coordinating output backfire? And why is the temptation to cheat on an agreement so mathematically overwhelming?
      </p>
    </section>

    <TheQuestion />

    <section class="prose-section">
      <p>
        To see the mechanism clearly, consider an industry governed by Cournot quantity competition. Market demand is linear: $P(Q) = a - Q$, and all firms share identical constant marginal cost $c$.
      </p>
      <p>
        When $n$ independent firms compete without coordination, each firm produces $q = (a - c)/(n + 1)$ and earns:
      </p>
      <div class="math-callout">
        {@html pi0Eq}
      </div>
      <p>
        Now suppose $k$ of these $n$ firms form a cartel, merging their production decisions into a single collective unit. The market now contains only $(n - k + 1)$ effective competitors: 1 coordinated cartel plus $(n - k)$ independent outsiders.
      </p>
    </section>

    <TheAnswer />

    <section class="prose-section">
      <p>
        Because the cartel acts as a single Cournot player, it restricts its total output to behave like one normal-sized rival. Its members share the resulting profit equally:
      </p>
      <div class="math-callout">
        {@html memEq}
      </div>
      <p>
        Meanwhile, every firm that refused to join the cartel remains an unconstrained outsider. The outsider observes the cartel's output restriction and moves along its downward-sloping reaction curve to expand its own sales, earning:
      </p>
      <div class="math-callout">
        {@html outEq}
      </div>
      <p>
        Comparing these two formulas reveals one of the most elegant identities in oligopoly theory:
      </p>
      <div class="math-callout">
        <strong>The Outsider Identity:</strong> {@html ratioEq}
      </div>
      <p>
        In <em>any</em> industry and for <em>any</em> cartel size $k$, <strong>an outsider earns exactly $k$ times as much profit as a cartel member</strong>.
      </p>
    </section>

    <MergerLab />

    <section class="prose-section">
      <p>
        When is a cartel actually profitable for its participants? Collusion is profitable if and only if a member's share of collusive profits exceeds what it would have earned under standard competition:
      </p>
      <div class="math-callout">
        {@html condEq}
      </div>
      <p>
        In a 5-firm market, if 2 firms collude ($k = 2$), they suffer a 28% drop in earnings. If 3 firms collude ($k = 3$), they still lose 25%.
      </p>
      <p>
        When $k = 4$, we hit a remarkable <strong>knife-edge equality</strong>: four of five firms merging leaves each member with exactly $\$225.00$—bit-for-bit identical to the uncoordinated baseline! Only when all five firms form a complete monopoly ($k = 5$) does the cartel finally earn positive excess returns.
      </p>
    </section>

    <FreeRideFigure />

    <section class="prose-section">
      <p>
        This identity exposes the core vulnerability of all cartels: the <strong>free-rider problem</strong>.
      </p>
      <p>
        At $n = 5$ and $k = 4$, the four cartel members make $\$225$ each. But the single outsider earns $\$900$—a 300% windfall! Every cartel member looks at the outsider with intense envy. If one member defects, the cartel shrinks to $k = 3$, turning into an unprofitable disaster for the remaining members, while the defecting firm enjoys outsider riches.
      </p>
    </section>

    <ThresholdFigure />

    <section class="prose-section">
      <p>
        How many firms can afford to free-ride? As industry size $n$ grows, the number of firms that can stay out without bankrupting the cartel scales as:
      </p>
      <div class="math-callout">
        {@html mMaxEq}
      </div>
      <p>
        In an industry of 100 firms, at most 8 firms can free-ride. The remaining 92 firms (92% of the market!) must actively participate in the conspiracy. In fragmented industries with hundreds of sellers, voluntary cartels are mathematically impossible to sustain without state coercion.
      </p>
    </section>

    <WelfareFigure />

    <section class="prose-section">
      <p>
        When cartels do manage to form, who bears the cost?
      </p>
      <p>
        Collusion transfers wealth from consumers to producers, but this transfer is profoundly inefficient. Price increases destroy consumer surplus, generate deadweight loss, and funnel the lion's share of profits not to the conspirators, but to non-participating outsiders.
      </p>
    </section>

    <section class="prose-section limits-section">
      <h3>Model Assumptions &amp; Real-World Collusion</h3>
      <p>
        The static Cournot framework isolates the pure non-cooperative incentives of collusion, but differs from repeated market dynamics:
      </p>
      <ul>
        <li>
          <strong>Static vs repeated interaction:</strong> In reality, firms interact repeatedly over time. Repeated games permit "grim trigger" or "tit-for-tat" strategies where threats of future price wars can sustain collusion if discount factors are sufficiently high (Friedman 1971).
        </li>
        <li>
          <strong>Symmetric cost structures:</strong> We assume all firms share identical marginal costs $c$. If one firm has significantly lower costs, it often prefers aggressive competition to collusive volume restrictions.
        </li>
        <li>
          <strong>Price vs quantity competition:</strong> Under Bertrand price competition, any price above marginal cost is instantly undercut unless capacity constraints bind.
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
