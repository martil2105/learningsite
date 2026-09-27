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
      Let's put ourselves in the pricing seat. You sell one product, you know
      your marginal cost, and you've run an experiment: at the price you're
      charging, demand has an elasticity of 5/3 — raise the price 3% and
      quantity falls about 5%. The most-quoted rule in pricing says this is
      all you need to know. It's called the <span class="bold">Lerner
      rule</span>, and it says your profit-maximising markup over cost is
      exactly one over that elasticity:
    </p>
    <p class="eq">{@html lernerEq}</p>
    <p>
      The rule is not approximately true. It is exactly true, at the optimum,
      on every demand curve there is — because it is the first-order
      condition in disguise, and we'll write that out. What the rule is
      <em>not</em> is a passport to the rest of the demand curve. Let's find
      out how much it doesn't tell you, with two curves that agree on
      everything the rule can see.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Why the rule is true everywhere at once</h3>
    <p>
      Maximise profit, which is price minus cost, times quantity. The
      first-order condition says: at the best price, a small rise in price
      gains margin on the units you keep and loses exactly the units you
      lose:
    </p>
    <p class="eq">{@html focEq}</p>
    <p>
      Divide through by q and rearrange, and the left-hand side is the Lerner
      ratio and the right-hand side is 1/|ε| — where ε is the elasticity
      <em>at the price you settled on</em>. That last clause is doing more
      work than it looks like. The rule doesn't predict where you'll price;
      it tells you what the elasticity will be once you get there. You could
      say the elasticity doesn't determine the markup so much as the markup
      goes looking for the point where the elasticity suits it.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Two curves, one point</h3>
    <p>
      So let's build the test. We'll take a straight-line demand curve and a
      constant-elasticity demand curve, and pin them together: both pass
      through the price 25 and quantity 45, and both have elasticity exactly
      5/3 there. At your measured point they are indistinguishable. The
      straight line is 120 − 3p; the constant-elasticity curve is
      45 × (p/25)^(−5/3). Set marginal cost to 10 and the rule reads 1/(5/3) =
      60% off both — so both curves' optimal price should be 25. And it is,
      to the last decimal, for both.
    </p>
  </section>

  <Spine />

  <section class="body-text">
    <h3 class="body-header">Now nudge the cost</h3>
    <p>
      Everything you'd use the elasticity for is a counterfactual: input
      prices move, and you want to know what happens to your price. Drag the
      cost off 10 and the two curves — identical at the pin — come apart
      immediately. The straight line passes through exactly half of any cost
      increase, always, whoever you are. The constant-elasticity curve passes
      through <em>more than all of it</em>: at ε = 5/3 a one-unit cost rise
      lifts the optimal price by 2.5 units, at ε = 2 it lifts by 2, and the
      general rule is ε/(ε−1). Same point, same elasticity, same price today
      — and a cost shock tomorrow that is five times the size.
    </p>
  </section>
  <LernerCheck />

  <section class="body-text">
    <h3 class="body-header">One family, one slider</h3>
    <p>
      There's a single family of demand curves that contains both of ours —
      a power of an affine function — and one exponent, n, sweeps you from
      the straight line (n = 1) through ever-flatter constant-elasticity
      curves (n negative) and past a genuinely strange pocket in between.
      Every member is pinned through the same point with the same elasticity,
      so the lab below can hold your measured data fixed and move only the
      thing the elasticity cannot see: the curvature.
    </p>
    <p class="eq">{@html familyEq}</p>
    <p>
      Drag n. The optimum stays at 25, the markup stays at 60%, and 1/|ε| at
      the optimum stays equal to it to four decimals — the rule never
      budges. What budges is the answer to every question you actually
      hired the elasticity to answer.
    </p>
  </section>

  <CurvatureLab />

  <section class="body-text">
    <h3 class="body-header">The pass-through law</h3>
    <p>
      Differentiate the first-order condition with respect to cost and the
      whole story falls out in one line:
    </p>
    <p class="eq">{@html rhoEq}</p>
    <p>
      Pass-through reads the <em>second</em> derivative — the curvature — and
      the elasticity contains none of it. For the whole family the answer
      collapses to ρ = n/(1 + n): exactly a half on the straight line, ε/(ε−1)
      down the constant-elasticity branch, one in the perfect-competition
      limit, and — in the pocket between n = −1 and n = 0 — <em>negative</em>,
      where a cost rise lowers the optimal price. That perverse case is real
      in the literature, not a curiosity of the algebra; it is one of the
      things curvature has been hiding from the point estimate.
    </p>
  </section>

  <PassThroughFigure />

  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      First, an elasticity is a local estimate, and everything above says
      exactly how far local gets you: the price today, and nothing about any
      response. If a decision depends on pass-through — a tax argument, a
      tariff, an input shock — the curvature has to be estimated or
      assumed, and the assumption is doing the work.
    </p>
    <p>
      Second, the markup rule is an identity at the optimum, so observing it
      hold is no evidence that you are optimising; a firm charging anywhere
      can compute 1/|ε| at its own price and get some number. What the rule
      gives you is a consistency check and a direction, not a destination.
    </p>
    <p>
      And third, the elasticity that belongs in the formula is the elasticity
      of <em>your</em> demand — the residual demand after rivals respond —
      which is usually far more elastic than the market elasticity a report
      hands you. Practitioners lose more money to that substitution than to
      curvature.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">In one sentence</h3>
    <p>
      The markup rule is exactly true and exactly silent: it tells you where
      you are, and curvature — the thing it cannot see — decides where you
      go. Thanks for reading!
    </p>
  </section>

  <section class="body-text" id="resources">
    <h3 class="body-header">Sources and further reading</h3>
    <p>
      CORE Econ, <em>The Economy 2.0: Microeconomics</em> (2023), Unit 7 —
      the firm, the markup, and ε. Theirs: the markup–elasticity relationship
      and its institutional setting. Lerner (1934), <em>RES</em> 1(3):157–175
      — the rule; Bulow and Pfleiderer (1983), <em>JPE</em> 91(1):182–185 —
      the constant-pass-through family and the perverse case; Weyl and
      Fabinger (2013), <em>JPE</em> 121(3):528–583 — pass-through as a
      first-class object. <strong>Verify all three before relying on the
      citations.</strong> Ours: the pinned family as one object, the
      26-versus-30 figure, and every number, computed from
      <span class="mono">src/demand.js</span> and asserted in
      <span class="mono">verify/check-numbers.mjs</span>.
    </p>
  </section>
</main>

<style>
  main {
    display: block;
  }
</style>