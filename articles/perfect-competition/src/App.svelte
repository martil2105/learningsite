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
  import { F, c, d, acMin, qEfficient, createMarket } from "./entry.js";

  const market = createMarket(600, 10);
  const n = market.nStar;
  const pIn = market.price(n);
  const piIn = market.profit(n);
  const pOut = market.price(n + 1);
  const piOut = market.profit(n + 1);
  const planner = [...Array(11)].map((_, i) => n - 5 + i).reduce((b, k) => (market.welfare(k) > market.welfare(b) ? k : b), n);
  const lossPct = (100 * (market.welfare(planner) - market.welfare(n))) / market.welfare(planner);

  const costEq = katexify("C(q) = 50 + 10q + q^2", true);
  const acEq = katexify("AC(q) = \\frac{50}{q} + 10 + q", true);
  const priceEq = katexify("p(n) = \\frac{A d + n c}{B d + n}", true);
  const gapEq = katexify("p(n^*) - AC_{\\min} = \\frac{s \\cdot \\operatorname{frac}(\\bar{n})}{B d + n^*}", true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's picture a market with lots of small firms that all sell the same
        thing, like farms growing the same wheat. None of them is big enough to
        move the price, so each one takes the market price as given. This is
        <span class="bold">perfect competition</span>, and first courses tell a
        clean story about how it settles down in the long run.
      </p>
      <p>
        While the firms in the market make a profit, firms outside it have a
        reason to come in. Each newcomer adds supply, which pushes the price
        down, and entry carries on until the profit is gone. By then the price
        has fallen to the lowest average cost a firm can reach, so the long-run
        supply curve is flat at that level.
      </p>
      <p>
        That story treats the number of firms as if it could be any number,
        like {market.nBar.toFixed(1)}. But firms come in whole numbers, and as we'll see, that small
        detail changes three things. Entry stops a little early, the firms that
        are in keep a small profit, and the long-run supply curve isn't flat at
        all. It's a sawtooth.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">One firm, taking the price</h3>
      <p>
        Let's start with a single firm. Making q units costs it a fixed amount
        of {F}, plus a variable cost that rises faster as it makes more:
      </p>
      {@html costEq}
      <p>
        Dividing by q gives its average cost, the cost per unit:
      </p>
      {@html acEq}
      <p>
        Its marginal cost is MC = {c} + {d}q, and average cost is lowest at
        an output of {qEfficient.toFixed(2)}, where each unit costs
        {acMin.toFixed(2)}. We'll call that output the firm's
        <span class="bold">efficient scale</span>.
      </p>
      <p>
        A price-taking firm makes the output at which the price equals its
        marginal cost. If you drag the price in the chart below, you'll see that
        our firm makes a profit whenever the price is above {acMin.toFixed(2)}
        and a loss whenever it's below. To firms outside the market, that
        profit is a signal that there's money to be made here.
      </p>
    </section>

    <TheFirm />

    <section class="body-text">
      <h3 class="body-header">Letting firms in one at a time</h3>
      <p>
        Now let's put our firm in a market where buyers want Q = 600 − 10p units
        at a price p. With n identical firms, each making the output where the
        price equals its marginal cost, the price that clears the market is
      </p>
      {@html priceEq}
      <p>
        Here A = 600 and B = 10 describe demand, and c = {c} and d = {d} describe
        each firm's marginal cost. As we add firms, each one pushes the price
        down a little. In the simulation below, you can click "Admit 1 firm" to let
        them in one at a time, or press "Auto-run" and watch where the process
        stops. Before you do, it's worth making a guess: will the price get all
        the way down to {acMin.toFixed(2)}?
      </p>
    </section>

    <EntryRun />

    <section class="body-text">
      <h3 class="body-header">Why the next firm stays out</h3>
      <p>
        It doesn't, and we can see why. If firms could come in fractions, our market would have room
        for n̄ = {market.nBar.toFixed(2)} of them, which is the number that would
        bring profit down to exactly zero. But nobody can open {(market.nBar - n).toFixed(2)} of a firm.
        With {n} firms in, the price is {pIn.toFixed(4)}, which is
        {(pIn - acMin).toFixed(4)} above the lowest average cost, so each firm
        still makes a profit of {piIn.toFixed(4)}.
      </p>
      <p>
        So why doesn't one more firm come in to share that profit? Let's look
        at it from the newcomer's side. A firm decides whether to enter by asking what the price will be after it
        arrives. With {n + 1} firms, the price would fall to {pOut.toFixed(4)},
        which is below the lowest average cost, and every firm, the newcomer
        included, would lose {(-piOut).toFixed(4)}. So firm number {n + 1} stays
        out, and the {n} firms that are in keep their profit for as long as
        nothing else changes. The table below lets us follow the last few steps.
      </p>
    </section>

    <TheLastFirm />

    <section class="body-text">
      <h3 class="body-header">A sawtooth, not a flat line</h3>
      <p>
        What happens as the market grows? Let's keep the slope of demand fixed
        and slowly raise its size, A. While the number of firms stays the same,
        more demand pushes the price up along the firms' marginal cost curves.
        Once there's room for one more firm to break even, it enters, supply
        jumps, and the price drops back down. So the long-run price climbs,
        drops, climbs again and drops again, like the teeth of a saw.
      </p>
      <p>
        We only see the price touch the lowest average cost at the market sizes
        where a whole number of firms fits exactly. Everywhere in between, it
        sits above it. Use the buttons below to compare small markets with much
        larger ones.
      </p>
    </section>

    <SawtoothFigure />

    <section class="body-text">
      <p>
        In large markets the teeth shrink, and we can see why. Let's write n* for
        the number of firms that actually enter and frac(n̄) for the part of n̄
        that doesn't make a whole firm. Then the gap between the price and the
        lowest average cost is
      </p>
      {@html gapEq}
      <p>
        where s = √(2Fd) = {Math.sqrt(2 * F * d).toFixed(2)} comes from the cost
        curve. The profit each firm keeps works out at ((1 + x)² − 1) times the
        fixed cost, with x = frac(n̄)/(Bd + n*). Because n* sits in the
        denominator of both, the teeth get smaller roughly in proportion to 1/n,
        and from far enough away the sawtooth looks like the flat line that
        first courses draw.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Too few firms, or too many?</h3>
      <p>
        Does free entry give us the right number of firms? To find out, let's
        imagine a planner who picks the number of firms to make
        <span class="bold">total surplus</span>, which is what buyers gain plus
        what firms earn, as large as possible, while each firm still prices at
        its marginal cost.
      </p>
      <p>
        When firms have some power over their prices, economists have shown that
        free entry can bring in too many of them, because each newcomer takes
        part of its sales from the firms already there. With price-taking
        firms, that doesn't happen. In our worked market, entry stops at {n}
        firms while the planner would pick {planner}, and stopping one short
        loses less than {lossPct < 0.01 ? "0.01" : lossPct.toFixed(2)}% of the
        total surplus. The chart below compares the two counts across market
        sizes, and you'll see the market never has more firms than the planner
        wants, and never more than one fewer.
      </p>
    </section>

    <WelfareFigure />

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Our market is simple on purpose, and three of its assumptions matter
        here.
      </p>
      <p>
        First, every firm has the same costs. In real markets, firms that got in
        early or found better sites often have lower costs, and they can keep a
        profit that has nothing to do with whole numbers.
      </p>
      <p>
        Second, entry is instant and free. Real entrants need permits,
        buildings and money, which take time and can hold entry back even when
        there's a profit to be had.
      </p>
      <p>
        And finally, every firm sells exactly the same product. Once products
        differ, firms get some power over their prices, and the story changes.
        That's the subject of the article on
        <a href="../monopolistic-competition/">monopolistic competition</a>.
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
