<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Spine from "./Components/Spine.svelte";
  import LernerCheck from "./Components/LernerCheck.svelte";
  import CurvatureLab from "./Components/CurvatureLab.svelte";
  import PassThroughFigure from "./Components/PassThroughFigure.svelte";
  import katexify from "./katexify.js";

  const lernerEq = katexify(`\\frac{p - c}{p} = \\frac{1}{|\\varepsilon|}`, true);
  const focEq = katexify(`(p - c)\\,q'(p) + q(p) = 0`, true);
  const rhoEq = katexify(`\\rho \\;=\\; \\frac{dp^*}{dc} \\;=\\; \\frac{q'}{2q' + (p - c)\\,q''}`, true);
  const familyEq = katexify(`q(p) = (a + b\\,p)^{\\,n}`, true);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Let's put ourselves in the pricing seat. We sell one product and we know
      our marginal cost. We've also run an experiment: at the price we're
      charging, demand has an elasticity of 5/3, so if we raise the price by
      3%, the quantity we sell falls by about 5%. A well-known rule says that's all we
      need to know to set the price. It's called the
      <span class="bold">Lerner rule</span>, and it says our profit-maximising
      markup over cost is one over that elasticity:
    </p>
    <p class="eq">{@html lernerEq}</p>
    <p>
      The rule isn't an approximation. At the best price it holds exactly, on
      any demand curve, because it's the condition for maximum profit written
      in a different way, as we'll see in a moment. What the rule doesn't do
      is tell us anything about the rest of the demand curve. To see how much
      that matters, we'll use two curves that agree on everything the rule can
      see.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Why the rule always holds</h3>
    <p>
      Our profit is the price minus the cost, times the quantity we sell. At the
      best price, a small price rise gains exactly as much margin on the units
      we keep as it loses on the units we no longer sell:
    </p>
    <p class="eq">{@html focEq}</p>
    <p>
      If we divide through by q and rearrange, the left-hand side becomes the
      markup and the right-hand side becomes 1/|ε|, where ε is the elasticity
      at the price we've settled on. That last part matters more than it looks.
      The rule doesn't tell us where to price. It tells us what the elasticity
      will be once we're at the best price, whatever the curve looks like
      elsewhere.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Two curves, one point</h3>
    <p>
      So let's set up a test. We'll take a straight-line demand curve,
      q = 120 − 3p, and a constant-elasticity curve,
      q = 45 × (p/25)<sup>−5/3</sup>. Both pass through a price of 25 and a
      quantity of 45, and both have an elasticity of 5/3 there, so at the
      point we measured, we can't tell them apart. With a marginal cost of 10,
      the rule says the markup should be 1/(5/3) = 60%, which puts the best
      price at 25 on both curves. And that's what we get from each of them.
    </p>
  </section>

  <Spine />

  <section class="body-text">
    <h3 class="body-header">Now change the cost</h3>
    <p>
      Most of what we'd use an elasticity for is a what-if: an input price
      moves, and we want to know what should happen to our price. So if you
      drag the cost away from 10 in the chart above, you'll see what happens. The two curves agree at the point we measured, but their best prices come apart straight away.
    </p>
    <p>
      The straight line passes exactly half of any cost rise through to the
      price. The constant-elasticity curve passes through more than all of it.
      At an elasticity of 5/3, a one-unit rise in cost lifts the best price by
      2.5 units, at an elasticity of 2 it lifts it by 2, and in general it's
      ε/(ε − 1). So we have the same point, the same elasticity and the same
      price today, and yet one curve moves the price five times as far as the
      other when the cost changes. The table below shows that the rule still
      holds on both curves at every cost.
    </p>
  </section>

  <LernerCheck />

  <section class="body-text">
    <h3 class="body-header">One family, one slider</h3>
    <p>
      Both of our curves belong to one family of demand curves, a power of a
      straight line:
    </p>
    <p class="eq">{@html familyEq}</p>
    <p>
      The exponent n sets how much the curve bends. When n = 1 we get our
      straight line, and when n = −5/3 we get our constant-elasticity curve.
      For every n, we choose a and b so that the curve still passes through our
      point with an elasticity of 5/3. That means the lab below can keep
      everything we measured fixed and change only the thing the elasticity
      can't see, which is the <span class="bold">curvature</span>.
    </p>
    <p>
      Drag n and you'll see that the best price stays at 25 and the markup
      stays at 60%, so the rule never moves. What does move is how far the
      price responds to a change in cost, which is usually the question we
      wanted the elasticity to answer.
    </p>
  </section>

  <CurvatureLab />

  <section class="body-text">
    <h3 class="body-header">What sets the pass-through</h3>
    <p>
      How much a change in cost moves the best price is called
      <span class="bold">pass-through</span>, and we'll write it as ρ. If we
      differentiate the profit condition with respect to cost, we get
    </p>
    <p class="eq">{@html rhoEq}</p>
    <p>
      This depends on q″, the second derivative of demand, which measures its
      curvature, and the elasticity carries no information about that. For
      our family, the formula works out to ρ = n/(1 + n). That's a half on the
      straight line, ε/(ε − 1) for the constant-elasticity curves, and close
      to one as n grows large, which is the case of perfect competition.
    </p>
    <p>
      Between n = −1 and n = 0, though, ρ is negative, so a rise in cost
      lowers the best price. That isn't a quirk of the algebra. It's a known
      case in the literature on pass-through, and it's another thing the
      elasticity at one point can't tell us.
    </p>
  </section>

  <PassThroughFigure />

  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      There are three things to keep in mind when using the markup rule.
    </p>
    <p>
      First, an elasticity is a local measurement. It tells us the best price
      today, and nothing about how that price should respond to a change. If a
      decision depends on pass-through, as tax, tariff and input-cost
      questions do, then the curvature has to be estimated or assumed, and
      that assumption is doing the work.
    </p>
    <p>
      Second, the rule holds at the best price, but seeing it hold isn't
      evidence that a firm is at its best price. Any firm can compute 1/|ε| at
      whatever price it charges and get some number. So the rule is a
      consistency check, not a recipe.
    </p>
    <p>
      And finally, the elasticity that belongs in the formula is the
      elasticity of the firm's own demand, after its rivals have responded.
      That's usually quite different from the elasticity of the whole
      market, which is often the number that's easiest to find.
    </p>
  </section>

  <section class="body-text" id="conclusion">
    <h3 class="body-header">Where this leaves the markup rule</h3>
    <p>
      The Lerner rule is right: at the best price, the markup is one over the
      elasticity, on any demand curve. But it describes a single point. Two
      curves that agree at that point set the same price today and can
      respond to a change in cost in very different ways.
    </p>
    <p>
      So when the question is what happens next, whether that's a new tax, a
      tariff or a jump in input prices, we need to know how the demand curve
      bends as well as how steep it is where we stand.
    </p>
    <p>Thanks for reading!</p>
  </section>

  <section class="body-text" id="resources">
    <h3 class="body-header">Sources and further reading</h3>
    <ul class="resources-list">
      <li>
        CORE Econ (2023), <em>The Economy 2.0: Microeconomics</em>, Unit 7. A
        free introduction to how a firm with some power over its price sets
        that price, and to the markup rule.
      </li>
      <li>
        Lerner, A. P. (1934), "The Concept of Monopoly and the Measurement of
        Monopoly Power", <em>The Review of Economic Studies</em>, 1(3),
        157–175. The markup rule.
      </li>
      <li>
        Bulow, J. I., and Pfleiderer, P. (1983), "A Note on the Effect of Cost
        Changes on Prices", <em>Journal of Political Economy</em>, 91(1),
        182–185. The family of demand curves used here, and its pass-through.
      </li>
      <li>
        Weyl, E. G., and Fabinger, M. (2013), "Pass-Through as an Economic Tool:
        Principles of Incidence under Imperfect Competition",
        <em>Journal of Political Economy</em>, 121(3), 528–583. A general
        treatment of pass-through.
      </li>
    </ul>
    <p>
      The pinned family of curves, the worked examples and every number on
      this page are ours. The page is built on the scaffold and design system
      of Amazon's MLU-Explain, used under CC BY-SA 4.0.
    </p>
  </section>
</main>

<style>
  main {
    display: block;
  }
  /* global.css gives .body-text and .body-header 80% each on a phone, so a
     heading inside a section was indented to 64%. Inside a section it should
     line up with the paragraphs. */
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  .resources-list {
    padding-left: 1.1rem;
    margin: 0 0 1.2rem 0;
  }
  .resources-list li {
    font-size: 0.95rem;
    line-height: 1.55;
    margin-bottom: 0.6rem;
  }
  #resources {
    margin-bottom: 4rem;
  }
</style>