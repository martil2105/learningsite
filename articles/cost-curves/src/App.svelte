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
  import { qMin, qTangency, qCheapest, tangencyRatio, plantPenalty } from "./cost.js";

  const costEq = katexify("C(q, k) = f + r k + \\frac{w q^3}{k}", true);
  const kStarEq = katexify("k^*(q) = \\sqrt{w / r} \\cdot q^{3/2}", true);
  const ratioEq = katexify("\\frac{q_t}{q_m} = \\left(\\frac{2k}{f + k}\\right)^{1/3}", true);
  const envelopeEq = katexify("\\text{SRMC}(q_t, k) = \\text{LRMC}(q_t)", true);

  const small = { k: 25, qt: qTangency(25), qm: qCheapest(25), gap: 1 - tangencyRatio(25) };
  const big = { k: 400, gap: tangencyRatio(400) - 1 };
  const pen5 = plantPenalty(0.05);
  const pen50 = plantPenalty(0.5);
  const pct = (v, d = 0) => (100 * v).toFixed(d);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we run a factory. In the short run, the size of our plant is
        fixed: we've already built it, and all we can change this month is how
        much we make with it. Over a longer horizon, though, we get to choose
        the plant as well. A bigger plant makes large outputs cheaper, but it
        costs more to keep open.
      </p>
      <p>
        First courses in economics draw this with a familiar picture. Each plant
        size gets its own U-shaped <span class="bold">short-run average cost
        curve</span>, which is the cost per unit of making each output with that
        plant. Underneath them runs the <span class="bold">long-run average cost
        curve</span>, the lowest cost per unit we can reach at each output once
        the plant size is ours to choose. It's an easy picture to half-remember,
        and the version many of us carry around has each U resting on the
        long-run curve at its own lowest point.
      </p>
      <p>
        That version can't be drawn. In 1931, Jacob Viner asked his draughtsman,
        Y. K. Wong, for exactly that picture: a long-run curve that passed
        through the bottom of every U without ever rising above any of them.
        Wong told him it couldn't be done. Viner kept his drawing and explained
        the problem in a footnote, and as we'll see, the gap between the two
        pictures tells us something useful about how firms choose a plant.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What a plant costs to run</h3>
      <p>
        Let's build our costs from three pieces. Every plant pays a fixed
        licence fee, f = 100, and rents k machines at a price of r = 1 each,
        whether it makes anything or not. On top of that, making q units needs
        labour and materials. The machines get crowded as output rises, so this
        variable cost grows quickly, as w·q³/k with w = 1. A bigger plant spreads
        the crowding over more machines, which makes big outputs cheaper, but we
        pay for those machines every month. Put together, our total cost is
      </p>
      {@html costEq}
      <p>
        If you drag the output in the chart below, you'll see the two parts
        trade places. At small outputs the fixed part is most of the bill, and at
        large outputs the variable part takes over.
      </p>
    </section>

    <CostSplit />

    <section class="body-text">
      <h3 class="body-header">Why the average is shaped like a U</h3>
      <p>
        If we divide total cost by output, we get
        <span class="bold">average cost</span>, AC = C/q, the cost per unit. The
        cost of making one more unit is <span class="bold">marginal cost</span>,
        MC = dC/dq. When the next unit costs less than our average so far, making
        it pulls the average down, and when it costs more, it pulls the average
        up. That's why the two curves cross right where average cost is lowest.
      </p>
      <p>
        We can say the same thing another way. The ratio MC/AC is the
        <span class="bold">output elasticity of cost</span>, the percentage
        change in total cost for a 1% rise in output. Average cost falls while
        that elasticity is below one, rises once it's above one, and bottoms out
        where it's exactly one.
      </p>
      <p>
        The U needs two ingredients, not one. Use the toggle below to swap our
        rising marginal cost for a constant one. With only a fixed cost to spread
        over more units, average cost falls forever and never turns up, so
        there's no bottom to find.
      </p>
    </section>

    <AverageAndMarginal />

    <section class="body-text">
      <h3 class="body-header">Letting the plant change</h3>
      <p>
        In the long run, we can choose k as well as q. For any output we plan to
        make, one plant size makes it most cheaply, and with our costs it works
        out to be
      </p>
      {@html kStarEq}
      <p>
        If we price every output with its best plant, we trace out the long-run
        average cost curve. Because it uses the cheapest plant at each output,
        it's the <span class="bold">lower envelope</span> of all the short-run
        curves, which means it sits underneath every one of them and touches
        each one somewhere.
      </p>
      <p>
        Click through the plant sizes below to add their short-run curves one at
        a time. Before you read on, have a look at where each U touches the dark
        curve. Is it at the bottom of the U?
      </p>
    </section>

    <Envelope />

    <section class="body-text">
      <h3 class="body-header">Where each plant touches the envelope</h3>
      <p>
        It isn't, apart from one plant. Let's follow the plants one at a time in
        the lab below. As you drag the plant size or pick a preset, keep an eye
        on the two dots on the blue curve. The pink one marks where that
        plant's curve touches the envelope, and the blue one marks the
        plant's own cheapest output.
      </p>
    </section>

    <PlantLab />

    <section class="body-text">
      <p>
        With our costs, a plant of size k touches the envelope at output
        q<sub>t</sub> = k<sup>2/3</sup>, while its own average cost is lowest at
        q<sub>m</sub> = (k(f + k)/2)<sup>1/3</sup>. If we divide one by the other,
        we get a short formula for how far apart the two dots are:
      </p>
      {@html ratioEq}
      <p>
        The ratio is one only when k = f, which with our numbers is the plant of
        size 100. That plant serves the bottom of the envelope, at
        q = {qMin.toFixed(2)}, and it's the one plant in the picture that really
        is run at its own lowest cost.
      </p>
      <p>
        Every smaller plant touches the envelope on the falling side of its U.
        For example, the plant with k = {small.k} is run at q = {small.qt.toFixed(2)},
        which is {pct(small.gap)}% below its cheapest output of
        {small.qm.toFixed(2)}. Every bigger plant touches on the rising side, so
        the plant with k = {big.k} is run {pct(big.gap)}% above its own cheapest
        output.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The right plant, run off its lowest point</h3>
      <p>
        Does this mean firms are building the wrong plants? Not at all. Each
        plant is still the cheapest way to make its output. It's just that the
        cheapest way to make a small output is a small plant run a little below
        its own sweet spot.
      </p>
      <p>
        So why not build an even smaller plant and run it at its lowest point?
        Because a smaller plant would have to crowd its machines harder to reach
        the same output, and the extra variable cost would outweigh what we'd
        save on machines. What settles the choice is marginal cost, not average
        cost. The <span class="bold">envelope theorem</span> tells us that at the
        output a plant was built for, one more unit costs the same in the short
        run as in the long run:
      </p>
      {@html envelopeEq}
      <p>
        Here SRMC and LRMC are the short-run and long-run marginal costs. If you
        switch between the two target outputs below, you'll see the same thing
        both times. The plant's
        short-run marginal cost crosses the long-run one at the target output,
        even though the plant's own lowest average cost is somewhere else.
      </p>
    </section>

    <MarginalCross />

    <section class="body-text">
      <h3 class="body-header">Why the slip is easy to miss</h3>
      <p>
        If the half-remembered drawing is wrong everywhere but one point, why is
        it so easy to believe? Because the envelope is flat near the best plant,
        so getting the plant size slightly wrong costs us very little. The
        penalty is <span class="bold">second order</span>, which means it grows
        with the square of the mistake: if we halve the error in the plant size,
        the extra cost falls to about a quarter.
      </p>
      <p>
        The table below shows what that means for a firm making 50 units. A plant
        that's 5% too big or too small raises total cost by about
        {pct(pen5, 1)}%, and even a plant that's off by half costs only
        {pct(pen50, 1)}% more. The same flatness that hid Viner's slip on paper
        is what makes real decisions about capacity so forgiving.
      </p>
    </section>

    <PenaltyFigure />

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Our cost model is deliberately simple, and three of its simplifications
        matter here.
      </p>
      <p>
        First, capital is completely fixed in the short run and completely free
        to change in the long run. Real plants come in lumps, take years to
        build and cost money to change.
      </p>
      <p>
        Second, our variable cost grows as q³. That gives us clean formulas, but
        the exact offsets we've computed belong to that shape, and real cost
        curves often have a long flat bottom before the machines get crowded.
      </p>
      <p>
        And finally, there's no demand here at all. Which output a firm actually
        makes depends on the price it can sell at, and that's where the article
        on <a href="../perfect-competition/">perfect competition</a> picks up.
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
