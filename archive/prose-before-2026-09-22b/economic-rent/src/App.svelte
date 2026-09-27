<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import RectangleTest from "./Components/RectangleTest.svelte";
  import PointLine from "./Components/PointLine.svelte";
  import TrapFigure from "./Components/TrapFigure.svelte";
  import RentLab from "./Components/RentLab.svelte";
  import SpreadFigure from "./Components/SpreadFigure.svelte";
  import katexify from "./katexify.js";

  const costEq = katexify(`c = w\\,N + p\\,R = p\\,(r\\,N + R)`, true);
  const costInline = katexify(`w\\,N + p\\,R`);
  const relEq = katexify(`r = \\frac{w}{p}`, false);
  const rentEq = katexify(`\\text{rent}(t, r) = (r\\,N_t + R_t) - \\min_{t'}(r\\,N_{t'} + R_{t'})`, true);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Let's suppose you run one batch job a month, and it has to be delivered.
      There's more than one way to do it. You can throw hardware at the job and
      keep the engineers away from it, or you can have people hand-tune it and
      rent almost no machines at all, and there are sensible-looking options in
      between. We'll call each way a <span class="bold">recipe</span>, which
      means a fixed number of engineer-days of someone's time and a fixed
      number of machine-days of rented compute for every run. Running the job
      twice takes twice as much of both, and that's what lets us draw the whole
      choice on one chart.
    </p>
    <p>
      Most first courses in economics have a lesson about choosing between
      inputs like these, and it comes with a test you can run yourself, called
      the <span class="bold">rectangle test</span>. If another recipe needs no
      more of either input and less of at least one, our recipe can never be
      the cheapest way to do the job, so the test removes it. On a chart, that
      rival sits inside the rectangle below and to the left of our recipe. It's
      worth running the test on our recipes before we start poking at it,
      because it's useful, and as we'll see, it's also the reason a perfectly
      good technology can sit there chosen by nobody. Pick a recipe below to
      test it.
    </p>
  </section>

  <RectangleTest />

  <section class="body-text">
    <h3 class="body-header">What a choice depends on</h3>
    <p>
      Say an engineer-day costs <span class="mono">w</span> and a machine-day
      costs <span class="mono">p</span>. A recipe that needs
      <span class="mono">N</span> of the first and <span class="mono">R</span>
      of the second then costs <span class="mono">{@html costInline}</span> a
      run, and as we'll see, that whole cost depends on just one number:
    </p>
    <p class="eq">{@html costEq}</p>
    <p>
      Everything scales by <span class="mono">p</span>, so which recipe is
      cheapest depends on <span class="mono">r</span>, the relative price of
      the two inputs, and on nothing else. If we double the wages and double the
      machine prices, every cost doubles with them, so the ranking can't move.
      That's worth knowing before anyone argues about prices, because only the
      ratio between them can change anybody's mind.
    </p>
    <p>
      This gives us a second way to draw the recipes. If we fix a recipe and let
      <span class="mono">r</span> move, its cost is a straight line with slope
      <span class="mono">N</span> and intercept <span class="mono">R</span>.
      So each recipe is a <em>point</em> when we plot its inputs, and a
      <em>line</em> when we plot its cost against <span class="mono">r</span>.
      At any <span class="mono">r</span>, the cheapest cost available is the
      lowest of those lines, and the path it traces as
      <span class="mono">r</span> changes is called the
      <span class="bold">lower envelope</span>. A recipe is chosen at some
      price exactly when its line touches the envelope. Drag the relative price
      below and watch which recipe is in charge.
    </p>
  </section>

  <PointLine />

  <section class="body-text">
    <p>
      The envelope has three kinks, and they sit at relative prices of exactly
      1, 3 and 8. When engineers are cheap, Brute force is the cheapest recipe,
      and as they get dearer, the industry moves to Batched, then Indexed, then
      Hand-tuned. Between the kinks, the envelope's slope is always the
      engineer-days of the recipe in charge, which means we can read the
      industry's demand for engineers straight off a cost curve.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The one that never gets picked</h3>
    <p>
      Now for the trap. There's a seventh recipe that we kept off the first
      chart. It's called Balanced, it needs 5 engineer-days and 20 machine-days
      a run, and it sits politely in the middle of every trade-off on the list.
      If we run the rectangle test on it, nothing beats it, and whichever of
      the other six we compare it with, Balanced uses less of at least one
      input.
    </p>
    <p>
      And yet there's <em>no</em> relative price at which it's the cheapest way
      to run the job. And it isn't that Balanced only loses at silly prices: it loses
      everywhere between engineers being nearly free and machines being nearly
      free. This is what the rectangle test can't see, because passing it only
      means that nothing beats you, not that anybody wants you.
    </p>
  </section>

  <TrapFigure />

  <section class="body-text">
    <p>
      There's a clean reason why Balanced never wins. Between Batched and
      Indexed, the industry's cost is a V with its point at r = 3, and a recipe
      can only join the envelope by touching it from below. Balanced's line
      passes above the chord joining its two neighbours, so it never does. If
      you give Balanced fewer machine-days with the slider, a window opens.
      From 14 machine-days up, the window is exactly 18 minus Balanced's own
      machine-days wide, and it closes at 18, which is the chord's height at
      five engineer-days. So it doesn't matter that Balanced looks like a
      sensible compromise, because the price makes the choice, and at 20
      machine-days there's no price at which Balanced comes out cheapest.
    </p>
  </section>
  <section class="body-text">
    <h3 class="body-header">What the pioneer earns</h3>
    <p>
      Suppose the industry has settled at r = 2, the standard regime. The job
      runs on Indexed for 26 machine-day-equivalents, and Legacy, the way things
      were done before, would cost 48. (A
      <span class="bold">machine-day-equivalent</span> is a cost measured in
      units of what one machine-day costs, which keeps the money out of the
      picture until the last step.) Whoever holds Indexed can sell the run for
      anything up to 48 and still beat the alternative, so there's a gap of 22
      sitting under the price. That gap is
      <span class="bold">economic rent</span>: what something earns because
      it's temporarily better than the next best way, rather than because of
      what it costs.
    </p>
    <p class="eq">{@html rentEq}</p>
    <p>
      Drag the relative price below and pick different technologies to hold.
      The rent is zero exactly when the technology you're holding <em>is</em>
      the cheapest one, sitting on the envelope itself, which is another way of
      saying that the envelope is where the rent has already been competed
      away.
    </p>
  </section>

  <RentLab />

  <section class="body-text">
    <h3 class="body-header">Why competition both kills the rent and spreads the idea</h3>
    <p>
      A rent like this attracts rivals. A rival who adopts Indexed can copy the
      pioneer's product, offer the same run a little cheaper, and keep the
      difference for as long as the undercut stays under the gap. You can run
      the raid yourself below: drag the undercut and watch the pioneer's rent
      fall one for one. It reaches exactly zero when the undercut reaches 22,
      and at that point the job costs what it costs and nobody earns anything
      for being special.
    </p>
    <p>
      The same arithmetic is what spreads the innovation. The gain from
      switching from Legacy to Indexed is 22 machine-days at r = 2, and it
      grows by exactly 2 for every unit the relative price rises, because the
      switch saves 2 engineer-days. So the dearer engineers get, the more the
      switch to the labour-lean technology is worth. In other words, the
      innovation whose arrival competed one rent away is then carried round the
      industry by the new rents that open up as prices move. Being temporarily
      different is profitable, and the competition that ends the profit is also
      what copies the difference.
    </p>
  </section>

  <SpreadFigure />

  <section class="body-text">
    <h3 class="body-header">What this diagram costs you</h3>
    <p>
      First, this is a <span class="bold">partial-equilibrium</span> story,
      which means we look at one market on its own and hold everything outside
      it fixed. There's one job, one month and two inputs, with no capacity
      constraints and no sunk costs. The rent here comes from a technology gap,
      while real rents also come from patents, licences, brands and network
      effects, and those last longer than one round of undercutting.
    </p>
    <p>
      Second, we've measured the rent in machine-day-equivalents, which is
      honest but a little abstract. Turning it into money needs a price for a
      run, and in this model that price is doing the rent's own work.
    </p>
    <p>
      And finally, competition here is a price war between recipes. The process
      that actually diffuses an innovation through an industry, with imitation
      after a lag, licensing and staff moving between firms, sits behind the
      envelope's movement rather than on top of it.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Where this leaves the rectangle test</h3>
    <p>
      The rectangle test tells us which recipes nothing beats, while the
      envelope tells us which ones anybody would actually choose. Rent lives in
      the gap between the two, and competition closes that gap from below while
      it copies the very idea that opened it.
    </p>
    <p>Thanks for reading!</p>
  </section>

  <section class="body-text" id="resources">
    <h3 class="body-header">Sources and further reading</h3>
    <p>
      CORE Econ's <em>The Economy 2.0: Microeconomics</em> (2023), Unit 2,
      section 2.2, covers opportunity costs, economic rents and incentives. The
      definitions of rent and of opportunity cost, and the role of prices in
      choosing among technologies, come from there. The seven recipes, the
      point and line pictures as drawn here, the Balanced trap and its window,
      and every number on the page are ours, all computed from
      <span class="mono">src/technology.js</span> and asserted in
      <span class="mono">verify/check-numbers.mjs</span>.
    </p>
  </section>
</main>

<style>
  main {
    display: block;
  }
</style>