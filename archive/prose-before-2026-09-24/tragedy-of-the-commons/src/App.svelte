<script>
  /* App.svelte for tragedy-of-the-commons */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import TheLake from "./Components/TheLake.svelte";
  import TheSecondBoat from "./Components/TheSecondBoat.svelte";
  import WedgeFigure from "./Components/WedgeFigure.svelte";
  import LakeLab from "./Components/LakeLab.svelte";
  import DissipationFigure from "./Components/DissipationFigure.svelte";
  import MarginalUserFigure from "./Components/MarginalUserFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";

  const fEq = katexify("F(E) = A \\cdot E^\\theta, \\quad AP(E) = \\frac{A}{E^{1-\\theta}}, \\quad MP(E) = \\frac{\\theta A}{E^{1-\\theta}}", true);
  const focEq = katexify("\\left(1 - \\frac{1}{n}\\right) AP(E) + \\frac{1}{n} MP(E) = w", true);
  const dissipationEq = katexify("D(n) = 1 - \\frac{R(n)}{R^*} = \\left(\\frac{n - 1}{n}\\right)^2", true);
  const overshootEq = katexify("\\frac{E(n)}{E^*} = \\left(\\frac{2n - 1}{n}\\right)^2 \\longrightarrow 4", true);
  const halfRentEq = katexify("n = 2 + \\sqrt{2} \\approx 3.4142 \\text{ users}", true);
  const taxEq = katexify("t^* = AP(E^*) - MP(E^*) = 1.000", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="prose-section">
      <p>
        Consider an open pasture, an ocean fishery, an underground water aquifer, or a congested highway. When valuable economic resources lack exclusive property rights, they are governed by <strong>open access</strong>: anyone who invests private labor or capital is free to extract what they can.
      </p>
      <p>
        In 1954, Canadian economist H. Scott Gordon published a landmark paper revealing why open access relentlessly impoverishes communities. Left to decentralized extraction, users do not merely harvest the resource; they compete away the entire economic rent, leaving society with over-harvested ecosystems and zero net economic surplus.
      </p>
      <p>
        How fast does this wealth vanish? And who is responsible for the lion's share of the damage?
      </p>
    </section>

    <TheLake />

    <section class="prose-section">
      <p>
        To see the anatomy of the tragedy, consider a lake teeming with fish. Total catch $F(E)$ depends on total fishing effort $E$ (in hours) according to:
      </p>
      <div class="math-callout">
        {@html fEq}
      </div>
      <p>
        For a square-root resource ($\theta = 0.5$) with productivity $A = 100$ and opportunity cost of labor $w = \$1.00$ per hour, the <strong>socially efficient outcome</strong> maximizes total sustainable rent $R(E) = F(E) - w E$.
      </p>
      <p>
        A sole owner or cooperative council adds fishing hours until the marginal return equals the wage: $MP(E^*) = w \implies E^* = 2,500$ hours. Catch value is $\$5,000$, labor cost is $\$2,500$, and the lake generates <strong>$\$2,500$ of pure resource rent</strong>.
      </p>
    </section>

    <TheSecondBoat />

    <section class="prose-section">
      <p>
        Now declare the lake an open commons. What happens when a second boat arrives?
      </p>
      <p>
        A solitary fisher considers the marginal product: "If I fish one more hour, how many <em>new</em> fish are caught from the lake?" But in a shared commons, each fisher captures the <strong>average product</strong> of their time. If the lake yields 2 fish per hour on average, an individual boat gladly enters, even if its presence merely steals fish from existing nets.
      </p>
      <p>
        The entrance of boat #2 triggers a vicious feedback loop. Each fisher races to capture volume before the other. Total effort more than doubles to 5,625 hours. Catch rises modestly, costs skyrocket, and <strong>25.0% of the entire lake's rent is eradicated immediately</strong>!
      </p>
    </section>

    <WedgeFigure />

    <section class="prose-section">
      <p>
        In an $n$-player symmetric game, each user chooses personal effort $e_i$ to maximize private profit $\pi_i = (e_i / E) F(E) - w e_i$. The first-order condition reveals the exact structural wedge:
      </p>
      <div class="math-callout">
        {@html focEq}
      </div>
      <p>
        The decision weight placed on marginal product is only $1/n$, while the remaining $(n - 1)/n$ is governed entirely by average product.
      </p>
      <p>
        As $n$ grows, individual fishers become atomistic. They completely ignore their congestion impact on the lake, driving effort until average product falls to the wage ($AP = w$). At that point, the entire rent $R(E)$ drops to zero.
      </p>
    </section>

    <LakeLab />

    <section class="prose-section">
      <p>
        For standard square-root resources ($\theta = 0.5$), this mechanism yields two closed-form laws of nature:
      </p>
      <div class="math-callout">
        <strong>The Rent Dissipation Identity:</strong> {@html dissipationEq}
      </div>
      <div class="math-callout">
        <strong>The Effort Overshoot:</strong> {@html overshootEq}
      </div>
      <p>
        Notice the terrifying speed of destruction. At $n = 2$, 25% of rent is gone. At $n = 4$, 56.25% is wiped out. Exactly half of the lake's wealth is destroyed when:
      </p>
      <div class="math-callout">
        {@html halfRentEq}
      </div>
    </section>

    <DissipationFigure />

    <section class="prose-section">
      <p>
        As shown in the table above, by the time 20 boats operate on the lake, 90.25% of the natural rent is gone. In the infinite-user limit, effort overshoots to exactly four times the efficient level (10,000 hours), completely burning up all economic surplus in gasoline and labor.
      </p>
    </section>

    <MarginalUserFigure />

    <section class="prose-section">
      <p>
        This reveals the profound <strong>front-loading of common-pool destruction</strong>.
      </p>
      <p>
        We often blame large crowds for environmental collapse. But mathematically, the <strong>second entrant is the single most destructive user in the entire system</strong>, inflicting a 25.0-percentage-point blow to social wealth. Entrant #2 alone destroys more wealth than entrants 6 through 13 combined!
      </p>
    </section>

    <section class="prose-section">
      <h3>The Pigouvian Remedy</h3>
      <p>
        How can society stop the tragedy? If private property cannot be demarcated (you cannot fence the open ocean), the state or community can levy a <strong>Pigouvian fee</strong> per unit of effort:
      </p>
      <div class="math-callout">
        {@html taxEq}
      </div>
      <p>
        Charging a fee of $\$1.00$ per hour of fishing bridges the wedge between average product and marginal product. Fishers face an effective cost of $w + t^* = \$2.00$, instantly driving total effort back to the efficient 2,500 hours and preserving the full $\$2,500$ of natural wealth.
      </p>
    </section>

    <section class="prose-section limits-section">
      <h3>Model Limits &amp; Ostrom's Insight</h3>
      <p>
        The pure open-access model highlights non-cooperative failure, but has clear institutional boundaries:
      </p>
      <ul>
        <li>
          <strong>The open-access assumption:</strong> Hardin assumed commons are unmanaged "free-for-alls". As Nobel laureate Elinor Ostrom proved empirically, real communities frequently develop intricate informal norms, monitoring systems, and harvest calendars that prevent over-exploitation without central state taxes.
        </li>
        <li>
          <strong>Static stock vs biological regeneration:</strong> Here we model a static production function $F(E)$. In dynamic fisheries, over-fishing reduces the breeding biomass, potentially causing sudden population collapse rather than smooth rent dissipation.
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
