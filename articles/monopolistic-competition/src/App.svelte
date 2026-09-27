<script>
  /* App.svelte for monopolistic-competition */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import OneFirm from "./Components/OneFirm.svelte";
  import ElasticityFigure from "./Components/ElasticityFigure.svelte";
  import VarietyLab from "./Components/VarietyLab.svelte";
  import ScaleFigure from "./Components/ScaleFigure.svelte";
  import ExcessCapacityFigure from "./Components/ExcessCapacityFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import { epsOf, nOf, scaleOf, scaleDS, scaleShortfall } from "./ces.js";

  const demandEq = katexify("q_i = \\frac{E \\cdot p_i^{-\\sigma}}{\\sum_{j=1}^{n} p_j^{1-\\sigma}}", true);
  const epsEq = katexify("|\\varepsilon_i| = \\sigma - (\\sigma - 1)\\, s_i = \\sigma - \\frac{\\sigma - 1}{n}", true);
  const nEq = katexify("n^* = \\frac{E/f + \\sigma - 1}{\\sigma}", true);
  const excessEq = katexify("n_{\\text{market}} - n_{\\text{planner}} = \\frac{\\sigma - 1}{\\sigma} < 1", true);
  const shortfallEq = katexify("1 - \\frac{x}{x_{\\text{DS}}} = \\frac{1}{n}", true);

  const eps2 = epsOf(2, 4);
  const small = { n: nOf(100, 5, 4), x: scaleOf(nOf(100, 5, 4), 100, 4), gap: scaleShortfall(nOf(100, 5, 4)) };
  const big = { n: nOf(1e6, 5, 4), x: scaleOf(nOf(1e6, 5, 4), 1e6, 4) };
  const xDS = scaleDS(5, 4);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's think about the cafés on a busy street. Each one sells coffee, but
        not quite the same coffee, because the beans, the seats and the walk from
        your door all differ. So if one café raises its price a little, it loses
        some of its customers but not all of them. That's a small amount of power
        over the price, which a perfectly competitive firm doesn't have. On the
        other hand, there are plenty of other cafés, so none of them can charge
        whatever it likes.
      </p>
      <p>
        This mix is called <span class="bold">monopolistic competition</span>:
        each firm has a monopoly on its own variety, and it competes with
        everyone else's. It raises a question that neither perfect competition
        nor monopoly asks. Every new café costs a fixed amount to open, so more
        variety means more fixed costs and less coffee per café. How many
        varieties does a market end up with, and is that the right number?
      </p>
      <p>
        The standard way to answer this is a model that Avinash Dixit and Joseph
        Stiglitz published in 1977. We usually meet its "large-group" version,
        in which each firm is too small to matter to the market as a whole. As
        we'll see, if we keep the number of firms finite, a few of the familiar
        results pick up a small correction, and each correction fades as one
        over the number of firms.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">One café's demand</h3>
      <p>
        Let's write E for the total amount buyers spend in our market, n for the
        number of firms, and σ for how easily buyers swap one variety for
        another, which is called the <span class="bold">elasticity of
        substitution</span>. A higher σ means the varieties are closer
        substitutes, and we need σ to be above 1. In this model, known as
        <span class="bold">CES</span>, short for constant elasticity of
        substitution, firm i sells
      </p>
      {@html demandEq}
      <p>
        where p<sub>i</sub> is its own price and the sum runs over every firm's
        price. The chart below shows one café's demand as it changes its own
        price while the others keep theirs. If you drag the price, and then try
        changing σ and the number of firms, keep an eye on the elasticity
        readout and compare it with σ.
      </p>
    </section>

    <OneFirm />

    <section class="body-text">
      <h3 class="body-header">Why the elasticity isn't σ</h3>
      <p>
        The large-group version says that each firm faces a price elasticity of
        σ. With a finite number of firms, it's a little lower:
      </p>
      {@html epsEq}
      <p>
        Here s<sub>i</sub> is the firm's share of total spending, which is 1/n
        when every firm charges the same price.
      </p>
      <p>
        Why is it lower? When one café raises its price, it makes the market as
        a whole a little dearer, because its price is one of the prices buyers
        are choosing between. So its rivals look slightly less attractive than
        before, and fewer buyers leave than if the café were tiny. With only two
        firms and σ = 4, the elasticity is {eps2.toFixed(1)} rather than 4. The
        chart below shows how the gap closes as we add firms.
      </p>
    </section>

    <ElasticityFigure />

    <section class="body-text">
      <h3 class="body-header">How many varieties?</h3>
      <p>
        Now let's let firms in. Each new variety costs a fixed amount f to set
        up, plus a constant cost of c = 1 for every unit it makes. Firms keep
        entering until profit is zero, which gives us
      </p>
      {@html nEq}
      <p>
        We'll compare that with a planner who chooses the number of varieties to
        make buyers as well off as possible with the same resources. The lab
        below puts the two side by side. As you drag the market size, the fixed
        cost and σ, watch three things: how many varieties each of them gets,
        how much each firm makes, and the markup.
      </p>
    </section>

    <VarietyLab />

    <section class="body-text">
      <p>
        Three results hold wherever you put the sliders. First, the market has
        more varieties than the planner would choose, but only by
        (σ − 1)/σ, which is always less than one:
      </p>
      {@html excessEq}
      <p>
        In other words, the market over-provides variety, but never by as much
        as a whole café.
      </p>
      <p>
        Second, each firm makes a little less than the large-group scale,
        x<sub>DS</sub> = f(σ − 1)/c, and the shortfall is one over the number of
        firms:
      </p>
      {@html shortfallEq}
      <p>
        And third, the markup sits a little above the large-group markup,
        σ/(σ − 1), and that gap also shrinks as more firms enter.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What bigger markets do</h3>
      <p>
        What happens as the market grows? More spending makes room for more
        varieties, and because the shortfall in scale is 1/n, each firm gets
        closer to the large-group scale. The table below keeps f = 5 and σ = 4
        and makes our market bigger and bigger.
      </p>
    </section>

    <ScaleFigure />

    <section class="body-text">
      <p>
        In the smallest market there's room for {small.n.toFixed(2)} varieties,
        and each one makes {small.x.toFixed(2)} units, which is
        {(100 * small.gap).toFixed(1)}% short of the large-group scale of
        {xDS.toFixed(0)}. By the time buyers spend a million, there are about
        {(Math.round(big.n / 1000) * 1000).toLocaleString("en-GB")} varieties, and each one makes
        {big.x.toFixed(4)}, which is as close to {xDS.toFixed(0)} as makes no
        difference.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What about excess capacity?</h3>
      <p>
        In 1933, Edward Chamberlin pointed out that firms in a market like this
        produce on the falling part of their average cost curve, short of the
        output at which average cost is lowest. That's known as the
        <span class="bold">excess capacity</span> result, and it's often read as
        a sign of waste.
      </p>
      <p>
        Our model puts that point in a different light. With a fixed cost and a
        constant marginal cost, average cost falls at every output, as you can
        see in the chart below, so there's no lowest point to fall short of. Our
        cafés always have room to grow, but that isn't obviously a waste, because
        making each café bigger would mean fewer cafés, and buyers value the
        variety. Chamberlin's argument relies on a U-shaped average cost, so
        this is less a rebuttal than a reminder of what his result depends on.
      </p>
    </section>

    <ExcessCapacityFigure />

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        The model is simple on purpose, and three of its simplifications matter
        here.
      </p>
      <p>
        First, every variety substitutes for every other one equally well. Real
        cafés compete mostly with their neighbours, and models of competition
        along a street or around a circle are built to capture that.
      </p>
      <p>
        Second, total spending in the market stays fixed whatever the prices
        are, and every firm has the same costs. In models where productivity
        differs between firms, such as Melitz (2003), the better firms grow and
        the worse ones leave, and that changes the story.
      </p>
      <p>
        And finally, we've let n take any value, as if firms could come in
        fractions. The article on
        <a href="../perfect-competition/">perfect competition</a> shows what
        whole numbers do to entry.
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
  /* normalize.css lowercases <sub> and <sup>, which turned Z<sup>M</sup>
     into "Zm" and t<sub>V</sub> into "tv". They keep the case they're written in. */
  :global(sub),
  :global(sup) {
    text-transform: none;
  }
</style>
