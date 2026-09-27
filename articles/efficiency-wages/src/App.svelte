<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import EffortLab from "./Components/EffortLab.svelte";
  import ElasticityFigure from "./Components/ElasticityFigure.svelte";
  import SizeCheck from "./Components/SizeCheck.svelte";
  import QueueFigure from "./Components/QueueFigure.svelte";
  import MonitorFigure from "./Components/MonitorFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import { WR, closedWage, closedEffort, closedUnitCost, premiumPct } from "./effort.js";

  const effortEq = katexify(`e(w) = 1 - \\left(\\frac{w_r}{w}\\right)^{a}`, true);
  const solowEq = katexify(`\\left.\\frac{\\partial e}{\\partial w}\\cdot\\frac{w}{e}\\right|_{w^*} = 1`, true);
  const closedEq = katexify(`w^* = w_r\\,(1 + a)^{1/a}, \\qquad e^* = \\frac{a}{1 + a}`, true);
  const shirkEq = katexify(`w = w_r\\left(1 + \\frac{1}{p\\,F}\\right)`, true);
  const wr = katexify(`w_r`);
  const premium = katexify(`R = w - w_r`);

  const wStar = closedWage(WR, 1);
  const eStar = closedEffort(1);
  const costStar = closedUnitCost(WR, 1);
  const P_LOW = 0.05, P_MID = 0.2;
  const pctLow = premiumPct(P_LOW);
  const pctMid = premiumPct(P_MID);
  const pctFull = premiumPct(1);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we run a firm and we're deciding what to pay our staff.
        Plenty of people would take the job at a wage of {WR}, which we'll call
        the <span class="bold">reservation wage</span>, the lowest pay at which
        someone is willing to work. So why would we ever pay more than that?
      </p>
      <p>
        The simplest supply-and-demand story says we shouldn't. If more people want the job than
        there are jobs, the wage should fall until the two sides balance. Yet
        many firms do pay more than the lowest wage they could hire at, and the
        people they hire aren't obviously better than the ones who'd take less.
        Either the firms are making a mistake, or the wage is doing a job that
        the simple story leaves out.
      </p>
      <p>
        In this article, we'll follow the second idea. A wage doesn't only buy
        hours, it also buys <span class="bold">effort</span>, how hard people
        work while they're there, and effort depends on how well the job pays.
        So our real problem is to buy effort as cheaply as we can. As we'll
        see, that problem fits on a single curve, and the number of workers we
        want never enters it.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Buying effort</h3>
      <p>
        Let's describe how effort responds to the wage w with a curve:
      </p>
      {@html effortEq}
      <p>
        At the reservation wage {@html wr}, effort is zero, because the job pays
        no more than the worker's next best option. As the wage rises, effort
        rises too, and then it flattens out. The number a controls the shape,
        so a bigger a means effort climbs faster at first and levels off
        sooner.
      </p>
      <p>
        What we care about is the cost of each unit of effort, which is the
        wage divided by the effort it buys. In the lab below, the pink dashed
        line runs from the origin through the blue dot. Its slope is effort per
        unit of wage, so the steeper the line, the cheaper each unit of effort.
        Drag the wage and try to find the cheapest point before you read on.
      </p>
    </section>

    <EffortLab />

    <section class="body-text">
      <h3 class="body-header">What the cheapest point looks like</h3>
      <p>
        You probably found it where the dashed line just touches the curve
        without cutting through it. That's the steepest line from the origin
        that still reaches the curve, so it's where effort is cheapest. It's
        the same kind of tangency as in our article on
        <a href="../constrained-choice/">constrained choice</a>, and for the
        same reason: lines through the origin are straight, so the best one
        touches the curve where their slopes match.
      </p>
      <p>
        There's another way to say this. The <span class="bold">elasticity of
        effort</span> is the percentage rise in effort that a 1% rise in the
        wage buys. If it's above one, a higher wage makes effort cheaper, and if
        it's below one, a lower wage does. So at the cheapest point, it's
        exactly one:
      </p>
      {@html solowEq}
      <p>
        This is known as the <span class="bold">Solow condition</span>, after
        Robert Solow. For our effort curve, we can solve it and get
      </p>
      {@html closedEq}
      <p>
        With a = 1, our firm's best wage is {wStar}, twice the reservation wage,
        and it buys an effort of {eStar}, so each unit of effort costs
        {costStar}. The chart below shows the elasticity for three values of a,
        and you'll see that each curve crosses one at its own best wage.
      </p>
    </section>

    <ElasticityFigure />

    <section class="body-text">
      <h3 class="body-header">Does it matter how many workers we want?</h3>
      <p>
        If the wage were set by supply and demand, the number of workers we
        want to hire would matter. So let's test it. The table below hands a
        solver our staffing target, one worker, ten, a hundred or a thousand,
        and asks it for the wage that makes our total wage bill per unit of
        effort as small as possible.
      </p>
      <p>
        You'll see that it returns the same wage every time. That's because the
        number of workers multiplies the total cost without changing which wage
        makes each unit of effort cheapest. So in this model, the wage depends
        only on the effort curve. How many workers we want decides how many we
        hire at that wage, but not the wage itself.
      </p>
    </section>

    <SizeCheck />

    <section class="body-text">
      <h3 class="body-header">So why the queue?</h3>
      <p>
        At our best wage of {wStar}, more people want to work than we'll hire.
        In the figure below, we've given the firms in our town a wage bill that
        only stretches to some of the people who'd like a job at that wage, and
        the rest wait outside. Supply and demand would call that a market that
        hasn't cleared. In this model, though, the queue is part of how the
        wage works.
      </p>
    </section>

    <QueueFigure />

    <section class="body-text">
      <p>
        To see why, let's look at one well-known version of the story, where
        the problem is that we can't watch everyone all the time. A worker
        weighs what slacking off would gain them against the risk of being
        caught. Let's say a slacker is caught with probability p, and that
        getting caught costs them F times the premium {@html premium} that our
        job pays over their fallback. To keep things simple, we'll also say
        that slacking off is worth {@html wr} to them. The worker stays honest
        as long as p × F × R is at least {@html wr}, so the lowest wage that
        keeps everyone working is
      </p>
      {@html shirkEq}
      <p>
        This is where the queue comes in. Losing the job only hurts because
        there isn't another one like it waiting. If there were no queue, a
        worker who was caught and fired could walk straight into a new job at
        the same pay, and the threat would lose its bite. So the people waiting
        outside are what gives the premium its force.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Watching more closely, or punishing harder</h3>
      <p>
        Only the product pF appears in our formula, so for the premium it
        doesn't matter whether we catch slackers more often or punish them
        harder. Doubling one has the same effect as doubling the other. A
        similar trade-off came up in our article on
        <a href="../nash-equilibrium/">Nash equilibrium</a>, where raising a
        penalty bought less monitoring rather than less misconduct.
      </p>
      <p>
        The chart below plots the premium against p, with F = 1. With a small
        chance of being caught, p = {P_LOW}, the premium has to be {pctLow}% of
        the reservation wage. At p = {P_MID}, it's {pctMid}%. Notice what
        happens at p = 1, too. In our version, p is a probability,
        so it can't go above one, and even with perfect monitoring the premium
        is still {pctFull}% as long as the penalty stays at F = 1. The premium
        only shrinks towards zero as pF grows without limit, which here means
        an ever harsher penalty.
      </p>
    </section>

    <MonitorFigure />

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Our model is small, and three of its simplifications are worth keeping
        in mind before you use it.
      </p>
      <p>
        First, there's one firm, one period and a single number for effort.
        Real effort has several sides, such as care, speed and honesty, and
        real firms also motivate people with promotions, bonuses and pride.
        Nothing guarantees that real effort responds to pay as strongly as our
        curve does.
      </p>
      <p>
        Second, the people in our queue just wait. In a fuller model, the
        length of the queue affects how quickly a fired worker can find a new
        job, which feeds back into the reservation wage, and our tidy formulas
        pick up a whole labour market.
      </p>
      <p>
        And finally, there's another story that gives a similar result. If
        people work harder when they feel fairly paid, firms also end up paying
        more than the lowest wage they could hire at, for different reasons.
        It isn't easy to tell the two stories apart in the data.
      </p>
    </section>

    <Conclusion />
    <Resources />
  </main>
</div>

<style>
  .page-wrap {
    min-height: 100vh;
  }
  /* global.css gives .body-text and .body-header 80% each on a phone, so a
     heading inside a section was indented to 64%. Inside a section it should
     line up with the paragraphs. */
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
