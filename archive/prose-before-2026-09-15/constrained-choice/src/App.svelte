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
      The standard answer is that it depends, and it comes with a reason. An hour
      off is now more expensive — you are giving up twice as much to take it — so
      you should take fewer of them. But you are also better off, and people who
      are better off tend to buy more of the good things, free time included. Two
      effects, opposite directions, and the textbook closes the case by saying
      theory cannot tell you which is larger. That is an empirical question.
    </p>
    <p>
      It is a good answer and it is taught everywhere. It is also, for the
      utility function that is drawn on the board while it is being said, exactly
      wrong: the two effects do not merely offset, they cancel to the last digit
      a computer can carry, at every wage, and the working day does not move by
      so much as a second. Getting to that takes three small pictures first.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What a wage is, geometrically</h3>
    <p>
      Give the worker a day of sixteen waking hours and one decision: how many to
      keep. Whatever is not kept is worked, and the wage turns it into things to
      buy. Put free time on one axis and consumption on the other and every
      affordable combination sits under a single straight line.
    </p>
  </section>

  <Frontier />

  <section class="body-text">
    <h3 class="body-header">What a preference is, geometrically</h3>
    <p>
      The second ingredient is what the worker wants, and it is not a ranking of
      bundles so much as a set of exchange rates. Join up the bundles that are
      equally good and you get a curve; its slope at any point is how much
      consumption one more hour of free time is worth <em>there</em>.
    </p>
    <p>
      The one substantive assumption is that the curves bow towards the origin —
      that the rate falls as free time gets plentiful. Somebody with two free
      hours will give up a lot for a third. Somebody with fourteen will not.
    </p>
  </section>

  <Indifference />

  <section class="body-text">
    <h3 class="body-header">Putting them together</h3>
    <p>
      Now the two pictures are the same picture. The worker picks the affordable
      bundle they like best, and wherever the rate they would trade at differs
      from the rate the wage trades at, there is a trade worth making. So the
      best bundle is where the two rates agree: {@html mrsEq}.
    </p>
  </section>

  <Tangency />

  <section class="body-text">
    <p>
      That is the whole model. It is worth pausing on how little is in it — a
      line, a family of curves, and a tangency — because the same three objects
      reappear as the firm's isoprofit problem, the bargaining frontier, and the
      choice between spending now and spending later. Learn to read one and you
      have read all four.
    </p>
    <h3 class="body-header">So: what happens when the wage rises?</h3>
    <p>
      Below is the same diagram with the wage in your hands. Drag anywhere to
      pivot the frontier. The grey track is every optimum the worker would choose
      across the whole range of the drag — the model's answer to the question at
      the top of this page, drawn all at once.
    </p>
  </section>

  <WageLab />

  <section class="body-text">
    <p>
      At σ = 1 the track is vertical. Not nearly vertical — vertical. The worker
      gets richer, consumption climbs, and the working day stays at eight hours
      whatever the wage does. Push the wage from 30 kr to 90 kr, or from 3 kr to
      9,000 kr, and hours worked change by an amount that is not small: it is
      zero.
    </p>
    <p>
      The reason is visible in the algebra the moment you write it down. With
      {@html cdEq} — Cobb–Douglas, the workhorse that gets drawn when nobody
      wants to commit to a functional form — the solution is {@html fStar}. The
      wage is not in it. It cancelled.
    </p>
    <h3 class="body-header">The effects are still there, and they are enormous</h3>
    <p>
      It would be comfortable if the cancellation happened because both effects
      were negligible. They are not. Hold the worker's satisfaction fixed and ask
      what the price change alone does, then hand back the money: each step moves
      a large fraction of the day, and they land on top of each other.
    </p>
  </section>

  <Decomposition />

  <section class="body-text">
    <p>
      A sixteen-fold rise in the wage moves the substitution effect by six of
      eight free hours — three quarters of the worker's leisure — and the income
      effect hands back the same six. Two large numbers that a textbook would
      call "offsetting" are in fact equal to every digit. That is not a
      coincidence to be noted and moved past; it is a property of the function
      that was chosen, and choosing it settled the empirical question before any
      data arrived.
    </p>
    <h3 class="body-header">Leaving the knife-edge</h3>
    <p>
      Cobb–Douglas is one member of a family. The parameter that distinguishes
      them is σ, the elasticity of substitution — how willing the worker is to
      swap consumption for free time when the rate changes.
    </p>
    <div class="eq-block">{@html sigmaDef}</div>
    <p>
      σ = 1 is Cobb–Douglas. Above it, consumption and free time are easy
      substitutes and the substitution effect wins; below it they are poor
      substitutes and the income effect wins. And the whole family collapses onto
      one straight line: take the log of the ratio of hours worked to free time,
      plot it against the log wage, and every member is exactly linear with slope
      σ − 1.
    </p>
  </section>

  <SigmaLine />

  <section class="body-text">
    <p>
      The dots are the model solved numerically at each wage; the line is the
      closed form. They agree to about a part in a trillion, which is the
      arithmetic and not the economics. Drag σ and the fan rotates about the
      point where the wage is 1 — and the answer to "which effect dominates" is
      just which side of horizontal the line has fallen on.
    </p>
    <p>
      Written as an elasticity, the same statement is one line, and it says that
      the sign of the response is decided by σ and its size by how much of the
      day is already free:
    </p>
    <div class="eq-block">{@html elasticity}</div>
    <p>
      So theory is not silent after all. It says: pick σ and you have picked the
      answer. The empirical question was never "which effect is bigger" — it was
      "what is σ", and that is a question about a number in a functional form,
      not a standoff between two forces.
    </p>
    <h3 class="body-header">Then what did shorten the working day?</h3>
    <p>
      Working hours in rich countries fell a long way over the last century and a
      half, and the usual gloss is that the income effect won. Take that
      seriously and it means σ &lt; 1. But a constant σ below 1 does not describe
      the history: it drives hours down without limit, towards a day with no work
      in it at all. What actually happened is that hours fell steeply and then
      flattened.
    </p>
    <p>
      One small change to Cobb–Douglas produces that shape, and it is not a
      change to σ at all. Suppose some consumption has to be covered before any
      of it is a choice — rent, food, heat. At a low wage that floor eats most of
      the day and the worker has no room to choose; as the wage rises the floor
      shrinks to nothing and the choice converges on the one Cobb–Douglas was
      making all along.
    </p>
  </section>

  <Subsistence />

  <section class="body-text">
    <p>
      Hours fall monotonically, steeply at first, and approach eight from above
      without ever going below. The decline is not a victory of one effect over
      another. It is the floor getting out of the way — and the destination is
      precisely the answer the effect-cancelling model gave in the first place.
    </p>
    <h3 class="body-header">What this costs you</h3>
    <p>
      The knife-edge is a property of this family, not of choice in general. σ is
      the parameter that settles the sign <em>within</em> CES; a different family
      can put the answer somewhere else, and the honest version of the claim is
      that the received account smuggles in a functional form and then reports
      its consequence as an open question.
    </p>
    <p>
      Nor is one worker with sixteen fungible hours a labour market. Real hours
      come in lumps, not in a continuum — most people choose between a job and no
      job, not between 7.4 and 8.1 hours. The household, not the person, is
      usually what allocates time, which is where most of the interesting
      variation in the data lives. And there is no tax here, no non-labour
      income, no unemployment, and nothing produced at home, all of which move
      the frontier in ways the wage alone does not.
    </p>
    <p>
      What survives all that is the method. Write the constraint, write the
      preference, find where the rates agree, and then — the step that is usually
      skipped — check whether the answer you got depends on the assumption you
      were not paying attention to. Here it depended entirely on it.
    </p>
    <h3 class="body-header">Sources and further reading</h3>
    <p>
      The worker's problem in this form, and the framing of hours as a choice
      between consumption and free time, follow CORE Econ's <em>The Economy 2.0:
      Microeconomics</em> (2023), Unit 3 and its mathematical Extension. Every
      figure, number, parameter and derivation on this page is my own; nothing is
      reproduced from it.
    </p>
    <p>
      The indeterminacy this article is arguing with is old, and it is worth
      reading in the original: Lionel Robbins, "On the Elasticity of Demand for
      Income in Terms of Effort", <em>Economica</em> 29 (1930), 123–129. Robbins
      is answering Pigou and Knight, who held that higher wages must reduce
      effort, and his conclusion is the one still taught — that we cannot say a
      priori, and must ascertain the elasticity for the workers concerned. He is
      right that the model does not settle it. What this page adds is that
      choosing the function settles it for you, quietly, before any data is
      consulted.
    </p>
    <p>
      The CES form is Arrow, Chenery, Minhas and Solow, "Capital–Labor
      Substitution and Economic Efficiency", <em>Review of Economics and
      Statistics</em> 43 (1961), 225–250. The subsistence term is Geary,
      <em>Review of Economic Studies</em> 18 (1950), 65–66, and Stone (1954),
      usually met together as the linear expenditure system. The decomposition
      drawn here is the Hicksian one, holding utility rather than purchasing
      power constant.
    </p>
  </section>
</main>

<style>
  main { display: block; }
  .eq-block { margin: 1.2rem 0; text-align: center; }
</style>
