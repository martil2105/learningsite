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
  import katexify from "./katexify.js";

  const mrsEq = katexify(`\\mathrm{MRS} = w`, false);
  const cdEq = katexify(`U(c, f) = c^{\\alpha} f^{1-\\alpha}`, false);
  const fStar = katexify(`f^{\\ast} = (1-\\alpha)T`, false);
  const elasticity = katexify(`\\frac{d\\log h}{d\\log w} = (\\sigma - 1)\\,\\frac{f}{T}`, true);
  const sigmaDef = katexify(`U(c,f) = \\left[\\alpha c^{\\rho} + (1-\\alpha) f^{\\rho}\\right]^{1/\\rho}, \\quad \\sigma = \\frac{1}{1-\\rho}`, true);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Suppose your hourly wage doubled tomorrow and nothing else about your life
      changed. Would you work more hours, or fewer?
    </p>
    <p>
      The standard answer is that it depends, and that answer comes with a reason.
      An hour off is now more expensive, because you give up twice as much pay to
      take it, so you should take fewer of them. But you're also better off, and
      people who are better off tend to buy more of the good things in life,
      including free time. So there are two effects pulling in opposite
      directions, and the textbook closes the case by saying that theory can't
      tell you which one is larger. That, it says, is an empirical question.
    </p>
    <p>
      It's a good answer, and it's taught everywhere. However, for the utility
      function that's drawn on the board while the answer is being given, it's
      exactly wrong. The two effects don't merely offset each other. They cancel
      to the last digit a computer can carry, at every wage, and the working day
      doesn't move by so much as a second. To see why, we'll need to build up
      three small pictures first.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What a wage is, geometrically</h3>
    <p>
      Let's give our worker a day of sixteen waking hours and one decision to make:
      how many of those hours to keep as free time. Whatever isn't kept is
      worked, and the wage turns those working hours into things to buy. If we put
      free time on one axis and consumption on the other, every affordable
      combination sits under a single straight line.
    </p>
  </section>

  <Frontier />

  <section class="body-text">
    <h3 class="body-header">What a preference is, geometrically</h3>
    <p>
      The second ingredient is what the worker wants, which is less a ranking of
      bundles than a set of exchange rates. If we join up the bundles that the
      worker likes equally well, we get a curve called an
      <span class="bold">indifference curve</span>. Its slope at any point tells
      us how much consumption one more hour of free time is worth
      <em>at that point</em>.
    </p>
    <p>
      The one substantive assumption we make is that the curves bow towards the
      origin, which means the rate falls as free time becomes plentiful. Somebody
      with two free hours will give up a lot for a third, but somebody with
      fourteen won't.
    </p>
  </section>

  <Indifference />

  <section class="body-text">
    <h3 class="body-header">Putting them together</h3>
    <p>
      Now we can combine the two pictures into one. The worker picks the
      affordable bundle they like best, and wherever the rate they'd trade at
      differs from the rate the wage offers, there's a trade worth making. So the
      best bundle is where the two rates agree. Economists call the worker's rate
      the <span class="bold">marginal rate of substitution</span>, or MRS, so the
      condition for the best bundle is {@html mrsEq}.
    </p>
  </section>

  <Tangency />

  <section class="body-text">
    <p>
      And that's the whole model. It's worth pausing on how little is in it: a
      line, a family of curves and a tangency. The same three objects reappear in
      the firm's isoprofit problem, the bargaining frontier, and the choice
      between spending now and spending later, so once you've learned to read
      one, you've read all four.
    </p>
    <h3 class="body-header">So what happens when the wage rises?</h3>
    <p>
      Below is the same diagram, but this time the wage is in your hands. Drag
      anywhere to pivot the frontier. The grey track shows every optimum the
      worker would choose across the whole range of the drag. In other words,
      it's the model's answer to the question at the top of this page, drawn all
      at once.
    </p>
  </section>

  <WageLab />

  <section class="body-text">
    <p>
      The lab starts at σ = 1, a setting we'll explain shortly, and there the track
      is vertical. We don't mean nearly vertical; it's exactly vertical. The
      worker gets richer and consumption climbs, but the working day stays at
      eight hours whatever the wage does. Whether you push the wage from 30 kr to
      90 kr or from 3 kr to 9,000 kr, hours worked change by an amount that isn't
      just small. It's zero.
    </p>
    <p>
      The reason becomes clear as soon as we write down the algebra. At σ = 1, the
      utility function is {@html cdEq}, which is known as
      <span class="bold">Cobb–Douglas</span>. It's the workhorse that gets drawn
      whenever nobody wants to commit to a functional form. With it, the solution
      is {@html fStar}, and the wage doesn't appear in that solution at all,
      because it cancelled out.
    </p>
    <h3 class="body-header">The effects are still there, and they're enormous</h3>
    <p>
      It would be reassuring if the cancellation happened because both effects
      were negligible, but they aren't. Let's hold the worker's satisfaction fixed
      and ask what the price change does on its own, and then hand back the
      money. Each of those two steps moves a large fraction of the day, and they
      land right on top of each other.
    </p>
  </section>

  <Decomposition />

  <section class="body-text">
    <p>
      With a sixteen-fold rise in the wage, the substitution effect takes away six
      of the worker's eight free hours, which is three quarters of their leisure,
      and the income effect hands back the same six. So two large numbers that a
      textbook would call "offsetting" are in fact equal to every digit. This
      isn't a coincidence to note and move past. It's a property of the function
      that was chosen, and choosing that function settled the empirical question
      before any data arrived.
    </p>
    <h3 class="body-header">Leaving the knife-edge</h3>
    <p>
      Cobb–Douglas is just one member of a larger family of utility functions,
      known as <span class="bold">CES</span>, short for constant elasticity of
      substitution. The parameter that distinguishes the family's members is σ,
      the <span class="bold">elasticity of substitution</span>, which measures
      how willing the worker is to swap consumption for free time when the rate
      changes.
    </p>
    <div class="eq-block">{@html sigmaDef}</div>
    <p>
      Setting σ = 1 gives us Cobb–Douglas. When σ is above 1, consumption and
      free time are easy substitutes, and the substitution effect wins. When it's
      below 1, they're poor substitutes, and the income effect wins. What's more,
      the whole family collapses onto one straight line. If we take the log of
      the ratio of hours worked to free time and plot it against the log wage,
      every member of the family is exactly linear, with a slope of σ − 1.
    </p>
  </section>

  <SigmaLine />

  <section class="body-text">
    <p>
      The dots are the model solved numerically at each wage, and the line is the
      closed form. They agree to about a part in a trillion, which reflects the
      arithmetic rather than the economics. As you drag σ, the fan rotates about
      the point where the wage is 1, and the answer to "which effect dominates?"
      is simply which side of horizontal the line has fallen on.
    </p>
    <p>
      If we write the same statement as an elasticity, it fits on one line. It
      says that σ decides the sign of the response, while how much of the day is
      already free decides its size:
    </p>
    <div class="eq-block">{@html elasticity}</div>
    <p>
      So theory isn't silent after all. What it says is that once you pick σ,
      you've picked the answer. The empirical question was never "which effect
      is bigger?" but "what is σ?", and that's a question about a number in a
      functional form, not a standoff between two forces.
    </p>
    <h3 class="body-header">Then what did shorten the working day?</h3>
    <p>
      Working hours in rich countries fell a long way over the last century and a
      half, and the usual explanation is that the income effect won. If we take
      that seriously, it means σ &lt; 1. But a constant σ below 1 doesn't match
      the history, because it drives hours down without limit, towards a day with
      no work in it at all. What actually happened is that hours fell steeply and
      then flattened out.
    </p>
    <p>
      One small change to Cobb–Douglas produces that shape, and it isn't a change
      to σ at all. Suppose some consumption, such as rent, food and heating, has
      to be covered before any of it is a choice. At a low wage, covering that
      floor eats up most of the day, and the worker has no room to choose. As the
      wage rises, the time it takes to cover the floor shrinks to nothing, and the
      choice converges on the one Cobb–Douglas was making all along.
    </p>
  </section>

  <Subsistence />

  <section class="body-text">
    <p>
      Hours only ever fall as the wage rises, steeply at first, and they approach
      eight from above without ever dropping below it. So the decline isn't a
      victory of one effect over the other. It's the floor getting out of the
      way, and the destination is precisely the answer the effect-cancelling model
      gave in the first place.
    </p>
    <h3 class="body-header">What this costs you</h3>
    <p>
      The knife-edge is a property of this family of functions, not of choice in
      general. σ is the parameter that settles the sign <em>within</em> CES, and a
      different family could put the answer somewhere else. So the honest version
      of our claim is that the usual account smuggles in a functional form and
      then reports its consequence as an open question.
    </p>
    <p>
      Nor is one worker with sixteen interchangeable hours a labour market. Real
      hours come in lumps rather than on a continuum, and most people choose
      between a job and no job, not between 7.4 and 8.1 hours. It's also usually
      the household, not the individual, that allocates time, and that's where
      most of the interesting variation in the data lives. Finally, this model
      has no tax, no non-labour income, no unemployment and nothing produced at
      home, and all of these move the frontier in ways the wage alone doesn't.
    </p>
    <p>
      What survives all of that is the method. Write down the constraint, write
      down the preference and find where the rates agree. Then comes the step
      that usually gets skipped: check whether the answer you got depends on an
      assumption you weren't paying attention to. Here, it depended on one
      entirely.
    </p>
    <p>
      Thanks for reading!
    </p>
    <h3 class="body-header">Sources and further reading</h3>
    <p>
      The worker's problem in this form, and the framing of hours as a choice
      between consumption and free time, follow CORE Econ's <em>The Economy 2.0:
      Microeconomics</em> (2023), Unit 3 and its mathematical Extension. However,
      every figure, number, parameter and derivation on this page is my own, and
      nothing is reproduced from it.
    </p>
    <p>
      The indeterminacy this article argues with is old, and it's worth reading in
      the original: Lionel Robbins, "On the Elasticity of Demand for
      Income in Terms of Effort", <em>Economica</em> 29 (1930), 123–129. Robbins
      was answering Pigou and Knight, who held that higher wages must reduce
      effort, and his conclusion is the one still taught: we can't say a priori,
      so we must ascertain the elasticity for the workers concerned. He's right
      that the model doesn't settle it. What this page adds is that choosing the
      function settles it for you, quietly, before any data is consulted.
    </p>
    <p>
      The CES form comes from Arrow, Chenery, Minhas and Solow, "Capital–Labor
      Substitution and Economic Efficiency", <em>Review of Economics and
      Statistics</em> 43 (1961), 225–250. The subsistence term comes from Geary,
      <em>Review of Economic Studies</em> 18 (1950), 65–66, and Stone (1954),
      and the two are usually met together as the linear expenditure system. The
      decomposition drawn here is the Hicksian one, which holds utility constant
      rather than purchasing power.
    </p>
  </section>
</main>

<style>
  main { display: block; }
  .eq-block { margin: 1.2rem 0; text-align: center; }
</style>
