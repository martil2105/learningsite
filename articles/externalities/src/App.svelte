<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import GapFigure from "./Components/GapFigure.svelte";
  import InstrumentLab from "./Components/InstrumentLab.svelte";
  import SlopeFigure from "./Components/SlopeFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import { B, E, pD, pS, q0, qSocial, welfare, instruments, weitzman } from "./externality.js";

  const gapEq = katexify(`q_s = q_0 - e\\,\\frac{B\\,S}{B + S}`, true);
  const pigouEq = katexify(`t = e \\quad\\Longrightarrow\\quad q_t = q_s`, true);
  const weitzEq = katexify(`\\frac{\\text{expected loss, tax}}{\\text{expected loss, quota}} = \\left(\\frac{g}{b}\\right)^{2}`, true);

  const demandEq = katexify(`q = A - B\\,p`);
  const supplyEq = katexify(`q = C + S\\,p`);

  const gap = q0 - qSocial;
  const buyersPay = pD(qSocial);
  const plantCost = pS(qSocial);
  const lost = (welfare(qSocial) - welfare(q0)).toFixed(0);
  const money = instruments();

  // The slope ratios the prose reads off, at the resolution the checks use.
  const FLAT = 0.5, STEEP = 2, CORNER = 8;
  const ratioAt = (r) => weitzman(r * B, 20, 41, 40000).ratio;
  // +x.toFixed(2) drops trailing zeros: 0.25 and 4, not 0.25 and 4.00.
  const rFlat = +ratioAt(FLAT).toFixed(2);
  const rSteep = +ratioAt(STEEP).toFixed(2);
  const rCorner = ratioAt(CORNER).toFixed(0);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we're in charge of regulating a stretch of river. Upstream
        there's a plant, and downstream there's a town that takes its drinking
        water from the river. Every unit the plant makes earns it some money,
        and it also does {E} of damage to the town's water. The town gets none
        of the plant's revenue and all of the damage.
      </p>
      <p>
        The plant's books only count the costs the plant pays itself, so the
        market settles at {q0} units. If we add the town's damage to the
        plant's costs, the best output for everyone together is {qSocial}. A
        cost like this, which falls on someone outside the deal between buyer
        and seller, is called an <span class="bold">externality</span>.
      </p>
      <p>
        If you've met externalities in a first course, you'll know that the
        target is the easy part: output should come down to {qSocial}. What
        people argue about is how to get there: we could tax the plant, cap
        its output, or leave the town and the plant to strike a deal. As we'll
        see, if we know the costs, all three reach the same output and move the
        same amount of money, just into different pockets. So the choice seems
        to be only about who ends up with the money. Once we're unsure of the
        costs, though, one instrument does better than the other, and which one
        comes down to comparing two slopes.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Where the gap comes from</h3>
      <p>
        Let's start by seeing why the market stops at {q0}. In the chart below,
        the grey lines are demand and the plant's own supply curve, and they
        cross at the market's {q0} units. The dashed line adds the town's
        {E} to every unit the plant makes, and it crosses demand at {qSocial}
        instead. If you look at the pink line at {q0} units, you'll see that
        its height is the damage per unit that the market leaves out.
      </p>
    </section>

    <GapFigure />

    <section class="body-text">
      <p>
        We can write the gap between the two outputs down. Let's say demand is
        {@html demandEq} and the plant's supply is {@html supplyEq}, so B and S measure
        how strongly buyers and the plant respond to the price. If the external
        cost is e per unit, the market's output q<sub>0</sub> and the best
        output q<sub>s</sub> are related by
      </p>
      {@html gapEq}
      <p>
        In other words, the gap is the uncounted cost scaled by how strongly the
        market responds to prices, and with our numbers it comes to {gap}
        units. Every one of those units is worth less to buyers than it costs
        the plant and the town together, and over the {gap} units that adds up
        to a loss of {lost}.
      </p>
      <p>
        There's one more thing to notice at {qSocial} units. Buyers there are
        willing to pay {buyersPay}, and the plant's own cost is {plantCost}, so
        the gap between them is {E}, the damage per unit. That gap is the clue
        to our first instrument.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Three instruments, one output</h3>
      <p>
        Let's start with a tax. If we charge the plant {E} for every unit it
        makes, the town's damage shows up in the plant's own sums, and the plant
        chooses {qSocial} by itself:
      </p>
      {@html pigouEq}
      <p>
        A tax set equal to the external cost like this is called a
        <span class="bold">Pigouvian tax</span>, after the economist Arthur
        Pigou. A quota gets us to the same place by rule: we simply cap the
        plant's output at {qSocial} units.
      </p>
      <p>
        A bargain gets there by agreement. If the town has the right to clean
        water, the plant can pay the town {E} for each unit of damage, and it'll
        only make the units that are worth more than that to it. Ronald Coase
        pointed out in 1960 that if the two sides can bargain freely, output
        ends up in the same place whoever holds the rights. If the plant holds
        them, the town pays the plant to cut back instead. Output still comes
        down, but the money flows the other way, and it's a smaller sum, since
        the town won't pay more than the damage it avoids.
      </p>
      <p>
        Now let's look at the money. Use the buttons in the lab below to switch
        between the three instruments. You'll see that the output bar doesn't
        move, because all three reach {qSocial} units. The money bar doesn't
        move either. The tax raises {money.taxRevenue}, the quota hands the
        plant {money.quotaRent} of extra margin, and the town's bargain collects
        {money.bargainPayment}. They match because each one is the same {E}
        gap, taken on each of the {qSocial} units.
      </p>
    </section>

    <InstrumentLab />

    <section class="body-text">
      <p>
        So when we know the costs, the choice between the three looks like a
        choice about who gets the money, and not about how much the plant makes.
        That's a real question of fairness, but it isn't a question of
        efficiency.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What if we don't know the costs?</h3>
      <p>
        Everything so far assumed that we know the whole picture: the damage,
        the plant's costs and what buyers will pay. In practice, those are
        estimates, and the plant's side is often the hardest to pin down. So
        let's suppose that the plant's benefit from producing moves around in
        ways we can't predict, and that we have to set our tax or our quota
        before we find out where it lands.
      </p>
      <p>
        The two instruments handle that uncertainty differently. A quota fixes
        the quantity, so when the benefit curve moves, the plant keeps making
        the same amount while the right output shifts. A tax fixes the price, so
        the plant's output moves with the benefit curve, but it can move too far
        or not far enough. Either way we lose some surplus, and the question is
        which instrument loses less on average.
      </p>
      <p>
        Martin Weitzman answered this in 1974 for straight-line curves like
        ours. Let's call b the slope of the plant's benefit curve and g the
        slope of the damage curve, so g measures how quickly the harm from one
        more unit rises as output grows. If we set both instruments for an
        average year, the expected losses compare like this:
      </p>
      {@html weitzEq}
      <p>
        So the tax does better when g is smaller than b, which means damage is
        flatter than benefit, and the quota does better when damage is steeper.
        That's because a tax lets the quantity wander, which is cheap when an
        extra unit does about the same harm wherever output ends up. A quota
        holds the quantity still, and that's worth paying for when a few extra
        units could do a lot of harm.
      </p>
      <p>
        In our plant-and-river case, the damage was a flat {E} a unit, so g was
        zero and a tax of {E} would be right whatever happened to the benefit
        curve. Climate change is the usual example of the flat case, because the
        harm from one more ton of carbon dioxide barely depends on how much was
        emitted this year. A pollutant with a local danger threshold is the
        usual example of the steep case.
      </p>
      <p>
        The chart below plots both expected losses as we make the damage curve
        steeper than the benefit curve, on logarithmic scales. As you read it
        from left to right, notice where the two curves cross.
      </p>
    </section>

    <SlopeFigure />

    <section class="body-text">
      <p>
        They cross where g/b is one, so that the slopes are equal and the two
        instruments do equally well. At g/b = {FLAT}, the tax's expected loss is
        {rFlat} times the quota's, and at g/b = {STEEP} it's {rSteep} times as
        large, just as (g/b)² says.
      </p>
      <p>
        The square only holds while the tax keeps output above zero, though. At
        g/b = {CORNER}, off the right of the chart, the ratio is about {rCorner}
        rather than {CORNER * CORNER}. In the years when the benefit curve is
        low, a tax that high would push output below zero, and the plant can't
        make less than nothing. So in the end, the answer to "tax or quota?"
        comes down to comparing two slopes, which we can at least try to
        estimate.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Before you lean on these results, it's worth being clear about three
        things our small model assumes.
      </p>
      <p>
        First, the three instruments are only equivalent when we know the costs
        at the moment we set them. That's rarely true, and as we've seen, once
        the plant's benefit curve is uncertain, the choice affects how much
        surplus we lose and not just who gets the money.
      </p>
      <p>
        Second, our bargain needs two parties who can find each other and agree
        without it costing them anything. With a thousand households downstream,
        getting everyone to chip in is a problem of its own, because each
        household would rather the others paid.
      </p>
      <p>
        And finally, our damage curve is a straight line, so "steep or flat" is
        a single number. Real damage curves can bend, with thresholds and
        tipping points, and a curve that suddenly gets steep makes the case for
        the quota stronger.
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
