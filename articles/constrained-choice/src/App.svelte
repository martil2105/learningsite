<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Frontier from "./Components/Frontier.svelte";
  import Indifference from "./Components/Indifference.svelte";
  import Tangency from "./Components/Tangency.svelte";
  import WageLab from "./Components/WageLab.svelte";
  import Decomposition from "./Components/Decomposition.svelte";
  import SigmaLine from "./Components/SigmaLine.svelte";
  import Subsistence from "./Components/Subsistence.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import { W_MIN, W_MAX } from "./datasets.js";

  const mrsEq = katexify(`\\mathrm{MRS} = w`, false);
  const cdEq = katexify(`U(c, f) = c^{\\alpha} f^{1-\\alpha}`, false);
  const fStar = katexify(`f^{\\ast} = (1-\\alpha)T`, false);
  const elasticity = katexify(`\\frac{d\\log h}{d\\log w} = (\\sigma - 1)\\,\\frac{f}{T}`, true);
  const sigmaDef = katexify(`U(c,f) = \\left[\\alpha c^{\\rho} + (1-\\alpha) f^{\\rho}\\right]^{1/\\rho}, \\quad \\sigma = \\frac{1}{1-\\rho}`, true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say our hourly wage doubled tomorrow and nothing else about our
        lives changed. Would we work more hours, or fewer?
      </p>
      <p>
        Most first courses answer that it depends, and they give a good reason.
        An hour off is now more expensive, because we would give up twice as much pay
        to take it, so we should take fewer of them. But we're also better off,
        and people who are better off tend to buy more of the good things in
        life, including free time. So two effects pull in opposite directions,
        and in general, theory can't tell us which one is larger. That's true,
        and it is why the question is usually handed over to the data.
      </p>
      <p>
        It is worth looking closely, though, at the utility function that is
        usually drawn on the board while that answer is given. For that
        function, theory can tell us which effect wins, and the answer is
        neither. The two effects do not merely offset each other. They cancel
        completely, at every wage, so the working day stays where it was. To
        see why, we'll build up three small pictures first.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What a wage is, geometrically</h3>
      <p>
        Let's give our worker a day of sixteen waking hours and one decision to
        make: how many of those hours to keep as free time. Whatever is not kept
        is worked, and the wage turns those working hours into things to buy. If
        we put free time on one axis and consumption on the other, every
        affordable combination sits under a single straight line.
      </p>
    </section>

    <Frontier />

    <section class="body-text">
      <h3 class="body-header">What a preference is, geometrically</h3>
      <p>
        The second ingredient is what our worker wants, which is less a ranking
        of bundles than a set of exchange rates. If we join up the bundles that
        our worker likes equally well, we get a curve called an
        <span class="bold">indifference curve</span>. Its slope at any point
        tells us how much consumption one more hour of free time is worth
        <em>at that point</em>.
      </p>
      <p>
        The one substantive assumption we make is that the curves bow towards
        the origin, which means the rate falls as free time becomes plentiful.
        Somebody with two free hours will give up a lot for a third, but somebody
        with fourteen won't.
      </p>
    </section>

    <Indifference />

    <section class="body-text">
      <h3 class="body-header">Putting them together</h3>
      <p>
        Now we can combine our two pictures into one. Our worker picks the
        affordable bundle they like best. Wherever the rate they would trade at
        differs from the rate the wage offers, there's a trade worth making, so
        the best bundle is where the two rates agree. Economists call our
        worker's rate the <span class="bold">marginal rate of substitution</span>,
        or MRS, so the condition for the best bundle is {@html mrsEq}.
      </p>
    </section>

    <Tangency />

    <section class="body-text">
      <p>
        And that's the whole model. It is worth pausing on how little is in it: a
        line, a family of curves and a tangency. The same three objects turn up
        again in the firm's isoprofit problem, the bargaining frontier, and the
        choice between spending now and spending later. So once we've learned to
        read one, we've read all four.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">So what happens when the wage rises?</h3>
      <p>
        Below is the same diagram, but this time the wage is in your hands. Drag
        anywhere to pivot the frontier. The grey track shows every optimum our
        worker would choose across the whole range of the drag. In other words,
        it's our model's answer to the question we started with, drawn all at
        once.
      </p>
    </section>

    <WageLab />

    <section class="body-text">
      <p>
        The lab starts at σ = 1, a setting we'll explain shortly, and there the
        track is vertical. It isn't nearly vertical. It's exactly vertical. Our
        worker gets richer and consumption climbs, but the working day stays at
        eight hours whatever the wage does. Whether you push the wage from
        {W_MIN} kr to {W_MAX} kr or from 3 kr to 9,000 kr, hours worked don't
        change by a small amount. They don't change at all.
      </p>
      <p>
        The reason becomes clear as soon as we write down the algebra. At
        σ = 1, the utility function is {@html cdEq}, which is known as
        <span class="bold">Cobb–Douglas</span>. It's the workhorse we reach for
        whenever we would rather not commit to a functional form. With it, the
        solution is {@html fStar}, and the wage doesn't appear in that solution
        at all, because it cancelled out.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The effects are still there, and they're large</h3>
      <p>
        It would be reassuring if the cancellation happened because both effects
        were negligible, but they aren't. Let's hold our worker's satisfaction
        fixed and ask what the price change does on its own, and then hand back
        the money. This way of splitting the change is the Hicksian one, which
        holds utility constant rather than purchasing power. Each of the two
        steps moves a large part of the day, and they land right on top of each
        other.
      </p>
    </section>

    <Decomposition />

    <section class="body-text">
      <p>
        With a sixteen-fold rise in the wage, the substitution effect takes away
        six of our worker's eight free hours, which is three quarters of their
        leisure, and the income effect hands back the same six. So two large
        numbers that we would usually call "offsetting" turn out to be equal. This
        isn't a coincidence to note and move past. It is a property of the
        function we chose, and choosing that function settled the empirical
        question before any data arrived.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Leaving the knife-edge</h3>
      <p>
        Cobb–Douglas is just one member of a larger family of utility functions,
        known as <span class="bold">CES</span>, short for constant elasticity of
        substitution. The parameter that tells the family's members apart is σ,
        the <span class="bold">elasticity of substitution</span>. It measures
        how willing our worker is to swap consumption for free time when the
        rate changes.
      </p>
      {@html sigmaDef}
      <p>
        Setting σ = 1 gives us Cobb–Douglas. When σ is above 1, consumption and
        free time are easy substitutes, and the substitution effect wins. When
        it is below 1, they are poor substitutes, and the income effect wins.
        What's more, the whole family collapses onto straight lines. If we take
        the log of the ratio of hours worked to free time and plot it against the
        log wage, every member of the family is exactly linear, with a slope of
        σ − 1.
      </p>
    </section>

    <SigmaLine />

    <section class="body-text">
      <p>
        The dots are our model solved numerically at each wage, and the line is
        the closed form. If the claim is right, every dot sits on the line, and
        as you drag σ, you'll see that they do. The line rotates about the point
        where the wage is 1, and the answer to "which effect dominates?" is
        simply which side of horizontal the line has fallen on.
      </p>
      <p>
        If we write the same statement as an elasticity, it fits on one line. It
        says that σ decides the sign of the response, while how much of the day
        is already free decides its size:
      </p>
      {@html elasticity}
      <p>
        So theory isn't silent after all. What it says is that once we pick σ,
        we've picked the answer. The empirical question was never "which effect
        is bigger?" but "what is σ?", and that is a question about a number in a
        functional form, not a standoff between two forces.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Then what did shorten the working day?</h3>
      <p>
        Working hours in rich countries fell a long way over the last century
        and a half, and the usual explanation is that the income effect won. If
        we take that seriously, it means σ &lt; 1. But a constant σ below 1
        doesn't match the history, because it drives hours down without limit,
        towards a day with no work in it at all. What actually happened is that
        hours fell steeply and then flattened out.
      </p>
      <p>
        One small change to Cobb–Douglas produces that shape, and it is not a
        change to σ at all. Suppose some consumption, such as rent, food and
        heating, has to be covered before any of it is a choice. At a low wage,
        covering that floor eats up most of our worker's day, and there's no room
        to choose. As the wage rises, the time it takes to cover the floor
        shrinks to nothing, and the choice converges on the one Cobb–Douglas was
        making all along.
      </p>
      <p>
        In the figure below, you can drag the size of the floor. If you set it to
        zero, you'll see our worker's hours lie flat at eight, because that's
        Cobb–Douglas again.
      </p>
    </section>

    <Subsistence />

    <section class="body-text">
      <p>
        Hours only ever fall as the wage rises, steeply at first, and they
        approach eight from above without ever dropping below it. So the decline
        isn't a victory of one effect over the other. It's the floor getting out
        of the way, and where we end up is the same answer our effect-cancelling
        model gave in the first place.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Our model is small on purpose, and three of its simplifications matter
        here.
      </p>
      <p>
        First, the knife-edge is a property of this family of functions, not of
        choice in general. Within CES, σ settles the sign, and a different family
        could put the answer somewhere else. So the fair version of our claim is
        narrower than it might sound. The question really is open in general,
        but the diagram that usually illustrates it has picked a functional form,
        and that form has already answered it.
      </p>
      <p>
        Second, one worker with sixteen interchangeable hours isn't a labour
        market. Real hours come in lumps rather than on a continuum, and most
        people choose between a job and no job, not between 7.4 and 8.1 hours.
        It is also usually the household, not the individual, that allocates
        time, and that's where much of the interesting variation in the data
        lives.
      </p>
      <p>
        And finally, our model has no tax, no income from anything but work, no
        unemployment and nothing produced at home. All of these move the
        frontier in ways the wage alone doesn't.
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
