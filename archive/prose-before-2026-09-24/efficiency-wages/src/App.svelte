<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import EffortLab from "./Components/EffortLab.svelte";
  import ElasticityFigure from "./Components/ElasticityFigure.svelte";
  import SizeCheck from "./Components/SizeCheck.svelte";
  import QueueFigure from "./Components/QueueFigure.svelte";
  import MonitorFigure from "./Components/MonitorFigure.svelte";
  import katexify from "./katexify.js";

  const effortEq = katexify(`e(w) = 1 - \\left(\\frac{w_r}{w}\\right)^{a}`, true);
  const solowEq = katexify(`\\left.\\frac{\\partial e}{\\partial w}\\cdot\\frac{w}{e}\\right|_{w^*} = 1`, true);
  const closedEq = katexify(`w^* = w_r\\,(1 + a)^{1/a}, \\qquad e^* = \\frac{a}{1 + a}`, true);
  const shirkEq = katexify(`w = w_r\\left(1 + \\frac{1}{p\\,F}\\right)`, true);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Here's a puzzle that opens every labour-economics course. Firms pay
      wages above the level at which willing workers are plentiful — often
      well above — and the workers they hire are not obviously better than
      the ones waiting outside. A market clears when the price balances the
      two sides; this price doesn't. Either the textbook supply-and-demand
      story is wrong, or the wage isn't doing the job we assumed it does.
    </p>
    <p>
      The answer this article builds is the second one, and it turns on a
      single observation: a wage buys <em>effort</em>, not hours. What the
      firm gets for its payroll is not headcount but attention, and effort
      responds to how well the job pays. So the firm's real problem is to
      buy effort cheaply — and we can put that whole problem on one curve.
    </p>
    <p class="eq">{@html effortEq}</p>
    <p>
      Effort rises with the wage, from nothing at the reservation wage
      <span class="mono">w_r</span> and flattening as the wage grows; the
      curvature control <span class="mono">a</span> says how fast. Drag the
      wage below and find the cheapest effort per unit of pay. Don't
      calculate — drag.
    </p>
  </section>

  <EffortLab />

  <section class="body-text">
    <h3 class="body-header">What you just found</h3>
    <p>
      Wherever you stopped dragging, cost per unit of effort has a minimum,
      and at that minimum something exact happens: a one-percent rise in the
      wage buys exactly one percent more effort. The
      <span class="bold">elasticity of effort</span> with respect to the
      wage is exactly 1 at the optimum — the
      <span class="bold">Solow condition</span>, and the same tangency you
      just found by hand:
    </p>
    <p class="eq">{@html solowEq}</p>
    <p>
      It's the same tangency geometry as the constrained-choice diagram, and
      for the same reason: cost lines through the origin are straight, so
      the cheapest one that still touches the curve touches it where their
      slopes match. For this effort family the tangency has a closed form,
    </p>
    <p class="eq">{@html closedEq}</p>
    <p>
      so at <span class="mono">a = 1</span> the optimal wage is exactly twice
      the reservation wage and the effort bought is exactly half. No
      labour-demand curve appears anywhere in it.
    </p>
  </section>

  <ElasticityFigure />

  <section class="body-text">
    <h3 class="body-header">Demand never enters</h3>
    <p>
      If the wage were set by supply and demand, the number of workers a
      firm wants would matter. Test it: the solver below is handed the
      firm's staffing target — one worker, ten, a thousand — and minimises
      total cost with that number in hand. It returns one wage for all of
      them, to the last bit, because the target multiplies a cost that the
      choice of wage doesn't change. The wage is a property of the effort
      curve alone; the demand curve decides how many workers stand at the
      wage, not what the wage is.
    </p>
  </section>

  <SizeCheck />
  <section class="body-text">
    <h3 class="body-header">So why the queue?</h3>
    <p>
      At the tangency wage, willing workers outnumber jobs. That's not a
      failure of the model — it's the model's engine. In the monitoring
      reading, a worker who shirks is caught with probability p and loses a
      job worth a premium over the fallback; the wage has to be high enough
      that getting caught hurts. The premium the discipline requires is
    </p>
    <p class="eq">{@html shirkEq}</p>
    <p>
      and the people waiting outside are what makes dismissal real: if the
      queue vanished, the fired worker would be rehired by lunchtime and the
      premium would buy nothing. The queue is the collateral behind the
      wage.
    </p>
  </section>

  <QueueFigure />

  <section class="body-text">
    <h3 class="body-header">Monitoring, penalties, and what actually collapses</h3>
    <p>
      Only the <em>product</em> of the catching probability and the penalty
      matters, so they are the same lever on a hyperbola — the same
      arithmetic this catalogue met in the audit-rate article, where raising
      the penalty bought less monitoring rather than more compliance. Here
      be precise about the collapse everyone quotes: <em>perfect
      monitoring alone</em> does not push the premium to zero. At p = 1 with
      a bounded penalty the premium is still 100%; the construction
      collapses only as the product pF grows without bound.
    </p>
  </section>

  <MonitorFigure />

  <section class="body-text">
    <h3 class="body-header">What this diagram costs you</h3>
    <p>
      First, one firm, one period, effort as a single number. Real effort
      has dimensions — care, speed, honesty — and real firms also use
      bonds, promotions and pride; the measured effort responses to wage
      premia are far gentler than this curve implies.
    </p>
    <p>
      Second, the unemployed here queue quietly and cost nothing. Once they
      search, the queue's length feeds back into the reservation wage, and
      the clean closed forms gain a labour-market block.
    </p>
    <p>
      And third, the fairness reading — people work harder when they feel
      paid fairly — produces the same above-market wages from different
      machinery, and the two explanations are still being told apart in the
      data.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">In one sentence</h3>
    <p>
      The wage buys effort, the cheapest effort sits where the effort
      elasticity is exactly one, labour demand never enters that number —
      and the workers left outside are the collateral, not the failure.
      Thanks for reading!
    </p>
  </section>

  <section class="body-text" id="resources">
    <h3 class="body-header">Sources and further reading</h3>
    <p>
      CORE Econ, <em>The Economy 2.0: Microeconomics</em> (2023), Unit 6 —
      the firm's wage as an incentive device, employment rents. Theirs: the
      wage as an incentive device and the employment rent. Solow (1979),
      <em>J. Macroeconomics</em> 1(1):79–82 — the elasticity condition;
      Shapiro and Stiglitz (1984), <em>AER</em> 74(3):433–444 — unemployment
      as a worker-discipline device; Akerlof and Yellen (1986) on the
      fair-wage reading. <strong>Verify each before relying on it.</strong>
      Ours: the effort family, the tangency lab, the closed forms, the
      L-invariance table, and every number, all computed from
      <span class="mono">src/effort.js</span> and asserted in
      <span class="mono">verify/check-numbers.mjs</span>.
    </p>
  </section>
</main>

<style>
  main {
    display: block;
  }
</style>