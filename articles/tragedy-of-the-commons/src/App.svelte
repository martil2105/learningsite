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
  import {
    A_DEFAULT as A,
    W_DEFAULT as w,
    THETA_DEFAULT as theta,
    effEffort,
    effRent,
    output,
    closedEffort,
    dissipatedRent,
    pigouvianTax,
  } from "./commons.js";

  const fEq = katexify("F(E) = A \\cdot E^\\theta, \\quad AP(E) = \\frac{A}{E^{1-\\theta}}, \\quad MP(E) = \\frac{\\theta A}{E^{1-\\theta}}", true);
  const profitEq = katexify("\\pi_i = \\frac{e_i}{E} F(E) - w \\, e_i", true);
  const focEq = katexify("\\left(1 - \\frac{1}{n}\\right) AP(E) + \\frac{1}{n} MP(E) = w", true);
  const dissipationEq = katexify("D(n) = 1 - \\frac{R(n)}{R^*} = \\left(\\frac{n - 1}{n}\\right)^2", true);
  const overshootEq = katexify("\\frac{E(n)}{E^*} = \\left(\\frac{2n - 1}{n}\\right)^2 \\longrightarrow 4", true);
  const halfRentEq = katexify("n = 2 + \\sqrt{2} \\approx 3.41", true);
  const taxEq = katexify("t^* = AP(E^*) - MP(E^*)", true);
  const feeNEq = katexify("t_n = \\left(1 - \\frac{1}{n}\\right) t^*", true);

  // Every number in the prose comes from the model.
  const fmt = (v, d = 0) => v.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const pct = (v, d = 0) => (100 * v).toFixed(d);
  const Es = effEffort(); // 2500
  const Rs = effRent(); // 2500
  const catchValue = output(Es); // 5000 fish at £1 each
  const E2 = closedEffort(2);
  const hoursUp = E2 / Es; // 2.25
  const catchUp = output(E2) / catchValue - 1; // 0.5
  const D = (n) => dissipatedRent(n);
  const limitHours = 4 * Es; // the limit of ((2n - 1)/n)^2 is 4
  const tStar = pigouvianTax(); // 1
  const t2 = (1 - 1 / 2) * tStar;
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we fish a lake that nobody owns. Anyone can row out and fish
        it, and the only cost of an hour on the water is what we could have
        earned doing something else. A resource that anyone can use without
        paying is called <span class="bold">open access</span>, and lots of
        things work this way: a common pasture, an ocean fishery, an underground
        aquifer or a busy road.
      </p>
      <p>
        In 1954, the economist H. Scott Gordon showed what open access does to
        a fishery. If nobody owns the lake, boats keep coming until an hour of
        fishing is worth no more than an hour of work elsewhere. The value of
        the catch over and above what the fishers' time is worth is called the
        lake's <span class="bold">rent</span>, and open access competes all of
        it away. Garrett Hardin later called this
        kind of problem the <span class="bold">tragedy of the commons</span>.
      </p>
      <p>
        The story is usually told about crowds, and a crowd does use up the
        whole rent. What's less often said is how fast the rent goes. As we'll
        see, most of it is gone once a few boats share our lake, and the second
        boat does more damage than any boat after it.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Our lake with one owner</h3>
      <p>
        Let's build our lake. If the boats on it fish for E hours in total, the
        catch is F(E) fish, and each extra hour adds a little less than the one
        before. We'll use
      </p>
      {@html fEq}
      <p>
        Here <span class="bold">average product</span>, AP, is the catch per
        hour, and <span class="bold">marginal product</span>, MP, is what one
        more hour adds to the total catch. The number θ sets how quickly extra
        hours stop paying. Our lake has θ = {theta}, which makes the catch grow
        like a square root, and A = {A}. Each fish sells for £1, and an hour of
        a fisher's time costs w = £{w}, which is what they could earn
        elsewhere.
      </p>
      <p>
        Let's suppose first that our lake has one owner. The owner wants the biggest
        rent, R(E) = F(E) − wE, so they keep adding hours as long as the next
        hour catches more than it costs. That means they stop where the
        marginal product falls to the wage, which for our lake is at
        E* = {fmt(Es)} hours. The catch is worth £{fmt(catchValue)}, the time
        costs £{fmt(w * Es)}, and the lake earns a rent of £{fmt(Rs)}.
      </p>
    </section>

    <TheLake />

    <section class="body-text">
      <h3 class="body-header">What a second boat does</h3>
      <p>
        Now let's open the lake to a second boat. The two boats share the catch
        in proportion to the hours they fish, so each boat gets the average
        catch per hour for every hour it puts in.
      </p>
      <p>
        That changes the sum each fisher does. When a boat adds an hour, it
        catches more fish for itself, but some of those fish would otherwise
        have ended up in the other boat's nets. Each boat counts the fish it
        gets and ignores the fish the other boat loses. That's a
        <span class="bold">congestion externality</span>, a cost that one user
        imposes on another without paying for it.
      </p>
    </section>

    <TheSecondBoat />

    <section class="body-text">
      <p>
        With two boats, our lake is fished for {hoursUp} times as many hours as
        before, but the catch grows by only {pct(catchUp)}%. The extra time
        costs more than the extra fish are worth, so {pct(D(2))}% of the rent
        is gone, and it only took one more boat.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Average product or marginal product?</h3>
      <p>
        Let's see where that comes from. With n boats, boat i fishes
        e<sub>i</sub> hours out of the total E and takes home its share of the
        catch, so its profit is
      </p>
      {@html profitEq}
      <p>
        If every boat picks its hours to make its own profit as big as it can,
        and all n boats are alike, each one ends up fishing until
      </p>
      {@html focEq}
      <p>
        In words, each boat puts a weight of only 1/n on the marginal product
        and the rest, (n − 1)/n, on the average product. A sole owner, with
        n = 1, looks only at the marginal product, which is the right thing to
        look at. As more boats arrive, the average product takes over. If you
        drag the slider below, you'll see the weights shift.
      </p>
    </section>

    <WedgeFigure />

    <section class="body-text">
      <p>
        As n grows, each boat's share of the crowding it causes shrinks towards
        nothing. In the limit, boats keep coming until the average product falls
        to the wage, AP = w. At that point the catch is worth exactly what the
        time costs, and the rent is zero. That's Gordon's result: a lake open to
        everyone uses up all of its rent.
      </p>
      <p>
        So how quickly do we get there? If you drag the number of boats in the
        lab below, you'll see how much of our rent survives. You can also
        change θ, which sets how quickly extra hours stop paying.
      </p>
    </section>

    <LakeLab />

    <section class="body-text">
      <h3 class="body-header">How fast the rent goes</h3>
      <p>
        For our square-root lake, the equilibrium gives us two short formulas.
        The share of the rent that's lost with n boats is
      </p>
      {@html dissipationEq}
      <p>
        and the hours fished, compared with the efficient {fmt(Es)}, are
      </p>
      {@html overshootEq}
      <p>
        With two boats, {pct(D(2))}% of the rent is lost, and with four it's
        {pct(D(4), 2)}%. If we solve for the number of boats at which exactly
        half is gone, we get
      </p>
      {@html halfRentEq}
      <p>
        so half of our lake's rent is gone somewhere between the third boat and
        the fourth. The table below follows the rent as more boats arrive.
      </p>
    </section>

    <DissipationFigure />

    <section class="body-text">
      <p>
        By the time 20 boats share our lake, {pct(D(20), 2)}% of its rent is
        gone. In the limit, the hours fished approach four times the efficient
        level, {fmt(limitHours)} hours, and the rent approaches zero. The whole
        value of the lake then goes on time that could have earned just as much
        somewhere else.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The second boat does the most damage</h3>
      <p>
        So which boat does our lake the most harm? It's tempting to blame the
        last boats to arrive, but let's look at how much rent each new boat
        takes away.
      </p>
    </section>

    <MarginalUserFigure />

    <section class="body-text">
      <p>
        As you can see, the second boat takes {pct(D(2) - D(1))} points of the
        rent on its own,
        more than any boat after it. In fact, it does more damage than the sixth
        to the thirteenth boats put together, which take
        {pct(D(13) - D(5), 1)} points between them. Every new boat still takes
        some rent, but there's less left to take each time.
      </p>
      <p>
        So in our model, the tragedy of the commons doesn't need a crowd. Most
        of it happens when a lake goes from one user to a few.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Charging for access</h3>
      <p>
        How can we stop this? If the lake could be owned, its owner would fish
        it at E*. When it can't be, a government or the fishers themselves can
        charge a fee for each hour fished, called a
        <span class="bold">Pigouvian fee</span>. Let's start with a lake open to
        so many boats that each one fishes until the average product equals its
        cost. There, the right fee is the gap between the two products at E*:
      </p>
      {@html taxEq}
      <p>
        For our lake that's £{fmt(tStar, 2)} an hour. It raises each boat's
        cost to w + t* = £{fmt(w + tStar, 2)}, which is the average product at
        {fmt(Es)} hours, so boats stop coming at the efficient level. The lake
        keeps its whole rent of £{fmt(Rs)}, and it's now collected as fees.
      </p>
      <p>
        With only a few boats, that fee is too big. Each boat already counts
        part of the crowding it causes, so the full fee would push the hours
        below E*. The fee that brings n boats back to E* is smaller:
      </p>
      {@html feeNEq}
      <p>
        With two boats, that's £{fmt(t2, 2)} an hour. You can see the fee for
        any number of boats in the lab above.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Our lake is deliberately simple, and three of its simplifications
        matter.
      </p>
      <p>
        First, we've assumed that nobody manages the lake. Hardin treated
        commons as free-for-alls, but Elinor Ostrom documented many real
        communities that look after shared resources well, with their own rules,
        monitoring and fishing seasons, and without a state fee or a private
        owner.
      </p>
      <p>
        Second, our catch depends only on the hours fished. In a real fishery,
        fishing too hard shrinks the breeding stock, so the damage carries into
        later years and can end in a sudden collapse of the fish population
        rather than a smooth loss of rent.
      </p>
      <p>
        And finally, a fee only works if whoever sets it knows the lake: the
        shape of the catch, the wage and, when there are only a few boats, how
        many there are.
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
