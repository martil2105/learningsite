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
      There is more than one way to do it. You can throw hardware at the thing
      and keep the engineers away from it, or you can have people hand-tune it
      and rent almost no machines at all, and there are sensible-looking
      options in between. Each way is a recipe: so many engineer-days of
      someone's time, so many machine-days of rented compute, in fixed
      proportions. Twice the job means twice both, which is what makes the
      whole thing drawable.
    </p>
    <p>
      Most first courses in economics have a lesson about choosing between
      inputs like these, and it comes with a test you can run yourself. It's
      worth running that test on our seven recipes before we start poking at
      it, because the test is genuinely useful and it is also, as we'll see,
      the reason a perfectly good technology can sit there chosen by nobody.
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
      run, and the whole of that cost carries one number that matters:
    </p>
    <p class="eq">{@html costEq}</p>
    <p>
      Everything scales by <span class="mono">p</span>, so which recipe is
      cheapest depends on <span class="mono">r</span>, the relative price of
      the two inputs, and on nothing else. Double the wages and double the
      machine prices and every cost doubles with them, so the ranking cannot
      move. That's a useful thing to know before you argue about prices: only
      the ratio between them can change anybody's mind.
    </p>
    <p>
      Here's the picture that follows. Fix a recipe and let
      <span class="mono">r</span> move, and its cost is a straight line with
      slope <span class="mono">N</span> and intercept
      <span class="mono">R</span>. So each recipe is a <em>point</em> in input
      space and a <em>line</em> in cost space, and the cheapest available cost
      is the lower envelope of those lines. A recipe is ever chosen exactly
      when its line touches that envelope.
    </p>
  </section>

  <PointLine />

  <section class="body-text">
    <p>
      The envelope has three kinks, and they sit at relative prices of exactly
      1, 3 and 8. People cheap means Brute force; as engineers get dearer the
      industry moves to Batched, then Indexed, then Hand-tuned, and the slope
      of the envelope between the kinks is always the first input of the
      recipe in charge — which is the industry's demand for engineers, read
      straight off a cost curve.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The one that never gets picked</h3>
    <p>
      Now for the trap. There's a seventh recipe we kept off the first chart.
      It's called Balanced, it needs 5 engineer-days and 20 machine-days a
      run, and it sits politely in the middle of every trade-off on the list.
      Run the rectangle test on it and nothing beats it. Ask any of the other
      six to fight it and Balanced wins the argument: it uses less of at
      least one input than whatever attacked it.
    </p>
    <p>
      And it is the cheapest way to run the job at no price at all. Not at a
      silly price — at <em>no</em> price, anywhere between engineers nearly
      free and machines nearly free. Every course teaches the rectangle test,
      and this is what it cannot see: surviving the test means only that
      nothing dominates you, not that anybody wants you.
    </p>
  </section>

  <TrapFigure />

  <section class="body-text">
    <p>
      There is a clean reason Balanced never wins. Between Batched and
      Indexed the industry's cost is a V with its point at r = 3, and a
      recipe can only join that envelope by touching it from below. Balanced's
      line passes above the chord joining its two neighbours, so it never
      does. Give Balanced fewer machine-days and a window opens; from 14
      machine-days up the window is exactly 18 minus its own machine-days
      wide, and it slams shut at 18, which is the chord's height at five
      engineer-days. The arithmetic doesn't care that Balanced looks
      reasonable. Reasonable isn't a price.
    </p>
  </section>
  <section class="body-text">
    <h3 class="body-header">What the pioneer earns</h3>
    <p>
      Suppose the industry has settled at r = 2, the standard regime. The job
      runs on Indexed for 26 machine-day-equivalents, and Legacy — the way
      things were done before — would cost 48. Whoever holds Indexed can sell
      the run for anything up to 48 and still beat the alternative, so there
      is a gap of 22 sitting under the price. That gap is
      <span class="bold">economic rent</span>: what a thing earns because it
      is temporarily better than the next best way, and not because of what
      it costs.
    </p>
    <p class="eq">{@html rentEq}</p>
    <p>
      Drag the relative price below and hold different technologies. The rent
      is zero exactly when the technology you're holding <em>is</em> the
      frontier — which is another way of saying that the frontier is where
      the rent has already been competed away.
    </p>
  </section>

  <RentLab />

  <section class="body-text">
    <h3 class="body-header">Why competition both kills the rent and spreads the idea</h3>
    <p>
      Rent is a target. A rival who adopts Indexed can copy the pioneer's
      product, offer the same run a little cheaper, and keep the difference
      for as long as the undercut stays under the gap. The reader can run the
      raid below: drag the undercut and watch the pioneer's rent fall one for
      one, reaching exactly zero when the undercut reaches 22 — at which
      point the job costs what it costs, and nobody earns anything for being
      special.
    </p>
    <p>
      The same arithmetic is what spreads the innovation. The gain to
      switching from Legacy to Indexed is 22 machine-days at r = 2, and it
      grows by exactly 2 for every unit the relative price rises, because the
      switch sheds 2 engineer-days. When engineers get dearer, adopting the
      labour-lean technology gets worth faster — so the arrival that destroyed
      one rent is carried round the industry by the rents it creates as
      prices move. Being temporarily different is profitable, and the
      competition that ends the profit is also the mechanism that copies the
      difference.
    </p>
  </section>

  <SpreadFigure />

  <section class="body-text">
    <h3 class="body-header">What this diagram costs you</h3>
    <p>
      First, this is a partial-equilibrium story: one job, one month, two
      inputs, no capacity constraints and no sunk costs. The rent here is a
      technology gap; real rents also come from patents, licences, brand and
      network effects, and those live longer than an undercut cycle.
    </p>
    <p>
      Second, we've measured the rent in machine-day-equivalents, which is
      honest but a little abstract; turning it into money needs a price for a
      run, and that price is doing the rent's own work in this model.
    </p>
    <p>
      And third, competition here is a price war between recipes. The
      process that actually diffs an innovation through an industry —
      imitation with a lag, licensing, staff turnover — is behind the
      envelope's movement, not on top of it.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">In one sentence</h3>
    <p>
      The rectangle test tells you what nobody dominates; the envelope tells
      you what everybody wants; the gap between the two is where rent lives,
      and competition closes it from below while it copies the reason it
      opened. Thanks for reading!
    </p>
  </section>

  <section class="body-text" id="resources">
    <h3 class="body-header">Sources and further reading</h3>
    <p>
      CORE Econ, <em>The Economy 2.0: Microeconomics</em> (2023), Unit 2
      §2.2 — opportunity costs, economic rents and incentives. Theirs: the
      definitions of rent and of opportunity cost, and the role of prices in
      choosing among technologies. Ours: the seven recipes, the point–line
      duality as drawn here, the Balanced trap and its window, and every
      number on the page, all computed from
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