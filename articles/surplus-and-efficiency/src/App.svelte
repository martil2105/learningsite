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
    <section class="body-text">
      <p>
        Let's start with a competitive market, where supply meets demand. The
        quantity traded there makes the <span class="bold">total surplus</span>
        as large as it can be. Total surplus adds up, over every unit traded,
        what the buyer valued it at minus what it cost the seller to make. A
        market that maximises it is <span class="bold">Pareto efficient</span>,
        which means we can't make anybody better off without making someone
        else worse off.
      </p>
      <p>
        Now let's say a government restricts output, with a production quota, a
        tariff or a price ceiling. First courses usually show the harm as a shaded
        wedge called the <span class="bold">deadweight loss triangle</span>, or
        Harberger triangle, which is the surplus from the trades that no longer
        happen. The triangle shrinks with the square of the quantity cut, so a
        small restriction costs very little: if we cut supply by 10%, for
        example, we lose only 1% of the total surplus. That's why the cost of small
        interventions has often been treated as minor.
      </p>
      <p>
        However, the triangle is only half the accounting. When a price ceiling
        holds quantity down and stops the market from clearing, the units that
        still trade have to be rationed somehow. If they go out by lottery, by
        queueing or through personal connections, rather than to whoever values
        them most, there's a second loss, the
        <span class="bold">misallocation loss</span>. As we'll see, it's
        <em>first order</em>, which means it shrinks only in proportion to the
        cut, while the triangle is <em>second order</em> and shrinks with the
        cut's square. If you drag the slider in the chart below to change the
        size of the cut, you can watch both losses at once.
      </p>
    </section>

    <SpineFigure />

    <section class="body-text">
      <h3 class="body-header">Two losses, one identity</h3>
      <p>
        The chart above puts the two losses side by side. In the first panel we
        see <em>the wrong quantity</em>: {q0} units would have traded in a
        competitive market, but only 44 are supplied, so some trades that would
        have benefited both sides never happen. In the second panel we see
        <em>the wrong people</em>: 84 buyers are willing to pay the ceiling price for
        those 44 units, and random rationing hands them out without regard to
        how much each buyer values them.
      </p>
      <p>
        Something surprising happens when we add the two losses together. Let's
        write <em>d</em> for the fraction by which quantity is cut, and TS* for
        the total surplus in the competitive market. Then
      </p>

      {@html identityCEq}

      <p>
        In words, the triangle costs {@html katexify("d^2")} of the total
        surplus and the misallocation costs {@html katexify("d(1 - d)")}, so in
        any linear market with random rationing, the two together come to
        exactly {@html katexify("d")}, the cut itself. Cutting output by 27%
        loses <em>exactly</em> 27% of the total surplus the market could have
        produced, and you can check the identity at any other cut with the
        slider above.
      </p>
    </section>

    <TheTriangle />

    <section class="body-text">
      <h3 class="body-header">Why the triangle is small</h3>
      <p>
        To see why the triangle behaves so differently from rationing, let's
        look at the gap between what the buyer of each unit values it at and
        what it costs the seller to make. With demand
        {@html katexify("q = A - Bp")} and supply {@html katexify("q = C + Sp")},
        where A = 120, B = 3, C = 20 and S = 2 in our market, that gap is
      </p>

      {@html gapEq}

      <p>
        and adding it up over every unit traded, from zero to
        {@html katexify("q")}, gives the total surplus:
      </p>

      {@html tsEq}

      <p>
        Because {@html katexify("P_d(q^*) = P_s(q^*)")} at the competitive
        quantity, the gain from each extra trade shrinks to zero as quantity
        approaches 60. So the trades that disappear first when quantity is
        restricted are exactly the ones where the buyer barely valued the good
        above its cost. That's why the surplus peaks at exactly
        {@html katexify("q^* = 60")}, and why a 1% cut costs only
        {@html katexify("0.01\\%")} of the total surplus.
      </p>
    </section>

    <TheQueue />

    <section class="body-text">
      <h3 class="body-header">Who gets the goods?</h3>
      <p>
        We can read a straight demand curve as a queue of buyers whose
        valuations are spread evenly. The demand curve
        {@html katexify("q = 120 - 3p")} describes 120 potential buyers, and the
        most each of them would pay is spread evenly from £0 to £40.
      </p>
      <p>
        Let's put a price ceiling at £12. Sellers then produce only 44 units.
        At £12, though, every buyer who values the good above £12 wants one, which
        means 84 willing buyers queue for 44 units.
      </p>
      <p>
        If we let the price do the allocating, those 44 units would go to the 44
        buyers who value them most, whose valuations run from £25.33 to £40 and
        average £32.67. Under random rationing, the units are spread evenly
        across all 84 buyers in the queue, whose valuations average £26.00.
        That drop of £6.67 in average value per unit loses £293.33 of surplus,
        which is nearly three times the £106.67 lost from the missing trades.
      </p>
    </section>

    <RationLab />

    <section class="body-text">
      <h3 class="body-header">When rationing isn't random</h3>
      <p>
        In practice, rationing without prices is rarely a pure lottery, and our
        model can allow for that. Queues
        favour people whose time is cheap, and waiting lists may favour
        established customers. In the lab above, the
        <span class="bold">sorting efficiency</span>
        {@html katexify("\\theta")} measures how well the rationing matches
        units to the buyers who value them most.
      </p>
      <p>
        When {@html katexify("\\theta = 0")}, rationing is completely random.
        When {@html katexify("\\theta = 1")}, the units end up with the buyers
        who value them most, as they would under a production quota or if
        buyers could resell for free. If you set sorting efficiency to 50%, at
        {@html katexify("\\theta = 0.50")}, you'll see that the misallocation
        loss is still bigger than the triangle.
      </p>
    </section>

    <RatioFigure />

    <section class="body-text">
      <h3 class="body-header">How the two losses compare</h3>
      <p>
        If we divide one loss by the other, we get a second simple identity:
      </p>

      {@html katexify(`\\frac{\\text{Misallocation}}{\\text{Triangle}} = \\frac{q}{q^* - q} = \\frac{1 - d}{d}`, true)}

      <p>
        So the ratio of the misallocation loss to the triangle depends on just
        one thing: the number of units that still trade divided by the number
        that no longer do.
      </p>
      <p>
        In the chart, you can see the two curves cross at exactly
        {@html katexify("d = 0.50")}, where the misallocation loss reaches its
        largest possible value, 25% of the total surplus. For any restriction
        that cuts output by less than half, misallocating the units that still
        trade does more harm than losing the trades that don't happen.
      </p>
    </section>

    <InstrumentFigure />

    <section class="body-text">
      <h3 class="body-header">A quota or a price ceiling?</h3>
      <p>
        This comparison brings us to the main point of the article: at least in
        our model, what an output cut costs depends much more on how it's enforced
        than on how big it is.
      </p>
      <p>
        Let's compare the two directly. A production quota of 54 units, which is
        a 10% cut, lets the price rise
        to £22, so the goods still go to the buyers who value them most, and it
        costs 1% of the total surplus. A price ceiling of £17 produces exactly
        the same 54 units, but it holds the price below the level that would
        clear the market, and the rationing that follows loses 10% of the total
        surplus. So at the same quantity, the price ceiling does
        {@html katexify("1/d = 10\\times")} as much damage as the quota.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Like any model, this one leaves things out, and three of them matter
        here.
      </p>
      <p>
        First, we assumed straight demand and supply lines and no income
        effects, which is what lets consumer surplus serve as an exact measure
        of welfare in money. With curved demand the losses change, and the
        figure above shows that in one such case, a constant-elasticity demand
        curve, rationing costs even more.
      </p>
      <p>
        Second, we assumed that buyers can't resell. If they could resell at no
        cost, resale would move the units to the buyers who value them most and
        remove the misallocation loss entirely. On the other hand, queueing
        often uses up the surplus in a different way, as time spent waiting.
      </p>
      <p>
        And finally, we've only looked at the size of the surplus, not at how
        it's divided between buyers and sellers. That's the subject of the
        article on <a href="../bargaining-and-the-surplus/">bargaining and the
        surplus</a>.
      </p>
      <p>
        It's also worth knowing that the triangle formula,
        {@html katexify("\\frac{1}{2} k (q^* - q)^2")}, is the same as the
        deadweight loss of a tax,
        {@html katexify("\\frac{1}{2} t^2 \\frac{BS}{B + S}")}, from the article
        on <a href="../tax-incidence/">tax incidence</a>, because a tax of
        {@html katexify("t")} cuts quantity by
        {@html katexify("q^* - q = t \\frac{BS}{B + S}")}.
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

  .content-container {
    max-width: 740px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
